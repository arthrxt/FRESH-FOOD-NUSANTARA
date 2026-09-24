import React, { useState } from 'react';
import { CashbackReconciliationRecord, AccountingPeriod } from '../types';
import { formatRupiah, formatNumberID, parseNumberID } from '../utils/accountingUtils';
import { 
  Calculator, 
  Plus, 
  Copy, 
  Check, 
  ShieldAlert, 
  ArrowRight, 
  X, 
  FileCheck2,
  AlertCircle
} from 'lucide-react';

interface CashbackReconciliationTabProps {
  records: CashbackReconciliationRecord[];
  activePeriod: AccountingPeriod;
  onAddRecord: (rec: Omit<CashbackReconciliationRecord, 'id' | 'cashbackUnitDiff' | 'totalCashback'>) => void;
  onPostToJournal: (record: CashbackReconciliationRecord) => void;
}

export const CashbackReconciliationTab: React.FC<CashbackReconciliationTabProps> = ({
  records,
  activePeriod,
  onAddRecord,
  onPostToJournal,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [sppg, setSppg] = useState('SPPG Regol Wetan');
  const [date, setDate] = useState('2026-09-21');
  const [item, setItem] = useState('');
  const [qty, setQty] = useState<number>(100);
  const [unit, setUnit] = useState('kg');
  const [sppgPrice, setSppgPrice] = useState<number>(16000);
  const [realPrice, setRealPrice] = useState<number>(13500);
  const [titipanAmount, setTitipanAmount] = useState<number>(0);
  const [returAmount, setReturAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Perhitungan totals
  const totalCashbackSum = records.reduce((s, r) => s + r.totalCashback, 0);
  const totalTitipanSum = records.reduce((s, r) => s + r.titipanAmount, 0);
  const totalReturSum = records.reduce((s, r) => s + r.returAmount, 0);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) return;

    onAddRecord({
      sppg,
      period: activePeriod.name,
      date,
      item: item.trim(),
      qty: Number(qty) || 0,
      unit: unit.trim() || 'kg',
      sppgPrice: Number(sppgPrice) || 0,
      realPrice: Number(realPrice) || 0,
      titipanAmount: Number(titipanAmount) || 0,
      returAmount: Number(returAmount) || 0,
      accountingStatus: 'TERCATAT_PIUTANG',
      notes: notes.trim(),
    });

    setIsModalOpen(false);
    setItem('');
    setTitipanAmount(0);
    setReturAmount(0);
    setNotes('');
  };

  // Format WA siap kirim (tanpa intro basa-basi)
  const handleCopyWA = () => {
    const lines = [
      `*REKONSILIASI CASHBACK & TITIPAN - FRESH FOOD NUSANTARA*`,
      `*PERIODE: ${activePeriod.name.toUpperCase()}*`,
      ``,
      `*1. CASHBACK MURNI (SELISIH HARGA SPPG vs REAL)*`,
      ...records.map(
        (r) =>
          `• ${r.sppg} - ${r.item} (${formatNumberID(r.qty)} ${r.unit}): SPPG Rp ${formatNumberID(r.sppgPrice)} vs Real Rp ${formatNumberID(r.realPrice)} -> Selisih ${formatRupiah(r.totalCashback)}`
      ),
      `*TOTAL CASHBACK MURNI: ${formatRupiah(totalCashbackSum)}*`,
      ``,
      `*2. TITIPAN SPPG (TERPISAH KETAT)*`,
      ...records
        .filter((r) => r.titipanAmount > 0)
        .map((r) => `• ${r.sppg}: ${formatRupiah(r.titipanAmount)} (${r.item})`),
      `*TOTAL TITIPAN: ${formatRupiah(totalTitipanSum)}*`,
      ``,
      `*3. RETUR PANGAN RUSAK (TERPISAH KETAT)*`,
      ...records
        .filter((r) => r.returAmount > 0)
        .map((r) => `• ${r.sppg}: ${formatRupiah(r.returAmount)} (${r.item})`),
      `*TOTAL RETUR: ${formatRupiah(totalReturSum)}*`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Strict Accounting Rule Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold">Prinsip Akuntansi FFN: Pemisahan Tegas</h4>
          <p className="mt-0.5 text-slate-700">
            <strong>Cashback</strong> (Selisih Harga SPPG vs Real Queen/Fresh Food) adalah hak margin pendapatan usaha.
            <strong> Titipan</strong> dan <strong>Retur</strong> wajib dicatat pada pos pembukuan terpisah dan dilarang
            dicampuradukkan ke dalam kalkulasi cashback.
          </p>
        </div>
      </div>

      {/* Metric Cards: Strict 3-Way Separation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">
            1. Total Cashback Murni (Selisih)
          </span>
          <div className="text-xl font-bold text-emerald-700 tracking-tight mt-1">
            {formatRupiah(totalCashbackSum)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Diakui sebagai Pendapatan Selisih (4-1200)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">
            2. Total Dana Titipan SPPG
          </span>
          <div className="text-xl font-bold text-indigo-700 tracking-tight mt-1">
            {formatRupiah(totalTitipanSum)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Diakui sebagai Hutang Titipan (2-2100)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">
            3. Total Potongan Retur Pangan
          </span>
          <div className="text-xl font-bold text-rose-700 tracking-tight mt-1">
            {formatRupiah(totalReturSum)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Diakui sebagai Beban Retur (6-1400)
          </span>
        </div>
      </div>

      {/* Table Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-800">
          Rincian Transaksi per SPPG ({records.length} item terekonsiliasi)
        </h3>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyWA}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin ke WA!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin Format WA</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item Rekonsiliasi</span>
          </button>
        </div>
      </div>

      {/* Detailed Reconciliation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">SPPG & Tanggal</th>
                <th className="py-3 px-3">Komoditas & Volume</th>
                <th className="py-3 px-3 text-right">Harga SPPG</th>
                <th className="py-3 px-3 text-right">Harga Real</th>
                <th className="py-3 px-3 text-right">Selisih/Unit</th>
                <th className="py-3 px-3 text-right font-bold text-emerald-900">Total Cashback</th>
                <th className="py-3 px-3 text-right font-bold text-indigo-900">Titipan</th>
                <th className="py-3 px-3 text-right font-bold text-rose-900">Retur</th>
                <th className="py-3 px-3 text-center">Status Akun</th>
                <th className="py-3 px-3 text-center">Aksi Posting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                    <div>{rec.sppg}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{rec.date}</div>
                  </td>

                  <td className="py-3 px-3 font-medium text-slate-800">
                    <div>{rec.item}</div>
                    <div className="text-[11px] text-slate-500">
                      {formatNumberID(rec.qty)} {rec.unit}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                    {formatRupiah(rec.sppgPrice)}
                  </td>

                  <td className="py-3 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                    {formatRupiah(rec.realPrice)}
                  </td>

                  <td className="py-3 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                    +{formatRupiah(rec.cashbackUnitDiff)}
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-emerald-800 whitespace-nowrap bg-emerald-50/30">
                    {formatRupiah(rec.totalCashback)}
                  </td>

                  <td className="py-3 px-3 text-right font-medium text-indigo-700 whitespace-nowrap">
                    {rec.titipanAmount > 0 ? formatRupiah(rec.titipanAmount) : '-'}
                  </td>

                  <td className="py-3 px-3 text-right font-medium text-rose-700 whitespace-nowrap">
                    {rec.returAmount > 0 ? formatRupiah(rec.returAmount) : '-'}
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        rec.accountingStatus === 'SUDAH_DIKREDIT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {rec.accountingStatus === 'SUDAH_DIKREDIT' ? 'TERCATAT' : 'PIUTANG'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {rec.accountingStatus === 'SUDAH_DIKREDIT' ? (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rec.journalEntryNumber || 'Tercatat di Jurnal'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPostToJournal(rec)}
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] inline-flex items-center gap-1 transition shadow-2xs cursor-pointer"
                        title="Posting pengakuan margin cashback ke Jurnal Umum"
                      >
                        <FileCheck2 className="w-3 h-3" />
                        Posting Jurnal
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: TAMBAH ITEM REKONSILIASI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Input Item Rekonsiliasi Cashback SPPG</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SPPG
                  </label>
                  <select
                    value={sppg}
                    onChange={(e) => setSppg(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="SPPG Regol Wetan">SPPG Regol Wetan</option>
                    <option value="SPPG Wargaluyu">SPPG Wargaluyu</option>
                    <option value="SPPG Kamal">SPPG Kamal</option>
                    <option value="SPPG Cimalaka">SPPG Cimalaka</option>
                    <option value="SPPG Tanjungsari">SPPG Tanjungsari</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Komoditas
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal Melon Orange, Pisang Mulyo..."
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Volume Qty
                  </label>
                  <input
                    type="number"
                    required
                    value={qty || ''}
                    onChange={(e) => setQty(parseNumberID(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga SPPG (Faktur)
                  </label>
                  <input
                    type="number"
                    required
                    value={sppgPrice || ''}
                    onChange={(e) => setSppgPrice(parseNumberID(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Real (Queen / Fresh)
                  </label>
                  <input
                    type="number"
                    required
                    value={realPrice || ''}
                    onChange={(e) => setRealPrice(parseNumberID(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Strict Separations */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
                  <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                    Titipan SPPG (Terpisah)
                  </label>
                  <input
                    type="number"
                    placeholder="Rp 0"
                    value={titipanAmount || ''}
                    onChange={(e) => setTitipanAmount(parseNumberID(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs border border-indigo-200 rounded bg-white text-right focus:outline-none"
                  />
                </div>

                <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-100">
                  <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                    Retur Rusak (Terpisah)
                  </label>
                  <input
                    type="number"
                    placeholder="Rp 0"
                    value={returAmount || ''}
                    onChange={(e) => setReturAmount(parseNumberID(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs border border-rose-200 rounded bg-white text-right focus:outline-none"
                  />
                </div>
              </div>

              {/* Preview Cashback Murni */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs font-bold text-emerald-950">
                <span>Estimasi Cashback Murni:</span>
                <span className="text-emerald-800 text-sm">
                  {formatRupiah((sppgPrice - realPrice) * qty)}
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
                >
                  Simpan Rekonsiliasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
