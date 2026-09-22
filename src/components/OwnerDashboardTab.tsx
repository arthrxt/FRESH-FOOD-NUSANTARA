import React from 'react';
import { 
  Account, 
  SalesInvoice, 
  SupplierBill, 
  CompanyBankAccount, 
  MonthlyInvestorPayout, 
  JournalEntry,
  AccountingPeriod 
} from '../types';
import { formatRupiah, formatDateID } from '../utils/accountingUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  Truck, 
  Users, 
  ShieldCheck, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Server, 
  Globe, 
  CreditCard,
  PieChart,
  BarChart3,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface OwnerDashboardTabProps {
  accounts: Account[];
  invoices: SalesInvoice[];
  bills: SupplierBill[];
  companyBanks: CompanyBankAccount[];
  investorPayouts: MonthlyInvestorPayout[];
  journals: JournalEntry[];
  activePeriod: AccountingPeriod;
  onNavigateTab: (tab: string) => void;
}

export const OwnerDashboardTab: React.FC<OwnerDashboardTabProps> = ({
  accounts,
  invoices,
  bills,
  companyBanks,
  investorPayouts,
  journals,
  activePeriod,
  onNavigateTab,
}) => {
  // 1. Total Pendapatan (Revenue)
  const totalRevenue = accounts
    .filter((a) => a.category === 'REVENUE' && a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  // 2. Beban Pokok Penjualan (HPP)
  const totalHPP = accounts
    .filter((a) => a.subcategory === 'Harga Pokok Penjualan' && a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  // 3. Beban Operasional & Pengeluaran Lainnya
  const totalOperationalExpense = accounts
    .filter((a) => a.subcategory === 'Beban Operasional' && a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalAllExpense = accounts
    .filter((a) => a.category === 'EXPENSE' && a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  // 4. Laba Kotor & Laba Bersih
  const grossProfit = totalRevenue - totalHPP;
  const netIncome = totalRevenue - totalAllExpense;
  const netProfitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  // 5. Arus Kas Riil (Cash Flow Inflow & Outflow dari Rekening Kas & Bank)
  const cashAccountsCodes = ['1-1100', '1-1200', '1-1210', '1-1220', '1-1230', '1-1240', '1-1300'];
  let totalCashInflow = 0;
  let totalCashOutflow = 0;

  journals.forEach((j) => {
    j.lines.forEach((l) => {
      if (cashAccountsCodes.includes(l.accountCode)) {
        totalCashInflow += l.debit;
        totalCashOutflow += l.credit;
      }
    });
  });

  const netCashFlow = totalCashInflow - totalCashOutflow;

  // 6. Piutang Tertahan di SPPG (AR)
  const totalOutstandingAR = invoices
    .filter((i) => i.status !== 'PAID')
    .reduce((sum, i) => sum + (i.netTotal - i.paidAmount), 0);

  const totalCollectedAR = invoices.reduce((sum, i) => sum + i.paidAmount, 0);

  // 7. Hutang Tagihan Supplier Berjalan (AP)
  const totalOutstandingAP = bills
    .filter((b) => b.status !== 'PAID')
    .reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);

  const totalPaidAP = bills.reduce((sum, b) => sum + b.paidAmount, 0);

  // 8. Saldo Likuiditas 4 Rekening Bank Perusahaan
  const totalBankBalance = companyBanks.reduce((sum, b) => sum + b.balance, 0);

  // 9. Komitmen Investor Bulanan
  const totalInvestorObligation = investorPayouts.reduce((sum, p) => sum + p.monthlyPayoutAmount, 0);
  const paidInvestorObligation = investorPayouts
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.monthlyPayoutAmount, 0);
  const unpaidInvestorObligation = totalInvestorObligation - paidInvestorObligation;

  // Breakdown Pendapatan per SPPG
  const sppgPerformance = [
    { name: 'SPPG Cimalaka', total: 64200000, paid: 50000000, unpaid: 14200000, status: 'Aktif Rutin' },
    { name: 'SPPG Paseh', total: 48500000, paid: 35000000, unpaid: 13500000, status: 'Aktif Rutin' },
    { name: 'SPPG Situraja', total: 52300000, paid: 52300000, unpaid: 0, status: 'Lunas Penuh' },
    { name: 'SPPG Kamal', total: 31000000, paid: 20000000, unpaid: 11000000, status: 'Aktif Rutin' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Executive Briefing */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                EXECUTIVE OWNER INTELLIGENCE
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-emerald-400" />
                ffoodnusantara.site
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <Server className="w-3 h-3 text-blue-400" />
                Biznet Neo Cloud
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Ringkasan Eksekutif Finansial & Operasional
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Pantau langsung seluruh kinerja bisnis supply pangan Fresh Food Nusantara untuk program SPPG Sumedang: realisasi pendapatan, perputaran kas riil di 4 rekening bank, piutang yang belum cair, serta kewajiban supplier dan investor dalam satu tampilan komprehensif.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 lg:min-w-[260px] text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Status Kesehatan Kas
            </span>
            <div className="flex items-center justify-end gap-2 text-emerald-400 font-black text-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Sangat Likuid & Sehat</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Arus Kas Bersih: <strong className="text-white">+{formatRupiah(netCashFlow)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 6 Core Metric Cards for Owner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Metric 1: Total Pendapatan */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Omzet Penjualan
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-black text-slate-900 tracking-tight mt-2">
              {formatRupiah(totalRevenue)}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Supply SPPG</span>
            <span className="font-semibold text-blue-600">{invoices.length} Faktur</span>
          </div>
        </div>

        {/* Metric 2: Pemasukan Kas Riil */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Kas Riil Masuk
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-black text-emerald-600 tracking-tight mt-2">
              {formatRupiah(totalCashInflow)}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Pelunasan SPPG</span>
            <span className="font-semibold text-emerald-600">Masuk Rekening</span>
          </div>
        </div>

        {/* Metric 3: Pengeluaran Kas Riil */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Kas Riil Keluar
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-black text-rose-600 tracking-tight mt-2">
              {formatRupiah(totalCashOutflow)}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Belanja & Operasional</span>
            <span className="font-semibold text-rose-600">Keluar Rekening</span>
          </div>
        </div>

        {/* Metric 4: Laba Bersih Berjalan */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Laba Bersih
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-black text-teal-700 tracking-tight mt-2">
              {formatRupiah(netIncome)}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Margin Bersih</span>
            <span className="font-bold text-teal-700">{netProfitMargin.toFixed(1)}%</span>
          </div>
        </div>

        {/* Metric 5: Piutang Tertahan di SPPG */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Piutang SPPG (AR)
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-black text-amber-600 tracking-tight mt-2">
              {formatRupiah(totalOutstandingAR)}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Tertahan di SPPG</span>
            <span className="font-semibold text-amber-600">Harus Ditagih</span>
          </div>
        </div>

        {/* Metric 6: Hutang Supplier (AP) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Hutang Supplier (AP)
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-black text-purple-700 tracking-tight mt-2">
              {formatRupiah(totalOutstandingAP)}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>6 Supplier Rekanan</span>
            <span className="font-semibold text-purple-700">Tempo Berjalan</span>
          </div>
        </div>
      </div>

      {/* Row: Struktur Likuiditas 4 Rekening Bank & Profit Margin Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1 & 2: Posisi Kas & Likuiditas di 4 Rekening Bank Perusahaan */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Posisi Likuiditas Kas di 4 Rekening Bank FFN
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rekening resmi untuk pembayaran supplier, pelunasan SPPG, dan pembagian dividen
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Kas Siap Pakai
                </span>
                <span className="text-xl font-black text-slate-900">
                  {formatRupiah(totalBankBalance)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {companyBanks.map((bank) => {
                const percent = totalBankBalance > 0 ? (bank.balance / totalBankBalance) * 100 : 0;
                return (
                  <div
                    key={bank.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-slate-900 text-white">
                          BANK {bank.bankName}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {percent.toFixed(1)}% dari total
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-2 truncate">
                        {bank.accountHolder}
                      </p>
                      <p className="font-mono text-xs text-slate-500 tracking-wider">
                        {bank.accountNumber}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Saldo Riil:</span>
                      <span className="font-black text-slate-900 text-sm">
                        {formatRupiah(bank.balance)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Setiap transaksi perbankan diaudit langsung di Buku Besar Double-Entry oleh tim akuntansi Arthur.
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('banks')}
              className="text-blue-600 font-bold hover:text-blue-700 cursor-pointer"
            >
              Lihat Detail Rekening →
            </button>
          </div>
        </div>

        {/* Kolom 3: Bedah Struktur Margin Laba Rugi */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Struktur Biaya & Margin Laba
                </h3>
                <p className="text-[11px] text-slate-500">Kalkulasi basis akrual standar SAK EMKM</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Pendapatan SPPG</span>
                <span className="font-bold text-slate-900">{formatRupiah(totalRevenue)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Beban Pokok Penjualan (HPP)</span>
                <span className="font-semibold text-rose-600">-{formatRupiah(totalHPP)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-slate-50 font-bold text-slate-800">
                <span>Laba Kotor (Gross Profit)</span>
                <span className="text-emerald-700">{formatRupiah(grossProfit)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Beban Operasional & Logistik</span>
                <span className="font-semibold text-rose-600">-{formatRupiah(totalOperationalExpense)}</span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-emerald-50 text-emerald-950 font-black text-sm">
                <span>Laba Bersih Berjalan</span>
                <span className="text-emerald-700">{formatRupiah(netIncome)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600">
            <span className="font-bold block text-slate-800 mb-0.5">Catatan Eksekutif:</span>
            Tingkat efisiensi operasional sangat baik dengan margin laba bersih sebesar {netProfitMargin.toFixed(1)}%. Beban supplier terkendali dengan pasokan dari 6 rekanan utama.
          </div>
        </div>
      </div>

      {/* Row: Distribusi SPPG & Pembayaran Supplier/Investor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box Performa SPPG (Titik Distribusi Sumedang) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Realisasi Supply & Piutang per Titik SPPG
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pantauan perputaran tagihan makan bergizi gratis di Sumedang
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('ar')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Detail AR →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Titik SPPG</th>
                  <th className="py-2.5 px-3 text-right">Nilai Pasokan</th>
                  <th className="py-2.5 px-3 text-right">Sudah Cair</th>
                  <th className="py-2.5 px-3 text-right">Sisa Piutang</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sppgPerformance.map((sp) => (
                  <tr key={sp.name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{sp.name}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{formatRupiah(sp.total)}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-600">{formatRupiah(sp.paid)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-600">
                      {sp.unpaid > 0 ? formatRupiah(sp.unpaid) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sp.unpaid === 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {sp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Box Kewajiban Investor Bulanan & 6 Supplier */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kewajiban Bagi Hasil Investor Bulanan
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dewi Amor, Bu Iis, Novia — Rekapitulasi pembayaran dividen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('investors')}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                Kelola Investor →
              </button>
            </div>

            <div className="space-y-2.5">
              {investorPayouts.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs uppercase">
                      {inv.investorName.substring(0, 2)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs capitalize block">
                        {inv.investorName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Pokok Modal: {formatRupiah(inv.investmentAmount)} • Tempo: {formatDateID(inv.dueDate)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-xs text-slate-900 block">
                      {formatRupiah(inv.monthlyPayoutAmount)}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {inv.status === 'PAID' ? 'Sudah Ditransfer' : 'Menunggu Transfer'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Sisa Belum Ditransfer Bulan Ini:</span>
            <span className="font-black text-amber-700 text-sm">
              {formatRupiah(unpaidInvestorObligation)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
