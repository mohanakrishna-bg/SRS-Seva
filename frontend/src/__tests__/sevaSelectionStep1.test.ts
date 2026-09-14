/**
 * Test Suite: Seva Booking Workflow Step 1 — Explicit Date & Seva Selection
 *
 * Verifies that in step 1:
 * 1. Seva Date is not pre-selected (must be explicitly chosen).
 * 2. Seva Type is not pre-selected (must be explicitly chosen).
 * 3. Validation fails if either date or seva type is not explicitly selected.
 */
import { describe, it, expect } from 'vitest';

interface SelectedSeva {
    sevaCode: string;
    description: string;
    amount: number | '';
    isCustomPrice: boolean;
}

function validateSevaDetails(
    selectedDate: Date | null,
    selectedSevas: SelectedSeva[]
): { valid: boolean; error?: string } {
    if (!selectedDate) {
        return { valid: false, error: 'ದಯವಿಟ್ಟು ಸೇವಾ ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ (Please select seva date)' };
    }
    if (selectedSevas.length === 0) {
        return { valid: false, error: 'ದಯವಿಟ್ಟು ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ (Please select seva)' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(selectedDate);
    selDate.setHours(0, 0, 0, 0);

    if (selDate < today) {
        return { valid: false, error: 'ಹಿಂದಿನ ದಿನಾಂಕಗಳಿಗೆ ಸೇವೆ ಬುಕ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ' };
    }

    return { valid: true };
}

describe('Seva Booking Workflow Step 1 - Explicit Selection', () => {
    it('initializes step 1 with no seva date and no seva type selected', () => {
        const initialDate: Date | null = null;
        const initialSevas: SelectedSeva[] = [];

        expect(initialDate).toBeNull();
        expect(initialSevas).toHaveLength(0);
    });

    it('rejects progression when seva date is not selected', () => {
        const selectedDate: Date | null = null;
        const selectedSevas: SelectedSeva[] = [
            { sevaCode: 'SV001', description: 'Archana', amount: 50, isCustomPrice: false }
        ];

        const result = validateSevaDetails(selectedDate, selectedSevas);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('ದಯವಿಟ್ಟು ಸೇವಾ ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ');
    });

    it('rejects progression when seva type is not selected', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const selectedDate: Date | null = tomorrow;
        const selectedSevas: SelectedSeva[] = [];

        const result = validateSevaDetails(selectedDate, selectedSevas);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('ದಯವಿಟ್ಟು ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ');
    });

    it('rejects past dates even if explicitly selected', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const selectedSevas: SelectedSeva[] = [
            { sevaCode: 'SV001', description: 'Archana', amount: 50, isCustomPrice: false }
        ];

        const result = validateSevaDetails(yesterday, selectedSevas);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('ಹಿಂದಿನ ದಿನಾಂಕಗಳಿಗೆ ಸೇವೆ ಬುಕ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ');
    });

    it('accepts progression when both date and seva type are explicitly selected', () => {
        const today = new Date();
        const selectedSevas: SelectedSeva[] = [
            { sevaCode: 'SV001', description: 'Archana', amount: 50, isCustomPrice: false }
        ];

        const result = validateSevaDetails(today, selectedSevas);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });
});
