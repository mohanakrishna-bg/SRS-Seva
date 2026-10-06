import type { SettingsStore } from './types';
import api from '../api';

export class HttpSettingsAdapter implements SettingsStore {
    async get<T = any>(key: string): Promise<T | null> {
        try {
            const res = await api.get(`/settings/${key}`);
            if (res.data && res.data.value !== undefined) {
                return res.data.value as T;
            }
            return (res.data as T) ?? null;
        } catch {
            return null;
        }
    }

    async save<T = any>(key: string, value: T): Promise<void> {
        await api.post('/settings', { key, value });
    }

    async list(): Promise<Record<string, any>> {
        const res = await api.get('/settings');
        return res.data || {};
    }
}

export class MemorySettingsAdapter implements SettingsStore {
    private store: Map<string, any>;

    constructor(initialData: Record<string, any> = {}) {
        this.store = new Map(Object.entries(initialData));
    }

    async get<T = any>(key: string): Promise<T | null> {
        return (this.store.get(key) as T) ?? null;
    }

    async save<T = any>(key: string, value: T): Promise<void> {
        this.store.set(key, value);
    }

    async list(): Promise<Record<string, any>> {
        const result: Record<string, any> = {};
        this.store.forEach((val, k) => {
            result[k] = val;
        });
        return result;
    }
}
