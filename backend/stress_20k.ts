import { pool } from './src/config/db';
import { AppointmentRepository } from './src/repositories/AppointmentRepository';

async function run() {
  const serviceQuery = await pool.query("SELECT id, salon_id, duration_minutes, price AS base_price FROM services LIMIT 1");
  const service = serviceQuery.rows[0];

  const staffQuery = await pool.query("SELECT id FROM staff LIMIT 1");
  const staffId = staffQuery.rows[0].id;

  const clientQuery = await pool.query("SELECT id FROM clients LIMIT 1");
  const clientId = clientQuery.rows[0].id;

  const slot = new Date();
  slot.setHours(slot.getHours() + 3);
  const slotISO = slot.toISOString();

  const TOTAL = 20000;
  const BATCH = 100;

  let success = 0;
  let failed = 0;

  console.log('Starting 20k torture test...');

  for (let i = 0; i < TOTAL; i += BATCH) {
    const tasks:any[] = [];

    for (let j = 0; j < BATCH; j++) {
      tasks.push(
        AppointmentRepository.create({
          salon_id: service.salon_id,
          client_id: clientId,
          staff_id: staffId,
          appointment_time: slotISO,
          services: [{ service_id: service.id, base_price: service.base_price || 0 }]
        }).then(() => { success++; })
        .catch(() => { failed++; })
      );
    }

    await Promise.all(tasks);

    if ((i+BATCH) % 1000 === 0) {
      console.log('Progress:', i+BATCH);
    }
  }

  const dbCheck = await pool.query(
    `SELECT COUNT(*) FROM appointments WHERE appointment_time = $1`,
    [slotISO]
  );

  console.log('\n=== 20K TORTURE RESULTS ===');
  console.log('Attempts:', TOTAL);
  console.log('Success:', success);
  console.log('Failed:', failed);
  console.log('Rows in DB:', dbCheck.rows[0].count);

  await pool.end();
}

run().catch(console.error);
