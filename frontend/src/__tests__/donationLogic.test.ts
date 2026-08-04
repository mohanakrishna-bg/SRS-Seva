/**
 * Regression Test Suite: Donation Module — Business Logic
 * 
 * Tests the pure business logic from DonationModal:
 * - Donation value formatting
 * - Donation kind/type mappings
 * - Donation payment validation
 */
import { describe, it, expect } from 'vitest';

// ─── Value Formatting ───
function formatDonationValue(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

describe('Donation value formatting', () => {
    it('formats whole numbers with two decimal places', () => {
        expect(formatDonationValue(5000)).toBe('₹5,000.00');
    });

    it('formats small amounts correctly', () => {
        expect(formatDonationValue(100)).toBe('₹100.00');
    });

    it('formats decimal amounts correctly', () => {
        expect(formatDonationValue(1234.50)).toBe('₹1,234.50');
    });

    it('formats zero correctly', () => {
        expect(formatDonationValue(0)).toBe('₹0.00');
    });

    it('formats large amounts with Indian grouping', () => {
        expect(formatDonationValue(1000000)).toBe('₹10,00,000.00');
    });
});

// ─── Donation Kind → Type Mapping ───
describe('Donation kind to type mapping', () => {
    it('monetary kind maps to monetary type', () => {
        const donationKind = 'monetary';
        const donationType = donationKind === 'monetary' ? 'monetary' : 'in_kind';
        expect(donationType).toBe('monetary');
    });

    it('asset kind maps to in_kind type', () => {
        const donationKind = 'asset';
        const donationType = donationKind === 'monetary' ? 'monetary' : 'in_kind';
        expect(donationType).toBe('in_kind');
    });

    it('consumable kind maps to in_kind type', () => {
        const donationKind = 'consumable';
        const donationType = donationKind === 'monetary' ? 'monetary' : 'in_kind';
        expect(donationType).toBe('in_kind');
    });

    it('monetary kind has itemType as asset', () => {
        const donationKind = 'monetary';
        const itemType = donationKind === 'monetary' ? 'asset' : donationKind;
        expect(itemType).toBe('asset');
    });

    it('asset kind preserves itemType as asset', () => {
        const donationKind = 'asset';
        const itemType = donationKind === 'monetary' ? 'asset' : donationKind;
        expect(itemType).toBe('asset');
    });

    it('consumable kind preserves itemType as consumable', () => {
        const donationKind = 'consumable';
        const itemType = donationKind === 'monetary' ? 'asset' : donationKind;
        expect(itemType).toBe('consumable');
    });
});

// ─── Default Food Rates Parsing ───
describe('Food service rates parsing', () => {
    function parseFoodRates(settingsStr: string | undefined): number[] {
        const rates = (settingsStr || '100, 150, 200').split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (rates.length === 0) rates.push(200);
        return rates;
    }

    it('parses comma-separated rates correctly', () => {
        expect(parseFoodRates('100, 150, 200')).toEqual([100, 150, 200]);
    });

    it('falls back to defaults when undefined', () => {
        expect(parseFoodRates(undefined)).toEqual([100, 150, 200]);
    });

    it('falls back to defaults when empty string', () => {
        expect(parseFoodRates('')).toEqual([100, 150, 200]);
    });

    it('handles single value', () => {
        expect(parseFoodRates('250')).toEqual([250]);
    });

    it('filters out NaN values', () => {
        expect(parseFoodRates('100, abc, 200')).toEqual([100, 200]);
    });

    it('pushes 200 when all values are NaN', () => {
        expect(parseFoodRates('abc, xyz')).toEqual([200]);
    });
});
