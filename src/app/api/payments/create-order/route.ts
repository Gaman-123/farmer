import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  const { transaction_id } = await req.json();
  try {
    const txRes = await pool.query(`SELECT total_amount FROM transactions WHERE transaction_id = $1`, [transaction_id]);
    if (!txRes.rows[0]) return errorResponse("TXN_NOT_FOUND", "Transaction not found", 404);

    const total_amount = Number(txRes.rows[0].total_amount);
    
    // Create Razorpay Order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });
    
    const amount_paise = Math.round(total_amount * 100);
    const order = await razorpay.orders.create({
      amount: amount_paise,
      currency: "INR",
      receipt: `receipt_${transaction_id.substring(0,8)}`,
    });

    const razorpay_order_id = order.id;

    await pool.query(
      `UPDATE transactions SET razorpay_order_id = $1 WHERE transaction_id = $2`,
      [razorpay_order_id, transaction_id]
    );

    return NextResponse.json({
      razorpay_order_id,
      amount_paise,
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dev"
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
