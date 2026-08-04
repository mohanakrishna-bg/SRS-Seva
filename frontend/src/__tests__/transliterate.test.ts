/**
 * Regression Test Suite: Transliteration Utilities
 * 
 * Covers:
 * - Kannada numeral conversion (convertKnNumeralsToEn)
 * - Kannada detection (isKannada)
 * - Kannada-to-English transliteration (transliterateKnToEn)
 */
import { describe, it, expect } from 'vitest';
import { convertKnNumeralsToEn, isKannada, transliterateKnToEn } from '../transliterate';

describe('convertKnNumeralsToEn', () => {
    it('converts Kannada digits to English digits', () => {
        expect(convertKnNumeralsToEn('೧೨೩೪೫೬೭೮೯೦')).toBe('1234567890');
    });

    it('leaves English digits untouched', () => {
        expect(convertKnNumeralsToEn('1234567890')).toBe('1234567890');
    });

    it('handles mixed Kannada digits and English text', () => {
        expect(convertKnNumeralsToEn('Phone: ೯೮೮೦೧೨೩೪೫೬')).toBe('Phone: 9880123456');
    });

    it('returns empty string for empty input', () => {
        expect(convertKnNumeralsToEn('')).toBe('');
    });

    it('returns the original if no Kannada numerals are present', () => {
        expect(convertKnNumeralsToEn('Hello World')).toBe('Hello World');
    });

    it('handles null/undefined gracefully', () => {
        // The function checks `if (!text) return text;`
        expect(convertKnNumeralsToEn(null as any)).toBe(null);
        expect(convertKnNumeralsToEn(undefined as any)).toBe(undefined);
    });
});

describe('isKannada', () => {
    it('returns true for Kannada text', () => {
        expect(isKannada('ಹೆಸರು')).toBe(true);
    });

    it('returns false for English text', () => {
        expect(isKannada('Hello')).toBe(false);
    });

    it('returns true for mixed text containing Kannada characters', () => {
        expect(isKannada('Name: ಹೆಸರು')).toBe(true);
    });

    it('returns false for empty string', () => {
        expect(isKannada('')).toBe(false);
    });

    it('returns false for numbers-only string', () => {
        expect(isKannada('12345')).toBe(false);
    });
});

describe('transliterateKnToEn', () => {
    it('returns input unchanged if no Kannada characters', () => {
        expect(transliterateKnToEn('Hello World')).toBe('Hello World');
    });

    it('returns empty/null input unchanged', () => {
        expect(transliterateKnToEn('')).toBe('');
    });

    it('transliterates known dictionary words', () => {
        const result = transliterateKnToEn('ಶ್ರೀ');
        expect(result).toBe('Shree');
    });

    it('transliterates the word for Temple', () => {
        const result = transliterateKnToEn('ದೇವಸ್ಥಾನ');
        expect(result).toBe('Temple');
    });
});
