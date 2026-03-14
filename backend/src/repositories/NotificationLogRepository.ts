import { query } from '../config/db';

export class NotificationLogRepository {
  static async findBySalonId(
    salonId: string,
    limit = 50,
    offset = 0,
    type?: string,
    status?: string
  ) {
    let whereClause = 'WHERE salon_id = $1';
    const params: any[] = [salonId];
    let paramCount = 2;

    if (type) {
      whereClause += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (status) {
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    params.push(limit, offset);
    const res = await query(
      `SELECT * FROM notification_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );
    return res.rows;
  }

  static async findById(id: string) {
    const res = await query(
      `SELECT * FROM notification_logs WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async create(log: {
    salon_id: string;
    user_id?: string;
    user_type?: string;
    template_id?: string;
    type: string;
    recipient: string;
    content: string;
    status?: string;
    error_message?: string;
    sent_at?: Date;
  }) {
    const res = await query(
      `INSERT INTO notification_logs (salon_id, user_id, user_type, template_id, type, recipient, content, status, error_message, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        log.salon_id,
        log.user_id || null,
        log.user_type || null,
        log.template_id || null,
        log.type,
        log.recipient,
        log.content,
        log.status || 'pending',
        log.error_message || null,
        log.sent_at || null
      ]
    );
    return res.rows[0];
  }

  static async updateStatus(id: string, status: string, error_message?: string, sent_at?: Date) {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    setClauses.push(`status = $${paramCount}`);
    values.push(status);
    paramCount++;

    if (error_message !== undefined) {
      setClauses.push(`error_message = $${paramCount}`);
      values.push(error_message);
      paramCount++;
    }

    if (sent_at !== undefined) {
      setClauses.push(`sent_at = $${paramCount}`);
      values.push(sent_at);
      paramCount++;
    }

    values.push(id);
    const res = await query(
      `UPDATE notification_logs SET ${setClauses.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  static async markAsSent(id: string) {
    return this.updateStatus(id, 'sent', undefined, new Date());
  }

  static async markAsFailed(id: string, error_message: string) {
    return this.updateStatus(id, 'failed', error_message);
  }

  static async getStats(salonId: string, days = 30) {
    const res = await query(
      `SELECT 
        type,
        status,
        COUNT(*) as count,
        DATE(created_at) as date
       FROM notification_logs
       WHERE salon_id = $1
         AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY type, status, DATE(created_at)
       ORDER BY date DESC`,
      [salonId]
    );

    // Aggregate stats
    const totalRes = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
       FROM notification_logs
       WHERE salon_id = $1
         AND created_at >= NOW() - INTERVAL '${days} days'`,
      [salonId]
    );

    const byTypeRes = await query(
      `SELECT 
        type,
        COUNT(*) as count
       FROM notification_logs
       WHERE salon_id = $1
         AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY type`,
      [salonId]
    );

    return {
      daily: res.rows,
      summary: totalRes.rows[0] || { total: 0, sent: 0, failed: 0, pending: 0 },
      byType: byTypeRes.rows
    };
  }
}
