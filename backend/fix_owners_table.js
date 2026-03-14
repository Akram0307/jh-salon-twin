const { Client } = require('pg');

async function fixOwnersTable() {
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

    // Check if unique constraint exists
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'owners' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%email%'
    `);

    if (constraintCheck.rows.length === 0) {
      console.log('Adding unique constraint on email column...');
      try {
        await client.query('ALTER TABLE owners ADD CONSTRAINT owners_email_unique UNIQUE (email)');
        console.log('Unique constraint added successfully');
      } catch (e) {
        console.log('Constraint may already exist or error:', e.message);
      }
    } else {
      console.log('Unique constraint already exists:', constraintCheck.rows);
    }

    // Check current owners
    const owners = await client.query('SELECT id, email, name FROM owners');
    console.log('Current owners:', owners.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixOwnersTable();
