import { query } from '../config/db';

const DEFAULT_SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';
let hasUpdatedAtColumnCache: boolean | null = null;

export type StaffInput = {
  salon_id?: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  role?: string | null;
  is_active?: boolean;
};

export type StaffListFilters = {
  is_active?: boolean;
  search?: string;
  role?: string | null;
};

export class StaffRepository {
  static async findAll(salonId: string = DEFAULT_SALON_ID, filters: StaffListFilters = {}) {
    const params: unknown[] = [salonId];
    const clauses = ['salon_id = $1'];

    if (typeof filters.is_active === 'boolean') {
      params.push(filters.is_active);
      clauses.push(`is_active = $${params.length}`);
    }

    if (filters.search?.trim()) {
      params.push(`%${filters.search.trim()}%`);
      clauses.push(`(LOWER(full_name) LIKE LOWER($${params.length}) OR LOWER(email) LIKE LOWER($${params.length}))`);
    }

    if (filters.role?.trim()) {
      params.push(filters.role.trim());
      clauses.push(`LOWER(role) = LOWER($${params.length})`);
    }

    const res = await query(
      `SELECT *
       FROM staff
       WHERE ${clauses.join(' AND ')}
       ORDER BY is_active DESC, full_name`,
      params
    );
    return res.rows;
  }

  static async findById(id: string, salonId: string = DEFAULT_SALON_ID) {
    const res = await query(
      'SELECT * FROM staff WHERE id = $1 AND salon_id = $2',
      [id, salonId]
    );
    return res.rows[0];
  }

  static async findByName(name: string, salonId: string = DEFAULT_SALON_ID) {
    const res = await query(
      `SELECT *
       FROM staff
       WHERE salon_id = $2 AND LOWER(full_name) LIKE LOWER($1)
       ORDER BY LENGTH(full_name)
       LIMIT 1`,
      [`%${name}%`, salonId]
    );
    return res.rows[0];
  }

  static async create(data: StaffInput) {
    const salonId = data.salon_id || DEFAULT_SALON_ID;
    const res = await query(
      `INSERT INTO staff (salon_id, full_name, email, phone_number, role, is_active)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, true))
       RETURNING *`,
      [salonId, data.full_name, data.email, data.phone_number || null, data.role || 'stylist', data.is_active]
    );
    return res.rows[0];
  }

  static async hasUpdatedAtColumn() {
    if (hasUpdatedAtColumnCache !== null) return hasUpdatedAtColumnCache;
    const res = await query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_name = 'staff' AND column_name = 'updated_at'
       LIMIT 1`
    );
    hasUpdatedAtColumnCache = Boolean(res.rows[0]);
    return hasUpdatedAtColumnCache;
  }

  static async update(id: string, data: Partial<StaffInput>, salonId: string = DEFAULT_SALON_ID) {
    const existing = await this.findById(id, salonId);
    if (!existing) return null;

    const values = [
      data.full_name ?? existing.full_name,
      data.email ?? existing.email,
      data.phone_number ?? existing.phone_number,
      data.role ?? existing.role,
      data.is_active ?? existing.is_active,
      id,
      salonId,
    ];

    const setUpdatedAt = await this.hasUpdatedAtColumn();
    const sql = setUpdatedAt
      ? `UPDATE staff
         SET full_name = $1,
             email = $2,
             phone_number = $3,
             role = $4,
             is_active = $5,
             updated_at = NOW()
         WHERE id = $6 AND salon_id = $7
         RETURNING *`
      : `UPDATE staff
         SET full_name = $1,
             email = $2,
             phone_number = $3,
             role = $4,
             is_active = $5
         WHERE id = $6 AND salon_id = $7
         RETURNING *`;

    const res = await query(sql, values);
    return res.rows[0] || null;
  }

  static async archive(id: string, salonId: string = DEFAULT_SALON_ID) {
    return this.update(id, { is_active: false }, salonId);
  }

  static async restore(id: string, salonId: string = DEFAULT_SALON_ID) {
    return this.update(id, { is_active: true }, salonId);
  }
}
