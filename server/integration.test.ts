import { spawn } from 'child_process';

if (!process.env.DATABASE_URL) {
  console.log('NOT TESTABLE: DATABASE_URL is not configured; no fake integration result was produced.');
} else {
  const port = 4317;
  const child = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server.ts'], {
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test' },
    stdio: 'ignore',
  });
  let cookie = '';
  const request = async (path: string, init: RequestInit = {}) => {
    const requestHeaders = new Headers(init.headers);
    if (cookie) requestHeaders.set('Cookie', cookie);
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { ...init, headers: requestHeaders });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';', 1)[0];
    const body = await response.json() as any;
    if (!response.ok || body.success === false) throw new Error(`${path}: ${JSON.stringify(body)}`);
    return body.data;
  };
  try {
    let ready = false;
    for (let attempt = 0; attempt < 40 && !ready; attempt += 1) {
      try {
        await request('/api/health');
        ready = true;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    if (!ready) throw new Error('server did not become ready');

    const password = process.env.FFN_ACCOUNTING_PASSWORD || 'ffn.dev.accounting.2026';
    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'akunting', password }),
    });
    const headers = {
      'Content-Type': 'application/json',
    };

    const code = `9-TEST-${Date.now()}`;
    const account = await request('/api/accounts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code,
        name: 'Integration test account',
        category: 'EXPENSE',
        subcategory: 'TEST',
        normalBalance: 'DEBIT',
      }),
    });
    if (account.code !== code) throw new Error('normalized account mutation did not round-trip');

    const journalPayload = {
      date: '2026-09-24',
      periodId: 'per-2026-09',
      reference: `INTEGRATION-${Date.now()}`,
      description: 'Concurrent PostgreSQL integration journal',
      lines: [
        { accountCode: '1-1100', debit: 100, credit: 0 },
        { accountCode: '4-1100', debit: 0, credit: 100 },
      ],
    };
    const key = `integration-journal-${Date.now()}`;
    const responses = await Promise.all(
      Array.from({ length: 20 }, () => fetch(`http://127.0.0.1:${port}/api/journals`, {
        method: 'POST',
        headers: { ...headers, Cookie: cookie, 'Idempotency-Key': key },
        body: JSON.stringify(journalPayload),
      }).then(async (response) => ({ status: response.status, body: await response.json() as any })))
    );
    const successfulResponses = responses.filter((item) => item.body?.success === true);
    if (successfulResponses.length > 1) {
      throw new Error(`expected at most one successful journal response, got ${successfulResponses.length}`);
    }

    const bootstrap = await request('/api/accounting/bootstrap', { headers });
    if (!bootstrap.accounts.some((item: any) => item.code === code)) {
      throw new Error('normalized account read did not return mutation');
    }
    const journalCount = bootstrap.journals.filter(
      (journal: any) => journal.reference === journalPayload.reference
    ).length;
    if (journalCount !== 1) throw new Error(`expected one persisted journal, got ${journalCount}`);
    console.log('REAL PostgreSQL HTTP integration tests passed: normalized account and 20-way journal concurrency.');
  } finally {
    child.kill();
  }
}
