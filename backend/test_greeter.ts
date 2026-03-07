import { handleIncomingMessage } from './src/agents/receptionist';
import { pool } from './src/config/db';

async function runTest() {
    try {
        const testPhone = 'whatsapp:+15550001111';
        
        console.log("\n[Test 1] New User - Initial Greeting");
        const res1 = await handleIncomingMessage(testPhone, 'Hi, I need a haircut');
        console.log("AI:", res1);

        console.log("\n[Test 2] New User - Providing Name");
        const res2 = await handleIncomingMessage(testPhone, 'My name is Test User');
        console.log("AI:", res2);

        console.log("\n[Test 3] Existing User - Asking for services");
        const res3 = await handleIncomingMessage(testPhone, 'What services do you offer?');
        console.log("AI:", res3);

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await pool.end();
    }
}

runTest();
