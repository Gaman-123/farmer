import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    
    // Webhook verification (mock implementation for Dev mode to accept any payload gracefully if secret is 'dev')
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "dev";
    
    if (secret !== "dev") {
      const expectedSignature = crypto.createHmac("sha256", secret).update(bodyText).digest("hex");
      if (expectedSignature !== signature) {
        return NextResponse.json({ ok: false, error: "INVALID_SIGNATURE" }, { status: 400 });
      }
    }

    const payload = JSON.parse(bodyText);
    
    // Log the event
    await pool.query(
      `INSERT INTO payment_events (event_type, payload) VALUES ($1, $2)`,
      [payload.event || 'unknown', payload]
    ).catch(() => null);

    if (payload.event === "payment.captured") {
      const order_id = payload.payload.payment.entity.order_id;
      if (order_id) {
        const txRes = await pool.query(
          `UPDATE transactions SET payment_status = 'in_escrow', escrow_held_at = NOW() 
           WHERE razorpay_order_id = $1 RETURNING transaction_id, farmer_id`,
          [order_id]
        );
        
        if (txRes.rows[0]) {
          await pool.query(
            `INSERT INTO notifications (recipient_farmer_id, notif_type, message_en, message_kn, channel)
             VALUES ($1, 'payment_escrowed', 'Payment received in escrow', 'ಪಾವತಿ ಎಸ್ಕ್ರೋದಲ್ಲಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ', 'sms')`,
            [txRes.rows[0].farmer_id]
          );
        }
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
