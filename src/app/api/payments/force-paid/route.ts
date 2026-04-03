import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Force-paid: Creates a transaction and immediately marks it as released.
// DEV/DEMO USE ONLY — bypasses actual payment verification.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transaction_id } = body;

    if (!transaction_id) {
      return NextResponse.json({ ok: false, error: "Missing transaction_id" }, { status: 400 });
    }

    const fakePaymentId = `pay_FORCE_${Date.now()}`;

    await pool.query(
      `UPDATE transactions
       SET payment_status    = 'released',
           razorpay_payment_id = $1,
           escrow_held_at    = NOW(),
           payment_released_at = NOW()
       WHERE transaction_id = $2`,
      [fakePaymentId, transaction_id]
    );

    return NextResponse.json({ ok: true, payment_status: "released", razorpay_payment_id: fakePaymentId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
