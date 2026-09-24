import { dbStore } from './db';
import { ChartOfAccount, JournalEntry, JournalLine, AccountingPeriod } from './types';

export class AccountingService {
  /**
   * Validasi ketat periode akuntansi (OPEN, LOCKED, CLOSED)
   */
  public static validatePeriod(periodId: string, transactionDate?: string): AccountingPeriod {
    const db = dbStore.getData();
    const period = db.periods.find((p) => p.id === periodId);
    if (!period) {
      throw new Error(`Periode akuntansi '${periodId}' tidak ditemukan.`);
    }
    if (period.status !== 'OPEN') {
      throw new Error(
        `Periode akuntansi '${period.name}' berstatus ${period.status}. Transaksi baru atau penyesuaian ditolak oleh sistem keamanan periode.`
      );
    }

    if (transactionDate) {
      const txDate = new Date(transactionDate);
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      if (txDate < start || txDate > end) {
        throw new Error(
          `Tanggal transaksi (${transactionDate}) berada di luar jangkauan tanggal periode '${period.name}' (${period.startDate} s/d ${period.endDate}).`
        );
      }
    }

    return period;
  }

  /**
   * Helper untuk menghitung pembaharuan saldo COA secara safe decimal
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
      if (!acc.isActive) {
        throw new Error(`Akun '${acc.name}' (${acc.code}) berstatus nonaktif.`);
      }

      const debit = Math.round((Number(line.debit) || 0) * 100) / 100;
      const credit = Math.round((Number(line.credit) || 0) * 100) / 100;

      if (acc.normalBalance === 'DEBIT') {
        acc.balance = Math.round((acc.balance + (debit - credit) * multiplier) * 100) / 100;
      } else {
        acc.balance = Math.round((acc.balance + (credit - debit) * multiplier) * 100) / 100;
      }
      acc.updatedAt = new Date().toISOString();
    });
  }

  /**
   * Validasi Double-Entry: Total Debit === Total Kredit
   */
  public static validateBalancedJournal(lines: JournalLine[]): { totalDebit: number; totalCredit: number } {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      const d = Number(line.debit) || 0;
      const c = Number(line.credit) || 0;

      if (isNaN(d) || isNaN(c) || !isFinite(d) || !isFinite(c)) {
        throw new Error('Nilai debit atau kredit tidak valid (NaN/Infinity).');
      }

      if (d < 0 || c < 0) {
        throw new Error('Nilai debit dan kredit tidak boleh bernilai negatif.');
      }

      if (d > 0 && c > 0) {
        throw new Error('Satu baris akun tidak boleh memiliki debit dan kredit sekaligus.');
      }

      totalDebit = Math.round((totalDebit + d) * 100) / 100;
      totalCredit = Math.round((totalCredit + c) * 100) / 100;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(
        `Jurnal tidak seimbang (Unbalanced Entry). Total Debit (Rp ${totalDebit.toLocaleString('id-ID')}) !== Total Kredit (Rp ${totalCredit.toLocaleString('id-ID')}).`
      );
    }

    if (totalDebit <= 0) {
      throw new Error('Jurnal tidak boleh bernilai total Rp 0.');
    }

    return { totalDebit, totalCredit };
  }

  /**
   * Buat nomor jurnal berurutan aman dari database sequence
   */
  public static generateJournalNumber(periodDate: string): string {
    const db = dbStore.getData();
    const periodPrefix = periodDate.substring(0, 7).replace('-', '');
    const prefix = `JU-${periodPrefix}-`;
    
    // Cari nomor urut tertinggi yang ada
    let maxSeq = 0;
    db.journals.forEach((j) => {
      if (j.entryNumber.startsWith(prefix)) {
        const parts = j.entryNumber.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });

    return `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
  }

  /**
   * Buat nomor faktur penjualan (AR) berurutan dinamis
   */
  public static generateInvoiceNumber(periodDate: string): string {
    const db = dbStore.getData();
    const yearMonth = periodDate.substring(2, 7).replace('-', '');
    const prefix = `INV-SPPG-${yearMonth}-`;

    let maxSeq = 0;
    db.invoices.forEach((inv) => {
      if (inv.invoiceNumber.startsWith(prefix)) {
        const parts = inv.invoiceNumber.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });

    return `${prefix}${(maxSeq + 1).toString().padStart(2, '0')}`;
  }

  /**
   * Buat nomor tagihan supplier (AP) berurutan dinamis
   */
  public static generateBillNumber(supplierName: string, periodDate: string): string {
    const db = dbStore.getData();
    const yearMonth = periodDate.substring(2, 7).replace('-', '');
    const cleanSupplier = (supplierName || 'SUP')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ' ')
      .trim()
      .split(/\s+/)[0] || 'SUP';
    const prefix = `BILL-${cleanSupplier}-${yearMonth}-`;

    let maxSeq = 0;
    db.bills.forEach((b) => {
      if (b.billNumber.startsWith(prefix)) {
        const parts = b.billNumber.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });

    return `${prefix}${(maxSeq + 1).toString().padStart(2, '0')}`;
  }
}
