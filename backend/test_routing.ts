import { handleIncomingMessage } from './src/agents/receptionist';
import { pool } from './src/config/db';

async function runTests() {
    const testPhone = 'whatsapp:+1234567890';

    console.log('--- Test 1: General Inquiry ---');
    const res1 = await handleIncomingMessage(testPhone, 'What are your business hours?');
    console.log('Response:', res1);

    console.log('\n--- Test 2: Booking Request ---');
    const res2 = await handleIncomingMessage(testPhone, 'I want to book a haircut for tomorrow at 2 PM.');
    console.log('Response:', res2);

    console.log('\n--- Test 3: Escalation ---');
    const res3 = await handleIncomingMessage(testPhone, 'I am very unhappy with my last haircut, I want to speak to a manager immediately!');
    console.log('Response:', res3);

    if (pool.end) await pool.end();
}

runTests().catch(console.error);
