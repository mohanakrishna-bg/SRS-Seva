import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface SessionWarningModalProps {
    isOpen: boolean;
    secondsRemaining: number;
    onExtend: () => void;
    onLogout: () => void;
}

/**
 * Warning modal shown 5 minutes before idle timeout.
 * Plays an audio alert tone on mount and displays a live countdown.
 */
export default function SessionWarningModal({ isOpen, secondsRemaining, onExtend, onLogout }: SessionWarningModalProps) {
    const audioPlayedRef = useRef(false);

    // Play audio alert when modal first opens
    useEffect(() => {
        if (isOpen && !audioPlayedRef.current) {
            audioPlayedRef.current = true;
            playAlertTone();
        }
        if (!isOpen) {
            audioPlayedRef.current = false;
        }
    }, [isOpen]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="relative w-full max-w-sm bg-[var(--glass-card-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                    >
                        {/* Warning stripe */}
                        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

                        <div className="p-6 text-center">
                            {/* Icon with pulse animation */}
                            <div className="relative w-16 h-16 mx-auto mb-4">
                                <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping" />
                                <div className="relative w-16 h-16 bg-amber-100 dark:bg-amber-500/15 rounded-full flex items-center justify-center">
                                    <Clock size={28} className="text-amber-600" />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                                ಅಧಿವೇಶನ ಮುಕ್ತಾಯ ಎಚ್ಚರಿಕೆ
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                                ನಿಷ್ಕ್ರಿಯತೆಯಿಂದಾಗಿ ನಿಮ್ಮ ಅಧಿವೇಶನ ಶೀಘ್ರದಲ್ಲೇ ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ
                            </p>

                            {/* Countdown */}
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl py-3 px-4 mb-5">
                                <p className="text-2xl font-mono font-bold text-red-600 dark:text-red-400">
                                    {formatTime(secondsRemaining)}
                                </p>
                                <p className="text-[10px] text-red-500 mt-0.5 uppercase tracking-wider font-semibold">
                                    ಉಳಿದ ಸಮಯ
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onLogout}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all"
                                >
                                    <LogOut size={15} />
                                    ಲಾಗ್ ಔಟ್
                                </button>
                                <button
                                    onClick={onExtend}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:brightness-110 transition-all"
                                >
                                    <RefreshCw size={15} />
                                    ಮುಂದುವರಿಸಿ
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

/**
 * Play a subtle alert tone using Web Audio API (no external files needed).
 */
function playAlertTone() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Two-tone alert: beep-beep
        const playBeep = (startTime: number, freq: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        playBeep(now, 880, 0.15);         // A5
        playBeep(now + 0.2, 880, 0.15);   // A5 again
        playBeep(now + 0.5, 1047, 0.25);  // C6 (higher)

        // Clean up after sounds finish
        setTimeout(() => ctx.close(), 2000);
    } catch {
        // Web Audio API not available — fail silently
    }
}
