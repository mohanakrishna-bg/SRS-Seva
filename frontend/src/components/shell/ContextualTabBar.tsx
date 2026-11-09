/**
 * ContextualTabBar — config-driven tab strip rendered below TopAppBar.
 * Replaces the three per-page tab strips in ManagePage, SevaPage, AccountingPage.
 */
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeft } from 'lucide-react';
import type { Tab } from '../../config/navConfig';
import { useAuth } from '../../context/AuthContext';

interface ContextualTabBarProps {
    tabs: Tab[];
    basePath: string;
    /** Optional primary action button rendered on the right side */
    actionButton?: React.ReactNode;
    /** Optional callback to toggle between top and left navigation */
    onToggleLayout?: () => void;
}

export default function ContextualTabBar({ tabs, basePath, actionButton, onToggleLayout }: ContextualTabBarProps) {
    const { can } = useAuth();
    const location = useLocation();

    const visibleTabs = tabs.filter(t => !t.permission || can(t.permission));

    if (visibleTabs.length === 0 && !actionButton) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={basePath}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center justify-between gap-3 px-4 md:px-8 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl backdrop-blur-md print:hidden shrink-0 mx-4 md:mx-8 mt-2"
            >
                {/* Tab Pills */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0">
                    {visibleTabs.map(tab => {
                        const to = `${basePath}/${tab.path}`;
                        const targetTo = (tab.subItems?.length ?? 0) > 0
                            ? `${to}/${tab.subItems![0].path}`
                            : to;
                        const Icon = tab.icon;
                        const isActive =
                            location.pathname === to ||
                            location.pathname.startsWith(to + '/');

                        return (
                            <NavLink
                                key={tab.id}
                                to={targetTo}
                                className={() =>
                                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'bg-[var(--primary)] text-white shadow-sm shadow-[var(--primary)]/30'
                                            : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/8 hover:text-[var(--text-primary)]'
                                    }`
                                }
                            >
                                {Icon && <Icon size={13} />}
                                {tab.label}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Right Actions: Switch Layout + Primary Action */}
                <div className="flex items-center gap-2 shrink-0">
                    {onToggleLayout && (
                        <button
                            type="button"
                            onClick={onToggleLayout}
                            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border-2 border-amber-500/50 hover:border-amber-500/80 shadow-sm shadow-amber-500/20 transition-all cursor-pointer group shrink-0 active:scale-95"
                            title="ಎಡ ಮೆನುಗೆ ಬದಲಾಯಿಸಿ"
                            aria-label="Switch to left navigation"
                        >
                            <span className="p-1 rounded-md bg-amber-500/20 group-hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 transition-colors">
                                <PanelLeft size={14} className="stroke-[2.5]" />
                            </span>
                            <span className="text-xs font-bold whitespace-nowrap">ಎಡ ಮೆನು</span>
                        </button>
                    )}

                    {actionButton && (
                        <div className="shrink-0">
                            {actionButton}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
