import {
    PANCHANGA_METADATA,
    PANCHANGA_TOC,
    PANCHANGA_FESTIVALS,
    RAYARU_ARADHANA_SAPTAHA,
    type PanchangaMetadata,
    type PanchangaTocItem,
    type FestivalItem,
    type AradhanaItem,
} from '../data/panchangaStaticData';

export type { PanchangaMetadata, PanchangaTocItem, FestivalItem, AradhanaItem };

export interface SrsPanchangaDay {
    date: string;
    dayOfMonth: number;
    dayOfWeek: string;
    samvatsara: string;
    ayana: string;
    ritu: string;
    masa: string;
    paksha: string;
    masaDevata?: string;
    tithi: string;
    tithiEndTime?: string;
    nakshatra: string;
    yoga: string;
    karana: string;
    sunrise: string;
    sunset?: string;
    dinamana: string;
    dharmashastra: string;
    shraddhaTithi?: string;
    shraddhaTithiExpanded?: string;
    pdfPage: number;
    notes?: string;
    source: 'pdf_surya_siddhanta' | 'fallback_calculation';
}

interface SrsPanchangaJsonStructure {
    metadata: PanchangaMetadata;
    tableOfContents: PanchangaTocItem[];
    festivals: FestivalItem[];
    aradhanaSaptaha: AradhanaItem[];
    days: Record<string, Omit<SrsPanchangaDay, 'source'>>;
}

let cachedPanchangaData: SrsPanchangaJsonStructure | null = null;
let dataLoadingPromise: Promise<SrsPanchangaJsonStructure> | null = null;

/**
 * Lazily loads the official Sri Raghavendra Swamy Matha 385-day Panchanga dataset.
 * This dynamic import keeps the ~240KB dataset out of the primary app entry bundle.
 */
export async function loadPanchangaData(): Promise<SrsPanchangaJsonStructure> {
    if (cachedPanchangaData) {
        return cachedPanchangaData;
    }
    if (!dataLoadingPromise) {
        dataLoadingPromise = import('../data/srs_panchanga_2026_2027.json').then((module) => {
            const rawData = (module.default || module) as SrsPanchangaJsonStructure;
            cachedPanchangaData = rawData;
            return rawData;
        });
    }
    return dataLoadingPromise;
}

/**
 * Converts a Date object or date string to YYYY-MM-DD in Asia/Kolkata timezone.
 * Robust against timezone boundary shifts across midnight UTC.
 */
export function toIsoDateString(input: Date | string): string {
    if (typeof input === 'string') {
        const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    }
    const d = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(d.getTime())) {
        const now = new Date();
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(now);
    }
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(d);
}

/**
 * Backward compatibility alias for formatDateToIso
 */
export function formatDateToIso(d: Date): string {
    return toIsoDateString(d);
}

/**
 * Formats a traditional Hindu 30-hour clock time (e.g., '28:10' or '14:35') into
 * a modern, user-friendly 12-hour format with period indicators in Kannada,
 * while preserving the original traditional 30-hour reading in parentheses.
 * 
 * Examples:
 * - '28:10' -> 'ಮರುದಿನ 04:10 (28:10)'
 * - '22:15' -> 'ರಾತ್ರಿ 10:15 (22:15)'
 * - '14:20' -> 'ಮಧ್ಯಾಹ್ನ 02:20 (14:20)'
 * - '08:45' -> 'ಬೆಳಿಗ್ಗೆ 08:45 (08:45)'
 */
export function formatPanchangaEndTime(timeStr?: string): string {
    if (!timeStr) return '';
    const match = timeStr.trim().match(/^(\d{1,2})[:\s](\d{2})$/);
    if (!match) return timeStr;

    const rawHours = parseInt(match[1], 10);
    const minutes = match[2];

    if (rawHours >= 24) {
        const nextDayHours = rawHours - 24;
        const padH = String(nextDayHours).padStart(2, '0');
        return `ಮರುದಿನ ${padH}:${minutes} (${timeStr})`;
    } else if (rawHours >= 18) {
        const h12 = rawHours - 12;
        const padH = String(h12).padStart(2, '0');
        return `ರಾತ್ರಿ ${padH}:${minutes} (${timeStr})`;
    } else if (rawHours >= 12) {
        const h12 = rawHours === 12 ? 12 : rawHours - 12;
        const padH = String(h12).padStart(2, '0');
        return `ಮಧ್ಯಾಹ್ನ ${padH}:${minutes} (${timeStr})`;
    } else {
        const padH = String(rawHours).padStart(2, '0');
        return `ಬೆಳಿಗ್ಗೆ ${padH}:${minutes} (${timeStr})`;
    }
}

/**
 * Formats Shraddha Tithi abbreviation into complete, readable Kannada text.
 */
export function formatShraddhaTithi(shraddhaTithi?: string, expanded?: string): string {
    if (expanded) return expanded;
    if (!shraddhaTithi) return '';
    if (shraddhaTithi === 'ಶ್ರಾದ್ಧಾಭಾವ') return 'ಶ್ರಾದ್ಧವಿಲ್ಲ (ಶ್ರಾದ್ಧಾಭಾವ)';

    const abbreviations: Record<string, string> = {
        'ಪ್ರತಿ': 'ಪ್ರತಿಪದೆ', 'ಪ್ರತಿಪತ್': 'ಪ್ರತಿಪದೆ',
        'ದ್ವಿ': 'ದ್ವಿತೀಯಾ', 'ದ್ವಿತೀ': 'ದ್ವಿತೀಯಾ',
        'ತೃತೀ': 'ತೃತೀಯಾ',
        'ಚತು': 'ಚತುರ್ಥಿ', 'ಚತುರ್': 'ಚತುರ್ಥಿ', 'Zತು': 'ಚತುರ್ಥಿ', 'ಚ': 'ಚತುರ್ಥಿ',
        'ಪಂ': 'ಪಂಚಮಿ', 'ಪಂಚ': 'ಪಂಚಮಿ',
        'ಷ': 'ಷಷ್ಠಿ', 'ಷಷ್ಠಿ': 'ಷಷ್ಠಿ', 'ಷಷ್ಠೀ': 'ಷಷ್ಠಿ',
        'ಸಪ್ತ': 'ಸಪ್ತಮಿ',
        'ಅಷ್ಟ': 'ಅಷ್ಟಮಿ',
        'ನವ': 'ನವಮಿ',
        'ದಶ': 'ದಶಮಿ',
        'ಏ': 'ಏಕಾದಶಿ', 'ಏಕಾ': 'ಏಕಾದಶಿ', 'ಎಕಾ': 'ಏಕಾದಶಿ',
        'ದ್ವಾ': 'ದ್ವಾದಶಿ', 'ದ್ವಾದ': 'ದ್ವಾದಶಿ',
        'ತ್ರ': 'ತ್ರಯೋದಶಿ', 'ತ್ರಯೋ': 'ತ್ರಯೋದಶಿ',
        'ಪೂರ್ಣಿ': 'ಪೂರ್ಣಿಮೆ', 'ಅಮಾ': 'ಅಮಾವಾಸ್ಯೆ'
    };

    const parts = shraddhaTithi.split(/([,/])/);
    return parts.map(p => {
        const trimmed = p.trim();
        if (trimmed === ',') return ', ';
        if (trimmed === '/') return ' / ';
        return abbreviations[trimmed] || trimmed;
    }).join('');
}

/**
 * Get Panchanga details for a given date.
 * Prioritizes the official Sri Raghavendra Swamy Matha Surya Siddhanta PDF data (2026-2027).
 * Falls back to dynamic calculation if date is outside the official booklet's range.
 */
export async function getPanchangaForDate(activeDate: Date | string): Promise<SrsPanchangaDay> {
    const isoDate = toIsoDateString(activeDate);
    const parsedDate = typeof activeDate === 'string' ? new Date(`${isoDate}T12:00:00+05:30`) : activeDate;
    
    // Check if date is in the official PDF dataset
    try {
        const fullData = await loadPanchangaData();
        const pdfRecord = fullData.days[isoDate];
        if (pdfRecord) {
            return {
                ...pdfRecord,
                source: 'pdf_surya_siddhanta',
                sunset: pdfRecord.sunset || '06:20 PM',
            };
        }
    } catch (loadErr) {
        console.warn('Failed to load official Panchanga data chunk:', loadErr);
    }

    // Fallback: Dynamic calculation for dates outside the 2026-2027 year
    try {
        const panchangam = await import('@ishubhamx/panchangam-js');
        const obs = new panchangam.Observer(12.2958, 76.6394, 0); // Mysore/Karnataka coordinates
        const details = panchangam.getPanchangamDetails(parsedDate, obs);

        const tithis = [
            'ಪ್ರತಿಪದೆ', 'ದ್ವಿತೀಯಾ', 'ತೃತೀಯಾ', 'ಚತುರ್ಥೀ', 'ಪಂಚಮಿ',
            'ಷಷ್ಠಿ', 'ಸಪ್ತಮಿ', 'ಅಷ್ಟಮಿ', 'ನವಮಿ', 'ದಶಮಿ',
            'ಏಕಾದಶಿ', 'ದ್ವಾದಶಿ', 'ತ್ರಯೋದಶಿ', 'ಚತುರ್ದಶಿ'
        ];
        
        let tithiName = '';
        const pakshaStr = details.paksha === 'Shukla' ? 'ಶುಕ್ಲ ಪಕ್ಷ' : 'ಕೃಷ್ಣ ಪಕ್ಷ';
        
        if (details.tithis[0].name.includes('Amavasya')) tithiName = 'ಅಮಾವಾಸ್ಯೆ';
        else if (details.tithis[0].name.includes('Purnima')) tithiName = 'ಪೂರ್ಣಿಮೆ';
        else {
            const tIdx = (details.tithis[0].index % 15);
            tithiName = tithis[tIdx] || 'ಪ್ರತಿಪದೆ';
        }

        const nakshatras = [
            'ಅಶ್ವಿನಿ', 'ಭರಣಿ', 'ಕೃತ್ತಿಕಾ', 'ರೋಹಿಣಿ', 'ಮೃಗಶಿರಾ',
            'ಆರ್ದ್ರಾ', 'ಪುನರ್ವಸು', 'ಪುಷ್ಯ', 'ಆಶ್ಲೇಷಾ', 'ಮಘಾ',
            'ಪೂರ್ವ ಫಲ್ಗುಣಿ', 'ಉತ್ತರ ಫಲ್ಗುಣಿ', 'ಹಸ್ತ', 'ಚಿತ್ರಾ', 'ಸ್ವಾತಿ',
            'ವಿಶಾಖಾ', 'ಅನುರಾಧಾ', 'ಜ್ಯೇಷ್ಠಾ', 'ಮೂಲಾ', 'ಪೂರ್ವಾಷಾಢಾ',
            'ಉತ್ತರಾಷಾಢಾ', 'ಶ್ರವಣ', 'ಧನಿಷ್ಠಾ', 'ಶತಭಿಷಾ',
            'ಪೂರ್ವಭಾದ್ರಪದಾ', 'ಉತ್ತರಾಭಾದ್ರಪದಾ', 'ರೇವತಿ'
        ];
        const nakshatraName = nakshatras[details.nakshatras[0].index] || '';

        const sakaMonths = ['ಚೈತ್ರ', 'ವೈಶಾಖ', 'ಜ್ಯೇಷ್ಠ', 'ಆಷಾಢ', 'ಶ್ರಾವಣ', 'ಭಾದ್ರಪದ', 'ಆಶ್ವಿನ', 'ಕಾರ್ತಿಕ', 'ಮಾರ್ಗಶಿರ', 'ಪುಷ್ಯ', 'ಮಾಘ', 'ಫಾಲ್ಗುಣ'];
        const samvatsaras = [
            "ಪ್ರಭವ", "ವಿಭವ", "ಶುಕ್ಲ", "ಪ್ರಮೋದೂತ", "ಪ್ರಜೋತ್ಪತ್ತಿ",
            "ಆಂಗಿರಸ", "ಶ್ರೀಮುಖ", "ಭಾವ", "ಯುವ", "ಧಾತೃ",
            "ಈಶ್ವರ", "ಬಹುಧಾನ್ಯ", "ಪ್ರಮಾಧಿ", "ವಿಕ್ರಮ", "ವೃಷಭ",
            "ಚಿತ್ರಭಾನು", "ಸ್ವಭಾನು", "ತಾರಣ", "ಪಾರ್ಥಿವ", "ವ್ಯಯ",
            "ಸರ್ವಜಿತ್", "ಸರ್ವಧಾರಿ", "ವಿರೋಧಿ", "ವಿಕೃತಿ", "ಖರ",
            "ನಂದನ", "ವಿಜಯ", "ಜಯ", "ಮನ್ಮಥ", "ದುರ್ಮುಖಿ",
            "ಹೇವಿಳಂಬಿ", "ವಿಳಂಬಿ", "ವಿಕಾರಿ", "ಶಾರ್ವರಿ", "ಪ್ಲವ",
            "ಶುಭಕೃತ್", "ಶೋಭಕೃತ್", "ಕ್ರೋಧಿ", "ವಿಶ್ವಾವಸು", "ಪರಾಭವ",
            "ಪ್ಲವಂಗ", "ಕೀಲಕ", "ಸೌಮ್ಯ", "ಸಾಧಾರಣ", "ವಿರೋಧಿಕೃತ್",
            "ಪರಿಧಾವಿ", "ಪ್ರಮಾದಿ", "ಆನಂದ", "ರಾಕ್ಷಸ", "ನಳ",
            "ಪಿಂಗಳ", "ಕಾಲಯುಕ್ತಿ", "ಸಿದ್ಧಾರ್ಥಿ", "ರೌದ್ರಿ", "ದುರ್ಮತಿ",
            "ದುಂದುಭಿ", "ರುಧಿರೋದ್ಗಾರಿ", "ರಕ್ತಾಕ್ಷಿ", "ಕ್ರೋಧನ", "ಅಕ್ಷಯ"
        ];
        
        const shakaYear = details.samvat.shaka;
        const samvatsara = `${samvatsaras[(shakaYear + 11) % 60]} ಸಂವತ್ಸರ`;
        const monthName = `${sakaMonths[details.masa.index]} ಮಾಸ`;

        const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' };
        const sr = details.sunrise ? new Date(details.sunrise).toLocaleTimeString('en-IN', timeOpts) : '06:00';
        const ss = details.sunset ? new Date(details.sunset).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '06:15 PM';

        const dayNamesKn = ['ಭಾನುವಾರ', 'ಸೋಮವಾರ', 'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ', 'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ'];

        return {
            date: isoDate,
            dayOfMonth: parsedDate.getDate(),
            dayOfWeek: dayNamesKn[parsedDate.getDay()],
            samvatsara,
            ayana: parsedDate.getMonth() >= 0 && parsedDate.getMonth() <= 5 ? 'ಉತ್ತರಾಯಣ' : 'ದಕ್ಷಿಣಾಯನ',
            ritu: 'ಋತು',
            masa: monthName,
            paksha: pakshaStr,
            tithi: tithiName,
            nakshatra: nakshatraName,
            yoga: '',
            karana: '',
            sunrise: sr,
            sunset: ss,
            dinamana: '30:00',
            dharmashastra: '',
            pdfPage: 1,
            source: 'fallback_calculation',
        };
    } catch (err) {
        console.error('Fallback Panchanga Calculation Error:', err);
        const dayNamesKn = ['ಭಾನುವಾರ', 'ಸೋಮವಾರ', 'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ', 'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ'];
        return {
            date: isoDate,
            dayOfMonth: parsedDate.getDate(),
            dayOfWeek: dayNamesKn[parsedDate.getDay()],
            samvatsara: 'ಶ್ರೀ ಪರಾಭವ ನಾಮ ಸಂವತ್ಸರ',
            ayana: 'ದಕ್ಷಿಣಾಯನ',
            ritu: 'ವರ್ಷ ಋತು',
            masa: 'ಮಾಸ',
            paksha: 'ಪಕ್ಷ',
            tithi: '',
            nakshatra: '',
            yoga: '',
            karana: '',
            sunrise: '06:00',
            sunset: '06:15 PM',
            dinamana: '30:00',
            dharmashastra: '',
            pdfPage: 1,
            source: 'fallback_calculation',
        };
    }
}

export function getPanchangaMetadata(): PanchangaMetadata {
    return PANCHANGA_METADATA;
}

export function getPanchangaTableOfContents(): PanchangaTocItem[] {
    return PANCHANGA_TOC;
}

export function getAnnualFestivals(): FestivalItem[] {
    return PANCHANGA_FESTIVALS;
}

export function getRayaruAradhanaSaptaha(): AradhanaItem[] {
    return RAYARU_ARADHANA_SAPTAHA;
}

export function getPanchangaPdfUrl(page?: number): string {
    const base = PANCHANGA_METADATA.pdfUrl || '/documents/panchanga_parabhava_2026_27.pdf';
    return page && page > 0 ? `${base}#page=${page}` : base;
}
