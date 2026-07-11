import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Undismissable dialog shown after login when must_change_password is true.
 * User cannot proceed until they set a new password.
 */
export default function ChangePasswordDialog() {
    const { changePassword, user } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (newPassword.length < 6) {
            setError('ಹೊಸ ಗುಪ್ತಪದವು ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳ ಆಗಿರಬೇಕು');
            return;
        }
        if (newPassword === currentPassword) {
            setError('ಹೊಸ ಗುಪ್ತಪದವು ಪ್ರಸ್ತುತ ಗುಪ್ತಪದಕ್ಕಿಂತ ಭಿನ್ನವಾಗಿರಬೇಕು');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('ಹೊಸ ಗುಪ್ತಪದಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ');
            return;
        }

        setIsLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            // AuthContext.changePassword updates user state with must_change_password=false
            // which will dismiss this dialog automatically
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (detail === 'Current password is incorrect') {
                setError('ಪ್ರಸ್ತುತ ಗುಪ್ತಪದ ತಪ್ಪಾಗಿದೆ');
            } else {
                setError(detail || 'ಗುಪ್ತಪದ ಬದಲಾಯಿಸಲು ವಿಫಲವಾಗಿದೆ');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-[var(--bg-dark)]/85 backdrop-blur-md" />

            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative w-full max-w-md mx-4"
            >
                <div className="relative bg-[var(--glass-card-bg)] border border-[var(--glass-border)] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
                    {/* Header */}
                    <div className="relative h-20 bg-gradient-to-br from-blue-600 via-indigo-500 to-violet-600 flex items-center justify-center">
                        <div className="absolute inset-0 bg-white/5" />
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-xl backdrop-blur-sm">
                                <ShieldCheck size={24} className="text-white" />
                            </div>
                        </motion.div>
                    </div>

                    <div className="px-6 pt-4 pb-6">
                        <div className="text-center mb-5">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                ಗುಪ್ತಪದ ಬದಲಾಯಿಸಿ
                            </h2>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                ಮುಂದುವರಿಯಲು ಹೊಸ ಗುಪ್ತಪದವನ್ನು ಹೊಂದಿಸಿ
                            </p>
                            {user?.display_name && (
                                <p className="text-xs text-[var(--primary)] font-semibold mt-1">
                                    {user.display_name} ({user.username})
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            {/* Current Password */}
                            <div>
                                <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                    ಪ್ರಸ್ತುತ ಗುಪ್ತಪದ
                                </label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input
                                        autoFocus
                                        type={showPasswords ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all tracking-widest"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                    ಹೊಸ ಗುಪ್ತಪದ
                                </label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all tracking-widest"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                    ಹೊಸ ಗುಪ್ತಪದ ದೃಢೀಕರಿಸಿ
                                </label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all tracking-widest"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {/* Show/hide toggle */}
                            <button
                                type="button"
                                onClick={() => setShowPasswords(!showPasswords)}
                                className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
                                {showPasswords ? 'ಗುಪ್ತಪದಗಳನ್ನು ಮರೆಮಾಡಿ' : 'ಗುಪ್ತಪದಗಳನ್ನು ತೋರಿಸಿ'}
                            </button>

                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-500/10 py-2 px-3 rounded-xl border border-red-200 dark:border-red-500/20"
                                >
                                    <AlertCircle size={14} className="shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <ShieldCheck size={16} />
                                        ಗುಪ್ತಪದ ಬದಲಾಯಿಸಿ
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
