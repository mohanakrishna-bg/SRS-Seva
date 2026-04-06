import { motion } from 'framer-motion';
import { MapPin, Phone, Globe, ArrowLeft } from 'lucide-react';

interface HeaderProps {
    compact?: boolean;
    onBack?: () => void;
    onHome?: () => void;
    rightContent?: React.ReactNode;
}

const SETTINGS_KEY = 'seva_org_settings';

function getOrgSettings() {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return {};
}

export default function Header({ compact = false, onBack, onHome, rightContent }: HeaderProps) {
    const settings = getOrgSettings();
    const orgName = settings.orgName || 'ಶ್ರೀ ಮಠ ಆಡಳಿತ';
    const logoImage = settings.logoImage;
    const address = settings.address;
    const phone = settings.phone;
    const website = settings.website;

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-black/40 border border-[var(--glass-border)] backdrop-blur-xl shadow-sm"
            >
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-1.5 rounded-lg hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            title="ಹಿಂದೆ"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <button 
                        onClick={onHome} 
                        className={`flex items-center gap-3 text-left ${onHome ? 'hover:opacity-80 transition-opacity cursor-pointer' : 'cursor-default'}`}
                    >
                        {logoImage ? (
                            <img src={logoImage} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-orange-300/50" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-200 to-orange-200 border border-orange-300/30 flex items-center justify-center">
                                <span className="text-sm">🙏</span>
                            </div>
                        )}
                        <span className="text-sm font-semibold text-[var(--primary)] truncate">
                            {orgName}
                        </span>
                    </button>
                </div>
                {rightContent && (
                    <div className="flex items-center gap-2">
                        {rightContent}
                    </div>
                )}
            </motion.div>
        );
    }

    return (
        <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
        >
            <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <button 
                    onClick={onHome} 
                    className={`flex flex-col md:flex-row items-center gap-5 mb-1 ${onHome ? 'hover:opacity-80 transition-opacity cursor-pointer' : 'cursor-default'}`}
                >
                    {logoImage ? (
                        <img
                            src={logoImage}
                            alt="Logo"
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-orange-300/50 shadow-lg shadow-orange-200/30 shrink-0"
                        />
                    ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-amber-200 to-orange-200 border border-orange-300/30 flex items-center justify-center shrink-0">
                            <span className="text-3xl md:text-4xl">🙏</span>
                        </div>
                    )}
                    <div className="flex flex-col items-center md:items-start">
                        <h1 className="text-3xl md:text-4xl font-bold text-[var(--primary)] leading-tight">
                            {orgName}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 mt-1.5 text-sm text-[var(--text-secondary)]">
                            {address && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={13} className="text-[var(--primary)] shrink-0" />
                                    <span className="whitespace-pre-line">{address}</span>
                                </span>
                            )}
                            {phone && (
                                <span className="flex items-center gap-1.5">
                                    <Phone size={13} className="text-[var(--primary)] shrink-0" />
                                    {phone}
                                </span>
                            )}
                            {website && (
                                <span className="flex items-center gap-1.5">
                                    <Globe size={13} className="text-[var(--primary)] shrink-0" />
                                    {website}
                                </span>
                            )}
                        </div>
                    </div>
                </button>

                {rightContent && (
                    <div className="flex items-center gap-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-1 shadow-sm backdrop-blur-md shrink-0">
                        {rightContent}
                    </div>
                )}
            </div>
        </motion.header>
    );
}
