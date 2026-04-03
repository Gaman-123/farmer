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

const connectionString = env['DATABASE_URL'];

let sqlFile = path.join(__dirname, '..', 'ekrishi_module4_marketplace (1).sql');
let sql = fs.readFileSync(sqlFile, 'utf8');

const dropHeader = `
-- Neon compatibility: Mock Supabase auth.uid() if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  -- Dummy implementation for standard PG 
  SELECT '00000000-0000-0000-0000-000000000000'::uuid;
$$ LANGUAGE SQL STABLE;
`;

// 1. CREATE TYPE -> DO block
sql = sql.replace(/CREATE TYPE\s+([a-zA-Z0-9_]+)\s+AS ENUM\s*\(([^)]+)\);/g, (match, typeName, enumValues) => {
  return `DO $$ BEGIN CREATE TYPE ${typeName} AS ENUM (${enumValues}); EXCEPTION WHEN duplicate_object THEN null; END $$;`;
});

sql = dropHeader + '\n\n' + sql;

const logPath = 'C:/tmp/sql_result.txt';
function log(msg) {
  fs.appendFileSync(logPath, msg + '\n', 'utf8');
  console.log(msg);
}
fs.writeFileSync(logPath, '', 'utf8');

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);
const NEON_HOST = 'ep-fancy-meadow-am8cckgk-pooler.c-5.us-east-1.aws.neon.tech';

resolver.resolve4(NEON_HOST, async (err, addresses) => {
  if (err) { log('DNS ERROR'); process.exit(1); }
  const ip = addresses[0];

  const client = new Client({
    host: ip, port: 5432, database: 'neondb', user: 'neondb_owner', password: 'npg_H2GYBSvMs0AJ',
    ssl: { rejectUnauthorized: false, servername: NEON_HOST },
  });

  try {
    await client.connect();
    log('Connected to ' + ip + '! Running SQL statements...');
    
    await client.query(sql);

    log('SUCCESS: SQL file executed successfully on Neon!');
  } catch (err2) {
    log('ERROR: ' + err2.message);
    log('CODE: ' + err2.code);
  } finally {
    await client.end().catch(() => {});
  }
});
