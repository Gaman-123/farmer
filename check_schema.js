const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  const r = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications'"
  );
  console.log('NOTIFICATIONS COLUMNS:', r.rows.map(x => x.column_name).join(', '));
  client.release();
  pool.end();
}
run().catch(console.error);
