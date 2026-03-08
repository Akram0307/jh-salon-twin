import { query } from '../config/db';

const DEFAULT_SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

export type ServiceInput = {
  salon_id?: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  category?: string | null;
  is_active?: boolean;
};

export class ServiceRepository {
  static normalizeServiceName(input: string): string {
    return input
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static async findAll(salonId: string = DEFAULT_SALON_ID) {
    const res = await query(
      `SELECT *, COALESCE(category, 'General') AS category
       FROM services
       WHERE salon_id = $1
       ORDER BY COALESCE(category, 'General'), name`,
      [salonId]
    );
    return res.rows;
  }

  static async findById(id: string, salonId: string = DEFAULT_SALON_ID) {
    const res = await query('SELECT * FROM services WHERE id = $1 AND salon_id = $2', [id, salonId]);
    return res.rows[0];
  }

  static async findByName(name: string, salonId: string = DEFAULT_SALON_ID) {
    const normalized = this.normalizeServiceName(name);

    const res = await query(
      `SELECT * FROM services
       WHERE salon_id = $2
         AND regexp_replace(lower(name), '[^a-z0-9 ]', '', 'g') LIKE $1
       ORDER BY length(name)
       LIMIT 1`,
      [`%${normalized}%`, salonId]
    );

    return res.rows[0];
  }

  static async create(data: ServiceInput) {
    const salonId = data.salon_id || DEFAULT_SALON_ID;
    const res = await query(
      `INSERT INTO services (salon_id, name, description, duration_minutes, price, category, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, true))
       RETURNING *`,
      [
        salonId,
        data.name,
        data.description || null,
        data.duration_minutes,
        data.price,
        data.category || 'General',
        data.is_active,
      ]
    );
    return res.rows[0];
  }

  static async update(id: string, data: Partial<ServiceInput>, salonId: string = DEFAULT_SALON_ID) {
    const existing = await this.findById(id, salonId);
    if (!existing) return null;

    const res = await query(
      `UPDATE services
       SET name = $1,
           description = $2,
           duration_minutes = $3,
           price = $4,
           category = $5,
           is_active = $6
       WHERE id = $7 AND salon_id = $8
       RETURNING *`,
      [
        data.name ?? existing.name,
        data.description ?? existing.description,
        data.duration_minutes ?? existing.duration_minutes,
        data.price ?? existing.price,
        data.category ?? existing.category,
        data.is_active ?? existing.is_active,
        id,
        salonId,
      ]
    );
    return res.rows[0] || null;
  }
}
