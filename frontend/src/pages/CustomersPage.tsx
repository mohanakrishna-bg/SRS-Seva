import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Phone, Mail, ChevronLeft, ChevronRight,
    Trash2, Edit3, Users, Search, Filter, X,
    DatabaseZap, UserCircle2
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CustomerForm from '../components/CustomerForm';
import DevoteeDetailsModal from '../components/DevoteeDetailsModal';
import RegistrationModal from '../components/RegistrationModal';
import ReceiptGenerator from '../components/ReceiptGenerator';
import { devoteeApi, sevaApi, lookupApi } from '../api';
import { useToast } from '../components/Toast';

interface Devotee {
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

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

export default function CustomersPage() {
    const [allDevotees, setAllDevotees] = useState<Devotee[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(() => {
        const saved = localStorage.getItem('seva_page_size');
        return saved ? parseInt(saved) : DEFAULT_PAGE_SIZE;
    });
    const [loading, setLoading] = useState(true);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editDevotee, setEditDevotee] = useState<Devotee | null>(null);

    // Detail & Booking state
    const [viewDevotee, setViewDevotee] = useState<Devotee | null>(null);
    const [bookingDevotee, setBookingDevotee] = useState<Devotee | null>(null);
    const [showBooking, setShowBooking] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    // Advanced search
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [advGotra, setAdvGotra] = useState('');
    const [advNakshatra, setAdvNakshatra] = useState('');
    const [advPinCode, setAdvPinCode] = useState('');
    const [advSevaCodes, setAdvSevaCodes] = useState<string[]>([]);
    const [advDateFrom, setAdvDateFrom] = useState('');
    const [advDateTo, setAdvDateTo] = useState('');

    // Lookup data
    const [gotraList, setGotraList] = useState<string[]>([]);
    const [nakshatraList, setNakshatraList] = useState<{ nakshatra: string; raashi: string }[]>([]);
    const [sevaList, setSevaList] = useState<any[]>([]);

    const { showToast } = useToast();

    // Fetch devotees
    useEffect(() => {
        fetchDevotees();
        fetchLookups();
    }, []);

    const fetchDevotees = async () => {
        try {
            setLoading(true);
            const res = await devoteeApi.list();
            setAllDevotees(res.data);
        } catch {
            showToast('error', 'ಭಕ್ತರ ಪಟ್ಟಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ (Failed to load devotees)');
        } finally {
            setLoading(false);
        }
    };

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
            /* lookups are optional */
        }
    };

    // Client-side basic filtering
    const filteredDevotees = useMemo(() => {
        if (!searchQuery.trim()) return allDevotees;
        const q = searchQuery.toLowerCase();
        return allDevotees.filter(
            (d) =>
                d.Name?.toLowerCase().includes(q) ||
                d.Phone?.toLowerCase().includes(q)
        );
    }, [allDevotees, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredDevotees.length / pageSize);
    const paginatedDevotees = filteredDevotees.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleSearch = useCallback((q: string) => {
        setSearchQuery(q);
        setShowAdvanced(false);
    }, []);

    // Advanced search
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
            showToast('info', 'ಯಾವುದಾದರೂ ಶೋಧ ಮಾನದಂಡ ನಮೂದಿಸಿ (Enter at least one criteria)');
            return;
        }

        try {
            setLoading(true);
            const res = await devoteeApi.searchAdvanced(params);
            setAllDevotees(res.data);
            setCurrentPage(1);
            showToast('success', `${res.data.length} ಫಲಿತಾಂಶಗಳು ಕಂಡುಬಂದಿವೆ (results found)`);
        } catch {
            showToast('error', 'ಹುಡುಕಾಟ ವಿಫಲ (Search failed)');
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
        fetchDevotees();
    };

    // CRUD handlers
    const handleSaveDevotee = async (data: any) => {
        if (loading) return;
        try {
            setLoading(true);
            if (editDevotee) {
                await devoteeApi.update(editDevotee.DevoteeId, data);
                showToast('success', `${data.Name} ನವೀಕರಿಸಲಾಗಿದೆ`);
            } else {
                await devoteeApi.create(data);
                showToast('success', `${data.Name} ಸೇರಿಸಲಾಗಿದೆ`);
            }
            setShowForm(false);
            setEditDevotee(null);
            fetchDevotees();
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            showToast('error', detail || 'ಕಾರ್ಯ ವಿಫಲ (Operation failed)');
            setLoading(false);
        }
    };

    const handleSoftDelete = async (d: Devotee) => {
        // Stop row click (details) propagation is already done in row buttons
        if (!confirm(`${d.Name} ಅಳಿಸಬೇಕೇ? (Delete Devotee?)`)) return;
        try {
            setLoading(true);
            await devoteeApi.delete(d.DevoteeId);
            showToast('success', `${d.Name} ಅಳಿಸಲಾಗಿದೆ (Soft deleted)`);
            setViewDevotee(null); 
            fetchDevotees();
        } catch {
            showToast('error', 'ಅಳಿಸಲಾಗಲಿಲ್ಲ (Delete failed)');
            setLoading(false);
        }
    };

    const handleDatabaseCleanup = async () => {
        if (!confirm('ಎಚ್ಚರಿಕೆ! ಅಳಿಸಲಾದ ಎಲ್ಲ ಭಕ್ತರನ್ನು ಶಾಶ್ವತವಾಗಿ ತೆಗೆಯಲಾಗುತ್ತದೆ.\n\nWARNING: All soft-deleted devotees will be permanently purged. This cannot be undone.\n\nProceed?')) return;
        try {
            const res = await devoteeApi.cleanup();
            showToast('success', res.data.detail);
        } catch {
            showToast('error', 'Cleanup failed');
        }
    };

    const changePageSize = (size: number) => {
        setPageSize(size);
        localStorage.setItem('seva_page_size', String(size));
        setCurrentPage(1);
    };

    const toggleSevaCode = (code: string) => {
        setAdvSevaCodes((prev) =>
            prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
                        <Users size={28} className="text-[var(--primary)]" />
                        ಭಕ್ತರು
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {allDevotees.length.toLocaleString()} ರಲ್ಲಿ {filteredDevotees.length.toLocaleString()} ಭಕ್ತರು
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <SearchBar
                        placeholder="ಹೆಸರು / ಫೋನ್ ಹುಡುಕಿ..."
                        onSearch={handleSearch}
                    />
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`p-3 rounded-xl transition-all border shrink-0 ${showAdvanced
                            ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                            : 'bg-white dark:bg-black/20 border-black/10 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--primary)]'
                            }`}
                        title="Advanced Search"
                    >
                        <Filter size={18} />
                    </button>
                    <button
                        onClick={() => { setEditDevotee(null); setShowForm(true); }}
                        className="px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-amber-500 text-white font-bold shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 shrink-0"
                    >
                        <Plus size={18} /> <span className="hidden sm:inline">Add New</span>
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
                        className="overflow-hidden"
                    >
                        <div className="glass-card p-5 space-y-4 border-l-4 border-l-[var(--primary)]">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <Filter size={16} className="text-[var(--primary)]" />
                                    ಸುಧಾರಿತ ಹುಡುಕಾಟ
                                </h3>
                                <button onClick={clearAdvancedSearch} className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors flex items-center gap-1">
                                    <X size={12} /> Clear
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* PIN Code */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಪಿನ್ ಕೋಡ್</label>
                                    <input
                                        type="text"
                                        value={advPinCode}
                                        onChange={(e) => setAdvPinCode(e.target.value)}
                                        placeholder="570001"
                                        maxLength={6}
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] text-sm"
                                    />
                                </div>

                                {/* Gotra */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಗೋತ್ರ</label>
                                    <select
                                        value={advGotra}
                                        onChange={(e) => setAdvGotra(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] text-sm"
                                    >
                                        <option value="">-- ಎಲ್ಲಾ --</option>
                                        {gotraList.map((g) => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Nakshatra */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ನಕ್ಷತ್ರ</label>
                                    <select
                                        value={advNakshatra}
                                        onChange={(e) => setAdvNakshatra(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] text-sm"
                                    >
                                        <option value="">-- ಎಲ್ಲಾ --</option>
                                        {nakshatraList.map((n) => (
                                            <option key={n.nakshatra} value={n.nakshatra}>
                                                {n.nakshatra} ({n.raashi})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Seva multi-select */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ನೋಂದಾಯಿತ ಸೇವೆ</label>
                                <div className="flex flex-wrap gap-2">
                                    {sevaList.map((s: any) => (
                                        <button
                                            key={s.SevaCode}
                                            onClick={() => toggleSevaCode(s.SevaCode)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${advSevaCodes.includes(s.SevaCode)
                                                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                                                : 'bg-white dark:bg-black/20 text-[var(--text-secondary)] border-black/10 dark:border-white/10 hover:border-[var(--primary)]/50'
                                                }`}
                                        >
                                            {s.Description} (₹{s.Amount})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date range (only when seva is selected) */}
                            {advSevaCodes.length > 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ನೋಂದಣಿ ಮೊದಲ ದಿನಾಂಕ (From)</label>
                                        <input
                                            type="date"
                                            value={advDateFrom}
                                            onChange={(e) => {
                                                const d = e.target.value;
                                                if (d) {
                                                    const [y, m, day] = d.split('-');
                                                    setAdvDateFrom(`${day}${m}${y.slice(-2)}`);
                                                } else {
                                                    setAdvDateFrom('');
                                                }
                                            }}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ನೋಂದಣಿ ಕೊನೆಯ ದಿನಾಂಕ (To)</label>
                                        <input
                                            type="date"
                                            value={advDateTo}
                                            onChange={(e) => {
                                                const d = e.target.value;
                                                if (d) {
                                                    const [y, m, day] = d.split('-');
                                                    setAdvDateTo(`${day}${m}${y.slice(-2)}`);
                                                } else {
                                                    setAdvDateTo('');
                                                }
                                            }}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] text-sm"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            <button
                                onClick={handleAdvancedSearch}
                                className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
                            >
                                <Search size={16} /> ಹುಡುಕಿ (Search)
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Database Cleanup Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleDatabaseCleanup}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors flex items-center gap-1.5 border border-amber-200 dark:border-amber-500/20"
                    title="Permanently purge soft-deleted devotees"
                >
                    <DatabaseZap size={14} /> Cleanup Deleted
                </button>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/10 dark:border-white/10">
                                <th className="pb-3 pt-3 w-12 pl-4"></th>
                                <th className="pb-3 pt-3 font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider">ಹೆಸರು / ಗೋತ್ರ</th>
                                <th className="pb-3 pt-3 font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider">ಸಂಪರ್ಕ</th>
                                <th className="pb-3 pt-3 font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider hidden lg:table-cell">ನಗರ / ಪಿನ್</th>
                                <th className="pb-3 pt-3 font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider text-right pr-4">ಕ್ರಿಯೆಗಳು</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDevotees.map((d) => (
                                <tr
                                    key={d.DevoteeId}
                                    onClick={() => setViewDevotee(d)}
                                    className={`border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                                        pageSize <= 5 ? 'py-6 px-4' : pageSize <= 10 ? 'py-4 px-4' : 'py-2 px-4'
                                    }`}
                                >
                                     <td className={`pl-4 ${pageSize <= 5 ? 'py-6' : pageSize <= 10 ? 'py-4' : 'py-2'} transition-all`}></td>
                                     <td className={`${pageSize <= 5 ? 'py-6' : pageSize <= 10 ? 'py-4' : 'py-2'} transition-all`}>
                                         {d.PhotoPath ? (
                                             <img src={d.PhotoPath} alt="" className={`${pageSize <= 10 ? 'w-16 h-16' : 'w-9 h-9'} rounded-full object-cover border-2 border-[var(--glass-border)] transition-all`} />
                                         ) : (
                                             <div className={`${pageSize <= 10 ? 'w-16 h-16' : 'w-9 h-9'} rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] transition-all`}>
                                                 <UserCircle2 size={pageSize <= 10 ? 32 : 20} />
                                             </div>
                                         )}
                                     </td>
                                     <td className={`${pageSize <= 5 ? 'py-6' : pageSize <= 10 ? 'py-4' : 'py-2'} transition-all`}>
                                         <p className={`font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors ${pageSize <= 5 ? 'text-lg' : 'text-sm'}`}>{d.Name || 'Unnamed'}</p>
                                         <p className={`${pageSize <= 5 ? 'text-sm' : 'text-xs'} text-[var(--text-secondary)] mt-0.5`}>
                                             {d.Gotra || '—'} • {d.Nakshatra || '—'}
                                         </p>
                                     </td>
                                     <td className={`${pageSize <= 5 ? 'py-6' : pageSize <= 10 ? 'py-4' : 'py-2'} transition-all`}>
                                         <div className="flex flex-col gap-0.5 text-sm text-[var(--text-secondary)]">
                                             {d.Phone && (
                                                 <span className="flex items-center gap-1.5">
                                                     <Phone size={11} className="text-[var(--primary)]" />{d.Phone}
                                                 </span>
                                             )}
                                             {d.Email && (
                                                 <span className="flex items-center gap-1.5">
                                                     <Mail size={11} />{d.Email}
                                                 </span>
                                             )}
                                             {!d.Phone && !d.Email && <span className="text-slate-400">—</span>}
                                         </div>
                                     </td>
                                     <td className={`${pageSize <= 5 ? 'py-6' : pageSize <= 10 ? 'py-4' : 'py-2'} text-sm text-[var(--text-secondary)] hidden lg:table-cell transition-all`}>
                                         <div>
                                             {d.City || '—'}
                                             {d.PinCode ? ` - ${d.PinCode}` : ''}
                                         </div>
                                     </td>
                                     <td className={`${pageSize <= 5 ? 'py-6' : pageSize <= 10 ? 'py-4' : 'py-2'} text-right pr-4 transition-all`}>
                                         <div className="flex items-center justify-end gap-1">
                                             <button
                                                 onClick={(e) => { e.stopPropagation(); setEditDevotee(d); setShowForm(true); }}
                                                 className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-[var(--text-secondary)] hover:text-blue-600 transition-colors"
                                                 title="Edit"
                                             >
                                                 <Edit3 size={14} />
                                             </button>
                                             <button
                                                 onClick={(e) => { e.stopPropagation(); handleSoftDelete(d); }}
                                                 className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                                                 title="Delete"
                                             >
                                                 <Trash2 size={14} />
                                             </button>
                                         </div>
                                     </td>
                                 </tr>
                            ))}
                        </tbody>
                    </table>

                    {paginatedDevotees.length === 0 && !loading && (
                        <div className="text-center py-16 text-[var(--text-secondary)]">
                            <Users size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">{searchQuery ? `"${searchQuery}" ಗೆ ಫಲಿತಾಂಶಗಳಿಲ್ಲ` : 'ಭಕ್ತರು ಕಂಡುಬಂದಿಲ್ಲ'}</p>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-16 text-[var(--text-secondary)]">
                            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p>ಭಕ್ತರು ಲೋಡ್ ಆಗುತ್ತಿದೆ...</p>
                        </div>
                    )}
                </div>

                {/* Footer: Pagination + Page Size + Cleanup */}
                {totalPages >= 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 mt-2 border-t border-black/10 dark:border-white/10 px-4 pb-3 gap-3">
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-[var(--text-secondary)]">
                                ಪುಟ {currentPage} / {totalPages}
                            </p>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-[var(--text-secondary)]">ಸಾಲುಗಳು:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => changePageSize(Number(e.target.value))}
                                    className="px-2 py-1 rounded-md bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                >
                                    {PAGE_SIZE_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {/* Page buttons */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                                const page = start + i;
                                if (page > totalPages) return null;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'hover:bg-black/5 text-[var(--text-secondary)]'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Devotee Details Modal */}
            <DevoteeDetailsModal
                isOpen={!!viewDevotee}
                onClose={() => setViewDevotee(null)}
                devotee={viewDevotee}
                onEdit={(d) => { setEditDevotee(d); setShowForm(true); setViewDevotee(null); }}
                onDelete={(d) => handleSoftDelete(d)}
                onBookSeva={(d) => { setBookingDevotee(d); setShowBooking(true); setViewDevotee(null); }}
            />

            {/* Registration/Booking Modal */}
            <RegistrationModal
                isOpen={showBooking}
                onClose={() => { setShowBooking(false); setBookingDevotee(null); }}
                prefillDevotee={bookingDevotee}
                onSuccess={(data) => {
                    setShowBooking(false);
                    setReceiptData({
                        voucherNo: data.invoice.VoucherNo,
                        date: data.invoice.RegistrationDate || data.invoice.Date,
                        customerName: data.customer.Name,
                        gotra: data.customer.Gotra || data.customer.Sgotra,
                        nakshatra: data.customer.Nakshatra || data.customer.SNakshatra,
                        sevaDescription: data.item.Description,
                        amount: data.invoice.GrandTotal || data.invoice.TotalAmount,
                        paymentMode: data.invoice.PaymentMode || data.invoice.Payment_Mode
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

            {/* Customer Form Modal */}
            <CustomerForm
                isOpen={showForm}
                onClose={() => { setShowForm(false); setEditDevotee(null); }}
                onSubmit={handleSaveDevotee}
                initialData={editDevotee || undefined}
                title={editDevotee ? `${editDevotee.Name} ಬದಲಿಸಿ` : 'ಹೊಸ ಭಕ್ತರನ್ನು ಸೇರಿಸಿ'}
                loading={loading}
            />
        </motion.div>
    );
}
