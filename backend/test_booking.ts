import { handleIncomingMessage } from './src/agents/receptionist';
import { pool } from './src/config/db';
import { ClientRepository } from './src/repositories/ClientRepository';

async function runTests() {
    const phone = '+19998887778';
    const testPhone = 'whatsapp:' + phone;

    // Ensure client exists
    let client = await ClientRepository.findByPhone(phone);

    if (!client) {
        client = await ClientRepository.create({
            phone_number: phone,
            full_name: 'Test Client'
        });
        console.log('✅ Test client created:', client.id);
    } else {
        console.log('✅ Using existing client:', client.id);
    }

    console.log('--- Test: Full Booking Flow ---');

    console.log('\n[User]: Hi');
    let res = await handleIncomingMessage(testPhone, 'Hi');
    console.log('[Agent]:', res);

    console.log('\n[User]: John Doe');
    res = await handleIncomingMessage(testPhone, 'John Doe');
    console.log('[Agent]:', res);

    console.log('\n[User]: No preferences');
    res = await handleIncomingMessage(testPhone, 'No preferences');
    console.log('[Agent]:', res);

    console.log("\n[User]: I would like to book a Men's Haircut for tomorrow at 10:00 AM.");
    res = await handleIncomingMessage(testPhone, "I would like to book a Men's Haircut for tomorrow at 10:00 AM.");
    console.log('[Agent]:', res);

    const result = await pool.query(`
        SELECT a.id, a.appointment_time, a.status, s.name as service_name
        FROM appointments a
        JOIN clients c ON a.client_id = c.id
        JOIN appointment_services aps ON a.id = aps.appointment_id
        JOIN services s ON aps.service_id = s.id
        WHERE c.phone_number = $1
        ORDER BY a.created_at DESC LIMIT 1
    `, [phone]);

    if (result.rows.length > 0) {
        console.log('\n✅ Appointment successfully created in DB:');
        console.log(result.rows[0]);
    } else {
        console.log('\n❌ No appointment found in DB for this user.');
    }

    await pool.end();
}

runTests().catch(console.error);
