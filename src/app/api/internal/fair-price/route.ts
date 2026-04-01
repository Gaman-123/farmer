import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const commodity_name = searchParams.get("commodity_name");
  const district = searchParams.get("district");
  const grade = searchParams.get("grade");

  const conditions: string[] = [];
  const params: any[] = [];
  let pi = 1;

  if (commodity_name) { conditions.push(`commodity_name ILIKE $${pi++}`); params.push(`%${commodity_name}%`); }
  if (district) { conditions.push(`district ILIKE $${pi++}`); params.push(`%${district}%`); }
  if (grade) { conditions.push(`grade = $${pi++}`); params.push(grade); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    // Get MSP for reference
    const mspRes = await pool.query(
      `SELECT msp_price_per_kg FROM msp_rates WHERE crop ILIKE $1 ORDER BY year DESC LIMIT 1`,
      [commodity_name || ""]
    );
    const msp_per_kg = mspRes.rows[0]?.msp_price_per_kg ? Number(mspRes.rows[0].msp_price_per_kg) : 0;

    const multipliers: Record<string, number> = { A: 1.15, B: 1.0, C: 0.85, ungraded: 0.95 };
    const grade_multiplier = multipliers[grade || "ungraded"] ?? 1.0;

    // Mock agmarknet price (stub – real integration would call Agmarknet API)
    const agmarknet_price_per_kg = msp_per_kg * 1.1;

    const fair_price_per_kg = Math.max(msp_per_kg, agmarknet_price_per_kg) * grade_multiplier;

    return NextResponse.json({
      commodity_name, district, grade,
      fair_price_per_kg: Math.round(fair_price_per_kg * 100) / 100,
      msp_per_kg,
      agmarknet_price_per_kg,
      grade_multiplier,
      computed_at: new Date().toISOString()
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
