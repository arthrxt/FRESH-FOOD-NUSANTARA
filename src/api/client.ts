import { 
  AppUser, 
  AccountingPeriod, 
  Account, 
  JournalEntry, 
  SalesInvoice, 
  SupplierBill, 
  CompanyBankAccount, 
  MonthlyInvestorPayout, 
  CashbackReconciliationRecord 
} from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = null;
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  public getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = 'Bearer ' + this.token;
    }

    // Auto-generate idempotency key for financial mutations
    if (['POST', 'PUT', 'DELETE'].includes(options.method || '') && !headers['Idempotency-Key']) {
      headers['Idempotency-Key'] = `req_${crypto.randomUUID()}`;
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        ...options,
        credentials: 'include',
        headers,
      });
    } catch (error) {
      throw new Error('Tidak dapat terhubung ke server. Periksa koneksi atau status server.');
    }

    const contentType = response.headers.get('content-type') || '';
    let payload: any = null;
    const rawText = await response.text();

    if (!rawText) {
      payload = null;
    } else if (
      contentType.includes('application/json') ||
      contentType.includes('+json') ||
      rawText.trim().startsWith('{') ||
      rawText.trim().startsWith('[')
    ) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        throw new Error('Server mengembalikan respons JSON yang tidak valid.');
      }
    } else if (contentType.includes('text/html')) {
      throw new Error(`Server mengembalikan HTML alih-alih JSON (status ${response.status}).`);
    } else {
      throw new Error(`Server mengembalikan respons tidak didukung (${contentType || 'unknown content type'}).`);
    }

    if (!response.ok || !payload || payload.success === false) {
      const errorMsg = payload?.error?.message || `Request gagal dengan status ${response.status}`;
      throw new Error(errorMsg);
    }

    return payload.data as T;
  }

  // Auth
  async login(username: string, password: string): Promise<{ user: AppUser }> {
    const data = await this.request<{ user: AppUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return data;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser(): Promise<AppUser> {
    return this.request<AppUser>('/api/auth/me');
  }

  // Bootstrap
  async getBootstrapData(): Promise<{
    periods: AccountingPeriod[];
    accounts: Account[];
    journals: JournalEntry[];
    invoices: SalesInvoice[];
    bills: SupplierBill[];
    companyBanks: CompanyBankAccount[];
    investorPayouts: MonthlyInvestorPayout[];
    cashbackRecords: CashbackReconciliationRecord[];
    users: AppUser[];
  }> {
    return this.request('/api/accounting/bootstrap');
  }

  // Periods
  async togglePeriodLock(periodId: string): Promise<AccountingPeriod> {
    return this.request<AccountingPeriod>('/api/periods/lock', {
      method: 'POST',
      body: JSON.stringify({ periodId }),
    });
  }

  // COA
  async createAccount(acc: Partial<Account>): Promise<Account> {
    return this.request<Account>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(acc),
    });
  }

  // Journals
  async createJournal(journal: {
    date: string;
    reference: string;
    description: string;
    lines: any[];
    periodId?: string;
  }): Promise<JournalEntry> {
    return this.request<JournalEntry>('/api/journals', {
      method: 'POST',
      body: JSON.stringify(journal),
    });
  }

  async reverseJournal(journalId: string, reason?: string): Promise<{ original: JournalEntry; reversal: JournalEntry }> {
    return this.request('/api/journals/reverse', {
      method: 'POST',
      body: JSON.stringify({ journalId, reason }),
    });
  }

  // Invoices (AR)
  async createInvoice(invoiceData: any): Promise<SalesInvoice> {
    return this.request<SalesInvoice>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async payInvoice(payment: {
    invoiceId: string;
    amount: number;
    destinationAccountCode: string;
    date: string;
    notes?: string;
  }): Promise<SalesInvoice> {
    return this.request<SalesInvoice>('/api/invoices/pay', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  // Bills (AP)
  async createBill(billData: any): Promise<SupplierBill> {
    return this.request<SupplierBill>('/api/bills', {
      method: 'POST',
      body: JSON.stringify(billData),
    });
  }

  async payBill(payment: {
    billId: string;
    amount: number;
    sourceAccountCode: string;
    date: string;
    notes?: string;
  }): Promise<SupplierBill> {
    return this.request<SupplierBill>('/api/bills/pay', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  // Investor Payout
  async payInvestor(data: {
    payoutId: string;
    bankAccountCode: string;
    bankName: string;
    notes?: string;
  }): Promise<MonthlyInvestorPayout> {
    return this.request<MonthlyInvestorPayout>('/api/investors/pay', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Cashback
  async createCashback(data: any): Promise<CashbackReconciliationRecord> {
    return this.request<CashbackReconciliationRecord>('/api/cashback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postCashback(cashbackRecordId: string): Promise<{ record: CashbackReconciliationRecord; journal: JournalEntry }> {
    return this.request('/api/cashback/post-journal', {
      method: 'POST',
      body: JSON.stringify({ cashbackRecordId }),
    });
  }

  // Users
  async createUser(userData: any): Promise<AppUser> {
    return this.request<AppUser>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any): Promise<AppUser> {
    return this.request<AppUser>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async toggleUserActive(id: string): Promise<AppUser> {
    return this.request<AppUser>(`/api/users/${id}/toggle-active`, {
      method: 'POST',
    });
  }

  // Destructive Format
  async formatData(confirmationPhrase: string, masterPassword: string): Promise<{ message: string }> {
    return this.request('/api/system/format-data', {
      method: 'POST',
      body: JSON.stringify({ confirmationPhrase, masterPassword }),
    });
  }
}

export const api = new ApiClient();
