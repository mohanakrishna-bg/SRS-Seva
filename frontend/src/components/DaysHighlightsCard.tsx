import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Users, Utensils, Maximize2, X } from 'lucide-react';
import { eventsApi, statsApi } from '../api';
import { useAuth } from '../context/AuthContext';

interface DaysHighlightsCardProps {
    date?: Date;
    onRegisterSpecialEvent?: (eventName: string, eventCode: string) => void;
}

export default function DaysHighlightsCard({ date, onRegisterSpecialEvent }: DaysHighlightsCardProps) {
    const { isAuthenticated } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [localHighlights, setLocalHighlights] = useState<any[]>([]);
    const [hiddenEvents, setHiddenEvents] = useState<string[]>([]);
    const [isMaximized, setIsMaximized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Record<string, { sevakartas: number; prasada: number }>>({});

    const activeDate = date || new Date();

    const formattedDate = activeDate.toLocaleDateString('kn-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const getHiddenKey = () => `seva_hidden_events_kn_${activeDate.toDateString()}`;
    const getLocalKey = () => `seva_highlights_kn_${activeDate.toDateString()}`;

    const loadLocalHighlights = () => {
        const stored = localStorage.getItem(getLocalKey());
        if (stored) {
            try { setLocalHighlights(JSON.parse(stored)); } catch { setLocalHighlights([]); }
        } else {
            setLocalHighlights([]);
        }
    };

    const loadHiddenEvents = () => {
        const stored = localStorage.getItem(getHiddenKey());
        if (stored) {
            try { setHiddenEvents(JSON.parse(stored)); } catch { setHiddenEvents([]); }
        } else {
            setHiddenEvents([]);
        }
    };

    // Lock body scroll when maximized modal is open
    useEffect(() => {
        if (isMaximized) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isMaximized]);

    // Prevent booking past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const actDate = new Date(activeDate);
    actDate.setHours(0, 0, 0, 0);
    const isPastDate = actDate < today;

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            try {
                const day = activeDate.getDate().toString().padStart(2, '0');
                const m = (activeDate.getMonth() + 1).toString().padStart(2, '0');
                const y = activeDate.getFullYear().toString().slice(-2);
                const ddmmyy = `${day}${m}${y}`;

                const eventsRes = await eventsApi.calendar(ddmmyy);
                setEvents(eventsRes.data || []);

                const dateStr = activeDate.toLocaleDateString('en-CA');
                const statsRes = await statsApi.daily(dateStr);
                setStats(statsRes.data || {});
            } catch (err) {
                console.error('Failed to fetch special events calendar:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        loadLocalHighlights();
        loadHiddenEvents();
    }, [activeDate.toDateString()]);

    const formatSchedule = (evt: any) => {
        if (evt.IsAllDay) return 'ದಿನವಿಡೀ';
        if (!evt.StartTime) return 'ಸಮಯ ನಿಗದಿಪಡಿಸಿಲ್ಲ';
        return evt.EndTime ? `${evt.StartTime} – ${evt.EndTime}` : evt.StartTime;
    };

    if (loading) return null;

    // Filter events: must have a StartTime and not be hidden
    const visibleDbEvents = events.filter(evt => evt.StartTime && !hiddenEvents.includes(evt.SevaCode));
    const totalEvents = visibleDbEvents.length + localHighlights.length;

    return (
        <div className="glass-card relative overflow-hidden border-2 border-[var(--accent-saffron)]/30 w-full min-h-[340px] max-h-[460px] flex flex-col">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-saffron)]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-4 pb-3 border-b border-[var(--glass-border)] shrink-0">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                    <Sparkles size={20} className="text-[var(--accent-saffron)]" />
                    <h3 className="font-bold text-lg">ದಿನದ ವಿಶೇಷಗಳು</h3>
                </div>
                <div className="flex items-center gap-1.5">
                    {totalEvents > 0 && (
                        <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--glass-bg)] border border-[var(--glass-border)] px-2 py-1 rounded-full mr-1">
                            {totalEvents} ಈವೆಂಟ್{totalEvents > 1 ? 'ಗಳು' : ''}
                        </span>
                    )}
                    {/* Maximize option: pops up locked modal with full card content */}
                    <button
                        onClick={() => setIsMaximized(true)}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                        title="ದೊಡ್ಡ ಪರದೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ (Maximize)"
                    >
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>

            {/* Events list */}
            <div className="relative z-10 p-4 space-y-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {totalEvents === 0 && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[140px] text-[var(--text-secondary)] opacity-60">
                        <Sparkles size={32} className="mb-2" />
                        <p className="text-sm">ಈ ದಿನ ಯಾವುದೇ ವಿಶೇಷ ಘಟನೆಗಳಿಲ್ಲ.</p>
                    </div>
                )}

                {/* Custom highlights from LocalStorage */}
                {localHighlights.map((h) => (
                    <div key={`local-${h.id}`} className="flex items-start justify-between gap-3 group pb-3 border-b border-[var(--glass-border)] last:border-0 last:pb-0">
                        <div className="flex-1 flex flex-col gap-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0 self-center" />
                                <span className="font-bold text-base text-[var(--text-primary)] leading-tight">{h.text}</span>
                                {h.time && (
                                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[var(--text-secondary)] shrink-0 whitespace-nowrap">
                                        <Clock size={11} />
                                        {h.time}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Database Events */}
                {visibleDbEvents.map((evt) => {
                    const s = stats[evt.SevaCode];
                    return (
                        <div key={evt.SevaCode} className="flex items-start justify-between gap-3 group pb-3 border-b border-[var(--glass-border)] last:border-0 last:pb-0">
                            <div className="flex-1 flex flex-col gap-1">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-saffron)] shrink-0 self-center" />
                                    <span className="font-bold text-base text-[var(--text-primary)] leading-tight">
                                        {evt.Description}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[var(--text-secondary)] shrink-0 whitespace-nowrap">
                                        <Clock size={11} />
                                        {formatSchedule(evt)}
                                    </span>
                                </div>
                                {/* Devotee Stats (Staff only) */}
                                {isAuthenticated && s && (
                                    <div className="flex items-center gap-4 pl-3.5 mt-1">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            <Users size={12} />
                                            ಸೇವಾಕರ್ತರು: {s.sevakartas || 0}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                                            <Utensils size={12} />
                                            ತೀರ್ಥ ಪ್ರಸಾದ: {s.prasada || 0}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Action: Register */}
                            {onRegisterSpecialEvent && (
                                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                    <button
                                        disabled={isPastDate}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRegisterSpecialEvent(evt.Description, evt.SevaCode);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                                            isPastDate
                                                ? 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] opacity-50 cursor-not-allowed'
                                                : 'bg-[var(--accent-saffron)] text-white hover:bg-orange-600 hover:shadow-md'
                                        }`}
                                    >
                                        ನೋಂದಾಯಿಸಿ
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ═══ Maximized Locked Modal (fits visible screen area with scrollbar) ═══ */}
            <AnimatePresence>
                {isMaximized && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsMaximized(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 border border-[var(--glass-border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[var(--text-primary)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 md:p-5 border-b border-[var(--glass-border)] bg-[var(--pub-cream-dark,#fbf5ee)] dark:bg-slate-800/80 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-500/15 flex items-center justify-center text-orange-500">
                                        <Sparkles size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg md:text-xl text-[var(--text-primary)]">
                                            ದಿನದ ವಿಶೇಷಗಳು — Day's Highlights
                                        </h3>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            {formattedDate}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--glass-bg)] border border-[var(--glass-border)] px-3 py-1 rounded-full">
                                        {totalEvents} ಈವೆಂಟ್{totalEvents !== 1 ? 'ಗಳು' : ''}
                                    </span>
                                    <button
                                        onClick={() => setIsMaximized(false)}
                                        className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                        aria-label="Close modal"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body with scrollbar */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {totalEvents === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)] opacity-60">
                                        <Sparkles size={48} className="mb-3 text-[var(--primary)] opacity-40" />
                                        <p className="text-base font-medium">ಈ ದಿನ ಯಾವುದೇ ವಿಶೇಷ ಘಟನೆಗಳಿಲ್ಲ.</p>
                                        <p className="text-xs mt-1">No special events scheduled for this day.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Local highlights */}
                                        {localHighlights.map((h) => (
                                            <div
                                                key={`modal-local-${h.id}`}
                                                className="p-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] flex items-start justify-between gap-4 shadow-sm"
                                            >
                                                <div className="flex-1 flex flex-col gap-1">
                                                    <div className="flex items-baseline gap-2.5 flex-wrap">
                                                        <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 self-center" />
                                                        <span className="font-bold text-base md:text-lg text-[var(--text-primary)] leading-tight">
                                                            {h.text}
                                                        </span>
                                                        {h.time && (
                                                            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--text-secondary)] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5">
                                                                <Clock size={12} />
                                                                {h.time}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Database events */}
                                        {visibleDbEvents.map((evt) => {
                                            const s = stats[evt.SevaCode];
                                            return (
                                                <div
                                                    key={`modal-db-${evt.SevaCode}`}
                                                    className="p-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-[var(--primary)]/30 transition-all"
                                                >
                                                    <div className="flex-1 flex flex-col gap-1.5">
                                                        <div className="flex items-baseline gap-2.5 flex-wrap">
                                                            <span className="w-2 h-2 rounded-full bg-[var(--accent-saffron)] shrink-0 self-center" />
                                                            <span className="font-bold text-base md:text-lg text-[var(--text-primary)] leading-tight">
                                                                {evt.Description}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--primary)] px-2.5 py-0.5 rounded-md bg-[var(--primary)]/10">
                                                                <Clock size={12} />
                                                                {formatSchedule(evt)}
                                                            </span>
                                                        </div>
                                                        {evt.DescriptionEn && (
                                                            <p className="text-xs text-[var(--text-secondary)] pl-4.5">
                                                                {evt.DescriptionEn}
                                                            </p>
                                                        )}
                                                        {/* Devotee stats (staff only) */}
                                                        {isAuthenticated && s && (
                                                            <div className="flex items-center gap-4 pl-4.5 mt-1 text-xs font-bold">
                                                                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                                    <Users size={13} />
                                                                    ಸೇವಾಕರ್ತರು: {s.sevakartas || 0}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                                                                    <Utensils size={13} />
                                                                    ತೀರ್ಥ ಪ್ರಸಾದ: {s.prasada || 0}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {onRegisterSpecialEvent && (
                                                        <div className="shrink-0 sm:self-center">
                                                            <button
                                                                disabled={isPastDate}
                                                                onClick={() => {
                                                                    setIsMaximized(false);
                                                                    onRegisterSpecialEvent(evt.Description, evt.SevaCode);
                                                                }}
                                                                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                                                                    isPastDate
                                                                        ? 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] opacity-50 cursor-not-allowed'
                                                                        : 'bg-[var(--accent-saffron)] text-white hover:bg-orange-600 hover:shadow-md'
                                                                }`}
                                                            >
                                                                ನೋಂದಾಯಿಸಿ
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-[var(--glass-border)] bg-black/5 dark:bg-white/5 flex items-center justify-between shrink-0">
                                <span className="text-xs text-[var(--text-secondary)]">
                                    {totalEvents > 0 ? `${totalEvents} ಘಟನೆಗಳು` : 'ಯಾವುದೇ ಘಟನೆಗಳಿಲ್ಲ'}
                                </span>
                                <button
                                    onClick={() => setIsMaximized(false)}
                                    className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-110 transition-all shadow-md"
                                >
                                    ಮುಚ್ಚಿ (Close)
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
