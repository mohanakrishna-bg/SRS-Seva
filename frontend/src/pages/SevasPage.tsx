import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    HeartHandshake, Grid3X3, List, Loader2, 
    Plus, Edit3, Trash2, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import SevaForm from '../components/SevaForm';
import { sevaApi } from '../api';
import { useToast } from '../components/Toast';

interface SevaItem {
    SevaCode: string;
    Description: string;
    DescriptionEn?: string;
    Amount: number;
    TPQty: number;
    PrasadaAddonLimit?: number;
}

export default function SevasPage() {
    const [sevas, setSevas] = useState<SevaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(() => {
        const saved = localStorage.getItem('seva_page_size_pref');
        return saved ? parseInt(saved) : 10;
    });
    const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];
    
    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editSeva, setEditSeva] = useState<SevaItem | null>(null);
    
    const { showToast } = useToast();

    useEffect(() => {
        fetchSevas();
    }, []);

    const fetchSevas = async () => {
        setLoading(true);
        try {
            const res = await sevaApi.list();
            // Filter out invalid items if any and map to interface
            setSevas(res.data.filter((s: any) => s.SevaCode && s.Description));
        } catch {
            showToast('error', 'ಸೇವೆಗಳ ಪಟ್ಟಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSeva = async (data: SevaItem) => {
        try {
            if (editSeva) {
                await sevaApi.update(editSeva.SevaCode, data);
                showToast('success', `${data.Description} ನವೀಕರಿಸಲಾಗಿದೆ`);
            } else {
                await sevaApi.create(data);
                showToast('success', `${data.Description} ಸೇರಿಸಲಾಗಿದೆ`);
            }
            setShowForm(false);
            setEditSeva(null);
            fetchSevas();
        } catch (err: any) {
            const detail = err?.response?.data?.detail || 'ಕಾರ್ಯ ವಿಫಲ';
            showToast('error', detail);
        }
    };

    const handleDeleteSeva = async (s: SevaItem) => {
        if (!confirm(`${s.Description} ಅಳಿಸಬೇಕೇ?`)) return;
        try {
            await sevaApi.delete(s.SevaCode);
            showToast('success', `${s.Description} ಅಳಿಸಲಾಗಿದೆ`);
            fetchSevas();
        } catch {
            showToast('error', 'ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ');
        }
    };

    const filteredAndSorted = useMemo(() => {
        let result = [...sevas];
        
        // Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((s) =>
                s.Description?.toLowerCase().includes(q) ||
                s.SevaCode?.toLowerCase().includes(q)
            );
        }
        
        // Sort
        result.sort((a, b) => {
            const valA = a.Amount || 0;
            const valB = b.Amount || 0;
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });
        
        return result;
    }, [sevas, searchQuery, sortOrder]);

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const totalPages = Math.ceil(filteredAndSorted.length / pageSize);
    const paginatedSevas = filteredAndSorted.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortOrder, pageSize]);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <HeartHandshake size={28} className="text-[var(--accent-saffron)]" />
                        ಸೇವೆಗಳು ಮತ್ತು ಪ್ರಸಾದ
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {sevas.length} ರಲ್ಲಿ {filteredAndSorted.length} ಸೇವೆಗಳು
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <SearchBar placeholder="ಸೇವೆಗಳನ್ನು ಹುಡುಕಿ..." onSearch={setSearchQuery} />
                    
                    <button
                        onClick={toggleSortOrder}
                        className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--primary)] bg-white dark:bg-black/20 transition-all flex items-center gap-2 text-xs font-bold"
                        title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                    >
                        {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        ₹
                    </button>

                    <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-black/10 dark:border-white/10 overflow-hidden shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'}`}
                        >
                            <Grid3X3 size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>

                    <button
                        onClick={() => { setEditSeva(null); setShowForm(true); }}
                        className="px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-amber-500 text-white font-bold shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 shrink-0"
                    >
                        <Plus size={18} /> <span className="hidden sm:inline">Add New Seva</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 mb-2">
                <span className="text-xs text-[var(--text-secondary)] font-medium">Items per page:</span>
                <select value={pageSize} onChange={e => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    localStorage.setItem('seva_page_size_pref', String(newSize));
                }}
                    className="px-2 py-1.5 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]">
                    {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paginatedSevas.map((s) => (
                        <motion.div
                            key={s.SevaCode}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card hover:border-[var(--primary)]/30 transition-colors group relative"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-lg leading-tight pr-8">{s.Description}</h3>
                                <span className="text-emerald-400 font-mono text-lg font-bold shrink-0">
                                    ₹{s.Amount?.toLocaleString() ?? '—'}
                                </span>
                            </div>
                            
                            {(s.TPQty ?? 0) > 0 && (
                                <div className="flex items-center gap-2 text-sm bg-[var(--glass-bg)] p-2 rounded-lg mb-4">
                                    <span className="w-2 h-2 rounded-full bg-[var(--accent-saffron)]" />
                                    ಪ್ರಸಾದ: {s.TPQty} ಜನರಿಗೆ
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => { setEditSeva(s); setShowForm(true); }}
                                    className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors"
                                >
                                    <Edit3 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDeleteSeva(s)}
                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="glass-card overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/10 font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider">
                                <th className="pb-3 pt-4 pl-4">ವಿವರಣೆ</th>
                                <th className="pb-3 pt-4 text-right cursor-pointer hover:text-[var(--primary)] transition-colors" onClick={toggleSortOrder}>
                                    <div className="flex items-center justify-end gap-1">
                                        ಶುಲ್ಕ
                                        <ArrowUpDown size={12} />
                                    </div>
                                </th>
                                <th className="pb-3 pt-4 text-right hidden md:table-cell">ಪ್ರಸಾದ</th>
                                <th className="pb-3 pt-4 text-right pr-4">ಕ್ರಿಯೆಗಳು</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedSevas.map((s) => {
                                const pyClass = pageSize <= 5 ? 'py-6' : pageSize <= 10 ? 'py-4' : 'py-2';
                                return (
                                <tr key={s.SevaCode} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors group">
                                    <td className={`${pyClass} pl-4 transition-all`}>
                                        <div className={`font-medium ${pageSize <= 5 ? 'text-lg' : 'text-base'}`}>{s.Description}</div>
                                        {s.DescriptionEn && <div className={`${pageSize <= 5 ? 'text-xs' : 'text-[10px]'} text-[var(--text-secondary)]`}>{s.DescriptionEn}</div>}
                                    </td>
                                    <td className={`${pyClass} text-right text-emerald-400 font-mono font-bold transition-all`}>₹{s.Amount?.toLocaleString() ?? '—'}</td>
                                    <td className={`${pyClass} text-right text-sm text-[var(--text-secondary)] hidden md:table-cell transition-all`}>
                                        {(s.TPQty ?? 0) > 0 ? `${s.TPQty} ಜನರು` : '—'}
                                    </td>
                                    <td className={`${pyClass} text-right pr-4 transition-all`}>
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => { setEditSeva(s); setShowForm(true); }}
                                                className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSeva(s)}
                                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--glass-border)]">
                            <span className="text-xs text-[var(--text-secondary)]">Showing page {currentPage} of {totalPages}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 disabled:opacity-50 transition-colors"><ArrowUpDown size={16} className="rotate-90"/></button>
                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: totalPages }).map((_, i) => {
                                        const p = i + 1;
                                        return (
                                            <button key={p} onClick={() => setCurrentPage(p)}
                                                className={`w-7 h-7 rounded text-xs font-bold transition-colors ${currentPage === p ? 'bg-[var(--primary)] text-white' : 'hover:bg-black/5'}`}>
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 disabled:opacity-50 transition-colors"><ArrowUpDown size={16} className="-rotate-90"/></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {filteredAndSorted.length === 0 && (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                    {searchQuery ? `"${searchQuery}" ಗೆ ಸೇವೆಗಳಿಲ್ಲ` : 'ಸೇವೆಗಳು ಲಭ್ಯವಿಲ್ಲ'}
                </div>
            )}
            
            <SevaForm
                isOpen={showForm}
                onClose={() => { setShowForm(false); setEditSeva(null); }}
                onSubmit={handleSaveSeva}
                initialData={editSeva || undefined}
                isEdit={!!editSeva}
                title={editSeva ? 'ಸೇವೆ ಬದಲಿಸಿ' : 'ಹೊಸ ಸೇವೆ ಸೇರಿಸಿ'}
            />
        </motion.div>
    );
}
