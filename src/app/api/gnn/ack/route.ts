import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";

const GNN_SECRET = "dev_secret_123";

export async function POST(req: NextRequest) {
  if (req.headers.get("X-EKrishi-GNN-Key") !== GNN_SECRET)
    return errorResponse("UNAUTHORIZED", "Invalid GNN key", 401);
  const { outbox_id } = await req.json();
  try {
    await pool.query(`UPDATE kafka_outbox SET processed_at = NOW() WHERE outbox_id = $1`, [outbox_id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
