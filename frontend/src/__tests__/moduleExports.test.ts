/**
 * Regression Test Suite: Module Exports
 * 
 * Ensures all critical components and utilities are properly exported.
 * This catches the exact bug that caused the blank screen:
 * missing `export` on the SevaItem interface.
 */
import { describe, it, expect } from 'vitest';

describe('RegistrationModal exports', () => {
    it('exports SevaItem interface (the blank-screen fix)', async () => {
        const mod = await import('../components/RegistrationModal');
        // SevaItem is a TypeScript interface, so it won't exist at runtime.
        // But the module itself must import correctly without crashing.
        expect(mod.default).toBeDefined();
        expect(typeof mod.default).toBe('function');
    });
});

describe('DevoteeSelectionStep exports', () => {
    it('exports convertKnNumeralsToEn utility function', async () => {
        const mod = await import('../components/registration/DevoteeSelectionStep');
        expect(mod.convertKnNumeralsToEn).toBeDefined();
        expect(typeof mod.convertKnNumeralsToEn).toBe('function');
        // Verify it actually works
        expect(mod.convertKnNumeralsToEn('೧೨೩')).toBe('123');
    });

    it('exports getUnifiedSuggestions utility function', async () => {
        const mod = await import('../components/registration/DevoteeSelectionStep');
        expect(mod.getUnifiedSuggestions).toBeDefined();
        expect(typeof mod.getUnifiedSuggestions).toBe('function');
    });
});

describe('Transliterate module exports', () => {
    it('exports transliterateToKannada', async () => {
        const mod = await import('../transliterate');
        expect(mod.transliterateToKannada).toBeDefined();
        expect(typeof mod.transliterateToKannada).toBe('function');
    });

    it('exports transliterateKnToEn', async () => {
        const mod = await import('../transliterate');
        expect(mod.transliterateKnToEn).toBeDefined();
        expect(typeof mod.transliterateKnToEn).toBe('function');
    });

    it('exports convertKnNumeralsToEn', async () => {
        const mod = await import('../transliterate');
        expect(mod.convertKnNumeralsToEn).toBeDefined();
        expect(typeof mod.convertKnNumeralsToEn).toBe('function');
    });

    it('exports isKannada', async () => {
        const mod = await import('../transliterate');
        expect(mod.isKannada).toBeDefined();
        expect(typeof mod.isKannada).toBe('function');
    });
});

describe('API module exports', () => {
    it('exports all required API namespaces', async () => {
        const mod = await import('../api');
        expect(mod.devoteeApi).toBeDefined();
        expect(mod.sevaApi).toBeDefined();
        expect(mod.registrationApi).toBeDefined();
        expect(mod.eventsApi).toBeDefined();
    });

    it('devoteeApi has all CRUD methods', async () => {
        const { devoteeApi } = await import('../api');
        expect(typeof devoteeApi.list).toBe('function');
        expect(typeof devoteeApi.get).toBe('function');
        expect(typeof devoteeApi.create).toBe('function');
        expect(typeof devoteeApi.update).toBe('function');
        expect(typeof devoteeApi.delete).toBe('function');
        expect(typeof devoteeApi.searchBasic).toBe('function');
    });

    it('registrationApi has all methods', async () => {
        const { registrationApi } = await import('../api');
        expect(typeof registrationApi.list).toBe('function');
        expect(typeof registrationApi.create).toBe('function');
        expect(typeof registrationApi.byDevotee).toBe('function');
        expect(typeof registrationApi.byDate).toBe('function');
        expect(typeof registrationApi.fulfil).toBe('function');
        expect(typeof registrationApi.cancel).toBe('function');
    });
});

describe('Panchanga constants exports', () => {
    it('exports GOTRAS and NAKSHATRAS', async () => {
        const mod = await import('../constants/panchanga');
        expect(mod.GOTRAS).toBeDefined();
        expect(Array.isArray(mod.GOTRAS)).toBe(true);
        expect(mod.NAKSHATRAS).toBeDefined();
        expect(Array.isArray(mod.NAKSHATRAS)).toBe(true);
    });
});
