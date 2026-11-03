/**
 * Seva Categories and Taxonomy Definitions for SRS-Seva
 *
 * Provides a structured 7-cluster domain taxonomy for grouping the Matha's
 * 44-item Seva catalog, enabling progressive disclosure, rapid counter scanning,
 * and fast keyboard navigation.
 */

export interface SevaCategory {
    id: string;
    labelKn: string;
    labelEn: string;
    icon: string;
    codes: string[];
    keywords?: string[];
}

export const SEVA_CATEGORIES: SevaCategory[] = [
    {
        id: 'daily',
        labelKn: 'ದೈನಂದಿನ & ಅಭಿಷೇಕ',
        labelEn: 'Daily & Abhisheka',
        icon: '🪔',
        codes: ['S001', 'S002', 'S003', 'S004', 'S005', 'S043', 'S044', 'SV_SEAM_TEST', 'SV_DEEMED_TEST'],
        keywords: ['ಅಭಿಷೇಕ', 'ಪಾದ ಪೂಜೆ', 'ಪಾದಪೂಜೆ', 'ಕನಕ', 'abhisheka', 'pada', 'kanaka']
    },
    {
        id: 'utsava',
        labelKn: 'ಗುರುವಾರ & ಉತ್ಸವ',
        labelEn: 'Thursday & Utsava',
        icon: '🛞',
        codes: ['S013', 'S014', 'S015', 'S037'],
        keywords: ['ರಥೋತ್ಸವ', 'ಡೋಲೋತ್ಸವ', 'ಪಲ್ಲಕ್ಕಿ', 'ತೈಲ', 'ಗುರುವಾರ', 'deepa', 'rathotsava', 'utsava']
    },
    {
        id: 'satya',
        labelKn: 'ಶ್ರೀ ಸತ್ಯನಾರಾಯಣ',
        labelEn: 'Satyanarayana',
        icon: '📜',
        codes: ['S008', 'S009', 'S010'],
        keywords: ['ಸತ್ಯನಾರಾಯಣ', 'satyanarayana']
    },
    {
        id: 'pitru',
        labelKn: 'ಶ್ರಾದ್ಧ & ಪಿತೃ ಕಾರ್ಯ',
        labelEn: 'Shraddha & Pitru',
        icon: '🕊️',
        codes: ['S006', 'S007', 'S039', 'S040', 'S041', 'S042'],
        keywords: ['ಶ್ರಾದ್ಧ', 'ಶ್ರಾಧ್ದ', 'ಪಕ್ಷಮಾಸ', 'ಚಟಕ', 'ಸಂಕಲ್ಪ', 'ಚತುರ್ದಶಿ', 'ಅವಿಧವಾನವಮೀ', 'shraddha']
    },
    {
        id: 'vahana',
        labelKn: 'ವಾಹನ ಪೂಜೆ',
        labelEn: 'Vehicle Pooja',
        icon: '🚗',
        codes: ['S016', 'S017'],
        keywords: ['ವಾಹನ', 'ದ್ವಿಚಕ್ರ', 'ನಾಲ್ಕು ಚಕ್ರ', 'vahana', 'vehicle']
    },
    {
        id: 'seasonal',
        labelKn: 'ವಿಶೇಷ ಹಬ್ಬ & ಆರಾಧನೆ',
        labelEn: 'Festivals & Aaradhana',
        icon: '🎉',
        codes: ['S011', 'S012', 'S018', 'S019', 'S036', 'SV045', 'SV046', 'SV047', 'SV048', 'SV049', 'SV050', 'SV051', 'SV052', 'SV054'],
        keywords: ['ಆರಾಧನೆ', 'ಆರಾಧಾನೆ', 'ಧನುರ್ಮಾಸ', 'ಅಕ್ಷಯ ತೃತೀಯ', 'ಕಾರ್ತಿಕ', 'ಹೂವಿನ ಅಲಂಕಾರ', 'aaradhana', 'festival']
    },
    {
        id: 'kanike',
        labelKn: 'ಕಾಣಿಕೆ & ಪ್ರಸಾದ',
        labelEn: 'Kanike & Prasada',
        icon: '🪙',
        codes: ['S020', 'S027', 'S028', 'S029', 'SV055', 'SV_KANIKA', 'SV_HASTODAKA'],
        keywords: ['ಕಾಣಿಕೆ', 'ಹಸ್ತೋದಕ', 'ಅನ್ನದಾನ', 'ಪ್ರಸಾದ', 'kanike', 'prasada', 'annadana', 'hastodaka']
    }
];

export const OTHER_CATEGORY: SevaCategory = {
    id: 'other',
    labelKn: 'ಇತರ ಸೇವೆಗಳು',
    labelEn: 'Other Sevas',
    icon: '✨',
    codes: []
};

/**
 * Top 6 high-turnover daily sevas for 1-click counter addition (80/20 rule).
 * S004: Panchamruta Abhisheka (₹60)
 * S003: Pada Pooja (₹500)
 * S002: Kanakabhisheka (₹1,000)
 * S013: Rathotsava / Pallakki (₹150)
 * S017: Vahana Pooja - Four Wheeler (₹150)
 * S015: Taila Deepa Aarati (₹20)
 */
export const QUICK_PICK_SEVA_CODES = ['S004', 'S003', 'S002', 'S013', 'S017', 'S015'];

export interface MinimalSevaItem {
    SevaCode?: string;
    ItemCode?: string | number;
    Description?: string;
    DescriptionEn?: string;
    Amount?: number;
    Basic?: number;
}

/**
 * Resolve the category for a given Seva by code first, then keyword matching,
 * falling back to the 'other' category.
 */
export function getCategoryForSeva(item: MinimalSevaItem): SevaCategory {
    const code = String(item.SevaCode || item.ItemCode || '').trim();
    if (code) {
        const byCode = SEVA_CATEGORIES.find(cat => cat.codes.includes(code));
        if (byCode) return byCode;
    }

    const desc = `${item.Description || ''} ${item.DescriptionEn || ''}`.toLowerCase();
    if (desc.trim()) {
        const byKeyword = SEVA_CATEGORIES.find(cat =>
            cat.keywords?.some(kw => desc.includes(kw.toLowerCase()))
        );
        if (byKeyword) return byKeyword;
    }

    return OTHER_CATEGORY;
}

export interface GroupedSevas<T extends MinimalSevaItem> {
    category: SevaCategory;
    items: T[];
}

/**
 * Group an array of Sevas by category according to the 7-cluster taxonomy.
 * Preserves the canonical category order and excludes empty groups.
 */
export function groupSevasByCategory<T extends MinimalSevaItem>(items: T[]): GroupedSevas<T>[] {
    const map = new Map<string, T[]>();

    // Initialize all canonical categories
    SEVA_CATEGORIES.forEach(cat => map.set(cat.id, []));
    map.set(OTHER_CATEGORY.id, []);

    items.forEach(item => {
        const cat = getCategoryForSeva(item);
        const list = map.get(cat.id) || [];
        list.push(item);
        map.set(cat.id, list);
    });

    const result: GroupedSevas<T>[] = [];

    // Push non-empty categories in canonical order
    SEVA_CATEGORIES.forEach(cat => {
        const catItems = map.get(cat.id) || [];
        if (catItems.length > 0) {
            result.push({ category: cat, items: catItems });
        }
    });

    // Append other if any
    const otherItems = map.get(OTHER_CATEGORY.id) || [];
    if (otherItems.length > 0) {
        result.push({ category: OTHER_CATEGORY, items: otherItems });
    }

    return result;
}

