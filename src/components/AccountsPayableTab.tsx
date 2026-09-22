import React, { useState } from 'react';
import { SupplierBill, Account, AccountingPeriod } from '../types';
import { formatRupiah, formatDateID, parseNumberID } from '../utils/accountingUtils';
import { 
  Truck, 
  Plus, 
  Search, 
  Banknote, 
  Clock, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Building2 
} from 'lucide-react';

interface AccountsPayableTabProps {
  bills: SupplierBill[];
  accounts: Account[];
  activePeriod: AccountingPeriod;
  onAddBill: (bill: Omit<SupplierBill, 'id'>) => void;
  onPayBill: (billId: string, amount: number, sourceAccountCode: string, date: string, notes: string) => void;
}

export const AccountsPayableTab: React.FC<AccountsPayableTabProps> = ({
  bills,
  accounts,
  activePeriod,
  onAddBill,
  onPayBill,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  // Modal State: Tagihan Supplier Baru
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billSupplier, setBillSupplier] = useState('Mansur');
  const [billDate, setBillDate] = useState('2026-09-21');
  const [billDueDate, setBillDueDate] = useState('2026-09-28');
  const [billNotes, setBillNotes] = useState('');
  const [billItems, setBillItems] = useState<
    { id: string; description: string; category: string; qty: number; unit: string; unitPrice: number }[]
  >([
    { id: '1', description: 'Pasokan Pisang Mulyo Fresh', category: 'BUAH', qty: 300, unit: 'kg', unitPrice: 13500 },
  ]);

  // Modal State: Catat Pembayaran Tagihan Keluar
  const [paymentModalBill, setPaymentModalBill] = useState<SupplierBill | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paySourceCode, setPaySourceCode] = useState<string>('1-1300'); // Bank BCA Operasional
  const [payDate, setPayDate] = useState('2026-09-21');
  const [payNotes, setPayNotes] = useState('');

  // Perhitungan Metrik AP
  const totalAP = bills.reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);
  const totalPaid = bills.reduce((sum, b) => sum + b.paidAmount, 0);

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = b.supplierName.toLowerCase().includes(q) || b.billNumber.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Handle Add Item to New Bill
  const handleAddItem = () => {
    setBillItems([
      ...billItems,
      {
        id: Math.random().toString(),
        description: '',
        category: 'SAYUR',
        qty: 100,
        unit: 'kg',
        unitPrice: 12000,
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setBillItems(
      billItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    if (billItems.length <= 1) return;
    setBillItems(billItems.filter((i) => i.id !== id));
  };

  // Submit New Bill
  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const itemsFormatted = billItems.map((item) => ({
      ...item,
      total: item.qty * item.unitPrice,
    }));
    const totalAmount = itemsFormatted.reduce((sum, i) => sum + i.total, 0);

    const seq = (bills.length + 1).toString().padStart(2, '0');
    const prefix = billSupplier.toUpperCase().split(' ')[0] || 'SUP';
    const billNumber = `BILL-${prefix}-2609-${seq}`;

    onAddBill({
      billNumber,
      supplierName: billSupplier,
      date: billDate,
      dueDate: billDueDate,
      items: itemsFormatted,
      totalAmount,
      paidAmount: 0,
      status: 'UNPAID',
      notes: billNotes,
    });

    setIsBillModalOpen(false);
  };

  // Open Pay Modal
  const openPayModal = (bill: SupplierBill) => {
    setPaymentModalBill(bill);
    setPayAmount(bill.totalAmount - bill.paidAmount);
    setPayNotes(`Pembayaran faktur ${bill.billNumber} kepada ${bill.supplierName}`);
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalBill || payAmount <= 0) return;

    onPayBill(
      paymentModalBill.id,
      payAmount,
      paySourceCode,
      payDate,
      payNotes
    );
    setPaymentModalBill(null);
  };

  // Kas & Bank Accounts untuk sumber dana keluar
  const bankAccounts = accounts.filter(
    (a) => a.subcategory === 'Kas & Setara Kas' && a.isActive
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: AP Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block">Sisa Hutang ke Supplier (AP)</span>
          <div className="text-xl font-bold text-amber-700 tracking-tight mt-1">
            {formatRupiah(totalAP)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Kewajiban pengadaan Queen, Fresh Food, HBS, Mansur
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block">Total Pembayaran Kas Terbayar</span>
          <div className="text-xl font-bold text-slate-800 tracking-tight mt-1">
            {formatRupiah(totalPaid)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Pengeluaran via BCA & Kas Gudang
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Total Tagihan Masuk</span>
            <div className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              {formatRupiah(totalAP + totalPaid)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">{bills.length} surat jalan/tagihan</span>
          </div>
          <button
            onClick={() => setIsBillModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tagihan Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Cari supplier atau no. tagihan..."
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

      {/* Bill List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Tagihan</th>
                <th className="py-3 px-4">Supplier Rekanan</th>
                <th className="py-3 px-4">Tanggal / Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Nilai Tagihan</th>
                <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3 px-4 text-right">Sisa Hutang</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.map((bill) => {
                const sisaHutang = bill.totalAmount - bill.paidAmount;
                const isExpanded = expandedBillId === bill.id;

                return (
                  <React.Fragment key={bill.id}>
                    <tr className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() =>
                              setExpandedBillId(isExpanded ? null : bill.id)
                            }
                            className="text-slate-400 hover:text-slate-700"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <span>{bill.billNumber}</span>
                        </div>
                        {bill.journalEntryNumber && (
                          <span className="text-[10px] text-slate-400 block ml-5">
                            Jurnal: {bill.journalEntryNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800">
                        {bill.supplierName}
                        {bill.notes && (
                          <span className="block text-[10px] text-slate-400 truncate max-w-xs">
                            {bill.notes}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div>{formatDateID(bill.date)}</div>
                        <div className="text-[10px] text-slate-400">
                          JT: {formatDateID(bill.dueDate)}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-slate-900 whitespace-nowrap">
                        {formatRupiah(bill.totalAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatRupiah(bill.paidAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-amber-800 whitespace-nowrap">
                        {formatRupiah(sisaHutang)}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bill.status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {bill.status === 'PAID'
                            ? 'LUNAS'
                            : bill.status === 'PARTIAL'
                            ? 'SEBAGIAN'
                            : 'BELUM BAYAR'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {bill.status !== 'PAID' && (
                          <button
                            onClick={() => openPayModal(bill)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Bayar Tagihan</span>
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
                              Rincian Pembelian Bahan Pangan ({bill.supplierName})
                            </h4>
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="text-slate-400 border-b border-slate-100">
                                  <th className="py-1">Deskripsi Item</th>
                                  <th className="py-1">Kategori</th>
                                  <th className="py-1 text-right">Volume</th>
                                  <th className="py-1 text-right">Harga Beli Supplier</th>
                                  <th className="py-1 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {bill.items.map((item) => (
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

      {/* MODAL: INPUT TAGIHAN SUPPLIER BARU */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Input Tagihan Supplier Baru (AP)</h3>
              </div>
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Supplier Rekanan
                  </label>
                  <select
                    value={billSupplier}
                    onChange={(e) => setBillSupplier(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="Mansur">Mansur (Sayur & Bumbu)</option>
                    <option value="Royana">Royana (Buah & Segar)</option>
                    <option value="HBS">HBS (Protein & Unggas)</option>
                    <option value="PT ABR">PT ABR (Beras & Sembako)</option>
                    <option value="DRW">DRW (Bumbu Olahan)</option>
                    <option value="BAHRUL">BAHRUL (Sayur Daun & Cabai)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Surat Jalan
                  </label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
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
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Rincian Komoditas Baris */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Daftar Komoditas Diterima:
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center space-x-1 text-xs text-amber-700 hover:text-amber-800 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Komoditas</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {billItems.map((item) => (
                    <div key={item.id} className="p-2.5 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-2">
                      <div className="w-full sm:w-1/3">
                        <input
                          type="text"
                          required
                          placeholder="Nama Item Pasokan"
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
                          placeholder="Harga Beli"
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
                        disabled={billItems.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-20 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Tagihan
                </label>
                <input
                  type="text"
                  placeholder="Keterangan tempo, kondisi barang, dsb..."
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              {/* Total Calculation Display */}
              <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Total Hutang Tagihan Supplier:</span>
                <span className="text-base text-amber-800">
                  {formatRupiah(billItems.reduce((s, i) => s + i.qty * i.unitPrice, 0))}
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-sm transition"
                >
                  Simpan Tagihan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BAYAR TAGIHAN SUPPLIER (KAS KELUAR) */}
      {paymentModalBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-amber-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Banknote className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Pelunasan Tagihan Supplier</h3>
              </div>
              <button
                onClick={() => setPaymentModalBill(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPay} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Tagihan:</span>
                  <span className="font-semibold text-slate-800">{paymentModalBill.billNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-semibold text-slate-800">{paymentModalBill.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sisa Hutang:</span>
                  <span className="font-bold text-amber-800">
                    {formatRupiah(paymentModalBill.totalAmount - paymentModalBill.paidAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  required
                  max={paymentModalBill.totalAmount - paymentModalBill.paidAmount}
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(parseNumberID(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rekening Sumber Dana (Kas / Bank)
                </label>
                <select
                  value={paySourceCode}
                  onChange={(e) => setPaySourceCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name} (Saldo: {formatRupiah(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Pembayaran
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Ref Transaksi
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalBill(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={payAmount <= 0}
                  className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  Bayar & Posting Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
