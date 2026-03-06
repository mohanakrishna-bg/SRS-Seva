import { useState, useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sun, Moon, Star, Loader2, Clock } from 'lucide-react';

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
    date?: Date;
}

const SETTINGS_KEY = 'seva_org_settings';

export default function EeDinaCard({ date }: EeDinaCardProps) {
    const [panchanga, setPanchanga] = useState<PanchangaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

    const activeDate = date || new Date();
    const formattedDate = activeDate.toLocaleDateString('kn-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    useEffect(() => {
        // Load Standard Schedule from Settings
        try {
            const storedSettings = localStorage.getItem(SETTINGS_KEY);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                if (parsed.standardSchedule && Array.isArray(parsed.standardSchedule)) {
                    // Sort schedule by time (simplified sorting for display)
                    const sorted = [...parsed.standardSchedule].sort((a, b) => {
                        const timeA = parseTime(a.time, a.period);
                        const timeB = parseTime(b.time, b.period);
                        return timeA - timeB;
                    });
                    setSchedule(sorted);
                }
            }
        } catch { /* ignore */ }

        // Special Events logic moved to SpecialEventsCard.tsx

        // Fetch Panchanga
        const fetchPanchanga = async () => {
            setLoading(true);
            try {
                const dateStr = activeDate.toDateString();
                const cacheKey = `seva_panchanga_kn_${dateStr}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    setPanchanga(JSON.parse(cached));
                    setLoading(false);
                    return;
                }

                // Approximate sunrise time for South India (~6:15 AM)
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
            } catch {
                setPanchanga(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPanchanga();
    }, [activeDate.toDateString()]);

    // Helper to sort times
    const parseTime = (time: string, period: string) => {
        try {
            const [hoursStr, minutesStr] = time.split(':');
            let hours = parseInt(hoursStr, 10);
            const minutes = parseInt(minutesStr || '0', 10);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        } catch { return 0; }
    };

    if (loading) {
        return (
            <div className="glass-card flex items-center justify-center py-12 lg:col-span-2">
                <Loader2 size={32} className="animate-spin text-[var(--accent-saffron)]" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card relative overflow-hidden lg:col-span-2 flex flex-col md:flex-row gap-6"
        >
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-400/10 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Left Column: Date & Panchanga */}
            <div className="flex-1 space-y-5 relative z-10">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-saffron)]/10 text-[var(--accent-saffron)] mb-3 border border-[var(--accent-saffron)]/20">
                        <Calendar size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">ಈ ದಿನ (Today)</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-[var(--primary)] leading-tight mb-1">
                        {formattedDate}
                    </h2>
                    {panchanga && (
                        <p className="text-sm md:text-base text-[var(--text-secondary)] font-medium">
                            {panchanga.indianDate}
                        </p>
                    )}
                </div>

                {panchanga ? (
                    <div className="grid grid-cols-2 gap-3">
                        <InfoPill icon={<Moon size={16} />} label="ತಿಥಿ (Tithi)" value={panchanga.tithi} color="text-indigo-400" />
                        <InfoPill icon={<Star size={16} />} label="ನಕ್ಷತ್ರ (Nakshatra)" value={panchanga.nakshatra} color="text-amber-500" />
                        <InfoPill icon={<Sun size={16} />} label="ಸೂರ್ಯೋದಯ (Sunrise)" value={panchanga.sunrise} color="text-orange-500" />
                        <InfoPill icon={<Sun size={16} />} label="ಸೂರ್ಯಾಸ್ತ (Sunset)" value={panchanga.sunset} color="text-rose-400" />
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 py-4">ಪಂಚಾಂಗ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.</p>
                )}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-[var(--glass-border)] to-transparent" />
            <div className="block md:hidden h-px bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent w-full my-4" />

            <div className="flex-1 flex flex-col gap-6">
                {/* Schedule Section */}
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4 text-[var(--text-primary)]">
                        <Clock size={16} className="text-amber-500" />
                        <h3 className="font-bold text-sm">ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ (Schedule)</h3>
                    </div>

                    {schedule.length > 0 ? (
                        <div className="space-y-3">
                            {schedule.map((item, idx) => (
                                <div key={item.id} className="flex items-center gap-3 group relative">
                                    {/* Timeline Line */}
                                    {idx !== schedule.length - 1 && (
                                        <div className="absolute left-[15px] top-[24px] bottom-[-12px] w-px bg-[var(--glass-border)] group-hover:bg-[var(--primary)]/30 transition-colors" />
                                    )}

                                    <div className="w-8 h-8 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center shrink-0 z-10 shadow-sm">
                                        <Clock size={12} className="text-[var(--primary)]" />
                                    </div>

                                    <div className="flex-1 bg-white/40 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl px-4 py-2 flex justify-between items-center group-hover:border-[var(--primary)]/30 transition-colors">
                                        <span className="font-medium text-[var(--text-primary)] text-sm">{item.title}</span>
                                        <span className="font-mono text-xs font-bold text-[var(--text-secondary)] bg-[var(--glass-bg)] px-2 py-1 rounded-md">
                                            {item.time} <span className="text-[10px]">{item.period}</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col justify-center items-center text-center p-6 border border-dashed border-[var(--glass-border)] rounded-2xl bg-[var(--glass-bg)]">
                            <Clock className="mb-2 text-[var(--text-secondary)] opacity-50" size={24} />
                            <p className="text-sm text-[var(--text-secondary)]">ವೇಳಾಪಟ್ಟಿ ಲಭ್ಯವಿಲ್ಲ.</p>
                            <p className="text-xs text-[var(--text-secondary)]/70 mt-1">ಸೆಟ್ಟಿಂಗ್ಸ್ ನಲ್ಲಿ ಸೇರಿಸಿ.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function InfoPill({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="flex items-center gap-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-3 hover:bg-white/40 dark:hover:bg-black/20 transition-colors">
            <div className={`w-8 h-8 rounded-full bg-white dark:bg-black/40 flex items-center justify-center shadow-sm ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-medium mb-0.5">{label}</p>
                <p className="text-xs md:text-sm font-bold text-[var(--text-primary)]">{value}</p>
            </div>
        </div>
    );
}

// --- Tithi at Sunrise ---
function getTithiAtSunrise(sunriseDate: Date): string {
    const tithis = [
        'ಪ್ರತಿಪದೆ', 'ದ್ವಿತೀಯಾ', 'ತೃತೀಯಾ', 'ಚತುರ್ಥೀ', 'ಪಂಚಮಿ',
        'ಷಷ್ಟಿ', 'ಸಪ್ತಮಿ', 'ಅಷ್ಟಮಿ', 'ನವಮಿ', 'ದಶಮಿ',
        'ಏಕಾದಶಿ', 'ದ್ವಾದಶಿ', 'ತ್ರಯೋದಶಿ', 'ಚತುರ್ದಶಿ'
    ];
    const epoch = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
    const diffMs = sunriseDate.getTime() - epoch.getTime();
    const synodicMonth = 29.53058868;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const lunarAge = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
    const tithiNum = Math.floor(lunarAge / (synodicMonth / 30));

    if (tithiNum < 15) {
        const idx = tithiNum % 15;
        if (idx === 14) return 'ಶುಕ್ಲ ಪೂರ್ಣಿಮೆ';
        return `ಶುಕ್ಲ ${tithis[idx]}`;
    } else {
        const idx = (tithiNum - 15) % 15;
        if (idx === 14) return 'ಕೃಷ್ಣ ಅಮಾವಾಸ್ಯೆ';
        return `ಕೃಷ್ಣ ${tithis[idx]}`;
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
    const sakaMonths = [
        'ಚೈತ್ರ', 'ವೈಶಾಖ', 'ಜ್ಯೇಷ್ಠ', 'ಆಷಾಢ',
        'ಶ್ರಾವಣ', 'ಭಾದ್ರಪದ', 'ಆಶ್ವಿನ', 'ಕಾರ್ತಿಕ',
        'ಮಾರ್ಗಶಿರ', 'ಪುಷ್ಯ', 'ಮಾಘ', 'ಫಾಲ್ಗುಣ'
    ];

    const marchEquinox = new Date(date.getFullYear(), 2, 22);
    let sakaYear: number;
    let monthIdx: number;

    if (date >= marchEquinox) {
        sakaYear = date.getFullYear() - 78;
        const daysSinceEquinox = Math.floor((date.getTime() - marchEquinox.getTime()) / (1000 * 60 * 60 * 24));
        monthIdx = Math.min(11, Math.floor(daysSinceEquinox / 30.4));
    } else {
        sakaYear = date.getFullYear() - 79;
        const prevEquinox = new Date(date.getFullYear() - 1, 2, 22);
        const daysSinceEquinox = Math.floor((date.getTime() - prevEquinox.getTime()) / (1000 * 60 * 60 * 24));
        monthIdx = Math.min(11, Math.floor(daysSinceEquinox / 30.4));
    }

    return `${sakaMonths[monthIdx]}, ಶಕ ಸಂವತ್ ${sakaYear}`;
}
