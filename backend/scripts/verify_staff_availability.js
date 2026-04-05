#!/usr/bin/env node
/**
 * Staff Availability Verification Script (P0-3)
 * Validates that staff working hours are properly configured for slot generation
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyStaffAvailability(salonId) {
  const client = await pool.connect();
  try {
    console.log(`\n🔍 Verifying staff availability for salon: ${salonId}\n`);

    // 1. Get all staff for the salon
    const staffResult = await client.query(
      `SELECT id, full_name, role, is_active FROM staff WHERE salon_id = $1 ORDER BY full_name`,
      [salonId]
    );

    if (staffResult.rowCount === 0) {
      console.log('❌ No staff found for this salon');
      return { isReady: false, totalStaff: 0, staffWithCompleteHours: 0 };
    }

    console.log(`✅ Found ${staffResult.rowCount} staff members\n`);

    // 2. Check working hours for each staff member
    const staffAvailability = [];
    let readyCount = 0;

    for (const staff of staffResult.rows) {
      const hoursResult = await client.query(
        `SELECT weekday, start_time, end_time, capacity, is_active 
         FROM staff_working_hours 
         WHERE salon_id = $1 AND staff_id = $2 
         ORDER BY weekday`,
        [salonId, staff.id]
      );

      const presentWeekdays = hoursResult.rows.map(r => r.weekday);
      const missingWeekdays = [0, 1, 2, 3, 4, 5, 6].filter(w => !presentWeekdays.includes(w));
      const isComplete = missingWeekdays.length === 0;
      
      if (isComplete) readyCount++;

      staffAvailability.push({
        staff_id: staff.id,
        full_name: staff.full_name,
        role: staff.role,
        is_active: staff.is_active,
        days_configured: hoursResult.rowCount,
        is_complete: isComplete,
        missing_days: missingWeekdays,
        hours: hoursResult.rows
      });
    }

    // 3. Print detailed report
    console.log('📊 Staff Availability Report:\n');
    console.log('-'.repeat(80));
    
    for (const staff of staffAvailability) {
      const status = staff.is_complete ? '✅' : '⚠️';
      const missingInfo = staff.missing_days.length > 0 
        ? `(Missing: ${staff.missing_days.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')})`
        : '';
      
      console.log(`${status} ${staff.full_name} (${staff.role})`);
      console.log(`   Days configured: ${staff.days_configured}/7 ${missingInfo}`);
      
      if (staff.hours.length > 0) {
        console.log(`   Schedule: ${staff.hours[0].start_time} - ${staff.hours[0].end_time} (capacity: ${staff.hours[0].capacity})`);
      }
      console.log();
    }

    // 4. Summary
    console.log('-'.repeat(80));
    console.log('\n📈 Summary:');
    console.log(`   Total staff: ${staffResult.rowCount}`);
    console.log(`   Staff with complete working hours (7 days): ${readyCount}`);
    console.log(`   Staff with missing hours: ${staffResult.rowCount - readyCount}`);
    
    const isReady = readyCount === staffResult.rowCount && staffResult.rowCount > 0;
    console.log(`\n${isReady ? '✅' : '❌'} Slot generation readiness: ${isReady ? 'READY' : 'NOT READY'}`);

    // 5. SQL to fix missing hours (if any)
    if (readyCount < staffResult.rowCount) {
      console.log('\n🔧 SQL to seed missing working hours:\n');
      console.log(`-- Auto-seed working hours for all staff in salon ${salonId}`);
      console.log(`INSERT INTO staff_working_hours (salon_id, staff_id, weekday, start_time, end_time, capacity, is_active)`);
      console.log(`SELECT '${salonId}', s.id, d, '09:00', '21:00', 1, true`);
      console.log(`FROM staff s`);
      console.log(`CROSS JOIN generate_series(0,6) d`);
      console.log(`WHERE s.salon_id = '${salonId}'`);
      console.log(`ON CONFLICT (salon_id, staff_id, weekday) DO NOTHING;`);
    }

    return {
      isReady,
      totalStaff: staffResult.rowCount,
      staffWithCompleteHours: readyCount,
      staffAvailability
    };

  } finally {
    client.release();
    await pool.end();
  }
}

// Main execution
const salonId = process.argv[2] || process.env.DEMO_SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

verifyStaffAvailability(salonId)
  .then(result => {
    process.exit(result.isReady ? 0 : 1);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
