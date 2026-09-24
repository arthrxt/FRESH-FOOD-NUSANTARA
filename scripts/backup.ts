import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to create a PostgreSQL backup.');

const backupDir = path.resolve(process.env.BACKUP_DIR || 'backups');
const retention = Math.max(1, Number(process.env.BACKUP_RETENTION || 14));
await fs.mkdir(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.join(backupDir, `ffn-accounting-${timestamp}.dump`);
await execFileAsync('pg_dump', ['--format=custom', '--no-owner', '--file', output, connectionString]);

const files = (await fs.readdir(backupDir))
  .filter((file) => file.endsWith('.dump'))
  .sort()
  .reverse();
for (const file of files.slice(retention)) {
  await fs.unlink(path.join(backupDir, file));
}

console.log(`Backup created: ${output}`);
