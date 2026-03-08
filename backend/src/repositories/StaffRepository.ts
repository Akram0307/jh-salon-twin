import { query } from '../config/db';

const DEFAULT_SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

export type StaffInput = {
  salon_id?: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  role?: string | null;
  is_active?: boolean;
};

export class StaffRepository {
  static async findAll(salonId: string = DEFAULT_SALON_ID) {
    const res = await query(
      `SELECT *
       FROM staff
       WHERE salon_id = $1
       ORDER BY full_name`,
      [salonId]
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

  static async update(id: string, data: Partial<StaffInput>, salonId: string = DEFAULT_SALON_ID) {
    const existing = await this.findById(id, salonId);
    if (!existing) return null;

    const res = await query(
      `UPDATE staff
       SET full_name = $1,
           email = $2,
           phone_number = $3,
           role = $4,
           is_active = $5
       WHERE id = $6 AND salon_id = $7
       RETURNING *`,
      [
        data.full_name ?? existing.full_name,
        data.email ?? existing.email,
        data.phone_number ?? existing.phone_number,
        data.role ?? existing.role,
        data.is_active ?? existing.is_active,
        id,
        salonId,
      ]
    );
    return res.rows[0] || null;
  }
}
