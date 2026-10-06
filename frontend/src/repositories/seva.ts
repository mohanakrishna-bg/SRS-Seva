import type { SevaCatalog, SevaItem } from './types';
import api from '../api';

export class HttpSevaAdapter implements SevaCatalog {
    async list(): Promise<SevaItem[]> {
        const res = await api.get('/sevas');
        return (res.data || []).filter((s: any) => s.SevaCode && s.Description);
    }

    async get(code: string): Promise<SevaItem | null> {
        const list = await this.list();
        return list.find(s => s.SevaCode === code) || null;
    }

    async create(data: SevaItem): Promise<SevaItem> {
        const res = await api.post('/sevas', data);
        return res.data || data;
    }

    async update(code: string, data: Partial<SevaItem>): Promise<SevaItem> {
        const res = await api.put(`/sevas/${code}`, data);
        return res.data || (data as SevaItem);
    }

    async delete(code: string): Promise<void> {
        await api.delete(`/sevas/${code}`);
    }
}

export class MemorySevaAdapter implements SevaCatalog {
    private items: SevaItem[];

    constructor(initialItems: SevaItem[] = []) {
        this.items = [...initialItems];
    }

    async list(): Promise<SevaItem[]> {
        return [...this.items];
    }

    async get(code: string): Promise<SevaItem | null> {
        return this.items.find(s => s.SevaCode === code) || null;
    }

    async create(data: SevaItem): Promise<SevaItem> {
        this.items = [data, ...this.items.filter(s => s.SevaCode !== data.SevaCode)];
        return data;
    }

    async update(code: string, data: Partial<SevaItem>): Promise<SevaItem> {
        const index = this.items.findIndex(s => s.SevaCode === code);
        if (index === -1) throw new Error(`Seva #${code} not found`);
        const updated = { ...this.items[index], ...data };
        this.items[index] = updated;
        return updated;
    }

    async delete(code: string): Promise<void> {
        this.items = this.items.filter(s => s.SevaCode !== code);
    }
}
