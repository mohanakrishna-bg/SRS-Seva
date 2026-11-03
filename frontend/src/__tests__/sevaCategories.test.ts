import { describe, it, expect } from 'vitest';
import {
    SEVA_CATEGORIES,
    QUICK_PICK_SEVA_CODES,
    getCategoryForSeva,
    groupSevasByCategory,
    OTHER_CATEGORY
} from '../constants/sevaCategories';

describe('Seva Categories Taxonomy', () => {
    it('defines exactly 7 canonical operational categories', () => {
        expect(SEVA_CATEGORIES).toHaveLength(7);
        const ids = SEVA_CATEGORIES.map(c => c.id);
        expect(ids).toEqual(['daily', 'utsava', 'satya', 'pitru', 'vahana', 'seasonal', 'kanike']);
    });

    it('defines 6 quick-pick seva codes for fast counter registration', () => {
        expect(QUICK_PICK_SEVA_CODES).toHaveLength(6);
        expect(QUICK_PICK_SEVA_CODES).toContain('S004'); // Panchamruta
        expect(QUICK_PICK_SEVA_CODES).toContain('S003'); // Pada Pooja
        expect(QUICK_PICK_SEVA_CODES).toContain('S002'); // Kanakabhisheka
        expect(QUICK_PICK_SEVA_CODES).toContain('S013'); // Rathotsava
        expect(QUICK_PICK_SEVA_CODES).toContain('S017'); // Four-wheeler Vahana Pooja
        expect(QUICK_PICK_SEVA_CODES).toContain('S015'); // Taila Deepa Aarati
    });

    it('correctly maps known sevas by their SevaCode', () => {
        expect(getCategoryForSeva({ SevaCode: 'S004', Description: 'ಪಂಚಾಮೃತ ಅಭಿಷೇಕ' }).id).toBe('daily');
        expect(getCategoryForSeva({ SevaCode: 'S013', Description: 'ರಥೋತ್ಸವ' }).id).toBe('utsava');
        expect(getCategoryForSeva({ SevaCode: 'S008', Description: 'ಸತ್ಯನಾರಾಯಣ ಪೂಜೆ' }).id).toBe('satya');
        expect(getCategoryForSeva({ SevaCode: 'S006', Description: 'ಶ್ರಾದ್ಧಕರ್ಮ - ಚಟಕ' }).id).toBe('pitru');
        expect(getCategoryForSeva({ SevaCode: 'S017', Description: 'ವಾಹನ ಪೂಜೆ' }).id).toBe('vahana');
        expect(getCategoryForSeva({ SevaCode: 'SV048', Description: 'ಆರಾಧನೆ ಸಂಪೂರ್ಣ ಸೇವೆ' }).id).toBe('seasonal');
        expect(getCategoryForSeva({ SevaCode: 'S020', Description: 'ಹಸ್ತೋದಕ' }).id).toBe('kanike');
    });

    it('falls back to keyword matching when SevaCode is unknown or unmapped', () => {
        const item = {
            ItemCode: 'CUSTOM_99',
            Description: 'ವಿಶೇಷ ಶ್ರೀ ಸತ್ಯನಾರಾಯಣ ಮಹಾ ಪೂಜೆ'
        };
        expect(getCategoryForSeva(item).id).toBe('satya');
    });

    it('falls back to OTHER_CATEGORY when code and keywords do not match', () => {
        const item = {
            ItemCode: 'UNKNOWN_CODE',
            Description: 'XYZ Completely Unrelated Service'
        };
        expect(getCategoryForSeva(item).id).toBe(OTHER_CATEGORY.id);
    });

    it('groups an array of sevas and preserves canonical category order', () => {
        const sampleSevas = [
            { SevaCode: 'S017', Description: 'ವಾಹನ ಪೂಜೆ', Basic: 150 },
            { SevaCode: 'S004', Description: 'ಪಂಚಾಮೃತ', Basic: 60 },
            { SevaCode: 'S008', Description: 'ಸತ್ಯನಾರಾಯಣ', Basic: 70 },
            { SevaCode: 'S003', Description: 'ಪಾದ ಪೂಜೆ', Basic: 500 },
            { SevaCode: 'UNKNOWN', Description: 'ವಿಶೇಷ ದೇಣಿಗೆ', Basic: 100 }
        ];

        const grouped = groupSevasByCategory(sampleSevas);

        // Expect non-empty groups
        const categoryIds = grouped.map(g => g.category.id);
        expect(categoryIds).toEqual(['daily', 'satya', 'vahana', 'other']);

        // Check items in daily
        const dailyGroup = grouped.find(g => g.category.id === 'daily');
        expect(dailyGroup?.items.map(i => i.SevaCode)).toEqual(['S004', 'S003']);

        // Check other
        const otherGroup = grouped.find(g => g.category.id === 'other');
        expect(otherGroup?.items.map(i => i.SevaCode)).toEqual(['UNKNOWN']);
    });
});

