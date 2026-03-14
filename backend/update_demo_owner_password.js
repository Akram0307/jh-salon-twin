const { Client } = require('pg');

const DEMO_OWNER_EMAIL = 'demo.owner@salonos.local';
const NEW_PASSWORD_HASH = '$2b$10$TJgyufHICKYrQbodyunwbeChi7RCdcPyWZHDXd7KFGDujB45TIro.';

async function updatePassword() {
  const client = new Client({
    host: '34.29.171.92', // Cloud SQL public IP
    port: 5432,
    user: process.env.DB_USER || 'salon_admin',
    password: process.env.DB_PASSWORD || 'JHSalonAdmin123',
    database: process.env.DB_NAME || 'postgres',
    connectionTimeoutMillis: 10000,
    ssl: false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if the owner exists
    const checkResult = await client.query(
      'SELECT id, email, password_hash FROM owners WHERE email = $1',
      [DEMO_OWNER_EMAIL]
    );

    if (checkResult.rows.length === 0) {
      console.log(`Owner with email ${DEMO_OWNER_EMAIL} not found.`);
      return;
    }

    const owner = checkResult.rows[0];
    console.log('Found owner:', owner);

    // Update the password hash
    const updateResult = await client.query(
      'UPDATE owners SET password_hash = $1 WHERE email = $2',
      [NEW_PASSWORD_HASH, DEMO_OWNER_EMAIL]
    );

    console.log('Update result:', updateResult);

    // Verify the update
    const verifyResult = await client.query(
      'SELECT id, email, password_hash FROM owners WHERE email = $1',
      [DEMO_OWNER_EMAIL]
    );

    console.log('Updated owner:', verifyResult.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

updatePassword();
