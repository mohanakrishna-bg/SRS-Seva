import { useState, useMemo, useEffect, useCallback } from 'react';

export interface UseEntityCollectionOptions<T, TFilter = Record<string, any>> {
    items: T[];
    totalCount?: number;
    storageKey?: string;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    filterFn?: (item: T, searchQuery: string, customFilter?: TFilter) => boolean;
    sortFn?: (a: T, b: T) => number;
    getItemKey?: (item: T) => string | number;
    onSave?: (data: any, isEdit: boolean, currentItem: T | null) => Promise<T | void> | void;
    onDelete?: (item: T) => Promise<void> | void;
}

export interface UseEntityCollectionResult<T, TFilter = Record<string, any>> {
    // Search & Filter
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    debouncedQuery: string;
    customFilter: TFilter | undefined;
    setCustomFilter: (f: TFilter | undefined | ((prev: TFilter | undefined) => TFilter | undefined)) => void;

    // Processed Items
    filteredItems: T[];
    paginatedItems: T[];
    totalCount: number;

    // Pagination
    currentPage: number;
    setCurrentPage: (page: number) => void;
    pageSize: number;
    setPageSize: (size: number) => void;
    pageSizeOptions: number[];
    totalPages: number;
    startIndex: number;
    endIndex: number;
    canPrev: boolean;
    canNext: boolean;
    goToNextPage: () => void;
    goToPrevPage: () => void;

    // Modal & Action Lifecycle
    viewingItem: T | null;
    editingItem: T | null;
    isEditing: boolean;
    isCreating: boolean;
    openDetail: (item: T) => void;
    closeDetail: () => void;
    startEdit: (item?: T) => void;
    cancelEdit: () => void;
    openCreate: () => void;
    closeCreate: () => void;

    // Print Orchestration
    showPrintModal: boolean;
    openPrintModal: () => void;
    closePrintModal: () => void;

    // Mutation Handlers
    handleSave: (data: any) => Promise<void>;
    handleDelete: (item: T) => Promise<void>;
}

export function useEntityCollection<T, TFilter = Record<string, any>>({
    items,
    totalCount: externalTotalCount,
    storageKey,
    defaultPageSize = 10,
    pageSizeOptions = [5, 10, 15, 20],
    filterFn,
    sortFn,
    getItemKey,
    onSave,
    onDelete,
}: UseEntityCollectionOptions<T, TFilter>): UseEntityCollectionResult<T, TFilter> {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [customFilter, setCustomFilter] = useState<TFilter | undefined>(undefined);

    // Debounce search query input (200ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 200);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Page size state with localStorage sync
    const [pageSize, setPageSizeState] = useState<number>(() => {
        if (storageKey && typeof window !== 'undefined' && window.localStorage) {
            try {
                const saved = window.localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = parseInt(saved, 10);
                    if (!isNaN(parsed) && pageSizeOptions.includes(parsed)) {
                        return parsed;
                    }
                }
            } catch {
                // Ignore localStorage errors
            }
        }
        return defaultPageSize;
    });

    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        if (storageKey && typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.setItem(storageKey, String(size));
            } catch {
                // Ignore localStorage errors
            }
        }
    }, [storageKey]);

    const [currentPage, setCurrentPageRaw] = useState(1);

    // Reset current page when debounced query or custom filter changes
    useEffect(() => {
        setCurrentPageRaw(1);
    }, [debouncedQuery, customFilter]);

    // Filter and Sort items
    const filteredItems = useMemo(() => {
        let result = items;
        if (filterFn) {
            result = result.filter(item => filterFn(item, debouncedQuery, customFilter));
        }
        if (sortFn) {
            result = [...result].sort(sortFn);
        }
        return result;
    }, [items, debouncedQuery, customFilter, filterFn, sortFn]);

    const isServerPaginated = externalTotalCount !== undefined;
    const effectiveTotalCount = isServerPaginated ? externalTotalCount : filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / pageSize));

    // Clamped current page
    const currentPageClamped = Math.min(Math.max(1, currentPage), totalPages);

    const setCurrentPage = useCallback((page: number) => {
        setCurrentPageRaw(Math.min(Math.max(1, page), totalPages));
    }, [totalPages]);

    // Paginated items
    const paginatedItems = useMemo(() => {
        if (isServerPaginated) {
            return items;
        }
        const start = (currentPageClamped - 1) * pageSize;
        return filteredItems.slice(start, start + pageSize);
    }, [isServerPaginated, items, filteredItems, currentPageClamped, pageSize]);

    const startIndex = effectiveTotalCount === 0 ? 0 : (currentPageClamped - 1) * pageSize + 1;
    const endIndex = Math.min(currentPageClamped * pageSize, effectiveTotalCount);
    const canPrev = currentPageClamped > 1;
    const canNext = currentPageClamped < totalPages;

    const goToNextPage = useCallback(() => {
        if (currentPageClamped < totalPages) {
            setCurrentPageRaw(currentPageClamped + 1);
        }
    }, [currentPageClamped, totalPages]);

    const goToPrevPage = useCallback(() => {
        if (currentPageClamped > 1) {
            setCurrentPageRaw(currentPageClamped - 1);
        }
    }, [currentPageClamped]);

    // Modal Lifecycle State
    const [viewingItem, setViewingItem] = useState<T | null>(null);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);

    // Keep viewingItem up to date if items list updates
    useEffect(() => {
        if (viewingItem && getItemKey) {
            const currentKey = getItemKey(viewingItem);
            const fresh = items.find(i => getItemKey(i) === currentKey);
            if (fresh) {
                setViewingItem(fresh);
            }
        }
    }, [items, getItemKey]);

    const openDetail = useCallback((item: T) => {
        setViewingItem(item);
        setEditingItem(null);
    }, []);

    const closeDetail = useCallback(() => {
        setViewingItem(null);
        setEditingItem(null);
    }, []);

    const startEdit = useCallback((item?: T) => {
        const target = item || viewingItem;
        if (target) {
            setEditingItem(target);
        }
    }, [viewingItem]);

    const cancelEdit = useCallback(() => {
        setEditingItem(null);
    }, []);

    const openCreate = useCallback(() => {
        setIsCreating(true);
        setViewingItem(null);
        setEditingItem(null);
    }, []);

    const closeCreate = useCallback(() => {
        setIsCreating(false);
    }, []);

    const openPrintModal = useCallback(() => setShowPrintModal(true), []);
    const closePrintModal = useCallback(() => setShowPrintModal(false), []);

    // Save delegator
    const handleSave = useCallback(async (data: any) => {
        if (!onSave) return;
        const isEdit = Boolean(editingItem);
        const result = await onSave(data, isEdit, editingItem);
        if (result && typeof result === 'object') {
            setViewingItem(result as T);
        }
        setEditingItem(null);
        setIsCreating(false);
    }, [onSave, editingItem]);

    // Delete delegator
    const handleDelete = useCallback(async (item: T) => {
        if (!onDelete) return;
        await onDelete(item);
        if (viewingItem && getItemKey && getItemKey(viewingItem) === getItemKey(item)) {
            setViewingItem(null);
            setEditingItem(null);
        } else if (viewingItem === item) {
            setViewingItem(null);
            setEditingItem(null);
        }
    }, [onDelete, viewingItem, getItemKey]);

    return {
        searchQuery,
        setSearchQuery,
        debouncedQuery,
        customFilter,
        setCustomFilter,

        filteredItems,
        paginatedItems,
        totalCount: effectiveTotalCount,

        currentPage: currentPageClamped,
        setCurrentPage,
        pageSize,
        setPageSize,
        pageSizeOptions,
        totalPages,
        startIndex,
        endIndex,
        canPrev,
        canNext,
        goToNextPage,
        goToPrevPage,

        viewingItem,
        editingItem,
        isEditing: Boolean(editingItem),
        isCreating,
        openDetail,
        closeDetail,
        startEdit,
        cancelEdit,
        openCreate,
        closeCreate,

        showPrintModal,
        openPrintModal,
        closePrintModal,

        handleSave,
        handleDelete,
    };
}
