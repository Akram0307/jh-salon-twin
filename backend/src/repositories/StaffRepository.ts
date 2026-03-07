import { query } from '../config/db';

export class StaffRepository {
    static async findAll() {
        const res = await query('SELECT * FROM staff ORDER BY full_name');
        return res.rows;
    }

    static async findById(id: string) {
        const res = await query('SELECT * FROM staff WHERE id = $1', [id]);
        return res.rows[0];
    }

    static async findByName(name: string) {
        // Case-insensitive search, partial match supported
        const res = await query(
            'SELECT * FROM staff WHERE LOWER(full_name) LIKE LOWER($1) ORDER BY LENGTH(full_name) LIMIT 1',
            [`%${name}%`]
        );
        return res.rows[0];
    }

    static async create(data: any) {
        const res = await query(
            'INSERT INTO staff (full_name, email, phone_number, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [data.full_name, data.email, data.phone_number, data.role]
        );
        return res.rows[0];
    }
}
