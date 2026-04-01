import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper to ensure our mock interactive users actually exist in the DB
// so that our foreign key constraints (farmer_id, buyer_id) don't crash.
export async function ensureMockUsersExist() {
  const client = await pool.connect();
  try {
    // 1. Ensure Dummy Farmer
    await client.query(`
      INSERT INTO farmers (farmer_id, phone_number, full_name, district, preferred_language)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (phone_number) DO NOTHING;
    `, [
      '11111111-1111-1111-1111-111111111111', 
      '+910000000001', 
      'Mock Farmer', 
      'Bengaluru Urban', 
      'en'
    ]);

    // 2. Ensure Dummy Buyer
    await client.query(`
      INSERT INTO buyers (buyer_id, phone_number, business_name, buyer_type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (phone_number) DO NOTHING;
    `, [
      '22222222-2222-2222-2222-222222222222', 
      '+910000000002', 
      'Mock Buyer Inc', 
      'retailer'
    ]);
  } catch(e) {
    console.warn("Failed to ensure mock users exist:", e);
  } finally {
    client.release();
  }
}

export default pool;
