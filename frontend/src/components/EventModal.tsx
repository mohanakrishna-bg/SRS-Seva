import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Plus, Trash2, Check, Pencil, Sparkles, Moon, Sun, Star } from 'lucide-react';
import TransliteratedInput from './TransliteratedInput';

interface Highlight {
    id: number;
    text: string;
    time?: string;
}

interface PanchangaData {
    tithi: string;
    nakshatra: string;
    sunrise: string;
    sunset: string;
    indianDate: string;
}

interface EventModalProps {
    isOpen: boolean;
    date: Date;
    onClose: () => void;
}

export default function EventModal({ isOpen, date, onClose }: EventModalProps) {
    const [events, setEvents] = useState<Highlight[]>([]);
    const [panchanga, setPanchanga] = useState<PanchangaData | null>(null);

    // Add/Edit State
    const [isAdding, setIsAdding] = useState(false);
    const [newText, setNewText] = useState('');
    const [newTime, setNewTime] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [editTime, setEditTime] = useState('');

    const formattedDate = date.toLocaleDateString('kn-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const getStorageKey = () => `seva_highlights_kn_${date.toDateString()}`;

    useEffect(() => {
        if (!isOpen) return;

        // Load Events
        const storedEvents = localStorage.getItem(getStorageKey());
        if (storedEvents) {
            try { setEvents(JSON.parse(storedEvents)); } catch { setEvents([]); }
        } else {
            setEvents([]);
        }

        // Load Panchanga
        const cacheKey = `seva_panchanga_kn_${date.toDateString()}`;
        const cachedPanchanga = localStorage.getItem(cacheKey);

        if (cachedPanchanga) {
            setPanchanga(JSON.parse(cachedPanchanga));
        } else {
            // Generate Static Panchanga directly
            const sunriseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 15, 0);
            const staticData: PanchangaData = {
                tithi: getTithiAtSunrise(sunriseDate),
                nakshatra: getApproxNakshatra(date),
                sunrise: '06:15 AM',
                sunset: '06:42 PM',
                indianDate: getSakaSamvatDate(date),
            };
            setPanchanga(staticData);
            localStorage.setItem(cacheKey, JSON.stringify(staticData));
        }
    }, [isOpen, date.toDateString()]);

    const saveEvents = (items: Highlight[]) => {
        setEvents(items);
        localStorage.setItem(getStorageKey(), JSON.stringify(items));
    };

    const handleAdd = () => {
        if (!newText.trim()) return;
        const item: Highlight = { id: Date.now(), text: newText.trim(), time: newTime.trim() || undefined };
        saveEvents([...events, item]);
        setNewText('');
        setNewTime('');
        setIsAdding(false);
    };

    const handleRemove = (id: number) => saveEvents(events.filter((e) => e.id !== id));

    const startEditing = (h: Highlight) => {
        setEditingId(h.id);
        setEditText(h.text);
        setEditTime(h.time || '');
    };

    const saveEdit = () => {
        if (!editText.trim() || !editingId) return;
        saveEvents(events.map((h) => h.id === editingId ? { ...h, text: editText.trim(), time: editTime.trim() || undefined } : h));
        setEditingId(null);
        setEditText('');
        setEditTime('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[var(--glass-border)] overflow-hidden flex flex-col md:flex-row min-h-[400px]"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-[var(--primary)] to-amber-500 p-6 text-white relative flex-shrink-0">
                        <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-[url('/pattern.svg')] opacity-20 mix-blend-overlay" />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <Calendar size={18} />
                                <span className="text-sm font-bold uppercase tracking-wider">ದಿನಾಂಕದ ವಿವರ</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black">{formattedDate}</h2>
                            {panchanga && <p className="text-white/80 mt-1 font-medium">{panchanga.indianDate}</p>}
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-6">

                        {/* Panchanga Quick Info */}
                        {panchanga && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <PanchangaPill icon={<Moon size={14} />} label="ತಿಥಿ" value={panchanga.tithi} color="text-indigo-400" />
                                <PanchangaPill icon={<Star size={14} />} label="ನಕ್ಷತ್ರ" value={panchanga.nakshatra} color="text-amber-500" />
                                <PanchangaPill icon={<Sun size={14} />} label="ಸೂರ್ಯೋದಯ" value={panchanga.sunrise} color="text-orange-500" />
                                <PanchangaPill icon={<Sun size={14} />} label="ಸೂರ್ಯಾಸ್ತ" value={panchanga.sunset} color="text-rose-400" />
                            </div>
                        )}

                        <div className="w-full h-px bg-[var(--glass-border)]" />

                        {/* Events Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="text-[var(--primary)]" />
                                    <h3 className="font-bold text-[var(--text-primary)] text-lg">ವಿಶೇಷ ಸೇವೆಗಳು / ಘಟನೆಗಳು</h3>
                                </div>
                                <button
                                    onClick={() => setIsAdding(!isAdding)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-all shadow-sm"
                                >
                                    {isAdding ? <X size={14} /> : <Plus size={14} />}
                                    {isAdding ? 'ರದ್ದುಗೊಳಿಸಿ' : 'ಸೇರಿಸಿ'}
                                </button>
                            </div>

                            {/* Add Form */}
                            {isAdding && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] rounded-xl p-4 mb-4 space-y-3"
                                >
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">ವಿವರಣೆ</label>
                                        <TransliteratedInput
                                            value={newText}
                                            onChange={(val) => setNewText(val)}
                                            placeholder="ಘಟನೆಯ ವಿವರಣೆ..."
                                            multiline={true}
                                            enableVoice={true}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">ಸಮಯ (ಐಚ್ಛಿಕ)</label>
                                        <TransliteratedInput
                                            value={newTime}
                                            onChange={(val) => setNewTime(val)}
                                            placeholder="ಉದಾ: 10:00 AM"
                                            enableVoice={true}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button onClick={handleAdd} className="px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-all">
                                            <Check size={16} /> ಉಳಿಸಿ
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Events List */}
                            <div className="space-y-3">
                                {events.map((h) => (
                                    <div key={h.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] rounded-xl p-3 group">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shrink-0" />

                                        {editingId === h.id ? (
                                            <div className="flex-1 flex flex-col md:flex-row gap-2">
                                                <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                                                <input type="text" value={editTime} onChange={(e) => setEditTime(e.target.value)}
                                                    placeholder="ಸಮಯ" className="w-full md:w-32 px-3 py-1.5 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                                                <div className="flex shrink-0 gap-1">
                                                    <button onClick={saveEdit} className="p-1.5 rounded-lg bg-emerald-100/50 text-emerald-600 hover:bg-emerald-100 transition-all"><Check size={16} /></button>
                                                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-black/5 text-[var(--text-secondary)] hover:bg-black/10 transition-all"><X size={16} /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm md:text-base font-medium text-[var(--text-primary)] whitespace-pre-line">{h.text}</h4>
                                                    {h.time && <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">{h.time}</p>}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                                    <button onClick={() => startEditing(h)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleRemove(h.id)} className="p-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {events.length === 0 && !isAdding && (
                                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 border border-dashed border-[var(--glass-border)] rounded-2xl">
                                        <Sparkles className="mx-auto text-[var(--text-secondary)] opacity-40 mb-2" size={24} />
                                        <p className="text-sm text-[var(--text-secondary)]">ಯಾವುದೇ ವಿಶೇಷ ಘಟನೆಗಳಿಲ್ಲ</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function PanchangaPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
            <span className={`${color} mb-1.5`}>{icon}</span>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-medium mb-0.5">{label}</p>
            <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{value}</p>
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
