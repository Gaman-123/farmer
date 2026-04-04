import { Pool } from 'pg';
import dns from 'dns';

// DNS Patch: The local DNS configuration fails to resolve the Neon hostname.
// We globally monkey-patch dns.lookup for neon.tech domains to use Google DNS.
// We only do this if NOT on Vercel, as Vercel's DNS handles Neon correctly and monkey-patching can crash serverless functions.
if (!process.env.VERCEL) {
  const originalLookup = dns.lookup;
  const resolver = new dns.Resolver();
  resolver.setServers(['8.8.8.8', '8.8.4.4']);

  // @ts-ignore
  dns.lookup = function(hostname: string, options: any, callback: any) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else if (typeof options === 'number') {
      options = { family: options };
    }
    
    if (hostname && hostname.includes('neon.tech')) {
      resolver.resolve4(hostname, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          // @ts-ignore
          return originalLookup(hostname, options, callback);
        }
        if (options && options.all) {
          callback(null, [{ address: addresses[0], family: 4 }]);
        } else {
          callback(null, addresses[0], 4);
        }
      });
    } else {
      // @ts-ignore
      return originalLookup(hostname, options, callback);
    }
  } as typeof dns.lookup;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper to ensure our mock interactive users actually exist in the DB
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
