import type { DevoteeDirectory, DevoteeListResult, Devotee } from './types';
import api from '../api';

export class HttpDevoteeAdapter implements DevoteeDirectory {
    async list(skip = 0, limit = 2000): Promise<DevoteeListResult> {
        const res = await api.get(`/devotees?skip=${skip}&limit=${limit}`);
        const data = res.data;
        const items: Devotee[] = data.items || data || [];
        const total: number = data.total || items.length;
        return { items, total };
    }

    async get(id: number): Promise<Devotee> {
        const res = await api.get(`/devotees/${id}`);
        return res.data;
    }

    async create(data: Partial<Devotee>): Promise<Devotee> {
        const res = await api.post('/devotees', data);
        return res.data;
    }

    async update(id: number, data: Partial<Devotee>): Promise<Devotee> {
        const res = await api.put(`/devotees/${id}`, data);
        return res.data;
    }

    async delete(id: number, permanent = false): Promise<void> {
        await api.delete(`/devotees/${id}?permanent=${permanent}`);
    }

    async searchBasic(query: string): Promise<Devotee[]> {
        const res = await api.get(`/devotees/search/basic?q=${encodeURIComponent(query)}`);
        return res.data || [];
    }

    async searchAdvanced(params: Record<string, string>): Promise<Devotee[]> {
        const qs = new URLSearchParams(params).toString();
        const res = await api.get(`/devotees/search/advanced?${qs}`);
        return res.data || [];
    }

    async cleanup(): Promise<{ message: string; count?: number }> {
        const res = await api.post('/devotees/cleanup');
        return res.data;
    }

    async uploadPhoto(id: number, file: File): Promise<{ filename?: string; status?: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post(`/devotees/${id}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    }
}

export class MemoryDevoteeAdapter implements DevoteeDirectory {
    private items: Devotee[];
    private nextId: number;

    constructor(initialItems: Devotee[] = []) {
        this.items = [...initialItems];
        this.nextId = initialItems.reduce((max, d) => Math.max(max, d.DevoteeId || 0), 0) + 1;
    }

    async list(skip = 0, limit = 2000): Promise<DevoteeListResult> {
        const active = this.items.filter(i => !i.IsDeleted);
        const paged = active.slice(skip, skip + limit);
        return { items: paged, total: active.length };
    }

    async get(id: number): Promise<Devotee> {
        const found = this.items.find(i => i.DevoteeId === id && !i.IsDeleted);
        if (!found) throw new Error(`Devotee #${id} not found`);
        return found;
    }

    async create(data: Partial<Devotee>): Promise<Devotee> {
        const created: Devotee = {
            DevoteeId: this.nextId++,
            Name: data.Name || 'Unknown',
            Phone: data.Phone,
            WhatsApp_Phone: data.WhatsApp_Phone,
            Email: data.Email,
            Gotra: data.Gotra,
            Nakshatra: data.Nakshatra,
            Address: data.Address,
            City: data.City,
            PinCode: data.PinCode,
            PhotoPath: data.PhotoPath,
            IsDeleted: false,
        };
        this.items.push(created);
        return created;
    }

    async update(id: number, data: Partial<Devotee>): Promise<Devotee> {
        const index = this.items.findIndex(i => i.DevoteeId === id);
        if (index === -1) throw new Error(`Devotee #${id} not found`);
        const updated = { ...this.items[index], ...data };
        this.items[index] = updated;
        return updated;
    }

    async delete(id: number, permanent = false): Promise<void> {
        if (permanent) {
            this.items = this.items.filter(i => i.DevoteeId !== id);
        } else {
            const index = this.items.findIndex(i => i.DevoteeId === id);
            if (index !== -1) {
                this.items[index].IsDeleted = true;
            }
        }
    }

    async searchBasic(query: string): Promise<Devotee[]> {
        const q = query.toLowerCase().trim();
        if (!q) return this.items.filter(i => !i.IsDeleted);
        return this.items.filter(i =>
            !i.IsDeleted && (
                i.Name.toLowerCase().includes(q) ||
                (i.Phone && i.Phone.includes(q)) ||
                (i.WhatsApp_Phone && i.WhatsApp_Phone.includes(q))
            )
        );
    }

    async searchAdvanced(params: Record<string, string>): Promise<Devotee[]> {
        return this.items.filter(i => {
            if (i.IsDeleted) return false;
            if (params.name && !i.Name.toLowerCase().includes(params.name.toLowerCase())) return false;
            if (params.gotra && i.Gotra !== params.gotra) return false;
            if (params.nakshatra && i.Nakshatra !== params.nakshatra) return false;
            if (params.pin_code && i.PinCode !== params.pin_code) return false;
            return true;
        });
    }

    async cleanup(): Promise<{ message: string; count?: number }> {
        const initialCount = this.items.length;
        this.items = this.items.filter(i => !i.IsDeleted);
        const removed = initialCount - this.items.length;
        return { message: `${removed} devotees purged`, count: removed };
    }

    async uploadPhoto(id: number, _file: File): Promise<{ filename?: string; status?: string }> {
        const index = this.items.findIndex(i => i.DevoteeId === id);
        if (index !== -1) {
            this.items[index].PhotoPath = `mock://photos/${id}.jpg`;
        }
        return { filename: `mock://${id}.jpg`, status: 'success' };
    }
}
