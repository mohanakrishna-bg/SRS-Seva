/**
 * LeftNavBar — vertical navigation bar for modules with secondary sub-tabs.
 * Provides an alternative to ContextualTabBar when a vertical sidebar
 * layout is preferred (e.g., Manage, Accounting).
 *
 * Supports single-level indented sub-menus for tabs with subItems (per ADR 0009).
 */
import { NavLink, useLocation } from 'react-router-dom';
import { PanelTop, ChevronRight, ChevronDown } from 'lucide-react';
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
            className="w-60 lg:w-64 shrink-0 sticky top-3 self-start max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl backdrop-blur-md shadow-sm p-3 flex flex-col gap-2.5 print:hidden select-none"
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
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border-2 border-amber-500/50 hover:border-amber-500/80 shadow-sm shadow-amber-500/20 transition-all cursor-pointer group active:scale-95"
                    title="ಮೇಲಿನ ಮೆನುಗೆ ಬದಲಾಯಿಸಿ"
                    aria-label="Switch to top menu bar"
                >
                    <PanelTop size={14} className="stroke-[2.5] text-amber-700 dark:text-amber-300" />
                    <span className="text-[11px] font-bold">ಮೇಲಿನ ಮೆನು</span>
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
                    const hasSubItems = (tab.subItems?.length ?? 0) > 0;
                    const isTabActive =
                        location.pathname === to ||
                        location.pathname.startsWith(to + '/');

                    const tabTarget = hasSubItems
                        ? `${to}/${tab.subItems![0].path}`
                        : to;

                    return (
                        <div key={tab.id} className="flex flex-col">
                            <NavLink
                                to={tabTarget}
                                className={() =>
                                    `group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                                        isTabActive
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
                                                isTabActive
                                                    ? 'text-white'
                                                    : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                                            }`}
                                        />
                                    )}
                                    <span className="truncate">{tab.label}</span>
                                </div>

                                {hasSubItems ? (
                                    isTabActive ? (
                                        <ChevronDown size={13} className="shrink-0 text-white/80" />
                                    ) : (
                                        <ChevronRight size={13} className="shrink-0 text-[var(--text-secondary)] opacity-60" />
                                    )
                                ) : (
                                    isTabActive && (
                                        <ChevronRight size={13} className="shrink-0 text-white/80" />
                                    )
                                )}
                            </NavLink>

                            {/* ── Single-Level Indented Sub-Menu (ADR 0009) ── */}
                            {hasSubItems && isTabActive && (
                                <div className="ml-3.5 pl-2.5 my-1.5 border-l-2 border-[var(--primary)]/25 flex flex-col gap-0.5">
                                    {tab.subItems!.map((subItem, index) => {
                                        const subTo = `${to}/${subItem.path}`;
                                        const SubIcon = subItem.icon;
                                        const isSubActive =
                                            location.pathname === subTo ||
                                            location.pathname.startsWith(subTo + '/');

                                        // Render subtle category label when group changes
                                        const prevGroup = index > 0 ? tab.subItems![index - 1].group : undefined;
                                        const isNewGroup = subItem.group && subItem.group !== prevGroup;

                                        return (
                                            <div key={subItem.id} className="flex flex-col">
                                                {isNewGroup && (
                                                    <div className="px-2 pt-1.5 pb-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]/70 select-none">
                                                        {subItem.group}
                                                    </div>
                                                )}
                                                <NavLink
                                                    to={subTo}
                                                    title={subItem.description || subItem.label}
                                                    className={() =>
                                                        `group/sub flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                                            isSubActive
                                                                ? 'bg-[var(--primary)] text-white font-semibold shadow-sm shadow-[var(--primary)]/20'
                                                                : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/8 hover:text-[var(--text-primary)] font-medium'
                                                        }`
                                                    }
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {SubIcon && (
                                                            <SubIcon
                                                                size={13}
                                                                className={`shrink-0 ${
                                                                    isSubActive
                                                                        ? 'text-white'
                                                                        : 'text-[var(--text-secondary)] group-hover/sub:text-[var(--text-primary)]'
                                                                }`}
                                                            />
                                                        )}
                                                        <span className="truncate text-[11px]">{subItem.label}</span>
                                                    </div>

                                                    {isSubActive && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                                    )}
                                                </NavLink>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer Switch Option */}
            <div className="pt-2 mt-auto border-t border-[var(--glass-border)]">
                <button
                    type="button"
                    onClick={onToggleLayout}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 hover:border-amber-500/70 shadow-sm shadow-amber-500/10 transition-all group cursor-pointer active:scale-98"
                    title="ಮೇಲಿನ ಮೆನುಗೆ ಬದಲಾಯಿಸಿ"
                >
                    <span className="flex items-center gap-2 text-xs">
                        <span className="p-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            <PanelTop size={14} className="stroke-[2.5]" />
                        </span>
                        <span className="font-bold">ಮೇಲಿನ ಮೆನು</span>
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md">
                        ಬದಲಾಯಿಸಿ
                    </span>
                </button>
            </div>
        </aside>
    );
}
