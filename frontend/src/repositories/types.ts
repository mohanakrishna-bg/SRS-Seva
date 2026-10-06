import type { Devotee } from '../pages/DevoteesPage';
import type { SevaItem } from '../pages/SevasPage';
import type { OrgSettings } from '../context/SettingsContext';

export type { Devotee, SevaItem, OrgSettings };

export interface DevoteeListResult {
    items: Devotee[];
    total: number;
}

export interface DevoteeDirectory {
    list(skip?: number, limit?: number): Promise<DevoteeListResult>;
    get(id: number): Promise<Devotee>;
    create(data: Partial<Devotee>): Promise<Devotee>;
    update(id: number, data: Partial<Devotee>): Promise<Devotee>;
    delete(id: number, permanent?: boolean): Promise<void>;
    searchBasic(query: string): Promise<Devotee[]>;
    searchAdvanced(params: Record<string, string>): Promise<Devotee[]>;
    cleanup(): Promise<{ message: string; count?: number }>;
    uploadPhoto(id: number, file: File): Promise<{ filename?: string; status?: string }>;
}

export interface SevaCatalog {
    list(): Promise<SevaItem[]>;
    get(code: string): Promise<SevaItem | null>;
    create(data: SevaItem): Promise<SevaItem>;
    update(code: string, data: Partial<SevaItem>): Promise<SevaItem>;
    delete(code: string): Promise<void>;
}

export interface SettingsStore {
    get<T = OrgSettings>(key: string): Promise<T | null>;
    save<T = OrgSettings>(key: string, value: T): Promise<void>;
    list(): Promise<Record<string, any>>;
}
