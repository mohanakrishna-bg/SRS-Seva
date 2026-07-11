import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, AlertCircle } from 'lucide-react';
import { usersApi } from '../api';

interface ResetPasswordModalProps {
    isOpen: boolean;
    userId: number;
    username: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ResetPasswordModal({ isOpen, userId, username, onClose, onSuccess }: ResetPasswordModalProps) {
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('ಗುಪ್ತಪದ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು');
            return;
        }

        setIsSubmitting(true);
        try {
            await usersApi.resetPassword(userId, newPassword);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'ಗುಪ್ತಪದ ಮರುಹೊಂದಿಸುವಿಕೆ ವಿಫಲವಾಗಿದೆ');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-sm bg-[var(--glass-card-bg)] border border-[var(--glass-border)] rounded-2xl shadow-xl overflow-hidden backdrop-blur-md"
                >
                    <div className="flex justify-between items-center p-4 border-b border-[var(--glass-border)]">
                        <div className="flex items-center gap-2 text-red-500">
                            <ShieldAlert size={20} />
                            <h2 className="font-bold text-[var(--text-primary)] text-sm">ಗುಪ್ತಪದ ಮರುಹೊಂದಿಸಿ</h2>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5">
                        <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
                            ನೀವು <span className="font-bold text-[var(--text-primary)]">{username}</span> ಗಾಗಿ ಗುಪ್ತಪದವನ್ನು ಮರುಹೊಂದಿಸುತ್ತಿದ್ದೀರಿ. ಮುಂದಿನ ಬಾರಿ ಲಾಗಿನ್ ಮಾಡಿದಾಗ ಅವರು ಗುಪ್ತಪದವನ್ನು ಬದಲಾಯಿಸಬೇಕಾಗುತ್ತದೆ.
                        </p>

                        <div className="mb-4">
                            <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                ಹೊಸ ಗುಪ್ತಪದ
                            </label>
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                                placeholder="ಹೊಸ ಗುಪ್ತಪದ"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-500/10 p-2.5 rounded-lg mb-4">
                                <AlertCircle size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            >
                                ರದ್ದು
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white shadow-md disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {isSubmitting ? 'ಮರುಹೊಂದಿಸಲಾಗುತ್ತಿದೆ...' : 'ಮರುಹೊಂದಿಸಿ'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
