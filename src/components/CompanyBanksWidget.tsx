import React, { useState } from 'react';
import { CompanyBankAccount } from '../types';
import { formatRupiah } from '../utils/accountingUtils';
import { Building2, Copy, Check, ShieldCheck, ArrowRightLeft, CreditCard } from 'lucide-react';

interface CompanyBanksWidgetProps {
  banks: CompanyBankAccount[];
  onNavigateToLedger?: () => void;
}

export const CompanyBanksWidget: React.FC<CompanyBanksWidgetProps> = ({
  banks,
  onNavigateToLedger,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (accNo: string, id: string) => {
    navigator.clipboard.writeText(accNo);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalBankBalance = banks.reduce((sum, b) => sum + b.balance, 0);

  return (
    <div id="company-banks-card" className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Rekening Resmi Perusahaan (FFN)
            </h3>
            <p className="text-xs text-slate-500">
              Daftar rekening bank operasional untuk transaksi supplier, SPPG, dan investor
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Saldo 4 Rekening
          </span>
          <span className="text-lg font-black text-slate-900">
            {formatRupiah(totalBankBalance)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {banks.map((bank) => {
          const isCopied = copiedId === bank.id;
          const isBRI = bank.bankName === 'BRI';
          const isBTN = bank.bankName === 'BTN';

          return (
            <div
              key={bank.id}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-wide ${
                      isBRI
                        ? 'bg-blue-600 text-white'
                        : isBTN
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    BANK {bank.bankName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Aktif
                  </span>
                </div>

                <div className="mt-2">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Atas Nama Rekening
                  </span>
                  <p className="text-sm font-bold text-slate-900 truncate" title={bank.accountHolder}>
                    {bank.accountHolder}
                  </p>
                </div>

                <div className="mt-2.5 p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between">
                  <div className="overflow-hidden">
                    <span className="text-[10px] text-slate-400 block font-medium">Nomor Rekening</span>
                    <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                      {bank.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bank.accountNumber, bank.id)}
                    title="Salin Nomor Rekening"
                    className="p-1.5 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors ml-2 cursor-pointer flex-shrink-0"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Saldo Buku:</span>
                <span className="font-bold text-slate-900">{formatRupiah(bank.balance)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span>Seluruh rekening terhubung langsung dengan Buku Besar Kas & Setara Kas (COA 1-1210 s/d 1-1240).</span>
        </div>
        {onNavigateToLedger && (
          <button
            type="button"
            onClick={onNavigateToLedger}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Buku Besar Bank</span>
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
