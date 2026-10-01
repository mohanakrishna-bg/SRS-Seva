import { describe, it, expect } from 'vitest';
import {
    getPanchangaForDate,
    getPanchangaMetadata,
    getPanchangaTableOfContents,
    getAnnualFestivals,
    getRayaruAradhanaSaptaha,
    getPanchangaPdfUrl,
    formatPanchangaEndTime,
    formatShraddhaTithi,
    toIsoDateString,
    loadPanchangaData,
} from '../services/panchangaService';

describe('Panchanga PDF Integration Service', () => {
    it('provides valid metadata for Sri Parabhava Nama Samvatsara', () => {
        const meta = getPanchangaMetadata();
        expect(meta.titleKn).toContain('ಪರಾಭವ ನಾಮ ಸಂವತ್ಸರ ಸೂರ್ಯಸಿದ್ಧಾಂತ ಪಂಚಾಂಗ');
        expect(meta.shakaYear).toBe(1948);
        expect(meta.kaliYear).toBe(5127);
        expect(meta.totalDays).toBe(385);
        expect(meta.pdfUrl).toBe('/documents/panchanga_parabhava_2026_27.pdf');
    });

    it('provides table of contents matching the PDF Parividi', () => {
        const toc = getPanchangaTableOfContents();
        expect(toc.length).toBe(15);
        expect(toc[0].titleKn).toBe('ಪಂಚಾಂಗ ಪೀಠಿಕಾ');
        expect(toc[0].page).toBe(9);
        expect(toc[4].titleKn).toBe('ಶ್ರೀ ಪರಾಭವ ಸಂವತ್ಸರ ಹಬ್ಬಗಳು');
        expect(toc[4].page).toBe(14);
        expect(toc[9].titleKn).toContain('ಮಾಸಿಕ ಪಂಚಾಂಗ');
        expect(toc[9].page).toBe(24);
    });

    it('returns exact authentic PDF data for today (2026-09-29)', async () => {
        const todayDate = new Date(2026, 8, 29); // September 29, 2026
        const p = await getPanchangaForDate(todayDate);
        expect(p.source).toBe('pdf_surya_siddhanta');
        expect(p.date).toBe('2026-09-29');
        expect(p.dayOfWeek).toBe('ಮಂಗಳವಾರ');
        expect(p.samvatsara).toBe('ಶ್ರೀ ಪರಾಭವ ನಾಮ ಸಂವತ್ಸರ');
        expect(p.masa).toBe('ಭಾದ್ರಪದ ಮಾಸ');
        expect(p.paksha).toBe('ಕೃಷ್ಣ ಪಕ್ಷ');
        expect(p.tithi).toBe('ತೃತೀಯಾ');
        expect(p.nakshatra).toBe('ಅಶ್ವಿನಿ');
        expect(p.yoga).toBe('ವ್ಯಾಗಾತ');
        expect(p.karana).toBe('ವಣಿಜ');
        expect(p.sunrise).toBe('06:13');
        expect(p.dinamana).toBe('29:51');
        expect(p.dharmashastra).toContain('ಸಂಕಷ್ಟಚತುರ್ಥಿ');
        expect(p.dharmashastra).toContain('ಮಹಾಭರಣಿ ಶ್ರಾದ್ಧ');
        expect(p.shraddhaTithi).toBe('ತೃತೀ');
        expect(p.shraddhaTithiExpanded).toBe('ತೃತೀಯಾ');
        expect(p.pdfPage).toBe(37);
    });

    it('returns exact authentic PDF data for Yugadi (2026-03-19)', async () => {
        const yugadiDate = new Date(2026, 2, 19); // March 19, 2026
        const p = await getPanchangaForDate(yugadiDate);
        expect(p.source).toBe('pdf_surya_siddhanta');
        expect(p.tithi).toBe('ಪ್ರತಿಪದೆ');
        expect(p.nakshatra).toBe('ಉತ್ತರಾಭಾದ್ರಪದಾ');
        expect(p.masa).toBe('ಚೈತ್ರ ಮಾಸ');
        expect(p.paksha).toBe('ಶುಕ್ಲ ಪಕ್ಷ');
        expect(p.dharmashastra).toContain('ಚಾಂದ್ರಯುಗಾದಿ');
        expect(p.shraddhaTithi).toBe('ಪ್ರತಿ');
        expect(p.shraddhaTithiExpanded).toBe('ಪ್ರತಿಪದೆ');
        expect(p.pdfPage).toBe(24);
    });

    it('returns exact authentic PDF data for Rayaru Madhyaradhana (2026-08-30)', async () => {
        const aradhanaDate = new Date(2026, 7, 30); // August 30, 2026
        const p = await getPanchangaForDate(aradhanaDate);
        expect(p.source).toBe('pdf_surya_siddhanta');
        expect(p.dharmashastra).toContain('ಮಧ್ಯಾರಾಧನಾ');
        expect(p.pdfPage).toBe(35);
    });

    it('accurately handles Ekadashi days with Shraddhabhava', async () => {
        const ekadashi1 = await getPanchangaForDate('2026-06-11');
        expect(ekadashi1.dharmashastra).toContain('ಸರ್ವೇಷಾಮೇಕಾದಶೀ');
        expect(ekadashi1.shraddhaTithi).toBe('ಶ್ರಾದ್ಧಾಭಾವ');
        expect(ekadashi1.shraddhaTithiExpanded).toBe('ಶ್ರಾದ್ಧವಿಲ್ಲ (ಶ್ರಾದ್ಧಾಭಾವ)');

        const ekadashi2 = await getPanchangaForDate('2027-04-02');
        expect(ekadashi2.dharmashastra).toContain('ಸರ್ವೇಷಾಮೇಕಾದಶೀ');
        expect(ekadashi2.shraddhaTithi).toBe('ಶ್ರಾದ್ಧಾಭಾವ');
        expect(ekadashi2.shraddhaTithiExpanded).toBe('ಶ್ರಾದ್ಧವಿಲ್ಲ (ಶ್ರಾದ್ಧಾಭಾವ)');
    });

    it('provides festivals list from Page 14', () => {
        const festivals = getAnnualFestivals();
        expect(festivals.length).toBeGreaterThan(30);
        const yugadi = festivals.find(f => f.nameKn.includes('ಯುಗಾದಿ'));
        expect(yugadi).toBeDefined();
        expect(yugadi?.date).toBe('2026-03-19');
    });

    it('provides Rayaru Aradhana Saptaha from Page 6', () => {
        const saptaha = getRayaruAradhanaSaptaha();
        expect(saptaha.length).toBe(7);
        expect(saptaha[0].date).toBe('2026-08-27');
        expect(saptaha[2].date).toBe('2026-08-29'); // Poorvaradhana
        expect(saptaha[3].date).toBe('2026-08-30'); // Madhyaradhana
        expect(saptaha[4].date).toBe('2026-08-31'); // Uttararadhana
    });

    it('formats PDF URLs with target page anchors', () => {
        expect(getPanchangaPdfUrl()).toBe('/documents/panchanga_parabhava_2026_27.pdf');
        expect(getPanchangaPdfUrl(37)).toBe('/documents/panchanga_parabhava_2026_27.pdf#page=37');
    });

    it('formats traditional Hindu 30-hour clock times correctly', () => {
        // Next day morning (> 24 hours)
        expect(formatPanchangaEndTime('28:10')).toBe('ಮರುದಿನ 04:10 (28:10)');
        expect(formatPanchangaEndTime('25:30')).toBe('ಮರುದಿನ 01:30 (25:30)');

        // Night time (18 - 24 hours)
        expect(formatPanchangaEndTime('21:40')).toBe('ರಾತ್ರಿ 09:40 (21:40)');
        expect(formatPanchangaEndTime('23:15')).toBe('ರಾತ್ರಿ 11:15 (23:15)');

        // Afternoon (12 - 18 hours)
        expect(formatPanchangaEndTime('14:30')).toBe('ಮಧ್ಯಾಹ್ನ 02:30 (14:30)');
        expect(formatPanchangaEndTime('12:00')).toBe('ಮಧ್ಯಾಹ್ನ 12:00 (12:00)');

        // Morning (< 12 hours)
        expect(formatPanchangaEndTime('08:45')).toBe('ಬೆಳಿಗ್ಗೆ 08:45 (08:45)');
        expect(formatPanchangaEndTime('')).toBe('');
    });

    it('formats Shraddha Tithi abbreviations to full Kannada text', () => {
        expect(formatShraddhaTithi('ದ್ವಿತೀ')).toBe('ದ್ವಿತೀಯಾ');
        expect(formatShraddhaTithi('ತೃತೀ')).toBe('ತೃತೀಯಾ');
        expect(formatShraddhaTithi('ಚತು')).toBe('ಚತುರ್ಥಿ');
        expect(formatShraddhaTithi('ಶ್ರಾದ್ಧಾಭಾವ')).toBe('ಶ್ರಾದ್ಧವಿಲ್ಲ (ಶ್ರಾದ್ಧಾಭಾವ)');
        expect(formatShraddhaTithi('ಏ, ದ್ವಾ')).toBe('ಏಕಾದಶಿ, ದ್ವಾದಶಿ');
        expect(formatShraddhaTithi('ತೃತೀ/ಚತು')).toBe('ತೃತೀಯಾ / ಚತುರ್ಥಿ');
    });

    it('handles dates safely across timezones and string formats', () => {
        expect(toIsoDateString('2026-08-30')).toBe('2026-08-30');
        expect(toIsoDateString('2026-08-30T10:00:00+05:30')).toBe('2026-08-30');
    });

    it('contains 0 ASCII/Nudi leakage characters across all 385 days', async () => {
        const data = await loadPanchangaData();
        const asciiPattern = /[a-zA-ZÀ-ÿ]/;
        const leaks: string[] = [];

        for (const [d, info] of Object.entries(data.days)) {
            const fieldsToCheck = [
                info.samvatsara,
                info.ayana,
                info.ritu,
                info.masa,
                info.paksha,
                info.masaDevata,
                info.tithi,
                info.nakshatra,
                info.yoga,
                info.karana,
                info.dharmashastra,
                info.shraddhaTithi,
                info.shraddhaTithiExpanded,
                info.notes,
                info.dayOfWeek,
            ];

            for (const val of fieldsToCheck) {
                if (val && asciiPattern.test(val)) {
                    leaks.push(`${d}: ${val}`);
                }
            }
        }

        expect(leaks).toEqual([]);
        expect(Object.keys(data.days).length).toBe(385);
    });
});
