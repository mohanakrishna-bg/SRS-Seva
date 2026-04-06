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
 * Returns the original string if transliteration fails.
 */
export async function transliterateToKannada(text: string): Promise<string> {
    if (!text.trim()) return text;

    // If text is already in Kannada (Unicode range 0x0C80–0x0CFF), return as-is
    if (/[\u0C80-\u0CFF]/.test(text)) return text;

    // Check cache
    if (cache.has(text)) return cache.get(text)!;

    // Split into words and transliterate each
    const words = text.split(/\s+/);
    const results: string[] = [];

    for (const word of words) {
        if (!word) continue;

        // Skip if already Kannada
        if (/[\u0C80-\u0CFF]/.test(word)) {
            results.push(word);
            continue;
        }

        // Retain English numerals and symbols (only transliterate words with letters)
        if (!/[a-zA-Z]/.test(word)) {
            results.push(word);
            continue;
        }

        if (cache.has(word)) {
            results.push(cache.get(word)!);
            continue;
        }

        try {
            const url = GOOGLE_TRANSLITERATE_URL.replace('QUERY', encodeURIComponent(word));
            const response = await fetch(url);
            const data = await response.json();

            // Response format: ["SUCCESS", [["word", ["transliterated1", "transliterated2"]]]]
            if (data[0] === 'SUCCESS' && data[1]?.[0]?.[1]?.[0]) {
                const transliterated = data[1][0][1][0];
                cache.set(word, transliterated);
                results.push(transliterated);
            } else {
                results.push(word);
            }
        } catch {
            // API unavailable — return original
            results.push(word);
        }
    }

    const result = results.join(' ');
    cache.set(text, result);
    return result;
}

/**
 * Basic Kannada → English Transliteration Utility
 * Performs a straightforward phonetic mapping.
 */
export function transliterateKnToEn(text: string): string {
    if (!text || !/[\u0C80-\u0CFF]/.test(text)) return text;

    // Small dictionary of common words/phrases to handle better
    const dictionary: Record<string, string> = {
        'ಶ್ರೀ': 'Shree',
        'ಮಠ': 'Matha',
        'ಆಡಳಿತ': 'Admin',
        'ದೇವಸ್ಥಾನ': 'Temple',
        'ಸೇವೆ': 'Seva',
        'ನಮಸ್ಕಾರ': 'Namaskara',
        'ಹರಿಃ': 'Harih',
        'ಓಂ': 'Om'
    };

    // Replace known dictionary words first
    let result = text;
    for (const [kn, en] of Object.entries(dictionary)) {
        result = result.replace(new RegExp(kn, 'g'), en);
    }

    // Comprehensive char mapping
    const mapping: Record<string, string> = {
        'ಅ': 'a', 'ಆ': 'aa', 'ಇ': 'i', 'ಈ': 'ee', 'ಉ': 'u', 'ಊ': 'oo', 'ಋ': 'ru', 'ಎ': 'e', 'ಏ': 'ee', 'ಐ': 'ai', 'ಒ': 'o', 'ಓ': 'oo', 'ಔ': 'au', 'ಅಂ': 'am', 'ಅಃ': 'ah',
        'ಕ': 'ka', 'ಖ': 'kha', 'ಗ': 'ga', 'ಘ': 'gha', 'ಙ': 'nga',
        'ಚ': 'cha', 'ಛ': 'chha', 'ಜ': 'ja', 'ಝ': 'jha', 'ಞ': 'nya',
        'ಟ': 'ta', 'ಠ': 'tha', 'ಡ': 'da', 'ಢ': 'dha', 'ಣ': 'na',
        'ತ': 'ta', 'ಥ': 'tha', 'ದ': 'da', 'ಧ': 'dha', 'ನ': 'na',
        'ಪ': 'pa', 'ಫ': 'pha', 'ಬ': 'ba', 'ಭ': 'bha', 'ಮ': 'ma',
        'ಯ': 'ya', 'ರ': 'ra', 'ಲ': 'la', 'ವ': 'va', 'ಶ': 'sha', 'ಷ': 'sha', 'ಸ': 'sa', 'ಹ': 'ha', 'ಳ': 'la',
        'ಾ': 'aa', 'ಿ': 'i', 'ೀ': 'ee', 'ು': 'u', 'ೂ': 'oo', 'ೃ': 'ru', 'ೆ': 'e', 'ೇ': 'ee', 'ೈ': 'ai', 'ೊ': 'o', 'ೋ': 'oo', 'ೌ': 'au', '್': '', 'ಂ': 'm', 'ಃ': 'h'
    };

    // Simple phonetic replacement for remaining Kannada chars
    return result.split('').map(char => mapping[char] || char).join('')
        .replace(/([aeiou])a/g, '$1') // Clean up redundant vowels
        .replace(/aa/g, 'a') // Simplify
        .trim();
}

/**
 * Check if text contains any Kannada characters.
 */
export function isKannada(text: string): boolean {
    return /[\u0C80-\u0CFF]/.test(text);
}
