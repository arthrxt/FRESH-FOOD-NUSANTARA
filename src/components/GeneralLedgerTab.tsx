import React, { useState } from 'react';
import { Account, JournalEntry, JournalLine, AccountingPeriod } from '../types';
import { formatRupiah, formatDateID, parseNumberID } from '../utils/accountingUtils';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Search, 
  Filter, 
  Check, 
  AlertTriangle, 
  Scale, 
  BookOpen,
  ArrowRightLeft,
  X
} from 'lucide-react';

interface GeneralLedgerTabProps {
  accounts: Account[];
  journals: JournalEntry[];
  activePeriod: AccountingPeriod;
  onAddJournal: (newEntry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  onReverseJournal: (targetEntry: JournalEntry) => void;
}

export const GeneralLedgerTab: React.FC<GeneralLedgerTabProps> = ({
  accounts,
  journals,
  activePeriod,
  onAddJournal,
  onReverseJournal,
}) => {
  const [subView, setSubView] = useState<'journals' | 'ledger'>('journals');
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>('1-1400');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Form Entri Jurnal Baru
  const [entryDate, setEntryDate] = useState('2026-09-21');
  const [entryReference, setEntryReference] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryLines, setEntryLines] = useState<
    { id: string; accountCode: string; debit: number; credit: number; memo: string; partyName: string }[]
  >([
    { id: '1', accountCode: '1-1400', debit: 0, credit: 0, memo: '', partyName: '' },
    { id: '2', accountCode: '4-1100', debit: 0, credit: 0, memo: '', partyName: '' },
  ]);

  // Kalkulasi total debit dan kredit pada form
  const totalFormDebit = entryLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalFormCredit = entryLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isFormBalanced = Math.abs(totalFormDebit - totalFormCredit) < 0.01 && totalFormDebit > 0;
  const balanceDifference = Math.abs(totalFormDebit - totalFormCredit);

  // Tambah baris baru di form jurnal
  const handleAddLine = () => {
    setEntryLines([
      ...entryLines,
      {
        id: crypto.randomUUID(),
        accountCode: accounts[0]?.code || '1-1100',
        debit: 0,
        credit: 0,
        memo: '',
        partyName: '',
      },
    ]);
  };

  // Hapus baris di form
  const handleRemoveLine = (id: string) => {
    if (entryLines.length <= 2) return;
    setEntryLines(entryLines.filter((l) => l.id !== id));
  };

  // Update baris di form
  const handleUpdateLine = (id: string, field: string, value: any) => {
    setEntryLines(
      entryLines.map((l) => {
        if (l.id !== id) return l;
        if (field === 'debit' && value > 0) {
          return { ...l, debit: value, credit: 0 };
        }
        if (field === 'credit' && value > 0) {
          return { ...l, credit: value, debit: 0 };
        }
        return { ...l, [field]: value };
      })
    );
  };

  // Submit Posting Jurnal
  const handleSubmitJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormBalanced) return;
    if (!entryDescription.trim()) return;

    // Generate entry number
    const entryNumber = `CLIENT-${crypto.randomUUID()}`;

    const formattedLines: JournalLine[] = entryLines.map((l, idx) => {
      const acc = accounts.find((a) => a.code === l.accountCode);
      return {
        id: `jl-${crypto.randomUUID()}-${idx}`,
        accountCode: l.accountCode,
        accountName: acc ? acc.name : l.accountCode,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        memo: l.memo,
        partyName: l.partyName,
      };
    });

    onAddJournal({
      entryNumber,
      date: entryDate,
      reference: entryReference || 'INTERNAL',
      description: entryDescription,
      status: 'POSTED',
      lines: formattedLines,
      totalDebit: totalFormDebit,
      totalCredit: totalFormCredit,
      createdBy: 'Arthur (Accounting)',
    });

    // Reset Form
    setIsModalOpen(false);
    setEntryDescription('');
    setEntryReference('');
    setEntryLines([
      { id: '1', accountCode: '1-1400', debit: 0, credit: 0, memo: '', partyName: '' },
      { id: '2', accountCode: '4-1100', debit: 0, credit: 0, memo: '', partyName: '' },
    ]);
  };

  // Filter journals
  const filteredJournals = journals.filter((j) => {
    const q = searchQuery.toLowerCase();
    const matchDesc = j.description.toLowerCase().includes(q);
    const matchNum = j.entryNumber.toLowerCase().includes(q);
    const matchRef = j.reference.toLowerCase().includes(q);
    const matchParty = j.lines.some((l) => l.partyName?.toLowerCase().includes(q));
    return matchDesc || matchNum || matchRef || matchParty;
  });

  // Data Buku Besar untuk akun yang dipilih
  const currentAccount = accounts.find((a) => a.code === selectedAccountCode) || accounts[0];
  
  // Ekstrak semua baris transaksi untuk akun yang dipilih dari seluruh jurnal
  const ledgerMovements: {
    journalId: string;
    entryNumber: string;
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    memo?: string;
    partyName?: string;
  }[] = [];

  journals.forEach((j) => {
    if (j.status === 'DRAFT') return;
    j.lines.forEach((l) => {
      if (l.accountCode === selectedAccountCode) {
        ledgerMovements.push({
          journalId: j.id,
          entryNumber: j.entryNumber,
          date: j.date,
          reference: j.reference,
          description: j.description,
          debit: l.debit,
          credit: l.credit,
          memo: l.memo,
          partyName: l.partyName,
        });
      }
    });
  });

  // Urutkan mutasi buku besar berdasarkan tanggal
  ledgerMovements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Hitung running balance buku besar
  let runningBalance = 0;
  const isDebitNormal = currentAccount?.normalBalance === 'DEBIT';

  return (
    <div className="space-y-6">
      {/* Top Action & Subview Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setSubView('journals')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              subView === 'journals'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>Jurnal Umum (Entries)</span>
          </button>
          <button
            onClick={() => setSubView('ledger')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              subView === 'ledger'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Buku Besar Akun (General Ledger)</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-new-journal-entry"
            onClick={() => setIsModalOpen(true)}
            disabled={activePeriod.status === 'LOCKED'}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Entri Jurnal Baru</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: DAFTAR JURNAL UMUM (ENTRIES) */}
      {subView === 'journals' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm max-w-md">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Cari no. jurnal, ref SPPG, memo, atau supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
            />
          </div>

          {/* List of Journals */}
          <div className="space-y-4">
            {filteredJournals.map((journal) => (
              <div
                key={journal.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Journal Card Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-xs text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-300">
                      {journal.entryNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {formatDateID(journal.date)}
                    </span>
                    <span className="text-xs text-slate-600">
                      Ref: <strong className="text-slate-800">{journal.reference}</strong>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        journal.status === 'POSTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : journal.status === 'REVERSED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {journal.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">
                      Total: <strong className="text-slate-900">{formatRupiah(journal.totalDebit)}</strong>
                    </span>

                    {/* Tombol Reversal (Jurnal Pembalik Otomatis ala PHP Ledger) */}
                    {journal.status === 'POSTED' && activePeriod.status === 'OPEN' && (
                      <button
                        onClick={() => onReverseJournal(journal)}
                        title="Buat Jurnal Pembalik (Reversal / Koreksi)"
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] font-medium transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Koreksi / Reversal</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Journal Description */}
                <div className="px-4 py-2 text-xs font-medium text-slate-700 bg-white">
                  {journal.description}
                  {journal.reversedByEntryNumber && (
                    <span className="ml-2 text-rose-600 text-[11px] font-normal italic">
                      (Dibatalkan oleh {journal.reversedByEntryNumber})
                    </span>
                  )}
                  {journal.isReversalOfEntryNumber && (
                    <span className="ml-2 text-amber-600 text-[11px] font-normal italic">
                      (Pembalikan dari entri {journal.isReversalOfEntryNumber})
                    </span>
                  )}
                </div>

                {/* Journal Double-Entry Lines Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/50 text-slate-500 border-t border-b border-slate-100">
                      <tr>
                        <th className="py-2 px-4 font-semibold w-24">Kode Akun</th>
                        <th className="py-2 px-4 font-semibold">Nama Akun & Memo Transaksi</th>
                        <th className="py-2 px-4 font-semibold text-right w-36">Debit</th>
                        <th className="py-2 px-4 font-semibold text-right w-36">Kredit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {journal.lines.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-mono text-slate-600">{line.accountCode}</td>
                          <td className="py-2 px-4">
                            <span className={line.credit > 0 ? 'pl-6 font-medium text-slate-700 block' : 'font-medium text-slate-900 block'}>
                              {line.accountName}
                            </span>
                            {(line.memo || line.partyName) && (
                              <span className={line.credit > 0 ? 'pl-6 text-[11px] text-slate-500 block' : 'text-[11px] text-slate-500 block'}>
                                {line.partyName ? `[${line.partyName}] ` : ''}{line.memo}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right font-semibold text-slate-900">
                            {line.debit > 0 ? formatRupiah(line.debit) : '-'}
                          </td>
                          <td className="py-2 px-4 text-right font-semibold text-slate-900">
                            {line.credit > 0 ? formatRupiah(line.credit) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: BUKU BESAR AKUN (GENERAL LEDGER VIEW) */}
      {subView === 'ledger' && (
        <div className="space-y-4">
          {/* Account Selector Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Akun Buku Besar:
              </label>
              <select
                value={selectedAccountCode}
                onChange={(e) => setSelectedAccountCode(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.code} value={acc.code}>
                    {acc.code} - {acc.name} ({acc.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 min-w-[200px] text-right">
              <span className="text-[11px] text-slate-500 block">Saldo Akun Berjalan:</span>
              <span className="text-lg font-bold text-slate-900">
                {formatRupiah(currentAccount?.balance || 0)}
              </span>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">
                Normal: {currentAccount?.normalBalance}
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800">
                Kartu Mutasi Buku Besar: {currentAccount?.code} - {currentAccount?.name}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">No. Jurnal</th>
                    <th className="py-2.5 px-3">Ref / Pihak</th>
                    <th className="py-2.5 px-3">Keterangan Transaksi</th>
                    <th className="py-2.5 px-3 text-right">Debit</th>
                    <th className="py-2.5 px-3 text-right">Kredit</th>
                    <th className="py-2.5 px-3 text-right">Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Belum ada mutasi jurnal untuk akun ini pada periode aktif.
                      </td>
                    </tr>
                  ) : (
                    ledgerMovements.map((mov, index) => {
                      if (isDebitNormal) {
                        runningBalance += mov.debit - mov.credit;
                      } else {
                        runningBalance += mov.credit - mov.debit;
                      }

                      return (
                        <tr key={index} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                            {formatDateID(mov.date)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {mov.entryNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                            <span className="font-medium">{mov.reference}</span>
                            {mov.partyName && (
                              <span className="block text-[10px] text-slate-500">
                                {mov.partyName}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <div>{mov.description}</div>
                            {mov.memo && (
                              <div className="text-[10px] text-slate-400 italic">{mov.memo}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                            {mov.debit > 0 ? formatRupiah(mov.debit) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                            {mov.credit > 0 ? formatRupiah(mov.credit) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatRupiah(runningBalance)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INPUT ENTRI JURNAL BERPASANGAN BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Input Entri Jurnal Double-Entry Baru</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitJournal} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Bukti / Referensi
                  </label>
                  <input
                    type="text"
                    placeholder="misal PO-2609 / SJ-QUEEN"
                    value={entryReference}
                    onChange={(e) => setEntryReference(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Periode Akun
                  </label>
                  <input
                    type="text"
                    disabled
                    value={activePeriod.name}
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Transaksi (Memo Pokok)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Keterangan pengiriman SPPG, pembelian supplier, pengeluaran kas, dsb..."
                  value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Dynamic Lines (Debit & Kredit) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Baris Akun (Debit & Kredit):
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center space-x-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {entryLines.map((line, idx) => (
                    <div key={line.id} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-2">
                      <div className="w-full sm:w-1/3">
                        <select
                          value={line.accountCode}
                          onChange={(e) => handleUpdateLine(line.id, 'accountCode', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-none"
                        >
                          {accounts.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-1/4">
                        <input
                          type="text"
                          placeholder="Pihak (SPPG / Supplier)"
                          value={line.partyName}
                          onChange={(e) => handleUpdateLine(line.id, 'partyName', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-none"
                        />
                      </div>

                      <div className="w-full sm:w-1/5">
                        <input
                          type="number"
                          placeholder="Debit (Rp)"
                          value={line.debit || ''}
                          onChange={(e) => handleUpdateLine(line.id, 'debit', parseNumberID(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md text-right bg-white font-medium focus:outline-none"
                        />
                      </div>

                      <div className="w-full sm:w-1/5">
                        <input
                          type="number"
                          placeholder="Kredit (Rp)"
                          value={line.credit || ''}
                          onChange={(e) => handleUpdateLine(line.id, 'credit', parseNumberID(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md text-right bg-white font-medium focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        disabled={entryLines.length <= 2}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-20 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Balance Indicator */}
                <div
                  className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${
                    isFormBalanced
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {isFormBalanced ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>
                      {isFormBalanced
                        ? 'Jurnal Berimbang (Debit = Kredit)'
                        : `Tidak Berimbang! Selisih: ${formatRupiah(balanceDifference)}`}
                    </span>
                  </div>

                  <div className="space-x-4 text-right">
                    <span>Debit: {formatRupiah(totalFormDebit)}</span>
                    <span>Kredit: {formatRupiah(totalFormCredit)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isFormBalanced || !entryDescription.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Posting Jurnal Permanen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
