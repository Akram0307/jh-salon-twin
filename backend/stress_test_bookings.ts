import { pool } from './src/config/db';
import { AppointmentRepository } from './src/repositories/AppointmentRepository';

async function runStressTest() {
  const serviceQuery = await pool.query("SELECT id, salon_id, duration_minutes, price AS base_price FROM services LIMIT 1");
  const service = serviceQuery.rows[0];

  const staffQuery = await pool.query("SELECT id FROM staff LIMIT 1");
  const staffId = staffQuery.rows[0].id;

  const clientQuery = await pool.query("SELECT id FROM clients LIMIT 1");
  const clientId = clientQuery.rows[0].id;

  const slot = new Date();
  slot.setHours(slot.getHours() + 2);

  const slotISO = slot.toISOString();

  console.log("Starting concurrency stress test...");

  const attempts = 50;
  const tasks:any[] = [];

  for (let i = 0; i < attempts; i++) {
    tasks.push(
      AppointmentRepository.create({ salon_id: service.salon_id,
        client_id: clientId,
        staff_id: staffId,
        appointment_time: slotISO,
        services: [
          {
            service_id: service.id,
            base_price: service.base_price || 0
          }
        ]
      }).then(() => ({ success: true }))
      .catch((e:any) => { console.error('BOOKING ERROR:', e); return { success:false,error:e.message }; })
    );
  }

  const results = await Promise.all(tasks);

  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log("\n=== STRESS TEST RESULTS ===");
  console.log("Attempts:", attempts);
  console.log("Successful bookings:", success);
  console.log("Rejected (conflict protected):", failed);

  const dbCheck = await pool.query(`
    SELECT COUNT(*)
    FROM appointments
    WHERE appointment_time = $1
  `, [slotISO]);

  console.log("Actual rows in DB for slot:", dbCheck.rows[0].count);

  await pool.end();
}

runStressTest().catch(console.error);
