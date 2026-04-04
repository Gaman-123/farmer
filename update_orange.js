const { Pool } = require('pg');
const dns = require('dns');

// DNS Patch
const originalLookup = dns.lookup;
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);

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
        return originalLookup(hostname, options, callback);
      }
      if (options && options.all) {
        callback(null, [{ address: addresses[0], family: 4 }]);
      } else {
        callback(null, addresses[0], 4);
      }
    });
  } else {
    return originalLookup(hostname, options, callback);
  }
};

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_H2GYBSvMs0AJ@ep-fancy-meadow-am8cckgk-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function updateDB() {
  try {
    const res = await pool.query(
      "UPDATE marketplace_listings SET listing_images = ARRAY[$1] WHERE commodity_name LIKE '%Orange%' AND (listing_images IS NULL OR array_length(listing_images, 1) = 0)",
      ['https://images.unsplash.com/photo-1547514701-42782101795e?q=80&w=1000&auto=format&fit=crop']
    );
    console.log(`Updated ${res.rowCount} listings for Orange`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

updateDB();
