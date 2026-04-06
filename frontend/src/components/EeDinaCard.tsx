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
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

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
            if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
                setShowCalendar(false);
            }
        };
        if (showCalendar) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCalendar]);

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

    const handleCalendarSelect = (newDate: Date) => { onDateChange(newDate); setShowCalendar(false); };
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
            className="glass-card relative flex flex-col gap-4 p-5"
            style={{ overflow: 'visible', minWidth: '260px' }}
        >
            {/* Background Accent */}
            <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-400/10 dark:bg-orange-500/5 rounded-full blur-3xl" />
            </div>

            {/* ═══ Live Clock ═══ */}
            <div className="relative z-10 flex items-end gap-2">
                <span className="text-4xl font-black tracking-tight text-[var(--primary)] font-mono leading-none">
                    {hours}:{strMin}
                </span>
                <div className="flex flex-col items-start pb-0.5">
                    <span className="text-sm font-bold text-[var(--text-secondary)] tracking-wider leading-none">{ampm}</span>
                    <span className="text-xs font-medium text-[var(--text-secondary)]/50 font-mono leading-none mt-0.5">{strSec}s</span>
                </div>
                {/* Calendar popup button */}
                <div className="ml-auto relative shrink-0" ref={calendarRef}>
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all border ${
                            showCalendar
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                : 'bg-white dark:bg-black/20 border-black/10 dark:border-white/10 text-[var(--text-secondary)] hover:text-orange-600 hover:border-orange-300'
                        }`}
                        title="ಕ್ಯಾಲೆಂಡರ್"
                    >
                        <CalendarDays size={18} />
                    </button>
                    <AnimatePresence>
                        {showCalendar && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="fixed bottom-6 left-6 z-[2000] shadow-2xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-[var(--primary)] overflow-hidden"
                            >
                                <CalendarWidget selectedDate={activeDate} onChange={handleCalendarSelect} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ═══ Dates: Gregorian + Hindu ═══ */}
            <div className="relative z-10 flex flex-col gap-1.5">
                {/* Line 1: Today badge + Gregorian */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleResetToToday}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${
                            isToday
                                ? 'bg-orange-500 text-white border-orange-600'
                                : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-orange-500/10'
                        }`}
                    >
                        <Calendar size={10} />
                        {isToday ? 'ಈ ದಿನ' : 'ಇಂದು'}
                    </button>
                    <span className="text-base font-bold text-[var(--text-primary)] leading-snug">
                        {formattedDate}
                    </span>
                </div>

                {/* Line 2: Hindu Panchanga — saffron italic, same size */}
                <span className="text-base font-bold text-[var(--accent-saffron)] italic leading-snug">
                    {panchanga?.indianDate}
                </span>
            </div>

            {/* ═══ Panchanga Info Pills ═══ */}
            {panchanga ? (
                <div className="grid grid-cols-2 gap-2 relative z-10">
                    <InfoPill icon={<Moon size={13} />} label="ತಿಥಿ" value={panchanga.tithi} color="text-indigo-400" />
                    <InfoPill icon={<Star size={13} />} label="ನಕ್ಷತ್ರ" value={panchanga.nakshatra} color="text-amber-500" />
                    <InfoPill icon={<Sun size={13} />} label="ಸೂರ್ಯೋದಯ" value={panchanga.sunrise} color="text-orange-500" />
                    <InfoPill icon={<Sun size={13} />} label="ಸೂರ್ಯಾಸ್ತ" value={panchanga.sunset} color="text-rose-400" />
                </div>
            ) : (
                <p className="text-sm text-slate-500 py-4">ಪಂಚಾಂಗ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.</p>
            )}

            {/* ═══ Daily Schedule ═══ */}
            <div className="pt-3 border-t border-[var(--glass-border)] relative z-10">
                <div className="relative group inline-block">
                    <span className="cursor-pointer text-sm font-bold text-[var(--accent-saffron)] hover:text-orange-600 flex items-center gap-2 transition-colors">
                        <Clock size={15} />
                        ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ (Daily Routine)
                    </span>
                    <div className="absolute left-0 bottom-full mb-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                        <div className="bg-white/95 dark:bg-slate-900/95 border border-[var(--glass-border)] rounded-2xl shadow-xl p-4">
                            <h3 className="font-bold text-sm mb-3 text-[var(--text-primary)] border-b border-black/10 dark:border-white/10 pb-2 flex items-center gap-2">
                                <Clock size={14} className="text-amber-500" />
                                ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ
                            </h3>
                            {schedule.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {schedule.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2">
                                            <div className="w-6 h-6 rounded-full bg-white/50 dark:bg-black/50 border border-[var(--glass-border)] flex items-center justify-center shrink-0">
                                                <Clock size={10} className="text-[var(--primary)]" />
                                            </div>
                                            <div className="flex-1 flex flex-col">
                                                <span className="font-medium text-[var(--text-primary)] text-xs">{item.title}</span>
                                                <span className="font-mono text-[10px] text-[var(--text-secondary)]">{item.time} {item.period}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-[var(--text-secondary)] text-center py-2">ವೇಳಾಪಟ್ಟಿ ಲಭ್ಯವಿಲ್ಲ.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function InfoPill({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="flex items-center gap-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-2.5 hover:bg-white/40 dark:hover:bg-black/20 transition-colors">
            <div className={`w-7 h-7 rounded-full bg-white dark:bg-black/40 flex items-center justify-center shadow-sm shrink-0 ${color}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-medium leading-none mb-0.5">{label}</p>
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{value}</p>
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
