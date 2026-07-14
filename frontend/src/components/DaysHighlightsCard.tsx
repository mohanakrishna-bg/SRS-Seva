import { useState, useEffect } from 'react';
import { Sparkles, Clock, Key, Users, Utensils, Pencil, Trash2, Maximize2, Check } from 'lucide-react';
import { eventsApi, statsApi } from '../api';
import EventModal from './EventModal';
import TransliteratedInput from './TransliteratedInput';

interface DaysHighlightsCardProps {
    date?: Date;
    onRegisterSpecialEvent?: (eventName: string, eventCode: string) => void;
}

export default function DaysHighlightsCard({ date, onRegisterSpecialEvent }: DaysHighlightsCardProps) {
    const [events, setEvents] = useState<any[]>([]);
    const [localHighlights, setLocalHighlights] = useState<any[]>([]);
    const [hiddenEvents, setHiddenEvents] = useState<string[]>([]);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Record<string, { sevakartas: number; prasada: number }>>({});
    
    // Inline editing state
    const [isEditingInline, setIsEditingInline] = useState(false);
    const [newText, setNewText] = useState('');
    const [newTime, setNewTime] = useState('');

    const activeDate = date || new Date();

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

    const hideDbEvent = (sevaCode: string) => {
        const newHidden = [...hiddenEvents, sevaCode];
        setHiddenEvents(newHidden);
        localStorage.setItem(getHiddenKey(), JSON.stringify(newHidden));
    };

    const removeLocalHighlight = (id: number) => {
        const newLocals = localHighlights.filter(h => h.id !== id);
        setLocalHighlights(newLocals);
        localStorage.setItem(getLocalKey(), JSON.stringify(newLocals));
    };

    const handleAddLocal = () => {
        if (!newText.trim()) return;
        const item = { id: Date.now(), text: newText.trim(), time: newTime.trim() || undefined };
        const newLocals = [...localHighlights, item];
        setLocalHighlights(newLocals);
        localStorage.setItem(getLocalKey(), JSON.stringify(newLocals));
        setNewText('');
        setNewTime('');
        setIsEditingInline(false);
    };

    if (loading) return null;

    // Filter events: must have a StartTime and not be hidden
    const visibleDbEvents = events.filter(evt => evt.StartTime && !hiddenEvents.includes(evt.SevaCode));

    return (
        <div className="glass-card relative overflow-hidden border-2 border-[var(--accent-saffron)]/30 w-full h-[420px] flex flex-col">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-saffron)]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-4 pb-3 border-b border-[var(--glass-border)] shrink-0">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                    <Sparkles size={20} className="text-[var(--accent-saffron)]" />
                    <h3 className="font-bold text-lg">ದಿನದ ವಿಶೇಷಗಳು</h3>
                </div>
                <div className="flex items-center gap-1.5">
                    {(visibleDbEvents.length > 0 || localHighlights.length > 0) && !isEditingInline && (
                        <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--glass-bg)] border border-[var(--glass-border)] px-2 py-1 rounded-full mr-1">
                            {visibleDbEvents.length + localHighlights.length} ಈವೆಂಟ್{visibleDbEvents.length + localHighlights.length > 1 ? 'ಗಳು' : ''}
                        </span>
                    )}
                    <button
                        onClick={() => setIsEditingInline(!isEditingInline)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isEditingInline ? 'bg-[var(--primary)] text-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--primary)]'}`}
                        title="ಇಲ್ಲಿಯೇ ಸಂಪಾದಿಸಿ (Inline Edit)"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => setIsEventModalOpen(true)}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                        title="ದೊಡ್ಡ ಪರದೆಯಲ್ಲಿ ಸಂಪಾದಿಸಿ (Expand)"
                    >
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>

            {/* Events list */}
            <div className="relative z-10 p-4 space-y-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {visibleDbEvents.length === 0 && localHighlights.length === 0 && !isEditingInline && (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] opacity-60">
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
                        {isEditingInline && (
                            <button onClick={() => removeLocalHighlight(h.id)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors" title="ಅಳಿಸಿ (Delete)">
                                <Trash2 size={14} />
                            </button>
                        )}
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
                                {/* Devotee Stats */}
                                {s && (
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

                            {/* Actions (Register or Delete) */}
                            <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                {isEditingInline ? (
                                    <button onClick={() => hideDbEvent(evt.SevaCode)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors" title="ಮರೆಮಾಡಿ (Hide)">
                                        <Trash2 size={14} />
                                    </button>
                                ) : (
                                    <button
                                        disabled={isPastDate}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onRegisterSpecialEvent) onRegisterSpecialEvent(evt.Description, evt.SevaCode);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                                            isPastDate
                                                ? 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] opacity-50 cursor-not-allowed'
                                                : 'bg-[var(--accent-saffron)] text-white hover:bg-orange-600 hover:shadow-md'
                                        }`}
                                    >
                                        ನೋಂದಾಯಿಸಿ
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Inline Add Form */}
                {isEditingInline && (
                    <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 rounded-xl space-y-3 border border-[var(--glass-border)]">
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">ಹೊಸ ಘಟನೆ ಸೇರಿಸಿ</h4>
                        <div className="flex flex-col gap-2.5">
                            <TransliteratedInput value={newText} onChange={setNewText} placeholder="ಘಟನೆಯ ವಿವರಣೆ..." />
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <TransliteratedInput value={newTime} onChange={setNewTime} placeholder="ಸಮಯ (ಐಚ್ಛಿಕ)" />
                                </div>
                                <button onClick={handleAddLocal} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center hover:bg-[var(--primary-hover)] transition-colors shadow-md">
                                    <Check size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isEventModalOpen && (
                <EventModal
                    isOpen={isEventModalOpen}
                    date={activeDate}
                    onClose={() => {
                        setIsEventModalOpen(false);
                        loadLocalHighlights();
                        loadHiddenEvents();
                    }}
                />
            )}
        </div>
    );
}
