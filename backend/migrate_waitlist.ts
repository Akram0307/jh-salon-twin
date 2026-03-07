
import { pool } from './src/config/db';

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS waitlist_entries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
                preferred_date DATE NOT NULL,
                preferred_time_range VARCHAR(50) NOT NULL,
                notes TEXT,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'fulfilled', 'cancelled')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Waitlist table created successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit(0);
    }
}

migrate();
