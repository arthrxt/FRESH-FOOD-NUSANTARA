import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Mail, 
  Phone, 
  Briefcase, 
  Edit3, 
  Trash2, 
  ShieldAlert,
  Download,
  Upload,
  RefreshCw,
  Server,
  Terminal,
  Copy,
  AlertOctagon,
  Check,
  Globe
} from 'lucide-react';
import { formatDateID } from '../utils/accountingUtils';

interface UserManagementTabProps {
  users: AppUser[];
  currentUser: AppUser;
  onAddUser: (user: AppUser) => void;
  onUpdateUser: (user: AppUser) => void;
  onToggleUserActive: (userId: string) => void;
  onFormatServerData?: () => void;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onToggleUserActive,
  onFormatServerData,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [formatConfirmationInput, setFormatConfirmationInput] = useState('');
  const [copiedDeploy, setCopiedDeploy] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ACCOUNTING');
  const [department, setDepartment] = useState('Divisi Akuntansi dan Keuangan');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isMaster = currentUser.role === 'MASTER';

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setPassword('');
    setRole('ACCOUNTING');
    setDepartment('Divisi Akuntansi dan Keuangan');
    setEmail('');
    setPhone('');
    setFormError(null);
    setEditingUser(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setUsername(user.username);
    setPassword(user.password || '');
    setRole(user.role);
    setDepartment(user.department);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !fullName.trim()) {
      setFormError('Nama lengkap dan username wajib diisi.');
      return;
    }

    if (!editingUser) {
      // Check username collision
      const exists = users.some((u) => u.username.toLowerCase() === cleanUsername);
      if (exists) {
        setFormError(`Username "${cleanUsername}" sudah digunakan oleh akun lain.`);
        return;
      }

      if (!password.trim() || password.length < 5) {
        setFormError('Password minimal 5 karakter untuk keamanan.');
        return;
      }

      let roleTitle = 'Staf Akuntansi & Keuangan';
      if (role === 'MASTER') roleTitle = 'Master Administrator & Head of Accounting';
      if (role === 'OWNER') roleTitle = 'Business Owner & Executive Board';

      const newUser: AppUser = {
        id: `user-${Date.now()}`,
        username: cleanUsername,
        fullName: fullName.trim(),
        role,
        roleTitle,
        department: department.trim() || 'Fresh Food Nusantara',
        password: password.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      onAddUser(newUser);
    } else {
      let roleTitle = editingUser.roleTitle;
      if (role !== editingUser.role) {
        if (role === 'MASTER') roleTitle = 'Master Administrator & Head of Accounting';
        else if (role === 'OWNER') roleTitle = 'Business Owner & Executive Board';
        else roleTitle = 'Staf Akuntansi & Keuangan';
      }

      const updated: AppUser = {
        ...editingUser,
        fullName: fullName.trim(),
        role,
        roleTitle,
        department: department.trim(),
        password: password.trim() ? password.trim() : editingUser.password,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      };

      onUpdateUser(updated);
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleExportUsers = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ffn_users_backup_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExecuteFormat = () => {
    if (formatConfirmationInput.trim() !== 'FORMAT-FFN') {
      alert('Ketik kata konfirmasi "FORMAT-FFN" dengan tepat untuk melanjutkan pembersihan.');
      return;
    }

    if (onFormatServerData) {
      onFormatServerData();
    }
    setShowFormatModal(false);
    setFormatConfirmationInput('');
  };

  const copyDeployScript = () => {
    const script = `curl -sSL https://raw.githubusercontent.com/freshfoodnusantara/ffn-accounting/main/deploy-biznet.sh | bash`;
    navigator.clipboard.writeText(script);
    setCopiedDeploy(true);
    setTimeout(() => setCopiedDeploy(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              OTORISASI MASTER ARTHUR
            </span>
            <span className="text-xs text-slate-400">• Akses Penuh Sistem FFN</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Manajemen Pengguna & Otoritas Server
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Sebagai Master Admin, Arthur memiliki kendali penuh untuk membuat dan mengelola akun akses sistem (Tim Akuntansi & Owner) serta pemeliharaan server Biznet Neo Cloud.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportUsers}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Backup Akun (JSON)
          </button>

          {isMaster && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Akun Baru
            </button>
          )}
        </div>
      </div>

      {/* Role Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
              M
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">MASTER ADMIN (Arthur)</h4>
              <span className="text-[10px] text-emerald-700 font-semibold">Hak Akses Tertinggi</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Dapat mengakses seluruh modul: jurnal umum, pembalikan (*reversal*), pembukaan/penguncian periode, hapus transaksi, AR, AP, rekonsiliasi cashback, manajemen pengguna, dan format database server.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs">
              O
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">OWNER / DIREKSI</h4>
              <span className="text-[10px] text-purple-700 font-semibold">Executive Dashboard</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Dikhususkan untuk Pemilik Bisnis. Tampilan ringkas tingkat tinggi: omzet, laba bersih, arus kas masuk/keluar, sisa piutang SPPG, saldo 4 rekening bank, dan komitmen bagi hasil investor.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">
              A
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">TIM AKUNTANSI</h4>
              <span className="text-[10px] text-blue-700 font-semibold">Operasional Harian</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Fokus pada pencatatan faktur penjualan SPPG, tagihan supplier 6 rekanan, posting jurnal penyesuaian, dan pelunasan kas masuk/keluar harian.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Akun Pengguna Terdaftar ({users.length} Akun)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Sistem Mandiri • domain: ffoodnusantara.site
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Username & Otoritas</th>
                <th className="py-3 px-4">Kontak / Departemen</th>
                <th className="py-3 px-4">Kredensial</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                const isArthurMaster = u.username.toLowerCase() === 'arthur';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Nama & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center text-white ${
                            u.role === 'MASTER'
                              ? 'bg-emerald-700'
                              : u.role === 'OWNER'
                              ? 'bg-purple-700'
                              : 'bg-blue-600'
                          }`}
                        >
                          {u.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">{u.fullName}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-700">
                                ANDA
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block">{u.roleTitle}</span>
                        </div>
                      </div>
                    </td>

                    {/* Username & Role */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs inline-block">
                          @{u.username}
                        </span>
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              u.role === 'MASTER'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : u.role === 'OWNER'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            ROLE: {u.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Kontak & Departemen */}
                    <td className="py-3 px-4 text-slate-600 space-y-0.5">
                      <p className="font-medium text-slate-800">{u.department}</p>
                      {u.email && <p className="text-[11px] text-slate-400">{u.email}</p>}
                      {u.phone && <p className="text-[11px] text-slate-400">{u.phone}</p>}
                    </td>

                    {/* Kredensial */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>••••••••</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Tersimpan Terenkripsi
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Nonaktif
                          </>
                        )}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-right">
                      {isMaster && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Data / Reset Password"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {!isArthurMaster && (
                            <button
                              type="button"
                              onClick={() => onToggleUserActive(u.id)}
                              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                u.isActive
                                  ? 'text-rose-500 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                            >
                              {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2 Special Panels for Arthur Master: Server Publishing Guide & Format Server Data */}
      {isMaster && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel 1: Format Habis Data Lama Server (Clean Slate Launch) */}
          <div className="bg-white rounded-3xl border border-rose-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Format Habis Data Transaksi Lama
                  </h3>
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                    Pembersihan Total Untuk Siap Pakai / Launch
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Fitur ini digunakan saat Arthur siap meluncurkan aplikasi secara resmi di server Biznet Neo. Seluruh faktur demo, tagihan demo, mutasi jurnal demo, dan catatan cashback akan <strong>dihapus total menjadi 0</strong>.
              </p>

              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Apa yang tetap dipertahankan aman:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>4 Rekening Resmi Perusahaan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>6 Rekanan Supplier Utama</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3 Komitmen Investor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bagan Akun (COA) Standar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Seluruh Akun Pengguna</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Periode Akuntansi Aktif</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Tindakan tidak dapat dibatalkan
              </span>
              <button
                type="button"
                onClick={() => setShowFormatModal(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Format Habis Data Transaksi
              </button>
            </div>
          </div>

          {/* Panel 2: Panduan Publish Biznet Neo & Domain ffoodnusantara.site */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 sm:p-6 text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Publish ke Server Biznet Neo
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono mt-0.5">
                      <Globe className="w-3 h-3" />
                      <span>ffoodnusantara.site</span>
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready Deploy
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Skrip otomatisasi <code>deploy-biznet.sh</code> telah dibuat di root proyek. Skrip ini akan memasang Nginx, Node.js 20, menghapus data lama di <code>/var/www/ffoodnusantara</code>, mengompilasi build, dan mengonfigurasi domain <strong>ffoodnusantara.site</strong> dengan SSL HTTPS gratis.
              </p>

              <div className="mt-4 bg-slate-950 rounded-2xl p-3.5 border border-slate-800 font-mono text-[11px] text-slate-300">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                  <span>Perintah Eksekusi di VPS Biznet Neo:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('bash deploy-biznet.sh');
                      setCopiedDeploy(true);
                      setTimeout(() => setCopiedDeploy(false), 2000);
                    }}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {copiedDeploy ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDeploy ? 'Tersalin!' : 'Salin Perintah'}</span>
                  </button>
                </div>
                <p className="text-emerald-400"># 1. Masuk ke server Biznet Neo via SSH:</p>
                <p className="text-slate-400 mb-2">ssh root@IP_SERVER_BIZNET</p>
                
                <p className="text-emerald-400"># 2. Jalankan skrip deploy & format server:</p>
                <p className="text-slate-200">bash deploy-biznet.sh</p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Nginx + SPA Fallback + Let's Encrypt SSL
              </span>
              <a
                href="https://ffoodnusantara.site"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                <span>Buka ffoodnusantara.site</span>
                <Globe className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Format Data Server */}
      {showFormatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-rose-300 shadow-2xl max-w-md w-full p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Konfirmasi Format Habis Data
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Tindakan ini akan mengosongkan semua data transaksi demo!
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Semua faktur penjualan SPPG, tagihan supplier, jurnal umum, dan mutasi saldo kas akan <strong>dibersihkan kembali ke nol</strong> agar sistem bersih dan siap pakai operasional harian.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ketik <strong className="text-rose-600 font-mono">FORMAT-FFN</strong> di bawah untuk mengonfirmasi:
              </label>
              <input
                type="text"
                placeholder="FORMAT-FFN"
                value={formatConfirmationInput}
                onChange={(e) => setFormatConfirmationInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 font-mono text-sm text-center font-bold uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowFormatModal(false);
                  setFormatConfirmationInput('');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={formatConfirmationInput.trim() !== 'FORMAT-FFN'}
                onClick={handleExecuteFormat}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ya, Bersihkan Data Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Pengguna */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Perbarui Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Otoritas Master Arthur • Sistem Akuntansi FFN
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bapak H. Owner / Siti Nurhaliza"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    placeholder="misal: owner / staff_keuangan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peran / Role Otoritas *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  >
                    <option value="ACCOUNTING">ACCOUNTING (Tim Akuntansi)</option>
                    <option value="OWNER">OWNER (Executive Dashboard)</option>
                    <option value="MASTER">MASTER (Arthur Full Control)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Login {editingUser ? '(Kosongkan bila tidak diubah)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder={editingUser ? 'Masukkan password baru...' : 'Password login akun'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Departemen / Divisi
                </label>
                <input
                  type="text"
                  placeholder="Misal: Divisi Akuntansi dan Keuangan"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    placeholder="email@ffoodnusantara.site"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm transition-colors"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Simpan Akun Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
