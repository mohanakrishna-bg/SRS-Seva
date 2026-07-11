import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import type { LayoutContextType } from '../Layout';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    layoutContext?: LayoutContextType;
}

export default function CommandPalette({ isOpen, onClose, layoutContext }: CommandPaletteProps) {
    const navigate = useNavigate();
    const { can } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    // Filter available actions based on RBAC
    const actions = [
        { id: 'home', title: 'Go to Home', icon: '🏠', action: () => navigate('/') },
        ...(can('seva') ? [{ id: 'book-seva', title: 'Book Seva', icon: '🙏', action: () => layoutContext?.openRegModal?.() }] : []),
        ...(can('accounting') ? [{ id: 'accounting', title: 'Accounting Dashboard', icon: '📊', action: () => navigate('/accounting') }] : []),
        ...(can('assets') ? [{ id: 'assets', title: 'Assets Management', icon: '🏛️', action: () => navigate('/assets') }] : []),
        ...(can('consumables') ? [{ id: 'consumables', title: 'Consumables', icon: '📦', action: () => navigate('/consumables') }] : []),
        ...(can('donations') ? [{ id: 'donation', title: 'New Donation', icon: '🎁', action: () => layoutContext?.openDonModal?.() }] : []),
        ...(can('settings') ? [{ id: 'manage', title: 'Administration', icon: '⚙️', action: () => navigate('/manage') }] : []),
    ];

    const filteredActions = actions.filter((a) =>
        a.title.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setActiveIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => Math.min(prev + 1, filteredActions.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredActions[activeIndex]) {
                    filteredActions[activeIndex].action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredActions, activeIndex, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="relative w-full max-w-xl bg-[var(--glass-card-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-4 py-3 border-b border-[var(--glass-border)]">
                            <Search className="w-5 h-5 text-[var(--text-secondary)] mr-3" />
                            <input
                                ref={inputRef}
                                type="text"
                                className="flex-1 bg-transparent text-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
                                placeholder="Search actions... (e.g. 'book seva')"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setActiveIndex(0);
                                }}
                            />
                            <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                                <kbd className="px-2 py-1 text-xs font-mono bg-black/10 dark:bg-white/10 rounded-md">esc</kbd>
                            </div>
                        </div>

                        {/* Results list */}
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {filteredActions.length === 0 ? (
                                <div className="p-4 text-center text-[var(--text-secondary)]">
                                    No actions found for "{query}"
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="px-3 py-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                        Quick Actions
                                    </div>
                                    {filteredActions.map((action, idx) => {
                                        const isActive = idx === activeIndex;
                                        return (
                                            <button
                                                key={action.id}
                                                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-colors ${
                                                    isActive
                                                        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                                        : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'
                                                }`}
                                                onClick={() => {
                                                    action.action();
                                                    onClose();
                                                }}
                                                onMouseEnter={() => setActiveIndex(idx)}
                                            >
                                                <div className="flex items-center gap-3 font-medium">
                                                    <span className="text-xl">{action.icon}</span>
                                                    <span>{action.title}</span>
                                                </div>
                                                {isActive && <ArrowRight size={16} className="text-[var(--primary)]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
