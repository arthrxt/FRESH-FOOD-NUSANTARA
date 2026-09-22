import React, { useState } from 'react';
import { MonthlyInvestorPayout, CompanyBankAccount, Account, JournalEntry } from '../types';
import { formatRupiah, formatDateID } from '../utils/accountingUtils';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Plus, 
  ShieldCheck,
  Send,
  X
} from 'lucide-react';

interface InvestorObligationsTabProps {
  investorPayouts: MonthlyInvestorPayout[];
  companyBanks: CompanyBankAccount[];
  onPayInvestor: (
    payoutId: string, 
    bankAccountCode: string, 
    bankName: string, 
    accountHolder: string,
    notes: string
  ) => void;
  onAddInvestorPayout?: (payout: MonthlyInvestorPayout) => void;
}

export const InvestorObligationsTab: React.FC<InvestorObligationsTabProps> = ({
  investorPayouts,
  companyBanks,
  onPayInvestor,
  onAddInvestorPayout,
}) => {
  const [selectedPayout, setSelectedPayout] = useState<MonthlyInvestorPayout | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>(companyBanks[0]?.id || '');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New investor form state
  const [newInvestorName, setNewInvestorName] = useState('');
  const [newInvestmentAmount, setNewInvestmentAmount] = useState<number>(30000000);
  const [newMonthlyAmount, setNewMonthlyAmount] = useState<number>(2100000);
  const [newDueDate, setNewDueDate] = useState('2026-09-20');
  const [newNotes, setNewNotes] = useState('');

  // Summary Metrics
  const totalInvestment = investorPayouts.reduce((sum, p) => sum + p.investmentAmount, 0);
  const totalMonthlyCommitment = investorPayouts.reduce((sum, p) => sum + p.monthlyPayoutAmount, 0);
  const totalPaid = investorPayouts
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.monthlyPayoutAmount, 0);
  const totalUnpaid = investorPayouts
    .filter((p) => p.status === 'UNPAID')
    .reduce((sum, p) => sum + p.monthlyPayoutAmount, 0);

  const handleOpenPayModal = (payout: MonthlyInvestorPayout) => {
    setSelectedPayout(payout);
    setPaymentNotes(`Pembayaran bagi hasil ${payout.period} a.n. ${payout.investorName}`);
    if (companyBanks.length > 0) {
      setSelectedBankId(companyBanks[0].id);
    }
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    const bank = companyBanks.find((b) => b.id === selectedBankId);
    if (!bank) return;

    onPayInvestor(
      selectedPayout.id,
      bank.accountCode,
      `${bank.bankName} - ${bank.accountHolder} (${bank.accountNumber})`,
      bank.accountHolder,
      paymentNotes
    );

    setSelectedPayout(null);
  };

  const handleAddNewInvestor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestorName.trim()) return;

    const newPayout: MonthlyInvestorPayout = {
      id: `inv-pay-${Date.now()}`,
      investorName: newInvestorName.trim(),
      period: 'September 2026',
      investmentAmount: Number(newInvestmentAmount) || 0,
      monthlyPayoutAmount: Number(newMonthlyAmount) || 0,
      dueDate: newDueDate,
      status: 'UNPAID',
      notes: newNotes.trim() || 'Kewajiban bagi hasil bulanan rutin',
    };

    if (onAddInvestorPayout) {
      onAddInvestorPayout(newPayout);
    }
    setShowAddModal(false);
    setNewInvestorName('');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Modal Investor
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {formatRupiah(totalInvestment)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {investorPayouts.length} Investor Aktif (Dewi Amor, Bu Iis, Novia)
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kewajiban Bagi Hasil / Bulan
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">
            {formatRupiah(totalMonthlyCommitment)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Total komitmen bagi hasil per periode
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sudah Ditransfer
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 mt-2">
            {formatRupiah(totalPaid)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Telah tervalidasi via Rekening BRI/BTN
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sisa Harus Dibayar
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-600 mt-2">
            {formatRupiah(totalUnpaid)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Jatuh tempo bulan ini
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Daftar Investor & Pembayaran Bagi Hasil Bulanan</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Investor terdaftar: Dewi Amor, Bu Iis, Novia — komitmen bagi hasil ditransfer setiap bulan dari Rekening Resmi FFN.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Investor Baru</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Investor</th>
                <th className="py-3 px-4 text-right">Pokok Modal</th>
                <th className="py-3 px-4 text-right">Bagi Hasil / Bln</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Status & Bukti Transfer</th>
                <th className="py-3 px-4 text-center">Aksi Pelunasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {investorPayouts.map((inv) => {
                const isPaid = inv.status === 'PAID';

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100/80 text-emerald-800 font-black flex items-center justify-center text-xs">
                          {inv.investorName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm capitalize block">
                            {inv.investorName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Periode: {inv.period}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {formatRupiah(inv.investmentAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(inv.monthlyPayoutAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDateID(inv.dueDate)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {isPaid ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            LUNAS
                          </span>
                          {inv.paidFromBank && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              Dari: {inv.paidFromBank} ({inv.paidDate})
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                            <Clock className="w-3 h-3 text-amber-600" />
                            BELUM DIBAYAR
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Menunggu transfer Arthur
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isPaid ? (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Tercatat di Jurnal
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(inv)}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 mx-auto transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <Send className="w-3 h-3" />
                          <span>Bayar Sekarang</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Proses Pembayaran Bagi Hasil
                  </h3>
                  <p className="text-xs text-slate-500">
                    Investor: <strong className="capitalize">{selectedPayout.investorName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Periode:</span>
                  <span className="font-bold text-slate-800">{selectedPayout.period}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Jatuh Tempo:</span>
                  <span className="font-semibold text-slate-700">{formatDateID(selectedPayout.dueDate)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Nominal Transfer:</span>
                  <span className="font-black text-emerald-600 text-base">
                    {formatRupiah(selectedPayout.monthlyPayoutAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pilih Rekening Sumber Pembayaran (Bank FFN)
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {companyBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.bankName} - {bank.accountHolder} ({bank.accountNumber}) — Saldo: {formatRupiah(bank.balance)}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Saldo rekening yang dipilih akan otomatis terpotong di Buku Besar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan / Keterangan Transfer
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi & Buat Jurnal Pengeluaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Investor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Tambah Data Investor Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewInvestor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Investor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dewi amor / Bu iis / Novia"
                  value={newInvestorName}
                  onChange={(e) => setNewInvestorName(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pokok Modal (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={newInvestmentAmount}
                    onChange={(e) => setNewInvestmentAmount(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bagi Hasil / Bln (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={newMonthlyAmount}
                    onChange={(e) => setNewMonthlyAmount(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tanggal Jatuh Tempo Rutin
                </label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Catatan kontrak / kesepakatan"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Simpan Investor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
