"use server";

import pool, { ensureMockUsersExist } from "@/lib/db";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { Listing } from "@/components/listings/ListingCard";

export async function fetchListings(): Promise<Listing[]> {
  noStore();
  try {
    const res = await pool.query(`
      SELECT 
        l.listing_id,
        l.commodity_name,
        l.commodity_name_kn,
        l.quantity_remaining_kg,
        l.minimum_price_per_kg,
        l.grade,
        l.delivery_terms,
        l.status,
        l.expires_at,
        l.location_district as farmer_district,
        f.village as farmer_village,
        l.fair_price_estimate,
        l.msp_at_listing,
        l.listing_images
      FROM marketplace_listings l
      LEFT JOIN farmers f ON l.farmer_id = f.farmer_id
      WHERE l.status = 'active'
      ORDER BY l.created_at DESC
      LIMIT 100
    `);
    
    // We parse Date objects to strings for Client Components
    return res.rows.map(r => ({
      ...r,
      expires_at: new Date(r.expires_at).toISOString(),
      minimum_price_per_kg: Number(r.minimum_price_per_kg),
      quantity_remaining_kg: Number(r.quantity_remaining_kg),
      fair_price_estimate: r.fair_price_estimate ? Number(r.fair_price_estimate) : null,
      msp_at_listing: r.msp_at_listing ? Number(r.msp_at_listing) : null,
      listing_images: r.listing_images || []
    }));
  } catch (error) {
    console.error("Failed to fetch custom listings from DB:", error);
    return [];
  }
}

export async function createListing(data: any) {
  await ensureMockUsersExist();
  
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO marketplace_listings (
        farmer_id, 
        commodity_name, 
        commodity_name_kn, 
        quantity_kg, 
        quantity_remaining_kg, 
        minimum_price_per_kg, 
        grade, 
        delivery_terms, 
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
    `, [
      data.farmer_id,
      data.commodity_name,
      data.commodity_name_kn,
      data.quantity_kg,
      data.quantity_kg, // initial remaining is total
      data.minimum_price_per_kg,
      data.grade,
      data.delivery_terms
    ]);
    
    revalidatePath("/marketplace");
    return { success: true };
  } catch (err: any) {
    console.error("Database Error createListing:", err);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}
