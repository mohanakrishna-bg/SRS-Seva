import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X, MapPin, Phone, Clock, Globe, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings, type OrgSettings } from '../../context/SettingsContext';

export type PublicLayoutContextType = {
    lang: 'kn' | 'en';
    t: (kn: string, en: string) => string;
    settings: OrgSettings;
};

/**
 * PublicLayout — shell for all unauthenticated public-facing pages.
 * Theme (seva_theme) and language (seva_site_lang) keys are shared with
 * the authenticated app shell so preferences carry across boundaries.
 */
export default function PublicLayout() {
    const { settings } = useSettings();

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('seva_theme') as 'light' | 'dark') || 'light';
    });
    const [lang, setLang] = useState<'kn' | 'en'>(() => {
        return (localStorage.getItem('seva_site_lang') as 'kn' | 'en') || 'kn';
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('seva_theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('seva_site_lang', lang);
    }, [lang]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const t = (kn: string, en: string) => lang === 'en' ? en : kn;

    const orgName = lang === 'en'
        ? (settings.orgNameEn || settings.orgName || 'Sri Raghavendra Swamy Matha')
        : (settings.orgName || 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ');
    const orgAddress = lang === 'en'
        ? (settings.addressEn || settings.address || '')
        : (settings.address || '');

    const location = useLocation();

    // Smooth scroll to anchor hash (e.g. #e-darshan)
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            setTimeout(() => {
                const el = document.getElementById(id);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }, [location.hash, location.pathname]);

    const navLinks = [
        { to: '/', label: t('🏠 ಮುಖಪುಟ', '🏠 Home'), end: true },
        { to: '/#e-darshan', label: t('👁️ ಇ-ದರ್ಶನ', '👁️ e-Darshan'), isHash: true },
        { to: '/about', label: t('🕉️ ಪರಿಚಯ', '🕉️ About') },
        { to: '/sevas', label: t('🪔 ಸೇವೆಗಳು', '🪔 Sevas') },
        { to: '/facilities', label: t('🏛️ ಸೌಲಭ್ಯಗಳು', '🏛️ Facilities') },
        { to: '/events', label: t('📅 ಕಾರ್ಯಕ್ರಮಗಳು', '📅 Events') },
        { to: '/contact', label: t('📞 ಸಂಪರ್ಕ', '📞 Contact') },
    ];

    const navLinkClass = (isActive: boolean) =>
        `text-sm font-medium transition-colors duration-200 px-3 py-1.5 rounded-full ${
            isActive
                ? 'text-white'
                : 'hover:bg-[color:var(--pub-saffron)]/10'
        }`;

    const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
        background: isActive ? 'var(--pub-saffron)' : undefined,
        color: isActive ? 'white' : 'var(--pub-text)',
    });

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: 'var(--pub-bg)', color: 'var(--pub-text)', fontFamily: 'var(--pub-font-body)' }}
        >
            {/* ===== STICKY HEADER ===== */}
            <header
                className="sticky top-0 z-50 border-b backdrop-blur-md print:hidden"
                style={{
                    background: 'var(--pub-header-bg)',
                    borderColor: 'var(--pub-border)',
                    boxShadow: '0 1px 12px rgba(107,29,42,0.07)',
                }}
            >
                {/* Top Contact Strip */}
                <div
                    className="border-b text-xs py-1.5 px-4 md:px-8 transition-colors"
                    style={{
                        background: 'rgba(232, 101, 42, 0.05)',
                        borderColor: 'var(--pub-border)',
                        color: 'var(--pub-text-muted)',
                    }}
                >
                    <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs">
                        <div className="flex items-center gap-4 flex-wrap">
                            {settings.phone && (
                                <a
                                    href={`tel:${settings.phone}`}
                                    className="flex items-center gap-1.5 hover:text-[var(--pub-ink)] transition-colors"
                                    title={t('ದೂರವಾಣಿ / ಲ್ಯಾಂಡ್‌ಲೈನ್', 'Landline / Office Phone')}
                                >
                                    <Phone size={12} style={{ color: 'var(--pub-saffron)' }} />
                                    <span>{t('ಲ್ಯಾಂಡ್‌ಲೈನ್', 'Office')}: {settings.phone}</span>
                                </a>
                            )}
                            {settings.whatsapp && (
                                <a
                                    href={`https://wa.me/91${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors font-semibold"
                                    style={{ color: 'var(--pub-ink)' }}
                                    title={t('ಮೊಬೈಲ್ ಮತ್ತು ವಾಟ್ಸ್ಆಪ್', 'Mobile & WhatsApp')}
                                >
                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                        <Phone size={12} />
                                        <MessageCircle size={12} />
                                    </span>
                                    <span>{t('ಮೊಬೈಲ್ & ವಾಟ್ಸ್ಆಪ್', 'Mobile & WhatsApp')}: <strong className="font-bold">{settings.whatsapp}</strong></span>
                                </a>
                            )}
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-[var(--pub-text-muted)] text-[11px]">
                            <Clock size={12} style={{ color: 'var(--pub-saffron)' }} />
                            <span>{t('ದರ್ಶನ: ಬೆಳಿಗ್ಗೆ 6:00 – 1:30 | ಸಂಜೆ 5:30 – 8:30', 'Darshana: 6:00 AM – 1:30 PM | 5:30 PM – 8:30 PM')}</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-3 group shrink-0" aria-label="Home">
                        {settings.logoImage ? (
                            <img
                                src={settings.logoImage}
                                alt="Logo"
                                className="w-10 h-10 rounded-full object-cover border-2 shadow"
                                style={{ borderColor: 'rgba(232,101,42,0.4)' }}
                            />
                        ) : (
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md"
                                style={{ background: 'linear-gradient(135deg, var(--pub-saffron), var(--pub-maroon))' }}
                            >
                                🙏
                            </div>
                        )}
                        <div className="flex flex-col leading-tight">
                            <span
                                className="text-sm md:text-base font-bold"
                                style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                            >
                                {orgName}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--pub-text-muted)' }}>
                                {t('ಸೇವಾ ವ್ಯವಸ್ಥಾಪನೆ', 'Seva Management')}
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(link => {
                            const isHashActive = link.isHash
                                ? location.pathname === '/' && location.hash === '#e-darshan'
                                : (!location.hash && (link.end ? location.pathname === '/' : location.pathname.startsWith(link.to)));
                            return (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    end={link.end}
                                    onClick={() => {
                                        if (link.to.includes('#')) {
                                            const hash = link.to.split('#')[1];
                                            const el = document.getElementById(hash);
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                    className={() => navLinkClass(isHashActive)}
                                    style={() => navLinkStyle(isHashActive)}
                                >
                                    {link.label}
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setLang(l => l === 'kn' ? 'en' : 'kn')}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all hover:bg-[color:var(--pub-saffron)]/10 cursor-pointer shadow-sm"
                            style={{
                                borderColor: 'var(--pub-border)',
                                color: 'var(--pub-text)',
                                background: 'var(--pub-bg-card)',
                            }}
                            title={lang === 'kn' ? "ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಿಸಿ (Switch to English)" : "ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ (Switch to Kannada)"}
                        >
                            <Globe size={13} style={{ color: 'var(--pub-saffron)' }} />
                            {lang === 'kn' ? (
                                <span className="flex items-center gap-1">
                                    <span className="font-extrabold text-[var(--pub-saffron)]">ಕನ್ನಡ</span>
                                    <span className="text-[10px] opacity-70">→ English</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">English</span>
                                    <span className="text-[10px] opacity-70">→ ಕನ್ನಡ</span>
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                            className="p-2 rounded-full border transition-all"
                            style={{
                                borderColor: 'var(--pub-border)',
                                background: 'var(--pub-bg-card)',
                                color: 'var(--pub-text)',
                            }}
                            title="Toggle theme"
                        >
                            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                        </button>

                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setMobileMenuOpen(o => !o)}
                            className="md:hidden p-2 rounded-full border transition-all"
                            style={{
                                borderColor: 'var(--pub-border)',
                                background: 'var(--pub-bg-card)',
                                color: 'var(--pub-text)',
                            }}
                            aria-label="Toggle navigation"
                        >
                            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 z-40 md:hidden"
                                onClick={() => setMobileMenuOpen(false)}
                            />
                            <motion.nav
                                ref={menuRef}
                                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                className="fixed right-0 top-0 h-full w-72 z-50 flex flex-col py-6 px-5 gap-3 shadow-2xl md:hidden"
                                style={{
                                    background: 'var(--pub-bg)',
                                    borderLeft: '1px solid var(--pub-border)',
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-bold text-sm" style={{ color: 'var(--pub-text)' }}>{orgName}</span>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        style={{ color: 'var(--pub-text-muted)' }}
                                        aria-label="Close menu"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {navLinks.map(link => {
                                    const isHashActive = link.isHash
                                        ? location.pathname === '/' && location.hash === '#e-darshan'
                                        : (!location.hash && (link.end ? location.pathname === '/' : location.pathname.startsWith(link.to)));
                                    return (
                                        <NavLink
                                            key={link.to}
                                            to={link.to}
                                            end={link.end}
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                if (link.to.includes('#')) {
                                                    const hash = link.to.split('#')[1];
                                                    const el = document.getElementById(hash);
                                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                                }
                                            }}
                                            className={() =>
                                                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                                                    isHashActive ? 'text-white' : ''
                                                }`
                                            }
                                            style={() => ({
                                                background: isHashActive ? 'var(--pub-saffron)' : undefined,
                                                color: isHashActive ? 'white' : 'var(--pub-text)',
                                            })}
                                        >
                                            {link.label}
                                        </NavLink>
                                    );
                                })}

                                <div className="mt-auto flex items-center gap-3 px-2">
                                    <button
                                        onClick={() => setLang(l => l === 'kn' ? 'en' : 'kn')}
                                        className="flex-1 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5"
                                        style={{ borderColor: 'var(--pub-border)', color: 'var(--pub-text)' }}
                                    >
                                        <Globe size={14} style={{ color: 'var(--pub-saffron)' }} />
                                        {lang === 'kn' ? 'English ಗೆ ಬದಲಿಸಿ' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ'}
                                    </button>
                                    <button
                                        onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                                        className="flex-1 py-2 rounded-xl border text-xs font-bold"
                                        style={{ borderColor: 'var(--pub-border)', color: 'var(--pub-text)' }}
                                    >
                                        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                                    </button>
                                </div>
                            </motion.nav>
                        </>
                    )}
                </AnimatePresence>
            </header>

            {/* ===== PAGE CONTENT ===== */}
            <main className="flex-1">
                <Outlet context={{ lang, t, settings } satisfies PublicLayoutContextType} />
            </main>

            {/* ===== FOOTER ===== */}
            <footer
                className="border-t print:hidden"
                style={{ background: 'var(--pub-cream-dark, #F5EDE0)', borderColor: 'var(--pub-border)' }}
            >
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                {settings.logoImage ? (
                                    <img src={settings.logoImage} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                                        style={{ background: 'linear-gradient(135deg, var(--pub-saffron), var(--pub-maroon))' }}
                                    >
                                        🙏
                                    </div>
                                )}
                                <div>
                                    <p
                                        className="font-bold text-sm"
                                        style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                                    >
                                        {orgName}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--pub-text-muted)' }}>
                                        {t('ಸೇವೆ · ಭಕ್ತಿ · ಸಮರ್ಪಣೆ', 'Service · Devotion · Dedication')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-bold text-sm mb-3" style={{ color: 'var(--pub-ink)' }}>
                                {t('ತ್ವರಿತ ಲಿಂಕ್‌ಗಳು', 'Quick Links')}
                            </h4>
                            <div className="flex flex-col gap-2">
                                {navLinks.map(link => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className="text-sm transition-colors hover:underline"
                                        style={{ color: 'var(--pub-ink-light)' }}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h4 className="font-bold text-sm mb-3" style={{ color: 'var(--pub-ink)' }}>
                                {t('ಸಂಪರ್ಕ ಮಾಹಿತಿ', 'Contact Information')}
                            </h4>
                            <div className="flex flex-col gap-2">
                                {orgAddress && (
                                    <span className="flex items-start gap-2 text-xs" style={{ color: 'var(--pub-ink-light)' }}>
                                        <MapPin size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--pub-saffron)' }} />
                                        <span className="whitespace-pre-line">{orgAddress}</span>
                                    </span>
                                )}
                                {settings.phone && (
                                    <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--pub-ink-light)' }}>
                                        <Phone size={13} style={{ color: 'var(--pub-saffron)' }} />
                                        <span>{t('ಲ್ಯಾಂಡ್‌ಲೈನ್', 'Landline')}: {settings.phone}</span>
                                    </span>
                                )}
                                {settings.whatsapp && (
                                    <a
                                        href={`https://wa.me/91${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs hover:underline font-semibold"
                                        style={{ color: 'var(--pub-ink)' }}
                                    >
                                        <MessageCircle size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span>{t('ಮೊಬೈಲ್ ಮತ್ತು ವಾಟ್ಸ್ಆಪ್', 'Mobile & WhatsApp')}: {settings.whatsapp}</span>
                                    </a>
                                )}
                                <span className="flex items-start gap-2 text-xs" style={{ color: 'var(--pub-ink-light)' }}>
                                    <Clock size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--pub-saffron)' }} />
                                    <span>
                                        {t('ಬೆಳಿಗ್ಗೆ 6:00 – ಮ.1:30', '6:00 AM – 1:30 PM')}<br />
                                        {t('ಸಂಜೆ 5:30 – ರಾ.8:30', '5:30 PM – 8:30 PM')}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Bottom */}
                    <div
                        className="flex flex-col md:flex-row items-center justify-between gap-2 pt-6 border-t text-xs"
                        style={{ borderColor: 'var(--pub-border)', color: 'var(--pub-text-muted)' }}
                    >
                        <span>
                            © {new Date().getFullYear()} {orgName}.{' '}
                            {t('ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.', 'All Rights Reserved.')}
                        </span>
                        <Link to="/login" className="hover:underline opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--pub-text-muted)' }}>
                            {t('ಸಿಬ್ಬಂದಿ ಪ್ರವೇಶ', 'Staff Login')}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
