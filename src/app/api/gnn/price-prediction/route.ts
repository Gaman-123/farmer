import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";

const GNN_SECRET = "dev_secret_123";

export async function POST(req: NextRequest) {
  if (req.headers.get("X-EKrishi-GNN-Key") !== GNN_SECRET)
    return errorResponse("UNAUTHORIZED", "Invalid GNN key", 401);
  const { commodity_name, district, predictions } = await req.json();

  try {
    for (const p of predictions) {
      await pool.query(
        `INSERT INTO gnn_price_predictions (commodity_name, district, predicted_date, predicted_price_per_kg, confidence_score)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (commodity_name, district, predicted_date) DO UPDATE
         SET predicted_price_per_kg = $4, confidence_score = $5, created_at = NOW()`,
        [commodity_name, district, p.date, p.predicted_price_per_kg, p.confidence]
      ).catch(() => null); // Silently skip if table not available
    }
    return NextResponse.json({ ok: true, count: predictions.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
