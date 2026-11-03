/**
 * Dynamic Daily Quick-Pick Seva Service
 *
 * Evaluates and recommends the top 6 Quick-Add Seva pills based on:
 * 1. Special calendar days (e.g., Thursday weekly Rayara special)
 * 2. Astronomical/Panchanga proximity (Full Moon / Poornima for Satyanarayana Pooja)
 * 3. Proximity to major festivals and upcoming Rayara Aaradhana Saptaha
 * 4. Recent counter booking frequency
 * 5. Evergreen core daily matha anchors (Panchamruta, Pada Pooja, Kanakabhisheka)
 *
 * Performance Contract:
 * Evaluated on a daily schedule and frozen in localStorage for the day
 * (srs_daily_quick_picks_YYYY-MM-DD) to minimize real-time computational overhead.
 */

import { RAYARU_ARADHANA_SAPTAHA } from '../data/panchangaStaticData';

export interface DailyQuickPickResult {
    codes: string[];
    reasonKn: string;
    reasonEn: string;
    date: string;
}

const RECENT_BOOKINGS_STORAGE_KEY = 'srs_recent_counter_bookings';
const DAILY_CACHE_PREFIX = 'srs_daily_quick_picks_';

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Check if the given date is Thursday (Rayara weekly sacred day)
 */
export function isThursday(date: Date): boolean {
    return date.getDay() === 4;
}

/**
 * Check if the date is in the Poornima (Full Moon) window (within ~1.5 days).
 * Uses astronomical synodic lunar phase calculation.
 * Full moon occurs at phase ~0.50 (range 0.45 - 0.55).
 */
export function isNearPoornima(date: Date): boolean {
    const epoch = new Date('2000-01-06T18:14:00Z').getTime();
    const synodicMonth = 29.53058867;
    const diffDays = (date.getTime() - epoch) / 86400000;
    const phase = (((diffDays % synodicMonth) + synodicMonth) % synodicMonth) / synodicMonth;
    return phase >= 0.45 && phase <= 0.55;
}

/**
 * Check if the date is near Rayara Aradhana (late August to early September)
 */
export function isNearAradhana(date: Date): boolean {
    // Check Aradhana Saptaha dates directly
    const matchingSaptaha = RAYARU_ARADHANA_SAPTAHA.find(item => {
        const itemDate = new Date(item.date);
        const diffDays = Math.abs((date.getTime() - itemDate.getTime()) / 86400000);
        return diffDays <= 7;
    });

    if (matchingSaptaha) return true;

    // Seasonal window: August 20 through September 5
    const month = date.getMonth(); // 7 = Aug, 8 = Sep
    const day = date.getDate();
    return (month === 7 && day >= 20) || (month === 8 && day <= 5);
}

/**
 * Check if date is in Dhanurmasa (mid-Dec to mid-Jan)
 */
export function isDhanurmasa(date: Date): boolean {
    const month = date.getMonth(); // 11 = Dec, 0 = Jan
    const day = date.getDate();
    return (month === 11 && day >= 15) || (month === 0 && day <= 15);
}

/**
 * Retrieve recent counter-booked seva codes from localStorage
 */
export function getRecentBookedSevaCodes(): string[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const raw = localStorage.getItem(RECENT_BOOKINGS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Record booked sevas into recent history to dynamically adapt quick picks
 */
export function recordRecentBookings(codes: string[]): void {
    if (typeof window === 'undefined' || !window.localStorage || !codes.length) return;
    try {
        const current = getRecentBookedSevaCodes();
        const updated = [...codes, ...current].slice(0, 100);
        localStorage.setItem(RECENT_BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
}

/**
 * Pure evaluation function computing the day's optimal 6 Quick-Pick Sevas.
 */
export function computeDailyQuickPicks(
    date: Date = new Date(),
    recentBookings: string[] = getRecentBookedSevaCodes()
): DailyQuickPickResult {
    const picks: string[] = [];
    const reasonsKn: string[] = [];
    const reasonsEn: string[] = [];

    const addPick = (code: string) => {
        if (!picks.includes(code) && code) {
            picks.push(code);
        }
    };

    // 1. Thursday Priority (Rayara Weekly Pooja & Rathotsava)
    if (isThursday(date)) {
        addPick('S015'); // Taila Deepa Aarati (Thursday only)
        addPick('S013'); // Rathotsava / Pallakki
        reasonsKn.push('ಗುರುವಾರ ವಿಶೇಷ');
        reasonsEn.push('Thursday Special');
    }

    // 2. Poornima (Full Moon) Proximity (Sri Satyanarayana Pooja)
    if (isNearPoornima(date)) {
        addPick('S008'); // Sri Satyanarayana Pooje (Samuhika)
        addPick('S010'); // Sri Satyanarayana Pooje (Pratyeka)
        reasonsKn.push('ಹುಣ್ಣಿಮೆ ಸತ್ಯನಾರಾಯಣ ಪೂಜೆ');
        reasonsEn.push('Poornima Satyanarayana');
    }

    // 3. Aradhana Proximity (Aaradhana Kanakabhisheka & Special Sevas)
    if (isNearAradhana(date)) {
        addPick('SV051'); // Aaradhana Kanakabhisheka
        addPick('SV052'); // Aaradhana Pada Pooja
        reasonsKn.push('ಆರಾಧನಾ ಮಹೋತ್ಸವ');
        reasonsEn.push('Aradhana Mahotsava');
    }

    // 4. Dhanurmasa Proximity (Pongal Sevas)
    if (isDhanurmasa(date)) {
        addPick('S012'); // Sihi Pongal
        addPick('S011'); // Khara Pongal
        reasonsKn.push('ಧನುರ್ಮಾಸ ಪೂಜೆ');
        reasonsEn.push('Dhanurmasa Pongal');
    }

    // 5. Recent Counter Booking Frequency
    if (recentBookings && recentBookings.length > 0) {
        const counts = new Map<string, number>();
        recentBookings.forEach(code => {
            counts.set(code, (counts.get(code) || 0) + 1);
        });
        const sorted = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([code]) => code);
        sorted.forEach(code => addPick(code));
    }

    // 6. Evergreen Core Daily Anchors (High turnover fallbacks)
    const evergreen = ['S004', 'S003', 'S002', 'S013', 'S017', 'S015'];
    evergreen.forEach(code => addPick(code));

    // Cap at top 6
    const finalCodes = picks.slice(0, 6);

    const defaultReasonKn = reasonsKn.length > 0 ? reasonsKn.join(' • ') : 'ದೈನಂದಿನ ಜನಪ್ರಿಯ ಸೇವೆಗಳು';
    const defaultReasonEn = reasonsEn.length > 0 ? reasonsEn.join(' • ') : 'Daily Popular Sevas';

    return {
        codes: finalCodes,
        reasonKn: defaultReasonKn,
        reasonEn: defaultReasonEn,
        date: formatIsoDate(date),
    };
}

/**
 * Get daily quick picks with daily caching / freezing in localStorage.
 * Runs once per day and remains frozen to eliminate runtime calculation overhead.
 */
export function getDailyQuickPicks(date: Date = new Date()): DailyQuickPickResult {
    const isoDate = formatIsoDate(date);
    const cacheKey = `${DAILY_CACHE_PREFIX}${isoDate}`;

    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached) as DailyQuickPickResult;
                if (parsed && Array.isArray(parsed.codes) && parsed.codes.length > 0) {
                    return parsed;
                }
            }
        } catch {}
    }

    // Compute fresh for today
    const evaluated = computeDailyQuickPicks(date);

    // Save and cleanup past days from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith(DAILY_CACHE_PREFIX) && key !== cacheKey) {
                    localStorage.removeItem(key);
                }
            }
            localStorage.setItem(cacheKey, JSON.stringify(evaluated));
        } catch {}
    }

    return evaluated;
}
