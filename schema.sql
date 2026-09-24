-- ==============================================================================
-- FRESH FOOD NUSANTARA (FFN) - POSTGRESQL PRODUCTION ACCOUNTING SCHEMA
-- Target Database: PostgreSQL 14+ / Supabase / Cloud SQL
-- All monetary amounts stored as NUMERIC(15, 2)
-- All operations append-only or strict audit logged
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO roles (id, name, description) VALUES
('MASTER', 'Master Administrator', 'Akses penuh seluruh sistem, otorisasi format data, audit trail, user management'),
('OWNER', 'Executive Owner', 'Akses eksekutif laporan keuangan, dashboard, audit finansial (Read & Executive review)'),
('ACCOUNTING', 'Accounting Staff', 'Operasional akuntansi harian, jurnal, faktur AR, tagihan AP, kas bank')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL REFERENCES roles(id),
    role_title VARCHAR(128) NOT NULL,
    department VARCHAR(128) NOT NULL,
    email VARCHAR(128),
    phone VARCHAR(32),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. ACCOUNTING PERIODS
CREATE TABLE IF NOT EXISTS accounting_periods (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'per-2026-09'
    name VARCHAR(64) NOT NULL,  -- e.g. 'September 2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(16) DEFAULT 'OPEN' NOT NULL CHECK (status IN ('OPEN', 'LOCKED', 'CLOSED')),
    closed_at TIMESTAMPTZ,
    closed_by VARCHAR(64) REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_periods_status ON accounting_periods(status);

-- 3. CHART OF ACCOUNTS (COA)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    code VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    subcategory VARCHAR(64) NOT NULL,
    normal_balance VARCHAR(16) NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    description TEXT,
    balance NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coa_category ON chart_of_accounts(category);

-- 4. JOURNAL ENTRIES & LINES (DOUBLE-ENTRY GENERAL LEDGER)
CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(64) PRIMARY KEY,
    entry_number VARCHAR(64) UNIQUE NOT NULL, -- e.g. JU-202609-001
    period_id VARCHAR(32) NOT NULL REFERENCES accounting_periods(id),
    date DATE NOT NULL,
    reference VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(16) DEFAULT 'POSTED' NOT NULL CHECK (status IN ('DRAFT', 'POSTED', 'REVERSED')),
    total_debit NUMERIC(15, 2) NOT NULL CHECK (total_debit >= 0),
    total_credit NUMERIC(15, 2) NOT NULL CHECK (total_credit >= 0),
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reversed_by_entry_number VARCHAR(64),
    is_reversal_of_entry_number VARCHAR(64),
    CONSTRAINT chk_journal_balanced CHECK (total_debit = total_credit)
);

CREATE INDEX IF NOT EXISTS idx_journal_period ON journal_entries(period_id);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_journal_entry_num ON journal_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_journal_status ON journal_entries(status);

CREATE TABLE IF NOT EXISTS journal_lines (
    id VARCHAR(64) PRIMARY KEY,
    journal_id VARCHAR(64) NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(32) NOT NULL REFERENCES chart_of_accounts(code),
    account_name VARCHAR(128) NOT NULL,
    debit NUMERIC(15, 2) DEFAULT 0 NOT NULL CHECK (debit >= 0),
    credit NUMERIC(15, 2) DEFAULT 0 NOT NULL CHECK (credit >= 0),
    memo TEXT,
    party_name VARCHAR(128),
    CONSTRAINT chk_journal_line_positive CHECK (debit > 0 OR credit > 0)
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_jid ON journal_lines(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_acode ON journal_lines(account_code);

-- 5. COMPANY BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS company_banks (
    id VARCHAR(64) PRIMARY KEY,
    bank_name VARCHAR(32) NOT NULL,
    account_number VARCHAR(64) NOT NULL,
    account_holder VARCHAR(128) NOT NULL,
    account_code VARCHAR(32) NOT NULL REFERENCES chart_of_accounts(code),
    balance NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    status VARCHAR(16) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    branch VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. SALES INVOICES & PAYMENTS (ACCOUNTS RECEIVABLE - SPPG)
CREATE TABLE IF NOT EXISTS sales_invoices (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(64) UNIQUE NOT NULL,
    period_id VARCHAR(32) NOT NULL REFERENCES accounting_periods(id),
    sppg_name VARCHAR(128) NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    period VARCHAR(64) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0),
    cashback_credit NUMERIC(15, 2) DEFAULT 0 NOT NULL CHECK (cashback_credit >= 0),
    titipan_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL CHECK (titipan_amount >= 0),
    retur_adjustment NUMERIC(15, 2) DEFAULT 0 NOT NULL CHECK (retur_adjustment >= 0),
    net_total NUMERIC(15, 2) NOT NULL CHECK (net_total >= 0),
    paid_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL CHECK (paid_amount >= 0),
    status VARCHAR(16) DEFAULT 'UNPAID' NOT NULL CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID', 'CANCELLED')),
    journal_entry_number VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_invoice_paid_not_exceed CHECK (paid_amount <= net_total)
);

CREATE INDEX IF NOT EXISTS idx_invoices_period ON sales_invoices(period_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_sppg ON sales_invoices(sppg_name);

CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id VARCHAR(64) PRIMARY KEY,
    invoice_id VARCHAR(64) NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL CHECK (category IN ('BUAH', 'SAYUR', 'BUMBU', 'PROTEIN', 'SEMBAKO DAN OLAHAN LAINNYA')),
    qty NUMERIC(12, 3) NOT NULL CHECK (qty > 0),
    unit VARCHAR(32) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    total NUMERIC(15, 2) NOT NULL CHECK (total >= 0)
);

CREATE TABLE IF NOT EXISTS sales_invoice_payments (
    id VARCHAR(64) PRIMARY KEY,
    invoice_id VARCHAR(64) NOT NULL REFERENCES sales_invoices(id),
    payment_number VARCHAR(64) UNIQUE NOT NULL,
    period_id VARCHAR(32) NOT NULL REFERENCES accounting_periods(id),
    date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    destination_account_code VARCHAR(32) NOT NULL REFERENCES chart_of_accounts(code),
    journal_entry_number VARCHAR(64),
    notes TEXT,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. SUPPLIER BILLS & PAYMENTS (ACCOUNTS PAYABLE)
CREATE TABLE IF NOT EXISTS supplier_bills (
    id VARCHAR(64) PRIMARY KEY,
    bill_number VARCHAR(64) UNIQUE NOT NULL,
    period_id VARCHAR(32) NOT NULL REFERENCES accounting_periods(id),
    supplier_name VARCHAR(128) NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL CHECK (paid_amount >= 0),
    status VARCHAR(16) DEFAULT 'UNPAID' NOT NULL CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID', 'CANCELLED')),
    journal_entry_number VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_bill_paid_not_exceed CHECK (paid_amount <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_bills_period ON supplier_bills(period_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON supplier_bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_supplier ON supplier_bills(supplier_name);

CREATE TABLE IF NOT EXISTS supplier_bill_items (
    id VARCHAR(64) PRIMARY KEY,
    bill_id VARCHAR(64) NOT NULL REFERENCES supplier_bills(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    qty NUMERIC(12, 3) NOT NULL CHECK (qty > 0),
    unit VARCHAR(32) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    total NUMERIC(15, 2) NOT NULL CHECK (total >= 0)
);

CREATE TABLE IF NOT EXISTS supplier_bill_payments (
    id VARCHAR(64) PRIMARY KEY,
    bill_id VARCHAR(64) NOT NULL REFERENCES supplier_bills(id),
    payment_number VARCHAR(64) UNIQUE NOT NULL,
    period_id VARCHAR(32) NOT NULL REFERENCES accounting_periods(id),
    date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    source_account_code VARCHAR(32) NOT NULL REFERENCES chart_of_accounts(code),
    journal_entry_number VARCHAR(64),
    notes TEXT,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. MONTHLY INVESTOR PAYOUTS
CREATE TABLE IF NOT EXISTS investor_payouts (
    id VARCHAR(64) PRIMARY KEY,
    investor_name VARCHAR(128) NOT NULL,
    period VARCHAR(64) NOT NULL,
    investment_amount NUMERIC(15, 2) NOT NULL CHECK (investment_amount >= 0),
    monthly_payout_amount NUMERIC(15, 2) NOT NULL CHECK (monthly_payout_amount >= 0),
    due_date DATE NOT NULL,
    status VARCHAR(16) DEFAULT 'UNPAID' NOT NULL CHECK (status IN ('UNPAID', 'PAID')),
    paid_date DATE,
    paid_from_bank VARCHAR(128),
    paid_from_account_code VARCHAR(32) REFERENCES chart_of_accounts(code),
    journal_entry_number VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. CASHBACK & RECONCILIATIONS
CREATE TABLE IF NOT EXISTS cashback_records (
    id VARCHAR(64) PRIMARY KEY,
    period_id VARCHAR(32) NOT NULL REFERENCES accounting_periods(id),
    sppg VARCHAR(128) NOT NULL,
    period VARCHAR(64) NOT NULL,
    date DATE NOT NULL,
    item VARCHAR(128) NOT NULL,
    qty NUMERIC(12, 3) NOT NULL CHECK (qty > 0),
    unit VARCHAR(32) NOT NULL,
    sppg_price NUMERIC(15, 2) NOT NULL CHECK (sppg_price >= 0),
    real_price NUMERIC(15, 2) NOT NULL CHECK (real_price >= 0),
    cashback_unit_diff NUMERIC(15, 2) NOT NULL,
    total_cashback NUMERIC(15, 2) NOT NULL,
    titipan_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    retur_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    accounting_status VARCHAR(32) DEFAULT 'TERCATAT_PIUTANG' NOT NULL CHECK (accounting_status IN ('TERCATAT_PIUTANG', 'SUDAH_DIKREDIT', 'SETOR_TUNAI')),
    journal_entry_number VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. IDEMPOTENCY KEYS
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    request_hash VARCHAR(128) NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
    response_body JSONB,
    status_code INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 11. AUDIT LOGS (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64),
    action VARCHAR(64) NOT NULL,
    resource VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128),
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(64),
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
