require('dotenv').config();
const { Client } = require('pg');

const DEMO = {
  ownerEmail: 'demo.owner@salonos.local',
  ownerName: 'Demo Salon Owner',
  ownerPhone: '+919900000001',
  salonName: 'JH Demo Signature Salon',
  city: 'Kurnool',
  address: 'MG Road, Kurnool, Andhra Pradesh',
  phone: '+919900000010',
  whatsapp: '+919900000010',
};

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function ensureColumn(client, table, column, ddl) {
  const exists = await client.query(
    `select 1 from information_schema.columns where table_schema='public' and table_name=$1 and column_name=$2`,
    [table, column]
  );
  if (!exists.rowCount) {
    console.log(`Adding missing column ${table}.${column}`);
    await client.query(ddl);
  }
}

async function tableExists(client, table) {
  const r = await client.query(
    `select 1 from information_schema.tables where table_schema='public' and table_name=$1`,
    [table]
  );
  return !!r.rowCount;
}

(async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionTimeoutMillis: 10000,
    ssl: false,
  });

  await client.connect();
  try {
    await client.query('BEGIN');

    // Compatibility patches for current mixed schema state
    await ensureColumn(client, 'transactions', 'salon_id', `ALTER TABLE transactions ALTER COLUMN salon_id TYPE uuid USING salon_id::text::uuid` ).catch(()=>{});
    await ensureColumn(client, 'transactions', 'staff_id', `ALTER TABLE transactions ALTER COLUMN staff_id TYPE uuid USING staff_id::text::uuid` ).catch(()=>{});
    await ensureColumn(client, 'transactions', 'client_id', `ALTER TABLE transactions ALTER COLUMN client_id TYPE uuid USING client_id::text::uuid` ).catch(()=>{});
    await ensureColumn(client, 'transactions', 'source', `ALTER TABLE transactions ADD COLUMN source text` ).catch(()=>{});

    const ownerRes = await client.query(
      `INSERT INTO owners (name, email, phone)
       VALUES ($1,$2,$3)
       ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone
       RETURNING id`,
      [DEMO.ownerName, DEMO.ownerEmail, DEMO.ownerPhone]
    );
    const ownerId = ownerRes.rows[0].id;

    let salonId;
    const salonRes = await client.query(
      `SELECT id FROM salons WHERE name=$1 LIMIT 1`,
      [DEMO.salonName]
    );
    if (salonRes.rowCount) {
      salonId = salonRes.rows[0].id;
      await client.query(
        `UPDATE salons SET owner_id=$2, city=$3, address=$4, phone=$5, whatsapp_number=$6 WHERE id=$1`,
        [salonId, ownerId, DEMO.city, DEMO.address, DEMO.phone, DEMO.whatsapp]
      );
    } else {
      const ins = await client.query(
        `INSERT INTO salons (owner_id, name, city, address, phone, whatsapp_number)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [ownerId, DEMO.salonName, DEMO.city, DEMO.address, DEMO.phone, DEMO.whatsapp]
      );
      salonId = ins.rows[0].id;
    }

    await client.query(
      `INSERT INTO salon_capacity (salon_id, men_chairs, women_chairs, unisex_chairs, waiting_seats)
       VALUES ($1, 3, 3, 2, 6)
       ON CONFLICT (salon_id) DO UPDATE
       SET men_chairs=EXCLUDED.men_chairs, women_chairs=EXCLUDED.women_chairs,
           unisex_chairs=EXCLUDED.unisex_chairs, waiting_seats=EXCLUDED.waiting_seats,
           updated_at=NOW()`,
      [salonId]
    );

    const staffSeed = [
      ['Aarav Style Director', 'stylist', '+919900000101'],
      ['Meera Color Specialist', 'stylist', '+919900000102'],
      ['Riya Bridal Artist', 'stylist', '+919900000103'],
      ['Kabir Grooming Expert', 'stylist', '+919900000104'],
      ['Nisha Front Desk', 'manager', '+919900000105'],
    ];

    const staffIds = [];
    for (const [full_name, role, phone] of staffSeed) {
      const email = `${slugify(full_name)}@demo.salonos.local`;
      const r = await client.query(
        `INSERT INTO staff (full_name, email, phone_number, role, salon_id, is_active)
         VALUES ($1,$2,$3,$4,$5,true)
         ON CONFLICT (email) DO UPDATE SET full_name=EXCLUDED.full_name, phone_number=EXCLUDED.phone_number, role=EXCLUDED.role, salon_id=EXCLUDED.salon_id, is_active=true
         RETURNING id, full_name`,
        [full_name, email, phone, role, salonId]
      );
      staffIds.push(r.rows[0]);
    }

    // Seed working hours for all staff (P0-3: Staff Availability Seeding)
    console.log('[SEED] Ensuring working hours for all staff...');
    const defaultStartTime = '09:00';
    const defaultEndTime = '21:00';
    const defaultCapacity = 1;
    const weekdays = [0, 1, 2, 3, 4, 5, 6]; // Sunday=0 to Saturday=6

    for (const staff of staffIds) {
      const staffId = staff.id;

      // Check existing working hours
      const existingHours = await client.query(
        `SELECT weekday FROM staff_working_hours WHERE salon_id=$1 AND staff_id=$2`,
        [salonId, staffId]
      );
      const existingWeekdays = existingHours.rows.map(r => r.weekday);
      const missingWeekdays = weekdays.filter(w => !existingWeekdays.includes(w));

      if (missingWeekdays.length > 0) {
        for (const weekday of missingWeekdays) {
          await client.query(
            `INSERT INTO staff_working_hours (salon_id, staff_id, weekday, start_time, end_time, capacity, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, true)
             ON CONFLICT (salon_id, staff_id, weekday) DO UPDATE
             SET start_time=EXCLUDED.start_time, end_time=EXCLUDED.end_time, capacity=EXCLUDED.capacity, is_active=true`,
            [salonId, staffId, weekday, defaultStartTime, defaultEndTime, defaultCapacity]
          );
        }
        console.log(`[SEED] Added ${missingWeekdays.length} working days for ${staff.full_name}`);
      } else {
        console.log(`[SEED] Staff ${staff.full_name} already has complete working hours`);
      }
    }
    console.log('[SEED] Working hours seeding complete');

    const servicesSeed = [
      ['Signature Haircut', 'Precision cut with consultation and styling.', 45, 699],
      ['Hair Color Global', 'Premium global color application.', 120, 3499],
      ['Keratin Smoothening', 'Frizz-control treatment with finishing.', 180, 5499],
      ['Luxury Facial', 'Deep cleanse, exfoliation, and glow finish.', 60, 1999],
      ['Bridal Makeup Trial', 'Full-look trial with finish options.', 90, 3999],
      ['Beard Sculpt + Hair Spa', 'Combo grooming and scalp recovery.', 75, 1499],
    ];

    const serviceIds = [];
    for (const [name, description, duration, price] of servicesSeed) {
      const existing = await client.query(`SELECT id FROM services WHERE salon_id=$1 AND name=$2 LIMIT 1`, [salonId, name]);
      let id;
      if (existing.rowCount) {
        id = existing.rows[0].id;
        await client.query(
          `UPDATE services SET description=$3, duration_minutes=$4, price=$5, is_active=true WHERE id=$1 AND salon_id=$2`,
          [id, salonId, description, duration, price]
        );
      } else {
        const ins = await client.query(
          `INSERT INTO services (salon_id, name, description, duration_minutes, price, is_active)
           VALUES ($1,$2,$3,$4,$5,true)
           RETURNING id`,
          [salonId, name, description, duration, price]
        );
        id = ins.rows[0].id;
      }
      serviceIds.push({ id, name, price: Number(price) });
    }

    const clientsSeed = [
      ['Ananya Reddy', '+919900001001', 'ananya@example.com', 8, 12000, 10],
      ['Vikram Rao', '+919900001002', 'vikram@example.com', 5, 7200, 52],
      ['Sara Khan', '+919900001003', 'sara@example.com', 2, 2800, 64],
      ['Ishita Varma', '+919900001004', 'ishita@example.com', 12, 22000, 18],
      ['Rahul Dev', '+919900001005', 'rahul@example.com', 4, 4100, 75],
      ['Pooja Nair', '+919900001006', 'pooja@example.com', 7, 9800, 43],
      ['Karan Mehta', '+919900001007', 'karan@example.com', 3, 3600, 95],
      ['Diya Sharma', '+919900001008', 'diya@example.com', 9, 16500, 27],
    ];

    const clientIds = [];
    for (const [full_name, phone, email, visits, ltv, daysAgo] of clientsSeed) {
      const lastVisit = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
      const createdAt = new Date(Date.now() - (daysAgo + 120) * 24 * 3600 * 1000);
      const r = await client.query(
        `INSERT INTO clients (salon_id, full_name, phone_number, email, total_visits, lifetime_value, marketing_opt_in, last_visit, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,true,$7,$8)
         ON CONFLICT (phone_number) DO UPDATE
         SET full_name=EXCLUDED.full_name, email=EXCLUDED.email, salon_id=EXCLUDED.salon_id,
             total_visits=EXCLUDED.total_visits, lifetime_value=EXCLUDED.lifetime_value,
             marketing_opt_in=true, last_visit=EXCLUDED.last_visit
         RETURNING id, full_name`,
        [salonId, full_name, phone, email, visits, ltv, lastVisit, createdAt]
      );
      clientIds.push(r.rows[0]);
    }

    // Remove old demo appointments for clean deterministic visuals
    await client.query(`DELETE FROM appointment_services WHERE appointment_id IN (SELECT id FROM appointments WHERE salon_id=$1 AND notes='DEMO_SEED')`, [salonId]);
    await client.query(`DELETE FROM appointments WHERE salon_id=$1 AND notes='DEMO_SEED'`, [salonId]);

    const now = new Date();
    const appts = [
      { dayOffset: 0, hour: 10, min: 0, client: 0, staff: 0, service: 0, status: 'completed' },
      { dayOffset: 0, hour: 11, min: 30, client: 1, staff: 1, service: 1, status: 'completed' },
      { dayOffset: 0, hour: 14, min: 0, client: 2, staff: 3, service: 5, status: 'booked' },
      { dayOffset: 0, hour: 16, min: 0, client: 3, staff: 2, service: 4, status: 'booked' },
      { dayOffset: 1, hour: 10, min: 0, client: 4, staff: 0, service: 0, status: 'booked' },
      { dayOffset: 1, hour: 12, min: 0, client: 5, staff: 1, service: 3, status: 'booked' },
      { dayOffset: 2, hour: 15, min: 0, client: 6, staff: 3, service: 5, status: 'booked' },
      { dayOffset: 3, hour: 17, min: 30, client: 7, staff: 2, service: 2, status: 'booked' },
      { dayOffset: 4, hour: 11, min: 0, client: 0, staff: 0, service: 1, status: 'booked' },
      { dayOffset: 5, hour: 13, min: 30, client: 1, staff: 1, service: 3, status: 'booked' },
      { dayOffset: 6, hour: 18, min: 0, client: 2, staff: 2, service: 4, status: 'booked' },
    ];

    const bookedAppointmentIds = [];
    for (const a of appts) {
      const dt = new Date(now);
      dt.setUTCDate(dt.getUTCDate() + a.dayOffset);
      dt.setUTCHours(a.hour, a.min, 0, 0);
      const service = serviceIds[a.service];
      const ins = await client.query(
        `INSERT INTO appointments (salon_id, client_id, staff_id, appointment_time, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [salonId, clientIds[a.client].id, staffIds[a.staff].id, dt, a.status, 'DEMO_SEED']
      );
      const appointmentId = ins.rows[0].id;
      bookedAppointmentIds.push(appointmentId);
      await client.query(
        `INSERT INTO appointment_services (appointment_id, service_id, base_price, charged_price)
         VALUES ($1,$2,$3,$4)`,
        [appointmentId, service.id, service.price, service.price]
      );
    }

    if (await tableExists(client, 'waitlist_requests')) {
      await client.query(`DELETE FROM waitlist_requests WHERE salon_id=$1 AND status='demo_active'`, [salonId]).catch(()=>{});
      for (let i = 0; i < 3; i++) {
        await client.query(
          `INSERT INTO waitlist_requests (salon_id, client_id, service_id, staff_id, preferred_start, preferred_end, flexible, priority_score, status)
           VALUES ($1,$2,$3,$4,NOW() + (($5 || ' days')::interval), NOW() + (($6 || ' days')::interval), true, $7, 'active')`,
          [salonId, clientIds[i+3].id, serviceIds[i].id, staffIds[i].id, String(i+1), String(i+2), 80 - i * 10]
        );
      }
    }

    if (await tableExists(client, 'slot_events')) {
      await client.query(`DELETE FROM slot_events WHERE salon_id=$1 AND event_type LIKE 'demo_%'`, [salonId]).catch(()=>{});
      await client.query(
        `INSERT INTO slot_events (salon_id, event_type, appointment_id, service_id, staff_id, slot_start, slot_end)
         VALUES
         ($1,'demo_gap',NULL,$2,$3,NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour'),
         ($1,'demo_gap',NULL,$4,$5,NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 1 hour')`,
        [salonId, serviceIds[0].id, staffIds[0].id, serviceIds[3].id, staffIds[1].id]
      ).catch(()=>{});
    }

    if (await tableExists(client, 'ai_campaigns')) {
      await client.query(`DELETE FROM ai_campaigns WHERE salon_id=$1 AND sent_at > NOW() - INTERVAL '30 days'`, [salonId]).catch(()=>{});
      for (let i = 0; i < 3; i++) {
        await client.query(
          `INSERT INTO ai_campaigns (salon_id, client_id, service_id, offer_discount, sent_at, booked)
           VALUES ($1,$2,$3,$4,NOW() - (($5 || ' days')::interval), $6)`,
          [salonId, clientIds[i].id, serviceIds[i].id, [10,15,20][i], String(i+1), i === 0]
        );
      }
    }

    if (await tableExists(client, 'transactions')) {
      await client.query(`DELETE FROM transaction_items WHERE transaction_id IN (SELECT id FROM transactions WHERE source='demo_seed' AND salon_id=$1)`, [salonId]).catch(()=>{});
      await client.query(`DELETE FROM transactions WHERE source='demo_seed' AND salon_id=$1`, [salonId]).catch(()=>{});
      for (let i = 0; i < 4; i++) {
        const service = serviceIds[i];
        const tx = await client.query(
          `INSERT INTO transactions (salon_id, staff_id, client_id, total_amount, payment_method, status, created_at, source)
           VALUES ($1,$2,$3,$4,$5,'completed', NOW() - (($6 || ' hours')::interval), 'demo_seed')
           RETURNING id`,
          [salonId, staffIds[i % staffIds.length].id, clientIds[i].id, service.price, i % 2 === 0 ? 'card' : 'upi', String((i+1)*5)]
        );
        await client.query(
          `INSERT INTO transaction_items (transaction_id, item_type, item_id, name, quantity, price)
           VALUES ($1,'service',NULL,$2,1,$3)`,
          [tx.rows[0].id, service.name, service.price]
        );
      }
    }

    const summary = {
      salonId,
      staff: staffIds.length,
      services: serviceIds.length,
      clients: clientIds.length,
      appointments: appts.length,
    };

    await client.query('COMMIT');
    console.log(JSON.stringify(summary, null, 2));
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error(err.stack || err);
    process.exit(1);
  } finally {
    await client.end().catch(()=>{});
  }
})();
