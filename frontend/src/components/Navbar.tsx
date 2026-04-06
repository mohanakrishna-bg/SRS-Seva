import { Home, ClipboardList, Settings, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
}

const navItems = [
    { id: 'Home', label: 'ಕೇಂದ್ರ', icon: Home, tooltip: 'ಹೋಮ್ (Home)' },
    { id: 'Manage', label: 'ನಿರ್ವಹಣೆ', icon: ClipboardList, tooltip: 'ನಿರ್ವಹಣೆ (Manage)' },
    { id: 'Settings', label: 'ಸೆಟ್ಟಿಂಗ್ಸ್', icon: Settings, tooltip: 'ಸೆಟ್ಟಿಂಗ್ಸ್ (Settings)' },
];

export default function Navbar({ activeTab, onNavigate }: NavbarProps) {
    return (
        <motion.nav 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[var(--glass-card-bg)] border border-[var(--glass-border)] shadow-2xl backdrop-blur-xl flex items-center gap-1 sm:gap-4 transition-all"
        >
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`relative group flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        activeTab === item.id 
                        ? 'text-[var(--primary)] bg-[var(--primary)]/10 shadow-sm' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--glass-bg)]'
                    }`}
                >
                    <item.icon size={20} className={activeTab === item.id ? 'animate-pulse' : ''} />
                    <span className="hidden sm:inline text-sm font-bold">{item.label}</span>
                    
                    {/* Tooltip */}
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {item.tooltip}
                    </span>

                    {/* Active Indicator Dot */}
                    {activeTab === item.id && (
                        <motion.div 
                            layoutId="activeTab"
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)]"
                        />
                    )}
                </button>
            ))}
            
            <div className="w-px h-6 bg-[var(--glass-border)] mx-1 hidden sm:block" />
            
            <div className="flex items-center gap-2 px-2 text-[var(--text-secondary)]">
                <Landmark size={18} className="opacity-50" />
            </div>
        </motion.nav>
    );
}
