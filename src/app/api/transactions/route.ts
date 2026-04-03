import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  const body = await req.json();
  let {
    listing_id, bid_id, farmer_id, buyer_id, buyer_name_offline, buyer_type_offline,
    commodity_name, hsn_code, quantity_kg, price_per_kg,
    fair_price_estimate, msp_at_transaction,
    sale_channel = "marketplace", district, is_inter_state = false,
    payment_method = "upi", upi_txid = null
  } = body;

  if (!buyer_id && sale_channel === "marketplace") {
    if (session?.role === "buyer") {
      buyer_id = session.linked_id;
    } else if (session?.role === "farmer") {
      buyer_name_offline = `Farmer User`;
      buyer_type_offline = "farmer";
    } else {
      buyer_name_offline = "Guest Buyer";
      buyer_type_offline = "guest";
    }
  }

  if (sale_channel === "marketplace" && !buyer_id && !buyer_name_offline) {
    return errorResponse("UNAUTHORIZED", "Buyer session required for marketplace transactions", 401);
  }

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
         cgst, sgst, igst,
         platform_fee, platform_fee_gst, total_amount,
         gst_rate, sale_channel, district, is_inter_state, payment_method, upi_txid, payment_status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,
         $7,$8,$9,$10,
         $11,$12,
         $13,$14,$15,
         $16,$17,$18,
         $19,$20,$21,$22,$23,$24,'pending'
       ) RETURNING transaction_id`,
      [
        listing_id || null, bid_id || null, farmer_id, buyer_id || null,
        buyer_name_offline || null, buyer_type_offline || null,
        commodity_name, hsn_code || null, quantity_kg, price_per_kg,
        fair_price_estimate || null, msp_at_transaction || null,
        cgst, sgst, igst,
        platform_fee, platform_fee_gst, total_amount,
        gst_rate, sale_channel, district, is_inter_state, payment_method, upi_txid
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
      `INSERT INTO gst_invoices (
         transaction_id, invoice_number, financial_year,
         seller_name, buyer_name, commodity_name,
         quantity_kg, rate_per_kg, taxable_value,
         cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount,
         platform_fee, platform_fee_gst_rate, platform_fee_gst,
         total_invoice_amount, is_inter_state
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [
        transaction_id, invoice_number, year,
        'E-Krishi Farmer', 'E-Krishi Buyer', commodity_name,
        quantity_kg, price_per_kg, subtotal,
        is_inter_state ? 0 : gst_rate / 2, cgst,
        is_inter_state ? 0 : gst_rate / 2, sgst,
        is_inter_state ? gst_rate : 0, igst,
        platform_fee, 18, platform_fee_gst,
        total_amount, is_inter_state
      ]
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
    // Get farmer phone for notification
    const farmerRow = await client.query(`SELECT phone_number FROM farmers WHERE farmer_id = $1`, [farmer_id]);
    const farmerPhone = farmerRow.rows[0]?.phone_number || '';
    await client.query(
      `INSERT INTO notifications (farmer_id, recipient_phone, notif_type, listing_id, message_en, message_kn, channel)
       VALUES ($1,$2,'payment_escrowed',$3,$4,$5,'sms')`,
      [farmer_id, farmerPhone, listing_id || null,
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

  if (farmer_id) { conditions.push(`t.farmer_id = $${pi++}`); params.push(farmer_id); }
  if (buyer_id) { conditions.push(`t.buyer_id = $${pi++}`); params.push(buyer_id); }
  if (district) { conditions.push(`t.district ILIKE $${pi++}`); params.push(`%${district}%`); }
  if (commodity_name) { conditions.push(`t.commodity_name ILIKE $${pi++}`); params.push(`%${commodity_name}%`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  try {
    const res = await pool.query(`
      SELECT t.*, 
             f.full_name as farmer_name, 
             COALESCE(b.business_name, t.buyer_name_offline) as buyer_name
      FROM transactions t
      LEFT JOIN farmers f ON t.farmer_id = f.farmer_id
      LEFT JOIN buyers b ON t.buyer_id = b.buyer_id
      ${where} 
      ORDER BY t.created_at DESC LIMIT 50
    `, params);
    return NextResponse.json({ data: res.rows, total: res.rows.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
