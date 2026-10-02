/**
 * Regression Test Suite: Seva Booking — calculateTotal
 * 
 * Verifies that the canonical domain calculation module `calculateBookingTotal`
 * correctly calculates base amounts and Hastodaka addons without string concatenation bugs.
 */
import { describe, it, expect } from 'vitest';
import { calculateBookingTotal, type SevaCatalogItem } from '../domain/booking';

describe('calculateTotal — Seva Booking', () => {
    const baseItem: SevaCatalogItem = {
        ItemCode: 'SEVA001',
        Description: 'ಗಣಪತಿ ಹೋಮ',
        Amount: 200,
        TPQty: 1,
    };

    it('returns base amount when no prasada is opted', () => {
        expect(calculateBookingTotal(baseItem, false, 0, '150')).toBe(200);
    });

    it('returns 0 when no item is selected', () => {
        expect(calculateBookingTotal(undefined, false, 0, '150')).toBe(0);
    });

    // ──────────────────────────────────────────────
    // THE BUG: String amounts from API cause concatenation
    // ──────────────────────────────────────────────
    it('handles string Amount from API without concatenation', () => {
        const stringItem = { ...baseItem, Amount: '200.00' as any };
        const total = calculateBookingTotal(stringItem, true, 2, '150');
        // Must be 200 + 2*150 = 500, NOT "200.00300"
        expect(total).toBe(500);
        expect(typeof total).toBe('number');
    });

    it('handles string Basic from API without concatenation', () => {
        const stringItem = { ...baseItem, Amount: undefined, Basic: '350' as any };
        const total = calculateBookingTotal(stringItem, true, 1, '100');
        expect(total).toBe(450);
        expect(typeof total).toBe('number');
    });

    it('adds hastodaka correctly for 1 family member', () => {
        expect(calculateBookingTotal(baseItem, true, 1, '150')).toBe(350);
    });

    it('adds hastodaka correctly for 5 family members', () => {
        expect(calculateBookingTotal(baseItem, true, 5, '150')).toBe(950);
    });

    it('adds hastodaka correctly with different food rate', () => {
        expect(calculateBookingTotal(baseItem, true, 2, '200')).toBe(600);
    });

    it('zero family members with prasada opted adds nothing extra', () => {
        expect(calculateBookingTotal(baseItem, true, 0, '150')).toBe(200);
    });

    it('falls back to Basic when Amount is 0', () => {
        const item = { ...baseItem, Amount: 0, Basic: 100 };
        expect(calculateBookingTotal(item, false, 0, '150')).toBe(100);
    });

    it('falls back to Basic when Amount is undefined', () => {
        const item = { ...baseItem, Amount: undefined, Basic: 100 };
        expect(calculateBookingTotal(item, false, 0, '150')).toBe(100);
    });

    it('returns 0 when both Amount and Basic are undefined', () => {
        const item = { ...baseItem, Amount: undefined, Basic: undefined };
        expect(calculateBookingTotal(item, false, 0, '150')).toBe(0);
    });

    it('handles NaN foodServiceRateStr gracefully', () => {
        expect(calculateBookingTotal(baseItem, true, 2, 'abc')).toBe(200);
    });

    it('handles empty foodServiceRateStr gracefully', () => {
        expect(calculateBookingTotal(baseItem, true, 2, '')).toBe(200);
    });
});
