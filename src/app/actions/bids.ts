"use server";

import pool, { ensureMockUsersExist } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function placeBid(data: {
  listing_id: string;
  buyer_id: string;
  offered_price_per_kg: number;
  quantity_kg: number | null;
  note: string | null;
}) {
  await ensureMockUsersExist();

  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO bids (
        listing_id,
        buyer_id,
        offered_price_per_kg,
        quantity_kg,
        note,
        status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
    `, [
      data.listing_id,
      data.buyer_id,
      data.offered_price_per_kg,
      data.quantity_kg,
      data.note
    ]);

    revalidatePath("/marketplace");
    return { success: true };
  } catch (err: any) {
    console.error("Database Error placeBid:", err);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}
