import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sun, Moon, Star, Loader2, Clock, CalendarDays, BookOpen, Compass, Sparkles } from 'lucide-react';
import CalendarWidget from './CalendarWidget';
import PanchangaModal from './PanchangaModal';
import {
    getPanchangaForDate,
    formatPanchangaEndTime,
    formatShraddhaTithi,
    type SrsPanchangaDay,
} from '../services/panchangaService';
import { useSettings } from '../context/SettingsContext';

interface ScheduleItem {
    id: number;
    title: string;
    time: string;
    period: 'AM' | 'PM';
}

interface EeDinaCardProps {
    date: Date;
    onDateChange: (date: Date) => void;
}

export default function EeDinaCard({ date, onDateChange }: EeDinaCardProps) {
    const { settings } = useSettings();
    const [panchanga, setPanchanga] = useState<SrsPanchangaDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showRoutine, setShowRoutine] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);
    const routineRef = useRef<HTMLDivElement>(null);

    const activeDate = date;
    const today = new Date();
    const isToday = activeDate.toDateString() === today.toDateString();

    const formattedDate = activeDate.toLocaleDateString('kn-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (routineRef.current && !routineRef.current.contains(e.target as Node)) {
                setShowRoutine(false);
            }
        };
        if (showRoutine) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showRoutine]);

    const formatTime = (d: Date) => {
        let hours = d.getHours();
        const minutes = d.getMinutes();
        const seconds = d.getSeconds();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const strMin = minutes < 10 ? '0' + minutes : String(minutes);
        const strSec = seconds < 10 ? '0' + seconds : String(seconds);
        return { hours, strMin, strSec, ampm };
    };

    useEffect(() => {
        if (settings.standardSchedule && Array.isArray(settings.standardSchedule)) {
            const sorted = [...settings.standardSchedule].sort(
                (a, b) => parseTime(a.time, a.period) - parseTime(b.time, b.period)
            );
            setSchedule(sorted);
        }

        const fetchPanchanga = async () => {
            setLoading(true);
            try {
                const data = await getPanchangaForDate(activeDate);
                setPanchanga(data);
            } catch (err) {
                console.error('Panchanga Error:', err);
                setPanchanga(null);
            } finally {
                setLoading(false);
            }
        };
        fetchPanchanga();
    }, [activeDate.toDateString(), settings.standardSchedule]);

    const parseTime = (time: string, period: string) => {
        try {
            const [h, m] = time.split(':');
            let hours = parseInt(h, 10);
            const minutes = parseInt(m || '0', 10);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        } catch {
            return 0;
        }
    };

    const handleCalendarSelect = (newDate: Date) => {
        onDateChange(newDate);
    };
    const handleResetToToday = () => onDateChange(new Date());
    const { hours, strMin, strSec, ampm } = formatTime(currentTime);

    if (loading) {
        return (
            <div className="glass-card flex items-center justify-center p-8 min-h-[340px]">
                <Loader2 size={32} className="animate-spin text-[var(--accent-saffron)]" />
            </div>
        );
    }

    const indianDateLine = panchanga
        ? `${panchanga.samvatsara}, ${panchanga.ayana} · ${panchanga.ritu} · ${panchanga.masa} · ${panchanga.paksha}`
        : '';

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card relative flex flex-col lg:flex-row items-stretch justify-between gap-6 p-4 md:p-5 w-full min-h-[340px]"
            >
                {/* Background Accent */}
                <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-400/10 dark:bg-orange-500/5 rounded-full blur-3xl" />
                </div>

                {/* ═══ Left Column: Panchanga Info ═══ */}
                <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
                    {/* Clock & Header Bar */}
                    <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-end gap-2 text-left">
                            <span className="text-3xl sm:text-4xl font-black tracking-tighter text-[var(--primary)] font-mono leading-none">
                                {hours}:{strMin}
                            </span>
                            <div className="flex flex-col items-start pb-0.5">
                                <span className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] tracking-wider leading-none">
                                    {ampm}
                                </span>
                                <span className="text-[10px] font-medium text-[var(--text-secondary)]/50 font-mono leading-none mt-0.5">
                                    {strSec}s
                                </span>
                            </div>
                        </div>

                        {/* PDF Quick Button */}
                        <button
                            onClick={() => setShowPdfModal(true)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-xs font-bold transition-all shadow-sm group hover:scale-[1.03]"
                            title="ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠದ ಅಧಿಕೃತ ಸೂರ್ಯಸಿದ್ಧಾಂತ ಪಂಚಾಂಗ ಪಿಡಿಎಫ್"
                        >
                            <BookOpen size={14} className="text-orange-500 group-hover:scale-110 transition-transform" />
                            <span>ಪಂಚಾಂಗ ಪಿಡಿಎಫ್</span>
                            {panchanga?.pdfPage ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-orange-500 text-white font-mono font-bold leading-none shadow-sm">
                                    ಪುಟ {panchanga.pdfPage}
                                </span>
                            ) : null}
                        </button>
                    </div>

                    {/* Dates: Gregorian + Authentic Hindu Calendar */}
                    <div className="relative z-10 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <motion.button
                                onClick={handleResetToToday}
                                animate={
                                    !isToday
                                        ? {
                                              backgroundColor: [
                                                  'rgba(249, 115, 22, 1)',
                                                  'rgba(30, 41, 59, 1)',
                                                  'rgba(249, 115, 22, 1)',
                                              ],
                                              color: ['#ffffff', '#f97316', '#ffffff'],
                                              scale: [1, 1.08, 1],
                                              boxShadow: [
                                                  '0 0 0px rgba(249, 115, 22, 0)',
                                                  '0 0 16px rgba(249, 115, 22, 0.4)',
                                                  '0 0 0px rgba(249, 115, 22, 0)',
                                              ],
                                          }
                                        : {}
                                }
                                transition={
                                    !isToday
                                        ? {
                                              repeat: Infinity,
                                              duration: 1.5,
                                              ease: 'easeInOut',
                                          }
                                        : {}
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 shadow-lg ${
                                    isToday
                                        ? 'bg-orange-500 text-white border-orange-600'
                                        : 'border-orange-500'
                                }`}
                            >
                                <Calendar size={10} />
                                {isToday ? 'ಈ ದಿನ' : 'ಇಂದು ಮರುಹೊಂದಿಸಿ'}
                            </motion.button>
                            <span className="text-base md:text-lg font-bold text-[var(--text-primary)] leading-tight">
                                {formattedDate}
                            </span>
                        </div>

                        {/* Authentic Hindu Date Line */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm sm:text-base font-bold text-[var(--accent-saffron)] leading-tight">
                                {indianDateLine}
                            </span>
                            {panchanga?.source === 'pdf_surya_siddhanta' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                    <span>ಸೂರ್ಯಸಿದ್ಧಾಂತ</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Panchanga Info Pills — 2x2 grid */}
                    {panchanga ? (
                        <div className="grid grid-cols-2 gap-2.5 relative z-10 w-full">
                            <InfoPill
                                icon={<Moon size={16} />}
                                label="ತಿಥಿ"
                                value={
                                    panchanga.tithiEndTime
                                        ? `${panchanga.tithi} (${formatPanchangaEndTime(panchanga.tithiEndTime)} ರವರೆಗೆ)`
                                        : panchanga.tithi
                                }
                                color="text-indigo-400"
                            />
                            <InfoPill
                                icon={<Star size={16} />}
                                label="ನಕ್ಷತ್ರ"
                                value={panchanga.nakshatra}
                                color="text-amber-500"
                            />
                            <InfoPill
                                icon={<Compass size={16} />}
                                label="ಯೋಗ · ಕರಣ"
                                value={`${panchanga.yoga || '-'} · ${panchanga.karana || '-'}`}
                                color="text-teal-500"
                            />
                            <InfoPill
                                icon={<Sun size={16} />}
                                label="ಸೂರ್ಯೋದಯ"
                                value={panchanga.sunrise ? `${panchanga.sunrise} AM` : '06:00 AM'}
                                color="text-orange-500"
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 py-4">ಪಂಚಾಂಗ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.</p>
                    )}

                    {/* Dharmashastra / Vishesha Dina / Shraddha Tithi Banner */}
                    {panchanga && (panchanga.dharmashastra || panchanga.shraddhaTithi) && (
                        <div className="relative z-10 flex flex-col gap-1 p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/25">
                            <div className="flex items-start gap-2">
                                <Sparkles size={15} className="text-amber-500 shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                    {panchanga.dharmashastra && (
                                        <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 leading-snug">
                                            {panchanga.dharmashastra}
                                        </span>
                                    )}
                                    {panchanga.shraddhaTithi && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                            ಶ್ರಾದ್ಧತಿಥಿ: {panchanga.shraddhaTithiExpanded || formatShraddhaTithi(panchanga.shraddhaTithi)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Action Bar: Daily Routine + PDF Viewer Link */}
                    <div className="pt-2 border-t border-[var(--glass-border)] relative z-20 flex items-center justify-between gap-3 flex-wrap">
                        <div ref={routineRef} className="relative">
                            <button
                                onClick={() => setShowRoutine(!showRoutine)}
                                className="text-xs font-bold text-[var(--accent-saffron)] hover:text-orange-600 flex items-center gap-1.5 transition-colors"
                            >
                                <Clock size={12} />
                                ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ
                            </button>

                            <AnimatePresence>
                                {showRoutine && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute left-0 bottom-full mb-3 w-80 z-[100]"
                                    >
                                        <div className="bg-white/95 dark:bg-[var(--glass-card-bg)] border border-[var(--glass-border)] rounded-3xl shadow-2xl p-5 backdrop-blur-xl">
                                            <div className="flex justify-between items-center mb-4 border-b border-black/10 dark:border-white/10 pb-2">
                                                <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                                                    <Clock size={16} className="text-amber-500" />
                                                    ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ
                                                </h3>
                                                <button
                                                    onClick={() => setShowRoutine(false)}
                                                    className="p-1 hover:bg-black/5 rounded-full transition-colors"
                                                >
                                                    <CalendarDays size={14} className="text-[var(--text-secondary)]" />
                                                </button>
                                            </div>
                                            {schedule.length > 0 ? (
                                                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                                    {schedule.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center gap-3 bg-black/5 dark:bg-white/5 rounded-2xl px-4 py-3 border border-transparent hover:border-orange-500/20 transition-all"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-white/50 dark:bg-black/50 border border-[var(--glass-border)] flex items-center justify-center shrink-0">
                                                                <Clock size={12} className="text-[var(--primary)]" />
                                                            </div>
                                                            <div className="flex-1 flex flex-col min-w-0">
                                                                <span className="font-bold text-[var(--text-primary)] text-sm truncate">
                                                                    {item.title}
                                                                </span>
                                                                <span className="font-mono text-[11px] text-[var(--text-secondary)] font-bold">
                                                                    {item.time} {item.period}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-[var(--text-secondary)] text-center py-4 font-bold italic">
                                                    ವೇಳಾಪಟ್ಟಿ ಲಭ್ಯವಿಲ್ಲ.
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* PDF Page note */}
                        {panchanga?.pdfPage && (
                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="text-[11px] font-semibold text-[var(--text-secondary)] hover:text-orange-600 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
                            >
                                <span>ಮಠದ ಪಂಚಾಂಗ ಪುಟ {panchanga.pdfPage} ನೋಡಿ →</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ═══ Right Column: Compact Persistent Calendar ═══ */}
                <div
                    className="shrink-0 relative z-10 w-full lg:w-[310px] self-center lg:self-stretch flex flex-col justify-center"
                    ref={calendarRef}
                >
                    <div className="h-full p-1 bg-[var(--primary)]/5 dark:bg-white/5 rounded-2xl border border-[var(--primary)]/10 flex items-center justify-center">
                        <CalendarWidget selectedDate={activeDate} onChange={handleCalendarSelect} compact={true} />
                    </div>
                </div>
            </motion.div>

            {/* Embedded Panchanga PDF Viewer Modal */}
            <PanchangaModal
                isOpen={showPdfModal}
                onClose={() => setShowPdfModal(false)}
                initialPage={panchanga?.pdfPage || 1}
                initialSectionTitle={panchanga?.dharmashastra || (panchanga ? `${panchanga.masa} ${panchanga.paksha}` : '')}
            />
        </>
    );
}

function InfoPill({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="flex items-center gap-2.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-2.5 hover:bg-white/40 dark:hover:bg-black/20 transition-colors min-w-0 flex-1 shadow-sm">
            <div
                className={`w-8 h-8 md:w-9 md:h-9 rounded-full bg-white dark:bg-black/40 flex items-center justify-center shadow-sm shrink-0 ${color}`}
            >
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-bold leading-none mb-1">
                    {label}
                </p>
                <p className="text-xs md:text-sm font-black text-[var(--text-primary)] leading-tight break-words" title={value}>
                    {value}
                </p>
            </div>
        </div>
    );
}
