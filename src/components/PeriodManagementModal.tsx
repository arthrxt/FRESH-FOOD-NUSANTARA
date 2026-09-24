import React from 'react';
import { AccountingPeriod } from '../types';
import { Calendar, Lock, Unlock, X, CheckCircle2 } from 'lucide-react';
import { formatDateID } from '../utils/accountingUtils';

interface PeriodManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  periods: AccountingPeriod[];
  activePeriod: AccountingPeriod;
  onSelectPeriod: (periodId: string) => void;
  onToggleLock: (periodId: string) => void;
}

export const PeriodManagementModal: React.FC<PeriodManagementModalProps> = ({
  isOpen,
  onClose,
  periods,
  activePeriod,
  onSelectPeriod,
  onToggleLock,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Manajemen Periode Buku</h3>
              <p className="text-xs text-slate-500">Kelola dan kunci pembukuan akuntansi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {periods.map((p) => {
            const isCurrent = p.id === activePeriod.id;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{p.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDateID(p.startDate)} s/d {formatDateID(p.endDate)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleLock(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                      p.status === 'OPEN'
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                    }`}
                  >
                    {p.status === 'OPEN' ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Kunci</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Buka</span>
                      </>
                    )}
                  </button>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPeriod(p.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                    >
                      Pilih
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
