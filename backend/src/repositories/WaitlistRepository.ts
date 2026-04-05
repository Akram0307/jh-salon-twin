import { pool } from '../config/db';

export class WaitlistRepository {

  static async countPending() {
    const res = await pool.query(`
      SELECT COUNT(*)
      FROM waitlist_entries
      WHERE status = 'pending'
    `);

    return parseInt(res.rows[0].count, 10);
  }

  static async addEntry(clientId: string, preferredDate: string, preferredTimeRange: string, notes?: string) {
    const res = await pool.query(`
      INSERT INTO waitlist_entries (client_id, preferred_date, preferred_time_range, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [clientId, preferredDate, preferredTimeRange, notes]);

    return res.rows[0];
  }

  static async getPendingByDate(date: string) {
    const res = await pool.query(`
      SELECT * FROM waitlist_entries
      WHERE preferred_date = $1 AND status = 'pending'
      ORDER BY created_at ASC
    `, [date]);

    return res.rows;
  }

  static async updateStatus(id: string, status: string) {
    const res = await pool.query(`
      UPDATE waitlist_entries
      SET status = $2
      WHERE id = $1
      RETURNING *
    `, [id, status]);

    return res.rows[0];
  }
}
