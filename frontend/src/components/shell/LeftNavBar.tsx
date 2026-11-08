/**
 * LeftNavBar — vertical navigation bar for modules with secondary sub-tabs.
 * Provides an alternative to ContextualTabBar when a vertical sidebar
 * layout is preferred (e.g., Manage, Accounting).
 */
import { NavLink, useLocation } from 'react-router-dom';
import { PanelTop, ChevronRight } from 'lucide-react';
import type { Tab, ModuleConfig } from '../../config/navConfig';
import { useAuth } from '../../context/AuthContext';

interface LeftNavBarProps {
    module: ModuleConfig;
    tabs: Tab[];
    basePath: string;
    /** Optional primary action button (e.g. "+ ಸೇವೆ ಬುಕ್ ಮಾಡಿ") */
    actionButton?: React.ReactNode;
    /** Callback to switch back to the horizontal top menu bar */
    onToggleLayout: () => void;
}

export default function LeftNavBar({
    module,
    tabs,
    basePath,
    actionButton,
    onToggleLayout,
}: LeftNavBarProps) {
    const { can } = useAuth();
    const location = useLocation();

    const visibleTabs = tabs.filter(t => !t.permission || can(t.permission));
    const ModuleIcon = module.icon;

    if (visibleTabs.length === 0 && !actionButton) return null;

    return (
        <aside
            aria-label={`${module.label} navigation`}
            className="w-56 lg:w-60 shrink-0 sticky top-3 self-start max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl backdrop-blur-md shadow-sm p-3 flex flex-col gap-2.5 print:hidden select-none"
        >
            {/* Header: Module Icon, Label & Switch-to-Top Button */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                        {ModuleIcon ? <ModuleIcon size={16} /> : null}
                    </div>
                    <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                        {module.label}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={onToggleLayout}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="ಮೇಲಿನ ಮೆನುಗೆ ಬದಲಾಯಿಸಿ"
                    aria-label="Switch to top menu bar"
                >
                    <PanelTop size={15} />
                </button>
            </div>

            {/* Primary Action Button (if present) */}
            {actionButton && (
                <div className="w-full [&>button]:w-full [&>button]:justify-center">
                    {actionButton}
                </div>
            )}

            {/* Vertical Tabs List */}
            <nav className="flex flex-col gap-1">
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
                                `group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                                    isActive
                                        ? 'bg-[var(--primary)] text-white font-semibold shadow-sm shadow-[var(--primary)]/30'
                                        : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/8 hover:text-[var(--text-primary)] font-medium'
                                }`
                            }
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                {Icon && (
                                    <Icon
                                        size={15}
                                        className={`shrink-0 ${
                                            isActive
                                                ? 'text-white'
                                                : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                                        }`}
                                    />
                                )}
                                <span className="truncate">{tab.label}</span>
                            </div>

                            {isActive && (
                                <ChevronRight size={13} className="shrink-0 text-white/80" />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer Switch Option */}
            <div className="pt-2 mt-auto border-t border-[var(--glass-border)]">
                <button
                    type="button"
                    onClick={onToggleLayout}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/8 transition-colors group cursor-pointer"
                    title="ಮೇಲಿನ ಮೆನುಗೆ ಬದಲಾಯಿಸಿ"
                >
                    <span className="flex items-center gap-1.5 text-[11px]">
                        <PanelTop size={13} className="text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors" />
                        <span>ಮೇಲಿನ ಮೆನು</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] opacity-70 group-hover:opacity-100 transition-opacity">
                        ಬದಲಾಯಿಸಿ
                    </span>
                </button>
            </div>
        </aside>
    );
}
