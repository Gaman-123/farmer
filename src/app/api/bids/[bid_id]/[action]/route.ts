import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/apiAuth";

// Internal helper: create a transaction when a bid is accepted
async function createTransaction(client: any, bid: any, listing: any) {
  // Get GST rate
  const gstRes = await client.query(
    `SELECT gst_rate FROM hsn_gst_rates WHERE hsn_code = $1`, [listing.hsn_code]
  );
  const gst_rate = gstRes.rows[0]?.gst_rate ? Number(gstRes.rows[0].gst_rate) : 0;
  const qty = bid.quantity_kg ? Number(bid.quantity_kg) : Number(listing.quantity_remaining_kg);
  const price = Number(bid.offered_price_per_kg);

  const subtotal = qty * price;
  const cgst = subtotal * (gst_rate / 2) / 100;
  const sgst = subtotal * (gst_rate / 2) / 100;
  const igst = 0;
  const platform_fee = subtotal * 0.01;
  const platform_fee_gst = platform_fee * 0.18;
  const total_amount = subtotal + cgst + sgst + igst + platform_fee + platform_fee_gst;

  const txnRes = await client.query(
    `INSERT INTO transactions (
       listing_id, bid_id, farmer_id, buyer_id,
       commodity_name, hsn_code, quantity_kg, price_per_kg,
       fair_price_estimate, msp_at_transaction,
       subtotal, cgst_amount, sgst_amount, igst_amount,
       platform_fee, platform_fee_gst, total_amount,
       gst_rate, sale_channel, district, payment_method, payment_status
     ) VALUES (
       $1,$2,$3,$4,
       $5,$6,$7,$8,
       $9,$10,
       $11,$12,$13,$14,
       $15,$16,$17,
       $18,'marketplace',$19,'upi','pending'
     ) RETURNING transaction_id`,
    [
      listing.listing_id, bid.bid_id, listing.farmer_id, bid.buyer_id,
      listing.commodity_name, listing.hsn_code, qty, price,
      listing.fair_price_estimate, listing.msp_at_listing,
      subtotal, cgst, sgst, igst,
      platform_fee, platform_fee_gst, total_amount,
      gst_rate, listing.location_district
    ]
  );

  return { transaction_id: txnRes.rows[0].transaction_id, total_amount, gst_breakdown: { subtotal, cgst, sgst, igst, platform_fee, platform_fee_gst } };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bid_id: string; action: string }> }
) {
  const { bid_id, action } = await params;
  const session = getSession(req);
  if (!session) return errorResponse("UNAUTHORIZED", "Session required", 401);

  const body = await req.json().catch(() => ({}));

  const client = await pool.connect();
  try {
    const bidRes = await client.query(
      `SELECT b.*, ml.farmer_id, ml.quantity_remaining_kg, ml.commodity_name, ml.hsn_code,
              ml.fair_price_estimate, ml.msp_at_listing, ml.location_district, ml.listing_id
       FROM bids b JOIN marketplace_listings ml ON b.listing_id = ml.listing_id
       WHERE b.bid_id = $1`, [bid_id]
    );
    const bid = bidRes.rows[0];
    if (!bid) return errorResponse("BID_NOT_FOUND", "Bid not found", 404);

    if (action === "accept") {
      // Mark bid accepted
      await client.query(
        `UPDATE bids SET status = 'accepted', accepted_at = NOW() WHERE bid_id = $1`, [bid_id]
      );
      // Reject other pending bids on same listing
      await client.query(
        `UPDATE bids SET status = 'rejected', rejected_at = NOW() WHERE listing_id = $1 AND bid_id != $2 AND status = 'pending'`,
        [bid.listing_id, bid_id]
      );

      // Create transaction
      const txn = await createTransaction(client, bid, bid);

      // Notify buyer
      await client.query(
        `INSERT INTO notifications (recipient_buyer_id, notif_type, listing_id, bid_id, message_en, message_kn, channel)
         VALUES ($1,'bid_accepted',$2,$3,$4,$5,'sms')`,
        [
          bid.buyer_id, bid.listing_id, bid_id,
          `Your bid accepted! Transaction ID: ${txn.transaction_id}`,
          `ನಿಮ್ಮ ಬಿಡ್ ಸ್ವೀಕರಿಸಲಾಗಿದೆ! ವ್ಯವಹಾರ ID: ${txn.transaction_id}`
        ]
      );

      return NextResponse.json({ bid_id, transaction_id: txn.transaction_id });

    } else if (action === "reject") {
      const { counter_price_per_kg, counter_note } = body;
      if (counter_price_per_kg) {
        await client.query(
          `UPDATE bids SET status = 'countered', counter_price_per_kg = $1, counter_note = $2, counter_at = NOW() WHERE bid_id = $3`,
          [counter_price_per_kg, counter_note || null, bid_id]
        );
      } else {
        await client.query(
          `UPDATE bids SET status = 'rejected', rejected_at = NOW() WHERE bid_id = $1`, [bid_id]
        );
      }

      // Notify buyer
      await client.query(
        `INSERT INTO notifications (recipient_buyer_id, notif_type, listing_id, bid_id, message_en, message_kn, channel)
         VALUES ($1,'bid_rejected',$2,$3,$4,$5,'sms')`,
        [
          bid.buyer_id, bid.listing_id, bid_id,
          counter_price_per_kg ? `Counter offer: ₹${counter_price_per_kg}/kg` : "Your bid was rejected",
          counter_price_per_kg ? `ಪ್ರತಿ ಬೆಲೆ: ₹${counter_price_per_kg}/ಕೆಜಿ` : "ನಿಮ್ಮ ಬಿಡ್ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ"
        ]
      );

      return NextResponse.json({ ok: true, bid_id, status: counter_price_per_kg ? "countered" : "rejected" });
    }

    return errorResponse("INVALID_ACTION", "Action must be accept or reject", 400);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}
