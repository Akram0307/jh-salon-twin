import { query } from './src/config/db';
async function checkDb() {
    try {
        const services = await query('SELECT * FROM services');
        const staff = await query('SELECT * FROM staff');
        console.log('Services:', services.rows);
        console.log('Staff:', staff.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
checkDb();
