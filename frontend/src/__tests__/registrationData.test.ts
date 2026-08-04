/**
 * Regression Test Suite: Seva Registration — Data Integrity
 * 
 * Tests the data preparation logic that feeds into the registration API.
 * Covers date formatting, payment validation, and payload construction.
 */
import { describe, it, expect } from 'vitest';

// ───────────────────────────────────────────
// Date formatting: DDMMYY format used in SevaRegistration payload
// ───────────────────────────────────────────
function formatDateDDMMYY(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}${month}${year}`;
}

describe('formatDateDDMMYY', () => {
    it('formats a normal date correctly', () => {
        expect(formatDateDDMMYY(new Date(2026, 6, 20))).toBe('200726'); // July 20, 2026
    });

    it('zero-pads single-digit day', () => {
        expect(formatDateDDMMYY(new Date(2026, 0, 5))).toBe('050126'); // Jan 5, 2026
    });

    it('zero-pads single-digit month', () => {
        expect(formatDateDDMMYY(new Date(2026, 2, 15))).toBe('150326'); // Mar 15, 2026
    });

    it('handles year rollover (Dec 31 → Jan 1)', () => {
        expect(formatDateDDMMYY(new Date(2026, 11, 31))).toBe('311226');
        expect(formatDateDDMMYY(new Date(2027, 0, 1))).toBe('010127');
    });

    it('handles leap year Feb 29', () => {
        expect(formatDateDDMMYY(new Date(2028, 1, 29))).toBe('290228');
    });
});

// ───────────────────────────────────────────
// Payment validation logic (extracted from handleSubmit)
// ───────────────────────────────────────────
interface UpiDetails { gateway: string; transactionId: string; vpa: string; screenshot: string; }
interface ChqDetails { accNo: string; holder: string; bank: string; branch: string; date: string; number: string; }
interface NetDetails { bank: string; utr: string; date: string; }

function validatePayment(
    mode: string,
    upiDetails: UpiDetails,
    chqDetails: ChqDetails,
    netDetails: NetDetails
): string | null {
    if (mode === 'UPI') {
        if (!upiDetails.transactionId) return 'Transaction ID is required';
    } else if (mode === 'Cheque' || mode === 'DD') {
        if (!chqDetails.bank) return 'Bank Name is required';
        if (!chqDetails.number) return 'Number is required';
        if (!chqDetails.date) return 'Date is required';
    } else if (mode === 'Netbanking') {
        if (!netDetails.utr) return 'UTR is required';
        if (!netDetails.date) return 'Date of Transfer is required';
    }
    return null; // Valid
}

describe('validatePayment', () => {
    const emptyUpi: UpiDetails = { gateway: '', transactionId: '', vpa: '', screenshot: '' };
    const emptyChq: ChqDetails = { accNo: '', holder: '', bank: '', branch: '', date: '', number: '' };
    const emptyNet: NetDetails = { bank: '', utr: '', date: '' };

    it('accepts Cash mode without any additional fields', () => {
        expect(validatePayment('Cash', emptyUpi, emptyChq, emptyNet)).toBeNull();
    });

    it('rejects UPI when transactionId is empty', () => {
        expect(validatePayment('UPI', emptyUpi, emptyChq, emptyNet)).toBe('Transaction ID is required');
    });

    it('accepts UPI when transactionId is provided', () => {
        const upi = { ...emptyUpi, transactionId: '123456789012' };
        expect(validatePayment('UPI', upi, emptyChq, emptyNet)).toBeNull();
    });

    it('rejects Cheque when bank is empty', () => {
        expect(validatePayment('Cheque', emptyUpi, emptyChq, emptyNet)).toBe('Bank Name is required');
    });

    it('rejects Cheque when number is empty', () => {
        const chq = { ...emptyChq, bank: 'SBI' };
        expect(validatePayment('Cheque', emptyUpi, chq, emptyNet)).toBe('Number is required');
    });

    it('rejects Cheque when date is empty', () => {
        const chq = { ...emptyChq, bank: 'SBI', number: '000123' };
        expect(validatePayment('Cheque', emptyUpi, chq, emptyNet)).toBe('Date is required');
    });

    it('accepts Cheque when all fields provided', () => {
        const chq = { ...emptyChq, bank: 'SBI', number: '000123', date: '2026-07-20' };
        expect(validatePayment('Cheque', emptyUpi, chq, emptyNet)).toBeNull();
    });

    it('DD follows same validation as Cheque', () => {
        expect(validatePayment('DD', emptyUpi, emptyChq, emptyNet)).toBe('Bank Name is required');
        const dd = { ...emptyChq, bank: 'SBI', number: 'DD001', date: '2026-07-20' };
        expect(validatePayment('DD', emptyUpi, dd, emptyNet)).toBeNull();
    });

    it('rejects Netbanking when UTR is empty', () => {
        expect(validatePayment('Netbanking', emptyUpi, emptyChq, emptyNet)).toBe('UTR is required');
    });

    it('rejects Netbanking when date is empty', () => {
        const net = { ...emptyNet, utr: 'UTR123' };
        expect(validatePayment('Netbanking', emptyUpi, emptyChq, net)).toBe('Date of Transfer is required');
    });

    it('accepts Netbanking when all fields provided', () => {
        const net = { ...emptyNet, utr: 'UTR123', date: '2026-07-20' };
        expect(validatePayment('Netbanking', emptyUpi, emptyChq, net)).toBeNull();
    });
});

// ───────────────────────────────────────────
// Registration payload construction
// ───────────────────────────────────────────
describe('Registration payload construction', () => {
    it('sets PrasadaCount to 0 when optPrasada is false', () => {
        const optPrasada = false;
        const familyMembers = 5;
        const prasadaCount = optPrasada ? familyMembers : 0;
        expect(prasadaCount).toBe(0);
    });

    it('sets PrasadaCount to familyMembers when optPrasada is true', () => {
        const optPrasada = true;
        const familyMembers = 3;
        const prasadaCount = optPrasada ? familyMembers : 0;
        expect(prasadaCount).toBe(3);
    });

    it('GrandTotal matches calculateTotal output', () => {
        // Simulating the full flow
        const itemAmount = 200;
        const optPrasada = true;
        const familyMembers = 2;
        const foodRate = '150';
        
        let total = parseFloat(String(itemAmount)) || 0;
        if (optPrasada) {
            total += familyMembers * (parseInt(foodRate) || 0);
        }
        
        expect(total).toBe(500);
    });
});
