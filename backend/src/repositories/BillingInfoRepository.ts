import { query } from '../config/db';
import type { QueryParams, JsonData } from '../types/repositoryTypes';

export class BillingInfoRepository {
  static async findBySalonId(salonId: string) {
    const res = await query(
      `SELECT * FROM billing_info WHERE salon_id = $1`,
      [salonId]
    );
    return res.rows[0] || null;
  }

  static async findByOwnerId(ownerId: string) {
    const res = await query(
      `SELECT * FROM billing_info WHERE owner_id = $1`,
      [ownerId]
    );
    return res.rows[0] || null;
  }

  static async create(billing: {
    salon_id: string;
    owner_id: string;
    plan?: string;
    payment_method?: JsonData;
    billing_address?: JsonData;
    subscription_start?: Date;
    subscription_end?: Date;
  }) {
    const res = await query(
      `INSERT INTO billing_info (salon_id, owner_id, plan, payment_method, billing_address, subscription_start, subscription_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        billing.salon_id,
        billing.owner_id,
        billing.plan || 'free',
        JSON.stringify(billing.payment_method || {}),
        JSON.stringify(billing.billing_address || {}),
        billing.subscription_start || null,
        billing.subscription_end || null
      ]
    );
    return res.rows[0];
  }

  static async update(salonId: string, updates: {
    plan?: string;
    payment_method?: JsonData;
    billing_address?: JsonData;
    subscription_start?: Date;
    subscription_end?: Date;
  }) {
    const setClauses: string[] = [];
    const values: QueryParams = [];
    let paramCount = 1;

    if (updates.plan !== undefined) {
      setClauses.push(`plan = $${paramCount}`);
      values.push(updates.plan);
      paramCount++;
    }

    if (updates.payment_method !== undefined) {
      setClauses.push(`payment_method = $${paramCount}`);
      values.push(JSON.stringify(updates.payment_method));
      paramCount++;
    }

    if (updates.billing_address !== undefined) {
      setClauses.push(`billing_address = $${paramCount}`);
      values.push(JSON.stringify(updates.billing_address));
      paramCount++;
    }

    if (updates.subscription_start !== undefined) {
      setClauses.push(`subscription_start = $${paramCount}`);
      values.push(updates.subscription_start);
      paramCount++;
    }

    if (updates.subscription_end !== undefined) {
      setClauses.push(`subscription_end = $${paramCount}`);
      values.push(updates.subscription_end);
      paramCount++;
    }

    if (setClauses.length === 0) {
      return this.findBySalonId(salonId);
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(salonId);
    const res = await query(
      `UPDATE billing_info SET ${setClauses.join(', ')}
       WHERE salon_id = $${paramCount}
       RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }
}
