import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";

const GNN_SECRET = "dev_secret_123";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ transaction_id: string }> }) {
  if (req.headers.get("X-EKrishi-GNN-Key") !== GNN_SECRET)
    return errorResponse("UNAUTHORIZED", "Invalid GNN key", 401);
  const { transaction_id } = await params;
  const { gnn_anomaly_score, gnn_flagged } = await req.json();

  try {
    await pool.query(
      `UPDATE transactions SET gnn_anomaly_score = $1, gnn_flagged = $2, gnn_processed_at = NOW() WHERE transaction_id = $3`,
      [gnn_anomaly_score, gnn_flagged, transaction_id]
    );
    if (gnn_flagged) {
      const txnRes = await pool.query(`SELECT farmer_id FROM transactions WHERE transaction_id = $1`, [transaction_id]);
      if (txnRes.rows[0]) {
        await pool.query(
          `UPDATE marketplace_listings SET gnn_flagged = true WHERE farmer_id = $1 AND status = 'active'`,
          [txnRes.rows[0].farmer_id]
        );
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
