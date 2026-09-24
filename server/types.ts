import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Standar Enterprise Types untuk Accounting FFN
export type UserRole = 'MASTER' | 'OWNER' | 'ACCOUNTING';

export interface AppUser {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AccountingPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'LOCKED' | 'CLOSED';
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
}

export interface ChartOfAccount {
  code: string;
  name: string;
  category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  subcategory: string;
  normalBalance: 'DEBIT' | 'CREDIT';
  description?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
  partyName?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  periodId: string;
  date: string;
  reference: string;
  description: string;
  status: 'POSTED' | 'DRAFT' | 'REVERSED';
  totalDebit: number;
  totalCredit: number;
  lines: JournalLine[];
  createdBy: string;
  createdAt: string;
  reversedByEntryNumber?: string;
  isReversalOfEntryNumber?: string;
}

export interface SalesInvoiceItem {
  id: string;
  description: string;
  category: 'BUAH' | 'SAYUR' | 'BUMBU' | 'PROTEIN' | 'SEMBAKO DAN OLAHAN LAINNYA';
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  periodId: string;
  sppgName: string;
  date: string;
  dueDate: string;
  period: string;
  subtotal: number;
  cashbackCredit: number;
  titipanAmount: number;
  returAdjustment: number;
  netTotal: number;
  paidAmount: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  items: SalesInvoiceItem[];
  journalEntryNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierBillItem {
  id: string;
  description: string;
  category: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface SupplierBill {
  id: string;
  billNumber: string;
  periodId: string;
  supplierName: string;
  date: string;
  dueDate: string;
  items: SupplierBillItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  journalEntryNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  accountCode: string;
  balance: number;
  status: 'ACTIVE' | 'INACTIVE';
  branch?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyInvestorPayout {
  id: string;
  investorName: string;
  period: string;
  investmentAmount: number;
  monthlyPayoutAmount: number;
  dueDate: string;
  status: 'UNPAID' | 'PAID';
  paidDate?: string;
  paidFromBank?: string;
  paidFromAccountCode?: string;
  journalEntryNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashbackReconciliationRecord {
  id: string;
  periodId: string;
  sppg: string;
  period: string;
  date: string;
  item: string;
  qty: number;
  unit: string;
  sppgPrice: number;
  realPrice: number;
  cashbackUnitDiff: number;
  totalCashback: number;
  titipanAmount: number;
  returAmount: number;
  accountingStatus: 'TERCATAT_PIUTANG' | 'SUDAH_DIKREDIT' | 'SETOR_TUNAI';
  journalEntryNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface IdempotencyRecord {
  key: string;
  userId: string;
  requestHash: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  statusCode: number;
  responseBody: any;
  createdAt: string;
  expiresAt: string;
}

// Password hashing utility with PBKDF2 (SHA512, 100,000 iterations)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('pbkdf2$')) {
    // Backward compatibility check or failure
    return false;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 4) return false;
  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const originalHash = parts[3];
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(originalHash, 'hex'));
}
