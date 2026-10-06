import { describe, it, expect } from 'vitest';
import { createMemoryRepositories, MemoryDevoteeAdapter, MemorySevaAdapter, MemorySettingsAdapter } from '../repositories';

describe('Domain Repositories (Memory Adapters)', () => {
    describe('DevoteeDirectory', () => {
        it('supports create, list, search and soft-delete invariants', async () => {
            const repo = new MemoryDevoteeAdapter();

            const d1 = await repo.create({ Name: 'Raghavendra Rao', Phone: '9876543210', Gotra: 'Gautama' });
            const d2 = await repo.create({ Name: 'Suresh Kumar', Phone: '9123456780', Gotra: 'Kashyapa' });

            expect(d1.DevoteeId).toBeDefined();
            expect(d2.DevoteeId).toBeDefined();

            const list = await repo.list();
            expect(list.total).toBe(2);
            expect(list.items).toHaveLength(2);

            // Search basic
            const search = await repo.searchBasic('Raghavendra');
            expect(search).toHaveLength(1);
            expect(search[0].Name).toBe('Raghavendra Rao');

            // Update
            const updated = await repo.update(d1.DevoteeId, { City: 'Bangalore' });
            expect(updated.City).toBe('Bangalore');

            // Soft-delete
            await repo.delete(d1.DevoteeId, false);
            const listAfterDelete = await repo.list();
            expect(listAfterDelete.total).toBe(1);
            expect(listAfterDelete.items[0].Name).toBe('Suresh Kumar');

            // Cleanup
            const cleanupResult = await repo.cleanup();
            expect(cleanupResult.count).toBe(1);
        });
    });

    describe('SevaCatalog', () => {
        it('supports list, create, update, and delete', async () => {
            const repo = new MemorySevaAdapter([
                { SevaCode: 'S01', Description: 'Panchamrutha Abhisheka', Amount: 500, TPQty: 2 },
            ]);

            const list = await repo.list();
            expect(list).toHaveLength(1);
            expect(list[0].SevaCode).toBe('S01');

            await repo.create({ SevaCode: 'S02', Description: 'Ksheerabhisheka', Amount: 300, TPQty: 1 });
            expect(await repo.list()).toHaveLength(2);

            const updated = await repo.update('S02', { Amount: 350 });
            expect(updated.Amount).toBe(350);

            await repo.delete('S01');
            const remaining = await repo.list();
            expect(remaining).toHaveLength(1);
            expect(remaining[0].SevaCode).toBe('S02');
        });
    });

    describe('SettingsStore', () => {
        it('supports get, save, and list', async () => {
            const repo = new MemorySettingsAdapter({ key1: 'val1' });

            expect(await repo.get('key1')).toBe('val1');
            expect(await repo.get('nonexistent')).toBeNull();

            await repo.save('org', { name: 'SRS Matha' });
            expect(await repo.get('org')).toEqual({ name: 'SRS Matha' });

            const all = await repo.list();
            expect(all.key1).toBe('val1');
            expect(all.org).toEqual({ name: 'SRS Matha' });
        });
    });

    describe('createMemoryRepositories Factory', () => {
        it('creates isolated domain repository instances', async () => {
            const repos1 = createMemoryRepositories({
                devotees: [{ DevoteeId: 10, Name: 'Test 10' }],
            });
            const repos2 = createMemoryRepositories({
                devotees: [{ DevoteeId: 20, Name: 'Test 20' }],
            });

            const l1 = await repos1.devotees.list();
            const l2 = await repos2.devotees.list();

            expect(l1.items[0].Name).toBe('Test 10');
            expect(l2.items[0].Name).toBe('Test 20');
        });
    });
});
