// FFN Core Accounting - Type Definitions
// Standar Akuntansi Double-Entry Fresh Food Nusantara

export type AccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface Account {
  code: string;
  name: string;
  category: AccountCategory;
  subcategory: string;
  normalBalance: NormalBalance;
  description?: string;
  balance: number;
  isActive: boolean;
}

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
  partyName?: string; // SPPG atau Supplier terkait
}

export type JournalStatus = 'POSTED' | 'DRAFT' | 'REVERSED';

export interface JournalEntry {
  id: string;
  entryNumber: string; // misal JU-202609-001
  date: string;        // YYYY-MM-DD
  reference: string;   // No Bukti / Invoice / SPPG Ref
  description: string;
  status: JournalStatus;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  createdBy: string;
  reversedByEntryNumber?: string;
  isReversalOfEntryNumber?: string;
}

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

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
  invoiceNumber: string; // misal INV-SPPG-2609-01
  sppgName: string;      // misal "SPPG Regol Wetan", "SPPG Wargaluyu"
  date: string;
  dueDate: string;
  period: string;        // "September 2026"
  items: SalesInvoiceItem[];
  subtotal: number;
  cashbackCredit: number; // Pemisahan Cashback jika ada
  titipanAmount: number;  // Titipan terpisah
  returAdjustment: number;// Retur terpisah
  netTotal: number;
  paidAmount: number;
  status: PaymentStatus;
  journalEntryNumber?: string;
  notes?: string;
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
  billNumber: string;     // misal BILL-QUEEN-2609-001
  supplierName: string;   // "Queen Fruit", "Fresh Food Supply", "HBS", "Mansur Sayur"
  date: string;
  dueDate: string;
  items: SupplierBillItem[];
  totalAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  journalEntryNumber?: string;
  notes?: string;
}

export type CashTransactionType = 'CASH_IN' | 'CASH_OUT' | 'TRANSFER';

export interface CashTransaction {
  id: string;
  code: string;           // KAS-2609-001
  date: string;
  type: CashTransactionType;
  sourceAccountCode: string;
  destinationAccountCode: string;
  amount: number;
  partyName: string;      // Pihak ketiga: SPPG / Supplier / Karyawan
  reference: string;
  description: string;
  journalEntryNumber?: string;
}

export interface AccountingPeriod {
  id: string;
  name: string;          // "September 2026"
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'LOCKED' | 'CLOSED';
  closedAt?: string;
  closedBy?: string;
}

export interface CashbackReconciliationRecord {
  id: string;
  sppg: string;
  period: string;
  date: string;
  item: string;
  qty: number;
  unit: string;
  sppgPrice: number;
  realPrice: number;
  cashbackUnitDiff: number; // sppgPrice - realPrice
  totalCashback: number;    // cashbackUnitDiff * qty
  titipanAmount: number;    // STRICTLY SEPARATE
  returAmount: number;      // STRICTLY SEPARATE
  accountingStatus: 'TERCATAT_PIUTANG' | 'SUDAH_DIKREDIT' | 'SETOR_TUNAI';
  journalEntryNumber?: string;
  periodId?: string;
  notes?: string;
}

export interface CompanyBankAccount {
  id: string;
  bankName: 'BRI' | 'BTN' | string;
  accountNumber: string;
  accountHolder: string;
  accountCode: string; // Hubungan ke COA 1-1210 dsb
  balance: number;
  status: 'ACTIVE' | 'INACTIVE';
  branch?: string;
}

export interface MonthlyInvestorPayout {
  id: string;
  investorName: string; // "Dewi amor" | "bu iis" | "novia"
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
}

export type UserRole = 'MASTER' | 'ACCOUNTING' | 'OWNER';

export type AccountingTab = 
  | 'overview' 
  | 'owner' 
  | 'ledger' 
  | 'receivable' 
  | 'payable' 
  | 'accounts' 
  | 'reports' 
  | 'cashback' 
  | 'investors' 
  | 'users' 
  | 'dashboard';

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  password?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}
