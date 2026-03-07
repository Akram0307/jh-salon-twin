import { pool } from './src/config/db';

async function checkData() {
    const services = await pool.query('SELECT * FROM services');
    console.log('--- Services ---');
    console.log(services.rows);

    const staff = await pool.query('SELECT * FROM staff');
    console.log('\n--- Staff ---');
    console.log(staff.rows);

    await pool.end();
}

checkData().catch(console.error);
