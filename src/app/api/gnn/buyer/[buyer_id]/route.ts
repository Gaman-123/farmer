import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";

const GNN_SECRET = "dev_secret_123";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ buyer_id: string }> }) {
  if (req.headers.get("X-EKrishi-GNN-Key") !== GNN_SECRET)
    return errorResponse("UNAUTHORIZED", "Invalid GNN key", 401);
  const { buyer_id } = await params;
  const { gnn_anomaly_score } = await req.json();

  try {
    await pool.query(
      `UPDATE buyers SET gnn_anomaly_score = $1, gnn_score_updated_at = NOW() WHERE buyer_id = $2`,
      [gnn_anomaly_score, buyer_id]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ buyer_id: string }> }) {
  if (req.headers.get("X-EKrishi-GNN-Key") !== GNN_SECRET)
    return errorResponse("UNAUTHORIZED", "Invalid GNN key", 401);
  const { buyer_id } = await params;
  try {
    const res = await pool.query(
      `SELECT transaction_id, commodity_name, quantity_kg, price_per_kg, fair_price_estimate,
              price_ratio, district, created_at
       FROM transactions WHERE buyer_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [buyer_id]
    );
    return NextResponse.json(res.rows);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
