// Dashboard stats endpoint
router.get('/dashboard/stats', async (_req, res) => {
  try {
    const [todayAppointments, totalClients, totalStaff, todayRevenue] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM appointments WHERE salon_id = $1 AND appointment_time::date = CURRENT_DATE', [SALON_ID]),
      query('SELECT COUNT(*)::int AS count FROM clients WHERE salon_id = $1', [SALON_ID]),
      query('SELECT COUNT(*)::int AS count FROM staff WHERE salon_id = $1 AND is_active = true', [SALON_ID]),
      query(
        `SELECT COALESCE(SUM(asv.charged_price), 0)::float AS total
         FROM appointment_services asv
         INNER JOIN appointments a ON a.id = asv.appointment_id
         WHERE a.salon_id = $1 AND a.appointment_time::date = CURRENT_DATE`,
        [SALON_ID]
      ),
    ]);

    res.json(ok({
      today_appointments: todayAppointments.rows[0]?.count || 0,
      total_clients: totalClients.rows[0]?.count || 0,
      total_staff: totalStaff.rows[0]?.count || 0,
      today_revenue: todayRevenue.rows[0]?.total || 0,
    }, 'Dashboard stats loaded successfully'));
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    res.status(500).json(fail('DASHBOARD_STATS_FETCH_FAILED', 'Failed to fetch dashboard stats'));
  }
});

// Recent activity endpoint
router.get('/dashboard/recent-activity', async (_req, res) => {
  try {
    const activities = await AuditLogRepository.findRecentBySalon(SALON_ID, 20);
    res.json(ok(activities.map((row: any) => ({
      id: row.id,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      actor_id: row.actor_id,
      created_at: row.created_at,
    })), 'Recent activity loaded successfully'));
  } catch (err: any) {
    console.error('Recent activity error:', err);
    res.status(500).json(fail('RECENT_ACTIVITY_FETCH_FAILED', 'Failed to fetch recent activity'));
  }
});

// Revenue summary endpoint
router.get('/revenue/summary', async (_req, res) => {
  try {
    const [todayRevenue, thisMonthRevenue, lastMonthRevenue] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(asv.charged_price), 0)::float AS total
         FROM appointment_services asv
         INNER JOIN appointments a ON a.id = asv.appointment_id
         WHERE a.salon_id = $1 AND a.appointment_time::date = CURRENT_DATE`,
        [SALON_ID]
      ),
      query(
        `SELECT COALESCE(SUM(asv.charged_price), 0)::float AS total
         FROM appointment_services asv
         INNER JOIN appointments a ON a.id = asv.appointment_id
         WHERE a.salon_id = $1 AND DATE_TRUNC('month', a.appointment_time) = DATE_TRUNC('month', CURRENT_DATE)`,
        [SALON_ID]
      ),
      query(
        `SELECT COALESCE(SUM(asv.charged_price), 0)::float AS total
         FROM appointment_services asv
         INNER JOIN appointments a ON a.id = asv.appointment_id
         WHERE a.salon_id = $1 AND DATE_TRUNC('month', a.appointment_time) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`,
        [SALON_ID]
      ),
    ]);

    res.json(ok({
      today: todayRevenue.rows[0]?.total || 0,
      this_month: thisMonthRevenue.rows[0]?.total || 0,
      last_month: lastMonthRevenue.rows[0]?.total || 0,
    }, 'Revenue summary loaded successfully'));
  } catch (err: any) {
    console.error('Revenue summary error:', err);
    res.status(500).json(fail('REVENUE_SUMMARY_FETCH_FAILED', 'Failed to fetch revenue summary'));
  }
});

// Revenue trends endpoint
router.get('/revenue/trends', async (_req, res) => {
  try {
    const trends = await query(
      `SELECT 
         a.appointment_time::date AS date,
         COALESCE(SUM(asv.charged_price), 0)::float AS total
       FROM appointments a
       LEFT JOIN appointment_services asv ON asv.appointment_id = a.id
       WHERE a.salon_id = $1 
         AND a.appointment_time >= CURRENT_DATE - INTERVAL '7 days'
         AND a.appointment_time < CURRENT_DATE + INTERVAL '1 day'
       GROUP BY a.appointment_time::date
       ORDER BY a.appointment_time::date ASC`,
      [SALON_ID]
    );

    res.json(ok(trends.rows.map((row: any) => ({
      date: row.date,
      total: row.total,
    })), 'Revenue trends loaded successfully'));
  } catch (err: any) {
    console.error('Revenue trends error:', err);
    res.status(500).json(fail('REVENUE_TRENDS_FETCH_FAILED', 'Failed to fetch revenue trends'));
  }
});

// Staff performance endpoint
router.get('/staff/performance', async (_req, res) => {
  try {
    const performance = await query(
      `SELECT 
         s.id AS staff_id,
         s.full_name,
         s.role,
         COUNT(a.id)::int AS appointment_count,
         COALESCE(SUM(asv.charged_price), 0)::float AS total_revenue
       FROM staff s
       LEFT JOIN appointments a ON a.staff_id = s.id AND a.salon_id = s.salon_id
       LEFT JOIN appointment_services asv ON asv.appointment_id = a.id
       WHERE s.salon_id = $1 AND s.is_active = true
       GROUP BY s.id, s.full_name, s.role
       ORDER BY total_revenue DESC`,
      [SALON_ID]
    );

    res.json(ok(performance.rows.map((row: any) => ({
      staff_id: row.staff_id,
      full_name: row.full_name,
      role: row.role,
      appointment_count: row.appointment_count,
      total_revenue: row.total_revenue,
    })), 'Staff performance loaded successfully'));
  } catch (err: any) {
    console.error('Staff performance error:', err);
    res.status(500).json(fail('STAFF_PERFORMANCE_FETCH_FAILED', 'Failed to fetch staff performance'));
  }
});

// Upcoming appointments endpoint
router.get('/appointments/upcoming', async (_req, res) => {
  try {
    const upcoming = await query(
      `SELECT 
         a.id,
         a.appointment_time,
         a.status,
         c.full_name AS client_name,
         c.phone_number AS client_phone,
         s.name AS service_name,
         s.duration_minutes
       FROM appointments a
       INNER JOIN clients c ON c.id = a.client_id
       INNER JOIN appointment_services asv ON asv.appointment_id = a.id
       INNER JOIN services s ON s.id = asv.service_id
       WHERE a.salon_id = $1 
         AND a.appointment_time >= NOW()
         AND a.status IN ('booked', 'arrived', 'in_progress')
       ORDER BY a.appointment_time ASC
       LIMIT 10`,
      [SALON_ID]
    );

    res.json(ok(upcoming.rows.map((row: any) => ({
      id: row.id,
      appointment_time: row.appointment_time,
      status: row.status,
      client_name: row.client_name,
      client_phone: row.client_phone,
      service_name: row.service_name,
      duration_minutes: row.duration_minutes,
    })), 'Upcoming appointments loaded successfully'));
  } catch (err: any) {
    console.error('Upcoming appointments error:', err);
    res.status(500).json(fail('UPCOMING_APPOINTMENTS_FETCH_FAILED', 'Failed to fetch upcoming appointments'));
  }
});

// Alerts endpoint
router.get('/alerts', async (_req, res) => {
  try {
    const alerts = [];

    // Check for staff time off today
    const timeOffToday = await query(
      `SELECT COUNT(*)::int AS count 
       FROM staff_time_off 
       WHERE salon_id = $1 
         AND start_datetime::date <= CURRENT_DATE 
         AND end_datetime::date >= CURRENT_DATE`,
      [SALON_ID]
    );
    if (timeOffToday.rows[0]?.count > 0) {
      alerts.push({
        type: 'staff_time_off',
        message: `${timeOffToday.rows[0].count} staff member(s) have time off today`,
        severity: 'warning',
      });
    }

    // Check for low capacity today (less than 2 staff available)
    const availableStaffToday = await query(
      `SELECT COUNT(DISTINCT s.id)::int AS count
       FROM staff s
       LEFT JOIN staff_time_off sto ON sto.staff_id = s.id 
         AND sto.salon_id = s.salon_id 
         AND sto.start_datetime::date <= CURRENT_DATE 
         AND sto.end_datetime::date >= CURRENT_DATE
       WHERE s.salon_id = $1 
         AND s.is_active = true 
         AND sto.id IS NULL`,
      [SALON_ID]
    );
    if (availableStaffToday.rows[0]?.count < 2) {
      alerts.push({
        type: 'low_staff_capacity',
        message: `Only ${availableStaffToday.rows[0].count} staff available today`,
        severity: 'critical',
      });
    }

    // Check for appointments without staff assigned (if staff_id is nullable and we have such appointments)
    const unassignedAppointments = await query(
      `SELECT COUNT(*)::int AS count
       FROM appointments
       WHERE salon_id = $1 
         AND staff_id IS NULL 
         AND appointment_time::date = CURRENT_DATE`,
      [SALON_ID]
    );
    if (unassignedAppointments.rows[0]?.count > 0) {
      alerts.push({
        type: 'unassigned_appointments',
        message: `${unassignedAppointments.rows[0].count} appointment(s) without staff assigned today`,
        severity: 'warning',
      });
    }

    res.json(ok(alerts, 'Alerts loaded successfully'));
  } catch (err: any) {
    console.error('Alerts error:', err);
    res.status(500).json(fail('ALERTS_FETCH_FAILED', 'Failed to fetch alerts'));
  }
});

