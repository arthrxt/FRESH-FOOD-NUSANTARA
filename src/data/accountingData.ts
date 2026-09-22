import { 
  Account, 
  JournalEntry, 
  SalesInvoice, 
  SupplierBill, 
  AccountingPeriod, 
  CashbackReconciliationRecord,
  CompanyBankAccount,
  MonthlyInvestorPayout,
  AppUser
} from '../types';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'user-master-arthur',
    username: 'arthur',
    fullName: 'Arthur',
    role: 'MASTER',
    roleTitle: 'Master Administrator & Head of Accounting',
    department: 'Fresh Food Nusantara - Accounting & Keuangan',
    password: 'ffn.arthur.master2026',
    email: 'arthur@ffoodnusantara.site',
    phone: '0812-8899-7711',
    isActive: true,
    createdAt: '2026-09-01T08:00:00Z',
    lastLogin: '2026-09-22T06:00:00Z'
  },
  {
    id: 'user-owner-ffn',
    username: 'owner',
    fullName: 'Direksi / Pemilik FFN',
    role: 'OWNER',
    roleTitle: 'Business Owner & Executive Board',
    department: 'Executive Management Fresh Food Nusantara',
    password: 'owner.ffn.sumedang',
    email: 'owner@ffoodnusantara.site',
    phone: '0811-2233-4455',
    isActive: true,
    createdAt: '2026-09-01T08:00:00Z',
    lastLogin: '2026-09-21T18:30:00Z'
  },
  {
    id: 'user-acc-staff',
    username: 'akunting',
    fullName: 'Staf Tim Akuntansi',
    role: 'ACCOUNTING',
    roleTitle: 'Staff Akuntansi & Operasional PO',
    department: 'Divisi Akuntansi dan Keuangan',
    password: 'akunting.ffn2026',
    email: 'akunting@ffoodnusantara.site',
    phone: '0813-4455-6677',
    isActive: true,
    createdAt: '2026-09-05T09:00:00Z',
    lastLogin: '2026-09-21T16:00:00Z'
  }
];

export const INITIAL_COMPANY_BANKS: CompanyBankAccount[] = [
  {
    id: 'bank-bri-irma',
    bankName: 'BRI',
    accountNumber: '44300102179533',
    accountHolder: 'IRMA YULIANTI',
    accountCode: '1-1210',
    balance: 42500000,
    status: 'ACTIVE',
    branch: 'BRI Unit Paseh'
  },
  {
    id: 'bank-bri-rendra',
    bankName: 'BRI',
    accountNumber: '443001024894533',
    accountHolder: 'RENDRA REZA BUDIARA',
    accountCode: '1-1220',
    balance: 38600000,
    status: 'ACTIVE',
    branch: 'BRI KC Sumedang'
  },
  {
    id: 'bank-btn-odah',
    bankName: 'BTN',
    accountNumber: '0038101500113238',
    accountHolder: 'ODAH SUKAEDAH',
    accountCode: '1-1230',
    balance: 25100000,
    status: 'ACTIVE',
    branch: 'BTN KCP Sumedang'
  },
  {
    id: 'bank-bri-durahman',
    bankName: 'BRI',
    accountNumber: '443001020912533',
    accountHolder: 'DURAHMAN',
    accountCode: '1-1240',
    balance: 17500000,
    status: 'ACTIVE',
    branch: 'BRI Unit Cimalaka'
  }
];

export const DEFAULT_SUPPLIERS = [
  'Mansur',
  'Royana',
  'HBS',
  'PT ABR',
  'DRW',
  'BAHRUL'
];

export const INITIAL_INVESTOR_PAYOUTS: MonthlyInvestorPayout[] = [
  {
    id: 'inv-pay-dewi',
    investorName: 'Dewi amor',
    period: 'September 2026',
    investmentAmount: 50000000,
    monthlyPayoutAmount: 3500000,
    dueDate: '2026-09-05',
    status: 'PAID',
    paidDate: '2026-09-05',
    paidFromBank: 'BRI - IRMA YULIANTI - 44300102179533',
    paidFromAccountCode: '1-1210',
    journalEntryNumber: 'JU-202609-INV-01',
    notes: 'Bagi hasil rutin September 2026 telah ditransfer tepat waktu'
  },
  {
    id: 'inv-pay-iis',
    investorName: 'bu iis',
    period: 'September 2026',
    investmentAmount: 40000000,
    monthlyPayoutAmount: 2800000,
    dueDate: '2026-09-10',
    status: 'UNPAID',
    notes: 'Jatuh tempo setiap tanggal 10 per bulan. Siap diproses transfer'
  },
  {
    id: 'inv-pay-novia',
    investorName: 'novia',
    period: 'September 2026',
    investmentAmount: 35000000,
    monthlyPayoutAmount: 2450000,
    dueDate: '2026-09-15',
    status: 'UNPAID',
    notes: 'Jatuh tempo setiap tanggal 15 per bulan. Siap diproses transfer'
  }
];

export const INITIAL_PERIODS: AccountingPeriod[] = [
  {
    id: 'per-2026-10',
    name: 'Oktober 2026',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    status: 'OPEN',
  },
  {
    id: 'per-2026-09',
    name: 'September 2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'OPEN',
  },
  {
    id: 'per-2026-08',
    name: 'Agustus 2026',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'LOCKED',
    closedAt: '2026-09-02 18:00',
    closedBy: 'Arthur (Accounting)',
  },
  {
    id: 'per-2026-07',
    name: 'Juli 2026',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'LOCKED',
    closedAt: '2026-08-01 17:00',
    closedBy: 'Arthur (Accounting)',
  }
];

export const INITIAL_ACCOUNTS: Account[] = [
  // 1-XXXX ASSETS
  { code: '1-1100', name: 'Kas Operasional Gudang', category: 'ASSET', subcategory: 'Kas & Setara Kas', normalBalance: 'DEBIT', balance: 14750000, isActive: true, description: 'Kas fisik harian di gudang operasional FFN' },
  { code: '1-1210', name: 'Bank BRI - IRMA YULIANTI (44300102179533)', category: 'ASSET', subcategory: 'Kas & Setara Kas', normalBalance: 'DEBIT', balance: 42500000, isActive: true, description: 'Rekening operasional BRI a.n. Irma Yulianti' },
  { code: '1-1220', name: 'Bank BRI - RENDRA REZA BUDIARA (443001024894533)', category: 'ASSET', subcategory: 'Kas & Setara Kas', normalBalance: 'DEBIT', balance: 38600000, isActive: true, description: 'Rekening penerimaan utama BRI a.n. Rendra Reza Budiara' },
  { code: '1-1230', name: 'Bank BTN - ODAH SUKAEDAH (0038101500113238)', category: 'ASSET', subcategory: 'Kas & Setara Kas', normalBalance: 'DEBIT', balance: 25100000, isActive: true, description: 'Rekening operasional BTN a.n. Odah Sukaedah' },
  { code: '1-1240', name: 'Bank BRI - DURAHMAN (443001020912533)', category: 'ASSET', subcategory: 'Kas & Setara Kas', normalBalance: 'DEBIT', balance: 17500000, isActive: true, description: 'Rekening pembayaran BRI a.n. Durahman' },
  { code: '1-1400', name: 'Piutang Usaha SPPG', category: 'ASSET', subcategory: 'Piutang', normalBalance: 'DEBIT', balance: 46850000, isActive: true, description: 'Tagihan berjalan atas pengiriman pangan ke SPPG' },
  { code: '1-1450', name: 'Piutang Titipan / Talangan SPPG', category: 'ASSET', subcategory: 'Piutang', normalBalance: 'DEBIT', balance: 3200000, isActive: true, description: 'Dana talangan terpisah non-pangan untuk SPPG' },
  { code: '1-1500', name: 'Persediaan Bahan Pangan - Buah', category: 'ASSET', subcategory: 'Persediaan', normalBalance: 'DEBIT', balance: 12400000, isActive: true, description: 'Stok buah segar di cold room / gudang' },
  { code: '1-1510', name: 'Persediaan Bahan Pangan - Sayur', category: 'ASSET', subcategory: 'Persediaan', normalBalance: 'DEBIT', balance: 6800000, isActive: true, description: 'Stok sayuran basah & daun' },
  { code: '1-1520', name: 'Persediaan Bahan Pangan - Protein', category: 'ASSET', subcategory: 'Persediaan', normalBalance: 'DEBIT', balance: 18900000, isActive: true, description: 'Ayam, telur, daging sapi segar/beku' },
  { code: '1-1530', name: 'Persediaan Bahan Pangan - Sembako & Bumbu', category: 'ASSET', subcategory: 'Persediaan', normalBalance: 'DEBIT', balance: 9350000, isActive: true, description: 'Beras, minyak, bumbu kering, rempah' },
  { code: '1-2100', name: 'Peralatan & Timbangan Gudang', category: 'ASSET', subcategory: 'Aset Tetap', normalBalance: 'DEBIT', balance: 16500000, isActive: true, description: 'Timbangan digital, keranjang sortir, sealer' },
  { code: '1-2200', name: 'Kendaraan & Armada Pengiriman', category: 'ASSET', subcategory: 'Aset Tetap', normalBalance: 'DEBIT', balance: 125000000, isActive: true, description: 'Armada pickup logistik operasional' },

  // 2-XXXX LIABILITIES
  { code: '2-1100', name: 'Hutang Usaha - Mansur', category: 'LIABILITY', subcategory: 'Hutang Usaha', normalBalance: 'CREDIT', balance: 14200000, isActive: true, description: 'Tagihan supply sayuran kebun & bumbu dari Mansur' },
  { code: '2-1200', name: 'Hutang Usaha - Royana', category: 'LIABILITY', subcategory: 'Hutang Usaha', normalBalance: 'CREDIT', balance: 11500000, isActive: true, description: 'Tagihan pasokan pangan & buah dari Royana' },
  { code: '2-1300', name: 'Hutang Usaha - HBS', category: 'LIABILITY', subcategory: 'Hutang Usaha', normalBalance: 'CREDIT', balance: 12800000, isActive: true, description: 'Tagihan pasokan protein unggas & daging dari HBS' },
  { code: '2-1400', name: 'Hutang Usaha - PT ABR', category: 'LIABILITY', subcategory: 'Hutang Usaha', normalBalance: 'CREDIT', balance: 10500000, isActive: true, description: 'Tagihan beras & sembako dari PT ABR' },
  { code: '2-1500', name: 'Hutang Usaha - DRW', category: 'LIABILITY', subcategory: 'Hutang Usaha', normalBalance: 'CREDIT', balance: 5600000, isActive: true, description: 'Tagihan pasokan bumbu & olahan dari DRW' },
  { code: '2-1600', name: 'Hutang Usaha - BAHRUL', category: 'LIABILITY', subcategory: 'Hutang Usaha', normalBalance: 'CREDIT', balance: 4600000, isActive: true, description: 'Tagihan sayur daun & bumbu segar dari Bahrul' },
  { code: '2-2100', name: 'Hutang Titipan SPPG', category: 'LIABILITY', subcategory: 'Kewajiban Lancar', normalBalance: 'CREDIT', balance: 4500000, isActive: true, description: 'Titipan dana dari pihak SPPG yang belum diselesaikan' },
  { code: '2-2200', name: 'Hutang Gaji & Upah Kru', category: 'LIABILITY', subcategory: 'Kewajiban Lancar', normalBalance: 'CREDIT', balance: 7500000, isActive: true, description: 'Akrual upah driver, kenek, staf sortir' },
  { code: '2-3100', name: 'Hutang Bagi Hasil - Dewi Amor', category: 'LIABILITY', subcategory: 'Kewajiban Lancar', normalBalance: 'CREDIT', balance: 3500000, isActive: true, description: 'Bagi hasil bulanan jatuh tempo investor Dewi Amor' },
  { code: '2-3200', name: 'Hutang Bagi Hasil - Bu Iis', category: 'LIABILITY', subcategory: 'Kewajiban Lancar', normalBalance: 'CREDIT', balance: 2800000, isActive: true, description: 'Bagi hasil bulanan jatuh tempo investor Bu Iis' },
  { code: '2-3300', name: 'Hutang Bagi Hasil - Novia', category: 'LIABILITY', subcategory: 'Kewajiban Lancar', normalBalance: 'CREDIT', balance: 2450000, isActive: true, description: 'Bagi hasil bulanan jatuh tempo investor Novia' },

  // 3-XXXX EQUITY
  { code: '3-1100', name: 'Modal Disetor FFN', category: 'EQUITY', subcategory: 'Modal', normalBalance: 'CREDIT', balance: 150000000, isActive: true, description: 'Modal awal operasional FFN' },
  { code: '3-1200', name: 'Saldo Laba Ditahan', category: 'EQUITY', subcategory: 'Laba Ditahan', normalBalance: 'CREDIT', balance: 22500000, isActive: true, description: 'Akumulasi laba periode terdahulu' },
  { code: '3-2100', name: 'Modal Investasi - Dewi Amor', category: 'EQUITY', subcategory: 'Modal', normalBalance: 'CREDIT', balance: 50000000, isActive: true, description: 'Penyertaan dana investasi modal Dewi Amor' },
  { code: '3-2200', name: 'Modal Investasi - Bu Iis', category: 'EQUITY', subcategory: 'Modal', normalBalance: 'CREDIT', balance: 40000000, isActive: true, description: 'Penyertaan dana investasi modal Bu Iis' },
  { code: '3-2300', name: 'Modal Investasi - Novia', category: 'EQUITY', subcategory: 'Modal', normalBalance: 'CREDIT', balance: 35000000, isActive: true, description: 'Penyertaan dana investasi modal Novia' },

  // 4-XXXX REVENUE
  { code: '4-1100', name: 'Pendapatan Penjualan SPPG', category: 'REVENUE', subcategory: 'Pendapatan Usaha', normalBalance: 'CREDIT', balance: 138400000, isActive: true, description: 'Pendapatan bruto atas PO pengiriman SPPG' },
  { code: '4-1200', name: 'Pendapatan Selisih Cashback SPPG', category: 'REVENUE', subcategory: 'Pendapatan Usaha', normalBalance: 'CREDIT', balance: 8450000, isActive: true, description: 'Akumulasi selisih harga SPPG vs harga real purchase' },

  // 5-XXXX COST OF GOODS SOLD (HPP)
  { code: '5-1100', name: 'Beban Pokok Penjualan - Bahan Pangan', category: 'EXPENSE', subcategory: 'Harga Pokok Penjualan', normalBalance: 'DEBIT', balance: 94600000, isActive: true, description: 'HPP riil bahan pangan terkirim' },
  { code: '5-1200', name: 'Beban Ongkos Angkut Pembelian', category: 'EXPENSE', subcategory: 'Harga Pokok Penjualan', normalBalance: 'DEBIT', balance: 4200000, isActive: true, description: 'Transportasi pengadaan dari pasar induk/kebun' },

  // 6-XXXX OPERATIONAL EXPENSES
  { code: '6-1100', name: 'Beban Gaji Driver & Kenek Pengiriman', category: 'EXPENSE', subcategory: 'Beban Operasional', normalBalance: 'DEBIT', balance: 8800000, isActive: true, description: 'Upah harian & bulanan armada rute SPPG' },
  { code: '6-1200', name: 'Beban Gaji Staf Gudang & Admin', category: 'EXPENSE', subcategory: 'Beban Operasional', normalBalance: 'DEBIT', balance: 6500000, isActive: true, description: 'Gaji staf QC, timbang, admin akuntansi' },
  { code: '6-1300', name: 'Beban BBM & Tol Logistik', category: 'EXPENSE', subcategory: 'Beban Operasional', normalBalance: 'DEBIT', balance: 3950000, isActive: true, description: 'BBM Solar pickup rute operasional' },
  { code: '6-1400', name: 'Beban Retur & Penyusutan Pangan Rusak', category: 'EXPENSE', subcategory: 'Beban Operasional', normalBalance: 'DEBIT', balance: 2150000, isActive: true, description: 'Barang reject, susut timbangan, dan rusak di jalan' },
  { code: '6-1500', name: 'Beban Operasional Gudang & Listrik', category: 'EXPENSE', subcategory: 'Beban Operasional', normalBalance: 'DEBIT', balance: 2750000, isActive: true, description: 'Listrik chiller, air, plastik packing' },
  { code: '6-1600', name: 'Beban Administrasi Bank & Transaksi', category: 'EXPENSE', subcategory: 'Beban Operasional', normalBalance: 'DEBIT', balance: 300000, isActive: true, description: 'Biaya admin transfer antar-bank' },
  { code: '6-1700', name: 'Beban Bagi Hasil Investor', category: 'EXPENSE', subcategory: 'Beban Operasional', normalBalance: 'DEBIT', balance: 23600000, isActive: true, description: 'Beban komitmen imbal bagi hasil investor bulanan' },
];

export const INITIAL_JOURNALS: JournalEntry[] = [
  {
    id: 'je-2026-001',
    entryNumber: 'JU-202609-001',
    date: '2026-09-18',
    reference: 'PO-RW-260918',
    description: 'Penyerahan supply pangan SPPG Regol Wetan (Rute Timur)',
    status: 'POSTED',
    totalDebit: 15400000,
    totalCredit: 15400000,
    createdAt: '2026-09-18 10:15',
    createdBy: 'Arthur',
    lines: [
      { id: 'jl-01', accountCode: '1-1400', accountName: 'Piutang Usaha SPPG', debit: 15400000, credit: 0, memo: 'Tagihan PO Regol Wetan', partyName: 'SPPG Regol Wetan' },
      { id: 'jl-02', accountCode: '4-1100', accountName: 'Pendapatan Penjualan SPPG', debit: 0, credit: 15400000, memo: 'Pengiriman 5 komoditas lengkap', partyName: 'SPPG Regol Wetan' },
    ]
  },
  {
    id: 'je-2026-002',
    entryNumber: 'JU-202609-002',
    date: '2026-09-18',
    reference: 'SJ-QUEEN-9812',
    description: 'Penerimaan supply buah segar dari Queen Fruit',
    status: 'POSTED',
    totalDebit: 11200000,
    totalCredit: 11200000,
    createdAt: '2026-09-18 11:30',
    createdBy: 'Arthur',
    lines: [
      { id: 'jl-03', accountCode: '1-1500', accountName: 'Persediaan Bahan Pangan - Buah', debit: 11200000, credit: 0, memo: 'Pisang mulyo 350 kg + melon 180 kg', partyName: 'Queen Fruit' },
      { id: 'jl-04', accountCode: '2-1100', accountName: 'Hutang Usaha - Queen Fruit', debit: 0, credit: 11200000, memo: 'Faktur tempo 7 hari', partyName: 'Queen Fruit' },
    ]
  },
  {
    id: 'je-2026-003',
    entryNumber: 'JU-202609-003',
    date: '2026-09-19',
    reference: 'BBM-SUMEDANG-0919',
    description: 'Pengeluaran kas operasional BBM 2 armada pickup rute Sumedang',
    status: 'POSTED',
    totalDebit: 650000,
    totalCredit: 650000,
    createdAt: '2026-09-19 06:45',
    createdBy: 'Arthur',
    lines: [
      { id: 'jl-05', accountCode: '6-1300', accountName: 'Beban BBM & Tol Logistik Sumedang', debit: 650000, credit: 0, memo: 'Solar armada D-8142 & D-8711', partyName: 'SPBU Paseh' },
      { id: 'jl-06', accountCode: '1-1100', accountName: 'Kas Operasional Gudang', debit: 0, credit: 650000, memo: 'Voucher kas keluar #042', partyName: 'Kasir Gudang' },
    ]
  },
  {
    id: 'je-2026-004',
    entryNumber: 'JU-202609-004',
    date: '2026-09-20',
    reference: 'TRF-SPPG-WARGA',
    description: 'Pencairan pembayaran sebagian piutang SPPG Wargaluyu via Mandiri',
    status: 'POSTED',
    totalDebit: 12000000,
    totalCredit: 12000000,
    createdAt: '2026-09-20 14:10',
    createdBy: 'Arthur',
    lines: [
      { id: 'jl-07', accountCode: '1-1200', accountName: 'Bank Mandiri FFN', debit: 12000000, credit: 0, memo: 'Pelunasan termin 1 pengiriman', partyName: 'SPPG Wargaluyu' },
      { id: 'jl-08', accountCode: '1-1400', accountName: 'Piutang Usaha SPPG', debit: 0, credit: 12000000, memo: 'Kredit piutang Wargaluyu', partyName: 'SPPG Wargaluyu' },
    ]
  },
  {
    id: 'je-2026-005',
    entryNumber: 'JU-202609-005',
    date: '2026-09-21',
    reference: 'RETUR-KML-0921',
    description: 'Pencatatan retur wortel rusak SPPG Kamal (Kasus investigasi wortel)',
    status: 'POSTED',
    totalDebit: 320000,
    totalCredit: 320000,
    createdAt: '2026-09-21 09:20',
    createdBy: 'Arthur',
    lines: [
      { id: 'jl-09', accountCode: '6-1400', accountName: 'Beban Retur & Penyusutan Pangan Rusak', debit: 320000, credit: 0, memo: 'Wortel 20 kg reject sortir SPPG Kamal', partyName: 'SPPG Kamal' },
      { id: 'jl-10', accountCode: '1-1400', accountName: 'Piutang Usaha SPPG', debit: 0, credit: 320000, memo: 'Kredit nota potongan piutang Kamal', partyName: 'SPPG Kamal' },
    ]
  },
  {
    id: 'je-2026-006',
    entryNumber: 'JU-202609-006',
    date: '2026-09-21',
    reference: 'TITIP-CML-0921',
    description: 'Penerimaan dana titipan pembelian kemasan SPPG Cimalaka (Terpisah dari Cashback)',
    status: 'POSTED',
    totalDebit: 1500000,
    totalCredit: 1500000,
    createdAt: '2026-09-21 11:00',
    createdBy: 'Arthur',
    lines: [
      { id: 'jl-11', accountCode: '1-1100', accountName: 'Kas Operasional Gudang', debit: 1500000, credit: 0, memo: 'Kas masuk titipan khusus kemasan', partyName: 'SPPG Cimalaka' },
      { id: 'jl-12', accountCode: '2-2100', accountName: 'Hutang Titipan SPPG', debit: 0, credit: 1500000, memo: 'Kewajiban titipan terpisah murni', partyName: 'SPPG Cimalaka' },
    ]
  }
];

export const INITIAL_SALES_INVOICES: SalesInvoice[] = [
  {
    id: 'inv-01',
    invoiceNumber: 'INV-SPPG-2609-01',
    sppgName: 'SPPG Regol Wetan',
    date: '2026-09-18',
    dueDate: '2026-09-25',
    period: 'September 2026',
    subtotal: 15400000,
    cashbackCredit: 0,
    titipanAmount: 0,
    returAdjustment: 0,
    netTotal: 15400000,
    paidAmount: 5400000,
    status: 'PARTIAL',
    journalEntryNumber: 'JU-202609-001',
    notes: 'Pengiriman paket MBG Sayur & Buah segar Rute Timur',
    items: [
      { id: 'ii-01', description: 'Pisang Mulyo Standar MBG', category: 'BUAH', qty: 250, unit: 'kg', unitPrice: 16000, total: 4000000 },
      { id: 'ii-02', description: 'Sayur Bayam Petik Segar', category: 'SAYUR', qty: 180, unit: 'ikat', unitPrice: 4000, total: 720000 },
      { id: 'ii-03', description: 'Daging Ayam Fillet Segar', category: 'PROTEIN', qty: 160, unit: 'kg', unitPrice: 48000, total: 7680000 },
      { id: 'ii-04', description: 'Beras Medium Sumedang', category: 'SEMBAKO DAN OLAHAN LAINNYA', qty: 200, unit: 'kg', unitPrice: 15000, total: 3000000 },
    ]
  },
  {
    id: 'inv-02',
    invoiceNumber: 'INV-SPPG-2609-02',
    sppgName: 'SPPG Wargaluyu',
    date: '2026-09-19',
    dueDate: '2026-09-26',
    period: 'September 2026',
    subtotal: 18750000,
    cashbackCredit: 0,
    titipanAmount: 500000, // Titipan terpisah
    returAdjustment: 0,
    netTotal: 19250000,
    paidAmount: 12000000,
    status: 'PARTIAL',
    journalEntryNumber: 'JU-202609-004',
    notes: 'Pengiriman via armada 1 Paseh. Termasuk titipan bumbu olahan terpisah.',
    items: [
      { id: 'ii-05', description: 'Melon Orange MBG', category: 'BUAH', qty: 220, unit: 'kg', unitPrice: 18000, total: 3960000 },
      { id: 'ii-06', description: 'Wortel Brastagi Pilihan', category: 'SAYUR', qty: 150, unit: 'kg', unitPrice: 16000, total: 2400000 },
      { id: 'ii-07', description: 'Telur Ayam Ras Grade A', category: 'PROTEIN', qty: 320, unit: 'kg', unitPrice: 29000, total: 9280000 },
      { id: 'ii-08', description: 'Bawang Merah & Putih Kupas', category: 'BUMBU', qty: 75, unit: 'kg', unitPrice: 41467, total: 3110000 },
    ]
  },
  {
    id: 'inv-03',
    invoiceNumber: 'INV-SPPG-2609-03',
    sppgName: 'SPPG Kamal',
    date: '2026-09-20',
    dueDate: '2026-09-27',
    period: 'September 2026',
    subtotal: 12700000,
    cashbackCredit: 0,
    titipanAmount: 0,
    returAdjustment: 320000, // Retur wortel terpisah
    netTotal: 12380000,
    paidAmount: 0,
    status: 'UNPAID',
    journalEntryNumber: 'JU-202609-005',
    notes: 'Audit: retur 20 kg wortel telah dipotong dari kewajiban bayar.',
    items: [
      { id: 'ii-09', description: 'Semangka Non Biji Segar', category: 'BUAH', qty: 280, unit: 'kg', unitPrice: 12000, total: 3360000 },
      { id: 'ii-10', description: 'Wortel Lokal (Investigasi Kamal)', category: 'SAYUR', qty: 120, unit: 'kg', unitPrice: 16000, total: 1920000 },
      { id: 'ii-11', description: 'Ikan Nila Segar Bersih', category: 'PROTEIN', qty: 190, unit: 'kg', unitPrice: 39000, total: 7420000 },
    ]
  },
  {
    id: 'inv-04',
    invoiceNumber: 'INV-SPPG-2609-04',
    sppgName: 'SPPG Cimalaka',
    date: '2026-09-21',
    dueDate: '2026-09-28',
    period: 'September 2026',
    subtotal: 14500000,
    cashbackCredit: 0,
    titipanAmount: 1500000, // Titipan kemasan
    returAdjustment: 0,
    netTotal: 16000000,
    paidAmount: 16000000,
    status: 'PAID',
    journalEntryNumber: 'JU-202609-006',
    notes: 'Lunas via transfer Mandiri + titipan kas selesai',
    items: [
      { id: 'ii-12', description: 'Jeruk Medan Manis', category: 'BUAH', qty: 260, unit: 'kg', unitPrice: 22000, total: 5720000 },
      { id: 'ii-13', description: 'Tahu & Tempe Higienis', category: 'PROTEIN', qty: 400, unit: 'pcs', unitPrice: 3500, total: 1400000 },
      { id: 'ii-14', description: 'Daging Sapi Segar Rendang', category: 'PROTEIN', qty: 60, unit: 'kg', unitPrice: 123000, total: 7380000 },
    ]
  }
];

export const INITIAL_SUPPLIER_BILLS: SupplierBill[] = [
  {
    id: 'bill-01',
    billNumber: 'BILL-MANSUR-2609-01',
    supplierName: 'Mansur',
    date: '2026-09-18',
    dueDate: '2026-09-25',
    totalAmount: 14200000,
    paidAmount: 6000000,
    status: 'PARTIAL',
    journalEntryNumber: 'JU-202609-002',
    notes: 'Pasokan sayuran kebun & bumbu segar dari Mansur',
    items: [
      { id: 'bi-01', description: 'Wortel Lokal Super', category: 'SAYUR', qty: 350, unit: 'kg', unitPrice: 14000, total: 4900000 },
      { id: 'bi-02', description: 'Bawang Merah & Putih Lokal', category: 'BUMBU', qty: 250, unit: 'kg', unitPrice: 37200, total: 9300000 },
    ]
  },
  {
    id: 'bill-02',
    billNumber: 'BILL-ROYANA-2609-01',
    supplierName: 'Royana',
    date: '2026-09-19',
    dueDate: '2026-09-26',
    totalAmount: 11500000,
    paidAmount: 11500000,
    status: 'PAID',
    notes: 'Lunas via transfer Bank BRI - Irma Yulianti. Pasokan buah & pangan segar.',
    items: [
      { id: 'bi-03', description: 'Pisang Mulyo Grade A', category: 'BUAH', qty: 450, unit: 'kg', unitPrice: 13500, total: 6075000 },
      { id: 'bi-04', description: 'Melon Orange MBG', category: 'BUAH', qty: 320, unit: 'kg', unitPrice: 16953, total: 5425000 },
    ]
  },
  {
    id: 'bill-03',
    billNumber: 'BILL-HBS-2609-01',
    supplierName: 'HBS',
    date: '2026-09-20',
    dueDate: '2026-09-27',
    totalAmount: 12800000,
    paidAmount: 4000000,
    status: 'PARTIAL',
    notes: 'Pasokan protein unggas & daging beku higienis HBS',
    items: [
      { id: 'bi-05', description: 'Daging Ayam Fillet Segar', category: 'PROTEIN', qty: 180, unit: 'kg', unitPrice: 45000, total: 8100000 },
      { id: 'bi-06', description: 'Telur Ayam Ras Grade A', category: 'PROTEIN', qty: 175, unit: 'kg', unitPrice: 26857, total: 4700000 },
    ]
  },
  {
    id: 'bill-04',
    billNumber: 'BILL-ABR-2609-01',
    supplierName: 'PT ABR',
    date: '2026-09-21',
    dueDate: '2026-09-28',
    totalAmount: 10500000,
    paidAmount: 0,
    status: 'UNPAID',
    notes: 'Beras medium & sembako pokok dari PT ABR',
    items: [
      { id: 'bi-07', description: 'Beras Medium Premium', category: 'SEMBAKO DAN OLAHAN LAINNYA', qty: 650, unit: 'kg', unitPrice: 14500, total: 9425000 },
      { id: 'bi-08', description: 'Minyak Goreng Sawit Kemasan', category: 'SEMBAKO DAN OLAHAN LAINNYA', qty: 60, unit: 'liter', unitPrice: 17917, total: 1075000 },
    ]
  },
  {
    id: 'bill-05',
    billNumber: 'BILL-DRW-2609-01',
    supplierName: 'DRW',
    date: '2026-09-21',
    dueDate: '2026-09-29',
    totalAmount: 5600000,
    paidAmount: 0,
    status: 'UNPAID',
    notes: 'Bumbu olahan rempah & penyedap kemasan dari DRW',
    items: [
      { id: 'bi-09', description: 'Bumbu Rempah Segar Halus', category: 'BUMBU', qty: 140, unit: 'kg', unitPrice: 28000, total: 3920000 },
      { id: 'bi-10', description: 'Kecap & Garam Halus Beryodium', category: 'SEMBAKO DAN OLAHAN LAINNYA', qty: 120, unit: 'pack', unitPrice: 14000, total: 1680000 },
    ]
  },
  {
    id: 'bill-06',
    billNumber: 'BILL-BAHRUL-2609-01',
    supplierName: 'BAHRUL',
    date: '2026-09-21',
    dueDate: '2026-09-30',
    totalAmount: 4600000,
    paidAmount: 0,
    status: 'UNPAID',
    notes: 'Sayur daun hijau segar & cabai dari Bahrul',
    items: [
      { id: 'bi-11', description: 'Sayur Bayam & Kangkung Petik', category: 'SAYUR', qty: 600, unit: 'ikat', unitPrice: 3500, total: 2100000 },
      { id: 'bi-12', description: 'Cabai Merah Keriting & Rawit', category: 'BUMBU', qty: 50, unit: 'kg', unitPrice: 50000, total: 2500000 },
    ]
  }
];

export const INITIAL_CASHBACK_RECONCILIATION: CashbackReconciliationRecord[] = [
  {
    id: 'cb-01',
    sppg: 'SPPG Regol Wetan',
    period: 'September 2026',
    date: '2026-09-18',
    item: 'Pisang Mulyo',
    qty: 250,
    unit: 'kg',
    sppgPrice: 16000,
    realPrice: 13500,
    cashbackUnitDiff: 2500,
    totalCashback: 625000,
    titipanAmount: 0,
    returAmount: 0,
    accountingStatus: 'TERCATAT_PIUTANG',
    notes: 'Selisih harga Queen vs invoice SPPG (Rp 2.500/kg)'
  },
  {
    id: 'cb-02',
    sppg: 'SPPG Wargaluyu',
    period: 'September 2026',
    date: '2026-09-19',
    item: 'Melon Orange',
    qty: 220,
    unit: 'kg',
    sppgPrice: 18000,
    realPrice: 15500,
    cashbackUnitDiff: 2500,
    totalCashback: 550000,
    titipanAmount: 500000, // Terpisah
    returAmount: 0,
    accountingStatus: 'TERCATAT_PIUTANG',
    notes: 'Cashback Rp 550.000 murni; Titipan Rp 500.000 berdiri sendiri'
  },
  {
    id: 'cb-03',
    sppg: 'SPPG Kamal',
    period: 'September 2026',
    date: '2026-09-20',
    item: 'Wortel Brastagi',
    qty: 120,
    unit: 'kg',
    sppgPrice: 16000,
    realPrice: 13000,
    cashbackUnitDiff: 3000,
    totalCashback: 360000,
    titipanAmount: 0,
    returAmount: 320000, // Terpisah
    accountingStatus: 'TERCATAT_PIUTANG',
    notes: 'Investigasi wortel: Retur Rp 320.000 tidak boleh dipotongkan ke cashback'
  },
  {
    id: 'cb-04',
    sppg: 'SPPG Cimalaka',
    period: 'September 2026',
    date: '2026-09-21',
    item: 'Jeruk Medan',
    qty: 260,
    unit: 'kg',
    sppgPrice: 22000,
    realPrice: 19000,
    cashbackUnitDiff: 3000,
    totalCashback: 780000,
    titipanAmount: 1500000, // Terpisah
    returAmount: 0,
    accountingStatus: 'SUDAH_DIKREDIT',
    notes: 'Telah dikreditkan pada pelunasan invoice INV-SPPG-2609-04'
  }
];
