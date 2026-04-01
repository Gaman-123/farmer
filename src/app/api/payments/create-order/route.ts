import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  const { transaction_id } = await req.json();
  try {
    const txRes = await pool.query(`SELECT total_amount FROM transactions WHERE transaction_id = $1`, [transaction_id]);
    if (!txRes.rows[0]) return errorResponse("TXN_NOT_FOUND", "Transaction not found", 404);

    const total_amount = Number(txRes.rows[0].total_amount);
    const razorpay_order_id = `order_dev_${Date.now()}`;  // Fake in dev mode

    await pool.query(
      `UPDATE transactions SET razorpay_order_id = $1 WHERE transaction_id = $2`,
      [razorpay_order_id, transaction_id]
    );

    return NextResponse.json({
      razorpay_order_id,
      amount_paise: Math.round(total_amount * 100),
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dev"
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
