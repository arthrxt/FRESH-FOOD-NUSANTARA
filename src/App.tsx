import React, { useState, useEffect } from 'react';
import { 
  Account, 
  JournalEntry, 
  SalesInvoice, 
  SupplierBill, 
  AccountingPeriod, 
  CashbackReconciliationRecord,
  CompanyBankAccount,
  MonthlyInvestorPayout,
  AppUser
} from './types';
import { 
  INITIAL_ACCOUNTS, 
  INITIAL_JOURNALS, 
  INITIAL_SALES_INVOICES, 
  INITIAL_SUPPLIER_BILLS, 
  INITIAL_PERIODS, 
  INITIAL_CASHBACK_RECONCILIATION,
  INITIAL_COMPANY_BANKS,
  INITIAL_INVESTOR_PAYOUTS,
  INITIAL_USERS
} from './data/accountingData';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { AccountingHeader } from './components/AccountingHeader';
import { DashboardOverviewTab } from './components/DashboardOverviewTab';
import { OwnerDashboardTab } from './components/OwnerDashboardTab';
import { UserManagementTab } from './components/UserManagementTab';
import { GeneralLedgerTab } from './components/GeneralLedgerTab';
import { AccountsReceivableTab } from './components/AccountsReceivableTab';
import { AccountsPayableTab } from './components/AccountsPayableTab';
import { InvestorObligationsTab } from './components/InvestorObligationsTab';
import { CompanyBanksWidget } from './components/CompanyBanksWidget';
import { ChartOfAccountsTab } from './components/ChartOfAccountsTab';
import { FinancialReportsTab } from './components/FinancialReportsTab';
import { CashbackReconciliationTab } from './components/CashbackReconciliationTab';
import { formatRupiah, formatDateID } from './utils/accountingUtils';
import { 
  CreditCard, 
  BookOpen, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

const STORAGE_KEYS = {
  AUTH_USER: 'ffn_auth_user_v2',
  USERS: 'ffn_system_users_v2',
  ACCOUNTS: 'ffn_accounting_accounts_v2',
  JOURNALS: 'ffn_accounting_journals_v2',
  INVOICES: 'ffn_accounting_invoices_v2',
  BILLS: 'ffn_accounting_bills_v2',
  PERIODS: 'ffn_accounting_periods_v2',
  SELECTED_PERIOD: 'ffn_accounting_selected_period_v2',
  CASHBACK_RECON: 'ffn_accounting_cashback_recon_v2',
  COMPANY_BANKS: 'ffn_company_banks_v2',
  INVESTOR_PAYOUTS: 'ffn_investor_payouts_v2',
};

export type AccountingTab = 
  | 'overview' 
  | 'dashboard'
  | 'owner'
  | 'ledger' 
  | 'ar' 
  | 'ap' 
  | 'investors'
  | 'banks'
  | 'coa' 
  | 'reports' 
  | 'cashback'
  | 'users';

export default function App() {
  // 0. System Users State (Arthur Master, Owner, Accounting Staff)
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load users', e);
    }
    return INITIAL_USERS;
  });

  // Sinkronisasi data user dari server agar akun bisa login di PC/HP manapun
  useEffect(() => {
    fetch('/api/users')
      .then((res) => {
        if (!res.ok) throw new Error('API not available');
        return res.json();
      })
      .then((data: AppUser[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          try {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data));
          } catch (e) {}
        }
      })
      .catch(() => {
        // Fallback jika offline atau server API belum siap
      });
  }, []);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load auth user', e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<AccountingTab>(() => {
    if (currentUser?.role === 'OWNER') return 'owner';
    return 'overview';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 1. Periods State
  const [periods, setPeriods] = useState<AccountingPeriod[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERIODS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load periods', e);
    }
    return INITIAL_PERIODS;
  });

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_PERIOD);
      if (saved) return saved;
    } catch (e) {
      console.error('Failed to load selected period', e);
    }
    return 'per-2026-09';
  });

  const activePeriod =
    periods.find((p) => p.id === selectedPeriodId) ||
    periods.find((p) => p.status === 'OPEN') ||
    periods[0];

  // 2. Accounts State (COA)
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load accounts', e);
    }
    return INITIAL_ACCOUNTS;
  });

  // 3. Journals State (Double-Entry General Ledger)
  const [journals, setJournals] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JOURNALS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load journals', e);
    }
    return INITIAL_JOURNALS;
  });

  // 4. Sales Invoices (AR)
  const [invoices, setInvoices] = useState<SalesInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load invoices', e);
    }
    return INITIAL_SALES_INVOICES;
  });

  // 5. Supplier Bills (AP)
  const [bills, setBills] = useState<SupplierBill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load bills', e);
    }
    return INITIAL_SUPPLIER_BILLS;
  });

  // 6. Company Bank Accounts
  const [companyBanks, setCompanyBanks] = useState<CompanyBankAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPANY_BANKS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load company banks', e);
    }
    return INITIAL_COMPANY_BANKS;
  });

  // 7. Monthly Investor Payouts
  const [investorPayouts, setInvestorPayouts] = useState<MonthlyInvestorPayout[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVESTOR_PAYOUTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load investor payouts', e);
    }
    return INITIAL_INVESTOR_PAYOUTS;
  });

  // 8. Cashback & Separations Reconciliation
  const [cashbackRecords, setCashbackRecords] = useState<CashbackReconciliationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASHBACK_RECON);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load cashback records', e);
    }
    return INITIAL_CASHBACK_RECONCILIATION;
  });

  // Save changes to localStorage & sync ke server
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
      }).catch(() => {});
    } catch (e) {
      console.error('Failed to save users', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save accounts', e);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(journals));
    } catch (e) {
      console.error('Failed to save journals', e);
    }
  }, [journals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to save invoices', e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    } catch (e) {
      console.error('Failed to save bills', e);
    }
  }, [bills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(periods));
    } catch (e) {
      console.error('Failed to save periods', e);
    }
  }, [periods]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CASHBACK_RECON, JSON.stringify(cashbackRecords));
    } catch (e) {
      console.error('Failed to save cashback recon', e);
    }
  }, [cashbackRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANY_BANKS, JSON.stringify(companyBanks));
    } catch (e) {
      console.error('Failed to save company banks', e);
    }
  }, [companyBanks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVESTOR_PAYOUTS, JSON.stringify(investorPayouts));
    } catch (e) {
      console.error('Failed to save investor payouts', e);
    }
  }, [investorPayouts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_PERIOD, selectedPeriodId);
    } catch (e) {
      console.error('Failed to save selected period', e);
    }
  }, [selectedPeriodId]);

  // Handle Logout
  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    } catch (e) {
      console.error('Failed to remove auth', e);
    }
    setCurrentUser(null);
  };

  // User Management Handlers (Arthur Master)
  const handleAddUser = (newUser: AppUser) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleUpdateUser = (updatedUser: AppUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedUser));
    }
  };

  const handleToggleUserActive = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
  };

  // Handler: Format Habis Data Server (Pembersihan Total Transaksi Lama)
  const handleFormatServerData = () => {
    setInvoices([]);
    setBills([]);
    setJournals([]);
    setCashbackRecords([]);

    setAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        balance: 0,
      }))
    );

    setCompanyBanks((prev) =>
      prev.map((b) => ({
        ...b,
        balance: 0,
      }))
    );

    setInvestorPayouts((prev) =>
      prev.map((p) => ({
        ...p,
        status: 'UNPAID',
        paidDate: undefined,
        paidFromBank: undefined,
        paidFromAccountCode: undefined,
        journalEntryNumber: undefined,
      }))
    );

    alert('Format Selesai: Seluruh data transaksi demo, faktur, tagihan, dan mutasi jurnal telah dibersihkan menjadi nol. Master COA, 4 Bank, 6 Supplier, dan Akun Pengguna tetap utuh. Sistem siap pakai untuk operasional FFN!');
  };

  // Handler: Pilih Periode Terdaftar
  const handleSelectPeriod = (periodId: string) => {
    setSelectedPeriodId(periodId);
  };

  // Handler: Pilih Bulan & Tahun Bebas dari Kalender
  const handleSelectMonthYear = (year: number, monthIndex: number) => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const padMonth = (monthIndex + 1).toString().padStart(2, '0');
    const targetId = `per-${year}-${padMonth}`;
    const existing = periods.find((p) => p.id === targetId);

    if (existing) {
      setSelectedPeriodId(existing.id);
    } else {
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      const newPeriod: AccountingPeriod = {
        id: targetId,
        name: `${monthNames[monthIndex]} ${year}`,
        startDate: `${year}-${padMonth}-01`,
        endDate: `${year}-${padMonth}-${lastDay}`,
        status: 'OPEN',
      };
      setPeriods((prev) => [newPeriod, ...prev]);
      setSelectedPeriodId(targetId);
    }
  };

  // Handler: Kunci / Buka Periode Akuntansi
  const handleTogglePeriodLock = () => {
    setPeriods(
      periods.map((p) => {
        if (p.id !== activePeriod.id) return p;
        return {
          ...p,
          status: p.status === 'OPEN' ? 'LOCKED' : 'OPEN',
          closedAt: p.status === 'OPEN' ? new Date().toISOString() : undefined,
          closedBy: p.status === 'OPEN' ? `${currentUser?.fullName || 'Arthur'} (Accounting)` : undefined,
        };
      })
    );
  };

  // Helper: Update Saldo Akun dari baris Debit & Kredit
  const applyLinesToAccountBalances = (
    currentAccounts: Account[],
    lines: { accountCode: string; debit: number; credit: number }[],
    multiplier: number = 1 // 1 untuk posting biasa, -1 untuk rollback
  ): Account[] => {
    const updated = [...currentAccounts];
    lines.forEach((line) => {
      const idx = updated.findIndex((a) => a.code === line.accountCode);
      if (idx !== -1) {
        const acc = updated[idx];
        const isDebitNormal = acc.normalBalance === 'DEBIT';
        const netChange = isDebitNormal
          ? (line.debit - line.credit) * multiplier
          : (line.credit - line.debit) * multiplier;

        updated[idx] = {
          ...acc,
          balance: acc.balance + netChange,
        };
      }
    });

    // Sync bank balances
    setCompanyBanks((prevBanks) =>
      prevBanks.map((bank) => {
        const matchedAcc = updated.find((a) => a.code === bank.accountCode);
        return matchedAcc ? { ...bank, balance: matchedAcc.balance } : bank;
      })
    );

    return updated;
  };

  // Handler: Tambah Entri Jurnal Baru
  const handleAddJournal = (newEntry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const entry: JournalEntry = {
      ...newEntry,
      id: `je-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setJournals([entry, ...journals]);

    setAccounts((prevAccounts) =>
      applyLinesToAccountBalances(prevAccounts, entry.lines, 1)
    );
  };

  // Handler: Reversal Jurnal (Pembalikan Jurnal)
  const handleReverseJournal = (targetEntry: JournalEntry) => {
    const reversalNumber = `REV-${targetEntry.entryNumber}`;

    const reversedLines = targetEntry.lines.map((l) => ({
      ...l,
      id: `jl-rev-${Date.now()}-${Math.random()}`,
      debit: l.credit,
      credit: l.debit,
      memo: `Pembalikan koreksi entri ${targetEntry.entryNumber}`,
    }));

    const reversalEntry: JournalEntry = {
      id: `je-rev-${Date.now()}`,
      entryNumber: reversalNumber,
      date: new Date().toISOString().split('T')[0],
      reference: `REV:${targetEntry.reference}`,
      description: `Koreksi pembatalan atas ${targetEntry.description}`,
      status: 'POSTED',
      lines: reversedLines,
      totalDebit: targetEntry.totalCredit,
      totalCredit: targetEntry.totalDebit,
      createdAt: new Date().toISOString(),
      createdBy: `${currentUser?.fullName || 'Arthur'} (Accounting)`,
      isReversalOfEntryNumber: targetEntry.entryNumber,
    };

    setJournals((prev) => [
      reversalEntry,
      ...prev.map((j) =>
        j.id === targetEntry.id
          ? { ...j, status: 'REVERSED' as const, reversedByEntryNumber: reversalNumber }
          : j
      ),
    ]);

    setAccounts((prevAccounts) =>
      applyLinesToAccountBalances(prevAccounts, reversalEntry.lines, 1)
    );
  };

  // Handler: Tambah Faktur Penjualan SPPG Baru (AR)
  const handleAddInvoice = (newInv: Omit<SalesInvoice, 'id'>) => {
    const entrySeq = (journals.length + 1).toString().padStart(3, '0');
    const journalEntryNumber = `JU-${activePeriod.startDate.substring(0, 7).replace('-', '')}-${entrySeq}`;

    const inv: SalesInvoice = {
      ...newInv,
      id: `inv-${Date.now()}`,
      journalEntryNumber,
    };

    setInvoices([inv, ...invoices]);

    const journalLines = [
      {
        id: `jl-${Date.now()}-1`,
        accountCode: '1-1400',
        accountName: 'Piutang Usaha SPPG',
        debit: inv.netTotal,
        credit: 0,
        memo: `Faktur tagihan ${inv.invoiceNumber}`,
        partyName: inv.sppgName,
      },
      {
        id: `jl-${Date.now()}-2`,
        accountCode: '4-1100',
        accountName: 'Pendapatan Penjualan SPPG',
        debit: 0,
        credit: inv.subtotal,
        memo: `Penjualan pangan ${inv.invoiceNumber}`,
        partyName: inv.sppgName,
      },
    ];

    if (inv.titipanAmount > 0) {
      journalLines.push({
        id: `jl-${Date.now()}-3`,
        accountCode: '2-2100',
        accountName: 'Hutang Titipan SPPG',
        debit: 0,
        credit: inv.titipanAmount,
        memo: `Titipan dana SPPG terpisah`,
        partyName: inv.sppgName,
      });
    }

    if (inv.returAdjustment > 0) {
      journalLines.push({
        id: `jl-${Date.now()}-4`,
        accountCode: '6-1400',
        accountName: 'Beban Retur & Penyusutan Pangan Rusak',
        debit: inv.returAdjustment,
        credit: 0,
        memo: `Potongan retur rusak ${inv.invoiceNumber}`,
        partyName: inv.sppgName,
      });
    }

    const totalDebit = journalLines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = journalLines.reduce((s, l) => s + l.credit, 0);

    const autoJournal: JournalEntry = {
      id: `je-inv-${Date.now()}`,
      entryNumber: journalEntryNumber,
      date: inv.date,
      reference: inv.invoiceNumber,
      description: `Penerbitan faktur supply pangan ke ${inv.sppgName}`,
      status: 'POSTED',
      lines: journalLines,
      totalDebit,
      totalCredit,
      createdAt: new Date().toISOString(),
      createdBy: 'Sistem Faktur AR',
    };

    setJournals((prev) => [autoJournal, ...prev]);
    setAccounts((prev) => applyLinesToAccountBalances(prev, journalLines, 1));
  };

  // Handler: Catat Pelunasan Pembayaran SPPG
  const handleRecordPayment = (
    invoiceId: string,
    amount: number,
    destinationAccountCode: string,
    date: string,
    notes: string
  ) => {
    const targetInv = invoices.find((i) => i.id === invoiceId);
    if (!targetInv) return;

    const newPaidAmount = targetInv.paidAmount + amount;
    const newStatus =
      newPaidAmount >= targetInv.netTotal
        ? 'PAID'
        : newPaidAmount > 0
        ? 'PARTIAL'
        : 'UNPAID';

    setInvoices(
      invoices.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, paidAmount: newPaidAmount, status: newStatus }
          : inv
      )
    );

    const entrySeq = (journals.length + 1).toString().padStart(3, '0');
    const journalEntryNumber = `JU-${activePeriod.startDate.substring(0, 7).replace('-', '')}-${entrySeq}`;

    const destAccount = accounts.find((a) => a.code === destinationAccountCode);

    const journalLines = [
      {
        id: `jl-${Date.now()}-1`,
        accountCode: destinationAccountCode,
        accountName: destAccount ? destAccount.name : 'Kas & Bank',
        debit: amount,
        credit: 0,
        memo: `Penerimaan kas dari ${targetInv.sppgName}`,
        partyName: targetInv.sppgName,
      },
      {
        id: `jl-${Date.now()}-2`,
        accountCode: '1-1400',
        accountName: 'Piutang Usaha SPPG',
        debit: 0,
        credit: amount,
        memo: `Pelunasan piutang faktur ${targetInv.invoiceNumber}`,
        partyName: targetInv.sppgName,
      },
    ];

    const autoJournal: JournalEntry = {
      id: `je-pay-inv-${Date.now()}`,
      entryNumber: journalEntryNumber,
      date,
      reference: targetInv.invoiceNumber,
      description: `Penerimaan pelunasan piutang ${targetInv.sppgName} (${notes})`,
      status: 'POSTED',
      lines: journalLines,
      totalDebit: amount,
      totalCredit: amount,
      createdAt: new Date().toISOString(),
      createdBy: 'Sistem Kas Masuk AR',
    };

    setJournals((prev) => [autoJournal, ...prev]);
    setAccounts((prev) => applyLinesToAccountBalances(prev, journalLines, 1));
  };

  // Handler: Tambah Tagihan Supplier Baru (AP)
  const handleAddBill = (newBill: Omit<SupplierBill, 'id'>) => {
    const entrySeq = (journals.length + 1).toString().padStart(3, '0');
    const journalEntryNumber = `JU-${activePeriod.startDate.substring(0, 7).replace('-', '')}-${entrySeq}`;

    const bill: SupplierBill = {
      ...newBill,
      id: `bill-${Date.now()}`,
      journalEntryNumber,
    };

    setBills([bill, ...bills]);

    let targetSupplierAccount = '2-1400';
    if (bill.supplierName.includes('Queen')) targetSupplierAccount = '2-1100';
    else if (bill.supplierName.includes('Fresh Food')) targetSupplierAccount = '2-1200';
    else if (
      bill.supplierName.includes('Mansur') || 
      bill.supplierName.includes('Royana') || 
      bill.supplierName.includes('HBS') ||
      bill.supplierName.includes('ABR') ||
      bill.supplierName.includes('DRW') ||
      bill.supplierName.includes('BAHRUL')
    ) {
      targetSupplierAccount = '2-1300';
    }

    const supAccount = accounts.find((a) => a.code === targetSupplierAccount);

    const journalLines = [
      {
        id: `jl-${Date.now()}-1`,
        accountCode: '1-1500',
        accountName: 'Persediaan Bahan Pangan - Komoditas',
        debit: bill.totalAmount,
        credit: 0,
        memo: `Penerimaan pasokan ${bill.billNumber}`,
        partyName: bill.supplierName,
      },
      {
        id: `jl-${Date.now()}-2`,
        accountCode: targetSupplierAccount,
        accountName: supAccount ? supAccount.name : 'Hutang Usaha Supplier',
        debit: 0,
        credit: bill.totalAmount,
        memo: `Tagihan tempo ${bill.billNumber}`,
        partyName: bill.supplierName,
      },
    ];

    const autoJournal: JournalEntry = {
      id: `je-bill-${Date.now()}`,
      entryNumber: journalEntryNumber,
      date: bill.date,
      reference: bill.billNumber,
      description: `Tagihan masuk pengadaan pangan dari ${bill.supplierName}`,
      status: 'POSTED',
      lines: journalLines,
      totalDebit: bill.totalAmount,
      totalCredit: bill.totalAmount,
      createdAt: new Date().toISOString(),
      createdBy: 'Sistem Tagihan AP',
    };

    setJournals((prev) => [autoJournal, ...prev]);
    setAccounts((prev) => applyLinesToAccountBalances(prev, journalLines, 1));
  };

  // Handler: Bayar Tagihan Supplier (Kas Keluar AP)
  const handlePayBill = (
    billId: string,
    amount: number,
    sourceAccountCode: string,
    date: string,
    notes: string
  ) => {
    const targetBill = bills.find((b) => b.id === billId);
    if (!targetBill) return;

    const newPaidAmount = targetBill.paidAmount + amount;
    const newStatus =
      newPaidAmount >= targetBill.totalAmount
        ? 'PAID'
        : newPaidAmount > 0
        ? 'PARTIAL'
        : 'UNPAID';

    setBills(
      bills.map((b) =>
        b.id === billId
          ? { ...b, paidAmount: newPaidAmount, status: newStatus }
          : b
      )
    );

    let targetSupplierAccount = '2-1400';
    if (targetBill.supplierName.includes('Queen')) targetSupplierAccount = '2-1100';
    else if (targetBill.supplierName.includes('Fresh Food')) targetSupplierAccount = '2-1200';
    else if (
      targetBill.supplierName.includes('Mansur') || 
      targetBill.supplierName.includes('Royana') || 
      targetBill.supplierName.includes('HBS') ||
      targetBill.supplierName.includes('ABR') ||
      targetBill.supplierName.includes('DRW') ||
      targetBill.supplierName.includes('BAHRUL')
    ) {
      targetSupplierAccount = '2-1300';
    }

    const supAccount = accounts.find((a) => a.code === targetSupplierAccount);
    const sourceAccount = accounts.find((a) => a.code === sourceAccountCode);

    const entrySeq = (journals.length + 1).toString().padStart(3, '0');
    const journalEntryNumber = `JU-${activePeriod.startDate.substring(0, 7).replace('-', '')}-${entrySeq}`;

    const journalLines = [
      {
        id: `jl-${Date.now()}-1`,
        accountCode: targetSupplierAccount,
        accountName: supAccount ? supAccount.name : 'Hutang Usaha Supplier',
        debit: amount,
        credit: 0,
        memo: `Pelunasan tagihan ${targetBill.billNumber}`,
        partyName: targetBill.supplierName,
      },
      {
        id: `jl-${Date.now()}-2`,
        accountCode: sourceAccountCode,
        accountName: sourceAccount ? sourceAccount.name : 'Kas & Bank',
        debit: 0,
        credit: amount,
        memo: `Pengeluaran pembayaran ${targetBill.billNumber}`,
        partyName: targetBill.supplierName,
      },
    ];

    const autoJournal: JournalEntry = {
      id: `je-pay-bill-${Date.now()}`,
      entryNumber: journalEntryNumber,
      date,
      reference: targetBill.billNumber,
      description: `Pengeluaran kas pelunasan tagihan ${targetBill.supplierName} (${notes})`,
      status: 'POSTED',
      lines: journalLines,
      totalDebit: amount,
      totalCredit: amount,
      createdAt: new Date().toISOString(),
      createdBy: 'Sistem Kas Keluar AP',
    };

    setJournals((prev) => [autoJournal, ...prev]);
    setAccounts((prev) => applyLinesToAccountBalances(prev, journalLines, 1));
  };

  // Handler: Bayar Bagi Hasil Investor Bulanan
  const handlePayInvestor = (
    payoutId: string, 
    bankAccountCode: string, 
    bankName: string, 
    accountHolder: string,
    notes: string
  ) => {
    const payout = investorPayouts.find((p) => p.id === payoutId);
    if (!payout) return;

    const entrySeq = (journals.length + 1).toString().padStart(3, '0');
    const entryNumber = `JU-${activePeriod.startDate.substring(0, 7).replace('-', '')}-INV-${entrySeq}`;
    const today = new Date().toISOString().substring(0, 10);

    let liabilityAccountCode = '2-3100'; // Default Dewi amor
    if (payout.investorName.toLowerCase().includes('iis')) {
      liabilityAccountCode = '2-3200';
    } else if (payout.investorName.toLowerCase().includes('novia')) {
      liabilityAccountCode = '2-3300';
    }

    const journalLines = [
      {
        id: `jl-${Date.now()}-1`,
        accountCode: liabilityAccountCode,
        accountName: `Hutang Bagi Hasil Investor - ${payout.investorName}`,
        debit: payout.monthlyPayoutAmount,
        credit: 0,
        memo: `Pelunasan bagi hasil ${payout.period}`,
        partyName: payout.investorName,
      },
      {
        id: `jl-${Date.now()}-2`,
        accountCode: bankAccountCode,
        accountName: `Kas/Bank Rekening Perusahaan (${bankName})`,
        debit: 0,
        credit: payout.monthlyPayoutAmount,
        memo: `Transfer pembayaran bagi hasil a.n. ${payout.investorName}`,
        partyName: payout.investorName,
      },
    ];

    const newJournal: JournalEntry = {
      id: `je-inv-${Date.now()}`,
      entryNumber,
      date: today,
      reference: `INV-PAY-${payout.investorName.toUpperCase()}`,
      description: `Pembayaran Bagi Hasil ${payout.period} Investor ${payout.investorName} via ${bankName}. ${notes}`,
      status: 'POSTED',
      lines: journalLines,
      totalDebit: payout.monthlyPayoutAmount,
      totalCredit: payout.monthlyPayoutAmount,
      createdAt: new Date().toISOString(),
      createdBy: `${currentUser?.fullName || 'Arthur'} (Accounting)`,
    };

    setJournals((prev) => [newJournal, ...prev]);
    setAccounts((prev) => applyLinesToAccountBalances(prev, journalLines, 1));

    // Update investor payout record
    setInvestorPayouts((prev) =>
      prev.map((p) =>
        p.id === payoutId
          ? {
              ...p,
              status: 'PAID',
              paidDate: today,
              paidFromBank: bankName,
              paidFromAccountCode: bankAccountCode,
              journalEntryNumber: entryNumber,
              notes: notes || p.notes,
            }
          : p
      )
    );
  };

  const handleAddInvestorPayout = (payout: MonthlyInvestorPayout) => {
    setInvestorPayouts((prev) => [payout, ...prev]);
  };

  // Handler: Tambah Akun Baru di COA
  const handleAddAccount = (newAccount: Account) => {
    setAccounts([...accounts, newAccount]);
  };

  // Handler: Toggle Aktif Akun
  const handleToggleAccountActive = (code: string) => {
    setAccounts(
      accounts.map((a) => (a.code === code ? { ...a, isActive: !a.isActive } : a))
    );
  };

  // Handler: Tambah Item Rekonsiliasi Cashback
  const handleAddCashbackRecord = (
    rec: Omit<CashbackReconciliationRecord, 'id' | 'cashbackUnitDiff' | 'totalCashback'>
  ) => {
    const diff = rec.sppgPrice - rec.realPrice;
    const totalCb = diff * rec.qty;

    const newRecord: CashbackReconciliationRecord = {
      ...rec,
      id: `cb-${Date.now()}`,
      cashbackUnitDiff: diff,
      totalCashback: totalCb,
    };

    setCashbackRecords([newRecord, ...cashbackRecords]);
  };

  // Metrik Utama Header
  const totalCashAndBank = companyBanks.reduce((sum, b) => sum + b.balance, 0);

  const totalAR = invoices
    .filter((i) => i.status !== 'PAID')
    .reduce((sum, i) => sum + (i.netTotal - i.paidAmount), 0);

  const totalAP = bills
    .filter((b) => b.status !== 'PAID')
    .reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);

  const totalRevenue = accounts
    .filter((a) => a.category === 'REVENUE' && a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalExpense = accounts
    .filter((a) => a.category === 'EXPENSE' && a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  const netIncome = totalRevenue - totalExpense;

  // If not logged in, enforce authentication gate
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        onLogin={(user: AppUser) => {
          try {
            localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
          } catch (e) {
            console.error('Failed to save auth user', e);
          }
          setCurrentUser(user);
          // Auto route to appropriate landing tab
          if (user.role === 'OWNER') {
            setActiveTab('owner');
          } else {
            setActiveTab('overview');
          }
        }}
      />
    );
  }

  // Canonical tab resolution
  const currentTab = activeTab === 'dashboard' ? 'overview' : activeTab;

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 antialiased flex flex-col">
      {/* 1. Left Sidebar Navigation - Figma Admin Dashboard style */}
      <Sidebar
        activeTab={currentTab}
        onTabChange={(tabId) => setActiveTab(tabId as AccountingTab)}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 2. Main Application Container (Shifted right on desktop by 72 = 18rem) */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <AccountingHeader
          activePeriod={activePeriod}
          periods={periods}
          onSelectPeriod={handleSelectPeriod}
          onSelectMonthYear={handleSelectMonthYear}
          onTogglePeriodLock={handleTogglePeriodLock}
          totalCashAndBank={totalCashAndBank}
          totalAR={totalAR}
          totalAP={totalAP}
          netIncome={netIncome}
          onOpenSidebar={() => setSidebarOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Executive Owner Dashboard */}
          {currentTab === 'owner' && (
            <OwnerDashboardTab
              accounts={accounts}
              invoices={invoices}
              bills={bills}
              companyBanks={companyBanks}
              investorPayouts={investorPayouts}
              journals={journals}
              activePeriod={activePeriod}
              onNavigateTab={(tab) => setActiveTab(tab as AccountingTab)}
            />
          )}

          {/* User Management Tab (Arthur Master) */}
          {currentTab === 'users' && (
            <UserManagementTab
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onToggleUserActive={handleToggleUserActive}
              onFormatServerData={handleFormatServerData}
            />
          )}

          {/* Operational Accounting Dashboard */}
          {currentTab === 'overview' && (
            <DashboardOverviewTab
              accounts={accounts}
              journals={journals}
              invoices={invoices}
              bills={bills}
              companyBanks={companyBanks}
              investorPayouts={investorPayouts}
              onNavigateTab={(tab) => setActiveTab(tab as AccountingTab)}
            />
          )}

          {currentTab === 'ledger' && (
            <GeneralLedgerTab
              accounts={accounts}
              journals={journals}
              activePeriod={activePeriod}
              onAddJournal={handleAddJournal}
              onReverseJournal={handleReverseJournal}
            />
          )}

          {currentTab === 'ar' && (
            <AccountsReceivableTab
              invoices={invoices}
              accounts={accounts}
              activePeriod={activePeriod}
              onAddInvoice={handleAddInvoice}
              onRecordPayment={handleRecordPayment}
            />
          )}

          {currentTab === 'ap' && (
            <AccountsPayableTab
              bills={bills}
              accounts={accounts}
              activePeriod={activePeriod}
              onAddBill={handleAddBill}
              onPayBill={handlePayBill}
            />
          )}

          {currentTab === 'investors' && (
            <InvestorObligationsTab
              investorPayouts={investorPayouts}
              companyBanks={companyBanks}
              onPayInvestor={handlePayInvestor}
              onAddInvestorPayout={handleAddInvestorPayout}
            />
          )}

          {currentTab === 'banks' && (
            <div className="space-y-6">
              <CompanyBanksWidget
                banks={companyBanks}
                onNavigateToLedger={() => setActiveTab('ledger')}
              />

              {/* Mutasi Kas & Bank Terakhir */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Mutasi Terakhir Buku Besar Kas & Rekening Bank
                      </h3>
                      <p className="text-xs text-slate-500">
                        Arus kas masuk & keluar yang mempengaruhi saldo 4 rekening resmi
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ledger')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Buka Semua Jurnal
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">No. Jurnal</th>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Rekening Bank</th>
                        <th className="py-2.5 px-3">Keterangan Transaksi</th>
                        <th className="py-2.5 px-3 text-right">Debit (Masuk)</th>
                        <th className="py-2.5 px-3 text-right">Kredit (Keluar)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {journals
                        .filter((j) =>
                          j.lines.some((l) =>
                            ['1-1210', '1-1220', '1-1230', '1-1240', '1-1100', '1-1200', '1-1300'].includes(
                              l.accountCode
                            )
                          )
                        )
                        .slice(0, 8)
                        .map((j) => {
                          const bankLine = j.lines.find((l) =>
                            ['1-1210', '1-1220', '1-1230', '1-1240', '1-1100', '1-1200', '1-1300'].includes(
                              l.accountCode
                            )
                          );
                          const debit = bankLine ? bankLine.debit : 0;
                          const credit = bankLine ? bankLine.credit : 0;

                          return (
                            <tr key={j.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                                {j.entryNumber}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                                {formatDateID(j.date)}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-slate-800">
                                  {bankLine?.accountName || 'Bank Perusahaan'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 max-w-sm truncate">
                                {j.description}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                                {debit > 0 ? formatRupiah(debit) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                                {credit > 0 ? formatRupiah(credit) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'coa' && (
            <ChartOfAccountsTab
              accounts={accounts}
              onAddAccount={handleAddAccount}
              onToggleAccountActive={handleToggleAccountActive}
            />
          )}

          {currentTab === 'reports' && (
            <FinancialReportsTab
              accounts={accounts}
              activePeriod={activePeriod}
            />
          )}

          {currentTab === 'cashback' && (
            <CashbackReconciliationTab
              records={cashbackRecords}
              activePeriod={activePeriod}
              onAddRecord={handleAddCashbackRecord}
              onPostToJournal={() => {}}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-3.5 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">FFN ACCOUNTING</span>
            <span>•</span>
            <span>Fresh Food Nusantara Divisi Akuntansi dan Keuangan</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Sistem Mandiri Siap Pakai • Biznet Neo Server • ffoodnusantara.site
          </div>
        </footer>
      </div>
    </div>
  );
}
