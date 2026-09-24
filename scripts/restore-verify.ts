import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const backup = process.argv[2];
if (!backup) throw new Error('Usage: npm run db:restore:verify -- <backup.dump>');

await execFileAsync('pg_restore', ['--list', backup]);
console.log(`Backup is readable and contains a valid PostgreSQL archive: ${backup}`);
