import { motion } from 'framer-motion';
import { MapPin, Phone, Globe, ArrowLeft } from 'lucide-react';

interface HeaderProps {
    compact?: boolean;
    onBack?: () => void;
}

const SETTINGS_KEY = 'seva_org_settings';

function getOrgSettings() {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return {};
}

export default function Header({ compact = false, onBack }: HeaderProps) {
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
                className="flex items-center gap-3 mb-6 px-4 py-2.5 rounded-2xl bg-white/80 border border-[var(--glass-border)] backdrop-blur-xl shadow-sm"
            >
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-1.5 rounded-lg hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="ಹಿಂದೆ"
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}
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
            </motion.div>
        );
    }

    return (
        <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
        >
            <div className="relative z-10">
                <div className="flex items-center gap-5 mb-1">
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
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-[var(--primary)] leading-tight">
                            {orgName}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-[var(--text-secondary)]">
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
                </div>
            </div>
        </motion.header>
    );
}
