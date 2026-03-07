const fs = require('fs');
const readline = require('readline');
const { Pool } = require('pg');

const pool = new Pool({
  host: '34.29.171.92',
  user: 'salon_admin',
  password: 'JHSalonAdmin123',
  database: 'postgres',
  port: 5432
});

const SALON_ID = 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

async function run() {
  const client = await pool.connect();

  const rl = readline.createInterface({
    input: fs.createReadStream('/a0/usr/workdir/clients_clean.csv'),
    crlfDelay: Infinity
  });

  let count = 0;
  let first = true;

  for await (const line of rl) {
    if (first) { first=false; continue; }

    const [salon_id, phone_number, full_name, last_visit, total_visits] = line.split(',');

    try {
      await client.query(
        `INSERT INTO clients (salon_id,phone_number,full_name,last_visit,total_visits)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (phone_number) DO NOTHING`,
        [SALON_ID, phone_number, full_name || null, last_visit || null, parseInt(total_visits||0)]
      );

      count++;
      if (count % 200 === 0) console.log('inserted',count);

    } catch (e) {
      console.log('error row',e.message);
    }
  }

  console.log('done',count);
  client.release();
  process.exit();
}

run();
