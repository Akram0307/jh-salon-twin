const { Client } = require('pg');
const bcrypt = require('bcrypt');

const DEMO_OWNER = {
  name: 'Demo Salon Owner',
  email: 'demo.owner@salonos.local',
  phone: '+919900000001',
  password: 'SalonOwner123'
};

async function createDemoOwner() {
  const client = new Client({
    host: '34.29.171.92',
    port: 5432,
    user: 'salon_admin',
    password: 'JHSalonAdmin123',
    database: 'postgres',
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if owner exists
    const existing = await client.query(
      'SELECT id, email FROM owners WHERE email = $1',
      [DEMO_OWNER.email]
    );

    if (existing.rows.length > 0) {
      console.log('Demo owner already exists:', existing.rows[0]);
      // Update password
      const hash = await bcrypt.hash(DEMO_OWNER.password, 10);
      await client.query(
        'UPDATE owners SET password_hash = $1 WHERE email = $2',
        [hash, DEMO_OWNER.email]
      );
      console.log('Password updated');
    } else {
      // Create new owner with password hash
      const hash = await bcrypt.hash(DEMO_OWNER.password, 10);
      const result = await client.query(
        'INSERT INTO owners (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
        [DEMO_OWNER.name, DEMO_OWNER.email, DEMO_OWNER.phone, hash]
      );
      console.log('Demo owner created with ID:', result.rows[0].id);
    }

    // Verify the owner
    const verify = await client.query(
      'SELECT id, email, password_hash FROM owners WHERE email = $1',
      [DEMO_OWNER.email]
    );
    console.log('Verified owner:', verify.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createDemoOwner();
