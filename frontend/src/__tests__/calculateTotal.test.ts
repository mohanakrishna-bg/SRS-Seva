/**
 * Regression Test Suite: Seva Booking — calculateTotal
 * 
 * This test extracts the core business logic from RegistrationModal
 * and tests it in isolation. This is the exact bug that was fixed:
 * string amounts from the API were being concatenated instead of added.
 * 
 * Covers:
 * - Base amount calculation (numeric and string inputs)
 * - Hastodaka (prasada) addon pricing
 * - Edge cases: no item, zero family members, toggling prasada
 */
import { describe, it, expect } from 'vitest';

// Extract the pure business logic from RegistrationModal.calculateTotal
// so we can test it without React rendering.
interface TestSevaItem {
    ItemCode?: string;
    Description: string;
    Amount?: number | string;
    Basic?: number | string;
    TPQty: number;
}

function calculateTotal(
    item: TestSevaItem | undefined,
    optPrasada: boolean,
    familyMembers: number,
    foodServiceRateStr: string
): number {
    if (!item) return 0;
    let total = parseFloat(String(item.Amount)) || parseFloat(String(item.Basic)) || 0;
    if (optPrasada) {
        total += familyMembers * (parseInt(foodServiceRateStr) || 0);
    }
    return total;
}

describe('calculateTotal — Seva Booking', () => {
    const baseItem: TestSevaItem = {
        ItemCode: 'SEVA001',
        Description: 'ಗಣಪತಿ ಹೋಮ',
        Amount: 200,
        TPQty: 1,
    };

    it('returns base amount when no prasada is opted', () => {
        expect(calculateTotal(baseItem, false, 0, '150')).toBe(200);
    });

    it('returns 0 when no item is selected', () => {
        expect(calculateTotal(undefined, false, 0, '150')).toBe(0);
    });

    // ──────────────────────────────────────────────
    // THE BUG: String amounts from API cause concatenation
    // ──────────────────────────────────────────────
    it('handles string Amount from API without concatenation', () => {
        const stringItem = { ...baseItem, Amount: '200.00' as any };
        const total = calculateTotal(stringItem, true, 2, '150');
        // Must be 200 + 2*150 = 500, NOT "200.00300"
        expect(total).toBe(500);
        expect(typeof total).toBe('number');
    });

    it('handles string Basic from API without concatenation', () => {
        const stringItem = { ...baseItem, Amount: undefined, Basic: '350' as any };
        const total = calculateTotal(stringItem, true, 1, '100');
        expect(total).toBe(450);
        expect(typeof total).toBe('number');
    });

    it('adds hastodaka correctly for 1 family member', () => {
        expect(calculateTotal(baseItem, true, 1, '150')).toBe(350);
    });

    it('adds hastodaka correctly for 5 family members', () => {
        expect(calculateTotal(baseItem, true, 5, '150')).toBe(950);
    });

    it('adds hastodaka correctly with different food rate', () => {
        expect(calculateTotal(baseItem, true, 2, '200')).toBe(600);
    });

    it('zero family members with prasada opted adds nothing extra', () => {
        expect(calculateTotal(baseItem, true, 0, '150')).toBe(200);
    });

    it('falls back to Basic when Amount is 0', () => {
        const item = { ...baseItem, Amount: 0, Basic: 100 };
        expect(calculateTotal(item, false, 0, '150')).toBe(100);
    });

    it('falls back to Basic when Amount is undefined', () => {
        const item = { ...baseItem, Amount: undefined, Basic: 100 };
        expect(calculateTotal(item, false, 0, '150')).toBe(100);
    });

    it('returns 0 when both Amount and Basic are undefined', () => {
        const item = { ...baseItem, Amount: undefined, Basic: undefined };
        expect(calculateTotal(item, false, 0, '150')).toBe(0);
    });

    it('handles NaN foodServiceRateStr gracefully', () => {
        expect(calculateTotal(baseItem, true, 2, 'abc')).toBe(200);
    });

    it('handles empty foodServiceRateStr gracefully', () => {
        expect(calculateTotal(baseItem, true, 2, '')).toBe(200);
    });
});
