import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  const body = await req.json();

  // Resolve farmer_id
  let farmer_id: string;
  if (session?.role === "farmer" && session?.linked_id) {
    farmer_id = session.linked_id;
  } else if (session?.fromHeader && session?.phone) {
    const r = await pool.query(`SELECT linked_farmer_id FROM user_profiles WHERE phone_number = $1`, [session.phone]);
    if (!r.rows[0]) return errorResponse("UNAUTHORIZED", "Farmer not found", 401);
    farmer_id = r.rows[0].linked_farmer_id;
  } else {
    return errorResponse("UNAUTHORIZED", "Farmer session required", 401);
  }

  // Get fair price (internal call)
  let fair_price_estimate: number | null = null;
  try {
    const fpRes = await pool.query(
      `SELECT msp_price_per_kg FROM msp_rates WHERE crop ILIKE $1 ORDER BY year DESC LIMIT 1`,
      [body.commodity_name]
    );
    const msp = fpRes.rows[0]?.msp_price_per_kg ? Number(fpRes.rows[0].msp_price_per_kg) : null;
    const multipliers: Record<string, number> = { A: 1.15, B: 1.0, C: 0.85, ungraded: 0.95 };
    fair_price_estimate = msp ? msp * (multipliers[body.grade] ?? 1.0) : null;
  } catch {}

  // Get MSP
  let msp_at_listing: number | null = null;
  try {
    const mspRes = await pool.query(
      `SELECT msp_price_per_kg FROM msp_rates WHERE crop ILIKE $1 ORDER BY year DESC LIMIT 1`,
      [body.commodity_name]
    );
    msp_at_listing = mspRes.rows[0]?.msp_price_per_kg ? Number(mspRes.rows[0].msp_price_per_kg) : null;
  } catch {}

  // Generate sms_listing_ref (district code + 4 random digits)
  const districtCode = (body.location_district || "KA").slice(0, 2).toUpperCase();
  const sms_listing_ref = `${districtCode}${Math.floor(1000 + Math.random() * 9000)}`;

  // Get GST rate
  let gst_rate = 0;
  if (body.hsn_code) {
    const gstRes = await pool.query(`SELECT gst_rate FROM hsn_gst_rates WHERE hsn_code = $1`, [body.hsn_code]);
    gst_rate = gstRes.rows[0]?.gst_rate ? Number(gstRes.rows[0].gst_rate) : 0;
  }

  const client = await pool.connect();
  try {
    // Update farmer's UPI ID if provided
    if (body.upi_id) {
      await client.query(`UPDATE farmers SET upi_id = $1 WHERE farmer_id = $2`, [body.upi_id, farmer_id]);
    }

    const res = await client.query(
      `INSERT INTO marketplace_listings (
        farmer_id, commodity_name, commodity_name_kn, hsn_code,
        quantity_kg, quantity_remaining_kg, minimum_price_per_kg,
        fair_price_estimate, msp_at_listing,
        grade, grade_source, delivery_terms,
        available_from_date, location_district, location_taluk,
        listing_images, source_channel, gst_rate,
        sms_listing_ref, status, expires_at
      ) VALUES (
        $1,$2,$3,$4,
        $5,$5,$6,
        $7,$8,
        $9,$10,$11,
        $12,$13,$14,
        $15,$16,$17,
        $18,'active', NOW() + INTERVAL '7 days'
      ) RETURNING listing_id, sms_listing_ref, fair_price_estimate, msp_at_listing`,
      [
        farmer_id, body.commodity_name, body.commodity_name_kn || null, body.hsn_code || null,
        body.quantity_kg, body.minimum_price_per_kg,
        fair_price_estimate, msp_at_listing,
        body.grade || "ungraded", body.grade_source || "manual", body.delivery_terms || "farm_pickup",
        body.available_from_date || new Date().toISOString().slice(0, 10),
        body.location_district || null, body.location_taluk || null,
        body.listing_images || [], body.source_channel || "web", gst_rate,
        sms_listing_ref
      ]
    );

    const row = res.rows[0];
    return NextResponse.json({
      listing_id: row.listing_id,
      sms_listing_ref: row.sms_listing_ref,
      fair_price_estimate: row.fair_price_estimate ? Number(row.fair_price_estimate) : null,
      msp_at_listing: row.msp_at_listing ? Number(row.msp_at_listing) : null,
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const district = searchParams.get("district");
  const commodity_name = searchParams.get("commodity_name");
  const grade = searchParams.get("grade");
  const min_price = searchParams.get("min_price");
  const max_price = searchParams.get("max_price");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = ["status = 'active'", "expires_at > NOW()"];
  const params: any[] = [];
  let pi = 1;

  if (district) { conditions.push(`location_district ILIKE $${pi++}`); params.push(`%${district}%`); }
  if (commodity_name) { conditions.push(`commodity_name ILIKE $${pi++}`); params.push(`%${commodity_name}%`); }
  if (grade) { conditions.push(`grade = $${pi++}`); params.push(grade); }
  if (min_price) { conditions.push(`minimum_price_per_kg >= $${pi++}`); params.push(Number(min_price)); }
  if (max_price) { conditions.push(`minimum_price_per_kg <= $${pi++}`); params.push(Number(max_price)); }

  const where = conditions.join(" AND ");
  params.push(limit, offset);

  try {
    const res = await pool.query(
      `SELECT l.*, f.full_name as farmer_name, f.village as farmer_village, COALESCE(l.location_district, f.district) as farmer_district, f.upi_id as farmer_upi
       FROM marketplace_listings l
       LEFT JOIN farmers f ON l.farmer_id = f.farmer_id
       WHERE ${where}
       ORDER BY l.created_at DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      params
    );
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM marketplace_listings WHERE ${where}`,
      params.slice(0, -2)
    );
    return NextResponse.json({
      data: res.rows,
      total: parseInt(countRes.rows[0].count),
      page, limit
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
