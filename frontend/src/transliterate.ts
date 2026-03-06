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
 * Check if text contains any Kannada characters.
 */
export function isKannada(text: string): boolean {
    return /[\u0C80-\u0CFF]/.test(text);
}
