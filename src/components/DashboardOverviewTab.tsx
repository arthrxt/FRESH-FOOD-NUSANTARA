import React from 'react';
import { 
  Account, 
  JournalEntry, 
  SalesInvoice, 
  SupplierBill, 
  CompanyBankAccount, 
  MonthlyInvestorPayout 
} from '../types';
import { formatRupiah, formatDateID } from '../utils/accountingUtils';
import { CompanyBanksWidget } from './CompanyBanksWidget';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Receipt, 
  Truck, 
  Scale,
  Building2,
  Clock,
  Users,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';

interface DashboardOverviewTabProps {
  accounts: Account[];
  journals: JournalEntry[];
  invoices: SalesInvoice[];
  bills: SupplierBill[];
  companyBanks: CompanyBankAccount[];
  investorPayouts: MonthlyInvestorPayout[];
  onNavigateTab: (tab: string) => void;
}

export const DashboardOverviewTab: React.FC<DashboardOverviewTabProps> = ({
  accounts,
  journals,
  invoices,
  bills,
  companyBanks,
  investorPayouts,
  onNavigateTab,
}) => {
  // Hitung total kategori akun
  const totalAssets = accounts
    .filter((a) => a.category === 'ASSET' && a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter((a) => a.category === 'LIABILITY' && a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalEquity = accounts
    .filter((a) => a.category === 'EQUITY' && a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalRevenue = accounts
    .filter((a) => a.category === 'REVENUE' && a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalExpense = accounts
    .filter((a) => a.category === 'EXPENSE' && a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  const netIncome = totalRevenue - totalExpense;

  // Persamaan dasar akuntansi: Aset = Liabilitas + Ekuitas + Laba Berjalan
  const totalPasiva = totalLiabilities + totalEquity + netIncome;
  const isBalanced = Math.abs(totalAssets - totalPasiva) < 1; // toleransi pembulatan

  // Kas & Bank Breakdown
  const totalCashBank = companyBanks.reduce((sum, b) => sum + b.balance, 0);

  // Status Invoices (AR)
  const outstandingInvoices = invoices.filter((i) => i.status !== 'PAID');
  const totalUnpaidAR = outstandingInvoices.reduce((sum, i) => sum + (i.netTotal - i.paidAmount), 0);

  // Status Bills (AP)
  const outstandingBills = bills.filter((b) => b.status !== 'PAID');
  const totalUnpaidAP = outstandingBills.reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);

  // Investor Payouts
  const unpaidInvestorAmount = investorPayouts
    .filter((p) => p.status === 'UNPAID')
    .reduce((sum, p) => sum + p.monthlyPayoutAmount, 0);

  // 5 Jurnal Terbaru
  const recentJournals = [...journals]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Accounting Balance Verification Banner */}
      <div
        id="balance-validator-banner"
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
          isBalanced
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/80 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          {isBalanced ? (
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold">
              {isBalanced
                ? 'Buku Besar Seimbang (Balance Verification: Aset = Liabilitas + Ekuitas)'
                : 'Peringatan: Buku Besar Tidak Berimbang (Out of Balance)'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Total Aset: <span className="font-semibold text-slate-800">{formatRupiah(totalAssets)}</span> | Total
              Pasiva: <span className="font-semibold text-slate-800">{formatRupiah(totalPasiva)}</span>
              {!isBalanced && ` (Selisih: ${formatRupiah(Math.abs(totalAssets - totalPasiva))})`}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('reports')}
          className="self-start sm:self-auto text-xs font-bold px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs text-slate-800 cursor-pointer"
        >
          Buka Neraca & Laba Rugi
        </button>
      </div>

      {/* 4 Metric KPI Cards - Figma Admin Dashboard style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Kas & 4 Rekening Bank */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kas & Bank Perusahaan
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-3">
              {formatRupiah(totalCashBank)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                4 Rekening Aktif
              </span>
              <span className="text-[11px] text-slate-400">BRI & BTN Resmi</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('banks')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center justify-between cursor-pointer"
          >
            <span>Rincian No. Rekening</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Piutang SPPG (AR) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Piutang SPPG (AR)
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-3">
              {formatRupiah(totalUnpaidAR)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {outstandingInvoices.length} Faktur Berjalan
              </span>
              <span className="text-[11px] text-slate-400">Jatuh tempo minggu ini</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('ar')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-between cursor-pointer"
          >
            <span>Kelola Piutang SPPG</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 3: Hutang Supplier (AP) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hutang Supplier (AP)
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-3">
              {formatRupiah(totalUnpaidAP)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                6 Supplier Biasa
              </span>
              <span className="text-[11px] text-slate-400">Mansur, Royana, HBS dll</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('ap')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center justify-between cursor-pointer"
          >
            <span>Bayar Tagihan Supplier</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 4: Kewajiban Bagi Hasil Investor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Bagi Hasil Investor
              </span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-3">
              {formatRupiah(unpaidInvestorAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                Dewi Amor, Bu Iis, Novia
              </span>
              <span className="text-[11px] text-slate-400">Per Bulan</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('investors')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center justify-between cursor-pointer"
          >
            <span>Proses Bagi Hasil</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Widget: 4 Rekening Bank Perusahaan Resmi */}
      <CompanyBanksWidget 
        banks={companyBanks} 
        onNavigateToLedger={() => onNavigateTab('ledger')}
      />

      {/* Grid: Kewajiban Investor & 6 Supplier Pembelian Biasa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box Investor Bulanan */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kewajiban Investor yang Harus Dibayar per Bulan
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Jadwal pembayaran imbal bagi hasil rutin bulanan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('investors')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700"
              >
                Lihat Semua
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {investorPayouts.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center uppercase">
                      {inv.investorName.substring(0, 2)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 capitalize block">
                        {inv.investorName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Jatuh Tempo: {formatDateID(inv.dueDate)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block">
                      {formatRupiah(inv.monthlyPayoutAmount)}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {inv.status === 'PAID' ? 'LUNAS' : 'BELUM DIBAYAR'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Sisa Belum Ditransfer Bulan Ini:</span>
            <span className="font-bold text-amber-700">{formatRupiah(unpaidInvestorAmount)}</span>
          </div>
        </div>

        {/* Box Supplier Pembelian Biasa */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Supplier yang Biasa Kita Beli
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mansur, Royana, HBS, PT ABR, DRW, BAHRUL
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('ap')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                Kelola AP
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { name: 'Mansur', sub: 'Sayur & Bumbu', bill: 'BILL-MANSUR-2609-01' },
                { name: 'Royana', sub: 'Buah & Segar', bill: 'BILL-ROYANA-2609-01' },
                { name: 'HBS', sub: 'Protein & Daging', bill: 'BILL-HBS-2609-01' },
                { name: 'PT ABR', sub: 'Beras & Sembako', bill: 'BILL-ABR-2609-01' },
                { name: 'DRW', sub: 'Bumbu Olahan', bill: 'BILL-DRW-2609-01' },
                { name: 'BAHRUL', sub: 'Sayur Daun & Cabai', bill: 'BILL-BAHRUL-2609-01' },
              ].map((sup) => {
                const b = bills.find((item) => item.supplierName.toLowerCase() === sup.name.toLowerCase());
                const sisa = b ? b.totalAmount - b.paidAmount : 0;
                return (
                  <div key={sup.name} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-amber-300 transition-all">
                    <span className="text-xs font-bold text-slate-900 block truncate">{sup.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{sup.sub}</span>
                    <span className="text-[11px] font-bold text-amber-700 mt-1 block">
                      {sisa > 0 ? formatRupiah(sisa) : 'Lunas'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Tagihan Hutang Supplier:</span>
            <span className="font-bold text-amber-800">{formatRupiah(totalUnpaidAP)}</span>
          </div>
        </div>
      </div>

      {/* Row: Aktivitas Jurnal Terbaru & Struktur Akuntansi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aktivitas Jurnal Terbaru (2 Kolom) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Jurnal Umum Terakhir (Double-Entry Audit Trail)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('ledger')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              Buka Buku Besar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">No. Jurnal</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Keterangan Transaksi</th>
                  <th className="py-2.5 px-3 text-right">Debit/Kredit</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentJournals.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 font-mono">
                      {j.entryNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {formatDateID(j.date)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                      {j.description}
                      <span className="block text-[10px] text-slate-400">Ref: {j.reference}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(j.totalDebit)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          j.status === 'POSTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : j.status === 'REVERSED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ringkasan Laba Rugi Berjalan (1 Kolom) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Kinerja Keuangan Periode</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Pendapatan Pengiriman SPPG</span>
                <span className="font-semibold text-slate-900">{formatRupiah(totalRevenue)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Harga Pokok Penjualan (HPP)</span>
                <span className="font-semibold text-rose-700">
                  {formatRupiah(
                    accounts
                      .filter((a) => a.subcategory === 'Harga Pokok Penjualan')
                      .reduce((s, a) => s + a.balance, 0)
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Beban Operasional & Logistik</span>
                <span className="font-semibold text-rose-700">
                  {formatRupiah(
                    accounts
                      .filter((a) => a.subcategory === 'Beban Operasional')
                      .reduce((s, a) => s + a.balance, 0)
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center py-2.5 bg-emerald-50 text-emerald-950 px-3 rounded-xl font-bold text-sm">
                <span>Laba Bersih Berjalan</span>
                <span className="text-emerald-800">{formatRupiah(netIncome)}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 leading-tight">
              Sistem akuntansi menggunakan basis akrual double-entry mandiri FFN untuk memastikan integritas data operasional dan transparansi margin pengiriman MBG.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
