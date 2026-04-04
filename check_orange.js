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

async function checkDB() {
  try {
    const res = await pool.query("SELECT commodity_name, count(*) FROM marketplace_listings WHERE commodity_name LIKE '%Orange%' GROUP BY commodity_name");
    console.log('MARKER_START');
    console.log(JSON.stringify(res.rows, null, 2));
    console.log('MARKER_END');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkDB();
