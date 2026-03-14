import dotenv from 'dotenv';
dotenv.config();

import { pool } from './src/config/db';

async function migrate() {
    try {
        console.log('Running settings tables migration...');
        
        // Read the migration file
        const fs = require('fs');
        const path = require('path');
        const migrationPath = path.join(__dirname, '../db/migrations/20260314_add_settings_tables.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        await pool.query(sql);
        console.log('✅ Settings tables migration completed successfully.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

migrate();
