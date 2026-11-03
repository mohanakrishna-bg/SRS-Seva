import { describe, it, expect, beforeEach } from 'vitest';
import {
    isThursday,
    isNearPoornima,
    isNearAradhana,
    isDhanurmasa,
    computeDailyQuickPicks,
    getDailyQuickPicks,
    formatIsoDate,
} from '../services/dynamicQuickPicks';

describe('Dynamic Daily Quick-Picks Service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('correctly detects Thursdays', () => {
        // 2026-11-05 is Thursday
        const thursday = new Date(2026, 10, 5);
        expect(isThursday(thursday)).toBe(true);

        // 2026-11-06 is Friday
        const friday = new Date(2026, 10, 6);
        expect(isThursday(friday)).toBe(false);
    });

    it('prioritizes Taila Deepa Aarati and Rathotsava on Thursdays', () => {
        const thursday = new Date(2026, 10, 5); // Nov 5, 2026 is Thursday
        const result = computeDailyQuickPicks(thursday);

        expect(result.codes).toContain('S015'); // Taila Deepa Aarati
        expect(result.codes).toContain('S013'); // Rathotsava
        expect(result.reasonKn).toContain('ಗುರುವಾರ ವಿಶೇಷ');
        expect(result.codes.length).toBe(6);
    });

    it('detects Poornima and elevates Satyanarayana Pooja', () => {
        // 2026-04-02 is Chitra Purnima
        const purnima = new Date(2026, 3, 2);
        expect(isNearPoornima(purnima)).toBe(true);

        const result = computeDailyQuickPicks(purnima);
        expect(result.codes).toContain('S008'); // Satyanarayana Samuhika
        expect(result.codes).toContain('S010'); // Satyanarayana Pratyeka
        expect(result.reasonKn).toContain('ಹುಣ್ಣಿಮೆ ಸತ್ಯನಾರಾಯಣ ಪೂಜೆ');
    });

    it('detects Rayaru Aradhana window and elevates Aradhana sevas', () => {
        // 2026-08-30 is Madhyaradhana
        const aradhanaDay = new Date(2026, 7, 30);
        expect(isNearAradhana(aradhanaDay)).toBe(true);

        const result = computeDailyQuickPicks(aradhanaDay);
        expect(result.codes).toContain('SV051'); // Aaradhana Kanakabhisheka
        expect(result.codes).toContain('SV052'); // Aaradhana Pada Pooja
        expect(result.reasonKn).toContain('ಆರಾಧನಾ ಮಹೋತ್ಸವ');
    });

    it('detects Dhanurmasa and elevates Pongal sevas', () => {
        // Dec 25 is Dhanurmasa
        const dhanurmasaDay = new Date(2026, 11, 25);
        expect(isDhanurmasa(dhanurmasaDay)).toBe(true);

        const result = computeDailyQuickPicks(dhanurmasaDay);
        expect(result.codes).toContain('S012'); // Sihi Pongal
        expect(result.codes).toContain('S011'); // Khara Pongal
        expect(result.reasonKn).toContain('ಧನುರ್ಮಾಸ ಪೂಜೆ');
    });

    it('adapts to recent booking frequency spikes', () => {
        // A standard date with custom high-frequency bookings for Two-Wheeler (S016)
        const regularDay = new Date(2026, 5, 10); // June 10, 2026 (Wednesday)
        const recent = ['S016', 'S016', 'S016', 'S001', 'S001'];

        const result = computeDailyQuickPicks(regularDay, recent);
        expect(result.codes[0]).toBe('S016'); // S016 was booked 3 times
        expect(result.codes[1]).toBe('S001'); // S001 was booked 2 times
        expect(result.codes.length).toBe(6);
    });

    it('freezes daily evaluation in localStorage for the day', () => {
        const testDate = new Date(2026, 10, 5);
        const iso = formatIsoDate(testDate);

        // First call evaluates and saves to localStorage
        const res1 = getDailyQuickPicks(testDate);
        expect(res1.codes.length).toBe(6);
        expect(localStorage.getItem(`srs_daily_quick_picks_${iso}`)).not.toBeNull();

        // Mutate localStorage to test that cached copy is returned (zero recalculation)
        const mockPicks = {
            codes: ['TEST_1', 'TEST_2'],
            reasonKn: 'ಫ್ರೋಜನ್',
            reasonEn: 'Frozen',
            date: iso,
        };
        localStorage.setItem(`srs_daily_quick_picks_${iso}`, JSON.stringify(mockPicks));

        const res2 = getDailyQuickPicks(testDate);
        expect(res2.codes).toEqual(['TEST_1', 'TEST_2']);
        expect(res2.reasonKn).toBe('ಫ್ರೋಜನ್');
    });
});
