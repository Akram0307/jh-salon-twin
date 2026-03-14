import { Pool, PoolConfig } from "pg";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (_pool) return _pool;

  const useCloudSqlSocket = !!process.env.INSTANCE_CONNECTION_NAME;
  const config: PoolConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  };

  if (useCloudSqlSocket) {
    config.host = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
  } else {
    config.host = process.env.DB_HOST || "localhost";
    config.port = parseInt(process.env.DB_PORT || "5432", 10);
  }

  if (!config.user || !config.password || !config.database || !config.host) {
    throw new Error("Database configuration incomplete");
  }

  _pool = new Pool(config);

  _pool.on("error", (err) => {
    console.error("Unexpected database error", err);
  });

  return _pool;
}

export async function query(text: string, params?: any[]) {
  return getPool().query(text, params);
}

export async function getClient() {
  return getPool().connect();
}

export const pool = {
  query: (text: string, params?: any[]) => getPool().query(text, params),
  connect: () => getPool().connect(),
  on: (event: "error" | "connect" | "acquire" | "release" | "remove", handler: Function) => getPool().on(event, handler as any),
  end: () => getPool().end(),
};

export default pool;
