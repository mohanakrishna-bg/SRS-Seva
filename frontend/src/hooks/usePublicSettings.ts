import { useSettings, type OrgSettings } from '../context/SettingsContext';

/**
 * Public settings hook — delegates directly to the unified SettingsContext
 * as the single source of truth across the entire app.
 * This guarantees real-time synchronization between the Manage module
 * and the public-facing pages without localStorage divergence.
 */
export function usePublicSettings() {
    const { settings, loading } = useSettings();
    return { settings, loading };
}

export type { OrgSettings };
