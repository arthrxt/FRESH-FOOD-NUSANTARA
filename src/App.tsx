import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import { 
  AppUser, 
  AccountingTab, 
  AccountingPeriod, 
  Account, 
  JournalEntry, 
  SalesInvoice, 
  SupplierBill, 
  CompanyBankAccount, 
  MonthlyInvestorPayout, 
  CashbackReconciliationRecord 
} from './types';

// Components
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { AccountingHeader } from './components/AccountingHeader';
import { DashboardOverviewTab } from './components/DashboardOverviewTab';
import { OwnerDashboardTab } from './components/OwnerDashboardTab';
import { GeneralLedgerTab } from './components/GeneralLedgerTab';
import { AccountsReceivableTab } from './components/AccountsReceivableTab';
import { AccountsPayableTab } from './components/AccountsPayableTab';
import { ChartOfAccountsTab } from './components/ChartOfAccountsTab';
import { FinancialReportsTab } from './components/FinancialReportsTab';
import { CashbackReconciliationTab } from './components/CashbackReconciliationTab';
import { InvestorObligationsTab } from './components/InvestorObligationsTab';
import { UserManagementTab } from './components/UserManagementTab';
import { PeriodManagementModal } from './components/PeriodManagementModal';
import { Loader2 } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<AccountingTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Accounting Core State loaded from Server Database
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('per-2026-09');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [bills, setBills] = useState<SupplierBill[]>([]);
  const [companyBanks, setCompanyBanks] = useState<CompanyBankAccount[]>([]);
  const [investorPayouts, setInvestorPayouts] = useState<MonthlyInvestorPayout[]>([]);
  const [cashbackRecords, setCashbackRecords] = useState<CashbackReconciliationRecord[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  // Period Modal State
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);

  // Load Bootstrap Data from Server
  const refreshAccountingData = async () => {
    try {
      const data = await api.getBootstrapData();
      setPeriods(data.periods);
      setAccounts(data.accounts);
      setJournals(data.journals);
      setInvoices(data.invoices);
      setBills(data.bills);
      setCompanyBanks(data.companyBanks);
      setInvestorPayouts(data.investorPayouts);
      setCashbackRecords(data.cashbackRecords);
      setUsers(data.users);
    } catch (err) {
      console.error('Failed to load server data:', err);
    }
  };

  // Check existing session on load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
        if (user.role === 'OWNER') {
          setActiveTab('owner');
        }
        await refreshAccountingData();
      } catch {
        // No active session
        setCurrentUser(null);
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  // Login handler connected directly to secure server API
  const handleLogin = async (username: string, password: string) => {
    const result = await api.login(username, password);
    setCurrentUser(result.user);
    if (result.user.role === 'OWNER') {
      setActiveTab('owner');
    } else {
      setActiveTab('overview');
    }
    await refreshAccountingData();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setCurrentUser(null);
    }
  };

  // 1. Periods Handlers
  const handleSelectPeriod = (periodId: string) => {
    setSelectedPeriodId(periodId);
  };

  const handleSelectMonthYear = (month: number, year: number) => {
    const padMonth = month.toString().padStart(2, '0');
    const targetPeriod = periods.find((p) => p.startDate.startsWith(`${year}-${padMonth}`));
    if (targetPeriod) {
      setSelectedPeriodId(targetPeriod.id);
    }
  };

  const handleTogglePeriodLock = async (periodId?: string) => {
    const targetId = periodId || selectedPeriodId;
    try {
      const updated = await api.togglePeriodLock(targetId);
      setPeriods((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err: any) {
      alert(`Gagal mengubah status periode: ${err.message}`);
    }
  };

  // 2. Journal Handlers
  const handleAddJournal = async (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    try {
      await api.createJournal({
        date: entry.date,
        reference: entry.reference,
        description: entry.description,
        lines: entry.lines,
        periodId: selectedPeriodId,
      });
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal menyimpan jurnal: ${err.message}`);
    }
  };

  const handleReverseJournal = async (targetEntry: JournalEntry) => {
    try {
      const reason = window.prompt(`Masukkan alasan pembatalan jurnal ${targetEntry.entryNumber}:`) || 'Koreksi administratif';
      await api.reverseJournal(targetEntry.id, reason);
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal membalik jurnal: ${err.message}`);
    }
  };

  // 3. Invoice Handlers (AR)
  const handleAddInvoice = async (newInv: Omit<SalesInvoice, 'id'>) => {
    try {
      await api.createInvoice({
        ...newInv,
        periodId: selectedPeriodId,
      });
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal membuat faktur: ${err.message}`);
    }
  };

  const handleRecordPayment = async (
    invoiceId: string,
    amount: number,
    destinationAccountCode: string,
    date: string,
    notes: string
  ) => {
    try {
      await api.payInvoice({
        invoiceId,
        amount,
        destinationAccountCode,
        date,
        notes,
      });
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal mencatat pembayaran: ${err.message}`);
    }
  };

  // 4. Bill Handlers (AP)
  const handleAddBill = async (newBill: Omit<SupplierBill, 'id'>) => {
    try {
      await api.createBill({
        ...newBill,
        periodId: selectedPeriodId,
      });
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal membuat tagihan supplier: ${err.message}`);
    }
  };

  const handlePayBill = async (
    billId: string,
    amount: number,
    sourceAccountCode: string,
    date: string,
    notes: string
  ) => {
    try {
      await api.payBill({
        billId,
        amount,
        sourceAccountCode,
        date,
        notes,
      });
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal mencatat pelunasan supplier: ${err.message}`);
    }
  };

  // 5. Investor Payouts
  const handlePayInvestor = async (
    payoutId: string,
    bankAccountCode: string,
    bankName: string,
    _accountHolder: string,
    notes: string
  ) => {
    try {
      await api.payInvestor({
        payoutId,
        bankAccountCode,
        bankName,
        notes,
      });
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal membayar investor: ${err.message}`);
    }
  };

  const handleAddInvestorPayout = (_payout: MonthlyInvestorPayout) => {
    // Optional helper
  };

  // 6. COA Handler
  const handleAddAccount = async (newAcc: Account) => {
    try {
      await api.createAccount(newAcc);
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal menambah akun: ${err.message}`);
    }
  };

  const handleToggleAccountActive = (_code: string) => {
    // Optional UI toggle
  };

  // 7. Cashback Posting
  const handleAddCashbackRecord = async (
    rec: Omit<CashbackReconciliationRecord, 'id' | 'cashbackUnitDiff' | 'totalCashback'>
  ) => {
    try {
      await api.createCashback(rec);
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal menambah data rekonsiliasi cashback: ${err.message}`);
    }
  };

  const handlePostCashbackJournal = async (rec: CashbackReconciliationRecord) => {
    try {
      await api.postCashback(rec.id);
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal posting jurnal cashback: ${err.message}`);
    }
  };

  // 8. User Management Handlers (Arthur Master)
  const handleAddUser = async (user: AppUser) => {
    try {
      await api.createUser({
        username: user.username,
        password: user.password,
        fullName: user.fullName,
        role: user.role,
        roleTitle: user.roleTitle,
        department: user.department,
        email: user.email,
        phone: user.phone,
      });
      await refreshAccountingData();
      alert(`Akun pengguna '${user.fullName}' (${user.username}) berhasil didaftarkan di server! Akun kini dapat langsung login di perangkat manapun.`);
    } catch (err: any) {
      alert(`Gagal menambahkan pengguna: ${err.message}`);
    }
  };

  const handleUpdateUser = async (updated: AppUser) => {
    try {
      await api.updateUser(updated.id, {
        fullName: updated.fullName,
        role: updated.role,
        department: updated.department,
        email: updated.email,
        phone: updated.phone,
        password: updated.password,
      });
      await refreshAccountingData();
      alert(`Data pengguna '${updated.fullName}' berhasil diperbarui di server.`);
    } catch (err: any) {
      alert(`Gagal memperbarui pengguna: ${err.message}`);
    }
  };

  const handleToggleUserActive = async (userId: string) => {
    try {
      await api.toggleUserActive(userId);
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal mengubah status aktif pengguna: ${err.message}`);
    }
  };

  // 9. Format Habis Data Server (Total Reset Transaksi)
  const handleFormatServerData = async () => {
    const password = window.prompt('Peringatan: Masukkan Password Master Administrator untuk konfirmasi format data server:');
    if (!password) return;

    try {
      const res = await api.formatData('FORMAT FFN ACCOUNTING', password);
      alert(res.message);
      await refreshAccountingData();
    } catch (err: any) {
      alert(`Gagal memformat data server: ${err.message}`);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">Menghubungkan ke Core Server FFN...</p>
        <p className="text-xs text-slate-500 mt-1">Memuat database akuntansi terpusat</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const activePeriod =
    periods.find((p) => p.id === selectedPeriodId) ||
    periods.find((p) => p.status === 'OPEN') || {
      id: 'per-2026-09',
      name: 'September 2026',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      status: 'OPEN' as const,
    };

  // Header Calculations
  const totalCashAndBank = companyBanks.reduce((sum, b) => sum + b.balance, 0);
  const totalAR = invoices.filter((i) => i.status !== 'PAID').reduce((sum, i) => sum + (i.netTotal - i.paidAmount), 0);
  const totalAP = bills.filter((b) => b.status !== 'PAID').reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);
  const totalRevenue = accounts.filter((a) => a.category === 'REVENUE' && a.isActive).reduce((sum, a) => sum + a.balance, 0);
  const totalExpense = accounts.filter((a) => a.category === 'EXPENSE' && a.isActive).reduce((sum, a) => sum + a.balance, 0);
  const netIncome = totalRevenue - totalExpense;

  const currentTab = activeTab === 'dashboard' ? 'overview' : activeTab;

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 antialiased flex flex-col">
      <Sidebar
        activeTab={currentTab}
        onTabChange={(tabId) => setActiveTab(tabId as AccountingTab)}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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

          {currentTab === 'receivable' && (
            <AccountsReceivableTab
              invoices={invoices}
              accounts={accounts}
              activePeriod={activePeriod}
              onAddInvoice={handleAddInvoice}
              onRecordPayment={handleRecordPayment}
            />
          )}

          {currentTab === 'payable' && (
            <AccountsPayableTab
              bills={bills}
              accounts={accounts}
              activePeriod={activePeriod}
              onAddBill={handleAddBill}
              onPayBill={handlePayBill}
            />
          )}

          {currentTab === 'accounts' && (
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
              onPostToJournal={handlePostCashbackJournal}
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
        </main>
      </div>

      <PeriodManagementModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        periods={periods}
        activePeriod={activePeriod}
        onSelectPeriod={handleSelectPeriod}
        onToggleLock={handleTogglePeriodLock}
      />
    </div>
  );
}

export default App;
