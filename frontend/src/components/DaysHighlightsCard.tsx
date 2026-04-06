import { useState, useEffect } from 'react';
import { Sparkles, Clock, Key, Users, Utensils } from 'lucide-react';
import { eventsApi, statsApi } from '../api';

interface DaysHighlightsCardProps {
    date?: Date;
    onRegisterSpecialEvent?: (eventName: string, eventCode: string) => void;
}

export default function DaysHighlightsCard({ date, onRegisterSpecialEvent }: DaysHighlightsCardProps) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Record<string, { sevakartas: number; prasada: number }>>({});

    const activeDate = date || new Date();

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
    }, [activeDate.toDateString()]);

    const formatSchedule = (evt: any) => {
        if (evt.IsAllDay) return 'ದಿನವಿಡೀ';
        if (!evt.StartTime) return 'ಸಮಯ ನಿಗದಿಪಡಿಸಿಲ್ಲ';
        return evt.EndTime ? `${evt.StartTime} – ${evt.EndTime}` : evt.StartTime;
    };

    if (loading) return null;

    return (
        <div className="glass-card relative overflow-hidden border-2 border-[var(--accent-saffron)]/30 w-full">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-saffron)]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-4 pb-3 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                    <Sparkles size={20} className="text-[var(--accent-saffron)]" />
                    <h3 className="font-bold text-lg">ದಿನದ ವಿಶೇಷಗಳು (Day's Highlights)</h3>
                </div>
                {events.length > 0 && (
                    <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--glass-bg)] border border-[var(--glass-border)] px-2 py-1 rounded-full">
                        {events.length} ಈವೆಂಟ್{events.length > 1 ? 'ಗಳು' : ''}
                    </span>
                )}
            </div>

            {/* Events list */}
            <div className="relative z-10 p-4 space-y-3 overflow-y-auto">
                {events.length === 0 && (
                    <p className="text-sm text-[var(--text-secondary)] py-4 text-center">
                        ಈ ದಿನ ಯಾವುದೇ ವಿಶೇಷ ಘಟನೆಗಳಿಲ್ಲ (No special events today).
                    </p>
                )}

                {events.map((evt) => {
                    const s = stats[evt.SevaCode];
                    return (
                        <div
                            key={evt.SevaCode}
                            className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 hover:border-[var(--accent-saffron)]/50 transition-colors group/event"
                        >
                            {/* Primary line: description + time + register button */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0 flex items-baseline gap-3 flex-wrap">
                                    {/* Event description — takes as much space as possible */}
                                    <span className="font-bold text-base text-[var(--text-primary)] leading-tight">
                                        {evt.Description}
                                    </span>
                                    {/* Time slot — inline, secondary colour */}
                                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[var(--text-secondary)] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                                        <Clock size={11} />
                                        {formatSchedule(evt)}
                                    </span>
                                    {/* Sub-sevas badge if present */}
                                    {evt.composite_sevas?.length > 0 && (
                                        <span className="inline-flex items-center gap-1 text-xs font-mono text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                                            <Key size={11} />
                                            {evt.composite_sevas.length} Sub-Sevas
                                        </span>
                                    )}
                                </div>

                                {/* Register button — right-aligned, doesn't wrap */}
                                <button
                                    disabled={isPastDate}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onRegisterSpecialEvent) onRegisterSpecialEvent(evt.Description, evt.SevaCode);
                                    }}
                                    className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 ${
                                        isPastDate
                                            ? 'bg-[var(--glass-bg)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed border border-[var(--glass-border)] shadow-none'
                                            : 'bg-[var(--accent-saffron)] text-white hover:bg-orange-600 hover:shadow-lg'
                                    }`}
                                >
                                    ನೋಂದಾಯಿಸಿ (Register)
                                </button>
                            </div>

                            {/* Secondary line: devotee stats */}
                            {s && (
                                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[var(--glass-border)]">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        <Users size={13} />
                                        ಸೇವಾಕರ್ತರು (Devotees):&nbsp;
                                        <span className="text-sm font-black">{s.sevakartas || 0}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                                        <Utensils size={13} />
                                        ತೀರ್ಥ ಪ್ರಸಾದ (Prasada):&nbsp;
                                        <span className="text-sm font-black">{s.prasada || 0}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
