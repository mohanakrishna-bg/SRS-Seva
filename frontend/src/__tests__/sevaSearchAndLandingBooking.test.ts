import { describe, it, expect } from 'vitest';
import { NAV_CONFIG } from '../config/navConfig';
import type { SevaItem } from '../components/RegistrationModal';

// Test database fixtures matching actual SQLite database
const mockItems: SevaItem[] = [
    {
        ItemCode: 'S001',
        Description: 'ಕನಕ ಮಹಾಸೇವೆ  ( 3  ಮತ್ತು 4 ಸೇವೆ ಸಹಿತ  )',
        DescriptionEn: 'Kanaka Mahaseve (Including 3 and 4 Sevas)',
        Basic: 1500,
        Amount: 1500,
    },
    {
        ItemCode: 'S003',
        Description: 'ಪಾದ ಪೂಜೆ -      ಪಂಚಾಮೃತ ಸೇವೆ ಸಹಿತ',
        DescriptionEn: 'Paada Pooje - Including Panchamruta Seve',
        Basic: 500,
        Amount: 500,
    },
    {
        ItemCode: 'S008',
        Description: 'ಶ್ರೀ  ಸತ್ಯನಾರಾಯಣ     ಪೂಜೆ     ( ಸಾಮೂಹಿಕ)',
        DescriptionEn: 'Sri Satyanarayana Pooje (Samuhika)',
        Basic: 70,
        Amount: 70,
    },
    {
        ItemCode: 'S043',
        Description: 'ಮಧು    ಅಭಿಷೇಕ',
        DescriptionEn: 'Madhu Abhisheka',
        Basic: 500,
        Amount: 500,
    },
    {
        ItemCode: 'SV045',
        Description: 'ಆರಾಧನೆ ಹೂವಿನ ಅಲಂಕಾರ - 1 ದಿನ ',
        DescriptionEn: '', // Empty in DB!
        Basic: 5000,
        Amount: 5000,
    },
    {
        ItemCode: 'SV052',
        Description: 'ಆರಾಧನೆ ಪಾದಪೂಜೆ ',
        DescriptionEn: '', // Empty in DB!
        Basic: 500,
        Amount: 500,
    },
    {
        ItemCode: 'SV055',
        Description: 'ಅನ್ನದಾನ ',
        DescriptionEn: '', // Empty in DB!
        Basic: 0,
        Amount: 0,
    },
];

// Replicate matching algorithm from SevaDetailsStep
const KN_TO_EN_SEARCH_MAP: Record<string, string> = {
    'ಆರಾಧನೆ': 'aradhana aradhane aaraadhane aaraadhana',
    'ಹೂವಿನ': 'hoovina hoovu flower',
    'ಅಲಂಕಾರ': 'alankara alankar decoration',
    'ಸಂಪೂರ್ಣ': 'sampoorna sampurna complete',
    'ಸೇವೆ': 'seva seve',
    'ಸೇವ': 'seva seve',
    'ಬ್ರಾಹ್ಮಣರ': 'brahmana brahmanara',
    'ಕನಕಾಭಿಷೇಕ': 'kanakabhisheka kanaka abhisheka',
    'ಕನಕ': 'kanaka',
    'ಪಾದಪೂಜೆ': 'padapooje pada pooja paada pooje puja puje',
    'ಪಾದ': 'pada paada padha',
    'ಪೂಜೆ': 'pooja pooje puja puje',
    'ಪಂಚಾಮೃತ': 'panchamruta panchamrutha',
    'ಅನ್ನದಾನ': 'annadana annadanam',
    'ಸತ್ಯನಾರಾಯಣ': 'satyanarayana sathyanarayana satya',
    'ಹಸ್ತೋದಕ': 'hastodaka hasthodaka hastodak',
    'ಅಭಿಷೇಕ': 'abhisheka abhishek',
    'ಮಧು': 'madhu',
};

const normalizeWhitespace = (str: string) => str.replace(/\s+/g, ' ').trim().toLowerCase();

const applyPhoneticNormalization = (text: string): string => {
    return text
        .replace(/\b(puja|puje|pooje)\b/gi, 'pooja')
        .replace(/\b(paada|padha)\b/gi, 'pada')
        .replace(/\bseve\b/gi, 'seva')
        .replace(/\bpanchamrutha\b/gi, 'panchamruta')
        .replace(/\b(sathyanarayana|satya)\b/gi, 'satyanarayana')
        .replace(/\b(aaraadhane|aaraadhana|aradhane)\b/gi, 'aradhana')
        .replace(/\babhisheka\b/gi, 'abhishek')
        .replace(/\bkanika\b/gi, 'kanike')
        .replace(/\balankara\b/gi, 'alankar');
};

const buildSearchableItemText = (item: SevaItem): string => {
    const code = String(item.ItemCode ?? item.SevaCode ?? '').toLowerCase();
    const rawKn = normalizeWhitespace(item.Description || '');
    const rawEn = normalizeWhitespace(item.DescriptionEn || '');
    const amount = String(item.Basic ?? item.Amount ?? '');

    const extraTokens: string[] = [];
    for (const [kn, en] of Object.entries(KN_TO_EN_SEARCH_MAP)) {
        if (item.Description?.includes(kn)) {
            extraTokens.push(en);
        }
    }

    const baseText = `${code} ${rawKn} ${rawEn} ${amount} ${extraTokens.join(' ')}`;
    const phoneticVariant = applyPhoneticNormalization(baseText);
    return `${baseText} ${phoneticVariant}`;
};

const searchSevas = (items: SevaItem[], query: string): SevaItem[] => {
    const q = normalizeWhitespace(query);
    if (!q) return items;
    const queryPhonetic = applyPhoneticNormalization(q);
    const tokens = queryPhonetic.split(' ').filter(Boolean);

    return items.filter(item => {
        const searchable = buildSearchableItemText(item);
        return tokens.every(tok => searchable.includes(tok));
    });
};

describe('Landing Page Seva Booking Configuration', () => {
    it('configures primaryAction for home module to trigger openRegModal', () => {
        const homeModule = NAV_CONFIG.find(m => m.id === 'home');
        expect(homeModule).toBeDefined();
        expect(homeModule?.path).toBe('/app');
        expect(homeModule?.primaryAction).toBeDefined();
        expect(homeModule?.primaryAction?.label).toContain('ಬುಕ್ ಮಾಡಿ');
        expect(homeModule?.primaryAction?.contextKey).toBe('openRegModal');
    });
});

describe('Seva Search Filtering and Tolerance', () => {
    it('matches sevas with irregular whitespace in Kannada descriptions', () => {
        // Query has 1 space, DB item has 6 spaces: 'ಪಾದ ಪೂಜೆ -      ಪಂಚಾಮೃತ ಸೇವೆ ಸಹಿತ'
        const results = searchSevas(mockItems, 'ಪಾದ ಪೂಜೆ');
        expect(results.some(s => s.ItemCode === 'S003')).toBe(true);
    });

    it('matches sevas across phonetic variations of pooja / puja / pooje', () => {
        const resultsPooja = searchSevas(mockItems, 'pooja');
        const resultsPuja = searchSevas(mockItems, 'puja');
        const resultsPooje = searchSevas(mockItems, 'pooje');

        expect(resultsPooja.some(s => s.ItemCode === 'S003')).toBe(true);
        expect(resultsPuja.some(s => s.ItemCode === 'S003')).toBe(true);
        expect(resultsPooje.some(s => s.ItemCode === 'S003')).toBe(true);
    });

    it('matches pada and paada interchangeably', () => {
        const res1 = searchSevas(mockItems, 'pada');
        const res2 = searchSevas(mockItems, 'paada');

        expect(res1.some(s => s.ItemCode === 'S003')).toBe(true);
        expect(res2.some(s => s.ItemCode === 'S003')).toBe(true);
    });

    it('matches satya and satyanarayana', () => {
        const res = searchSevas(mockItems, 'satya');
        expect(res.some(s => s.ItemCode === 'S008')).toBe(true);

        const resFull = searchSevas(mockItems, 'satyanarayana');
        expect(resFull.some(s => s.ItemCode === 'S008')).toBe(true);
    });

    it('matches panchamruta and panchamrutha', () => {
        const res1 = searchSevas(mockItems, 'panchamruta');
        const res2 = searchSevas(mockItems, 'panchamrutha');

        expect(res1.some(s => s.ItemCode === 'S003')).toBe(true);
        expect(res2.some(s => s.ItemCode === 'S003')).toBe(true);
    });

    it('matches items with blank DescriptionEn using English keywords (e.g. Aradhana)', () => {
        // SV045 and SV052 have empty DescriptionEn
        const res = searchSevas(mockItems, 'aradhana');
        expect(res.some(s => s.ItemCode === 'SV045')).toBe(true);
        expect(res.some(s => s.ItemCode === 'SV052')).toBe(true);

        const resAaraadhane = searchSevas(mockItems, 'aaraadhane');
        expect(resAaraadhane.some(s => s.ItemCode === 'SV045')).toBe(true);
    });

    it('matches Annadana and Madhu Abhisheka', () => {
        const resAnnadana = searchSevas(mockItems, 'annadana');
        expect(resAnnadana.some(s => s.ItemCode === 'SV055')).toBe(true);

        const resAbhishek = searchSevas(mockItems, 'abhishek');
        expect(resAbhishek.some(s => s.ItemCode === 'S043')).toBe(true);
    });

    it('matches item code and amount directly', () => {
        const resCode = searchSevas(mockItems, 'S003');
        expect(resCode).toHaveLength(1);
        expect(resCode[0].ItemCode === 'S003').toBe(true);

        const resAmount = searchSevas(mockItems, '1500');
        expect(resAmount.some(s => s.ItemCode === 'S001')).toBe(true);
    });
});

