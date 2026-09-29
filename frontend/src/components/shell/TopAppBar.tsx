/**
 * TopAppBar — compact 48px top application bar.
 * Replaces the full Header + sidebar combination.
 *
 * Layout (left → right):
 *   [Logo + OrgName]  |  [Module Switcher Pills]  |  [Actions: Lang · Theme · UserMenu]
 *
 * On mobile (<lg): module switcher collapses into a hamburger drawer.
 */
import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, LogOut, Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_CONFIG } from '../../config/navConfig';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useInputContext } from '../../context/InputContext';
import type { LayoutContextType } from '../Layout';

interface TopAppBarProps {
    layoutContext: LayoutContextType;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onOpenCommandPalette: () => void;
}

export default function TopAppBar({
    layoutContext,
    theme,
    onToggleTheme,
}: TopAppBarProps) {
    const { can, user, logout } = useAuth();
    const { settings } = useSettings();
    const { globalLang, setGlobalLang } = useInputContext();
    const location = useLocation();
    const navigate = useNavigate();
    const orgName = settings.orgName || 'ಶ್ರೀ ಮಠ ಆಡಳಿತ';
    const logoImage = settings.logoImage;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close user menu on outside click
    useEffect(() => {
        if (!userMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [userMenuOpen]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const visibleModules = NAV_CONFIG.filter(m => !m.permission || can(m.permission));

    const toggleLang = () => setGlobalLang(globalLang === 'kn' ? 'en' : 'kn');

    return (
        <>
            {/* ─── Module Navigation Bar ─── */}
            <header className="
                z-20 h-12 flex items-center justify-between
                px-3 md:px-5 gap-3 mt-3
                bg-[var(--glass-bg)] border border-[var(--glass-border)]
                rounded-2xl backdrop-blur-xl shadow-sm
                print:hidden
            ">
                {/* ── Left: Logo + Org Name — visible only on mobile (Header shows it on desktop) ── */}
                <Link
                    to="/app"
                    className="flex lg:hidden items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity"
                >
                    {logoImage ? (
                        <img
                            src={logoImage}
                            alt="Logo"
                            className="w-7 h-7 rounded-full object-cover border border-orange-300/50 shrink-0"
                        />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-200 to-orange-300 flex items-center justify-center shrink-0 border border-orange-300/30">
                            <span className="text-sm">🙏</span>
                        </div>
                    )}
                    <span className="text-sm font-bold text-[var(--primary)] truncate max-w-[160px]">
                        {orgName}
                    </span>
                </Link>

                {/* ── Centre: Module Switcher (desktop) — full width when no mobile logo shown ── */}
                <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-start" aria-label="Module navigation">
                    {visibleModules.map(mod => {
                        const Icon = mod.icon;
                        const isActive =
                            mod.path === '/app'
                                ? location.pathname === '/app' || location.pathname === '/app/'
                                : location.pathname.startsWith(mod.path);

                        return (
                            <NavLink
                                key={mod.id}
                                to={mod.path}
                                end={mod.path === '/app'}
                                className={() =>
                                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-[var(--primary)]/12 text-[var(--primary)] dark:bg-[var(--primary)]/20'
                                            : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/8 hover:text-[var(--text-primary)]'
                                    }`
                                }
                            >
                                <Icon size={14} />
                                {mod.label}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* ── Right: Actions ── */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Donations quick action (if permitted) */}
                    {can('donations') && (
                        <button
                            onClick={layoutContext.openDonModal}
                            title="ದಾನ ನೋಂದಣಿ"
                            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                            🎁 <span className="hidden xl:inline">ದಾನ</span>
                        </button>
                    )}

                    {/* Language Toggle */}
                    <button
                        onClick={toggleLang}
                        title={globalLang === 'kn' ? 'Switch to English' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/10 border border-transparent hover:border-[var(--glass-border)]"
                    >
                        <Globe size={12} className="text-[var(--primary)]" />
                        <span className={globalLang === 'kn' ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}>
                            {globalLang === 'kn' ? 'ಕನ್ನಡ' : 'EN'}
                        </span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={onToggleTheme}
                        title={theme === 'light' ? 'Dark mode' : 'Light mode'}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                    </button>

                    {/* Public Site link */}
                    <Link
                        to="/"
                        title="Public Site"
                        className="hidden md:flex p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="text-base">🌐</span>
                    </Link>

                    {/* User Avatar + Menu */}
                    {user && (
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setUserMenuOpen(v => !v)}
                                className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full border border-[var(--glass-border)] hover:border-[var(--primary)]/40 transition-colors"
                                aria-label="User menu"
                                aria-expanded={userMenuOpen}
                            >
                                <div className="w-6 h-6 rounded-full bg-[var(--primary)]/15 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-[var(--primary)]">
                                        {(user.display_name || user.username).charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="hidden md:block text-xs font-semibold text-[var(--text-primary)] max-w-[80px] truncate">
                                    {user.display_name || user.username}
                                </span>
                            </button>

                            <AnimatePresence>
                                {userMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ duration: 0.12 }}
                                        className="
                                            absolute right-0 top-full mt-2 w-52 z-50
                                            bg-[var(--glass-card-bg)] border border-[var(--glass-border)]
                                            rounded-xl shadow-xl backdrop-blur-xl overflow-hidden py-1
                                        "
                                    >
                                        <div className="px-3.5 py-2.5 border-b border-[var(--glass-border)]">
                                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.display_name || user.username}</p>
                                            <p className="text-[10px] text-[var(--text-secondary)] capitalize">{user.role}</p>
                                        </div>
                                        {can('donations') && (
                                            <button
                                                onClick={() => { layoutContext.openDonModal(); setUserMenuOpen(false); }}
                                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                                            >
                                                🎁 ದಾನ ನೋಂದಣಿ
                                            </button>
                                        )}
                                        <Link
                                            to="/"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/8 hover:text-[var(--text-primary)] transition-colors"
                                        >
                                            🌐 ಸಾರ್ವಜನಿಕ ತಾಣ
                                        </Link>
                                        <div className="border-t border-[var(--glass-border)] mt-1 pt-1">
                                            <button
                                                onClick={() => { logout(); navigate('/login'); }}
                                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                                            >
                                                <LogOut size={14} />
                                                ಲಾಗ್ ಔಟ್
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className="lg:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        onClick={() => setMobileMenuOpen(v => !v)}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </header>

            {/* ─── Mobile Module Drawer ─── */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            key="mob-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="lg:hidden fixed inset-0 z-20 bg-black/40 backdrop-blur-sm print:hidden"
                        />
                        <motion.nav
                            key="mob-menu"
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.18 }}
                            className="
                                lg:hidden fixed top-12 left-0 right-0 z-25
                                bg-[var(--glass-card-bg)] border-b border-[var(--glass-border)]
                                backdrop-blur-2xl shadow-2xl
                                flex flex-col gap-1 p-3
                                print:hidden
                            "
                        >
                            {visibleModules.map(mod => {
                                const Icon = mod.icon;
                                const isActive =
                                    mod.path === '/app'
                                        ? location.pathname === '/app' || location.pathname === '/app/'
                                        : location.pathname.startsWith(mod.path);
                                return (
                                    <NavLink
                                        key={mod.id}
                                        to={mod.path}
                                        end={mod.path === '/app'}
                                        className={() =>
                                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                                    : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/8'
                                            }`
                                        }
                                    >
                                        <Icon size={18} />
                                        {mod.label}
                                    </NavLink>
                                );
                            })}

                            {/* Seva booking shortcut */}
                            {can('seva') && (
                                <button
                                    onClick={() => { layoutContext.openRegModal(); setMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition-all text-left"
                                >
                                    ✚ ಸೇವೆ ಬುಕ್ ಮಾಡಿ
                                </button>
                            )}
                            {can('donations') && (
                                <button
                                    onClick={() => { layoutContext.openDonModal(); setMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all text-left"
                                >
                                    🎁 ದಾನ ನೋಂದಣಿ
                                </button>
                            )}
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
