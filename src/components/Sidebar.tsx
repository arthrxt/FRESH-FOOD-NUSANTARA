import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Receipt, 
  Truck, 
  Users, 
  CreditCard, 
  Calculator, 
  FolderTree, 
  FileSpreadsheet, 
  LogOut, 
  Leaf, 
  ChevronRight,
  ShieldCheck,
  Crown,
  UserCog,
  BarChart3,
  X
} from 'lucide-react';
import { AppUser } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
  isOpen,
  onClose,
}) => {
  const isMaster = currentUser?.role === 'MASTER';
  const isOwner = currentUser?.role === 'OWNER';

  // Construct Nav Items based on user role
  const executiveNavItems = [
    { 
      id: 'owner', 
      label: 'Dashboard Owner', 
      icon: Crown, 
      badge: 'Eksekutif', 
      color: 'text-amber-400' 
    },
  ];

  const mainNavItems = [
    { id: 'dashboard', label: 'Ringkasan Akuntansi', icon: LayoutDashboard },
    { id: 'ledger', label: 'Buku Besar & Jurnal', icon: BookOpen },
    { id: 'ar', label: 'Piutang SPPG (AR)', icon: Receipt },
    { id: 'ap', label: 'Hutang Supplier (AP)', icon: Truck, badge: '6 Rekanan' },
    { id: 'investors', label: 'Bagi Hasil Investor', icon: Users, badge: 'Bulanan' },
    { id: 'banks', label: 'Rekening Perusahaan', icon: CreditCard, badge: '4 Bank' },
    { id: 'cashback', label: 'Kalkulator Cashback', icon: Calculator },
  ];

  const reportNavItems = [
    { id: 'coa', label: 'Bagan Akun (COA)', icon: FolderTree },
    { id: 'reports', label: 'Laporan Keuangan', icon: FileSpreadsheet },
  ];

  const adminNavItems = [
    { id: 'users', label: 'Manajemen Pengguna', icon: UserCog, badge: 'Master' },
  ];

  const handleItemClick = (id: string) => {
    onTabChange(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 text-slate-200 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-950/40">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                </div>
              </div>
              <div>
                <h1 className="text-base font-black text-white tracking-tight leading-tight">
                  FFN ACCOUNTING
                </h1>
                <p className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">
                  FRESH FOOD NUSANTARA
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3.5 space-y-5 overflow-y-auto max-h-[calc(100vh-175px)] scrollbar-none">
            {/* 1. Eksekutif Owner Dashboard (Visible for Owner & Master) */}
            {(isOwner || isMaster) && (
              <div>
                <span className="px-3 text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-amber-400" />
                  Menu Eksekutif
                </span>
                <nav className="space-y-1">
                  {executiveNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/50 font-bold'
                            : 'text-amber-300 hover:text-white hover:bg-slate-900/90'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-black tracking-wider uppercase ${
                            isActive
                              ? 'bg-amber-800 text-amber-100'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          }`}
                        >
                          {item.badge}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* 2. Menu Utama Akuntansi */}
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Operasional Akuntansi
              </span>
              <nav className="space-y-1">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.id === 'dashboard' && activeTab === 'overview');

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/40 font-bold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide ${
                            isActive
                              ? 'bg-emerald-600 text-emerald-50'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 3. Laporan & Struktur Master */}
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Laporan & Master
              </span>
              <nav className="space-y-1">
                {reportNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/40 font-bold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 4. Otoritas Master Arthur */}
            {isMaster && (
              <div>
                <span className="px-3 text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Otoritas Master
                </span>
                <nav className="space-y-1">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 font-bold'
                            : 'text-emerald-300 hover:text-white hover:bg-slate-900/90'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-black tracking-wider uppercase ${
                            isActive
                              ? 'bg-emerald-800 text-emerald-100'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          }`}
                        >
                          {item.badge}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Quick System Badge */}
            <div className="px-3 py-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Sistem Siap Pakai • ffoodnusantara.site</span>
            </div>
          </div>
        </div>

        {/* Bottom User Profile Card with Logout */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div 
                className={`w-8 h-8 rounded-full border text-white font-black flex items-center justify-center text-xs flex-shrink-0 ${
                  currentUser?.role === 'MASTER'
                    ? 'bg-emerald-600 border-emerald-400'
                    : currentUser?.role === 'OWNER'
                    ? 'bg-purple-600 border-purple-400'
                    : 'bg-blue-600 border-blue-400'
                }`}
              >
                {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'A'}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-white block truncate">
                  {currentUser?.fullName || 'Arthur'}
                </span>
                <span 
                  className={`text-[9px] font-black uppercase tracking-wider block truncate ${
                    currentUser?.role === 'MASTER'
                      ? 'text-emerald-400'
                      : currentUser?.role === 'OWNER'
                      ? 'text-amber-400'
                      : 'text-blue-400'
                  }`}
                >
                  {currentUser?.role === 'MASTER' ? 'MASTER ADMIN' : currentUser?.role === 'OWNER' ? 'OWNER / DIREKSI' : 'TIM AKUNTANSI'}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Keluar dari Sistem (Logout)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
