# PostgreSQL runtime database

The production runtime uses PostgreSQL when `DATABASE_URL` is set. When
`NODE_ENV=production` and it is absent, startup fails; the JSON file is not a
production fallback. Local development, tests, and explicit JSON
import/export workflows may continue to use `data/ffn_accounting.json`.

Initialize or upgrade a database with:

```sh
DATABASE_URL=postgres://... npm run db:migrate
```

The migration command applies `schema.sql` and then versioned files in
`migrations/`. Runtime routes read and write the normalized PostgreSQL tables
(`users`, periods, COA, journals/lines, AR/AP documents and items, banks,
payouts, cashback, audit, sessions, and idempotency). The aggregate-shaped
TypeScript DTO is only a compatibility boundary for the existing handlers; it
is loaded from relational rows inside a transaction and is never persisted as
JSONB. JSON remains available only for explicit legacy import/export workflows.

Backups use PostgreSQL custom-format archives and retention:

```sh
DATABASE_URL=postgres://... BACKUP_RETENTION=14 npm run db:backup
npm run db:restore:verify -- backups/ffn-accounting-<timestamp>.dump
```

Restore must be performed into an isolated database by an operator using
`pg_restore`, followed by `npm run db:migrate` and application smoke tests.
The repository does not claim restore or deployment verification without a
reachable PostgreSQL environment.
