import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to run migrations.');

const pool = new Pool({ connectionString });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const schema = await fs.readFile(path.resolve('schema.sql'), 'utf8');
  await client.query(schema);
  const migrationDir = path.resolve('migrations');
  const files = (await fs.readdir(migrationDir)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version]);
    if (applied.rowCount) continue;
    await client.query(await fs.readFile(path.join(migrationDir, file), 'utf8'));
    await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
  }
  await client.query('COMMIT');
  console.log('PostgreSQL migrations applied.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
