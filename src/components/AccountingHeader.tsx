import React from 'react';
import { 
  Leaf, 
  Calendar, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Menu, 
  LogOut,
  Wallet,
  Receipt,
  Truck,
  TrendingUp
} from 'lucide-react';
import { AccountingPeriod, AppUser } from '../types';
import { formatRupiah } from '../utils/accountingUtils';

interface AccountingHeaderProps {
  activePeriod: AccountingPeriod;
  periods: AccountingPeriod[];
  onSelectPeriod: (periodId: string) => void;
  onSelectMonthYear: (year: number, monthIndex: number) => void;
  onTogglePeriodLock: (periodId?: string) => void;
  totalCashAndBank: number;
  totalAR: number;
  totalAP: number;
  netIncome: number;
  onOpenSidebar?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export const AccountingHeader: React.FC<AccountingHeaderProps> = ({
  activePeriod,
  periods,
  onSelectPeriod,
  onSelectMonthYear,
  onTogglePeriodLock,
  totalCashAndBank,
  totalAR,
  totalAP,
  netIncome,
  onOpenSidebar,
  currentUser,
  onLogout,
}) => {
  return (
    <header id="accounting-header" className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Top bar: Mobile Menu, Brand, Period Controls & Profile */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center space-x-3">
            {onOpenSidebar && (
              <button
                type="button"
                onClick={onOpenSidebar}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 lg:hidden cursor-pointer"
                title="Buka Navigasi Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div id="ffn-brand-logo" className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-950/40 border border-emerald-400/30 shrink-0">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 id="header-brand-title" className="text-lg font-black tracking-tight text-white uppercase">
                  FFN ACCOUNTING
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold tracking-wide">
                  PSAK EMKM
                </span>
              </div>
              <p id="header-brand-subtitle" className="text-[11px] text-slate-400 font-medium tracking-wide">
                Fresh Food Nusantara
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* Periode Kalender Interaktif (Bisa Dipilih Bulannya Bebas) */}
            <div id="period-selector-container" className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs shadow-inner">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-400 font-medium hidden sm:inline">Periode:</span>
              
              {/* Dropdown pilihan periode */}
              <select
                id="select-period-dropdown"
                value={activePeriod.id}
                onChange={(e) => onSelectPeriod(e.target.value)}
                className="bg-slate-900 text-white font-semibold text-xs rounded-lg border border-slate-700 px-2 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                title="Pilih Periode Akuntansi Terdaftar"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Input Kalender Bulan (Bisa Pilih Kapan Saja Bulannya) */}
              <div className="flex items-center pl-1 border-l border-slate-700">
                <input
                  id="input-calendar-month"
                  type="month"
                  title="Klik untuk memilih bulan & tahun kalender secara bebas"
                  value={activePeriod.startDate.substring(0, 7)}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const parts = e.target.value.split('-');
                    const year = parseInt(parts[0], 10);
                    const monthIndex = parseInt(parts[1], 10) - 1;
                    if (!isNaN(year) && !isNaN(monthIndex)) {
                      onSelectMonthYear(year, monthIndex);
                    }
                  }}
                  className="bg-slate-900 text-emerald-300 font-medium text-xs rounded-lg border border-slate-700 px-1.5 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 [color-scheme:dark]"
                />
              </div>

              {/* Status Periode */}
              <span
                id="period-status-badge"
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  activePeriod.status === 'OPEN'
                    ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                    : 'bg-amber-900/80 text-amber-300 border border-amber-700'
                }`}
              >
                {activePeriod.status}
              </span>
            </div>

            {/* Tombol Kunci / Buka Periode */}
            <button
              id="btn-toggle-period"
              type="button"
              onClick={() => onTogglePeriodLock(activePeriod.id)}
              title={activePeriod.status === 'OPEN' ? 'Kunci Periode Buku' : 'Buka Kunci Periode'}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activePeriod.status === 'OPEN'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {activePeriod.status === 'OPEN' ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Kunci Periode</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">Buka Kunci</span>
                </>
              )}
            </button>

            {/* Profile & Logout shortcut */}
            {currentUser && onLogout && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Logout / Keluar"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Financial Position Ticker Bar - Modern Header Widget */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Kas & 4 Bank
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-400 tracking-tight">
                {formatRupiah(totalCashAndBank)}
              </span>
            </div>
            <Wallet className="w-4 h-4 text-emerald-500/70" />
          </div>

          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Piutang SPPG (AR)
              </span>
              <span className="text-sm sm:text-base font-black text-blue-400 tracking-tight">
                {formatRupiah(totalAR)}
              </span>
            </div>
            <Receipt className="w-4 h-4 text-blue-500/70" />
          </div>

          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Hutang Supplier (AP)
              </span>
              <span className="text-sm sm:text-base font-black text-amber-400 tracking-tight">
                {formatRupiah(totalAP)}
              </span>
            </div>
            <Truck className="w-4 h-4 text-amber-500/70" />
          </div>

          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Laba Bersih Berjalan
              </span>
              <span className={`text-sm sm:text-base font-black tracking-tight ${netIncome >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {formatRupiah(netIncome)}
              </span>
            </div>
            <TrendingUp className="w-4 h-4 text-teal-500/70" />
          </div>
        </div>
      </div>
    </header>
  );
};
