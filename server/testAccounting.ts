import { AccountingService } from './accountingService';
import { verifyPassword, hashPassword } from './types';
import { dbStore } from './db';

console.log('--- 1. Testing Password Hashing & Verification ---');
const pass = 'superSecret2026!';
const hashed = hashPassword(pass);
console.assert(verifyPassword(pass, hashed) === true, 'Verification should succeed for correct password');
console.assert(verifyPassword('wrong', hashed) === false, 'Verification should fail for incorrect password');
console.log('✓ Password hashing verification passed');

console.log('--- 2. Testing Double-Entry Balanced Journal ---');
try {
  AccountingService.validateBalancedJournal([
    { id: '1', accountCode: '1-1100', accountName: 'Kas', debit: 1000000, credit: 0 },
    { id: '2', accountCode: '4-1100', accountName: 'Pendapatan', debit: 0, credit: 1000000 },
  ]);
  console.log('✓ Balanced journal validated successfully');
} catch (e: any) {
  console.error('Failed balanced journal test:', e.message);
  process.exit(1);
}

try {
  AccountingService.validateBalancedJournal([
    { id: '1', accountCode: '1-1100', accountName: 'Kas', debit: 1000000, credit: 0 },
    { id: '2', accountCode: '4-1100', accountName: 'Pendapatan', debit: 0, credit: 900000 },
  ]);
  console.error('Unbalanced journal should have thrown error');
  process.exit(1);
} catch (e: any) {
  console.log('✓ Unbalanced journal correctly rejected:', e.message);
}

console.log('--- 3. Testing Dynamic Numbering ---');
const date = '2026-09-24';
const invNum = AccountingService.generateInvoiceNumber(date);
const billNum = AccountingService.generateBillNumber('Queen Food Nusantara', date);
const journalNum = AccountingService.generateJournalNumber(date);

console.assert(invNum.startsWith('INV-SPPG-2609-'), `Invoice number should match prefix, got: ${invNum}`);
console.assert(billNum.startsWith('BILL-QUEEN-2609-'), `Bill number should match prefix, got: ${billNum}`);
console.assert(journalNum.startsWith('JU-202609-'), `Journal number should match prefix, got: ${journalNum}`);
console.log(`✓ Numbering generated: ${invNum}, ${billNum}, ${journalNum}`);

console.log('--- 4. Testing Period Validation ---');
try {
  const period = AccountingService.validatePeriod('per-2026-09');
  console.log(`✓ Period '${period.name}' status: ${period.status}`);
} catch (e: any) {
  console.error('Failed period test:', e.message);
  process.exit(1);
}

console.log('============================================');
console.log('ALL INTEGRITY & ACCOUNTING UNIT TESTS PASSED');
console.log('============================================');
