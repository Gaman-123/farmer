import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ listing_id: string }> }) {
  const { listing_id } = await params;
  try {
    const res = await pool.query(
      `SELECT l.*, 
              f.full_name as farmer_name, f.phone_number as farmer_phone, 
              f.village as farmer_village, f.upi_id as farmer_upi,
              m.mandi_name as nearest_mandi_name
       FROM marketplace_listings l
       LEFT JOIN farmers f ON l.farmer_id = f.farmer_id
       LEFT JOIN mandis m ON l.nearest_mandi_id = m.mandi_id
       WHERE l.listing_id = $1`, [listing_id]
    );
    if (!res.rows[0]) return errorResponse("LISTING_NOT_FOUND", "No listing found", 404);
    return NextResponse.json(res.rows[0]);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
