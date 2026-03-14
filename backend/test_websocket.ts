import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8080/ws';
const TEST_SALON_ID = 'dc3a3381-b7f1-443d-b220-8e68fdcb6911';

async function testWebSocket() {
    console.log('🧪 Testing WebSocket Service...');
    
    return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`${WS_URL}?salon_id=${TEST_SALON_ID}&user_id=test-user`);
        
        ws.on('open', () => {
            console.log('✅ WebSocket connected');
            
            // Test 1: Send ping
            ws.send(JSON.stringify({ type: 'ping' }));
            
            // Test 2: Subscribe to channels
            setTimeout(() => {
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    channels: ['appointments', 'staff', 'bookings', 'dashboard']
                }));
            }, 100);
            
            // Test 3: Simulate appointment update (this would normally be triggered by the server)
            setTimeout(() => {
                console.log('📤 Sending test appointment update...');
                // In a real scenario, this would be triggered by the backend
                // For testing, we'll just log that we would send it
                console.log('ℹ️  In production, the server would broadcast appointment updates');
            }, 500);
        });
        
        ws.on('message', (data: Buffer) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📥 Received:', message.type);
                
                if (message.type === 'connected') {
                    console.log('✅ Connection confirmed:', message.payload);
                } else if (message.type === 'pong') {
                    console.log('✅ Pong received');
                } else if (message.type === 'subscribed') {
                    console.log('✅ Subscribed to channels:', message.payload.channels);
                }
            } catch (err) {
                console.error('Error parsing message:', err);
            }
        });
        
        ws.on('error', (err) => {
            console.error('❌ WebSocket error:', err);
            reject(err);
        });
        
        ws.on('close', () => {
            console.log('🔌 WebSocket disconnected');
            resolve();
        });
        
        // Close after 2 seconds
        setTimeout(() => {
            ws.close();
        }, 2000);
    });
}

// Run the test
testWebSocket()
    .then(() => {
        console.log('\n✅ WebSocket test completed successfully!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ WebSocket test failed:', err);
        process.exit(1);
    });
