import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Koneksi PostgreSQL Production Engine
const databaseUrl = process.env.DATABASE_URL;

export const pgPool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : null;

export async function isPgAvailable(): Promise<boolean> {
  if (!pgPool) return false;
  try {
    const client = await pgPool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (err) {
    console.warn('[PostgreSQL Engine] Not reachable, falling back to ACID file-backed store:', (err as Error).message);
    return false;
  }
}

export async function withPgTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  if (!pgPool) throw new Error('PostgreSQL Pool is not initialized');
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
