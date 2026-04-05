import { query } from '../config/db';

export type AuditLogInput = {
  salon_id: string;
  actor_id?: string | null;
  actor_type?: string | null;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  before_state?: unknown;
  after_state?: unknown;
  diff?: unknown;
  request_path?: string | null;
  request_method?: string | null;
};

export class AuditLogRepository {
  static async create(payload: AuditLogInput) {
    const result = await query(
      `INSERT INTO audit_logs (
        salon_id, actor_id, actor_type, entity_type, entity_id, action,
        before_state, after_state, diff, request_path, request_method
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        payload.salon_id,
        payload.actor_id || null,
        payload.actor_type || 'owner',
        payload.entity_type,
        payload.entity_id || null,
        payload.action,
        payload.before_state ? JSON.stringify(payload.before_state) : null,
        payload.after_state ? JSON.stringify(payload.after_state) : null,
        payload.diff ? JSON.stringify(payload.diff) : null,
        payload.request_path || null,
        payload.request_method || null,
      ]
    );

    return result.rows[0] || null;
  }

  static async findRecentBySalon(salonId: string, limit = 10) {
    const result = await query(
      `SELECT *
       FROM audit_logs
       WHERE salon_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [salonId, limit]
    );
    return result.rows;
  }

  static async countRecentBySalon(salonId: string, hours = 24) {
    const result = await query(
      `SELECT COUNT(*)::int AS count
       FROM audit_logs
       WHERE salon_id = $1
         AND created_at >= NOW() - ($2 || ' hours')::interval`,
      [salonId, String(hours)]
    );
    return Number(result.rows[0]?.count || 0);
  }
}
