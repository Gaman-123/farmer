import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return errorResponse("UNAUTHORIZED", "Session required", 401);

  const body = await req.json();
  const { listing_id, offered_price_per_kg, quantity_kg = null, pickup_date = null, delivery_terms = null, note = null } = body;

  // Resolve buyer_id
  let buyer_id: string;
  if (session.role === "buyer" && session.linked_id) {
    buyer_id = session.linked_id;
  } else if (session.fromHeader && session.phone) {
    const r = await pool.query(`SELECT linked_buyer_id FROM user_profiles WHERE phone_number = $1`, [session.phone]);
    if (!r.rows[0]?.linked_buyer_id) return errorResponse("UNAUTHORIZED", "Buyer not found", 401);
    buyer_id = r.rows[0].linked_buyer_id;
  } else {
    return errorResponse("UNAUTHORIZED", "Buyer session required", 401);
  }

  const client = await pool.connect();
  try {
    // Check listing is active
    const listingRes = await client.query(
      `SELECT listing_id, status, expires_at, quantity_remaining_kg, fair_price_estimate 
       FROM marketplace_listings WHERE listing_id = $1`, [listing_id]
    );
    const listing = listingRes.rows[0];
    if (!listing) return errorResponse("LISTING_NOT_FOUND", "Listing not found", 404);
    if (listing.status !== "active" || new Date(listing.expires_at) < new Date()) {
      return errorResponse("LISTING_NOT_FOUND", "Listing is not active or has expired", 404);
    }
    if (quantity_kg && Number(quantity_kg) > Number(listing.quantity_remaining_kg)) {
      return errorResponse("INSUFFICIENT_QUANTITY", "Bid quantity exceeds available stock", 400);
    }

    // Check buyer not blacklisted
    const buyerRes = await client.query(`SELECT is_blacklisted FROM buyers WHERE buyer_id = $1`, [buyer_id]);
    if (buyerRes.rows[0]?.is_blacklisted) {
      return errorResponse("BUYER_BLACKLISTED", "Buyer is blacklisted and cannot place bids", 403);
    }

    // Check duplicate bid
    const dupRes = await client.query(
      `SELECT bid_id FROM bids WHERE listing_id = $1 AND buyer_id = $2 AND status = 'pending'`,
      [listing_id, buyer_id]
    );
    if (dupRes.rows.length > 0) {
      return errorResponse("BID_ALREADY_EXISTS", "A pending bid already exists for this listing", 409);
    }

    const fair_price_at_bid = listing.fair_price_estimate ? Number(listing.fair_price_estimate) : null;

    const bidRes = await client.query(
      `INSERT INTO bids (listing_id, buyer_id, offered_price_per_kg, quantity_kg, pickup_date, delivery_terms, note, fair_price_at_bid, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
       RETURNING bid_id, offered_price_per_kg, fair_price_at_bid, price_ratio_at_bid`,
      [listing_id, buyer_id, offered_price_per_kg, quantity_kg, pickup_date, delivery_terms, note, fair_price_at_bid]
    );

    // Insert notification for farmer
    const farmerRes = await client.query(`SELECT farmer_id FROM marketplace_listings WHERE listing_id = $1`, [listing_id]);
    if (farmerRes.rows[0]) {
      await client.query(
        `INSERT INTO notifications (recipient_farmer_id, notif_type, listing_id, bid_id, message_en, message_kn, channel)
         VALUES ($1, 'bid_received', $2, $3, $4, $5, 'sms')`,
        [
          farmerRes.rows[0].farmer_id, listing_id, bidRes.rows[0].bid_id,
          `New bid: ₹${offered_price_per_kg}/kg`,
          `ಹೊಸ ಬಿಡ್: ₹${offered_price_per_kg}/ಕೆಜಿ`
        ]
      );
    }

    const row = bidRes.rows[0];
    return NextResponse.json({
      bid_id: row.bid_id,
      offered_price_per_kg: Number(row.offered_price_per_kg),
      fair_price_at_bid: row.fair_price_at_bid ? Number(row.fair_price_at_bid) : null,
      price_ratio_at_bid: row.price_ratio_at_bid ? Number(row.price_ratio_at_bid) : null,
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listing_id = searchParams.get("listing_id");
  const buyer_id = searchParams.get("buyer_id");

  const conditions: string[] = [];
  const params: any[] = [];
  let pi = 1;

  if (listing_id) { conditions.push(`b.listing_id = $${pi++}`); params.push(listing_id); }
  if (buyer_id) { conditions.push(`b.buyer_id = $${pi++}`); params.push(buyer_id); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  try {
    const res = await pool.query(
      `SELECT b.*, ml.commodity_name, ml.minimum_price_per_kg as listing_price
       FROM bids b
       JOIN marketplace_listings ml ON b.listing_id = ml.listing_id
       ${where} ORDER BY b.created_at DESC`, params
    );
    return NextResponse.json({ data: res.rows, total: res.rows.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
