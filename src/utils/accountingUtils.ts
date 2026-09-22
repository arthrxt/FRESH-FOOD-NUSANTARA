// Utility Akuntansi & Format Angka Indonesia
// Fresh Food Nusantara Standards

/**
 * Format mata uang Rupiah standar Indonesia
 * Contoh: 1500000 -> "Rp 1.500.000"
 * Contoh: 12500.5 -> "Rp 12.500,50"
 */
export function formatRupiah(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  let formatted = '';
  if (showDecimals && absAmount % 1 !== 0) {
    const parts = absAmount.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1];
    formatted = `${integerPart},${decimalPart}`;
  } else {
    formatted = Math.round(absAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  
  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format angka umum Indonesia (. ribuan, , desimal)
 * Contoh: 2190 -> "2.190", 0.5 -> "0,5"
 */
export function formatNumberID(num: number, maxDecimals: number = 2): string {
  if (isNaN(num) || num === null || num === undefined) return '0';
  
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  // Format desimal koma jika ada
  if (absNum % 1 !== 0) {
    const str = absNum.toFixed(maxDecimals);
    const cleanStr = parseFloat(str).toString(); // buang trailing zero yang tidak perlu
    const parts = cleanStr.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1] || '';
    const res = decimalPart ? `${integerPart},${decimalPart}` : integerPart;
    return isNegative ? `-${res}` : res;
  }
  
  const res = absNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNegative ? `-${res}` : res;
}

/**
 * Parsing string angka Indonesia ke number
 * Mengubah "2.190,5" -> 2190.5 atau "2.190" -> 2190
 */
export function parseNumberID(input: string | number): number {
  if (typeof input === 'number') return input;
  if (!input) return 0;
  
  const cleaned = input
    .toString()
    .trim()
    .replace(/^Rp\s?/i, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')       // hapus titik ribuan
    .replace(/,/g, '.');      // ubah koma desimal ke titik standar float
    
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/**
 * Format tanggal Indonesia (misal "21 Sep 2026")
 */
export function formatDateID(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const monthIdx = parseInt(m, 10) - 1;
    return `${parseInt(d, 10)} ${months[monthIdx] || m} ${y}`;
  } catch {
    return dateStr;
  }
}
