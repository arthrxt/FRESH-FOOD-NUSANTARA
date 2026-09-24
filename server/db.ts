import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

interface DbData {
  users: AppUser[];
  sessions: Session[];
  periods: AccountingPeriod[];
  accounts: ChartOfAccount[];
  journals: JournalEntry[];
  invoices: SalesInvoice[];
  bills: SupplierBill[];
  companyBanks: CompanyBankAccount[];
  investorPayouts: MonthlyInvestorPayout[];
  cashbackRecords: CashbackReconciliationRecord[];
  auditLogs: AuditLog[];
  idempotency: IdempotencyRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ffn_accounting.json');

class DatabaseStore {
  private data: DbData;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
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

  private seedInitialData(): DbData {
    const defaultUsers: AppUser[] = [
      {
        id: 'user-master-arthur',
        username: 'arthur',
        passwordHash: hashPassword('ffn.arthur.master2026'),
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
        passwordHash: hashPassword('owner.ffn.sumedang'),
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
        passwordHash: hashPassword('akunting.ffn2026'),
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
      bills: initialBills,
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

    this.saveData(seeded);
    return seeded;
  }

  public saveData(customData?: DbData): void {
    const toSave = customData || this.data;
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
    const snapshot = JSON.parse(JSON.stringify(this.data));
    try {
      const result = await callback(this.data);
      this.saveData();
      return result;
    } catch (error) {
      this.data = snapshot;
      throw error;
    }
  }

  public getData(): DbData {
    return this.data;
  }
}

export const dbStore = new DatabaseStore();
