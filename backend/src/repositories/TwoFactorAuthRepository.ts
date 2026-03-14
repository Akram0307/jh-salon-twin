import { query } from '../config/db';

export class TwoFactorAuthRepository {
  static async findByUserId(userId: string, userType: string) {
    const res = await query(
      `SELECT * FROM two_factor_auth WHERE user_id = $1 AND user_type = $2`,
      [userId, userType]
    );
    return res.rows[0] || null;
  }

  static async create(data: {
    user_id: string;
    user_type: string;
    secret: string;
    enabled?: boolean;
  }) {
    const res = await query(
      `INSERT INTO two_factor_auth (user_id, user_type, secret, enabled)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.user_id, data.user_type, data.secret, data.enabled || false]
    );
    return res.rows[0];
  }

  static async update(userId: string, userType: string, updates: { secret?: string; enabled?: boolean; verified_at?: Date }) {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.secret !== undefined) {
      setClauses.push(`secret = $${paramCount}`);
      values.push(updates.secret);
      paramCount++;
    }

    if (updates.enabled !== undefined) {
      setClauses.push(`enabled = $${paramCount}`);
      values.push(updates.enabled);
      paramCount++;
    }

    if (updates.verified_at !== undefined) {
      setClauses.push(`verified_at = $${paramCount}`);
      values.push(updates.verified_at);
      paramCount++;
    }

    if (setClauses.length === 0) {
      return this.findByUserId(userId, userType);
    }

    values.push(userId, userType);
    const res = await query(
      `UPDATE two_factor_auth SET ${setClauses.join(', ')}
       WHERE user_id = $${paramCount} AND user_type = $${paramCount + 1}
       RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  static async enable(userId: string, userType: string, secret: string) {
    const existing = await this.findByUserId(userId, userType);
    if (existing) {
      return this.update(userId, userType, { secret, enabled: true });
    }
    return this.create({ user_id: userId, user_type: userType, secret, enabled: true });
  }

  static async verify(userId: string, userType: string) {
    return this.update(userId, userType, { enabled: true, verified_at: new Date() });
  }

  static async disable(userId: string, userType: string) {
    return this.update(userId, userType, { enabled: false });
  }
}
