import { HttpDevoteeAdapter, MemoryDevoteeAdapter } from './devotee';
import { HttpSevaAdapter, MemorySevaAdapter } from './seva';
import { HttpSettingsAdapter, MemorySettingsAdapter } from './settings';
import type { DevoteeDirectory, SevaCatalog, SettingsStore, Devotee, SevaItem } from './types';

export * from './types';
export * from './devotee';
export * from './seva';
export * from './settings';

export interface DomainRepositories {
    devotees: DevoteeDirectory;
    sevas: SevaCatalog;
    settings: SettingsStore;
}

// Default production instances backed by HTTP and Axios
export const devoteeDirectory: DevoteeDirectory = new HttpDevoteeAdapter();
export const sevaCatalog: SevaCatalog = new HttpSevaAdapter();
export const settingsStore: SettingsStore = new HttpSettingsAdapter();

export const defaultRepositories: DomainRepositories = {
    devotees: devoteeDirectory,
    sevas: sevaCatalog,
    settings: settingsStore,
};

// Factory for fast offline tests
export function createMemoryRepositories(options?: {
    devotees?: Devotee[];
    sevas?: SevaItem[];
    settings?: Record<string, any>;
}): DomainRepositories {
    return {
        devotees: new MemoryDevoteeAdapter(options?.devotees || []),
        sevas: new MemorySevaAdapter(options?.sevas || []),
        settings: new MemorySettingsAdapter(options?.settings || {}),
    };
}
