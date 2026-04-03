import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, transaction_id } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ ok: false, error: "INVALID_SIGNATURE" }, { status: 400 });
    }

    // Update transaction status
    await pool.query(
      `UPDATE transactions 
       SET payment_status = 'in_escrow', 
           razorpay_payment_id = $1,
           escrow_held_at = NOW()
       WHERE transaction_id = $2`,
      [razorpay_payment_id, transaction_id]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
