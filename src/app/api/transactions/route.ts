import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    listing_id, bid_id, farmer_id, buyer_id, buyer_name_offline, buyer_type_offline,
    commodity_name, hsn_code, quantity_kg, price_per_kg,
    fair_price_estimate, msp_at_transaction,
    sale_channel = "marketplace", district, is_inter_state = false,
    payment_method = "upi"
  } = body;

  const client = await pool.connect();
  try {
    // Get GST rate
    const gstRes = await client.query(`SELECT gst_rate FROM hsn_gst_rates WHERE hsn_code = $1`, [hsn_code]);
    const gst_rate = gstRes.rows[0]?.gst_rate ? Number(gstRes.rows[0].gst_rate) : 0;

    const subtotal = Number(quantity_kg) * Number(price_per_kg);
    let cgst = 0, sgst = 0, igst = 0;
    if (is_inter_state) {
      igst = subtotal * gst_rate / 100;
    } else {
      cgst = subtotal * (gst_rate / 2) / 100;
      sgst = subtotal * (gst_rate / 2) / 100;
    }
    const platform_fee = subtotal * 0.01;
    const platform_fee_gst = platform_fee * 0.18;
    const total_amount = subtotal + cgst + sgst + igst + platform_fee + platform_fee_gst;

    const txnRes = await client.query(
      `INSERT INTO transactions (
         listing_id, bid_id, farmer_id, buyer_id, buyer_name_offline, buyer_type_offline,
         commodity_name, hsn_code, quantity_kg, price_per_kg,
         fair_price_estimate, msp_at_transaction,
         subtotal, cgst_amount, sgst_amount, igst_amount,
         platform_fee, platform_fee_gst, total_amount,
         gst_rate, sale_channel, district, is_inter_state, payment_method, payment_status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,
         $7,$8,$9,$10,
         $11,$12,
         $13,$14,$15,$16,
         $17,$18,$19,
         $20,$21,$22,$23,$24,'pending'
       ) RETURNING transaction_id`,
      [
        listing_id || null, bid_id || null, farmer_id, buyer_id || null,
        buyer_name_offline || null, buyer_type_offline || null,
        commodity_name, hsn_code || null, quantity_kg, price_per_kg,
        fair_price_estimate || null, msp_at_transaction || null,
        subtotal, cgst, sgst, igst,
        platform_fee, platform_fee_gst, total_amount,
        gst_rate, sale_channel, district, is_inter_state, payment_method
      ]
    );

    const transaction_id = txnRes.rows[0].transaction_id;

    // Generate invoice number  
    const year = "2025-26";
    const seqRes = await client.query(`SELECT nextval('invoice_seq_2025_26') AS seq`).catch(() => null);
    const seq = seqRes?.rows[0]?.seq?.toString().padStart(5, "0") || Math.floor(10000 + Math.random() * 90000).toString();
    const invoice_number = `EKRN/${year}/${seq}`;

    // Insert GST invoice
    await client.query(
      `INSERT INTO gst_invoices (transaction_id, invoice_number, financial_year, subtotal, cgst_amount, sgst_amount, igst_amount, gst_rate, total_amount, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')`,
      [transaction_id, invoice_number, year, subtotal, cgst, sgst, igst, gst_rate, total_amount]
    ).catch(() => null);

    // Update listing quantity
    if (listing_id) {
      await client.query(
        `UPDATE marketplace_listings 
         SET quantity_remaining_kg = GREATEST(0, quantity_remaining_kg - $1),
             status = CASE WHEN quantity_remaining_kg - $1 <= 0 THEN 'sold' ELSE status END,
             sold_at = CASE WHEN quantity_remaining_kg - $1 <= 0 THEN NOW() ELSE sold_at END
         WHERE listing_id = $2`,
        [quantity_kg, listing_id]
      );
    }

    // Update stats
    await client.query(`UPDATE farmers SET total_transactions = total_transactions + 1 WHERE farmer_id = $1`, [farmer_id]);
    if (buyer_id) {
      await client.query(`UPDATE buyers SET total_transactions = total_transactions + 1 WHERE buyer_id = $1`, [buyer_id]);
    }

    // Notifications
    await client.query(
      `INSERT INTO notifications (recipient_farmer_id, notif_type, listing_id, message_en, message_kn, channel)
       VALUES ($1,'payment_escrowed',$2,$3,$4,'sms')`,
      [farmer_id, listing_id || null,
       `Payment of ₹${total_amount.toFixed(2)} in escrow for ${commodity_name}`,
       `₹${total_amount.toFixed(2)} ಎಸ್ಕ್ರೋದಲ್ಲಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ`]
    );

    return NextResponse.json({
      transaction_id, invoice_number, total_amount,
      gst_breakdown: { subtotal, cgst, sgst, igst, platform_fee, platform_fee_gst },
      payment_status: "pending"
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const farmer_id = searchParams.get("farmer_id");
  const buyer_id = searchParams.get("buyer_id");
  const district = searchParams.get("district");
  const commodity_name = searchParams.get("commodity_name");

  const conditions: string[] = [];
  const params: any[] = [];
  let pi = 1;

  if (farmer_id) { conditions.push(`farmer_id = $${pi++}`); params.push(farmer_id); }
  if (buyer_id) { conditions.push(`buyer_id = $${pi++}`); params.push(buyer_id); }
  if (district) { conditions.push(`district ILIKE $${pi++}`); params.push(`%${district}%`); }
  if (commodity_name) { conditions.push(`commodity_name ILIKE $${pi++}`); params.push(`%${commodity_name}%`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  try {
    const res = await pool.query(`SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT 50`, params);
    return NextResponse.json({ data: res.rows, total: res.rows.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
