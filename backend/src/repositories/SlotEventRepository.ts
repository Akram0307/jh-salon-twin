import { pool } from '../config/db';
import type { JsonData } from '../types/repositoryTypes';

export class SlotEventRepository {

    static async createEvent(
        salonId: string,
        eventType: string,
        slotTime: string,
        metadata?: JsonData
    ) {
        const res = await pool.query(`
            INSERT INTO slot_events (salon_id, event_type, slot_time, metadata, processed)
            VALUES ($1, $2, $3, $4, false)
            RETURNING *
        `, [salonId, eventType, slotTime, metadata || null]);

        return res.rows[0];
    }

    static async getUnprocessedEvents(limit: number = 20) {
        const res = await pool.query(`
            SELECT * FROM slot_events
            WHERE processed = false
            ORDER BY created_at ASC
            LIMIT $1
        `, [limit]);

        return res.rows;
    }

    static async markProcessed(id: string) {
        const res = await pool.query(`
            UPDATE slot_events
            SET processed = true
            WHERE id = $1
            RETURNING *
        `, [id]);

        return res.rows[0];
    }
}
