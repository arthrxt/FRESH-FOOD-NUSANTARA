import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { dbStore } from './server/db';
import {
  hashPassword,
  verifyPassword,
  AppUser,
  JournalEntry,
  SalesInvoice,
  SupplierBill,
  CompanyBankAccount,
  MonthlyInvestorPayout,
  CashbackReconciliationRecord,
  ChartOfAccount,
  AccountingPeriod,
} from './server/types';
import { authMiddleware, requireRole, idempotencyMiddleware, AuthenticatedRequest } from './server/middleware';
import { AccountingService } from './server/accountingService';

const app = express();
const PORT = process.env.PORT || 3000;

function resolvePeriodId(db: any, requestedPeriodId?: string): string {
  if (requestedPeriodId) return requestedPeriodId;
  const openPeriod = db.periods.find((period: AccountingPeriod) => period.status === 'OPEN');
  if (openPeriod) return openPeriod.id;
  if (db.periods.length > 0) return db.periods[0].id;
  throw new Error('Tidak ada periode akuntansi aktif yang tersedia.');
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function shortCode(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

// Security Headers (OWASP Hardening)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use(express.json({ limit: '5mb' }));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err && (err as any).status === 400 && (err as any).type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Request body tidak valid JSON.',
      },
    });
  }
  next(err);
});

// Helper parser cookie sederhana
app.use((req: any, res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((c: string) => {
      const parts = c.trim().split('=');
      if (parts.length === 2) {
        req.cookies[parts[0]] = decodeURIComponent(parts[1]);
      }
    });
  }
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (!req.cookies?.['ffn_session']) return next();
  const origin = req.headers.origin;
  if (!origin) return next();
  const expectedOrigin = `${req.protocol}://${req.get('host')}`;
  const configuredOrigin = process.env.APP_ORIGIN;
  if (origin !== expectedOrigin && origin !== configuredOrigin) {
    return res.status(403).json({
      success: false,
      error: { code: 'CSRF_ORIGIN_REJECTED', message: 'Origin request tidak diizinkan.' },
    });
  }
  next();
});

const loginAttempts = new Map<string, { count: number; firstFailedAt: number }>();

function sanitizeAuditState<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditState(item)) as T;
  if (typeof value === 'object') {
    const clone: Record<string, any> = {};
    for (const [key, itemValue] of Object.entries(value as Record<string, any>)) {
      if (key === 'passwordHash' || key === 'password' || key === 'passwordSalt' || key === 'token') {
        continue;
      }
      clone[key] = sanitizeAuditState(itemValue);
    }
    return clone as T;
  }
  return value;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  return req.socket.remoteAddress || '127.0.0.1';
}

function loginRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry && now - entry.firstFailedAt < 15 * 60 * 1000) {
    if (entry.count >= 5) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.' },
      });
    }
  }

  if (!entry || now - entry.firstFailedAt >= 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 0, firstFailedAt: now });
  }

  next();
}

function recordAuditLog(
  userId: string | undefined,
  action: string,
  resource: string,
  resourceId: string | undefined,
  success: boolean,
  req: Request,
  beforeState?: any,
  afterState?: any,
  failureReason?: string
) {
  const db = dbStore.getData();
  const log = {
    id: `audit-${crypto.randomUUID()}`,
    userId,
    action,
    resource,
    resourceId,
    beforeState: sanitizeAuditState(beforeState) || null,
    afterState: sanitizeAuditState(afterState) || null,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'] || 'Unknown',
    success,
    failureReason,
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
}

// -------------------------------------------------------------
// 1. HEALTH CHECK & SYSTEM READINESS
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Fresh Food Nusantara (FFN) Accounting Core',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dbRecords: {
      users: dbStore.getData().users.length,
      accounts: dbStore.getData().accounts.length,
      journals: dbStore.getData().journals.length,
      invoices: dbStore.getData().invoices.length,
      bills: dbStore.getData().bills.length,
    },
  });
});

// -------------------------------------------------------------
// 2. AUTHENTICATION & SESSION ENDPOINTS
// -------------------------------------------------------------
app.post('/api/auth/login', loginRateLimit, async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanUsername || !cleanPassword) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Username dan password wajib diisi.' },
    });
  }

  const ip = getClientIp(req);
  const currentAttempt = loginAttempts.get(ip) || { count: 0, firstFailedAt: Date.now() };
  const db = dbStore.getData();
  const user = db.users.find((u) => u.username.toLowerCase() === cleanUsername);

  if (!user || !user.isActive) {
    currentAttempt.count += 1;
    loginAttempts.set(ip, currentAttempt);
    recordAuditLog(undefined, 'LOGIN_FAILED', 'USER', cleanUsername, false, req, null, null, 'User tidak ditemukan atau nonaktif');
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_FAILED', message: 'Username atau password salah, atau akun Anda nonaktif.' },
    });
  }

  const isPasswordValid = verifyPassword(cleanPassword, user.passwordHash);
  if (!isPasswordValid) {
    currentAttempt.count += 1;
    loginAttempts.set(ip, currentAttempt);
    recordAuditLog(user.id, 'LOGIN_FAILED', 'USER', user.username, false, req, null, null, 'Password salah');
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_FAILED', message: 'Username atau password salah, atau akun Anda nonaktif.' },
    });
  }

  loginAttempts.delete(ip);

  const sessionId = `sess_${crypto.randomBytes(32).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await dbStore.transaction((state) => {
    const currentUser = state.users.find((candidate) => candidate.id === user.id);
    if (!currentUser || !currentUser.isActive) {
      throw new Error('Akun tidak aktif.');
    }
    state.sessions.push({
      id: sessionId,
      userId: user.id,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
    });
    currentUser.lastLogin = now.toISOString();
  });

  recordAuditLog(user.id, 'LOGIN', 'USER', user.username, true, req);
  dbStore.saveData();

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieValue = `ffn_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}${isProduction ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieValue);

  const { passwordHash, ...safeUser } = user;
  return res.json({ success: true, data: { user: safeUser } });
});

app.post('/api/auth/logout', authMiddleware, async (req: AuthenticatedRequest, res) => {
  await dbStore.transaction((db) => {
    db.sessions = db.sessions.filter((s) => s.id !== req.sessionId);
  });

  recordAuditLog(req.user?.id, 'LOGOUT', 'USER', req.user?.username, true, req);
  dbStore.saveData();
  res.setHeader('Set-Cookie', 'ffn_session=; Path=/; HttpOnly; Max-Age=0');
  res.json({ success: true, message: 'Berhasil keluar dari sistem.' });
});

app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false });
  const { passwordHash, ...safeUser } = req.user;
  res.json({ success: true, data: safeUser });
});

// -------------------------------------------------------------
// 3. MASTER DATA ENDPOINTS (READ ALL STATE FOR CLIENT)
// -------------------------------------------------------------
app.get('/api/accounting/bootstrap', authMiddleware, (req: AuthenticatedRequest, res) => {
  const db = dbStore.getData();
  const safeUsers = db.users.map(({ passwordHash, ...u }) => u);

  res.json({
    success: true,
    data: {
      periods: db.periods,
      accounts: db.accounts,
      journals: db.journals,
      invoices: db.invoices,
      bills: db.bills,
      companyBanks: db.companyBanks,
      investorPayouts: db.investorPayouts,
      cashbackRecords: db.cashbackRecords,
      users: safeUsers,
    },
  });
});

// -------------------------------------------------------------
// 4. PERIODS MANAGEMENT
// -------------------------------------------------------------
app.post('/api/periods/lock', authMiddleware, requireRole(['MASTER', 'ACCOUNTING']), async (req: AuthenticatedRequest, res) => {
  const { periodId } = req.body;
  try {
    const updatedPeriod = await dbStore.transaction((db) => {
      const period = db.periods.find((p) => p.id === periodId);
      if (!period) throw new Error('Periode tidak ditemukan.');
      if (period.status !== 'OPEN' && req.user?.role !== 'MASTER') {
        throw new Error('Hanya MASTER yang dapat membuka kembali periode terkunci/tertutup.');
      }

      const before = { ...period };
      period.status = period.status === 'OPEN' ? 'LOCKED' : 'OPEN';
      period.closedAt = period.status === 'LOCKED' ? new Date().toISOString() : undefined;
      period.closedBy = period.status === 'LOCKED' ? req.user?.id : undefined;

      recordAuditLog(
        req.user?.id,
        period.status === 'LOCKED' ? 'PERIOD_LOCKED' : 'PERIOD_UNLOCKED',
        'ACCOUNTING_PERIOD',
        period.id,
        true,
        req,
        before,
        period
      );

      return period;
    });

    res.json({ success: true, data: updatedPeriod });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'PERIOD_ERROR', message: error.message } });
  }
});

// -------------------------------------------------------------
// 5. CHART OF ACCOUNTS (COA)
// -------------------------------------------------------------
app.post('/api/accounts', authMiddleware, requireRole(['MASTER', 'ACCOUNTING']), async (req: AuthenticatedRequest, res) => {
  const { code, name, category, subcategory, normalBalance, description } = req.body;

  try {
    const newAccount = await dbStore.transaction((db) => {
      const exists = db.accounts.find((a) => a.code === code);
      if (exists) throw new Error(`Akun dengan kode '${code}' sudah terdaftar.`);

      const account: ChartOfAccount = {
        code,
        name,
        category,
        subcategory,
        normalBalance,
        description: description || '',
        balance: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.accounts.push(account);
      recordAuditLog(req.user?.id, 'COA_CREATED', 'COA', code, true, req, null, account);
      return account;
    });

    res.json({ success: true, data: newAccount });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'COA_ERROR', message: error.message } });
  }
});

// -------------------------------------------------------------
// 6. GENERAL LEDGER & JOURNALS
// -------------------------------------------------------------
app.post('/api/journals', authMiddleware, requireRole(['MASTER', 'ACCOUNTING']), idempotencyMiddleware, async (req: AuthenticatedRequest, res) => {
  const { date, reference, description, lines, periodId } = req.body;

  try {
    const newEntry = await dbStore.transaction((db) => {
      const activePeriod = AccountingService.validatePeriod(periodId || 'per-2026-09');
      AccountingService.validateTransactionDate(activePeriod, date);
      const { totalDebit, totalCredit } = AccountingService.validateBalancedJournal(lines);

      const entryNumber = AccountingService.generateJournalNumber(date);
      const entry: JournalEntry = {
        id: newId('je'),
        entryNumber,
        periodId: activePeriod.id,
        date,
        reference: reference || 'INTERNAL',
        description,
        status: 'POSTED',
        totalDebit,
        totalCredit,
        lines: lines.map((l: any) => ({
          id: newId('jl'),
          accountCode: l.accountCode,
          accountName: l.accountName || l.accountCode,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          memo: l.memo,
          partyName: l.partyName,
        })),
        createdBy: req.user?.fullName || 'Arthur',
        createdAt: new Date().toISOString(),
      };

      AccountingService.updateAccountBalances(db.accounts, entry.lines, 1);
      db.journals.unshift(entry);

      recordAuditLog(req.user?.id, 'JOURNAL_CREATED', 'JOURNAL', entry.entryNumber, true, req, null, entry);
      return entry;
    });

    res.json({ success: true, data: newEntry });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'JOURNAL_POST_ERROR', message: error.message } });
  }
});

app.post('/api/journals/reverse', authMiddleware, requireRole(['MASTER', 'ACCOUNTING']), async (req: AuthenticatedRequest, res) => {
  const { journalId, reason } = req.body;

  try {
    const reversal = await dbStore.transaction((db) => {
      const original = db.journals.find((j) => j.id === journalId);
      if (!original) throw new Error('Jurnal tidak ditemukan.');
      if (original.status === 'REVERSED') throw new Error('Jurnal ini sudah pernah dibatalkan (dibalik).');
      if (original.status !== 'POSTED') throw new Error('Hanya jurnal POSTED yang dapat dibalik.');

      const reversalDate = new Date().toISOString().substring(0, 10);
      const originalPeriod = AccountingService.validatePeriod(original.periodId);
      AccountingService.validateTransactionDate(originalPeriod, reversalDate);
      const reversalNumber = AccountingService.generateJournalNumber(reversalDate);

      // Baris pembalik: debit jadi kredit, kredit jadi debit
      const reversedLines = original.lines.map((l) => ({
        id: newId('jl-rev'),
        accountCode: l.accountCode,
        accountName: l.accountName,
        debit: l.credit,
        credit: l.debit,
        memo: `[PEMBALIKAN] ${l.memo || ''}`,
        partyName: l.partyName,
      }));

      const reversalEntry: JournalEntry = {
        id: newId('je-rev'),
        entryNumber: reversalNumber,
        periodId: original.periodId,
        date: reversalDate,
        reference: `REV-${original.entryNumber}`,
        description: `Pembalikan/Koreksi untuk jurnal ${original.entryNumber}: ${reason || original.description}`,
        status: 'POSTED',
        totalDebit: original.totalCredit,
        totalCredit: original.totalDebit,
        lines: reversedLines,
        createdBy: req.user?.fullName || 'Arthur',
        createdAt: new Date().toISOString(),
        isReversalOfEntryNumber: original.entryNumber,
      };

      original.status = 'REVERSED';
      original.reversedByEntryNumber = reversalNumber;

      // Update balances COA dengan baris pembalik
      AccountingService.updateAccountBalances(db.accounts, reversedLines, 1);
      db.journals.unshift(reversalEntry);

      recordAuditLog(
        req.user?.id,
        'JOURNAL_REVERSED',
        'JOURNAL',
        original.entryNumber,
        true,
        req,
        { status: 'POSTED' },
        { status: 'REVERSED', reversedBy: reversalNumber }
      );

      return { original, reversal: reversalEntry };
    });

    res.json({ success: true, data: reversal });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'REVERSAL_ERROR', message: error.message } });
  }
});

// -------------------------------------------------------------
// 7. AR (SALES INVOICES) & PAYMENTS
// -------------------------------------------------------------
app.post('/api/invoices', authMiddleware, requireRole(['MASTER', 'ACCOUNTING']), idempotencyMiddleware, async (req: AuthenticatedRequest, res) => {
  const { sppgName, date, dueDate, period, periodId, items, titipanAmount, returAdjustment, notes } = req.body;

  try {
    const invoice = await dbStore.transaction((db) => {
      const activePeriod = AccountingService.validatePeriod(periodId || 'per-2026-09');
      AccountingService.validateTransactionDate(activePeriod, date);

      if (!items || !items.length) throw new Error('Faktur harus memuat minimal 1 item pangan.');

      const formattedItems = items.map((i: any) => {
        const qty = Number(i.qty) || 0;
        const unitPrice = Number(i.unitPrice) || 0;
        if (qty <= 0 || unitPrice < 0) throw new Error('Qty harus > 0 dan harga tidak boleh negatif.');
        return {
          id: newId('item'),
          description: i.description,
          category: i.category,
          qty,
          unit: i.unit,
          unitPrice,
          total: qty * unitPrice,
        };
      });

      const subtotal = formattedItems.reduce((s: number, it: any) => s + it.total, 0);
      const titipan = Number(titipanAmount) || 0;
      const retur = Number(returAdjustment) || 0;
      const netTotal = subtotal + titipan - retur;

      if (netTotal < 0) throw new Error('Total bersih faktur tidak boleh bernilai negatif.');

      const invoiceNumber = AccountingService.generateInvoiceNumber(date);

      // Buat jurnal otomatis AR
      const journalEntryNumber = AccountingService.generateJournalNumber(date);
      const journalLines = [
        {
          id: newId('jl'),
          accountCode: '1-1400',
          accountName: 'Piutang Usaha SPPG',
          debit: netTotal,
          credit: 0,
          memo: `Tagihan supply ${invoiceNumber}`,
          partyName: sppgName,
        },
        {
          id: newId('jl'),
          accountCode: '4-1100',
          accountName: 'Pendapatan Penjualan Komoditas Pangan',
          debit: 0,
          credit: subtotal,
          memo: `Pendapatan supply komoditas ${invoiceNumber}`,
          partyName: sppgName,
        },
      ];

      if (titipan > 0) {
        journalLines.push({
          id: newId('jl'),
          accountCode: '2-2100',
          accountName: 'Hutang Titipan SPPG',
          debit: 0,
          credit: titipan,
          memo: 'Titipan dana SPPG terpisah',
          partyName: sppgName,
        });
      }

      if (retur > 0) {
        journalLines.push({
          id: newId('jl'),
          accountCode: '6-1400',
          accountName: 'Beban Retur & Penyusutan Pangan Rusak',
          debit: retur,
          credit: 0,
          memo: `Potongan retur rusak ${invoiceNumber}`,
          partyName: sppgName,
        });
      }

      AccountingService.validateBalancedJournal(journalLines);
      AccountingService.updateAccountBalances(db.accounts, journalLines, 1);

      const autoJournal: JournalEntry = {
        id: newId('je-inv'),
        entryNumber: journalEntryNumber,
        periodId: activePeriod.id,
        date,
        reference: invoiceNumber,
        description: `Penerbitan faktur supply pangan ke ${sppgName}`,
        status: 'POSTED',
        lines: journalLines,
        totalDebit: journalLines.reduce((s, l) => s + l.debit, 0),
        totalCredit: journalLines.reduce((s, l) => s + l.credit, 0),
        createdAt: new Date().toISOString(),
        createdBy: 'Sistem Faktur AR',
      };

      db.journals.unshift(autoJournal);

      const inv: SalesInvoice = {
        id: newId('inv'),
        invoiceNumber,
        periodId: activePeriod.id,
        sppgName,
        date,
        dueDate,
        period: period || activePeriod.name,
        subtotal,
        cashbackCredit: 0,
        titipanAmount: titipan,
        returAdjustment: retur,
        netTotal,
        paidAmount: 0,
        status: 'UNPAID',
        items: formattedItems,
        journalEntryNumber,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.invoices.unshift(inv);
      recordAuditLog(req.user?.id, 'INVOICE_CREATED', 'INVOICE', inv.invoiceNumber, true, req, null, inv);
      return inv;
    });

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'INVOICE_CREATE_ERROR', message: error.message } });
  }
});

app.post('/api/invoices/pay', authMiddleware, requireRole(['MASTER', 'ACCOUNTING']), idempotencyMiddleware, async (req: AuthenticatedRequest, res) => {
  const { invoiceId, amount, destinationAccountCode, date, notes } = req.body;

  try {
    const updatedInvoice = await dbStore.transaction((db) => {
      const inv = db.invoices.find((i) => i.id === invoiceId);
      if (!inv) throw new Error('Faktur tidak ditemukan.');

      AccountingService.validatePeriod(inv.periodId);
      const paymentPeriod = AccountingService.validatePeriod(inv.periodId);
      AccountingService.validateTransactionDate(paymentPeriod, date);

      const payAmount = Number(amount) || 0;
      if (payAmount <= 0) throw new Error('Jumlah pembayaran harus lebih besar dari 0.');
      const destinationAccount = db.accounts.find((account) => account.code === destinationAccountCode);
      const targetBank = db.companyBanks.find((bank) => bank.accountCode === destinationAccountCode);
      if (!destinationAccount?.isActive || !targetBank || targetBank.status !== 'ACTIVE') {
        throw new Error('Rekening penerima tidak valid atau bukan rekening bank perusahaan yang aktif.');
      }

      const outstanding = inv.netTotal - inv.paidAmount;
      if (payAmount > outstanding) {
        throw new Error(
          `Pembayaran berlebih (Overpayment). Maksimal yang dapat dibayar adalah Rp ${outstanding.toLocaleString()}.`
        );
      }

      inv.paidAmount += payAmount;
      inv.status = inv.paidAmount >= inv.netTotal ? 'PAID' : 'PARTIAL';
      inv.updatedAt = new Date().toISOString();

      // Journal entry Kas Masuk
      const journalEntryNumber = AccountingService.generateJournalNumber(date);
      const journalLines = [
        {
          id: newId('jl'),
          accountCode: destinationAccountCode,
          accountName: db.accounts.find((a) => a.code === destinationAccountCode)?.name || 'Kas & Bank',
          debit: payAmount,
          credit: 0,
          memo: `Pelunasan piutang faktur ${inv.invoiceNumber}`,
          partyName: inv.sppgName,
        },
        {
          id: newId('jl'),
          accountCode: '1-1400',
          accountName: 'Piutang Usaha SPPG',
          debit: 0,
          credit: payAmount,
          memo: `Pelunasan piutang faktur ${inv.invoiceNumber}`,
          partyName: inv.sppgName,
        },
      ];

      AccountingService.validateBalancedJournal(journalLines);
      AccountingService.updateAccountBalances(db.accounts, journalLines, 1);

      // Sinkronisasi saldo rekening bank
      targetBank.balance += payAmount;
      targetBank.updatedAt = new Date().toISOString();

      const autoJournal: JournalEntry = {
        id: newId('je-pay-inv'),
        entryNumber: journalEntryNumber,
        periodId: inv.periodId,
        date,
        reference: inv.invoiceNumber,
        description: `Penerimaan pelunasan piutang ${inv.sppgName} (${notes || 'Lunas/Cicil'})`,
        status: 'POSTED',
        lines: journalLines,
        totalDebit: payAmount,
        totalCredit: payAmount,
        createdAt: new Date().toISOString(),
        createdBy: 'Sistem Kas Masuk AR',
      };

      db.journals.unshift(autoJournal);
      db.invoicePayments.push({
        id: newId('ip'),
        invoiceId: inv.id,
        paymentNumber: `PAY-${inv.invoiceNumber}-${shortCode('PAY')}`,
        periodId: inv.periodId,
        date,
        amount: payAmount,
        destinationAccountCode,
        journalEntryNumber,
        notes,
        createdBy: req.user?.id || 'system',
        createdAt: new Date().toISOString(),
      });
      recordAuditLog(req.user?.id, 'INVOICE_PAID', 'INVOICE', inv.invoiceNumber, true, req, null, {
        payAmount,
        status: inv.status,
      });

      return inv;
    });

    res.json({ success: true, data: updatedInvoice });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'INVOICE_PAY_ERROR', message: error.message } });
  }
});

// -------------------------------------------------------------
// 8. AP (SUPPLIER BILLS) & PAYMENTS
// -------------------------------------------------------------
app.post('/api/bills', authMiddleware, requireRole(['MASTER', 'ACCOUNTING']), idempotencyMiddleware, async (req: AuthenticatedRequest, res) => {
  const { supplierName, date, dueDate, items, notes, periodId } = req.body;

  try {
    const bill = await dbStore.transaction((db) => {
      const activePeriod = AccountingService.validatePeriod(periodId || 'per-2026-09');
      AccountingService.validateTransactionDate(activePeriod, date);

      if (!items || !items.length) throw new Error('Tagihan harus memuat minimal 1 item.');

      const formattedItems = items.map((i: any) => {
        const qty = Number(i.qty) || 0;
        const unitPrice = Number(i.unitPrice) || 0;
        if (qty <= 0 || unitPrice < 0) throw new Error('Qty harus > 0 dan harga tidak boleh negatif.');
        return {
          id: newId('bitem'),
          description: i.description,
          category: i.category || 'Pangan',
          qty,
          unit: i.unit,
          unitPrice,
          total: qty * unitPrice,
        };
      });

      const totalAmount = formattedItems.reduce((s: number, it: any) => s + it.total, 0);

      const billNumber = AccountingService.generateBillNumber(supplierName, date);

      let targetSupplierAccount = '2-1400';
      if (supplierName.includes('Queen')) targetSupplierAccount = '2-1100';
      else if (supplierName.includes('Fresh Food')) targetSupplierAccount = '2-1200';
      else if (['Mansur', 'Royana', 'HBS', 'ABR', 'DRW', 'BAHRUL'].some((n) => supplierName.includes(n))) {
        targetSupplierAccount = '2-1300';
      }

      const journalEntryNumber = AccountingService.generateJournalNumber(date);
      const journalLines = [
        {
          id: newId('jl'),
          accountCode: '5-1100',
          accountName: 'Beban Pokok Pengadaan Komoditas Pangan',
          debit: totalAmount,
          credit: 0,
          memo: `Tagihan masuk ${billNumber}`,
          partyName: supplierName,
        },
        {
          id: newId('jl'),
          accountCode: targetSupplierAccount,
          accountName: db.accounts.find((a) => a.code === targetSupplierAccount)?.name || 'Hutang Usaha Supplier',
          debit: 0,
          credit: totalAmount,
          memo: `Hutang tagihan ${billNumber}`,
          partyName: supplierName,
        },
      ];

      AccountingService.validateBalancedJournal(journalLines);
      AccountingService.updateAccountBalances(db.accounts, journalLines, 1);

      const autoJournal: JournalEntry = {
        id: newId('je-bill'),
        entryNumber: journalEntryNumber,
        periodId: activePeriod.id,
        date,
        reference: billNumber,
        description: `Tagihan masuk pengadaan pangan dari ${supplierName}`,
        status: 'POSTED',
        lines: journalLines,
        totalDebit: totalAmount,
        totalCredit: totalAmount,
        createdAt: new Date().toISOString(),
        createdBy: 'Sistem Tagihan AP',
      };

      db.journals.unshift(autoJournal);

      const newBill: SupplierBill = {
        id: newId('bill'),
        billNumber,
        periodId: activePeriod.id,
        supplierName,
        date,
        dueDate,
        items: formattedItems,
        totalAmount,
        paidAmount: 0,
        status: 'UNPAID',
        journalEntryNumber,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.bills.unshift(newBill);
      recordAuditLog(req.user?.id, 'BILL_CREATED', 'BILL', newBill.billNumber, true, req, null, newBill);
      return newBill;
    });

    res.json({ success: true, data: bill });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'BILL_CREATE_ERROR', message: error.message } });
  }
});

app.post('/api/bills/pay', authMiddleware, requireRole(['MASTER', 'ACCOUNTING']), idempotencyMiddleware, async (req: AuthenticatedRequest, res) => {
  const { billId, amount, sourceAccountCode, date, notes } = req.body;

  try {
    const updatedBill = await dbStore.transaction((db) => {
      const targetBill = db.bills.find((b) => b.id === billId);
      if (!targetBill) throw new Error('Tagihan supplier tidak ditemukan.');

      AccountingService.validatePeriod(targetBill.periodId);
      const paymentPeriod = AccountingService.validatePeriod(targetBill.periodId);
      AccountingService.validateTransactionDate(paymentPeriod, date);

      const payAmount = Number(amount) || 0;
      if (payAmount <= 0) throw new Error('Jumlah pembayaran harus > 0.');
      const sourceAccount = db.accounts.find((account) => account.code === sourceAccountCode);
      const targetBank = db.companyBanks.find((bank) => bank.accountCode === sourceAccountCode);
      if (!sourceAccount?.isActive || !targetBank || targetBank.status !== 'ACTIVE') {
        throw new Error('Rekening sumber tidak valid atau bukan rekening bank perusahaan yang aktif.');
      }
      if (targetBank.balance < payAmount) {
        throw new Error('Saldo rekening tidak mencukupi.');
      }

      const outstanding = targetBill.totalAmount - targetBill.paidAmount;
      if (payAmount > outstanding) {
        throw new Error(
          `Pembayaran berlebih (Overpayment AP). Maksimal pembayaran adalah Rp ${outstanding.toLocaleString()}.`
        );
      }

      targetBill.paidAmount += payAmount;
      targetBill.status = targetBill.paidAmount >= targetBill.totalAmount ? 'PAID' : 'PARTIAL';
      targetBill.updatedAt = new Date().toISOString();

      let targetSupplierAccount = '2-1400';
      if (targetBill.supplierName.includes('Queen')) targetSupplierAccount = '2-1100';
      else if (targetBill.supplierName.includes('Fresh Food')) targetSupplierAccount = '2-1200';
      else if (['Mansur', 'Royana', 'HBS', 'ABR', 'DRW', 'BAHRUL'].some((n) => targetBill.supplierName.includes(n))) {
        targetSupplierAccount = '2-1300';
      }

      const journalEntryNumber = AccountingService.generateJournalNumber(date);
      const journalLines = [
        {
          id: newId('jl'),
          accountCode: targetSupplierAccount,
          accountName: db.accounts.find((a) => a.code === targetSupplierAccount)?.name || 'Hutang Supplier',
          debit: payAmount,
          credit: 0,
          memo: `Pelunasan tagihan ${targetBill.billNumber}`,
          partyName: targetBill.supplierName,
        },
        {
          id: newId('jl'),
          accountCode: sourceAccountCode,
          accountName: db.accounts.find((a) => a.code === sourceAccountCode)?.name || 'Kas & Bank',
          debit: 0,
          credit: payAmount,
          memo: `Pengeluaran pembayaran ${targetBill.billNumber}`,
          partyName: targetBill.supplierName,
        },
      ];

      AccountingService.validateBalancedJournal(journalLines);
      AccountingService.updateAccountBalances(db.accounts, journalLines, 1);

      // Potong saldo bank
      targetBank.balance -= payAmount;
      targetBank.updatedAt = new Date().toISOString();

      const autoJournal: JournalEntry = {
        id: newId('je-pay-bill'),
        entryNumber: journalEntryNumber,
        periodId: targetBill.periodId,
        date,
        reference: targetBill.billNumber,
        description: `Pengeluaran kas pelunasan tagihan ${targetBill.supplierName} (${notes || 'Lunas/Cicil'})`,
        status: 'POSTED',
        lines: journalLines,
        totalDebit: payAmount,
        totalCredit: payAmount,
        createdAt: new Date().toISOString(),
        createdBy: 'Sistem Kas Keluar AP',
      };

      db.journals.unshift(autoJournal);
      db.billPayments.push({
        id: newId('bp'),
        billId: targetBill.id,
        paymentNumber: `PAY-${targetBill.billNumber}-${shortCode('PAY')}`,
        periodId: targetBill.periodId,
        date,
        amount: payAmount,
        sourceAccountCode,
        journalEntryNumber,
        notes,
        createdBy: req.user?.id || 'system',
        createdAt: new Date().toISOString(),
      });
      recordAuditLog(req.user?.id, 'BILL_PAID', 'BILL', targetBill.billNumber, true, req, null, {
        payAmount,
        status: targetBill.status,
      });

      return targetBill;
    });

    res.json({ success: true, data: updatedBill });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'BILL_PAY_ERROR', message: error.message } });
  }
});

// -------------------------------------------------------------
// 9. INVESTOR PAYOUTS
// -------------------------------------------------------------
app.post('/api/investors/pay', authMiddleware, requireRole(['MASTER', 'ACCOUNTING']), idempotencyMiddleware, async (req: AuthenticatedRequest, res) => {
  const { payoutId, bankAccountCode, bankName, notes } = req.body;

  try {
    const updatedPayout = await dbStore.transaction((db) => {
      const payout = db.investorPayouts.find((p) => p.id === payoutId);
      if (!payout) throw new Error('Data bagi hasil investor tidak ditemukan.');
      if (payout.status === 'PAID') throw new Error('Bagi hasil periode ini sudah pernah dibayar (Lunas).');

      const payoutPeriod = db.periods.find((period) => period.name === payout.period);
      const activePeriod = payoutPeriod || db.periods.find((period) => period.id === 'per-2026-09');
      if (!activePeriod) throw new Error('Periode pembayaran investor tidak ditemukan.');
      AccountingService.validatePeriod(activePeriod.id);

      let liabilityAccountCode = '2-3100'; // Default Dewi Amor
      if (payout.investorName.toLowerCase().includes('iis')) liabilityAccountCode = '2-3200';
      else if (payout.investorName.toLowerCase().includes('novia')) liabilityAccountCode = '2-3300';

      const today = new Date().toISOString().substring(0, 10);
      AccountingService.validateTransactionDate(activePeriod, today);
      const sourceAccount = db.accounts.find((account) => account.code === bankAccountCode);
      const targetBank = db.companyBanks.find((bank) => bank.accountCode === bankAccountCode);
      if (!sourceAccount?.isActive || !targetBank || targetBank.status !== 'ACTIVE') {
        throw new Error('Rekening sumber tidak valid atau bukan rekening bank perusahaan yang aktif.');
      }
      if (targetBank.balance < payout.monthlyPayoutAmount) {
        throw new Error('Saldo rekening tidak mencukupi.');
      }
      const entryNumber = AccountingService.generateJournalNumber(today);

      const journalLines = [
        {
          id: newId('jl'),
          accountCode: liabilityAccountCode,
          accountName: `Hutang Bagi Hasil Investor - ${payout.investorName}`,
          debit: payout.monthlyPayoutAmount,
          credit: 0,
          memo: `Pelunasan bagi hasil ${payout.period}`,
          partyName: payout.investorName,
        },
        {
          id: newId('jl'),
          accountCode: bankAccountCode,
          accountName: `Kas/Bank Rekening Perusahaan (${bankName})`,
          debit: 0,
          credit: payout.monthlyPayoutAmount,
          memo: `Transfer pembayaran bagi hasil a.n. ${payout.investorName}`,
          partyName: payout.investorName,
        },
      ];

      AccountingService.validateBalancedJournal(journalLines);
      AccountingService.updateAccountBalances(db.accounts, journalLines, 1);

      // Potong saldo bank
      targetBank.balance -= payout.monthlyPayoutAmount;
      targetBank.updatedAt = new Date().toISOString();

      const autoJournal: JournalEntry = {
        id: newId('je-inv'),
        entryNumber,
        periodId: activePeriod.id,
        date: today,
        reference: `INV-PAY-${payout.investorName.toUpperCase()}`,
        description: `Pembayaran Bagi Hasil ${payout.period} Investor ${payout.investorName} via ${bankName}. ${notes || ''}`,
        status: 'POSTED',
        lines: journalLines,
        totalDebit: payout.monthlyPayoutAmount,
        totalCredit: payout.monthlyPayoutAmount,
        createdAt: new Date().toISOString(),
        createdBy: req.user?.fullName || 'Arthur',
      };

      db.journals.unshift(autoJournal);

      payout.status = 'PAID';
      payout.paidDate = today;
      payout.paidFromBank = bankName;
      payout.paidFromAccountCode = bankAccountCode;
      payout.journalEntryNumber = entryNumber;
      payout.notes = notes || payout.notes;
      payout.updatedAt = new Date().toISOString();

      recordAuditLog(req.user?.id, 'INVESTOR_PAID', 'INVESTOR_PAYOUT', payout.id, true, req, null, payout);
      return payout;
    });

    res.json({ success: true, data: updatedPayout });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'INVESTOR_PAY_ERROR', message: error.message } });
  }
});

// -------------------------------------------------------------
// 10. CASHBACK & RECONCILIATION POSTING
// -------------------------------------------------------------
app.post('/api/cashback/post-journal', authMiddleware, requireRole(['MASTER', 'ACCOUNTING']), idempotencyMiddleware, async (req: AuthenticatedRequest, res) => {
  const { cashbackRecordId } = req.body;

  try {
    const result = await dbStore.transaction((db) => {
      const rec = db.cashbackRecords.find((r) => r.id === cashbackRecordId);
      if (!rec) throw new Error('Data rekonsiliasi cashback tidak ditemukan.');
      if (rec.accountingStatus === 'SUDAH_DIKREDIT') {
        throw new Error('Cashback ini sudah pernah diposting ke jurnal pembukuan.');
      }

      AccountingService.validatePeriod(rec.periodId || 'per-2026-09');

      const today = new Date().toISOString().substring(0, 10);
      const entryNumber = AccountingService.generateJournalNumber(today);

      // Debit Piutang Cashback SPPG (1-1400) atau Kas, Kredit Pendapatan Selisih Cashback (4-1200)
      const journalLines = [
        {
          id: newId('jl'),
          accountCode: '1-1400',
          accountName: 'Piutang Usaha SPPG (Akumulasi Cashback)',
          debit: rec.totalCashback,
          credit: 0,
          memo: `Pengakuan hak margin cashback selisih harga ${rec.item}`,
          partyName: rec.sppg,
        },
        {
          id: newId('jl'),
          accountCode: '4-1200',
          accountName: 'Pendapatan Lain-lain & Selisih Cashback SPPG',
          debit: 0,
          credit: rec.totalCashback,
          memo: `Selisih SPPG Rp ${rec.sppgPrice.toLocaleString()} vs Real Rp ${rec.realPrice.toLocaleString()} (${rec.qty} ${rec.unit})`,
          partyName: rec.sppg,
        },
      ];

      AccountingService.validateBalancedJournal(journalLines);
      AccountingService.updateAccountBalances(db.accounts, journalLines, 1);

      const autoJournal: JournalEntry = {
        id: newId('je-cb'),
        entryNumber,
        periodId: rec.periodId || 'per-2026-09',
        date: today,
        reference: `CB-${rec.sppg.substring(0, 4).toUpperCase()}-${shortCode('CB')}`,
        description: `Posting pengakuan selisih cashback SPPG ${rec.sppg} untuk komoditas ${rec.item}`,
        status: 'POSTED',
        lines: journalLines,
        totalDebit: rec.totalCashback,
        totalCredit: rec.totalCashback,
        createdAt: new Date().toISOString(),
        createdBy: req.user?.fullName || 'Arthur',
      };

      db.journals.unshift(autoJournal);

      rec.accountingStatus = 'SUDAH_DIKREDIT';
      rec.journalEntryNumber = entryNumber;

      recordAuditLog(req.user?.id, 'CASHBACK_POSTED', 'CASHBACK', rec.id, true, req, null, {
        totalCashback: rec.totalCashback,
        journalEntryNumber: entryNumber,
      });

      return { record: rec, journal: autoJournal };
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'CASHBACK_POST_ERROR', message: error.message } });
  }
});

app.post('/api/cashback', authMiddleware, requireRole(['MASTER', 'ACCOUNTING']), async (req: AuthenticatedRequest, res) => {
  const { sppg, period, date, item, qty, unit, sppgPrice, realPrice, titipanAmount, returAmount, notes } = req.body;

  try {
    const newRecord = await dbStore.transaction((db) => {
      const q = Number(qty) || 0;
      const sPrice = Number(sppgPrice) || 0;
      const rPrice = Number(realPrice) || 0;
      if (q <= 0) throw new Error('Volume/Qty harus lebih besar dari 0.');
      if (sPrice <= 0 || rPrice <= 0) throw new Error('Harga SPPG dan Harga Real harus lebih besar dari 0.');
      if (!String(sppg || '').trim() || !String(item || '').trim()) {
        throw new Error('SPPG dan item cashback wajib diisi.');
      }

      const cashbackUnitDiff = sPrice - rPrice;
      const totalCashback = cashbackUnitDiff * q;
      if (totalCashback < 0) {
        throw new Error('Harga SPPG tidak boleh lebih rendah dari harga real.');
      }
      const titipan = Number(titipanAmount) || 0;
      const retur = Number(returAmount) || 0;

      const record: CashbackReconciliationRecord = {
        id: newId('cb'),
        periodId: 'per-2026-09',
        sppg: (sppg || '').trim(),
        period: (period || 'September 2026').trim(),
        date: date || new Date().toISOString().substring(0, 10),
        item: (item || '').trim(),
        qty: q,
        unit: (unit || 'kg').trim(),
        sppgPrice: sPrice,
        realPrice: rPrice,
        cashbackUnitDiff,
        totalCashback,
        titipanAmount: titipan,
        returAmount: retur,
        accountingStatus: 'TERCATAT_PIUTANG',
        notes: notes ? notes.trim() : undefined,
        createdAt: new Date().toISOString(),
      };

      db.cashbackRecords.unshift(record);
      recordAuditLog(req.user?.id, 'CASHBACK_CREATED', 'CASHBACK', record.id, true, req, null, record);
      return record;
    });

    res.json({ success: true, data: newRecord });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'CASHBACK_CREATE_ERROR', message: error.message } });
  }
});

// -------------------------------------------------------------
// 11. USER MANAGEMENT (MASTER ONLY)
// -------------------------------------------------------------
app.post('/api/users', authMiddleware, requireRole(['MASTER']), async (req: AuthenticatedRequest, res) => {
  const { username, fullName, role, department, password, email, phone } = req.body;

  try {
    const newUser = await dbStore.transaction((db) => {
      const cleanUsername = (username || '').trim().toLowerCase();
      if (!cleanUsername || !password) throw new Error('Username dan password wajib diisi.');
      if (!['MASTER', 'OWNER', 'ACCOUNTING'].includes(role)) {
        throw new Error('Role pengguna tidak valid.');
      }
      if (password.trim().length < 12) throw new Error('Password minimal 12 karakter.');

      const exists = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
      if (exists) throw new Error(`Username '${cleanUsername}' sudah dipakai.`);

      let roleTitle = 'Staf Akuntansi & Keuangan';
      if (role === 'MASTER') roleTitle = 'Master Administrator & Head of Accounting';
      if (role === 'OWNER') roleTitle = 'Business Owner & Executive Board';

      const user: AppUser = {
        id: `user-${crypto.randomUUID()}`,
        username: cleanUsername,
        passwordHash: hashPassword(password.trim()),
        fullName: fullName.trim(),
        role,
        roleTitle,
        department: department?.trim() || 'Fresh Food Nusantara',
        email: email?.trim() || undefined,
        phone: phone?.trim() || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.users.push(user);
      recordAuditLog(req.user?.id, 'USER_CREATED', 'USER', user.username, true, req);
      return user;
    });

    const { passwordHash, ...safe } = newUser;
    res.json({ success: true, data: safe });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'USER_CREATE_ERROR', message: error.message } });
  }
});

app.put('/api/users/:id', authMiddleware, requireRole(['MASTER']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { fullName, role, department, password, email, phone } = req.body;

  try {
    const updatedUser = await dbStore.transaction((db) => {
      const user = db.users.find((u) => u.id === id);
      if (!user) throw new Error('Pengguna tidak ditemukan.');

      const before = { ...user };

      if (fullName) user.fullName = fullName.trim();
      if (department) user.department = department.trim();
      if (email !== undefined) user.email = email ? email.trim() : undefined;
      if (phone !== undefined) user.phone = phone ? phone.trim() : undefined;

      if (role && ['MASTER', 'OWNER', 'ACCOUNTING'].includes(role)) {
        user.role = role;
        if (role === 'MASTER') user.roleTitle = 'Master Administrator & Head of Accounting';
        else if (role === 'OWNER') user.roleTitle = 'Business Owner & Executive Board';
        else user.roleTitle = 'Staf Akuntansi & Keuangan';
      }

      if (password && password.trim().length >= 12) {
        user.passwordHash = hashPassword(password.trim());
        db.sessions = db.sessions.filter((session) => session.userId !== user.id);
      } else if (password) {
        throw new Error('Password minimal 12 karakter.');
      }

      user.updatedAt = new Date().toISOString();

      recordAuditLog(req.user?.id, 'USER_UPDATED', 'USER', user.username, true, req, before, user);
      return user;
    });

    const { passwordHash, ...safe } = updatedUser;
    res.json({ success: true, data: safe });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'USER_UPDATE_ERROR', message: error.message } });
  }
});

app.post('/api/users/:id/toggle-active', authMiddleware, requireRole(['MASTER']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const updatedUser = await dbStore.transaction((db) => {
      const user = db.users.find((u) => u.id === id);
      if (!user) throw new Error('Pengguna tidak ditemukan.');

      if (user.username.toLowerCase() === 'arthur') {
        throw new Error('Akun Master Arthur tidak boleh dinonaktifkan.');
      }

      const before = { ...user };
      user.isActive = !user.isActive;
      user.updatedAt = new Date().toISOString();
      if (!user.isActive) {
        db.sessions = db.sessions.filter((session) => session.userId !== user.id);
      }

      recordAuditLog(
        req.user?.id,
        user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        'USER',
        user.username,
        true,
        req,
        before,
        user
      );
      return user;
    });

    const { passwordHash, ...safe } = updatedUser;
    res.json({ success: true, data: safe });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'USER_TOGGLE_ERROR', message: error.message } });
  }
});

// -------------------------------------------------------------
// 12. CRITICAL AUDITED DESTRUCTIVE ACTION (FORMAT DATA SERVER)
// -------------------------------------------------------------
app.post('/api/system/format-data', authMiddleware, requireRole(['MASTER']), async (req: AuthenticatedRequest, res) => {
  const { confirmationPhrase, masterPassword } = req.body;

  // Wajib verifikasi teks ketat & password re-otentikasi Master
  if (confirmationPhrase !== 'FORMAT FFN ACCOUNTING') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_CONFIRMATION',
        message: 'Frasa konfirmasi salah. Anda wajib mengetik tepat: FORMAT FFN ACCOUNTING',
      },
    });
  }

  if (!masterPassword || !verifyPassword(masterPassword, req.user!.passwordHash)) {
    recordAuditLog(req.user?.id, 'DATA_FORMAT_FAILED', 'SYSTEM', 'ALL_DATA', false, req, null, null, 'Otentikasi password master gagal');
    return res.status(403).json({
      success: false,
      error: { code: 'AUTH_FAILED', message: 'Password Master salah. Tindakan berbahaya ditolak.' },
    });
  }

  try {
    await dbStore.transaction((db) => {
      const beforeState = {
        invoiceCount: db.invoices.length,
        billCount: db.bills.length,
        journalCount: db.journals.length,
        cashbackCount: db.cashbackRecords.length,
      };

      // Reset data transaksi ke nol
      db.invoices = [];
      db.bills = [];
      db.journals = [];
      db.cashbackRecords = [];

      // Reset saldo akun COA ke nol
      db.accounts.forEach((a) => {
        a.balance = 0;
        a.updatedAt = new Date().toISOString();
      });

      // Reset saldo 4 rekening bank ke nol
      db.companyBanks.forEach((b) => {
        b.balance = 0;
        b.updatedAt = new Date().toISOString();
      });

      // Reset status payout investor ke UNPAID
      db.investorPayouts.forEach((p) => {
        p.status = 'UNPAID';
        p.paidDate = undefined;
        p.paidFromBank = undefined;
        p.paidFromAccountCode = undefined;
        p.journalEntryNumber = undefined;
        p.updatedAt = new Date().toISOString();
      });

      recordAuditLog(
        req.user?.id,
        'DATA_FORMATTED',
        'SYSTEM',
        'ALL_DATA',
        true,
        req,
        beforeState,
        { status: 'CLEARED_TO_ZERO' }
      );
    });

    res.json({
      success: true,
      message: 'Format transaksi selesai. Seluruh data transaksi dibersihkan ke nol dengan integritas terjamin.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'FORMAT_FAILED', message: error.message } });
  }
});

app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'API_NOT_FOUND',
      message: 'API endpoint tidak ditemukan',
    },
  });
});

// -------------------------------------------------------------
// 13. VITE MIDDLEWARE SETUP FOR FULL-STACK INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  await dbStore.ready;
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`FFN Accounting Production Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
