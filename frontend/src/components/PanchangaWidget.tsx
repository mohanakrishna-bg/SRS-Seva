import { useState, useEffect, type ReactNode } from 'react';
import { Calendar, Sun, Moon, Star, Loader2 } from 'lucide-react';

interface PanchangaData {
    tithi: string;
    nakshatra: string;
    sunrise: string;
    sunset: string;
    indianDate: string;
}

export default function PanchangaWidget({ date }: { date?: Date }) {
    const [data, setData] = useState<PanchangaData | null>(null);
    const [loading, setLoading] = useState(true);

    const activeDate = date || new Date();
    const formattedDate = activeDate.toLocaleDateString('kn-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    useEffect(() => {
        const fetchPanchanga = async () => {
            setLoading(true);
            try {
                const dateStr = activeDate.toDateString();
                const cacheKey = `seva_panchanga_kn_${dateStr}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    setData(JSON.parse(cached));
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

                setData(staticData);
                localStorage.setItem(cacheKey, JSON.stringify(staticData));
            } catch {
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPanchanga();
    }, [activeDate.toDateString()]);

    if (loading) {
        return (
            <div className="glass-card flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[var(--accent-saffron)]" />
            </div>
        );
    }

    return (
        <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-[var(--accent-saffron)]" />
                <h3 className="font-bold text-lg">ಪಂಚಾಂಗ</h3>
            </div>

            <p className="text-2xl font-bold mb-1">{formattedDate}</p>

            {data && (
                <>
                    <p className="text-sm text-[var(--accent-saffron)]/80 mb-5 font-medium">{data.indianDate}</p>

                    <div className="grid grid-cols-2 gap-3">
                        <InfoPill icon={<Moon size={14} />} label="ತಿಥಿ" value={data.tithi} color="text-[var(--accent-saffron)]" />
                        <InfoPill icon={<Star size={14} />} label="ನಕ್ಷತ್ರ" value={data.nakshatra} color="text-amber-400" />
                        <InfoPill icon={<Sun size={14} />} label="ಸೂರ್ಯೋದಯ" value={data.sunrise} color="text-orange-400" />
                        <InfoPill icon={<Sun size={14} />} label="ಸೂರ್ಯಾಸ್ತ" value={data.sunset} color="text-red-400" />
                    </div>
                </>
            )}

            {!data && (
                <p className="text-sm text-slate-500 mt-2">ಪಂಚಾಂಗ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕಿಸಿ.</p>
            )}
        </div>
    );
}

function InfoPill({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="flex items-center gap-2 bg-black/[0.03] rounded-lg px-3 py-2">
            <span className={color}>{icon}</span>
            <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}

// --- Tithi at Sunrise ---
// Uses the lunar phase at sunrise time for the given date
function getTithiAtSunrise(sunriseDate: Date): string {
    const tithis = [
        'ಪ್ರತಿಪದೆ', 'ದ್ವಿತೀಯಾ', 'ತೃತೀಯಾ', 'ಚತುರ್ಥೀ', 'ಪಂಚಮಿ',
        'ಷಷ್ಟಿ', 'ಸಪ್ತಮಿ', 'ಅಷ್ಟಮಿ', 'ನವಮಿ', 'ದಶಮಿ',
        'ಏಕಾದಶಿ', 'ದ್ವಾದಶಿ', 'ತ್ರಯೋದಶಿ', 'ಚತುರ್ದಶಿ'
    ];
    // Known new moon: January 6, 2000 18:14 UTC
    const epoch = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
    const diffMs = sunriseDate.getTime() - epoch.getTime();
    const synodicMonth = 29.53058868; // days
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const lunarAge = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
    const tithiNum = Math.floor(lunarAge / (synodicMonth / 30));

    if (tithiNum < 15) {
        // Shukla paksha (waxing)
        const idx = tithiNum % 15;
        if (idx === 14) return 'ಶುಕ್ಲ ಪೂರ್ಣಿಮೆ';
        return `ಶುಕ್ಲ ${tithis[idx]}`;
    } else {
        // Krishna paksha (waning)
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

// --- Saka Samvat Calendar ---
function getSakaSamvatDate(date: Date): string {
    const sakaMonths = [
        'ಚೈತ್ರ', 'ವೈಶಾಖ', 'ಜ್ಯೇಷ್ಠ', 'ಆಷಾಢ',
        'ಶ್ರಾವಣ', 'ಭಾದ್ರಪದ', 'ಆಶ್ವಿನ', 'ಕಾರ್ತಿಕ',
        'ಮಾರ್ಗಶಿರ', 'ಪುಷ್ಯ', 'ಮಾಘ', 'ಫಾಲ್ಗುಣ'
    ];

    // Saka year starts ~March 22 (Chaitra 1)
    // Saka era = Gregorian year - 78 (after March 22) or - 79 (before March 22)
    const marchEquinox = new Date(date.getFullYear(), 2, 22); // March 22
    let sakaYear: number;
    let monthIdx: number;

    if (date >= marchEquinox) {
        sakaYear = date.getFullYear() - 78;
        // Calculate which Saka month
        const daysSinceEquinox = Math.floor((date.getTime() - marchEquinox.getTime()) / (1000 * 60 * 60 * 24));
        // Approximate: ~30-31 days per month
        monthIdx = Math.min(11, Math.floor(daysSinceEquinox / 30.4));
    } else {
        sakaYear = date.getFullYear() - 79;
        // Before March 22 = end of previous Saka year (Maagha/Phalguna)
        const prevEquinox = new Date(date.getFullYear() - 1, 2, 22);
        const daysSinceEquinox = Math.floor((date.getTime() - prevEquinox.getTime()) / (1000 * 60 * 60 * 24));
        monthIdx = Math.min(11, Math.floor(daysSinceEquinox / 30.4));
    }

    return `${sakaMonths[monthIdx]}, ಶಕ ಸಂವತ್ ${sakaYear}`;
}
