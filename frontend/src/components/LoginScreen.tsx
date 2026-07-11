import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function LoginScreen() {
    const { login } = useAuth();
    const { settings } = useSettings();
    const orgName = settings.orgName || 'ಶ್ರೀ ಮಠ ಆಡಳಿತ';
    const logoImage = settings.logoImage;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(username, password);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (detail === 'User account is deactivated') {
                setError('ನಿಮ್ಮ ಖಾತೆಯನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ. ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.');
            } else {
                setError('ತಪ್ಪಾದ ಬಳಕೆದಾರಹೆಸರು ಅಥವಾ ಗುಪ್ತಪದ');
            }
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blurred background — the home page is rendered behind */}
            <div className="absolute inset-0 bg-[var(--bg-dark)]/80 backdrop-blur-md" />

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative w-full max-w-md mx-4"
            >
                <div className="relative bg-[var(--glass-card-bg)] border border-[var(--glass-border)] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
                    {/* Header Gradient */}
                    <div className="relative h-28 bg-gradient-to-br from-[var(--primary)] via-amber-500 to-orange-600 flex items-center justify-center">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRWMGgtMnYzNEgwdjJoMzR2MjRoMlYzNmgyNHYtMkg2NnYtMkg0MHYtMkg0MHYtMkg0MHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
                        
                        {/* Logo */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="relative z-10"
                        >
                            {logoImage ? (
                                <img
                                    src={logoImage}
                                    alt="Logo"
                                    className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-xl"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-xl backdrop-blur-sm">
                                    <span className="text-4xl">🙏</span>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Org Name + Form */}
                    <div className="px-6 pt-5 pb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center mb-6"
                        >
                            <h1 className="text-xl font-bold text-[var(--primary)] leading-tight">
                                {orgName}
                            </h1>
                            <p className="text-xs text-[var(--text-secondary)] mt-1.5 flex items-center justify-center gap-1.5">
                                <Lock size={12} />
                                ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ
                            </p>
                        </motion.div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                                    ಬಳಕೆದಾರಹೆಸರು
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                                        placeholder="ಬಳಕೆದಾರಹೆಸರು ನಮೂದಿಸಿ"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                                    ಗುಪ್ತಪದ
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all tracking-widest"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
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
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        ಪ್ರವೇಶಿಸಿ <ArrowRight size={16} />
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
