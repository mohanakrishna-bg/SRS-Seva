import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface EntityPaginationBarProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    pageSizeOptions: number[];
    totalCount: number;
    startIndex: number;
    endIndex: number;
    canPrev: boolean;
    canNext: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onPrev: () => void;
    onNext: () => void;
}

export default function EntityPaginationBar({
    currentPage,
    totalPages,
    pageSize,
    pageSizeOptions,
    totalCount,
    startIndex,
    endIndex,
    canPrev,
    canNext,
    onPageChange,
    onPageSizeChange,
    onPrev,
    onNext,
}: EntityPaginationBarProps) {
    if (totalCount === 0 && totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 mt-2 border-t border-black/10 dark:border-white/10 px-4 pb-3 gap-3 print:hidden">
            <div className="flex items-center gap-3">
                <p className="text-xs text-[var(--text-secondary)]">
                    ಪುಟ {currentPage} / {totalPages}
                </p>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--text-secondary)]">ಸಾಲುಗಳು:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="px-2 py-1 rounded-md bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
                    >
                        {pageSizeOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                    ({startIndex} - {endIndex} / {totalCount})
                </span>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={!canPrev}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[var(--text-primary)]"
                        title="ಹಿಂದಿನ ಪುಟ (Previous Page)"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-1 mx-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                            const page = start + i;
                            if (page > totalPages) return null;
                            return (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => onPageChange(page)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                        currentPage === page
                                            ? 'bg-[var(--primary)] text-white shadow-sm'
                                            : 'hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)]'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!canNext}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[var(--text-primary)]"
                        title="ಮುಂದಿನ ಪುಟ (Next Page)"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
