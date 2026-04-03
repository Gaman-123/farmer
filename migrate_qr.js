const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config({ path: '.env.local' });

const originalLookup = dns.lookup;
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);

// @ts-ignore
dns.lookup = function(hostname, options, callback) {
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
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  try {
    console.log('Running migration...');
    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS upi_txid TEXT`);
    console.log('Migration SUCCESS');
  } catch (err) {
    console.error('Migration FAILED:', err.message);
  } finally {
    await pool.end();
  }
}
migrate();
