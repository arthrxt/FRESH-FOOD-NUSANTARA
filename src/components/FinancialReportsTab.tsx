import React, { useState } from 'react';
import { Account, AccountingPeriod } from '../types';
import { formatRupiah, formatNumberID } from '../utils/accountingUtils';
import { 
  FileSpreadsheet, 
  Printer, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Scale, 
  ListOrdered 
} from 'lucide-react';

interface FinancialReportsTabProps {
  accounts: Account[];
  activePeriod: AccountingPeriod;
}

export const FinancialReportsTab: React.FC<FinancialReportsTabProps> = ({
  accounts,
  activePeriod,
}) => {
  const [reportType, setReportType] = useState<'pnl' | 'balance_sheet' | 'trial_balance'>('pnl');
  const [isCopied, setIsCopied] = useState(false);

  // Group accounts
  const assets = accounts.filter((a) => a.category === 'ASSET' && a.isActive);
  const liabilities = accounts.filter((a) => a.category === 'LIABILITY' && a.isActive);
  const equities = accounts.filter((a) => a.category === 'EQUITY' && a.isActive);
  const revenues = accounts.filter((a) => a.category === 'REVENUE' && a.isActive);
  const expenses = accounts.filter((a) => a.category === 'EXPENSE' && a.isActive);

  // Total Revenue & Expense
  const totalRevenue = revenues.reduce((s, a) => s + a.balance, 0);
  const hppExpenses = expenses.filter((a) => a.subcategory === 'Harga Pokok Penjualan');
  const operationalExpenses = expenses.filter((a) => a.subcategory === 'Beban Operasional');
  
  const totalHPP = hppExpenses.reduce((s, a) => s + a.balance, 0);
  const grossProfit = totalRevenue - totalHPP;
  const totalOperational = operationalExpenses.reduce((s, a) => s + a.balance, 0);
  const netIncome = grossProfit - totalOperational;

  // Balance Sheet Totals
  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
  const totalEquity = equities.reduce((s, a) => s + a.balance, 0);
  const totalPasiva = totalLiabilities + totalEquity + netIncome;
  const isBalanceSheetBalanced = Math.abs(totalAssets - totalPasiva) < 1;

  // Trial Balance Totals
  let totalTBDebit = 0;
  let totalTBCredit = 0;

  accounts.filter((a) => a.isActive).forEach((acc) => {
    if (acc.normalBalance === 'DEBIT') {
      totalTBDebit += acc.balance;
    } else {
      totalTBCredit += acc.balance;
    }
  });

  // Salin Laporan Format Teks WA
  const handleCopyReport = () => {
    let text = '';
    if (reportType === 'pnl') {
      text = `*LAPORAN LABA RUGI FRESH FOOD NUSANTARA*\n*PERIODE: ${activePeriod.name.toUpperCase()}*\n\n` +
        `*PENDAPATAN USAHA*\n` +
        revenues.map((r) => `${r.name}: ${formatRupiah(r.balance)}`).join('\n') +
        `\n*Total Pendapatan: ${formatRupiah(totalRevenue)}*\n\n` +
        `*HARGA POKOK PENJUALAN (HPP)*\n` +
        hppExpenses.map((h) => `${h.name}: ${formatRupiah(h.balance)}`).join('\n') +
        `\n*Total HPP: ${formatRupiah(totalHPP)}*\n` +
        `*LABA KOTOR: ${formatRupiah(grossProfit)}*\n\n` +
        `*BEBAN OPERASIONAL & LOGISTIK*\n` +
        operationalExpenses.map((o) => `${o.name}: ${formatRupiah(o.balance)}`).join('\n') +
        `\n*Total Beban Operasional: ${formatRupiah(totalOperational)}*\n\n` +
        `*LABA BERSIH PERIODE BERJALAN: ${formatRupiah(netIncome)}*`;
    } else if (reportType === 'balance_sheet') {
      text = `*NERACA KEUANGAN FRESH FOOD NUSANTARA*\n*PERIODE: ${activePeriod.name.toUpperCase()}*\n\n` +
        `*ASET (AKTIVA)*\n` +
        assets.map((a) => `${a.name}: ${formatRupiah(a.balance)}`).join('\n') +
        `\n*TOTAL ASET: ${formatRupiah(totalAssets)}*\n\n` +
        `*KEWAJIBAN & EKUITAS (PASIVA)*\n` +
        liabilities.map((l) => `${l.name}: ${formatRupiah(l.balance)}`).join('\n') +
        `\n` +
        equities.map((e) => `${e.name}: ${formatRupiah(e.balance)}`).join('\n') +
        `\nLaba Bersih Berjalan: ${formatRupiah(netIncome)}\n` +
        `*TOTAL PASIVA: ${formatRupiah(totalPasiva)}*\n` +
        `*STATUS: ${isBalanceSheetBalanced ? 'BERIMBANG (BALANCE)' : 'TIDAK BERIMBANG'}*`;
    } else {
      text = `*NERACA SALDO (TRIAL BALANCE) FRESH FOOD NUSANTARA*\n*PERIODE: ${activePeriod.name.toUpperCase()}*\n\n` +
        `Total Debit: ${formatRupiah(totalTBDebit)}\n` +
        `Total Kredit: ${formatRupiah(totalTBCredit)}\n` +
        `Status: ${Math.abs(totalTBDebit - totalTBCredit) < 1 ? 'BALANCE' : 'SELISIH'}`;
    }

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Report Switcher & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setReportType('pnl')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              reportType === 'pnl'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Laba Rugi (P&L)</span>
          </button>

          <button
            onClick={() => setReportType('balance_sheet')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              reportType === 'balance_sheet'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-sky-600" />
            <span>Neraca (Balance Sheet)</span>
          </button>

          <button
            onClick={() => setReportType('trial_balance')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              reportType === 'trial_balance'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
            <span>Neraca Saldo (Trial Balance)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleCopyReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin Teks WA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* REPORT 1: LABA RUGI (PROFIT & LOSS) */}
      {reportType === 'pnl' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto space-y-6">
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              FRESH FOOD NUSANTARA
            </h2>
            <h3 className="text-sm font-semibold text-slate-700">
              Laporan Laba Rugi Komprehensif
            </h3>
            <p className="text-xs text-slate-500">
              Periode: {activePeriod.name} (Basis Akrual)
            </p>
          </div>

          {/* Section 1: Pendapatan */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-50 p-2 rounded">
              Pendapatan Usaha
            </h4>
            <div className="space-y-1 text-xs">
              {revenues.map((rev) => (
                <div key={rev.code} className="flex justify-between items-center py-1 px-2">
                  <span className="text-slate-700">{rev.code} - {rev.name}</span>
                  <span className="font-medium text-slate-900">{formatRupiah(rev.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-1.5 px-2 border-t border-slate-200 font-bold text-slate-900 bg-emerald-50/50 rounded">
                <span>Total Pendapatan Usaha</span>
                <span className="text-emerald-800">{formatRupiah(totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Beban Pokok Penjualan (HPP) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-50 p-2 rounded">
              Harga Pokok Penjualan (HPP)
            </h4>
            <div className="space-y-1 text-xs">
              {hppExpenses.map((hpp) => (
                <div key={hpp.code} className="flex justify-between items-center py-1 px-2">
                  <span className="text-slate-700">{hpp.code} - {hpp.name}</span>
                  <span className="font-medium text-rose-700">({formatRupiah(hpp.balance)})</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-1.5 px-2 border-t border-slate-200 font-bold text-slate-900 bg-rose-50/50 rounded">
                <span>Total Beban Pokok Penjualan</span>
                <span className="text-rose-800">({formatRupiah(totalHPP)})</span>
              </div>
            </div>
          </div>

          {/* Gross Profit Banner */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-100 font-bold text-xs text-slate-900">
            <span>LABA KOTOR (GROSS PROFIT)</span>
            <span className="text-sm text-emerald-800">{formatRupiah(grossProfit)}</span>
          </div>

          {/* Section 3: Beban Operasional */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-50 p-2 rounded">
              Beban Operasional & Logistik Sumedang
            </h4>
            <div className="space-y-1 text-xs">
              {operationalExpenses.map((op) => (
                <div key={op.code} className="flex justify-between items-center py-1 px-2">
                  <span className="text-slate-700">{op.code} - {op.name}</span>
                  <span className="font-medium text-rose-700">({formatRupiah(op.balance)})</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-1.5 px-2 border-t border-slate-200 font-bold text-slate-900 bg-rose-50/50 rounded">
                <span>Total Beban Operasional</span>
                <span className="text-rose-800">({formatRupiah(totalOperational)})</span>
              </div>
            </div>
          </div>

          {/* Net Income Banner */}
          <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-900 text-white font-bold text-sm">
            <span>LABA BERSIH PERIODE BERJALAN</span>
            <span className="text-base text-emerald-300">{formatRupiah(netIncome)}</span>
          </div>
        </div>
      )}

      {/* REPORT 2: NERACA (BALANCE SHEET) */}
      {reportType === 'balance_sheet' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-5xl mx-auto space-y-6">
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              FRESH FOOD NUSANTARA
            </h2>
            <h3 className="text-sm font-semibold text-slate-700">
              Laporan Posisi Keuangan (Neraca)
            </h3>
            <p className="text-xs text-slate-500">
              Per {activePeriod.endDate} • Status:{' '}
              {isBalanceSheetBalanced ? (
                <span className="text-emerald-700 font-bold">SEIMBANG (MATCH)</span>
              ) : (
                <span className="text-rose-700 font-bold">SELISIH</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sisi Kiri: AKTIVA / ASET */}
            <div className="space-y-4">
              <div className="border-b-2 border-sky-800 pb-1">
                <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider">
                  ASET (AKTIVA)
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-semibold text-slate-600 block text-[11px]">
                  ASET LANCAR
                </span>
                {assets
                  .filter((a) => a.subcategory !== 'Aset Tetap')
                  .map((a) => (
                    <div key={a.code} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700">{a.name}</span>
                      <span className="font-medium text-slate-900">{formatRupiah(a.balance)}</span>
                    </div>
                  ))}

                <span className="font-semibold text-slate-600 block text-[11px] pt-3">
                  ASET TETAP
                </span>
                {assets
                  .filter((a) => a.subcategory === 'Aset Tetap')
                  .map((a) => (
                    <div key={a.code} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700">{a.name}</span>
                      <span className="font-medium text-slate-900">{formatRupiah(a.balance)}</span>
                    </div>
                  ))}
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-sky-50 font-bold text-xs text-sky-950 border border-sky-200 mt-4">
                <span>TOTAL ASET</span>
                <span className="text-sm text-sky-900">{formatRupiah(totalAssets)}</span>
              </div>
            </div>

            {/* Sisi Kanan: PASIVA (KEWAJIBAN & EKUITAS) */}
            <div className="space-y-4">
              <div className="border-b-2 border-slate-800 pb-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  KEWAJIBAN & EKUITAS (PASIVA)
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-semibold text-slate-600 block text-[11px]">
                  KEWAJIBAN LANCAR (HUTANG USAHA & TITIPAN)
                </span>
                {liabilities.map((l) => (
                  <div key={l.code} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-700">{l.name}</span>
                    <span className="font-medium text-slate-900">{formatRupiah(l.balance)}</span>
                  </div>
                ))}

                <span className="font-semibold text-slate-600 block text-[11px] pt-3">
                  EKUITAS PEMILIK
                </span>
                {equities.map((e) => (
                  <div key={e.code} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-700">{e.name}</span>
                    <span className="font-medium text-slate-900">{formatRupiah(e.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 border-b border-slate-100 bg-emerald-50/50 px-1 rounded">
                  <span className="text-emerald-900 font-medium">Laba Periode Berjalan</span>
                  <span className="font-bold text-emerald-800">{formatRupiah(netIncome)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-100 font-bold text-xs text-slate-950 border border-slate-300 mt-4">
                <span>TOTAL KEWAJIBAN & EKUITAS</span>
                <span className="text-sm text-slate-900">{formatRupiah(totalPasiva)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: NERACA SALDO (TRIAL BALANCE) */}
      {reportType === 'trial_balance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto space-y-4">
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              FRESH FOOD NUSANTARA
            </h2>
            <h3 className="text-sm font-semibold text-slate-700">
              Neraca Saldo (Trial Balance)
            </h3>
            <p className="text-xs text-slate-500">
              Periode: {activePeriod.name}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-24">Kode</th>
                  <th className="py-2.5 px-3">Nama Akun Buku Besar</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right w-36">Debit</th>
                  <th className="py-2.5 px-3 text-right w-36">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts
                  .filter((a) => a.isActive)
                  .map((acc) => {
                    const isDebit = acc.normalBalance === 'DEBIT';
                    return (
                      <tr key={acc.code} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-mono font-medium text-slate-700">{acc.code}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{acc.name}</td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{acc.category}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-900">
                          {isDebit ? formatRupiah(acc.balance) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-900">
                          {!isDebit ? formatRupiah(acc.balance) : '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-3">TOTAL NERACA SALDO</td>
                  <td className="py-3 px-3 text-right text-emerald-800">{formatRupiah(totalTBDebit)}</td>
                  <td className="py-3 px-3 text-right text-emerald-800">{formatRupiah(totalTBCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
