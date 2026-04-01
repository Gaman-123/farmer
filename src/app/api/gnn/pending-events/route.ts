import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";

const GNN_SECRET = "dev_secret_123";

function checkGnnAuth(req: NextRequest) {
  return req.headers.get("X-EKrishi-GNN-Key") === GNN_SECRET;
}

// GET /api/gnn/pending-events — poll kafka_outbox for unprocessed transaction events
export async function GET(req: NextRequest) {
  if (!checkGnnAuth(req)) return errorResponse("UNAUTHORIZED", "Invalid GNN key", 401);
  try {
    const res = await pool.query(
      `SELECT outbox_id, topic, payload, created_at FROM kafka_outbox
       WHERE topic = 'transactions.new' AND processed_at IS NULL
       ORDER BY created_at ASC LIMIT 50`
    );
    return NextResponse.json(res.rows);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
