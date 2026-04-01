import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";

const GNN_SECRET = "dev_secret_123";

// GET /api/gnn/transactions-history
export async function GET(req: NextRequest) {
  if (req.headers.get("X-EKrishi-GNN-Key") !== GNN_SECRET)
    return errorResponse("UNAUTHORIZED", "Invalid GNN key", 401);
  const { searchParams } = new URL(req.url);
  const district = searchParams.get("district");
  const commodity_name = searchParams.get("commodity_name");
  const from_date = searchParams.get("from_date");
  const to_date = searchParams.get("to_date");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000);

  const conditions: string[] = [];
  const params: any[] = [];
  let pi = 1;

  if (district) { conditions.push(`district ILIKE $${pi++}`); params.push(`%${district}%`); }
  if (commodity_name) { conditions.push(`commodity_name ILIKE $${pi++}`); params.push(`%${commodity_name}%`); }
  if (from_date) { conditions.push(`created_at >= $${pi++}`); params.push(from_date); }
  if (to_date) { conditions.push(`created_at <= $${pi++}`); params.push(to_date); }

  params.push(limit);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const res = await pool.query(
      `SELECT transaction_id, farmer_id, buyer_id, commodity_name, quantity_kg, price_per_kg,
              fair_price_estimate, price_ratio, district, sale_channel, gnn_anomaly_score, gnn_flagged, created_at
       FROM transactions ${where} ORDER BY created_at DESC LIMIT $${pi}`,
      params
    );
    return NextResponse.json(res.rows);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
