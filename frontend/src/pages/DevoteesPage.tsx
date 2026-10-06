import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Phone, Mail,
    Users, Filter, X,
    DatabaseZap, UserCircle2, Printer
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import DevoteeForm from '../components/DevoteeForm';
import type { DevoteeFormData } from '../components/DevoteeForm';
import DevoteeDetailsModal from '../components/DevoteeDetailsModal';
import RegistrationModal from '../components/RegistrationModal';
import ReceiptGenerator from '../components/ReceiptGenerator';
import PrintConfigModal from '../components/PrintConfigModal';
import EntityPaginationBar from '../components/EntityPaginationBar';
import { printTabularReport } from '../utils/printReport';
import { sevaApi, lookupApi } from '../api';
import { devoteeDirectory } from '../repositories';
import { useToast } from '../components/Toast';
import { useEntityCollection } from '../hooks/useEntityCollection';

export interface Devotee {
    DevoteeId: number;
    Name: string;
    Phone?: string;
    WhatsApp_Phone?: string;
    Email?: string;
    Gotra?: string;
    Nakshatra?: string;
    Address?: string;
    City?: string;
    PinCode?: string;
    PhotoPath?: string;
    IsDeleted?: boolean;
}

export default function DevoteesPage() {
    const [allDevotees, setAllDevotees] = useState<Devotee[]>([]);
    const [totalServerCount, setTotalServerCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Booking & Receipt state (Devotee-specific action flow)
    const [bookingDevotee, setBookingDevotee] = useState<Devotee | null>(null);
    const [showBooking, setShowBooking] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    // Advanced search state
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [advGotra, setAdvGotra] = useState('');
    const [advNakshatra, setAdvNakshatra] = useState('');
    const [advPinCode, setAdvPinCode] = useState('');
    const [advSevaCodes, setAdvSevaCodes] = useState<string[]>([]);
    const [advDateFrom, setAdvDateFrom] = useState('');
    const [advDateTo, setAdvDateTo] = useState('');

    // Lookups
    const [gotraList, setGotraList] = useState<string[]>([]);
    const [nakshatraList, setNakshatraList] = useState<{ nakshatra: string; raashi: string }[]>([]);
    const [sevaList, setSevaList] = useState<any[]>([]);

    const { showToast } = useToast();

    // Unified Entity Collection Seam
    const collection = useEntityCollection<Devotee>({
        items: allDevotees,
        totalCount: totalServerCount,
        storageKey: 'seva_page_size',
        defaultPageSize: 10,
        pageSizeOptions: [5, 10, 15, 20],
        getItemKey: (d) => d.DevoteeId,
        onSave: async (data: DevoteeFormData, isEdit: boolean, currentItem: Devotee | null) => {
            try {
                if (isEdit && currentItem) {
                    await devoteeDirectory.update(currentItem.DevoteeId, data);
                    showToast('success', `${data.Name || currentItem.Name} ನವೀಕರಿಸಲಾಗಿದೆ`);
                } else {
                    await devoteeDirectory.create(data);
                    showToast('success', `${data.Name} ಸೇರಿಸಲಾಗಿದೆ`);
                }
                setRefreshTrigger(p => p + 1);
            } catch (err: any) {
                const detail = err?.response?.data?.detail;
                showToast('error', detail || 'ಕಾರ್ಯ ವಿಫಲವಾಗಿದೆ');
                throw err;
            }
        },
        onDelete: async (d: Devotee) => {
            if (!confirm(`ನೀವು ಖಚಿತವಾಗಿ ${d.Name} ಅವರ ವಿವರಗಳನ್ನು ಅಳಿಸಲು ಬಯಸುವಿರಾ?`)) return;
            try {
                await devoteeDirectory.delete(d.DevoteeId);
                showToast('success', `${d.Name} ಅಳಿಸಲಾಗಿದೆ`);
                setAllDevotees(prev => prev.filter(item => item.DevoteeId !== d.DevoteeId));
                setRefreshTrigger(p => p + 1);
            } catch {
                showToast('error', 'ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ');
            }
        }
    });

    const {
        searchQuery,
        setSearchQuery,
        debouncedQuery,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        pageSizeOptions,
        paginatedItems: paginatedDevotees,
        totalCount,
        totalPages,
        startIndex,
        endIndex,
        canPrev,
        canNext,
        goToNextPage,
        goToPrevPage,
        viewingItem: viewDevotee,
        editingItem: editDevotee,
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

    // Fetch lookups once
    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [gotraRes, nakRes, sevaRes] = await Promise.all([
                    lookupApi.gotra(),
                    lookupApi.nakshatra(),
                    sevaApi.list(),
                ]);
                setGotraList(gotraRes.data);
                setNakshatraList(nakRes.data);
                setSevaList(sevaRes.data);
            } catch {
                /* optional */
            }
        };
        fetchLookups();
    }, []);

    // Fetch devotees on query / page changes
    useEffect(() => {
        const fetchDevotees = async () => {
            try {
                setLoading(true);
                if (!debouncedQuery.trim()) {
                    const skip = (currentPage - 1) * pageSize;
                    const res = await devoteeDirectory.list(skip, pageSize);
                    setAllDevotees(res.items);
                    setTotalServerCount(res.total);
                } else {
                    const items = await devoteeDirectory.searchBasic(debouncedQuery);
                    setAllDevotees(items);
                    setTotalServerCount(items.length);
                }
            } catch {
                showToast('error', 'ಭಕ್ತರ ಪಟ್ಟಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ');
            } finally {
                setLoading(false);
            }
        };

        fetchDevotees();
    }, [currentPage, pageSize, debouncedQuery, refreshTrigger]);

    // Advanced search handler
    const handleAdvancedSearch = async () => {
        const params: Record<string, string> = {};
        if (searchQuery.trim()) params.name = searchQuery;
        if (advPinCode) params.pin_code = advPinCode;
        if (advGotra) params.gotra = advGotra;
        if (advNakshatra) params.nakshatra = advNakshatra;
        if (advSevaCodes.length > 0) params.seva_codes = advSevaCodes.join(',');
        if (advDateFrom) params.date_from = advDateFrom;
        if (advDateTo) params.date_to = advDateTo;

        if (Object.keys(params).length === 0) {
            showToast('info', 'ಯಾವುದಾದರೂ ಶೋಧ ಮಾನದಂಡ ನಮೂದಿಸಿ');
            return;
        }

        try {
            setLoading(true);
            const results = await devoteeDirectory.searchAdvanced(params);
            setAllDevotees(results);
            setTotalServerCount(results.length);
            setCurrentPage(1);
            showToast('success', `${results.length} ಫಲಿತಾಂಶಗಳು ಕಂಡುಬಂದಿವೆ`);
        } catch {
            showToast('error', 'ಹುಡುಕಾಟ ವಿಫಲ');
        } finally {
            setLoading(false);
        }
    };

    const clearAdvancedSearch = () => {
        setAdvGotra('');
        setAdvNakshatra('');
        setAdvPinCode('');
        setAdvSevaCodes([]);
        setAdvDateFrom('');
        setAdvDateTo('');
        setShowAdvanced(false);
        setRefreshTrigger(p => p + 1);
    };

    const handleCleanup = async () => {
        if (!confirm('ಅಳಿಸಲಾದ ಭಕ್ತರ ಡೇಟಾವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಸ್ವಚ್ಛಗೊಳಿಸಬೇಕೇ? (ಇದು ಹಿಂಪಡೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ)')) return;
        try {
            setLoading(true);
            const res = await devoteeDirectory.cleanup();
            showToast('success', res.message || 'ಡೇಟಾ ಸ್ವಚ್ಛಗೊಳಿಸಲಾಗಿದೆ');
            setRefreshTrigger(p => p + 1);
        } catch {
            showToast('error', 'ಸ್ವಚ್ಛಗೊಳಿಸುವಿಕೆ ವಿಫಲವಾಗಿದೆ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
        >
            {/* Header controls: SearchBar, Add, Print, Filter, Cleanup */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
                <div className="flex-1 max-w-md">
                    <SearchBar
                        onSearch={(q: string) => {
                            setSearchQuery(q);
                            if (showAdvanced) setShowAdvanced(false);
                        }}
                        placeholder="ಹೆಸರು, ಫೋನ್ ಸಂಖ್ಯೆಯಿಂದ ಹುಡುಕಿ..."
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            showAdvanced
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                                : 'bg-white dark:bg-black/20 text-[var(--text-secondary)] border-black/10 dark:border-white/10 hover:border-[var(--primary)]/50'
                        }`}
                    >
                        <Filter size={14} />
                        ಸುಧಾರಿತ ಶೋಧ
                    </button>

                    <button
                        type="button"
                        onClick={openPrintModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-black/20 text-[var(--text-primary)] border border-black/10 dark:border-white/10 hover:border-[var(--primary)]/50 shadow-sm transition-all"
                    >
                        <Printer size={14} />
                        ಮುದ್ರಿಸಿ
                    </button>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--accent-saffron)] text-white shadow-md hover:shadow-orange-500/20 transition-all"
                    >
                        <Plus size={15} />
                        ಹೊಸ ಭಕ್ತರನ್ನು ಸೇರಿಸಿ
                    </button>
                </div>
            </div>

            {/* Advanced Search Panel */}
            <AnimatePresence>
                {showAdvanced && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden print:hidden"
                    >
                        <div className="p-4 rounded-2xl bg-white dark:bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <Filter size={16} className="text-[var(--primary)]" />
                                    ಸುಧಾರಿತ ಹುಡುಕಾಟ (Advanced Search)
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(false)}
                                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)]"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">ಗೋತ್ರ (Gotra)</label>
                                    <select
                                        value={advGotra}
                                        onChange={(e) => setAdvGotra(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                    >
                                        <option value="">ಎಲ್ಲಾ ಗೋತ್ರಗಳು</option>
                                        {gotraList.map((g) => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">ನಕ್ಷತ್ರ (Nakshatra)</label>
                                    <select
                                        value={advNakshatra}
                                        onChange={(e) => setAdvNakshatra(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                    >
                                        <option value="">ಎಲ್ಲಾ ನಕ್ಷತ್ರಗಳು</option>
                                        {nakshatraList.map((n) => <option key={n.nakshatra} value={n.nakshatra}>{n.nakshatra} ({n.raashi})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">ಪಿನ್ ಕೋಡ್ (Pin Code)</label>
                                    <input
                                        type="text"
                                        value={advPinCode}
                                        onChange={(e) => setAdvPinCode(e.target.value)}
                                        placeholder="ಉದಾ: 570001"
                                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">ದಿನಾಂಕದಿಂದ (From Date)</label>
                                    <input
                                        type="date"
                                        value={advDateFrom}
                                        onChange={(e) => setAdvDateFrom(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">ದಿನಾಂಕದವರೆಗೆ (To Date)</label>
                                    <input
                                        type="date"
                                        value={advDateTo}
                                        onChange={(e) => setAdvDateTo(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">ಸೇವೆ (Seva)</label>
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value && !advSevaCodes.includes(e.target.value)) {
                                                setAdvSevaCodes([...advSevaCodes, e.target.value]);
                                            }
                                        }}
                                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                    >
                                        <option value="">ಸೇವೆ ಆಯ್ಕೆಮಾಡಿ...</option>
                                        {sevaList.map((s) => <option key={s.SevaCode} value={s.SevaCode}>{s.Description}</option>)}
                                    </select>
                                    {advSevaCodes.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {advSevaCodes.map((code) => (
                                                <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold">
                                                    {code}
                                                    <button type="button" onClick={() => setAdvSevaCodes(advSevaCodes.filter(c => c !== code))}>
                                                        <X size={10} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                                <button
                                    type="button"
                                    onClick={clearAdvancedSearch}
                                    className="px-3.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
                                >
                                    ಅಳಿಸಿ (Clear)
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAdvancedSearch}
                                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white shadow-sm"
                                >
                                    ಹುಡುಕಿ (Search)
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Devotees List (Unified list view, no grid, row click opens locked detail modal per AGENTS.md) */}
            <div className="rounded-2xl bg-white/70 dark:bg-black/20 border border-black/5 dark:border-white/10 backdrop-blur-md overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[var(--text-secondary)]">
                                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">ಭಕ್ತರ ವಿವರ (Devotee)</th>
                                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">ಗೋತ್ರ & ನಕ್ಷತ್ರ</th>
                                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">ಸಂಪರ್ಕ (Contact)</th>
                                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">ವಿಳಾಸ (Address)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {paginatedDevotees.map((d) => (
                                <tr
                                    key={d.DevoteeId}
                                    onClick={() => openDetail(d)}
                                    className="hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer transition-colors group"
                                >
                                    {/* Devotee Info */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {d.PhotoPath ? (
                                                <img src={d.PhotoPath} alt="" className="w-9 h-9 rounded-full object-cover border border-[var(--primary)]/30 shrink-0" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                                                    <UserCircle2 size={20} />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                                                    {d.Name}
                                                </p>
                                                {d.DevoteeId && (
                                                    <p className="text-[10px] text-[var(--text-secondary)] font-mono">
                                                        #{d.DevoteeId}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Gotra & Nakshatra */}
                                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                                        <div className="space-y-0.5">
                                            {d.Gotra ? (
                                                <p className="font-medium text-[var(--text-primary)]">
                                                    ಗೋತ್ರ: <span className="font-semibold">{d.Gotra}</span>
                                                </p>
                                            ) : (
                                                <span className="text-[var(--text-secondary)]/50">—</span>
                                            )}
                                            {d.Nakshatra && (
                                                <p className="text-[10px] text-[var(--text-secondary)]">
                                                    ನಕ್ಷತ್ರ: {d.Nakshatra}
                                                </p>
                                            )}
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                                        <div className="space-y-0.5">
                                            {(d.Phone || d.WhatsApp_Phone) ? (
                                                <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-mono">
                                                    <Phone size={12} className="text-[var(--primary)] shrink-0" />
                                                    <span>{d.Phone || d.WhatsApp_Phone}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[var(--text-secondary)]/50">—</span>
                                            )}
                                            {d.Email && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] truncate max-w-[180px]">
                                                    <Mail size={11} className="shrink-0" />
                                                    <span className="truncate">{d.Email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Address */}
                                    <td className="px-4 py-3 text-[var(--text-secondary)] max-w-xs">
                                        <p className="truncate">
                                            {[d.Address, d.City, d.PinCode].filter(Boolean).join(', ') || '—'}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {paginatedDevotees.length === 0 && !loading && (
                    <div className="text-center py-16 text-[var(--text-secondary)]">
                        <Users size={44} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">{searchQuery ? `"${searchQuery}" ಗೆ ಫಲಿತಾಂಶಗಳಿಲ್ಲ` : 'ಭಕ್ತರು ಕಂಡುಬಂದಿಲ್ಲ'}</p>
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

            {/* Bottom Utility Bar: Soft-delete purge */}
            <div className="flex justify-end pt-1 print:hidden">
                <button
                    type="button"
                    onClick={handleCleanup}
                    className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                >
                    <DatabaseZap size={13} />
                    ಅಳಿಸಲಾದ ಭಕ್ತರ ಡೇಟಾ ಸ್ವಚ್ಛಗೊಳಿಸಿ (Purge deleted)
                </button>
            </div>

            {/* Centralized Detail Modal (max-w-2xl, max-h-[85vh], locked, inline editing) */}
            <DevoteeDetailsModal
                isOpen={Boolean(viewDevotee)}
                onClose={closeDetail}
                devotee={viewDevotee}
                onSave={async (data) => {
                    await handleSave(data);
                }}
                onDelete={(d) => handleDelete(d)}
                onBookSeva={(d) => {
                    setBookingDevotee(d);
                    setShowBooking(true);
                    closeDetail();
                }}
            />

            {/* Registration/Booking Modal */}
            <RegistrationModal
                isOpen={showBooking}
                onClose={() => {
                    setShowBooking(false);
                    setBookingDevotee(null);
                }}
                prefillDevotee={bookingDevotee}
                onSuccess={(data) => {
                    setShowBooking(false);
                    const firstInvoice = data.invoices[0];
                    const sevas = data.invoices.map((inv: any) => ({
                        description: inv.seva?.Description || inv.SevaCode,
                        amount: inv.Amount || 0,
                    }));
                    const hastodakaAmount = ((firstInvoice.GrandTotal || 0) - (firstInvoice.Amount || 0));
                    const totalAmount = data.invoices.reduce((sum: number, inv: any) => sum + (inv.Amount || 0), 0) + (hastodakaAmount > 0 ? hastodakaAmount : 0);

                    setReceiptData({
                        voucherNo: firstInvoice.VoucherNo || firstInvoice.RegistrationId?.toString() || 'VCH-XXX',
                        date: firstInvoice.RegistrationDate || firstInvoice.Date || new Date().toISOString(),
                        sevaDate: firstInvoice.SevaDate,
                        customerName: data.customer.Name || 'Unknown',
                        gotra: data.customer.Gotra || data.customer.Sgotra || '',
                        nakshatra: data.customer.Nakshatra || data.customer.SNakshatra || '',
                        sevas: sevas,
                        amount: totalAmount,
                        hastodakaAmount: hastodakaAmount > 0 ? hastodakaAmount : undefined,
                        paymentMode: firstInvoice.PaymentMode || firstInvoice.Payment_Mode || 'Cash',
                        phone: data.customer.Phone || '',
                        whatsappPhone: data.customer.WhatsApp_Phone || '',
                    });
                    setShowReceipt(true);
                }}
            />

            {/* Receipt Generator */}
            <ReceiptGenerator
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                receiptData={receiptData}
            />

            {/* Devotee Form Modal (Create) */}
            <DevoteeForm
                isOpen={showForm}
                onClose={closeCreate}
                onSubmit={async (data) => {
                    await handleSave(data);
                }}
                initialData={editDevotee || undefined}
                title={editDevotee ? `${editDevotee.Name} ಬದಲಿಸಿ` : 'ಹೊಸ ಭಕ್ತರನ್ನು ಸೇರಿಸಿ'}
                loading={loading}
            />

            {/* Multi-Page Tabular Print Configuration Modal */}
            <PrintConfigModal
                isOpen={showPrintModal}
                onClose={closePrintModal}
                totalItems={totalCount}
                defaultPageSize={pageSize}
                onPrint={async (chosenSize) => {
                    try {
                        let printItems: Devotee[] = [];
                        if (debouncedQuery.trim()) {
                            printItems = allDevotees;
                        } else {
                            const res = await devoteeDirectory.list(0, 5000);
                            printItems = res.items;
                        }

                        printTabularReport<Devotee>({
                            title: 'Devotees List',
                            items: printItems,
                            itemsPerPage: chosenSize,
                            columns: [
                                {
                                    header: '#',
                                    className: 'text-center font-mono',
                                    headerClassName: 'text-center',
                                    render: (_, idx) => idx,
                                },
                                {
                                    header: 'ಹೆಸರು (Name)',
                                    className: 'font-bold',
                                    render: (d) => d.Name || '—',
                                },
                                {
                                    header: 'ಗೋತ್ರ (Gotra)',
                                    render: (d) => d.Gotra || '—',
                                },
                                {
                                    header: 'ನಕ್ಷತ್ರ (Nakshatra)',
                                    render: (d) => d.Nakshatra || '—',
                                },
                                {
                                    header: 'ಫೋನ್ (Phone)',
                                    className: 'font-mono',
                                    render: (d) => d.Phone || d.WhatsApp_Phone || '—',
                                },
                                {
                                    header: 'ನಗರ (City)',
                                    render: (d) => [d.City, d.PinCode].filter(Boolean).join(' - ') || '—',
                                },
                            ],
                        });
                    } catch {
                        showToast('error', 'ಮುದ್ರಣ ವರದಿ ಸಿದ್ಧಪಡಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ');
                    }
                }}
            />
        </motion.div>
    );
}
