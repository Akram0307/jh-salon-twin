const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line)) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv(path.join(__dirname, '..', '.env'));

const config = {
  host: '127.0.0.1',
  port: 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  ssl: false,
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
  statement_timeout: 5000,
};

console.log('PROBE_START');
console.log(JSON.stringify({
  target: { host: config.host, port: config.port, database: config.database, user: config.user, ssl: config.ssl },
  hasPassword: Boolean(config.password)
}, null, 2));

(async () => {
  const client = new Client(config);
  const start = Date.now();
  try {
    console.log('BEFORE_CONNECT');
    await client.connect();
    console.log('AFTER_CONNECT');
    const res = await client.query('select 1 as ok, current_database() as database, current_user as user');
    console.log(JSON.stringify({ ok: true, elapsedMs: Date.now() - start, row: res.rows[0] }, null, 2));
    await client.end();
    console.log('PROBE_END');
    process.exit(0);
  } catch (err) {
    console.error('CONNECT_ERROR');
    console.error(JSON.stringify({
      ok: false,
      elapsedMs: Date.now() - start,
      name: err && err.name,
      message: err && err.message,
      code: err && err.code,
      severity: err && err.severity,
      detail: err && err.detail,
      hint: err && err.hint,
      routine: err && err.routine
    }, null, 2));
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
})();
