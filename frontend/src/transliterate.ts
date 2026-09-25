/**
 * English → Kannada Transliteration Utility
 * Uses Google Input Tools API for real-time transliteration.
 * Falls back gracefully if the API is unavailable.
 */

const GOOGLE_TRANSLITERATE_URL =
    'https://inputtools.google.com/request?text=QUERY&itc=kn-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8';

// Cache to avoid redundant API calls
const cache = new Map<string, string>();

/**
 * Transliterate an English string to Kannada script.
 * Preserves spaces, numbers, punctuation, and existing Kannada characters.
 * Handles single or multiple words cleanly.
 * Returns the original string if transliteration fails or if no Latin letters are present.
 */
export async function transliterateToKannada(text: string): Promise<string> {
    if (!text || !text.trim()) return text;

    // If text contains NO English/Latin letters at all, return as-is
    if (!/[a-zA-Z]/.test(text)) return text;

    // Check whole text cache
    if (cache.has(text)) return cache.get(text)!;

    // Split text into English word tokens and non-English tokens (preserving spaces, punctuation, Kannada chars)
    const tokens = text.split(/([a-zA-Z]+)/);
    const results: string[] = [];

    for (const token of tokens) {
        if (!token) continue;

        if (/[a-zA-Z]/.test(token)) {
            if (cache.has(token)) {
                results.push(cache.get(token)!);
                continue;
            }

            try {
                const url = GOOGLE_TRANSLITERATE_URL.replace('QUERY', encodeURIComponent(token));
                const response = await fetch(url);
                const data = await response.json();

                // Response format: ["SUCCESS", [["word", ["transliterated1", "transliterated2"]]]]
                if (data[0] === 'SUCCESS' && data[1]?.[0]?.[1]?.[0]) {
                    const transliterated = data[1][0][1][0];
                    cache.set(token, transliterated);
                    results.push(transliterated);
                } else {
                    results.push(token);
                }
            } catch {
                // API unavailable — return original token
                results.push(token);
            }
        } else {
            results.push(token);
        }
    }

    const result = results.join('');
    cache.set(text, result);
    return result;
}

/**
 * Basic Kannada → English Transliteration Utility
 * Performs a straightforward phonetic mapping.
 */
export function transliterateKnToEn(text: string): string {
    if (!text || !/[\u0C80-\u0CFF]/.test(text)) return text;

    // Dictionary of common temple and devotee words/names
    const dictionary: Record<string, string> = {
        'ಶ್ರೀ': 'Shree',
        'ಮಠ': 'Matha',
        'ಆಡಳಿತ': 'Admin',
        'ದೇವಸ್ಥಾನ': 'Temple',
        'ಸೇವೆ': 'Seva',
        'ನಮಸ್ಕಾರ': 'Namaskara',
        'ಹರಿಃ': 'Harih',
        'ಓಂ': 'Om',
        'ರಾಘವೇಂದ್ರ': 'Raghavendra',
        'ರಾವ್': 'Rao',
        'ಕುಮಾರ್': 'Kumar',
        'ಭಟ್': 'Bhat',
        'ಆಚಾರ್': 'Achar',
        'ಶರ್ಮಾ': 'Sharma',
        'ಶಾಸ್ತ್ರಿ': 'Shastry',
        'ಪ್ರಸಾದ್': 'Prasad'
    };

    let result = text;
    for (const [kn, en] of Object.entries(dictionary)) {
        result = result.replace(new RegExp(kn, 'g'), en);
    }

    const vowels: Record<string, string> = {
        'ಅ': 'a', 'ಆ': 'aa', 'ಇ': 'i', 'ಈ': 'ee', 'ಉ': 'u', 'ಊ': 'oo', 'ಋ': 'ru',
        'ಎ': 'e', 'ಏ': 'ee', 'ಐ': 'ai', 'ಒ': 'o', 'ಓ': 'oo', 'ಔ': 'au', 'ಅಂ': 'am', 'ಅಃ': 'ah'
    };

    const consonants: Record<string, string> = {
        'ಕ': 'k', 'ಖ': 'kh', 'ಗ': 'g', 'ಘ': 'gh', 'ಙ': 'ng',
        'ಚ': 'ch', 'ಛ': 'chh', 'ಜ': 'j', 'ಝ': 'jh', 'ಞ': 'ny',
        'ಟ': 't', 'ಠ': 'th', 'ಡ': 'd', 'ಢ': 'dh', 'ಣ': 'n',
        'ತ': 't', 'ಥ': 'th', 'ದ': 'd', 'ಧ': 'dh', 'ನ': 'n',
        'ಪ': 'p', 'ಫ': 'ph', 'ಬ': 'b', 'ಭ': 'bh', 'ಮ': 'm',
        'ಯ': 'y', 'ರ': 'r', 'ಲ': 'l', 'ವ': 'v', 'ಶ': 'sh', 'ಷ': 'sh', 'ಸ': 's', 'ಹ': 'h', 'ಳ': 'l'
    };

    const matras: Record<string, string> = {
        'ಾ': 'a', 'ಿ': 'i', 'ೀ': 'ee', 'ು': 'u', 'ೂ': 'oo', 'ೃ': 'ru',
        'ೆ': 'e', 'ೇ': 'e', 'ೈ': 'ai', 'ೊ': 'o', 'ೋ': 'o', 'ೌ': 'au'
    };

    let out = '';
    const chars = Array.from(result);
    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (vowels[c]) {
            out += vowels[c];
        } else if (consonants[c]) {
            const base = consonants[c];
            const next = chars[i + 1];
            if (next === '್') {
                out += base;
                i++; // skip halant / virama
            } else if (matras[next]) {
                out += base + matras[next];
                i++; // skip matra
            } else {
                out += base + 'a';
            }
        } else if (c === 'ಂ') {
            out += 'm';
        } else if (c === 'ಃ') {
            out += 'h';
        } else if (c === '್') {
            // stray halant
        } else if (matras[c]) {
            out += matras[c];
        } else {
            out += c;
        }
    }

    return out.replace(/\b[a-z]/g, (s) => s.toUpperCase()).trim();
}

/**
 * Check if text contains any Kannada characters.
 */
export function isKannada(text: string): boolean {
    return /[\u0C80-\u0CFF]/.test(text);
}

/**
 * Convert Kannada numerals (೦-೯) to English numerals (0-9).
 */
export function convertKnNumeralsToEn(text: string): string {
    if (!text) return text;
    const mapping: Record<string, string> = {
        '೦': '0',
        '೧': '1',
        '೨': '2',
        '೩': '3',
        '೪': '4',
        '೫': '5',
        '೬': '6',
        '೭': '7',
        '೮': '8',
        '೯': '9'
    };
    return text.replace(/[೦-೯]/g, (char) => mapping[char] || char);
}
