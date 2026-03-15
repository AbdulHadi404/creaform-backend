const fs = require('fs');
const { Client } = require('pg');

// load connection string from .env
const env = fs
  .readFileSync('.env', 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .reduce((acc, line) => {
    const m = line.match(/^\s*([^=]+)=\s*(.*)$/);
    if (!m) return acc;
    const k = m[1].trim();
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    acc[k] = v;
    return acc;
  }, {});

const connectionString = env.DATABASE_URL;
if (!connectionString) {
  console.error('No DATABASE_URL found in .env');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to Neon (resetting schema)');
  await client.query('DROP SCHEMA public CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.query('GRANT ALL ON SCHEMA public TO public');
  await client.query('GRANT ALL ON SCHEMA public TO CURRENT_USER');
  console.log('Reset public schema');
  await client.end();
  console.log('Done.');
})().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
