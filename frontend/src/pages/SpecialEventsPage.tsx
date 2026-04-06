import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Sparkles, Grid3X3, List, Loader2, 
    Plus, Edit3, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Clock, Key,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import SpecialEventForm from '../components/SpecialEventForm';
import type { SpecialEventFormData } from '../components/SpecialEventForm';
import { sevaApi } from '../api';
import { useToast } from '../components/Toast';

export default function SpecialEventsPage() {
    const [events, setEvents] = useState<SpecialEventFormData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(() => {
        const saved = localStorage.getItem('special_event_page_size');
        return saved ? parseInt(saved) : 10;
    });
    const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editEvent, setEditEvent] = useState<SpecialEventFormData | null>(null);
    
    const { showToast } = useToast();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await sevaApi.list();
            // Map the data
            const mapped = res.data
                .filter((s: any) => s.IsSpecialEvent === true)
                .map((s: any) => ({
                    ...s,
                    composite_sevas: s.composite_sevas?.map((c: any) => c.ChildSevaCode) || []
                }));
            setEvents(mapped);
        } catch {
            showToast('error', 'ಘಟನೆಗಳ ಪಟ್ಟಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ (Failed to load events)');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEvent = async (data: SpecialEventFormData) => {
        try {
            if (editEvent) {
                await sevaApi.update(editEvent.SevaCode, data);
                showToast('success', `${data.Description} ನವೀಕರಿಸಲಾಗಿದೆ`);
            } else {
                await sevaApi.create(data);
                showToast('success', `${data.Description} ಸೇರಿಸಲಾಗಿದೆ`);
            }
            setShowForm(false);
            setEditEvent(null);
            fetchEvents();
        } catch (err: any) {
            const detail = err?.response?.data?.detail || 'ಕಾರ್ಯ ವಿಫಲ';
            showToast('error', detail);
        }
    };

    const handleDeleteEvent = async (s: SpecialEventFormData) => {
        if (!confirm(`${s.Description} ಅಳಿಸಬೇಕೇ? (Are you sure you want to delete this event?)`)) return;
        try {
            await sevaApi.delete(s.SevaCode);
            showToast('success', `${s.Description} ಅಳಿಸಲಾಗಿದೆ`);
            fetchEvents();
        } catch {
            showToast('error', 'ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ (Delete failed)');
        }
    };

    const filteredAndSorted = useMemo(() => {
        let result = [...events];
        
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((s) =>
                s.Description?.toLowerCase().includes(q) ||
                s.SevaCode?.toLowerCase().includes(q)
            );
        }
        
        result.sort((a, b) => {
            const valA = a.Amount || 0;
            const valB = b.Amount || 0;
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });
        
        return result;
    }, [events, searchQuery, sortOrder]);

    const totalPages = Math.ceil(filteredAndSorted.length / pageSize);
    const paginatedEvents = filteredAndSorted.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortOrder, pageSize]);

    const formatSchedule = (evt: SpecialEventFormData) => {
        const parts = [];
        if (evt.EventDate && evt.RecurrenceRule !== 'None') {
            parts.push(`Repeats: ${evt.RecurrenceRule}`);
        } else if (evt.EventDate) {
            const d = evt.EventDate;
            const dt = `${d.substring(0, 2)}/${d.substring(2, 4)}/20${d.substring(4)}`;
            parts.push(dt);
        }
        
        if (evt.IsAllDay) parts.push('All-Day');
        else if (evt.StartTime) {
            let t = evt.StartTime;
            if (evt.EndTime) t += ` - ${evt.EndTime}`;
            parts.push(t);
        }
        return parts.join(' | ') || 'No specific schedule';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 size={32} className="animate-spin text-[var(--primary)] text-opacity-50" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => { setEditEvent(null); setShowForm(true); }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-saffron)] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                >
                    <Plus size={18} /> ಹೊಸ ಘಟನೆ ಸೇರಿಸಿ
                </button>
                <div className="flex items-center gap-2 ml-auto bg-[var(--glass-bg)] border border-[var(--glass-border)] px-3 py-2.5 rounded-xl">
                    <span className="text-xs text-[var(--text-secondary)] font-medium">Rows:</span>
                    <select value={pageSize} onChange={e => {
                        const newSize = Number(e.target.value);
                        setPageSize(newSize);
                        localStorage.setItem('special_event_page_size', String(newSize));
                    }}
                        className="bg-transparent text-xs text-[var(--text-primary)] focus:outline-none">
                        {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-center bg-[var(--glass-bg)] border border-[var(--glass-border)] p-2 rounded-2xl">
                <SearchBar
                    onSearch={setSearchQuery}
                    placeholder="ಕೋಡ್ ಅಥವಾ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ... (Search code or name)"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/20 rounded-xl text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors text-sm font-medium border border-transparent hover:border-[var(--glass-border)] whitespace-nowrap shrink-0"
                    >
                        <ArrowUpDown size={16} />
                        ರೂಪಾಯಿ {sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>}
                    </button>

                    <div className="h-8 w-px bg-[var(--glass-border)] mx-1 shrink-0" />
                    
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-xl transition-colors shrink-0 ${viewMode === 'grid' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] border border-transparent hover:border-[var(--glass-border)]'}`}
                    >
                        <Grid3X3 size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-xl transition-colors shrink-0 ${viewMode === 'list' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] border border-transparent hover:border-[var(--glass-border)]'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {filteredAndSorted.length === 0 ? (
                <div className="text-center py-16 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl">
                    <Sparkles size={48} className="mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                    <p className="text-[var(--text-secondary)] font-medium">ಯಾವುದೇ ವಿಶೇಷ ಘಟನೆ ಕಂಡುಬಂದಿಲ್ಲ (No special events found)</p>
                </div>
            ) : viewMode === 'grid' ? (
                // GRID VIEW
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedEvents.map((evt) => (
                        <motion.div
                            key={evt.SevaCode}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-5 flex flex-col hover:border-[var(--accent-saffron)]/50 transition-colors shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-mono font-bold bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded-md">
                                    {evt.SevaCode}
                                </span>
                                <h3 className="font-bold text-lg text-[var(--primary)]">₹{evt.Amount?.toLocaleString() || '0'}</h3>
                            </div>
                            
                            <h4 className="font-bold text-base text-[var(--text-primary)] mb-1">{evt.Description}</h4>
                            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex-1">
                                {evt.DescriptionEn || '—'}
                            </p>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-black/5 dark:bg-white/5 py-1 px-2 rounded">
                                    <Clock size={12} className="text-emerald-500" />
                                    {formatSchedule(evt)}
                                </div>
                                {(evt.composite_sevas?.length || 0) > 0 && (
                                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-black/5 dark:bg-white/5 py-1 px-2 rounded">
                                        <Key size={12} className="text-indigo-400" />
                                        {evt.composite_sevas?.length} Sub-Sevas Bundled
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-2 border-t border-[var(--glass-border)] pt-4 mt-auto">
                                <button
                                    onClick={() => { setEditEvent(evt); setShowForm(true); }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors text-sm font-medium"
                                >
                                    <Edit3 size={16} /> ತಿದ್ದು
                                </button>
                                <button
                                    onClick={() => handleDeleteEvent(evt)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-sm font-medium"
                                >
                                    <Trash2 size={16} /> ಅಳಿಸು
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                // LIST VIEW
                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Code</th>
                                    <th className="px-4 py-3 font-medium">ಹೆಸರು</th>
                                    <th className="px-4 py-3 font-medium">ವೇಳಾಪಟ್ಟಿ</th>
                                    <th className="px-4 py-3 font-medium text-right">ಶುಲ್ಕ</th>
                                    <th className="px-4 py-3 font-medium text-right">ಕ್ರಿಯೆಗಳು</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--glass-border)]">
                                {paginatedEvents.map((evt) => {
                                    const pyClass = pageSize <= 5 ? 'py-5' : pageSize <= 10 ? 'py-3' : 'py-2';
                                    return (
                                    <tr key={evt.SevaCode} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                        <td className={`px-4 ${pyClass} font-mono font-bold text-[var(--primary)] text-xs transition-all`}>
                                            {evt.SevaCode}
                                        </td>
                                        <td className={`px-4 ${pyClass} font-bold text-[var(--text-primary)] transition-all`}>
                                            {evt.Description}
                                            {evt.DescriptionEn && <span className="block text-xs text-[var(--text-secondary)] font-normal">{evt.DescriptionEn}</span>}
                                            {(evt.composite_sevas?.length || 0) > 0 && <span className="block text-xs font-bold text-indigo-400 mt-0.5">{evt.composite_sevas?.length} Sub-Sevas</span>}
                                        </td>
                                        <td className={`px-4 ${pyClass} text-[var(--text-secondary)] transition-all`}>
                                            {formatSchedule(evt)}
                                        </td>
                                        <td className={`px-4 ${pyClass} text-right font-bold text-[var(--text-primary)] transition-all`}>
                                            ₹{evt.Amount?.toLocaleString() || '0'}
                                        </td>
                                        <td className={`px-4 ${pyClass} transition-all`}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditEvent(evt); setShowForm(true); }}
                                                    className="p-1.5 rounded-md hover:bg-orange-100 text-[var(--text-secondary)] hover:text-orange-600 transition-colors"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEvent(evt)}
                                                    className="p-1.5 rounded-md hover:bg-red-100 text-[var(--text-secondary)] hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--glass-border)] bg-black/[0.02]">
                            <span className="text-xs text-[var(--text-secondary)] font-medium">Page {currentPage} of {totalPages}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors disabled:opacity-30"><ChevronLeft size={16}/></button>
                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: totalPages }).map((_, i) => {
                                        const p = i + 1;
                                        if (totalPages > 6 && Math.abs(p - currentPage) > 1 && p !== 1 && p !== totalPages) {
                                            if (p === 2 || p === totalPages - 1) return <span key={p} className="px-1 opacity-30">...</span>;
                                            return null;
                                        }
                                        return (
                                            <button key={p} onClick={() => setCurrentPage(p)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p ? 'bg-[var(--primary)] text-white shadow-md' : 'hover:bg-black/5 text-[var(--text-secondary)]'}`}>
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors disabled:opacity-30"><ChevronRight size={16}/></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <SpecialEventForm
                isOpen={showForm}
                onClose={() => { setShowForm(false); setEditEvent(null); }}
                onSubmit={handleSaveEvent}
                initialData={editEvent || undefined}
                isEdit={!!editEvent}
                title={editEvent ? 'ಘಟನೆ ತಿದ್ದುಪಡಿ ಮಾಡಿ (Edit Event)' : 'ಹೊಸ ವಿಶೇಷ ಘಟನೆ ಸೇರಿಸಿ (Add Event)'}
            />
        </div>
    );
}
