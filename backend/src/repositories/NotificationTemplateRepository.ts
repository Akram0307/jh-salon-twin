import { query } from '../config/db';
import type { QueryParams } from '../types/repositoryTypes';

export class NotificationTemplateRepository {
  static async findBySalonId(salonId: string) {
    const res = await query(
      `SELECT * FROM notification_templates WHERE salon_id = $1 ORDER BY name`,
      [salonId]
    );
    return res.rows;
  }

  static async findById(id: string) {
    const res = await query(
      `SELECT * FROM notification_templates WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async create(template: {
    salon_id: string;
    name: string;
    type: string;
    subject?: string;
    body: string;
    variables?: unknown;
    is_active?: boolean;
  }) {
    const res = await query(
      `INSERT INTO notification_templates (salon_id, name, type, subject, body, variables, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        template.salon_id,
        template.name,
        template.type,
        template.subject || null,
        template.body,
        JSON.stringify(template.variables || []),
        template.is_active !== undefined ? template.is_active : true
      ]
    );
    return res.rows[0];
  }

  static async update(id: string, updates: {
    name?: string;
    type?: string;
    subject?: string;
    body?: string;
    variables?: unknown;
    is_active?: boolean;
  }) {
    const setClauses: string[] = [];
    const values: QueryParams = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramCount}`);
      values.push(updates.name);
      paramCount++;
    }

    if (updates.type !== undefined) {
      setClauses.push(`type = $${paramCount}`);
      values.push(updates.type);
      paramCount++;
    }

    if (updates.subject !== undefined) {
      setClauses.push(`subject = $${paramCount}`);
      values.push(updates.subject);
      paramCount++;
    }

    if (updates.body !== undefined) {
      setClauses.push(`body = $${paramCount}`);
      values.push(updates.body);
      paramCount++;
    }

    if (updates.variables !== undefined) {
      setClauses.push(`variables = $${paramCount}`);
      values.push(JSON.stringify(updates.variables));
      paramCount++;
    }

    if (updates.is_active !== undefined) {
      setClauses.push(`is_active = $${paramCount}`);
      values.push(updates.is_active);
      paramCount++;
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    const res = await query(
      `UPDATE notification_templates SET ${setClauses.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  static async delete(id: string) {
    const res = await query(
      `DELETE FROM notification_templates WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0] || null;
  }
}
