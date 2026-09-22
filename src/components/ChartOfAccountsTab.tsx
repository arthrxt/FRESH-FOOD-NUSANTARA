import React, { useState } from 'react';
import { Account, AccountCategory, NormalBalance } from '../types';
import { formatRupiah } from '../utils/accountingUtils';
import { 
  FolderTree, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  X,
  Layers,
  BookMarked
} from 'lucide-react';

interface ChartOfAccountsTabProps {
  accounts: Account[];
  onAddAccount: (newAccount: Account) => void;
  onToggleAccountActive: (code: string) => void;
}

export const ChartOfAccountsTab: React.FC<ChartOfAccountsTabProps> = ({
  accounts,
  onAddAccount,
  onToggleAccountActive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AccountCategory>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<AccountCategory>('ASSET');
  const [newSubcategory, setNewSubcategory] = useState('Kas & Setara Kas');
  const [newNormalBalance, setNewNormalBalance] = useState<NormalBalance>('DEBIT');
  const [newDescription, setNewDescription] = useState('');
  const [newBalance, setNewBalance] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Otomatis sesuaikan normal balance saat kategori berubah
  const handleCategoryChange = (cat: AccountCategory) => {
    setNewCategory(cat);
    if (cat === 'ASSET' || cat === 'EXPENSE') {
      setNewNormalBalance('DEBIT');
    } else {
      setNewNormalBalance('CREDIT');
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newCode.trim() || !newName.trim()) {
      setErrorMessage('Kode dan nama akun wajib diisi.');
      return;
    }

    if (accounts.some((a) => a.code === newCode.trim())) {
      setErrorMessage(`Kode akun ${newCode} sudah terdaftar dalam sistem.`);
      return;
    }

    onAddAccount({
      code: newCode.trim(),
      name: newName.trim(),
      category: newCategory,
      subcategory: newSubcategory.trim() || newCategory,
      normalBalance: newNormalBalance,
      description: newDescription.trim(),
      balance: Number(newBalance) || 0,
      isActive: true,
    });

    setIsModalOpen(false);
    setNewCode('');
    setNewName('');
    setNewDescription('');
    setNewBalance(0);
  };

  const filteredAccounts = accounts.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.subcategory.toLowerCase().includes(q);
    const matchCat = categoryFilter === 'ALL' || a.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Bagan Akun (Chart of Accounts / COA)</h2>
          <p className="text-xs text-slate-500">
            Daftar hierarki akun pembukuan double-entry Fresh Food Nusantara Sumedang.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Cari kode atau nama akun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto self-start sm:self-auto pb-1 sm:pb-0">
          {(['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL'
                ? 'Semua'
                : cat === 'ASSET'
                ? '1. Aset'
                : cat === 'LIABILITY'
                ? '2. Kewajiban'
                : cat === 'EQUITY'
                ? '3. Ekuitas'
                : cat === 'REVENUE'
                ? '4. Pendapatan'
                : '5-6. Beban'}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-28">Kode Akun</th>
                <th className="py-3 px-4">Nama Akun & Subkategori</th>
                <th className="py-3 px-4">Kategori Akuntansi</th>
                <th className="py-3 px-4 text-center">Saldo Normal</th>
                <th className="py-3 px-4 text-right">Saldo Saat Ini</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((acc) => (
                <tr key={acc.code} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {acc.code}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 block">{acc.name}</span>
                    <span className="text-[11px] text-slate-400 block">
                      {acc.subcategory} {acc.description && `• ${acc.description}`}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        acc.category === 'ASSET'
                          ? 'bg-sky-100 text-sky-800'
                          : acc.category === 'LIABILITY'
                          ? 'bg-amber-100 text-amber-800'
                          : acc.category === 'EQUITY'
                          ? 'bg-purple-100 text-purple-800'
                          : acc.category === 'REVENUE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {acc.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap font-medium text-slate-600">
                    {acc.normalBalance}
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatRupiah(acc.balance)}
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => onToggleAccountActive(acc.code)}
                      className="inline-flex items-center space-x-1 text-[11px] font-medium transition text-slate-600 hover:text-slate-900"
                    >
                      {acc.isActive ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                      <span>{acc.isActive ? 'Aktif' : 'Non-aktif'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: TAMBAH AKUN BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderTree className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Tambah Akun Baru ke COA</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Akun (misal 1-1540)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1-XXXX"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Akuntansi
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => handleCategoryChange(e.target.value as AccountCategory)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="ASSET">1. ASSET (Aset)</option>
                    <option value="LIABILITY">2. LIABILITY (Kewajiban)</option>
                    <option value="EQUITY">3. EQUITY (Ekuitas)</option>
                    <option value="REVENUE">4. REVENUE (Pendapatan)</option>
                    <option value="EXPENSE">5-6. EXPENSE (Beban)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Akun
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal Persediaan Sayur Olahan, Kasbon Driver..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subkategori
                  </label>
                  <input
                    type="text"
                    placeholder="misal Persediaan, Beban Operasional..."
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Saldo Normal
                  </label>
                  <select
                    value={newNormalBalance}
                    onChange={(e) => setNewNormalBalance(e.target.value as NormalBalance)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT (Kredit)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Saldo Awal (Opsional)
                </label>
                <input
                  type="number"
                  placeholder="Rp 0"
                  value={newBalance || ''}
                  onChange={(e) => setNewBalance(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Penjelasan fungsi akun..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
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
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
