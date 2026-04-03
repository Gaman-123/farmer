const { Client } = require('pg');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
const env = {};
for (const line of envLines) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
}

let sqlFile = path.join(__dirname, 'insert_mock_fruits.sql');
let sql = fs.readFileSync(sqlFile, 'utf8');

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);
const NEON_HOST = 'ep-fancy-meadow-am8cckgk-pooler.c-5.us-east-1.aws.neon.tech';

resolver.resolve4(NEON_HOST, async (err, addresses) => {
  if (err) { console.error('DNS ERROR'); process.exit(1); }
  const ip = addresses[0];

  const client = new Client({
    host: ip, port: 5432, database: 'neondb', user: 'neondb_owner', password: 'npg_H2GYBSvMs0AJ',
    ssl: { rejectUnauthorized: false, servername: NEON_HOST },
  });

  try {
    await client.connect();
    console.log('Connected! Inserting mock fruits...');
    await client.query(sql);
    console.log('SUCCESS: Mock fruits seeded.');
  } catch (err2) {
    console.error('ERROR: ' + err2.message);
  } finally {
    await client.end().catch(() => {});
  }
});
