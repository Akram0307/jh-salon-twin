import { Pool } from 'pg';

function buildConfig() {
  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL configuration');

    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  }

  if (process.env.INSTANCE_CONNECTION_NAME) {
    console.log('Using Cloud SQL socket connection');

    return {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
      max: 10,
    };
  }

  console.warn('Falling back to standard DB_* environment variables');

  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 5432,
    ssl: false,
  };
}

export const pool = new Pool(buildConfig());

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('PostgreSQL error:', err);
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export default pool;
