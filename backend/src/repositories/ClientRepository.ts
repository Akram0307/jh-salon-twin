import { query } from '../config/db';

export class ClientRepository {
    static async findAll() {
        const res = await query('SELECT * FROM clients ORDER BY created_at DESC');
        return res.rows;
    }

    static async findByPhone(phone: string) {
        const res = await query('SELECT * FROM clients WHERE phone_number = $1', [phone]);
        return res.rows[0];
    }

    static async create(data: any) {
        const salonId = data.salon_id || process.env.SALON_ID;

        if (!salonId) {
            throw new Error('SALON_ID environment variable not set and salon_id not provided');
        }

        const res = await query(
            `INSERT INTO clients (salon_id, phone_number, full_name, preferences)
             VALUES ($1,$2,$3,$4)
             RETURNING *`,
            [
                salonId,
                data.phone_number,
                data.full_name,
                data.preferences || null
            ]
        );

        return res.rows[0];
    }
}
