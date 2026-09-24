import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool, PoolClient } from 'pg';
import {
  AppUser,
  AccountingPeriod,
  ChartOfAccount,
  JournalEntry,
  SalesInvoice,
  SupplierBill,
  CompanyBankAccount,
  MonthlyInvestorPayout,
  CashbackReconciliationRecord,
  AuditLog,
  Session,
  IdempotencyRecord,
  SalesInvoicePayment,
  SupplierBillPayment,
  hashPassword,
} from './types';

// Initial Seeds from FFN Master Context
import {
  INITIAL_ACCOUNTS,
  INITIAL_JOURNALS,
  INITIAL_SALES_INVOICES,
  INITIAL_SUPPLIER_BILLS,
  INITIAL_COMPANY_BANKS,
  INITIAL_INVESTOR_PAYOUTS,
  INITIAL_PERIODS,
  INITIAL_CASHBACK_RECONCILIATION,
} from '../src/data/accountingData';

export interface DbData {
  users: AppUser[];
  sessions: Session[];
  periods: AccountingPeriod[];
  accounts: ChartOfAccount[];
  journals: JournalEntry[];
  invoices: SalesInvoice[];
  invoicePayments: SalesInvoicePayment[];
  bills: SupplierBill[];
  billPayments: SupplierBillPayment[];
  companyBanks: CompanyBankAccount[];
  investorPayouts: MonthlyInvestorPayout[];
  cashbackRecords: CashbackReconciliationRecord[];
  auditLogs: AuditLog[];
  idempotency: IdempotencyRecord[];
}

export interface IdempotencyClaim {
  state: 'CLAIMED' | 'REPLAY' | 'CONFLICT';
  record?: IdempotencyRecord;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ffn_accounting.json');

function resolveSeedPassword(name: string, fallback: string): string {
  const value = process.env[name];
  if (value && value.trim().length >= 12) return value.trim();
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable ${name} for production bootstrap.`);
  }
  return fallback;
}

class DatabaseStore {
  private data: DbData | undefined;
  private mutationQueue: Promise<unknown> = Promise.resolve();
  private readonly pool?: Pool;
  public readonly ready: Promise<void>;

  constructor() {
    if (process.env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: Number(process.env.DATABASE_POOL_MAX || 10),
        ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
      });
      this.ready = this.initializePostgres();
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('DATABASE_URL is required in production; refusing to use the JSON database.');
      }
      this.ensureDirectory();
      this.data = this.loadData();
      this.data.invoicePayments = this.data.invoicePayments || [];
      this.data.billPayments = this.data.billPayments || [];
      this.ready = Promise.resolve();
    }
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DbData {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, reinitializing', err);
      }
    }
    return this.seedInitialData();
  }

  private seedInitialData(persist = true): DbData {
    const masterPassword = resolveSeedPassword('FFN_MASTER_PASSWORD', 'ffn.dev.master.2026');
    const ownerPassword = resolveSeedPassword('FFN_OWNER_PASSWORD', 'ffn.dev.owner.2026');
    const accountingPassword = resolveSeedPassword('FFN_ACCOUNTING_PASSWORD', 'ffn.dev.accounting.2026');

    const defaultUsers: AppUser[] = [
      {
        id: 'user-master-arthur',
        username: 'arthur',
        passwordHash: hashPassword(masterPassword),
        fullName: 'Arthur',
        role: 'MASTER',
        roleTitle: 'Master Administrator & Head of Accounting',
        department: 'Fresh Food Nusantara - Accounting & Keuangan',
        email: 'arthur@ffoodnusantara.site',
        phone: '0812-8899-7711',
        isActive: true,
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        lastLogin: '2026-09-22T06:00:00Z',
      },
      {
        id: 'user-owner-ffn',
        username: 'owner',
        passwordHash: hashPassword(ownerPassword),
        fullName: 'Direksi / Pemilik FFN',
        role: 'OWNER',
        roleTitle: 'Business Owner & Executive Board',
        department: 'Executive Management Fresh Food Nusantara',
        email: 'owner@ffoodnusantara.site',
        phone: '0811-2233-4455',
        isActive: true,
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        lastLogin: '2026-09-21T18:30:00Z',
      },
      {
        id: 'user-acc-staff',
        username: 'akunting',
        passwordHash: hashPassword(accountingPassword),
        fullName: 'Staf Tim Akuntansi',
        role: 'ACCOUNTING',
        roleTitle: 'Staff Akuntansi & Operasional PO',
        department: 'Divisi Akuntansi dan Keuangan',
        email: 'akunting@ffoodnusantara.site',
        phone: '0813-4455-6677',
        isActive: true,
        createdAt: '2026-09-05T09:00:00Z',
        updatedAt: '2026-09-05T09:00:00Z',
        lastLogin: '2026-09-21T16:00:00Z',
      },
    ];

    const initialAccounts: ChartOfAccount[] = INITIAL_ACCOUNTS.map((a) => ({
      code: a.code,
      name: a.name,
      category: a.category,
      subcategory: a.subcategory,
      normalBalance: a.normalBalance,
      description: a.description,
      balance: a.balance,
      isActive: a.isActive,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    }));

    const initialPeriods: AccountingPeriod[] = INITIAL_PERIODS.map((p) => ({
      id: p.id,
      name: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      closedAt: p.closedAt,
      closedBy: p.closedBy,
      createdAt: '2026-09-01T00:00:00Z',
    }));

    const initialJournals: JournalEntry[] = INITIAL_JOURNALS.map((j) => ({
      id: j.id,
      entryNumber: j.entryNumber,
      periodId: 'per-2026-09',
      date: j.date,
      reference: j.reference,
      description: j.description,
      status: j.status,
      totalDebit: j.totalDebit,
      totalCredit: j.totalCredit,
      lines: j.lines,
      createdBy: j.createdBy,
      createdAt: j.createdAt,
      reversedByEntryNumber: j.reversedByEntryNumber,
      isReversalOfEntryNumber: j.isReversalOfEntryNumber,
    }));

    const initialInvoices: SalesInvoice[] = INITIAL_SALES_INVOICES.map((i: any) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      periodId: 'per-2026-09',
      sppgName: i.sppgName,
      date: i.date,
      dueDate: i.dueDate,
      period: i.period,
      subtotal: i.subtotal,
      cashbackCredit: i.cashbackCredit,
      titipanAmount: i.titipanAmount,
      returAdjustment: i.returAdjustment,
      netTotal: i.netTotal,
      paidAmount: i.paidAmount,
      status: i.status,
      items: i.items,
      journalEntryNumber: i.journalEntryNumber,
      notes: i.notes,
      createdAt: '2026-09-21T08:00:00Z',
      updatedAt: '2026-09-21T08:00:00Z',
    }));

    const initialBills: SupplierBill[] = INITIAL_SUPPLIER_BILLS.map((b: any) => ({
      id: b.id,
      billNumber: b.billNumber,
      periodId: 'per-2026-09',
      supplierName: b.supplierName,
      date: b.date,
      dueDate: b.dueDate,
      items: b.items,
      totalAmount: b.totalAmount,
      paidAmount: b.paidAmount,
      status: b.status,
      journalEntryNumber: b.journalEntryNumber,
      notes: b.notes,
      createdAt: '2026-09-20T08:00:00Z',
      updatedAt: '2026-09-20T08:00:00Z',
    }));

    const initialBanks: CompanyBankAccount[] = INITIAL_COMPANY_BANKS.map((b) => ({
      id: b.id,
      bankName: b.bankName,
      accountNumber: b.accountNumber,
      accountHolder: b.accountHolder,
      accountCode: b.accountCode,
      balance: b.balance,
      status: b.status,
      branch: b.branch,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    }));

    const initialInvestorPayouts: MonthlyInvestorPayout[] = INITIAL_INVESTOR_PAYOUTS.map((ip) => ({
      id: ip.id,
      investorName: ip.investorName,
      period: ip.period,
      investmentAmount: ip.investmentAmount,
      monthlyPayoutAmount: ip.monthlyPayoutAmount,
      dueDate: ip.dueDate,
      status: ip.status,
      paidDate: ip.paidDate,
      paidFromBank: ip.paidFromBank,
      paidFromAccountCode: ip.paidFromAccountCode,
      journalEntryNumber: ip.journalEntryNumber,
      notes: ip.notes,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    }));

    const initialCashback: CashbackReconciliationRecord[] = INITIAL_CASHBACK_RECONCILIATION.map((c: any) => ({
      id: c.id,
      periodId: 'per-2026-09',
      sppg: c.sppg,
      period: c.period,
      date: c.date,
      item: c.item,
      qty: c.qty,
      unit: c.unit,
      sppgPrice: c.sppgPrice,
      realPrice: c.realPrice,
      cashbackUnitDiff: c.cashbackUnitDiff,
      totalCashback: c.totalCashback,
      titipanAmount: c.titipanAmount,
      returAmount: c.returAmount,
      accountingStatus: c.accountingStatus,
      notes: c.notes,
      createdAt: '2026-09-21T08:00:00Z',
    }));

    const seeded: DbData = {
      users: defaultUsers,
      sessions: [],
      periods: initialPeriods,
      accounts: initialAccounts,
      journals: initialJournals,
      invoices: initialInvoices,
      invoicePayments: [],
      bills: initialBills,
      billPayments: [],
      companyBanks: initialBanks,
      investorPayouts: initialInvestorPayouts,
      cashbackRecords: initialCashback,
      auditLogs: [
        {
          id: 'audit-init-1',
          action: 'SYSTEM_BOOTSTRAP',
          resource: 'SYSTEM',
          resourceId: 'INIT',
          success: true,
          createdAt: new Date().toISOString(),
          beforeState: null,
          afterState: { status: 'INITIALIZED' },
        },
      ],
      idempotency: [],
    };

    if (persist) this.saveData(seeded);
    return seeded;
  }

  public saveData(customData?: DbData): void {
    const toSave = customData || this.requireData();
    if (this.pool) {
      void this.pool.connect().then(async (client) => {
        try { await client.query('BEGIN'); await this.persistNormalized(client, toSave); await client.query('COMMIT'); }
        catch (error) { await client.query('ROLLBACK'); console.error(error); }
        finally { client.release(); }
      });
      return;
    }
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(toSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to atomic write database file', err);
      throw new Error('Database persistence failed');
    }
  }

  public async transaction<T>(callback: (data: DbData) => Promise<T> | T): Promise<T> {
    const queued = this.mutationQueue.then(async () => {
      await this.ready;
      const snapshot = JSON.parse(JSON.stringify(this.requireData()));
      let client: PoolClient | undefined;
      try {
        if (this.pool) {
          client = await this.pool.connect();
          await client.query('BEGIN');
          // Lock the normalized rows participating in financial mutations.  The
          // aggregate is only an in-memory DTO for the legacy route contract;
          // PostgreSQL tables remain the source of truth.
          await client.query('SELECT id FROM accounting_periods FOR UPDATE');
          await client.query('SELECT code FROM chart_of_accounts FOR UPDATE');
          await client.query('SELECT id FROM sales_invoices FOR UPDATE');
          await client.query('SELECT id FROM supplier_bills FOR UPDATE');
          await client.query('SELECT id FROM company_banks FOR UPDATE');
          await client.query('SELECT id FROM investor_payouts FOR UPDATE');
          await client.query('SELECT id FROM cashback_records FOR UPDATE');
          this.data = await this.loadNormalized(client);
        }
        const result = await callback(this.requireData());
        if (this.pool) {
          await this.persistNormalized(client!, this.requireData());
          await client!.query('COMMIT');
        } else {
          this.saveData();
        }
        return result;
      } catch (error) {
        this.data = snapshot;
        if (client) await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client?.release();
      }
    });

    this.mutationQueue = queued.then(() => undefined, () => undefined);
    return queued as Promise<T>;
  }

  public getData(): DbData {
    return this.requireData();
  }

  public async claimIdempotency(
    key: string,
    userId: string,
    endpoint: string,
    requestHash: string
  ): Promise<IdempotencyClaim> {
    if (this.pool) {
      await this.ready;
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM idempotency_keys WHERE expires_at <= now()');
        const inserted = await client.query(
          `INSERT INTO idempotency_keys
            (key, user_id, endpoint, request_hash, status, response_body, status_code, expires_at)
           VALUES ($1, $2, $3, $4, 'PROCESSING', $5::jsonb, 202, now() + interval '24 hours')
           ON CONFLICT (key) DO NOTHING`,
          [key, userId, endpoint, requestHash, JSON.stringify({ success: false, data: { status: 'PROCESSING' } })]
        );
        const result = await client.query<IdempotencyRecord>(
          `SELECT key, user_id AS "userId", endpoint, request_hash AS "requestHash",
                  status, status_code AS "statusCode", response_body AS "responseBody",
                  created_at AS "createdAt", expires_at AS "expiresAt"
             FROM idempotency_keys WHERE key = $1 FOR UPDATE`,
          [key]
        );
        const record = result.rows[0];
        await client.query('COMMIT');
        if (inserted.rowCount === 1) return { state: 'CLAIMED', record };
        if (record.userId !== userId || record.endpoint !== endpoint || record.requestHash !== requestHash) {
          return { state: 'CONFLICT', record };
        }
        return { state: 'REPLAY', record };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    return this.transaction(async (db) => {
      const now = Date.now();
      const existing = db.idempotency.find((item) => item.key === key);
      if (existing && new Date(existing.expiresAt).getTime() > now) {
        if (existing.userId !== userId || existing.endpoint !== endpoint) {
          return { state: 'CONFLICT', record: existing };
        }
        if (existing.requestHash !== requestHash) {
          return { state: 'CONFLICT', record: existing };
        }
        return { state: 'REPLAY', record: existing };
      }

      const record: IdempotencyRecord = {
        key,
        userId,
        endpoint,
        requestHash,
        status: 'PROCESSING',
        statusCode: 202,
        responseBody: { success: false, data: { status: 'PROCESSING' } },
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      };
      const index = db.idempotency.findIndex((item) => item.key === key);
      if (index >= 0) db.idempotency[index] = record;
      else db.idempotency.push(record);
      return { state: 'CLAIMED', record };
    });
  }

  public async completeIdempotency(
    key: string,
    status: 'COMPLETED' | 'FAILED',
    statusCode: number,
    responseBody: unknown
  ): Promise<void> {
    if (this.pool) {
      await this.ready;
      await this.pool.query(
        `UPDATE idempotency_keys
            SET status = $2, status_code = $3, response_body = $4::jsonb
          WHERE key = $1`,
        [key, status, statusCode, JSON.stringify(responseBody)]
      );
      return;
    }
    await this.transaction((db) => {
      const record = db.idempotency.find((item) => item.key === key);
      if (!record) return;
      record.status = status;
      record.statusCode = statusCode;
      record.responseBody = responseBody;
    });
  }

  private requireData(): DbData {
    if (!this.data) throw new Error('Database is still initializing; await dbStore.ready before serving requests.');
    return this.data;
  }

  private async initializePostgres(): Promise<void> {
    const pool = this.pool!;
    const schema = fs.readFileSync(path.resolve(process.cwd(), 'schema.sql'), 'utf8');
    await pool.query(schema);
    const count = await pool.query<{ count: string }>('SELECT count(*) FROM users');
    if (Number(count.rows[0].count) === 0) {
      const seeded = this.seedInitialData(false);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await this.persistNormalized(client, seeded);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      this.data = seeded;
    } else {
      this.data = await this.loadNormalized(pool);
    }
  }

  private async loadNormalized(client: Pool | PoolClient): Promise<DbData> {
    const q = async (sql: string) => (await client.query(sql)).rows;
    const users = (await q(`SELECT id,username,password_hash AS "passwordHash",full_name AS "fullName",role,role_title AS "roleTitle",department,email,phone,is_active AS "isActive",created_at AS "createdAt",updated_at AS "updatedAt",last_login AS "lastLogin" FROM users`)) as AppUser[];
    const periods = (await q(`SELECT id,name,start_date AS "startDate",end_date AS "endDate",status,closed_at AS "closedAt",closed_by AS "closedBy",created_at AS "createdAt" FROM accounting_periods`)) as AccountingPeriod[];
    const accounts = (await q(`SELECT code,name,category,subcategory,normal_balance AS "normalBalance",description,balance,is_active AS "isActive",created_at AS "createdAt",updated_at AS "updatedAt" FROM chart_of_accounts`)) as ChartOfAccount[];
    const journals = (await q(`SELECT id,entry_number AS "entryNumber",period_id AS "periodId",date,reference,description,status,total_debit AS "totalDebit",total_credit AS "totalCredit",created_by AS "createdBy",created_at AS "createdAt",reversed_by_entry_number AS "reversedByEntryNumber",is_reversal_of_entry_number AS "isReversalOfEntryNumber" FROM journal_entries`)) as any[];
    const lines = await q(`SELECT id,journal_id AS "journalId",account_code AS "accountCode",account_name AS "accountName",debit,credit,memo,"party_name" AS "partyName" FROM journal_lines`);
    for (const j of journals) j.lines = lines.filter((l: any) => l.journalId === j.id);
    const invoices = (await q(`SELECT id,invoice_number AS "invoiceNumber",period_id AS "periodId",sppg_name AS "sppgName",date,due_date AS "dueDate",period,subtotal,cashback_credit AS "cashbackCredit",titipan_amount AS "titipanAmount",retur_adjustment AS "returAdjustment",net_total AS "netTotal",paid_amount AS "paidAmount",status,journal_entry_number AS "journalEntryNumber",notes,created_at AS "createdAt",updated_at AS "updatedAt" FROM sales_invoices`)) as any[];
    const invoiceItems = await q(`SELECT id,invoice_id AS "invoiceId",description,category,qty,unit,unit_price AS "unitPrice",total FROM sales_invoice_items`);
    for (const i of invoices) i.items = invoiceItems.filter((x: any) => x.invoiceId === i.id);
    const invoicePayments = (await q(`SELECT id,invoice_id AS "invoiceId",payment_number AS "paymentNumber",period_id AS "periodId",date,amount,destination_account_code AS "destinationAccountCode",journal_entry_number AS "journalEntryNumber",notes,created_by AS "createdBy",created_at AS "createdAt" FROM sales_invoice_payments`)) as SalesInvoicePayment[];
    const bills = (await q(`SELECT id,bill_number AS "billNumber",period_id AS "periodId",supplier_name AS "supplierName",date,due_date AS "dueDate",total_amount AS "totalAmount",paid_amount AS "paidAmount",status,journal_entry_number AS "journalEntryNumber",notes,created_at AS "createdAt",updated_at AS "updatedAt" FROM supplier_bills`)) as any[];
    const billItems = await q(`SELECT id,bill_id AS "billId",description,category,qty,unit,unit_price AS "unitPrice",total FROM supplier_bill_items`);
    for (const b of bills) b.items = billItems.filter((x: any) => x.billId === b.id);
    const billPayments = (await q(`SELECT id,bill_id AS "billId",payment_number AS "paymentNumber",period_id AS "periodId",date,amount,source_account_code AS "sourceAccountCode",journal_entry_number AS "journalEntryNumber",notes,created_by AS "createdBy",created_at AS "createdAt" FROM supplier_bill_payments`)) as SupplierBillPayment[];
    const companyBanks = (await q(`SELECT id,bank_name AS "bankName",account_number AS "accountNumber",account_holder AS "accountHolder",account_code AS "accountCode",balance,status,branch,created_at AS "createdAt",updated_at AS "updatedAt" FROM company_banks`)) as CompanyBankAccount[];
    const investorPayouts = (await q(`SELECT id,investor_name AS "investorName",period,investment_amount AS "investmentAmount",monthly_payout_amount AS "monthlyPayoutAmount",due_date AS "dueDate",status,paid_date AS "paidDate",paid_from_bank AS "paidFromBank",paid_from_account_code AS "paidFromAccountCode",journal_entry_number AS "journalEntryNumber",notes,created_at AS "createdAt",updated_at AS "updatedAt" FROM investor_payouts`)) as MonthlyInvestorPayout[];
    const cashbackRecords = (await q(`SELECT id,period_id AS "periodId",sppg,period,date,item,qty,unit,sppg_price AS "sppgPrice",real_price AS "realPrice",cashback_unit_diff AS "cashbackUnitDiff",total_cashback AS "totalCashback",titipan_amount AS "titipanAmount",retur_amount AS "returAmount",accounting_status AS "accountingStatus",journal_entry_number AS "journalEntryNumber",notes,created_at AS "createdAt" FROM cashback_records`)) as CashbackReconciliationRecord[];
    const auditLogs = (await q(`SELECT id::text,user_id AS "userId",action,resource,resource_id AS "resourceId",before_state AS "beforeState",after_state AS "afterState",ip_address AS "ipAddress",user_agent AS "userAgent",success,failure_reason AS "failureReason",created_at AS "createdAt" FROM audit_logs ORDER BY created_at DESC`)) as AuditLog[];
    const idempotency = (await q(`SELECT key,user_id AS "userId",endpoint,request_hash AS "requestHash",status,status_code AS "statusCode",response_body AS "responseBody",created_at AS "createdAt",expires_at AS "expiresAt" FROM idempotency_keys`)) as IdempotencyRecord[];
    const sessions = (await q(`SELECT id,user_id AS "userId",created_at AS "createdAt",expires_at AS "expiresAt",ip_address AS "ipAddress",user_agent AS "userAgent" FROM sessions`)) as Session[];
    const money = (value: unknown): number => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) throw new Error(`Invalid NUMERIC value returned by PostgreSQL: ${String(value)}`);
      return parsed;
    };
    for (const a of accounts) a.balance = money(a.balance);
    for (const j of journals) { j.totalDebit = money(j.totalDebit); j.totalCredit = money(j.totalCredit); for (const l of j.lines) { l.debit = money(l.debit); l.credit = money(l.credit); } }
    for (const i of invoices) { for (const key of ['subtotal','cashbackCredit','titipanAmount','returAdjustment','netTotal','paidAmount']) i[key] = money(i[key]); for (const x of i.items) { x.qty = money(x.qty); x.unitPrice = money(x.unitPrice); x.total = money(x.total); } }
    for (const b of bills) { b.totalAmount = money(b.totalAmount); b.paidAmount = money(b.paidAmount); for (const x of b.items) { x.qty = money(x.qty); x.unitPrice = money(x.unitPrice); x.total = money(x.total); } }
    for (const b of companyBanks) b.balance = money(b.balance);
    for (const p of investorPayouts) { p.investmentAmount = money(p.investmentAmount); p.monthlyPayoutAmount = money(p.monthlyPayoutAmount); }
    for (const c of cashbackRecords) for (const key of ['qty','sppgPrice','realPrice','cashbackUnitDiff','totalCashback','titipanAmount','returAmount']) (c as any)[key] = money((c as any)[key]);
    return { users, sessions, periods, accounts, journals, invoices, invoicePayments, bills, billPayments, companyBanks, investorPayouts, cashbackRecords, auditLogs, idempotency };
  }

  private async persistNormalized(client: PoolClient, data: DbData): Promise<void> {
    const run = (sql: string, values: unknown[] = []) => client.query(sql, values);
    for (const u of data.users) await run(`INSERT INTO users (id,username,password_hash,full_name,role,role_title,department,email,phone,is_active,created_at,updated_at,last_login) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO UPDATE SET username=EXCLUDED.username,password_hash=EXCLUDED.password_hash,full_name=EXCLUDED.full_name,role=EXCLUDED.role,role_title=EXCLUDED.role_title,department=EXCLUDED.department,email=EXCLUDED.email,phone=EXCLUDED.phone,is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at,last_login=EXCLUDED.last_login`, [u.id,u.username,u.passwordHash,u.fullName,u.role,u.roleTitle,u.department,u.email ?? null,u.phone ?? null,u.isActive,u.createdAt,u.updatedAt,u.lastLogin ?? null]);
    for (const p of data.periods) await run(`INSERT INTO accounting_periods (id,name,start_date,end_date,status,closed_at,closed_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,status=EXCLUDED.status,closed_at=EXCLUDED.closed_at,closed_by=EXCLUDED.closed_by`, [p.id,p.name,p.startDate,p.endDate,p.status,p.closedAt ?? null,p.closedBy ?? null,p.createdAt]);
    for (const a of data.accounts) await run(`INSERT INTO chart_of_accounts (code,name,category,subcategory,normal_balance,description,balance,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,subcategory=EXCLUDED.subcategory,normal_balance=EXCLUDED.normal_balance,description=EXCLUDED.description,balance=EXCLUDED.balance,is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at`, [a.code,a.name,a.category,a.subcategory,a.normalBalance,a.description ?? null,a.balance,a.isActive,a.createdAt,a.updatedAt]);
    for (const j of data.journals) {
      await run(`INSERT INTO journal_entries (id,entry_number,period_id,date,reference,description,status,total_debit,total_credit,created_by,created_at,reversed_by_entry_number,is_reversal_of_entry_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,total_debit=EXCLUDED.total_debit,total_credit=EXCLUDED.total_credit,reversed_by_entry_number=EXCLUDED.reversed_by_entry_number`, [j.id,j.entryNumber,j.periodId,j.date,j.reference,j.description,j.status,j.totalDebit,j.totalCredit,j.createdBy,j.createdAt,j.reversedByEntryNumber ?? null,j.isReversalOfEntryNumber ?? null]);
      for (const l of j.lines) await run(`INSERT INTO journal_lines (id,journal_id,account_code,account_name,debit,credit,memo,party_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO UPDATE SET debit=EXCLUDED.debit,credit=EXCLUDED.credit,memo=EXCLUDED.memo,party_name=EXCLUDED.party_name`, [l.id,j.id,l.accountCode,l.accountName,l.debit,l.credit,l.memo ?? null,l.partyName ?? null]);
    }
    for (const b of data.companyBanks) await run(`INSERT INTO company_banks (id,bank_name,account_number,account_holder,account_code,balance,status,branch,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO UPDATE SET balance=EXCLUDED.balance,status=EXCLUDED.status,updated_at=EXCLUDED.updated_at`, [b.id,b.bankName,b.accountNumber,b.accountHolder,b.accountCode,b.balance,b.status,b.branch ?? null,b.createdAt,b.updatedAt]);
    for (const i of data.invoices) {
      await run(`INSERT INTO sales_invoices (id,invoice_number,period_id,sppg_name,date,due_date,period,subtotal,cashback_credit,titipan_amount,retur_adjustment,net_total,paid_amount,status,journal_entry_number,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT (id) DO UPDATE SET paid_amount=EXCLUDED.paid_amount,status=EXCLUDED.status,updated_at=EXCLUDED.updated_at`, [i.id,i.invoiceNumber,i.periodId,i.sppgName,i.date,i.dueDate,i.period,i.subtotal,i.cashbackCredit,i.titipanAmount,i.returAdjustment,i.netTotal,i.paidAmount,i.status,i.journalEntryNumber ?? null,i.notes ?? null,i.createdAt,i.updatedAt]);
      for (const x of i.items) await run(`INSERT INTO sales_invoice_items (id,invoice_id,description,category,qty,unit,unit_price,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO UPDATE SET description=EXCLUDED.description,qty=EXCLUDED.qty,unit_price=EXCLUDED.unit_price,total=EXCLUDED.total`, [x.id,i.id,x.description,x.category,x.qty,x.unit,x.unitPrice,x.total]);
    }
    for (const b of data.bills) {
      await run(`INSERT INTO supplier_bills (id,bill_number,period_id,supplier_name,date,due_date,total_amount,paid_amount,status,journal_entry_number,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO UPDATE SET paid_amount=EXCLUDED.paid_amount,status=EXCLUDED.status,updated_at=EXCLUDED.updated_at`, [b.id,b.billNumber,b.periodId,b.supplierName,b.date,b.dueDate,b.totalAmount,b.paidAmount,b.status,b.journalEntryNumber ?? null,b.notes ?? null,b.createdAt,b.updatedAt]);
      for (const x of b.items) await run(`INSERT INTO supplier_bill_items (id,bill_id,description,category,qty,unit,unit_price,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO UPDATE SET description=EXCLUDED.description,qty=EXCLUDED.qty,unit_price=EXCLUDED.unit_price,total=EXCLUDED.total`, [x.id,b.id,x.description,x.category,x.qty,x.unit,x.unitPrice,x.total]);
    }
    for (const p of data.invoicePayments) await run(`INSERT INTO sales_invoice_payments (id,invoice_id,payment_number,period_id,date,amount,destination_account_code,journal_entry_number,notes,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`, [p.id,p.invoiceId,p.paymentNumber,p.periodId,p.date,p.amount,p.destinationAccountCode,p.journalEntryNumber ?? null,p.notes ?? null,p.createdBy,p.createdAt]);
    for (const p of data.billPayments) await run(`INSERT INTO supplier_bill_payments (id,bill_id,payment_number,period_id,date,amount,source_account_code,journal_entry_number,notes,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`, [p.id,p.billId,p.paymentNumber,p.periodId,p.date,p.amount,p.sourceAccountCode,p.journalEntryNumber ?? null,p.notes ?? null,p.createdBy,p.createdAt]);
    for (const p of data.investorPayouts) await run(`INSERT INTO investor_payouts (id,investor_name,period,investment_amount,monthly_payout_amount,due_date,status,paid_date,paid_from_bank,paid_from_account_code,journal_entry_number,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,paid_date=EXCLUDED.paid_date,paid_from_bank=EXCLUDED.paid_from_bank,paid_from_account_code=EXCLUDED.paid_from_account_code,updated_at=EXCLUDED.updated_at`, [p.id,p.investorName,p.period,p.investmentAmount,p.monthlyPayoutAmount,p.dueDate,p.status,p.paidDate ?? null,p.paidFromBank ?? null,p.paidFromAccountCode ?? null,p.journalEntryNumber ?? null,p.notes ?? null,p.createdAt,p.updatedAt]);
    for (const c of data.cashbackRecords) await run(`INSERT INTO cashback_records (id,period_id,sppg,period,date,item,qty,unit,sppg_price,real_price,cashback_unit_diff,total_cashback,titipan_amount,retur_amount,accounting_status,journal_entry_number,notes,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT (id) DO UPDATE SET accounting_status=EXCLUDED.accounting_status,journal_entry_number=EXCLUDED.journal_entry_number,notes=EXCLUDED.notes`, [c.id,c.periodId,c.sppg,c.period,c.date,c.item,c.qty,c.unit,c.sppgPrice,c.realPrice,c.cashbackUnitDiff,c.totalCashback,c.titipanAmount,c.returAmount,c.accountingStatus,c.journalEntryNumber ?? null,c.notes ?? null,c.createdAt]);
    for (const s of data.sessions) await run(`INSERT INTO sessions (id,user_id,created_at,expires_at,ip_address,user_agent) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO UPDATE SET expires_at=EXCLUDED.expires_at`, [s.id,s.userId,s.createdAt,s.expiresAt,s.ipAddress ?? null,s.userAgent ?? null]);
    for (const a of data.auditLogs) await run(`INSERT INTO audit_logs (user_id,action,resource,resource_id,before_state,after_state,ip_address,user_agent,success,failure_reason,created_at) SELECT $1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,$10,$11 WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE action=$2 AND resource=$3 AND resource_id IS NOT DISTINCT FROM $4 AND created_at=$11)`, [a.userId ?? null,a.action,a.resource,a.resourceId ?? null,JSON.stringify(a.beforeState ?? null),JSON.stringify(a.afterState ?? null),a.ipAddress ?? null,a.userAgent ?? null,a.success,a.failureReason ?? null,a.createdAt]);
    for (const i of data.idempotency) await run(`INSERT INTO idempotency_keys (key,user_id,endpoint,request_hash,status,response_body,status_code,created_at,expires_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9) ON CONFLICT (key) DO UPDATE SET status=EXCLUDED.status,response_body=EXCLUDED.response_body,status_code=EXCLUDED.status_code`, [i.key,i.userId,i.endpoint,i.requestHash,i.status,JSON.stringify(i.responseBody ?? null),i.statusCode,i.createdAt,i.expiresAt]);
  }
}

export const dbStore = new DatabaseStore();
