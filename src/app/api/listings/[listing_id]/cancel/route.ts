import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ listing_id: string }> }) {
  const { listing_id } = await params;
  const session = getSession(req);
  if (!session) return errorResponse("UNAUTHORIZED", "Session required", 401);

  const body = await req.json().catch(() => ({}));

  try {
    const listingRes = await pool.query(`SELECT farmer_id FROM marketplace_listings WHERE listing_id = $1`, [listing_id]);
    if (!listingRes.rows[0]) return errorResponse("LISTING_NOT_FOUND", "Listing not found", 404);

    await pool.query(
      `UPDATE marketplace_listings SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $1 WHERE listing_id = $2`,
      [body.cancellation_reason || null, listing_id]
    );
    return NextResponse.json({ ok: true, listing_id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
