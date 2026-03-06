import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HeartHandshake, Grid3X3, List, Loader2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { sevaApi } from '../api';

interface SevaItem {
    ItemCode?: string;
    Description?: string;
    Basic?: number;
    TPQty?: number;
    Prasada_Addon_Limit?: number;
}

export default function SevasPage() {
    const [sevas, setSevas] = useState<SevaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const fetchSevas = async () => {
            try {
                const res = await sevaApi.list();
                setSevas(res.data.filter((s: SevaItem) => s.ItemCode && s.Description));
            } catch {
                // Silently fail
            } finally {
                setLoading(false);
            }
        };
        fetchSevas();
    }, []);

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return sevas;
        const q = searchQuery.toLowerCase();
        return sevas.filter((s) =>
            s.Description?.toLowerCase().includes(q) ||
            s.ItemCode?.toLowerCase().includes(q)
        );
    }, [sevas, searchQuery]);

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
                        {sevas.length} ರಲ್ಲಿ {filtered.length} ಸೇವೆಗಳು
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <SearchBar placeholder="ಸೇವೆಗಳನ್ನು ಹುಡುಕಿ..." onSearch={setSearchQuery} />
                    <div className="flex bg-white rounded-lg border border-black/10 overflow-hidden shrink-0">
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
                </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((s) => (
                        <motion.div
                            key={s.ItemCode}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card hover:border-[var(--primary)]/30 transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-lg leading-tight">{s.Description}</h3>
                                <span className="text-emerald-400 font-mono text-lg font-bold shrink-0 ml-3">
                                    ₹{s.Basic?.toLocaleString() ?? '—'}
                                </span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] font-mono mb-3">ಕೋಡ್: {s.ItemCode}</p>
                            {s.Prasada_Addon_Limit !== undefined && s.Prasada_Addon_Limit > 0 && (
                                <div className="flex items-center gap-2 text-sm bg-[var(--glass-bg)] p-2 rounded-lg">
                                    <span className="w-2 h-2 rounded-full bg-[var(--accent-saffron)]" />
                                    ಪ್ರಸಾದ: {s.Prasada_Addon_Limit} ಜನರವರೆಗೆ
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="glass-card overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/10">
                                <th className="pb-3 pt-1 font-semibold text-[var(--text-secondary)] uppercase text-xs">ಕೋಡ್</th>
                                <th className="pb-3 pt-1 font-semibold text-[var(--text-secondary)] uppercase text-xs">ವಿವರಣೆ</th>
                                <th className="pb-3 pt-1 font-semibold text-[var(--text-secondary)] uppercase text-xs text-right">ಶುಲ್ಕ (₹)</th>
                                <th className="pb-3 pt-1 font-semibold text-[var(--text-secondary)] uppercase text-xs text-right hidden md:table-cell">ಪ್ರಸಾದ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s) => (
                                <tr key={s.ItemCode} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                                    <td className="py-3 font-mono text-sm text-[var(--text-secondary)]">{s.ItemCode}</td>
                                    <td className="py-3 font-medium">{s.Description}</td>
                                    <td className="py-3 text-right text-emerald-400 font-mono font-bold">₹{s.Basic?.toLocaleString() ?? '—'}</td>
                                    <td className="py-3 text-right text-sm text-[var(--text-secondary)] hidden md:table-cell">
                                        {s.Prasada_Addon_Limit && s.Prasada_Addon_Limit > 0 ? `${s.Prasada_Addon_Limit} ಜನರು` : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                    {searchQuery ? `"${searchQuery}" ಗೆ ಸೇವೆಗಳಿಲ್ಲ` : 'ಸೇವೆಗಳು ಲಭ್ಯವಿಲ್ಲ'}
                </div>
            )}
        </motion.div>
    );
}
