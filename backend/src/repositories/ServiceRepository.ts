import { query } from '../config/db';

export class ServiceRepository {

    static normalizeServiceName(input: string): string {
        return input
            .toLowerCase()
            .replace(/[’']/g, "")
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    static async findAll() {
        const res = await query('SELECT * FROM services ORDER BY category, name');
        return res.rows;
    }

    static async findById(id: string) {
        const res = await query('SELECT * FROM services WHERE id = $1', [id]);
        return res.rows[0];
    }

    static async findByName(name: string) {
        const normalized = this.normalizeServiceName(name);

        const res = await query(
            `SELECT * FROM services
             WHERE regexp_replace(lower(name), '[^a-z0-9 ]', '', 'g') LIKE $1
             ORDER BY length(name)
             LIMIT 1`,
            [`%${normalized}%`]
        );

        return res.rows[0];
    }

    static async create(data: any) {
        const res = await query(
            'INSERT INTO services (name, description, duration_minutes, price, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [data.name, data.description, data.duration_minutes, data.price, data.category]
        );
        return res.rows[0];
    }
}
