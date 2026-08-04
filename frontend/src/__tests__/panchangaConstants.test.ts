/**
 * Regression Test Suite: Panchanga Constants
 * 
 * Ensures the GOTRAS and NAKSHATRAS lookup arrays remain intact
 * and are never accidentally truncated or corrupted during edits.
 */
import { describe, it, expect } from 'vitest';
import { GOTRAS, NAKSHATRAS } from '../constants/panchanga';

describe('GOTRAS constant', () => {
    it('has at least 7 traditional Saptarishi gotras', () => {
        // The 7 primary Rishis must always be present
        const primary = ['Angirasa', 'Atri', 'Bharadvaja', 'Bhrigu', 'Gautama', 'Kashyapa', 'Vasistha'];
        for (const gotra of primary) {
            expect(GOTRAS.find(g => g.en === gotra)).toBeDefined();
        }
    });

    it('has matching en/kn pairs for every entry', () => {
        for (const gotra of GOTRAS) {
            expect(gotra.en).toBeTruthy();
            expect(gotra.kn).toBeTruthy();
            // Kannada text should contain Kannada characters
            expect(/[\u0C80-\u0CFF]/.test(gotra.kn)).toBe(true);
            // English text should not contain Kannada characters
            expect(/[\u0C80-\u0CFF]/.test(gotra.en)).toBe(false);
        }
    });

    it('has no duplicate entries', () => {
        const enNames = GOTRAS.map(g => g.en);
        const uniqueEnNames = [...new Set(enNames)];
        expect(enNames.length).toBe(uniqueEnNames.length);
    });
});

describe('NAKSHATRAS constant', () => {
    it('has exactly 27 nakshatras', () => {
        expect(NAKSHATRAS).toHaveLength(27);
    });

    it('starts with Ashvini and ends with Revati', () => {
        expect(NAKSHATRAS[0].en).toBe('Ashvini');
        expect(NAKSHATRAS[26].en).toBe('Revati');
    });

    it('has matching en/kn pairs for every entry', () => {
        for (const nak of NAKSHATRAS) {
            expect(nak.en).toBeTruthy();
            expect(nak.kn).toBeTruthy();
            expect(/[\u0C80-\u0CFF]/.test(nak.kn)).toBe(true);
            expect(/[\u0C80-\u0CFF]/.test(nak.en)).toBe(false);
        }
    });

    it('has no duplicate entries', () => {
        const enNames = NAKSHATRAS.map(n => n.en);
        const uniqueEnNames = [...new Set(enNames)];
        expect(enNames.length).toBe(uniqueEnNames.length);
    });
});
