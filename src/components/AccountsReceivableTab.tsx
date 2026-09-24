import React, { useState } from 'react';
import { SalesInvoice, Account, AccountingPeriod } from '../types';
import { formatRupiah, formatDateID, parseNumberID } from '../utils/accountingUtils';
import { 
  Receipt, 
  Plus, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Banknote, 
  FileText, 
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AccountsReceivableTabProps {
  invoices: SalesInvoice[];
  accounts: Account[];
  activePeriod: AccountingPeriod;
  onAddInvoice: (inv: Omit<SalesInvoice, 'id'>) => void;
  onRecordPayment: (invoiceId: string, amount: number, destinationAccountCode: string, date: string, notes: string) => void;
}

export const AccountsReceivableTab: React.FC<AccountsReceivableTabProps> = ({
  invoices,
  accounts,
  activePeriod,
  onAddInvoice,
  onRecordPayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Modal State: Buat Faktur Baru
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invSppg, setInvSppg] = useState('SPPG Regol Wetan');
  const [invDate, setInvDate] = useState('2026-09-21');
  const [invDueDate, setInvDueDate] = useState('2026-09-28');
  const [invTitipan, setInvTitipan] = useState(0);
  const [invRetur, setInvRetur] = useState(0);
  const [invNotes, setInvNotes] = useState('');
  const [invItems, setInvItems] = useState<
    { id: string; description: string; category: any; qty: number; unit: string; unitPrice: number }[]
  >([
    { id: '1', description: 'Pisang Mulyo MBG', category: 'BUAH', qty: 200, unit: 'kg', unitPrice: 16000 },
    { id: '2', description: 'Sayur Bayam Petik Segar', category: 'SAYUR', qty: 150, unit: 'ikat', unitPrice: 4000 },
  ]);

  // Modal State: Catat Pembayaran Masuk
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<SalesInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentAccountCode, setPaymentAccountCode] = useState<string>('1-1200'); // Bank Mandiri FFN
  const [paymentDate, setPaymentDate] = useState('2026-09-21');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Perhitungan AR Aging
  const totalAR = invoices.reduce((sum, inv) => sum + (inv.netTotal - inv.paidAmount), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = inv.sppgName.toLowerCase().includes(q) || inv.invoiceNumber.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Handle Add Item to New Invoice
  const handleAddItem = () => {
    setInvItems([
      ...invItems,
      {
        id: crypto.randomUUID(),
        description: '',
        category: 'SAYUR',
        qty: 100,
        unit: 'kg',
        unitPrice: 15000,
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setInvItems(
      invItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    if (invItems.length <= 1) return;
    setInvItems(invItems.filter((i) => i.id !== id));
  };

  // Submit New Invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const itemsFormatted = invItems.map((item) => ({
      ...item,
      total: item.qty * item.unitPrice,
    }));
    const subtotal = itemsFormatted.reduce((sum, i) => sum + i.total, 0);
    const netTotal = subtotal + Number(invTitipan) - Number(invRetur);

    const invoiceNumber = `CLIENT-${crypto.randomUUID()}`;

    onAddInvoice({
      invoiceNumber,
      sppgName: invSppg,
      date: invDate,
      dueDate: invDueDate,
      period: activePeriod.name,
      items: itemsFormatted,
      subtotal,
      cashbackCredit: 0,
      titipanAmount: Number(invTitipan),
      returAdjustment: Number(invRetur),
      netTotal,
      paidAmount: 0,
      status: 'UNPAID',
      notes: invNotes,
    });

    setIsInvoiceModalOpen(false);
  };

  // Open Payment Modal
  const openPaymentModal = (inv: SalesInvoice) => {
    setPaymentModalInvoice(inv);
    setPaymentAmount(inv.netTotal - inv.paidAmount);
    setPaymentNotes(`Pelunasan invoice ${inv.invoiceNumber} dari ${inv.sppgName}`);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice || paymentAmount <= 0) return;

    onRecordPayment(
      paymentModalInvoice.id,
      paymentAmount,
      paymentAccountCode,
      paymentDate,
      paymentNotes
    );
    setPaymentModalInvoice(null);
  };

  // Kas & Bank Accounts untuk tujuan penerimaan
  const bankAccounts = accounts.filter(
    (a) => a.subcategory === 'Kas & Setara Kas' && a.isActive
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: AR Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block">Sisa Piutang Berjalan (AR)</span>
          <div className="text-xl font-bold text-sky-700 tracking-tight mt-1">
            {formatRupiah(totalAR)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {invoices.filter((i) => i.status !== 'PAID').length} faktur belum lunas penuh
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block">Total Penerimaan Kas SPPG</span>
          <div className="text-xl font-bold text-emerald-700 tracking-tight mt-1">
            {formatRupiah(totalPaid)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Pencairan via rekening Mandiri & Kas
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Total Nilai Tagihan Terbit</span>
            <div className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              {formatRupiah(totalAR + totalPaid)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">{invoices.length} faktur tercatat</span>
          </div>
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Faktur Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Cari SPPG atau nomor faktur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1 self-end sm:self-auto">
          {(['ALL', 'UNPAID', 'PARTIAL', 'PAID'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL'
                ? 'Semua'
                : st === 'UNPAID'
                ? 'Belum Bayar'
                : st === 'PARTIAL'
                ? 'Sebagian'
                : 'Lunas'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Faktur</th>
                <th className="py-3 px-4">SPPG Penerima</th>
                <th className="py-3 px-4">Tanggal / Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Nilai Tagihan</th>
                <th className="py-3 px-4 text-right">Terbayar</th>
                <th className="py-3 px-4 text-right">Sisa Piutang</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const sisaPiutang = inv.netTotal - inv.paidAmount;
                const isExpanded = expandedInvoiceId === inv.id;

                return (
                  <React.Fragment key={inv.id}>
                    <tr className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() =>
                              setExpandedInvoiceId(isExpanded ? null : inv.id)
                            }
                            className="text-slate-400 hover:text-slate-700"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <span>{inv.invoiceNumber}</span>
                        </div>
                        {inv.journalEntryNumber && (
                          <span className="text-[10px] text-slate-400 block ml-5">
                            Jurnal: {inv.journalEntryNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800">
                        {inv.sppgName}
                        {inv.notes && (
                          <span className="block text-[10px] text-slate-400 truncate max-w-xs">
                            {inv.notes}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div>{formatDateID(inv.date)}</div>
                        <div className="text-[10px] text-slate-400">
                          JT: {formatDateID(inv.dueDate)}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-slate-900 whitespace-nowrap">
                        {formatRupiah(inv.netTotal)}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-emerald-700 whitespace-nowrap">
                        {formatRupiah(inv.paidAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-sky-800 whitespace-nowrap">
                        {formatRupiah(sisaPiutang)}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status === 'PAID'
                            ? 'LUNAS'
                            : inv.status === 'PARTIAL'
                            ? 'SEBAGIAN'
                            : 'BELUM BAYAR'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Catat Bayar</span>
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Items Breakdown */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-y border-slate-200">
                        <td colSpan={8} className="py-3 px-6">
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                              Rincian Komoditas Pangan Faktur ({inv.sppgName})
                            </h4>
                            <table className="w-full text-xs text-left mb-2">
                              <thead>
                                <tr className="text-slate-400 border-b border-slate-100">
                                  <th className="py-1">Komoditas</th>
                                  <th className="py-1">Kategori</th>
                                  <th className="py-1 text-right">Volume</th>
                                  <th className="py-1 text-right">Harga SPPG</th>
                                  <th className="py-1 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {inv.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="py-1.5 font-medium text-slate-800">
                                      {item.description}
                                    </td>
                                    <td className="py-1.5 text-slate-500">
                                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">
                                        {item.category}
                                      </span>
                                    </td>
                                    <td className="py-1.5 text-right font-medium text-slate-800">
                                      {item.qty} {item.unit}
                                    </td>
                                    <td className="py-1.5 text-right text-slate-600">
                                      {formatRupiah(item.unitPrice)}
                                    </td>
                                    <td className="py-1.5 text-right font-semibold text-slate-900">
                                      {formatRupiah(item.total)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Separations Notice */}
                            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-[11px]">
                              <span className="text-slate-600">
                                Subtotal Pangan: <strong>{formatRupiah(inv.subtotal)}</strong>
                              </span>
                              {inv.titipanAmount > 0 && (
                                <span className="text-indigo-600 font-medium">
                                  + Titipan SPPG (Terpisah): {formatRupiah(inv.titipanAmount)}
                                </span>
                              )}
                              {inv.returAdjustment > 0 && (
                                <span className="text-rose-600 font-medium">
                                  - Potongan Retur Rusak: {formatRupiah(inv.returAdjustment)}
                                </span>
                              )}
                              <span className="font-bold text-slate-900 ml-auto">
                                Net Total Faktur: {formatRupiah(inv.netTotal)}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INPUT FAKTUR SPPG BARU */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold">Terbitkan Faktur Penjualan SPPG Baru</h3>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama SPPG Pemesan
                  </label>
                  <select
                    value={invSppg}
                    onChange={(e) => setInvSppg(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="SPPG Regol Wetan">SPPG Regol Wetan</option>
                    <option value="SPPG Wargaluyu">SPPG Wargaluyu</option>
                    <option value="SPPG Kamal">SPPG Kamal</option>
                    <option value="SPPG Cimalaka">SPPG Cimalaka</option>
                    <option value="SPPG Tanjungsari">SPPG Tanjungsari</option>
                    <option value="SPPG Pamulihan">SPPG Pamulihan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pengiriman
                  </label>
                  <input
                    type="date"
                    required
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jatuh Tempo Pembayaran
                  </label>
                  <input
                    type="date"
                    required
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Rincian Komoditas Baris */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Daftar Komoditas Pangan:
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center space-x-1 text-xs text-sky-700 hover:text-sky-800 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Komoditas</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {invItems.map((item) => (
                    <div key={item.id} className="p-2.5 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-2">
                      <div className="w-full sm:w-1/3">
                        <input
                          type="text"
                          required
                          placeholder="Nama Komoditas (misal Melon Orange)"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none"
                        />
                      </div>

                      <div className="w-full sm:w-1/4">
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none"
                        >
                          <option value="BUAH">BUAH</option>
                          <option value="SAYUR">SAYUR</option>
                          <option value="BUMBU">BUMBU</option>
                          <option value="PROTEIN">PROTEIN</option>
                          <option value="SEMBAKO DAN OLAHAN LAINNYA">SEMBAKO</option>
                        </select>
                      </div>

                      <div className="w-full sm:w-20">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(item.id, 'qty', parseNumberID(e.target.value))}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md text-right bg-white focus:outline-none"
                        />
                      </div>

                      <div className="w-full sm:w-16">
                        <input
                          type="text"
                          placeholder="Satuan"
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none"
                        />
                      </div>

                      <div className="w-full sm:w-28">
                        <input
                          type="number"
                          placeholder="Harga Satuan"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseNumberID(e.target.value))}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md text-right bg-white focus:outline-none"
                        />
                      </div>

                      <div className="text-right text-xs font-semibold text-slate-900 w-24">
                        {formatRupiah(item.qty * item.unitPrice)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={invItems.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-20 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pemisahan Khusus: Titipan & Retur */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                  <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                    Titipan SPPG (Terpisah dari Harga Pangan)
                  </label>
                  <input
                    type="number"
                    placeholder="Rp 0"
                    value={invTitipan || ''}
                    onChange={(e) => setInvTitipan(parseNumberID(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs border border-indigo-200 rounded bg-white text-right focus:outline-none"
                  />
                </div>

                <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                  <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                    Potongan Retur Barang Rusak (Terpisah)
                  </label>
                  <input
                    type="number"
                    placeholder="Rp 0"
                    value={invRetur || ''}
                    onChange={(e) => setInvRetur(parseNumberID(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs border border-rose-200 rounded bg-white text-right focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pengiriman / Rute
                </label>
                <input
                  type="text"
                  placeholder="Keterangan armada, supir, atau catatan khusus..."
                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              {/* Total Calculation Display */}
              <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Total Net Faktur Tagihan:</span>
                <span className="text-base text-sky-800">
                  {formatRupiah(
                    invItems.reduce((s, i) => s + i.qty * i.unitPrice, 0) +
                      Number(invTitipan) -
                      Number(invRetur)
                  )}
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-sm transition"
                >
                  Terbitkan Faktur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATAT PELUNASAN KAS MASUK SPPG */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Catat Pembayaran Masuk SPPG</h3>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Faktur:</span>
                  <span className="font-semibold text-slate-800">{paymentModalInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SPPG:</span>
                  <span className="font-semibold text-slate-800">{paymentModalInvoice.sppgName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sisa Piutang:</span>
                  <span className="font-bold text-sky-800">
                    {formatRupiah(paymentModalInvoice.netTotal - paymentModalInvoice.paidAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Pelunasan (Rp)
                </label>
                <input
                  type="number"
                  required
                  max={paymentModalInvoice.netTotal - paymentModalInvoice.paidAmount}
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseNumberID(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold text-emerald-800 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Akun Penerimaan (Kas / Bank)
                </label>
                <select
                  value={paymentAccountCode}
                  onChange={(e) => setPaymentAccountCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Terima
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Ref Bukti Transfer
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={paymentAmount <= 0}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  Simpan & Otomatis Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
