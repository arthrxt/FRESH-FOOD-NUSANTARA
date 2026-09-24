import crypto from 'crypto';
import { dbStore } from './db';
import { ChartOfAccount, JournalEntry, JournalLine, AccountingPeriod } from './types';

export class AccountingService {
  /**
   * Validasi apakah periode terbuka
   */
  public static validatePeriod(periodId: string): AccountingPeriod {
    const db = dbStore.getData();
    const period = db.periods.find((p) => p.id === periodId);
    if (!period) {
      throw new Error(`Periode akuntansi '${periodId}' tidak ditemukan.`);
    }
    if (period.status !== 'OPEN') {
      throw new Error(
        `Periode akuntansi '${period.name}' berstatus ${period.status}. Transaksi baru atau penyesuaian ditolak.`
      );
    }
    return period;
  }

  public static validateTransactionDate(period: AccountingPeriod, date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Tanggal transaksi harus berformat YYYY-MM-DD.');
    }
    if (date < period.startDate || date > period.endDate) {
      throw new Error(`Tanggal transaksi berada di luar periode '${period.name}'.`);
    }
  }

  /**
   * Helper untuk menghitung pembaharuan saldo COA
   */
  public static updateAccountBalances(
    accounts: ChartOfAccount[],
    lines: { accountCode: string; debit: number; credit: number }[],
    multiplier: number = 1
  ): void {
    lines.forEach((line) => {
      const acc = accounts.find((a) => a.code === line.accountCode);
      if (!acc) {
        throw new Error(`Akun dengan kode '${line.accountCode}' tidak ditemukan dalam Bagan Akun.`);
      }

      if (acc.normalBalance === 'DEBIT') {
        acc.balance += (line.debit - line.credit) * multiplier;
      } else {
        acc.balance += (line.credit - line.debit) * multiplier;
      }
      acc.updatedAt = new Date().toISOString();
    });
  }

  /**
   * Validasi Double-Entry: Total Debit === Total Kredit
   */
  public static validateBalancedJournal(lines: JournalLine[]): { totalDebit: number; totalCredit: number } {
    if (!Array.isArray(lines) || lines.length < 2) {
      throw new Error('Jurnal harus memiliki minimal 2 baris.');
    }
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      if (line.debit < 0 || line.credit < 0) {
        throw new Error('Nilai debit dan kredit tidak boleh bernilai negatif.');
      }
      if (line.debit > 0 && line.credit > 0) {
        throw new Error('Satu baris jurnal tidak boleh memiliki debit dan kredit sekaligus.');
      }
      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Jurnal tidak seimbang (Unbalanced Entry). Total Debit (Rp ${totalDebit.toLocaleString()}) !== Total Kredit (Rp ${totalCredit.toLocaleString()}).`
      );
    }

    if (totalDebit === 0) {
      throw new Error('Jurnal tidak boleh bernilai total Rp 0.');
    }

    return { totalDebit, totalCredit };
  }

  /**
   * Buat nomor jurnal berurutan aman
   */
  public static generateJournalNumber(periodDate: string): string {
    const db = dbStore.getData();
    const periodPrefix = periodDate.substring(0, 7).replace('-', '');
    const prefix = `JU-${periodPrefix}-`;
    return this.generateUniqueNumber(prefix, db.journals.map((journal) => journal.entryNumber));
  }

  /**
   * Buat nomor faktur penjualan (AR) berurutan dinamis berdasarkan tanggal periode
   */
  public static generateInvoiceNumber(periodDate: string): string {
    const db = dbStore.getData();
    const yearMonth = periodDate.substring(2, 7).replace('-', ''); // e.g. 2609
    const prefix = `INV-SPPG-${yearMonth}-`;
    return this.generateUniqueNumber(prefix, db.invoices.map((invoice) => invoice.invoiceNumber));
  }

  /**
   * Buat nomor tagihan supplier (AP) berurutan dinamis berdasarkan supplier dan tanggal periode
   */
  public static generateBillNumber(supplierName: string, periodDate: string): string {
    const db = dbStore.getData();
    const yearMonth = periodDate.substring(2, 7).replace('-', ''); // e.g. 2609
    const cleanSupplier = (supplierName || 'SUP')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ' ')
      .trim()
      .split(/\s+/)[0] || 'SUP';
    const prefix = `BILL-${cleanSupplier}-${yearMonth}-`;
    return this.generateUniqueNumber(prefix, db.bills.map((bill) => bill.billNumber));
  }

  private static generateUniqueNumber(prefix: string, existing: string[]): string {
    const occupied = new Set(existing);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = `${prefix}${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
      if (!occupied.has(candidate)) return candidate;
    }
    throw new Error('Gagal membuat nomor dokumen unik.');
  }
}
