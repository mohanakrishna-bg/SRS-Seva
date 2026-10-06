import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntityCollection } from '../hooks/useEntityCollection';

interface SampleItem {
    id: number;
    name: string;
    isDeleted?: boolean;
}

const SAMPLE_ITEMS: SampleItem[] = [
    { id: 1, name: 'Anantha' },
    { id: 2, name: 'Bheema' },
    { id: 3, name: 'Chandra' },
    { id: 4, name: 'Damodara' },
    { id: 5, name: 'Eeshwara' },
    { id: 6, name: 'Govinda' },
];

describe('useEntityCollection', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    it('initializes pagination invariants correctly', () => {
        const { result } = renderHook(() =>
            useEntityCollection({
                items: SAMPLE_ITEMS,
                defaultPageSize: 2,
                pageSizeOptions: [2, 4, 10],
            })
        );

        expect(result.current.currentPage).toBe(1);
        expect(result.current.pageSize).toBe(2);
        expect(result.current.totalCount).toBe(6);
        expect(result.current.totalPages).toBe(3);
        expect(result.current.startIndex).toBe(1);
        expect(result.current.endIndex).toBe(2);
        expect(result.current.paginatedItems).toHaveLength(2);
        expect(result.current.paginatedItems[0].name).toBe('Anantha');
        expect(result.current.canPrev).toBe(false);
        expect(result.current.canNext).toBe(true);
    });

    it('navigates pages and clamps boundary values', () => {
        const { result } = renderHook(() =>
            useEntityCollection({
                items: SAMPLE_ITEMS,
                defaultPageSize: 2,
            })
        );

        act(() => {
            result.current.goToNextPage();
        });
        expect(result.current.currentPage).toBe(2);
        expect(result.current.startIndex).toBe(3);
        expect(result.current.endIndex).toBe(4);
        expect(result.current.canPrev).toBe(true);

        act(() => {
            result.current.goToNextPage();
        });
        expect(result.current.currentPage).toBe(3);
        expect(result.current.canNext).toBe(false);

        // Clamping at upper bound
        act(() => {
            result.current.goToNextPage();
        });
        expect(result.current.currentPage).toBe(3);

        act(() => {
            result.current.goToPrevPage();
        });
        expect(result.current.currentPage).toBe(2);
    });

    it('syncs pageSize changes with localStorage and recalculates pages', () => {
        const { result } = renderHook(() =>
            useEntityCollection({
                items: SAMPLE_ITEMS,
                storageKey: 'test_page_size',
                defaultPageSize: 2,
                pageSizeOptions: [2, 4, 10],
            })
        );

        act(() => {
            result.current.setPageSize(4);
        });

        expect(result.current.pageSize).toBe(4);
        expect(result.current.totalPages).toBe(2);
        expect(localStorage.getItem('test_page_size')).toBe('4');
    });

    it('debounces search filtering and resets page index to 1', () => {
        const { result } = renderHook(() =>
            useEntityCollection({
                items: SAMPLE_ITEMS,
                defaultPageSize: 2,
                filterFn: (item, query) => item.name.toLowerCase().includes(query.toLowerCase()),
            })
        );

        // Advance to page 2 first
        act(() => {
            result.current.goToNextPage();
        });
        expect(result.current.currentPage).toBe(2);

        // Type search query
        act(() => {
            result.current.setSearchQuery('Govinda');
        });
        expect(result.current.searchQuery).toBe('Govinda');

        // Fast-forward timers for debounce
        act(() => {
            vi.advanceTimersByTime(250);
        });

        expect(result.current.debouncedQuery).toBe('Govinda');
        expect(result.current.currentPage).toBe(1);
        expect(result.current.totalCount).toBe(1);
        expect(result.current.paginatedItems[0].name).toBe('Govinda');
    });

    it('orchestrates modal lifecycle: open detail -> inline edit -> cancel/save', async () => {
        const onSave = vi.fn().mockImplementation((data, _isEdit) => ({ ...data, id: 1 }));
        const { result } = renderHook(() =>
            useEntityCollection({
                items: SAMPLE_ITEMS,
                getItemKey: item => item.id,
                onSave,
            })
        );

        // Open detail
        act(() => {
            result.current.openDetail(SAMPLE_ITEMS[0]);
        });
        expect(result.current.viewingItem).toEqual(SAMPLE_ITEMS[0]);
        expect(result.current.isEditing).toBe(false);

        // Switch to inline edit
        act(() => {
            result.current.startEdit();
        });
        expect(result.current.isEditing).toBe(true);
        expect(result.current.editingItem).toEqual(SAMPLE_ITEMS[0]);

        // Cancel inline edit
        act(() => {
            result.current.cancelEdit();
        });
        expect(result.current.isEditing).toBe(false);
        expect(result.current.viewingItem).toEqual(SAMPLE_ITEMS[0]);

        // Save edit
        act(() => {
            result.current.startEdit();
        });
        await act(async () => {
            await result.current.handleSave({ id: 1, name: 'Anantha Padmanabha' });
        });
        expect(onSave).toHaveBeenCalledWith({ id: 1, name: 'Anantha Padmanabha' }, true, SAMPLE_ITEMS[0]);
        expect(result.current.isEditing).toBe(false);

        // Close detail
        act(() => {
            result.current.closeDetail();
        });
        expect(result.current.viewingItem).toBeNull();
    });

    it('orchestrates delete delegator and cleans up viewingItem on deletion', async () => {
        const onDelete = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useEntityCollection({
                items: SAMPLE_ITEMS,
                getItemKey: item => item.id,
                onDelete,
            })
        );

        act(() => {
            result.current.openDetail(SAMPLE_ITEMS[0]);
        });
        expect(result.current.viewingItem).toEqual(SAMPLE_ITEMS[0]);

        await act(async () => {
            await result.current.handleDelete(SAMPLE_ITEMS[0]);
        });
        expect(onDelete).toHaveBeenCalledWith(SAMPLE_ITEMS[0]);
        expect(result.current.viewingItem).toBeNull();
    });

    it('toggles print modal state', () => {
        const { result } = renderHook(() =>
            useEntityCollection({
                items: SAMPLE_ITEMS,
            })
        );

        expect(result.current.showPrintModal).toBe(false);
        act(() => {
            result.current.openPrintModal();
        });
        expect(result.current.showPrintModal).toBe(true);
        act(() => {
            result.current.closePrintModal();
        });
        expect(result.current.showPrintModal).toBe(false);
    });
});
