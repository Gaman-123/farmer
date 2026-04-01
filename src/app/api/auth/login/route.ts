import pool from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function makeSession(supabase_user_id: string, role: string, linked_id: string) {
  return Buffer.from(JSON.stringify({ supabase_user_id, role, linked_id })).toString("base64");
}

export async function POST(req: NextRequest) {
  const { phone_number, role = "farmer" } = await req.json();

  if (!phone_number || !/^\+91\d{10}$/.test(phone_number)) {
    return NextResponse.json({ ok: false, error: "INVALID_PHONE", message: "Phone must be in E.164 format: +91XXXXXXXXXX", status: 400 }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // 1. Check if user_profiles exists
    const profileRes = await client.query(
      `SELECT up.supabase_user_id, up.role, up.linked_farmer_id, up.linked_buyer_id, 
              COALESCE(f.full_name, b.business_name) as name
       FROM user_profiles up
       LEFT JOIN farmers f ON f.farmer_id = up.linked_farmer_id
       LEFT JOIN buyers  b ON b.buyer_id  = up.linked_buyer_id
       WHERE up.phone_number = $1`, [phone_number]
    );

    let linked_id: string;
    let finalRole: string;
    let name: string;
    let supabase_user_id: string;

    if (profileRes.rows.length > 0) {
      const p = profileRes.rows[0];
      finalRole = p.role;
      supabase_user_id = p.supabase_user_id;
      linked_id = finalRole === "farmer" ? p.linked_farmer_id : p.linked_buyer_id;
      name = p.name;
    } else {
      // Auto-create
      supabase_user_id = (await client.query(`SELECT uuid_generate_v4() AS id`)).rows[0].id;
      finalRole = role;

      if (finalRole === "farmer") {
        const fRes = await client.query(
          `INSERT INTO farmers (phone_number, full_name, district, preferred_language)
           VALUES ($1, $2, 'Karnataka', 'kn') RETURNING farmer_id, full_name`,
          [phone_number, `Farmer ${phone_number.slice(-4)}`]
        );
        linked_id = fRes.rows[0].farmer_id;
        name = fRes.rows[0].full_name;
        await client.query(
          `INSERT INTO user_profiles (supabase_user_id, phone_number, role, linked_farmer_id)
           VALUES ($1, $2, 'farmer', $3)`,
          [supabase_user_id, phone_number, linked_id]
        );
      } else {
        const bRes = await client.query(
          `INSERT INTO buyers (phone_number, business_name, buyer_type)
           VALUES ($1, $2, 'retailer') RETURNING buyer_id, business_name`,
          [phone_number, `Buyer ${phone_number.slice(-4)}`]
        );
        linked_id = bRes.rows[0].buyer_id;
        name = bRes.rows[0].business_name;
        await client.query(
          `INSERT INTO user_profiles (supabase_user_id, phone_number, role, linked_buyer_id)
           VALUES ($1, $2, 'buyer', $3)`,
          [supabase_user_id, phone_number, linked_id]
        );
      }
    }

    const cookieStore = await cookies();
    cookieStore.set("ekrishi_session", makeSession(supabase_user_id, finalRole, linked_id), {
      httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json({ ok: true, role: finalRole, linked_id, name });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message, status: 500 }, { status: 500 });
  } finally {
    client.release();
  }
}
