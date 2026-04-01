import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";

const GNN_SECRET = "dev_secret_123";

export async function GET(req: NextRequest) {
  if (req.headers.get("X-EKrishi-GNN-Key") !== GNN_SECRET)
    return errorResponse("UNAUTHORIZED", "Invalid GNN key", 401);
  try {
    const res = await pool.query(
      `SELECT listing_id, farmer_id, commodity_name, location_district, grade, gnn_flagged, created_at
       FROM marketplace_listings WHERE gnn_flagged = true ORDER BY created_at DESC`
    );
    return NextResponse.json(res.rows);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
