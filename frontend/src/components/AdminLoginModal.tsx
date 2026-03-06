import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Settings, X, ArrowRight } from 'lucide-react';

interface AdminLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Simple hardcoded credentials for v1
        if (username === 'admin' && password === 'admin123') {
            setError('');
            onSuccess();
        } else {
            setError('ತಪ್ಪಾದ ಬಳಕೆದಾರಹೆಸರು ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ (Invalid credentials)');
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[var(--glass-border)] overflow-hidden"
            >
                {/* Header Pattern */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-[var(--primary)] to-amber-500 opacity-90" />
                <div className="absolute top-0 left-0 right-0 h-24 bg-[url('/pattern.svg')] opacity-20 mix-blend-overlay" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors z-10"
                >
                    <X size={18} />
                </button>

                <div className="relative pt-12 px-6 pb-6">
                    {/* Icon Circle */}
                    <div className="w-16 h-16 mx-auto bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg mb-4 border-4 border-[var(--bg-light)] dark:border-[var(--bg-dark)] relative z-10">
                        <Lock size={28} className="text-[var(--primary)]" />
                    </div>

                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold flex items-center justify-center gap-2 text-[var(--text-primary)]">
                            <Settings size={20} className="text-[var(--text-secondary)]" />
                            ಸೆಟ್ಟಿಂಗ್ಸ್ ಪ್ರವೇಶ
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            ನಿರ್ವಾಹಕರು ಮಾತ್ರ (Admin Only)
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4 flex flex-col items-center">
                        <div className="w-full">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                ಬಳಕೆದಾರಹೆಸರು (Username)
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all font-mono"
                                placeholder="ಅಡ್ಮಿನ್"
                                required
                            />
                        </div>

                        <div className="w-full">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                ಗುಪ್ತಪದ (Password)
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all font-mono tracking-widest"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-red-500 font-medium text-center bg-red-50 dark:bg-red-500/10 py-2 px-3 rounded-lg w-full"
                            >
                                {error}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white font-semibold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all"
                        >
                            ಪ್ರವೇಶಿಸಿ <ArrowRight size={16} />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
