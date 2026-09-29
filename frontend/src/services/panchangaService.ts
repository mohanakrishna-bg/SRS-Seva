import srsPanchangaData from '../data/srs_panchanga_2026_2027.json';

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
    pdfPage: number;
    notes?: string;
    source: 'pdf_surya_siddhanta' | 'fallback_calculation';
}

export interface PanchangaTocItem {
    id: number;
    titleKn: string;
    titleEn: string;
    page: number;
}

export interface FestivalItem {
    nameKn: string;
    nameEn: string;
    date: string;
    endDate?: string;
}

export interface AradhanaItem {
    date: string;
    dayKn: string;
    dayEn: string;
    eventKn: string;
    eventEn: string;
}

export interface PanchangaMetadata {
    titleKn: string;
    titleEn: string;
    publisher: string;
    shakaYear: number;
    kaliYear: number;
    pdfUrl: string;
    startDate: string;
    endDate: string;
    totalDays: number;
}

const PANCHANGA_DATA = srsPanchangaData as {
    metadata: PanchangaMetadata;
    tableOfContents: PanchangaTocItem[];
    festivals: FestivalItem[];
    aradhanaSaptaha: AradhanaItem[];
    days: Record<string, Omit<SrsPanchangaDay, 'source'>>;
};

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatDateToIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get Panchanga details for a given date.
 * Prioritizes the official Sri Raghavendra Swamy Matha Surya Siddhanta PDF data (2026-2027).
 * Falls back to dynamic calculation if date is outside the official booklet's range.
 */
export async function getPanchangaForDate(activeDate: Date): Promise<SrsPanchangaDay> {
    const isoDate = formatDateToIso(activeDate);
    
    // Check if date is in the official PDF dataset
    const pdfRecord = PANCHANGA_DATA.days[isoDate];
    if (pdfRecord) {
        return {
            ...pdfRecord,
            source: 'pdf_surya_siddhanta',
            // Default sunset approximation based on sunrise + dinamana (or ~6:20 PM)
            sunset: '06:20 PM',
        };
    }

    // Fallback: Dynamic calculation for dates outside the 2026-2027 year
    try {
        const panchangam = await import('@ishubhamx/panchangam-js');
        const obs = new panchangam.Observer(12.2958, 76.6394, 0); // Mysore/Karnataka coordinates
        const details = panchangam.getPanchangamDetails(activeDate, obs);

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
            dayOfMonth: activeDate.getDate(),
            dayOfWeek: dayNamesKn[activeDate.getDay()],
            samvatsara,
            ayana: activeDate.getMonth() >= 0 && activeDate.getMonth() <= 5 ? 'ಉತ್ತರಾಯಣ' : 'ದಕ್ಷಿಣಾಯನ',
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
            dayOfMonth: activeDate.getDate(),
            dayOfWeek: dayNamesKn[activeDate.getDay()],
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
    return PANCHANGA_DATA.metadata;
}

export function getPanchangaTableOfContents(): PanchangaTocItem[] {
    return PANCHANGA_DATA.tableOfContents;
}

export function getAnnualFestivals(): FestivalItem[] {
    return PANCHANGA_DATA.festivals;
}

export function getRayaruAradhanaSaptaha(): AradhanaItem[] {
    return PANCHANGA_DATA.aradhanaSaptaha;
}

export function getPanchangaPdfUrl(page?: number): string {
    const base = PANCHANGA_DATA.metadata.pdfUrl || '/documents/panchanga_parabhava_2026_27.pdf';
    return page && page > 0 ? `${base}#page=${page}` : base;
}
