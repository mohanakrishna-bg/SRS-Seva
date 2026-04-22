import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sun, Moon, Star, Loader2, Clock, CalendarDays } from 'lucide-react';
import CalendarWidget from './CalendarWidget';

interface PanchangaData {
    tithi: string;
    nakshatra: string;
    sunrise: string;
    sunset: string;
    indianDate: string;
}

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

const SETTINGS_KEY = 'seva_org_settings';

export default function EeDinaCard({ date, onDateChange }: EeDinaCardProps) {
    const [panchanga, setPanchanga] = useState<PanchangaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showRoutine, setShowRoutine] = useState(false);
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
        try {
            const storedSettings = localStorage.getItem(SETTINGS_KEY);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                if (parsed.standardSchedule && Array.isArray(parsed.standardSchedule)) {
                    const sorted = [...parsed.standardSchedule].sort((a, b) => parseTime(a.time, a.period) - parseTime(b.time, b.period));
                    setSchedule(sorted);
                }
            }
        } catch { /* ignore */ }

        const fetchPanchanga = async () => {
            setLoading(true);
            try {
                const dateStr = activeDate.toDateString();
                const cacheKey = `seva_panchanga_v2_kn_${dateStr}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) { setPanchanga(JSON.parse(cached)); setLoading(false); return; }
                const sunriseDate = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate(), 6, 15, 0);
                const staticData: PanchangaData = {
                    tithi: getTithiAtSunrise(sunriseDate),
                    nakshatra: getApproxNakshatra(activeDate),
                    sunrise: '06:15 AM',
                    sunset: '06:42 PM',
                    indianDate: getSakaSamvatDate(activeDate),
                };
                setPanchanga(staticData);
                localStorage.setItem(cacheKey, JSON.stringify(staticData));
            } catch { setPanchanga(null); }
            finally { setLoading(false); }
        };
        fetchPanchanga();
    }, [activeDate.toDateString()]);

    const parseTime = (time: string, period: string) => {
        try {
            const [h, m] = time.split(':');
            let hours = parseInt(h, 10);
            const minutes = parseInt(m || '0', 10);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        } catch { return 0; }
    };

    const handleCalendarSelect = (newDate: Date) => { onDateChange(newDate); };
    const handleResetToToday = () => onDateChange(new Date());
    const { hours, strMin, strSec, ampm } = formatTime(currentTime);

    if (loading) {
        return (
            <div className="glass-card flex items-center justify-center p-8">
                <Loader2 size={32} className="animate-spin text-[var(--accent-saffron)]" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card relative flex flex-col md:flex-row gap-2 p-3 h-[330px]"
            style={{ overflow: 'visible' }}
        >
            {/* Background Accent */}
            <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-400/10 dark:bg-orange-500/5 rounded-full blur-3xl" />
            </div>

            {/* ═══ Left Column: Info ═══ */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
                {/* Clock */}
                <div className="relative z-10 flex items-end gap-2 text-left">
                    <span className="text-4xl font-black tracking-tighter text-[var(--primary)] font-mono leading-none">
                        {hours}:{strMin}
                    </span>
                    <div className="flex flex-col items-start pb-0.5">
                        <span className="text-sm font-bold text-[var(--text-secondary)] tracking-wider leading-none">{ampm}</span>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)]/50 font-mono leading-none mt-0.5">{strSec}s</span>
                    </div>
                </div>

                {/* Dates: Gregorian + Hindu */}
                <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <motion.button
                            onClick={handleResetToToday}
                            animate={!isToday ? {
                                backgroundColor: ['rgba(249, 115, 22, 1)', 'rgba(30, 41, 59, 1)', 'rgba(249, 115, 22, 1)'],
                                color: ['#ffffff', '#f97316', '#ffffff'],
                                scale: [1, 1.1, 1],
                                boxShadow: [
                                    '0 0 0px rgba(249, 115, 22, 0)',
                                    '0 0 20px rgba(249, 115, 22, 0.4)',
                                    '0 0 0px rgba(249, 115, 22, 0)'
                                ]
                            } : {}}
                            transition={!isToday ? {
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "easeInOut"
                            } : {}}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 shadow-lg ${
                                isToday
                                    ? 'bg-orange-500 text-white border-orange-600'
                                    : 'border-orange-500'
                            }`}
                        >
                            <Calendar size={10} />
                            {isToday ? 'ಈ ದಿನ' : 'ಇಂದು ಮರುಹೊಂದಿಸಿ'}
                        </motion.button>
                        <span className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                            {formattedDate}
                        </span>
                    </div>

                    <span className="text-lg font-bold text-[var(--accent-saffron)] italic leading-tight">
                        {panchanga?.indianDate}
                    </span>
                </div>

                {/* Panchanga Info Pills — Larger grid, less white space */}
                {panchanga ? (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 relative z-10 w-full lg:w-fit">
                        <InfoPill icon={<Moon size={16} />} label="ತಿಥಿ" value={panchanga.tithi} color="text-indigo-400" />
                        <InfoPill icon={<Star size={16} />} label="ನಕ್ಷತ್ರ" value={panchanga.nakshatra} color="text-amber-500" />
                        <InfoPill icon={<Sun size={16} />} label="ಸೂರ್ಯೋದಯ" value={panchanga.sunrise} color="text-orange-500" />
                        <InfoPill icon={<Sun size={16} />} label="ಸೂರ್ಯಾಸ್ತ" value={panchanga.sunset} color="text-rose-400" />
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 py-4">ಪಂಚಾಂಗ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.</p>
                )}

                {/* Daily Schedule Trigger */}
                <div className="mt-auto pt-1.5 border-t border-[var(--glass-border)] relative z-20 w-fit" ref={routineRef}>
                    <button 
                        onClick={() => setShowRoutine(!showRoutine)}
                        className="text-xs font-bold text-[var(--accent-saffron)] hover:text-orange-600 flex items-center gap-2 transition-colors"
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
                                <div className="bg-white/95 dark:bg-slate-900/95 border border-[var(--glass-border)] rounded-3xl shadow-2xl p-5 backdrop-blur-xl">
                                    <div className="flex justify-between items-center mb-4 border-b border-black/10 dark:border-white/10 pb-2">
                                        <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                                            <Clock size={16} className="text-amber-500" />
                                            ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ
                                        </h3>
                                        <button onClick={() => setShowRoutine(false)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                                            <CalendarDays size={14} className="text-[var(--text-secondary)]" />
                                        </button>
                                    </div>
                                    {schedule.length > 0 ? (
                                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                            {schedule.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 bg-black/5 dark:bg-white/5 rounded-2xl px-4 py-3 border border-transparent hover:border-orange-500/20 transition-all">
                                                    <div className="w-8 h-8 rounded-full bg-white/50 dark:bg-black/50 border border-[var(--glass-border)] flex items-center justify-center shrink-0">
                                                        <Clock size={12} className="text-[var(--primary)]" />
                                                    </div>
                                                    <div className="flex-1 flex flex-col min-w-0">
                                                        <span className="font-bold text-[var(--text-primary)] text-sm truncate">{item.title}</span>
                                                        <span className="font-mono text-[11px] text-[var(--text-secondary)] font-bold">{item.time} {item.period}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[var(--text-secondary)] text-center py-4 font-bold italic">ವೇಳಾಪಟ್ಟಿ ಲಭ್ಯವಿಲ್ಲ.</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ═══ Right Column: Compact Persistent Calendar ═══ */}
            <div className="shrink-0 relative z-10 w-[300px]" ref={calendarRef}>
                <div className="h-full p-0.5 bg-[var(--primary)]/5 dark:bg-white/5 rounded-2xl border border-[var(--primary)]/10">
                    <CalendarWidget selectedDate={activeDate} onChange={handleCalendarSelect} compact={true} />
                </div>
            </div>
        </motion.div>
    );
}

function InfoPill({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="flex items-center gap-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-2.5 hover:bg-white/40 dark:hover:bg-black/20 transition-colors min-w-[170px]">
            <div className={`w-9 h-9 rounded-full bg-white dark:bg-black/40 flex items-center justify-center shadow-sm shrink-0 ${color}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-bold leading-none mb-1.5">{label}</p>
                <p className="text-sm font-black text-[var(--text-primary)] whitespace-nowrap">{value}</p>
            </div>
        </div>
    );
}

function getTithiAtSunrise(sunriseDate: Date): string {
    const tithis = [
        'ಪ್ರತಿಪದೆ', 'ದ್ವಿತೀಯಾ', 'ತೃತೀಯಾ', 'ಚತುರ್ಥೀ', 'ಪಂಚಮಿ',
        'ಷಷ್ಟಿ', 'ಸಪ್ತಮಿ', 'ಅಷ್ಟಮಿ', 'ನವಮಿ', 'ದಶಮಿ',
        'ಏಕಾದಶಿ', 'ದ್ವಾದಶಿ', 'ತ್ರಯೋದಶಿ', 'ಚತುರ್ದಶಿ'
    ];
    const epoch = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
    const synodicMonth = 29.53058868;
    const diffDays = (sunriseDate.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24);
    const lunarAge = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
    const tithiNum = Math.floor(lunarAge / (synodicMonth / 30));
    if (tithiNum < 15) {
        const idx = tithiNum % 15;
        return idx === 14 ? 'ಶುಕ್ಲ ಪೂರ್ಣಿಮೆ' : `ಶುಕ್ಲ ${tithis[idx]}`;
    } else {
        const idx = (tithiNum - 15) % 15;
        return idx === 14 ? 'ಕೃಷ್ಣ ಅಮಾವಾಸ್ಯೆ' : `ಕೃಷ್ಣ ${tithis[idx]}`;
    }
}

function getApproxNakshatra(date: Date): string {
    const nakshatras = [
        'ಅಶ್ವಿನಿ', 'ಭರಣಿ', 'ಕೃತ್ತಿಕಾ', 'ರೋಹಿಣಿ', 'ಮೃಗಶಿರಾ',
        'ಆರ್ದ್ರಾ', 'ಪುನರ್ವಸು', 'ಪುಷ್ಯ', 'ಆಶ್ಲೇಷಾ', 'ಮಘಾ',
        'ಪೂರ್ವ ಫಲ್ಗುಣಿ', 'ಉತ್ತರ ಫಲ್ಗುಣಿ', 'ಹಸ್ತ', 'ಚಿತ್ರಾ', 'ಸ್ವಾತಿ',
        'ವಿಶಾಖಾ', 'ಅನುರಾಧಾ', 'ಜ್ಯೇಷ್ಠಾ', 'ಮೂಲಾ', 'ಪೂರ್ವಾಷಾಢಾ',
        'ಉತ್ತರಾಷಾಢಾ', 'ಶ್ರವಣ', 'ಧನಿಷ್ಟಾ', 'ಶತಭಿಷಾ',
        'ಪೂರ್ವಭಾದ್ರಪದಾ', 'ಉತ್ತರಭಾದ್ರಪದಾ', 'ರೇವತಿ'
    ];
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return nakshatras[dayOfYear % 27];
}

function getSakaSamvatDate(date: Date): string {
    const sakaMonths = ['ಚೈತ್ರ', 'ವೈಶಾಖ', 'ಜ್ಯೇಷ್ಠ', 'ಆಷಾಢ', 'ಶ್ರಾವಣ', 'ಭಾದ್ರಪದ', 'ಆಶ್ವಿನ', 'ಕಾರ್ತಿಕ', 'ಮಾರ್ಗಶಿರ', 'ಪುಷ್ಯ', 'ಮಾಘ', 'ಫಾಲ್ಗುಣ'];
    const samvatsaras = [
        "ಪ್ರಭವ", "ವಿಭವ", "ಶುಕ್ಲ", "ಪ್ರಮೋದೂತ", "ಪ್ರಜೋತ್ಪತ್ತಿ",
        "ಆಂಗಿರಸ", "ಶ್ರೀಮುಖ", "ಭಾವ", "ಯುವ", "ಧಾತೃ",
        "ಈಶ್ವರ", "ಬಹುಧಾನ್ಯ", "ಪ್ರಮಾಧಿ", "ವಿಕ್ರಮ", "ವೃಷಭ",
        "ಚಿತ್ರಭಾನು", "ಸ್ವಭಾನು", "ತಾರಣ", "ಪಾರ್ಥಿವ", "ವ್ಯಯ",
        "ಸರ್ವಜಿತ್", "ಸರ್ವಧಾರಿ", "ವಿರೋಧಿ", "ವಿಕೃತಿ", "ಖರ",
        "ನಂದನ", "ವಿಜಯ", "ಜಯ", "ಮನ್ಮಥ", "ದುರ್ಮುಖಿ",
        "ಹೇವಿಳಂಬಿ", "ವಿಳಂಬಿ", "ವಿಕಾರಿ", "ಶಾರ್ವರಿ", "ಪ್ಲವ",
        "ಶುಭಕೃತ್", "ಶೋಭಕೃತ್", "ಕ್ರೋಧಿ", "ವಿಶ್ವಾವಸು", "ಪರಾಭವ",
        "ಪ್ಲವಂಗ", "ಕೀಲಕ", "ಸೌಮ್ಯ", "ಸಾಧಾರಣ", "ವಿರೋಧಿಕೃತ್",
        "ಪರಿಧಾವಿ", "ಪ್ರಮಾದಿ", "ಆನಂದ", "ರಾಕ್ಷಸ", "ನಳ",
        "ಪಿಂಗಳ", "ಕಾಲಯುಕ್ತಿ", "ಸಿದ್ಧಾರ್ಥಿ", "ರೌದ್ರಿ", "ದುರ್ಮತಿ",
        "ದುಂದುಭಿ", "ರುಧಿರೋದ್ಗಾರಿ", "ರಕ್ತಾಕ್ಷಿ", "ಕ್ರೋಧನ", "ಅಕ್ಷಯ"
    ];

    const ugadiDate = new Date(date.getFullYear(), 2, 19);
    let shakaYear = date.getFullYear() - 78;
    if (date < ugadiDate) shakaYear--;
    const samvatsara = samvatsaras[(shakaYear + 11) % 60];

    const marchEquinox = new Date(date.getFullYear(), 2, 22);
    let monthIdx: number;
    if (date >= marchEquinox) {
        monthIdx = Math.min(11, Math.floor((date.getTime() - marchEquinox.getTime()) / (1000 * 60 * 60 * 24 * 30.4)));
    } else {
        const prevEquinox = new Date(date.getFullYear() - 1, 2, 22);
        monthIdx = Math.min(11, Math.floor((date.getTime() - prevEquinox.getTime()) / (1000 * 60 * 60 * 24 * 30.4)));
    }

    return `${samvatsara} ಸಂವತ್ಸರ, ${sakaMonths[monthIdx]} ಮಾಸ`;
}
