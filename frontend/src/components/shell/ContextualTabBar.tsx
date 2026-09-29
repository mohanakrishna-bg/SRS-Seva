/**
 * ContextualTabBar — config-driven tab strip rendered below TopAppBar.
 * Replaces the three per-page tab strips in ManagePage, SevaPage, AccountingPage.
 */
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tab } from '../../config/navConfig';
import { useAuth } from '../../context/AuthContext';

interface ContextualTabBarProps {
    tabs: Tab[];
    basePath: string;
    /** Optional primary action button rendered on the right side */
    actionButton?: React.ReactNode;
}

export default function ContextualTabBar({ tabs, basePath, actionButton }: ContextualTabBarProps) {
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
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                    {visibleTabs.map(tab => {
                        const to = `${basePath}/${tab.path}`;
                        const Icon = tab.icon;
                        const isActive =
                            location.pathname === to ||
                            location.pathname.startsWith(to + '/');

                        return (
                            <NavLink
                                key={tab.id}
                                to={to}
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

                {/* Primary Action Slot */}
                {actionButton && (
                    <div className="shrink-0">
                        {actionButton}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
