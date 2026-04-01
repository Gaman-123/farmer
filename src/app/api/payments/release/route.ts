import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  const { transaction_id } = await req.json();
  // No auth context typically needed here strictly if called securely by internal server or via farmer confirmation
  // We will assume farmer securely confirmed delivery.
  
  const client = await pool.connect();
  try {
    const txRes = await client.query(
      `UPDATE transactions SET payment_status = 'released', payment_released_at = NOW() 
       WHERE transaction_id = $1 RETURNING farmer_id, buyer_id, total_amount`,
      [transaction_id]
    );

    if (!txRes.rows[0]) return errorResponse("TXN_NOT_FOUND", "Transaction not found", 404);
    
    const txn = txRes.rows[0];

    // Notification for Farmer (Money Received)
    await client.query(
      `INSERT INTO notifications (recipient_farmer_id, notif_type, message_en, message_kn, channel)
       VALUES ($1, 'payment_released', $2, $3, 'sms')`,
      [txn.farmer_id, `Rs.${txn.total_amount} sent to your UPI/bank.`, `ರೂ.${txn.total_amount} ನಿಮ್ಮ ಬ್ಯಾಂಕ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.`]
    );

    // Notification for Buyer (Money Released)
    if (txn.buyer_id) {
       await client.query(
        `INSERT INTO notifications (recipient_buyer_id, notif_type, message_en, message_kn, channel)
         VALUES ($1, 'payment_released', $2, $3, 'sms')`,
        [txn.buyer_id, `Payment released to farmer for transaction ${transaction_id}.`, `ವಹಿವಾಟಿಗೆ ರೈತನಿಗೆ পಾವತಿ ಕಳುಹಿಸಲಾಗಿದೆ.`]
      );
    }
    
    return NextResponse.json({ ok: true, transaction_id, payment_status: 'released' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}
