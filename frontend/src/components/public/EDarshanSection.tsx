import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye,
    RefreshCw,
    Maximize2,
    X,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Heart,
    Info,
    Sparkles,
    Calendar,
    Clock
} from 'lucide-react';
import EHundiWidget from './EHundiWidget';

interface EDarshanSectionProps {
    lang: 'kn' | 'en';
    t: (kn: string, en: string) => string;
    upiId?: string;
}

export default function EDarshanSection({ lang, t, upiId }: EDarshanSectionProps) {
    const isKn = lang === 'kn';

    // Current session determination based on time of day
    const [currentHour] = useState(() => new Date().getHours());
    const isEvening = currentHour >= 16; // 4 PM onwards is evening session

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>(() => {
        const now = new Date();
        return now.toLocaleTimeString(isKn ? 'kn-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' });
    });

    // Lightbox modal state for static image
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Video play/pause & audio state
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    const handleVideoClick = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            const now = new Date();
            setLastUpdated(now.toLocaleTimeString(isKn ? 'kn-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' }));
            setIsRefreshing(false);
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
            }
        }, 800);
    };

    // Close lightbox on Escape key
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxOpen(false);
        };
        if (lightboxOpen) {
            window.addEventListener('keydown', onKeyDown);
        }
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxOpen]);

    const formattedTodayDate = new Date().toLocaleDateString(isKn ? 'kn-IN' : 'en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <section id="e-darshan" className="py-12 px-4 md:px-8 relative scroll-mt-20" style={{ background: 'var(--pub-bg)' }}>
            <div className="max-w-6xl mx-auto space-y-10">

                {/* ===== HEADER & DEVOTIONAL PURPOSE ===== */}
                <div className="text-center max-w-3xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold tracking-wide shadow-sm">
                        <Eye size={14} className="text-amber-600 dark:text-amber-400" />
                        <span>{t('ನಿತ್ಯ ಇ-ದರ್ಶನ ಮತ್ತು ಕಾಣಿಕೆ', 'Daily e-Darshan & Offering')}</span>
                        <span className="opacity-40">•</span>
                        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                            <Sparkles size={11} />
                            {isEvening ? t('ಸಾಯಂಕಾಲದ ಪೂಜೆ', 'Evening Pooja') : t('ಪ್ರಾತಃಕಾಲದ ಪೂಜೆ', 'Morning Pooja')}
                        </span>
                    </div>

                    <h2
                        className="text-2xl md:text-4xl font-extrabold tracking-tight"
                        style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                    >
                        {t('ಶ್ರೀ ರಾಯರ ಸನ್ನಿಧಿಯ ವರ್ಚುವಲ್ ಇ-ದರ್ಶನ', 'Virtual e-Darshan of Sri Rayara Sannidhi')}
                    </h2>

                    {/* Facility Description for Devotees Unable to Visit Physically */}
                    <p className="text-sm md:text-base leading-relaxed text-[var(--pub-text-muted)] font-medium">
                        {t(
                            'ದೇವಸ್ಥಾನಕ್ಕೆ ಖುದ್ದಾಗಿ ಭೇಟಿ ನೀಡಲು ಸಾಧ್ಯವಾಗದ ಭಕ್ತಾದಿಗಳು ತಮ್ಮ ಮನೆಯಲ್ಲೇ ಕುಳಿತು ನಿತ್ಯವೂ ಶ್ರೀ ರಾಯರ ಪಾವನ ದರ್ಶನ ಪಡೆದು ನಮಸ್ಕರಿಸಲು ಈ ವರ್ಚುವಲ್ (ಇ-ದರ್ಶನ) ಸೌಲಭ್ಯವನ್ನು ಕಲ್ಪಿಸಲಾಗಿದೆ.',
                            'A sacred virtual darshan facility created for devotees who are unable to physically visit the temple, enabling them to pay their daily obeisance and experience the divine grace of Sri Rayaru from home.'
                        )}
                    </p>

                    {/* Daily Refresh Status Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--pub-border)] text-[var(--pub-ink)]">
                            <Calendar size={13} className="text-amber-600" />
                            <span>{formattedTodayDate}</span>
                        </span>

                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--pub-border)] text-[var(--pub-text-muted)]">
                            <Clock size={13} className="text-amber-600" />
                            <span>{t('ಇಂದಿನ ನವೀಕರಣ:', 'Updated:')} {lastUpdated}</span>
                        </span>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold transition-all"
                            title={t('ಇಂದಿನ ದರ್ಶನ ನವೀಕರಿಸಿ', "Refresh Today's Darshan")}
                        >
                            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-amber-600' : 'text-amber-600'} />
                            <span>{isRefreshing ? t('ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...', 'Refreshing...') : t('ದರ್ಶನ ನವೀಕರಿಸಿ', 'Refresh Darshan')}</span>
                        </button>
                    </div>
                </div>

                {/* ===== VIRTUAL DARSHAN MEDIA CARDS (STATIC IMAGE & VIDEO CLIP) ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

                    {/* 1. Static Image: Sanctum Sanctorum Alankara Darshan */}
                    <div className="group rounded-3xl border border-[var(--pub-border)] bg-[var(--pub-bg-card)] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col">
                        {/* Card Header Banner */}
                        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-b border-[var(--pub-border)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🪔</span>
                                <div>
                                    <h4 className="text-sm font-bold text-[var(--pub-ink)]" style={{ fontFamily: 'var(--pub-font-heading)' }}>
                                        {t('ಗರ್ಭಗುಡಿ ಅಲಂಕಾರ ದರ್ಶನ', 'Sanctum Sanctorum Alankara')}
                                    </h4>
                                    <p className="text-[11px] text-[var(--pub-text-muted)]">
                                        {t('ದೇವಸ್ಥಾನದ ಗರ್ಭಗುಡಿ ಅಲಂಕಾರ ದರ್ಶನ (ನೇರ ಪ್ರಸಾರ ಶೀಘ್ರದಲ್ಲಿ)', 'Sanctum Sanctorum Darshan (Live Feed Ready)')}
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {t('ಲೈವ್ ಫೀಡ್ ಸಿದ್ಧತೆ', 'Live Feed Ready')}
                            </span>
                        </div>

                        {/* Image Container with Click-to-Enlarge Lightbox Trigger */}
                        <div
                            onClick={() => setLightboxOpen(true)}
                            className="relative flex-1 aspect-[4/3] w-full overflow-hidden cursor-pointer bg-slate-950 flex items-center justify-center group/img"
                        >
                            <img
                                src="/images/aaradhana/sanctum_alankara.jpg"
                                alt="Sanctum Sanctorum Sri Raghavendra Swamy Moola Brindavana"
                                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover/img:scale-105"
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-70 group-hover/img:opacity-40 transition-opacity" />

                            {/* Enlarge Prompt Pill */}
                            <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-white/20 transition-transform group-hover/img:scale-105">
                                <Maximize2 size={13} className="text-amber-400" />
                                <span>{t('ದೊಡ್ಡದಾಗಿ ವೀಕ್ಷಿಸಿ', 'Click to Enlarge')}</span>
                            </div>

                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-amber-300 text-[11px] font-bold border border-amber-400/30">
                                🌺 {isEvening ? t('ಸಂಜೆಯ ವಿಶೇಷ ದರ್ಶನ', 'Evening Special Darshan') : t('ಬೆಳಗಿನ ಅಲಂಕಾರ ದರ್ಶನ', 'Morning Alankara Darshan')}
                            </div>
                        </div>

                        {/* Card Footer Caption */}
                        <div className="p-4 text-xs text-[var(--pub-text-muted)] bg-amber-500/[0.02] border-t border-[var(--pub-border)] flex items-center justify-between">
                            <span>
                                {t(
                                    'ಚಿತ್ರದ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ಹೈ-ರೆಸಲ್ಯೂಶನ್‌ನಲ್ಲಿ ದರ್ಶನ ಪಡೆಯಿರಿ.',
                                    'Click image to view in high resolution.'
                                )}
                            </span>
                            <button
                                type="button"
                                onClick={() => setLightboxOpen(true)}
                                className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                            >
                                <Maximize2 size={12} />
                                {t('ವಿಸ್ತರಿಸಿ', 'Enlarge')}
                            </button>
                        </div>
                    </div>

                    {/* 2. Video Clip: Maha Mangalarati with Pause/Resume */}
                    <div className="group rounded-3xl border border-[var(--pub-border)] bg-[var(--pub-bg-card)] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col">
                        {/* Card Header Banner */}
                        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-b border-[var(--pub-border)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🔔</span>
                                <div>
                                    <h4 className="text-sm font-bold text-[var(--pub-ink)]" style={{ fontFamily: 'var(--pub-font-heading)' }}>
                                        {t('ಮಹಾ ಮಂಗಳಾರತಿ ವಿಡಿಯೋ', 'Maha Mangalarati Video')}
                                    </h4>
                                    <p className="text-[11px] text-[var(--pub-text-muted)]">
                                        {t('ಬೆಳಗಿನ ಮತ್ತು ಸಂಜೆಯ ಮಹಾ ಮಂಗಳಾರತಿ ದೃಶ್ಯ', 'Morning & Evening Maha Mangalarati Video')}
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                {isPlaying ? t('ಚಾಲನೆಯಲ್ಲಿದೆ', 'Playing') : t('ವಿಡಿಯೋ', 'Video')}
                            </span>
                        </div>

                        {/* Video Container with Click-to-Pause/Resume */}
                        <div
                            onClick={handleVideoClick}
                            className="relative flex-1 aspect-[4/3] w-full overflow-hidden cursor-pointer bg-black flex items-center justify-center group/vid"
                        >
                            <video
                                ref={videoRef}
                                src="/images/aaradhana/mangalarati.webm"
                                poster="/images/aaradhana/mangalarati_poster.jpg"
                                playsInline
                                loop
                                muted={isMuted}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="w-full h-full object-cover"
                            />

                            {/* Play/Pause Central Overlay */}
                            <div
                                className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
                                    isPlaying ? 'opacity-0 group-hover/vid:opacity-100' : 'opacity-100'
                                }`}
                            >
                                <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xl transition-transform transform group-hover/vid:scale-110">
                                    {isPlaying ? (
                                        <Pause size={28} className="fill-white" />
                                    ) : (
                                        <Play size={28} className="fill-white ml-1" />
                                    )}
                                </div>
                            </div>

                            {/* Audio Mute/Unmute Toggle */}
                            <button
                                type="button"
                                onClick={toggleMute}
                                className="absolute bottom-3 right-3 p-2 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-amber-600 transition-colors border border-white/20 z-10"
                                title={isMuted ? t('ಧ್ವನಿ ಆನ್ ಮಾಡಿ', 'Unmute') : t('ಮ್ಯೂಟ್ ಮಾಡಿ', 'Mute')}
                            >
                                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                            </button>

                            {/* Status Overlay Badge */}
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-amber-300 text-[11px] font-bold border border-amber-400/30 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span>🔔 {t('ಮಹಾ ಮಂಗಳಾರತಿ (ಲೈವ್ ಫೀಡ್ ಸಿದ್ಧತೆ)', 'Maha Mangalarati (Live Feed Ready)')}</span>
                            </div>
                        </div>

                        {/* Card Footer Caption */}
                        <div className="p-4 text-xs text-[var(--pub-text-muted)] bg-amber-500/[0.02] border-t border-[var(--pub-border)] flex items-center justify-between">
                            <span>
                                {isPlaying
                                    ? t('ವಿಡಿಯೋ ನಿಲ್ಲಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ.', 'Click video to pause.')
                                    : t('ವಿಡಿಯೋ ಚಾಲನೆ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ.', 'Click video to play.')}
                            </span>
                            <button
                                type="button"
                                onClick={handleVideoClick}
                                className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                            >
                                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                                <span>{isPlaying ? t('ನಿಲ್ಲಿಸಿ', 'Pause') : t('ಪ್ಲೇ ಮಾಡಿ', 'Play')}</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* ===== DEVOTIONAL EXPLANATION ACCOMPANYING E-HUNDI ===== */}
                <div className="rounded-3xl p-6 md:p-8 border border-amber-500/35 bg-gradient-to-br from-amber-50/80 via-amber-100/40 to-amber-50/90 dark:from-amber-950/30 dark:via-neutral-900/40 dark:to-neutral-900/70 shadow-lg relative overflow-hidden space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
                            🙏
                        </div>
                        <div>
                            <h3
                                className="text-lg md:text-xl font-bold text-amber-950 dark:text-amber-100"
                                style={{ fontFamily: 'var(--pub-font-heading)' }}
                            >
                                {t('ಇ-ಹುಂಡಿ ಕಾಣಿಕೆ ಮಾರ್ಗದರ್ಶಿ ಮತ್ತು ಸಂಕಲ್ಪ', 'e-Hundi Offering Guidance & Devotion')}
                            </h3>
                            <p className="text-xs text-amber-900/75 dark:text-amber-200/80 font-medium">
                                {t('ಭಕ್ತಿಯ ಕಾಣಿಕೆ ಮತ್ತು ರಸೀತಿ ನಿಯಮಾವಳಿ', 'Devotional Offering Guidelines & Policy')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs leading-relaxed">
                        {/* 1. Purely Optional & Symbolic */}
                        <div className="p-4 rounded-2xl bg-white/90 dark:bg-neutral-900/80 border border-amber-500/25 flex flex-col gap-1.5 shadow-sm">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                                <Heart size={14} className="text-amber-600 dark:text-amber-400" />
                                <span>{t('ಐಚ್ಛಿಕ ಮತ್ತು ಸಾಂಕೇತಿಕ', 'Optional & Symbolic')}</span>
                            </div>
                            <p className="text-slate-700 dark:text-neutral-200 leading-relaxed">
                                {t(
                                    'ಇ-ಹುಂಡಿಯಲ್ಲಿ ಕಾಣಿಕೆ ಸಮರ್ಪಿಸುವುದು ಸಂಪೂರ್ಣವಾಗಿ ಐಚ್ಛಿಕ ಮತ್ತು ಸಾಂಕೇತಿಕವಾಗಿದೆ. ಶುದ್ಧ ಅಂತಃಕರಣ ಹಾಗೂ ಭಕ್ತಿಯಿಂದ ನಮಸ್ಕರಿಸುವುದೇ ಶ್ರೇಷ್ಠ ಸಮರ್ಪಣೆಯಾಗಿದೆ.',
                                    'Making an offering through e-Hundi is purely optional and symbolic. Prayers offered with devotion and a pure heart hold the highest merit.'
                                )}
                            </p>
                        </div>

                        {/* 2. Rayaru's Grace Irrespective of Amount */}
                        <div className="p-4 rounded-2xl bg-white/90 dark:bg-neutral-900/80 border border-amber-500/25 flex flex-col gap-1.5 shadow-sm">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                                <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
                                <span>{t('ರಾಯರ ಅನುಗ್ರಹ', "Rayaru's Boundless Grace")}</span>
                            </div>
                            <p className="text-slate-700 dark:text-neutral-200 leading-relaxed">
                                {t(
                                    'ಕಾಣಿಕೆಯ ಮೊತ್ತ ಎಷ್ಟೇ ಇರಲಿ, ಶುದ್ಧ ಭಕ್ತಿಯಿಂದ ಪ್ರಾರ್ಥಿಸುವ ಪ್ರತಿಯೊಬ್ಬ ಭಕ್ತರಿಗೂ ಶ್ರೀ ಗುರುರಾಜರ ಕೃಪಾಶೀರ್ವಾದ ಸದಾ ದೊರೆಯುತ್ತದೆ.',
                                    "Irrespective of the offering amount, everyone with a pure heart filled with devotion receives Sri Guru Raghavendra Swamy's complete grace and blessing."
                                )}
                            </p>
                        </div>

                        {/* 3. Formal Receipt Notice & Mutt Office Advisory */}
                        <div className="p-4 rounded-2xl bg-white/90 dark:bg-neutral-900/80 border border-amber-500/25 flex flex-col gap-1.5 shadow-sm">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                                <Info size={14} className="text-amber-600 dark:text-amber-400" />
                                <span>{t('ರಸೀತಿ ಮತ್ತು ಹೆಚ್ಚಿನ ಕಾಣಿಕೆ', 'Receipts & Larger Offerings')}</span>
                            </div>
                            <p className="text-slate-700 dark:text-neutral-200 leading-relaxed">
                                {t(
                                    'ಇ-ಹುಂಡಿ ಕಾಣಿಕೆಯನ್ನು ಡಿಜಿಟಲ್ ರೂಪದಲ್ಲಿ ದಾಖಲಿಸಲಾಗುತ್ತದೆಯಾದರೂ, ಇದಕ್ಕೆ ಯಾವುದೇ ಅಧಿಕೃತ ರಸೀತಿ ವಿತರಿಸಲಾಗುವುದಿಲ್ಲ. ಹೆಚ್ಚಿನ ದೇಣಿಗೆ ಅಥವಾ ಸೇವೆಗಳಿಗೆ ಮಠದ ಕಛೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ ರಸೀತಿ ಪಡೆಯಿರಿ.',
                                    'While e-Hundi offerings are recorded digitally, no formal temple receipt is issued. Devotees wishing to make larger contributions or book sevas should contact the mutt office to obtain a formal receipt.'
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ===== INTEGRATED E-HUNDI WIDGET ===== */}
                <div>
                    <EHundiWidget lang={lang} t={t} upiId={upiId} />
                </div>

            </div>

            {/* ===== FULLSCREEN LIGHTBOX MODAL FOR SANCTUM SANCTORUM IMAGE ===== */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxOpen(false)}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 bg-slate-950 border-b border-amber-500/20 flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🪔</span>
                                    <div>
                                        <h3 className="font-bold text-sm md:text-base text-amber-300">
                                            {t('ಶ್ರೀ ಗುರು ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿಗಳವರ ಗರ್ಭಗುಡಿ ಅಲಂಕಾರ ದರ್ಶನ', 'Sri Guru Raghavendra Swamy Sanctum Sanctorum Alankara Darshan')}
                                        </h3>
                                        <p className="text-[11px] text-slate-400">
                                            {t('ಹೈ-ರೆಸಲ್ಯೂಶನ್ ದರ್ಶನ', 'High Resolution Virtual Darshan')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setLightboxOpen(false)}
                                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                    aria-label="Back"
                                    title={t('ಹಿಂದೆ', 'Back')}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Image Body */}
                            <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-black">
                                <img
                                    src="/images/aaradhana/sanctum_alankara.jpg"
                                    alt="Enlarged Sanctum Sanctorum Sri Guru Raghavendra Swamy"
                                    className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl"
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-amber-200/80">
                                || ಪೂಜ್ಯಾಯ ರಾಘವೇಂದ್ರಾಯ ಸತ್ಯಧರ್ಮ ರತಾಯ ಚ | ಭಜತಾಂ ಕಲ್ಪವೃಕ್ಷಾಯ ನಮತಾಂ ಕಾಮಧೇನವೇ ||
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
