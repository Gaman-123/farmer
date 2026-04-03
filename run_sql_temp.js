const { Client } = require('pg');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
const env = {};
for (const line of envLines) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
}

const connectionString = env['DATABASE_URL'];
if (!connectionString) {
  console.error('ERROR: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sqlFile = path.join(__dirname, '..', 'ekrishi_module4_marketplace (1).sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

const logPath = 'C:/tmp/sql_result.txt';
function log(msg) {
  fs.appendFileSync(logPath, msg + '\n', 'utf8');
  console.log(msg);
}
fs.writeFileSync(logPath, '', 'utf8');

// Pre-resolve hostname using Google DNS, then connect by IP
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);

const NEON_HOST = 'ep-fancy-meadow-am8cckgk-pooler.c-5.us-east-1.aws.neon.tech';

resolver.resolve4(NEON_HOST, async (err, addresses) => {
  if (err) {
    log('DNS resolution ERROR: ' + err.message);
    process.exit(1);
  }
  const ip = addresses[0];
  log(`Resolved ${NEON_HOST} -> ${ip}`);

  // Replace hostname with IP in connection string, keep SNI for SSL via servername
  const client = new Client({
    host: ip,
    port: 5432,
    database: 'neondb',
    user: 'neondb_owner',
    password: 'npg_H2GYBSvMs0AJ',
    ssl: {
      rejectUnauthorized: false,
      servername: NEON_HOST,  // SNI so Neon knows which project
    },
  });

  try {
    log('Connecting to Neon at ' + ip + '...');
    await client.connect();
    log('Connected! Running SQL file...');
    await client.query(sql);
    log('SUCCESS: SQL file executed successfully!');
  } catch (err2) {
    log('ERROR: ' + err2.message);
    if (err2.detail) log('DETAIL: ' + err2.detail);
    if (err2.hint) log('HINT: ' + err2.hint);
    if (err2.position) log('POSITION: ' + err2.position);
    if (err2.where) log('WHERE: ' + err2.where);
    if (err2.code) log('CODE: ' + err2.code);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
});
