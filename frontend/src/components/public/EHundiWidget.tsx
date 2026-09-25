import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Copy, Check, ExternalLink, Heart, Sparkles, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { transliterateToKannada, transliterateKnToEn, isKannada } from '../../transliterate';

interface EHundiWidgetProps {
    lang: 'kn' | 'en';
    t: (kn: string, en: string) => string;
    upiId?: string;
}

const PRESET_AMOUNTS = [1, 5, 10, 20, 50, 100];

export default function EHundiWidget({ lang, t, upiId = 'pinelabs.stq3957386@pineaxis' }: EHundiWidgetProps) {
    const [amount, setAmount] = useState<number>(10);
    const [customInput, setCustomInput] = useState<string>('10');
    const [devoteeName, setDevoteeName] = useState('');
    const [nameScript, setNameScript] = useState<'kn' | 'en'>(lang);
    const [isTranslatingName, setIsTranslatingName] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Keep cached versions of devotee name in both languages for clean back-and-forth switching
    const nameCacheRef = useRef<{ kn?: string; en?: string }>({});

    const isKn = lang === 'kn';

    // Synchronize name script whenever page language toggles
    useEffect(() => {
        handleToggleNameScript(lang);
    }, [lang]);

    const handleToggleNameScript = async (targetScript: 'kn' | 'en') => {
        setNameScript(targetScript);
        if (!devoteeName.trim()) return;

        if (targetScript === 'kn') {
            if (nameCacheRef.current.kn) {
                setDevoteeName(nameCacheRef.current.kn);
            } else if (/[a-zA-Z]/.test(devoteeName)) {
                setIsTranslatingName(true);
                try {
                    nameCacheRef.current.en = devoteeName;
                    const kn = await transliterateToKannada(devoteeName);
                    if (kn) {
                        nameCacheRef.current.kn = kn;
                        setDevoteeName(kn);
                    }
                } finally {
                    setIsTranslatingName(false);
                }
            }
        } else {
            if (nameCacheRef.current.en) {
                setDevoteeName(nameCacheRef.current.en);
            } else if (isKannada(devoteeName)) {
                nameCacheRef.current.kn = devoteeName;
                const en = transliterateKnToEn(devoteeName);
                if (en) {
                    nameCacheRef.current.en = en;
                    setDevoteeName(en);
                }
            }
        }
    };

    // Auto-transliterate English words to Kannada with debounce when in Kannada script mode
    useEffect(() => {
        if (nameScript !== 'kn') return;
        if (!devoteeName.trim() || !/[a-zA-Z]/.test(devoteeName)) return;

        const timer = setTimeout(async () => {
            setIsTranslatingName(true);
            try {
                const kn = await transliterateToKannada(devoteeName);
                if (kn && kn !== devoteeName) {
                    nameCacheRef.current.en = devoteeName;
                    nameCacheRef.current.kn = kn;
                    setDevoteeName(kn);
                }
            } catch {
                /* ignore */
            } finally {
                setIsTranslatingName(false);
            }
        }, 750);

        return () => clearTimeout(timer);
    }, [devoteeName, nameScript]);

    const handleNameChange = (val: string) => {
        setDevoteeName(val);
        nameCacheRef.current[nameScript] = val;
        // Invalidate opposite language cache so next switch re-derives fresh translation
        if (nameScript === 'kn') {
            nameCacheRef.current.en = undefined;
        } else {
            nameCacheRef.current.kn = undefined;
        }
    };

    const handleNameBlur = async () => {
        if (!devoteeName.trim()) return;
        if (nameScript === 'kn' && /[a-zA-Z]/.test(devoteeName)) {
            setIsTranslatingName(true);
            try {
                nameCacheRef.current.en = devoteeName;
                const kn = await transliterateToKannada(devoteeName);
                if (kn) {
                    setDevoteeName(kn);
                    nameCacheRef.current.kn = kn;
                }
            } finally {
                setIsTranslatingName(false);
            }
        }
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleNameBlur();
        }
    };

    const handleForceTransliterate = async () => {
        if (!devoteeName.trim()) return;
        setIsTranslatingName(true);
        try {
            if (nameScript === 'kn') {
                const kn = await transliterateToKannada(devoteeName);
                if (kn) {
                    setDevoteeName(kn);
                    nameCacheRef.current.kn = kn;
                }
            } else {
                const en = transliterateKnToEn(devoteeName);
                if (en) {
                    setDevoteeName(en);
                    nameCacheRef.current.en = en;
                }
            }
        } finally {
            setIsTranslatingName(false);
        }
    };

    const handleSelectPreset = (val: number) => {
        setAmount(val);
        setCustomInput(val.toString());
        setError(null);
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valStr = e.target.value;
        setCustomInput(valStr);

        const num = parseInt(valStr, 10);
        if (isNaN(num)) {
            setError(t('ದಯವಿಟ್ಟು ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ (₹೧ - ₹೧೦೦)', 'Please enter an amount (₹1 - ₹100)'));
        } else if (num < 1 || num > 100) {
            setError(t('ಕಾಣಿಕೆ ಮೊತ್ತವು ₹೧ ರಿಂದ ₹೧೦೦ ರ ಒಳಗೆ ಇರಬೇಕು', 'Offering must be between ₹1 and ₹100'));
            setAmount(Math.min(100, Math.max(1, num)));
        } else {
            setError(null);
            setAmount(num);
        }
    };

    const handleCopyUpi = () => {
        navigator.clipboard.writeText(upiId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    // Embed valid payable amount in UPI URI (clamped between ₹1 and ₹100)
    const payableAmount = isNaN(amount) || amount < 1 ? 1 : Math.min(100, amount);
    const note = `${isKn ? 'ರಾಯರ ಇ-ಹುಂಡಿ ಕಾಣಿಕೆ' : 'Rayara e-Hundi Seva'}${devoteeName.trim() ? ` - ${devoteeName.trim()}` : ''}`;
    const payeeName = 'Sri Guru Raghavendra Seva Trust';
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${payableAmount.toFixed(2)}&tn=${encodeURIComponent(note)}&cu=INR`;

    return (
        <motion.div
            id="e-hundi"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border overflow-hidden shadow-2xl transition-all relative"
            style={{
                background: 'linear-gradient(145deg, var(--pub-bg-card, #ffffff) 0%, rgba(254, 243, 199, 0.4) 100%)',
                borderColor: 'var(--pub-border)',
            }}
        >
            {/* Top Decorative Border */}
            <div
                className="h-2 w-full"
                style={{
                    background: 'linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #b45309 100%)',
                }}
            />

            <div className="p-6 md:p-8">
                {/* Header with Hundi Motif */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[var(--pub-border)]">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md"
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b, #b45309)',
                                color: 'white',
                            }}
                        >
                            🪔
                        </div>
                        <div>
                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
                                    {t('ಡಿಜಿಟಲ್ ಕಾಣಿಕೆ', 'Digital Offering')}
                                </span>
                                <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                                    <Sparkles size={12} />
                                    {t('₹೧ ರಿಂದ ₹೧೦೦ ಮಾತ್ರ', '₹1 to ₹100 only')}
                                </span>
                            </div>
                            <h3
                                className="text-xl md:text-2xl font-bold mt-1"
                                style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                            >
                                {t('ಶ್ರೀ ರಾಯರ ಇ-ಹುಂಡಿ (e-Hundi)', 'Sri Rayaru e-Hundi')}
                            </h3>
                            <p className="text-xs md:text-sm text-[var(--pub-text-muted)] mt-0.5">
                                {t(
                                    'ಶ್ರೀ ರಾಯರ ಸನ್ನಿಧಿಗೆ ನಿಮ್ಮ ಶ್ರದ್ಧಾಪೂರ್ವಕ ಕಾಣಿಕೆಯನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಸಮರ್ಪಿಸಿ.',
                                    'Offer your devotional monetary offering online to Sri Rayaru.'
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="text-center sm:text-right shrink-0">
                        <span className="text-xs text-[var(--pub-text-muted)] block">
                            {t('ಆಯ್ಕೆಮಾಡಿದ ಕಾಣಿಕೆ', 'Selected Offering')}
                        </span>
                        <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                            ₹{payableAmount}
                        </span>
                    </div>
                </div>

                {/* Main Content Grid: Controls & QR Code */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
                    {/* Left 7 Cols: Amount Selector & Devotee Info */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Preset Denominations */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--pub-ink-light)] mb-2.5">
                                {t('ಕಾಣಿಕೆ ಮೊತ್ತ ಆಯ್ಕೆಮಾಡಿ (₹೧ - ₹೧೦೦):', 'Select Offering Amount (₹1 - ₹100):')}
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                                {PRESET_AMOUNTS.map((amt) => {
                                    const isSelected = amount === amt && !error;
                                    return (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => handleSelectPreset(amt)}
                                            className={`py-3 px-2 rounded-2xl font-bold text-sm transition-all duration-200 border flex flex-col items-center justify-center ${
                                                isSelected
                                                    ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105 ring-2 ring-amber-400/40'
                                                    : 'bg-black/5 dark:bg-white/5 border-[var(--pub-border)] text-[var(--pub-ink)] hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                                            }`}
                                        >
                                            <span>₹{amt}</span>
                                            <span className="text-[9px] opacity-75 font-normal">
                                                {amt === 1 ? t('ಕನಿಷ್ಠ', 'Min') : amt === 100 ? t('ಗರಿಷ್ಠ', 'Max') : t('ಕಾಣಿಕೆ', 'Kanike')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Amount Field with Range Constraint */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--pub-ink-light)] mb-1.5">
                                {t('ಇತರ ಮೊತ್ತ (₹೧ ರಿಂದ ₹೧೦೦ ರ ಒಳಗೆ):', 'Custom Amount (between ₹1 and ₹100):')}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[var(--pub-text-muted)]">
                                    ₹
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={customInput}
                                    onChange={handleCustomChange}
                                    placeholder="1 - 100"
                                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-[var(--pub-border)] bg-white/70 dark:bg-black/20 text-[var(--pub-ink)] text-base font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                />
                            </div>
                            {error ? (
                                <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                                    ⚠️ {error}
                                </p>
                            ) : (
                                <p className="text-[11px] text-[var(--pub-text-muted)] mt-1">
                                    {t(
                                        'ಗಮನಿಸಿ: ಇ-ಹುಂಡಿಯ ಗರಿಷ್ಠ ಮಿತಿ ₹೧೦೦. ಹೆಚ್ಚಿನ ದೇಣಿಗೆಗಾಗಿ ಸೇವಾ ವಿಭಾಗವನ್ನು ಬಳಸಿ.',
                                        'Note: e-Hundi maximum limit is ₹100. For larger contributions, please use the Sevas page.'
                                    )}
                                </p>
                            )}
                        </div>

                        {/* Optional Devotee Name / Prarthana with Dynamic Transliteration */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5 gap-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--pub-ink-light)]">
                                    {t('ಭಕ್ತರ ಹೆಸರು / ಸಂಕಲ್ಪ (ಐಚ್ಛಿಕ):', 'Devotee Name / Sankalpa Note (Optional):')}
                                </label>
                                {/* Name Script Switcher: Kannada or English */}
                                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--pub-border)] text-[11px] shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleNameScript('kn')}
                                        className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                                            nameScript === 'kn'
                                                ? 'bg-amber-500 text-white shadow-sm'
                                                : 'text-[var(--pub-text-muted)] hover:text-[var(--pub-ink)]'
                                        }`}
                                        title={t('ಕನ್ನಡ ಲಿಪಿಯಲ್ಲಿ ಬರೆಯಿರಿ', 'Write in Kannada')}
                                    >
                                        ಕನ್ನಡ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleNameScript('en')}
                                        className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                                            nameScript === 'en'
                                                ? 'bg-amber-500 text-white shadow-sm'
                                                : 'text-[var(--pub-text-muted)] hover:text-[var(--pub-ink)]'
                                        }`}
                                        title={t('ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಬರೆಯಿರಿ', 'Keep in English')}
                                    >
                                        English
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={devoteeName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    onBlur={handleNameBlur}
                                    onKeyDown={handleNameKeyDown}
                                    placeholder={
                                        nameScript === 'kn'
                                            ? 'ಉದಾ: ರಾಘವೇಂದ್ರ ರಾವ್, ಮೈಸೂರು (ಇಂಗ್ಲಿಷ್‌ನಲ್ಲೂ ಟೈಪ್ ಮಾಡಬಹುದು)'
                                            : 'e.g. Raghavendra Rao, Mysuru'
                                    }
                                    className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-[var(--pub-border)] bg-white/70 dark:bg-black/20 text-[var(--pub-ink)] text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                />
                                {nameScript === 'kn' && /[a-zA-Z]/.test(devoteeName) && (
                                    <button
                                        type="button"
                                        onClick={handleForceTransliterate}
                                        disabled={isTranslatingName}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-amber-500 text-white text-xs hover:bg-amber-600 transition-colors shadow-sm"
                                        title={t('ಕನ್ನಡಕ್ಕೆ ಪರಿವರ್ತಿಸಿ', 'Convert to Kannada')}
                                    >
                                        <RefreshCw size={13} className={isTranslatingName ? 'animate-spin' : ''} />
                                    </button>
                                )}
                            </div>

                            {/* Devotee Name Display Tag in currently active script */}
                            {devoteeName.trim() && (
                                <div className="mt-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 shrink-0">
                                            {t('ಕಾಣಿಕೆದಾರರು', 'Devotee')}:
                                        </span>
                                        <span className="font-bold text-[var(--pub-ink)] truncate">
                                            {devoteeName}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold shrink-0 ml-2">
                                        ✓ {nameScript === 'kn' ? 'ಕನ್ನಡ' : 'English'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Actions for Mobile / UPI App */}
                        <div className="pt-2 flex flex-wrap gap-3 items-center">
                            <a
                                href={upiUri}
                                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                }}
                            >
                                <Heart size={16} className="fill-white" />
                                {t(`₹${payableAmount} ಕಾಣಿಕೆ ಸಲ್ಲಿಸಿ (UPI)`, `Offer ₹${payableAmount} via UPI`)}
                                <ExternalLink size={14} className="opacity-75 ml-1" />
                            </a>

                            <button
                                type="button"
                                onClick={handleCopyUpi}
                                className="flex items-center gap-1.5 py-3 px-4 rounded-2xl font-semibold text-xs border border-[var(--pub-border)] bg-black/5 dark:bg-white/5 text-[var(--pub-ink)] hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                                title="Copy UPI ID"
                            >
                                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                <span>{copied ? t('ನಕಲಿಸಲಾಗಿದೆ!', 'Copied!') : t('UPI ID ನಕಲಿಸಿ', 'Copy UPI ID')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Right 5 Cols: Dynamic QR Code Card with Embedded Amount */}
                    <div className="lg:col-span-5 flex flex-col items-center text-center">
                        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-400/40 shadow-xl max-w-[270px] w-full flex flex-col items-center">
                            <div className="flex items-center justify-between w-full text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 px-1">
                                <span className="flex items-center gap-1">
                                    <QrCode size={14} />
                                    {t('ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಪಾವತಿಸಿ', 'Scan & Pay')}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300">
                                    UPI
                                </span>
                            </div>

                            {/* Dynamically Generated UPI QR Code embedding Amount and UPI ID */}
                            <div className="rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-800/50 bg-white p-3.5 w-[190px] h-[190px] flex items-center justify-center shadow-inner relative group">
                                <QRCodeSVG
                                    value={upiUri}
                                    size={160}
                                    level="M"
                                    includeMargin={false}
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Dynamic Amount and VPA Badges */}
                            <div className="mt-3 w-full">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 mb-1.5 shadow-sm">
                                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                                        {t('ನಿಗದಿತ ಮೊತ್ತ', 'Payable')}:
                                    </span>
                                    <span className="text-sm font-mono font-extrabold text-amber-700 dark:text-amber-300">
                                        ₹{payableAmount.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-[11px] font-mono text-[var(--pub-text-muted)] truncate px-1">
                                    {upiId}
                                </p>
                                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                                    ✓ {t('ಅಧಿಕೃತ ಟ್ರಸ್ಟ್ ಖಾತೆ', 'Verified Trust Account')}
                                </span>
                            </div>
                        </div>

                        {/* Temple Office Receipt Confirmation Notice */}
                        <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center max-w-[320px]">
                            <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
                                📜 {t(
                                    'ಯುಪಿಐ ಮೂಲಕ ಹಣ ಪಾವತಿಸಿದ ನಂತರ, ಕಛೇರಿಯಲ್ಲಿ ಸ್ವೀಕೃತಿ ದೃಢೀಕರಿಸಿ ಅಧಿಕೃತ ರಸೀತಿ ಪಡೆಯಬೇಕಾಗಿ ವಿನಂತಿ.',
                                    'Devotees paying via UPI are requested to confirm receipt at the temple office and obtain the official receipt.'
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
