import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    HeartHandshake, Loader2, 
    Plus, ArrowUpDown, ArrowUp, ArrowDown,
    Printer
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import SevaForm from '../components/SevaForm';
import SevaDetailsModal from '../components/SevaDetailsModal';
import PrintConfigModal from '../components/PrintConfigModal';
import EntityPaginationBar from '../components/EntityPaginationBar';
import { printTabularReport } from '../utils/printReport';
import { sevaApi } from '../api';
import { useToast } from '../components/Toast';
import { useEntityCollection } from '../hooks/useEntityCollection';

export interface SevaItem {
    SevaCode: string;
    Description: string;
    DescriptionEn?: string;
    Amount: number;
    TPQty: number;
    PrasadaAddonLimit?: number;
    IsSpecialEvent?: boolean;
    EventDate?: string;
    StartTime?: string;
    EndTime?: string;
    IsAllDay?: boolean;
    RecurrenceRule?: string;
}

export default function SevasPage() {
    const [sevas, setSevas] = useState<SevaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    
    const { showToast } = useToast();

    const fetchSevas = async () => {
        setLoading(true);
        try {
            const res = await sevaApi.list();
            setSevas((res.data || []).filter((s: any) => s.SevaCode && s.Description));
        } catch {
            showToast('error', 'ಸೇವೆಗಳ ಪಟ್ಟಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSevas();
    }, []);

    // Unified Entity Collection Seam
    const collection = useEntityCollection<SevaItem>({
        items: sevas,
        storageKey: 'seva_page_size_pref',
        defaultPageSize: 10,
        pageSizeOptions: [5, 10, 15, 20],
        filterFn: (s, query) => {
            if (!query.trim()) return true;
            const rawQ = query.toLowerCase().trim();
            const cleanQ = rawQ.replace(/^[#\s]+/, '');
            const descKn = (s.Description || '').toLowerCase();
            const descEn = (s.DescriptionEn || '').toLowerCase();
            const code = (s.SevaCode || '').toLowerCase();
            const amountStr = (s.Amount !== undefined && s.Amount !== null) ? s.Amount.toString() : '';

            return (
                descKn.includes(rawQ) ||
                (Boolean(cleanQ) && descKn.includes(cleanQ)) ||
                descEn.includes(rawQ) ||
                (Boolean(cleanQ) && descEn.includes(cleanQ)) ||
                code.includes(rawQ) ||
                (Boolean(cleanQ) && code.includes(cleanQ)) ||
                (Boolean(amountStr) && amountStr.includes(rawQ))
            );
        },
        sortFn: (a, b) => {
            const valA = a.Amount || 0;
            const valB = b.Amount || 0;
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        },
        getItemKey: (s) => s.SevaCode,
        onSave: async (data: SevaItem, isEdit: boolean, currentItem: SevaItem | null) => {
            try {
                if (isEdit && currentItem) {
                    const res = await sevaApi.update(currentItem.SevaCode, data);
                    showToast('success', `${data.Description} ನವೀಕರಿಸಲಾಗಿದೆ`);
                    const updated = res.data || data;
                    setSevas((prev) => prev.map((s) => (s.SevaCode === currentItem.SevaCode ? updated : s)));
                } else {
                    const res = await sevaApi.create(data);
                    showToast('success', `${data.Description} ಸೇರಿಸಲಾಗಿದೆ`);
                    const created = res.data || data;
                    setSevas((prev) => [created, ...prev.filter((s) => s.SevaCode !== created.SevaCode)]);
                }
                fetchSevas();
            } catch (err: any) {
                const detail = err?.response?.data?.detail || 'ಕಾರ್ಯ ವಿಫಲ';
                showToast('error', detail);
                throw err;
            }
        },
        onDelete: async (s: SevaItem) => {
            if (!confirm(`${s.Description} ಅಳಿಸಬೇಕೇ?`)) return;
            try {
                await sevaApi.delete(s.SevaCode);
                showToast('success', `${s.Description} ಅಳಿಸಲಾಗಿದೆ`);
                setSevas((prev) => prev.filter((item) => item.SevaCode !== s.SevaCode));
                fetchSevas();
            } catch (err: any) {
                const detail = err?.response?.data?.detail || 'ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ';
                showToast('error', detail);
            }
        }
    });

    const {
        searchQuery,
        setSearchQuery,
        filteredItems,
        paginatedItems: paginatedSevas,
        totalCount,
        totalPages,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        pageSizeOptions,
        startIndex,
        endIndex,
        canPrev,
        canNext,
        goToNextPage,
        goToPrevPage,
        viewingItem: viewSeva,
        editingItem: editSeva,
        isCreating: showForm,
        openDetail,
        closeDetail,
        openCreate,
        closeCreate,
        showPrintModal,
        openPrintModal,
        closePrintModal,
        handleSave,
        handleDelete,
    } = collection;

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[var(--accent-saffron)]" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <HeartHandshake size={28} className="text-[var(--accent-saffron)]" />
                        ಸೇವೆಗಳು ಮತ್ತು ಪ್ರಸಾದ
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {sevas.length} ರಲ್ಲಿ {filteredItems.length} ಸೇವೆಗಳು
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <SearchBar placeholder="ಸೇವೆಗಳನ್ನು ಹುಡುಕಿ..." onSearch={setSearchQuery} />
                    
                    <button
                        type="button"
                        onClick={toggleSortOrder}
                        className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--primary)] bg-white dark:bg-black/20 transition-all flex items-center gap-2 text-xs font-bold"
                        title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                    >
                        {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        ₹
                    </button>

                    <button
                        type="button"
                        onClick={openPrintModal}
                        className="p-3 rounded-xl bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all shadow-sm shrink-0"
                        title="Print List"
                    >
                        <Printer size={18} />
                    </button>
                    
                    <button
                        type="button"
                        onClick={openCreate}
                        className="px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-amber-500 text-white font-bold shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 shrink-0"
                    >
                        <Plus size={18} /> <span className="hidden sm:inline">Add New Seva</span>
                    </button>
                </div>
            </div>

            {/* List View: Unified list view, no grid, row click opens locked detail modal per AGENTS.md */}
            <div className="glass-card overflow-hidden print:shadow-none print:border-none print:bg-transparent">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-black/10 font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider">
                            <th className="pb-3 pt-4 pl-4 w-28">ಕೋಡ್</th>
                            <th className="pb-3 pt-4">ವಿವರಣೆ</th>
                            <th className="pb-3 pt-4 text-right cursor-pointer hover:text-[var(--primary)] transition-colors" onClick={toggleSortOrder}>
                                <div className="flex items-center justify-end gap-1">
                                    ಶುಲ್ಕ
                                    <ArrowUpDown size={12} />
                                </div>
                            </th>
                            <th className="pb-3 pt-4 text-right pr-4 hidden md:table-cell"># of Hastodaka included</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSevas.map((s) => {
                            const pyClass = pageSize <= 5 ? 'py-6' : pageSize <= 10 ? 'py-4' : 'py-2';
                            return (
                                <tr
                                    key={s.SevaCode}
                                    className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors group cursor-pointer"
                                    onClick={() => openDetail(s)}
                                >
                                    <td className={`${pyClass} pl-4 transition-all`}>
                                        <span className="px-2 py-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] font-mono font-bold text-xs border border-[var(--primary)]/20">
                                            {s.SevaCode}
                                        </span>
                                    </td>
                                    <td className={`${pyClass} transition-all`}>
                                        <div className={`font-medium ${pageSize <= 5 ? 'text-lg' : 'text-base'}`}>{s.Description}</div>
                                        {s.DescriptionEn && <div className={`${pageSize <= 5 ? 'text-xs' : 'text-[10px]'} text-[var(--text-secondary)]`}>{s.DescriptionEn}</div>}
                                    </td>
                                    <td className={`${pyClass} text-right font-mono font-bold transition-all`}>
                                        {(s.Amount ?? 0) > 0 ? (
                                            <span className="text-emerald-400 font-mono text-base font-bold">₹{s.Amount?.toLocaleString()}</span>
                                        ) : (
                                            <span className="text-amber-600 dark:text-amber-400 font-sans text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                                                ಸೇವೆ ಕಾಯ್ದಿರಿಸುವಾಗ ನಮೂದಿಸಬೇಕು
                                            </span>
                                        )}
                                    </td>
                                    <td className={`${pyClass} text-right pr-4 text-sm text-[var(--text-secondary)] hidden md:table-cell transition-all font-mono`}>
                                        {(s.TPQty ?? 0) > 0 ? `${s.TPQty}` : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Empty State */}
                {filteredItems.length === 0 && (
                    <div className="text-center py-12 text-[var(--text-secondary)]">
                        {searchQuery ? `"${searchQuery}" ಗೆ ಸೇವೆಗಳಿಲ್ಲ` : 'ಸೇವೆಗಳು ಲಭ್ಯವಿಲ್ಲ'}
                    </div>
                )}

                {/* Standardized Pagination Bar */}
                <EntityPaginationBar
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    pageSizeOptions={pageSizeOptions}
                    totalCount={totalCount}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    canPrev={canPrev}
                    canNext={canNext}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    onPrev={goToPrevPage}
                    onNext={goToNextPage}
                />
            </div>
            
            {/* Create / Edit Form Modal */}
            <SevaForm
                isOpen={showForm}
                onClose={closeCreate}
                onSubmit={handleSave}
                initialData={editSeva || undefined}
                isEdit={Boolean(editSeva)}
                existingSevas={sevas}
                title={editSeva ? 'ಸೇವೆ ಬದಲಿಸಿ' : 'ಹೊಸ ಸೇವೆ ಸೇರಿಸಿ'}
            />
            
            {/* Centralized Detail Modal (max-w-2xl, max-h-[85vh], locked, inline editing) */}
            <SevaDetailsModal
                isOpen={Boolean(viewSeva)}
                onClose={closeDetail}
                seva={viewSeva}
                onSave={handleSave}
                onDelete={handleDelete}
                existingSevas={sevas}
            />

            {/* Print Configuration Modal */}
            <PrintConfigModal
                isOpen={showPrintModal}
                onClose={closePrintModal}
                totalItems={filteredItems.length}
                defaultPageSize={pageSize}
                onPrint={(chosenSize) => {
                    printTabularReport<SevaItem>({
                        title: 'Sevas List',
                        items: filteredItems,
                        itemsPerPage: chosenSize,
                        columns: [
                            {
                                header: '#',
                                className: 'text-center font-mono',
                                headerClassName: 'text-center',
                                render: (_, idx) => idx
                            },
                            {
                                header: 'ಸೇವಾ ಕೋಡ್ (Code)',
                                className: 'font-mono font-bold',
                                render: (s) => s.SevaCode || '—'
                            },
                            {
                                header: 'ವಿವರಣೆ (Kannada)',
                                className: 'font-bold',
                                render: (s) => s.Description || '—'
                            },
                            {
                                header: 'Description (English)',
                                render: (s) => s.DescriptionEn || '—'
                            },
                            {
                                header: 'ಮೊತ್ತ (Amount)',
                                className: 'text-right font-mono font-bold',
                                headerClassName: 'text-right',
                                render: (s) => (s.Amount ?? 0) > 0 ? `₹${s.Amount}` : 'ಸೇವೆ ಕಾಯ್ದಿರಿಸುವಾಗ ನಮೂದಿಸಬೇಕು (To be specified at booking)'
                            },
                            {
                                header: '# of Hastodaka included',
                                className: 'text-center font-mono',
                                headerClassName: 'text-center',
                                render: (s) => s.TPQty ?? 0
                            }
                        ]
                    });
                }}
            />
        </motion.div>
    );
}
