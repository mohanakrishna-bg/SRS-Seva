import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { MapPin, Phone, Globe } from 'lucide-react';
import type { PublicLayoutContextType } from '../../components/public/PublicLayout';
import EeDinaCard from '../../components/EeDinaCard';
import DaysHighlightsCard from '../../components/DaysHighlightsCard';
import EDarshanSection from '../../components/public/EDarshanSection';

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.55, ease: 'easeOut', delay },
    }),
};

export default function PublicHomePage() {
    const { lang, t, settings } = useOutletContext<PublicLayoutContextType>();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const orgName = lang === 'en'
        ? (settings.orgNameEn || settings.orgName || 'Sri Raghavendra Swamy Matha')
        : (settings.orgName || 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ');
    const orgAddress = lang === 'en'
        ? (settings.addressEn || settings.address || '')
        : (settings.address || '');

    const services = [
        {
            icon: '🪔',
            title: t('ಸೇವೆಗಳು', 'Sevas & Poojas'),
            desc: t(
                'ಅಭಿಷೇಕ, ಅರ್ಚನೆ, ಹೋಮ ಮತ್ತು ಇತರ ಧಾರ್ಮಿಕ ಸೇವೆಗಳನ್ನು ಕಾಯ್ದಿರಿಸಿ.',
                'Book Abhisheka, Archana, Homa and other religious services.'
            ),
            link: '/sevas',
            linkLabel: t('ಸೇವೆಗಳನ್ನು ನೋಡಿ →', 'View Sevas →'),
        },
        {
            icon: '🏛️',
            title: t('ಸೌಲಭ್ಯಗಳು', 'Facilities'),
            desc: t(
                'ಕಲ್ಪವೃಕ್ಷ ಪ್ರಾರ್ಥನಾ ಮಂದಿರ, ಪುರೋಹಿತ ಸೇವೆಗಳು ಮತ್ತು ಅಡುಗೆ-ಉಪಾಹಾರ ಸೌಲಭ್ಯಗಳು.',
                'Kalpavruksha function hall, priest services, and cooking & catering for private functions.'
            ),
            link: '/facilities',
            linkLabel: t('ಸೌಲಭ್ಯಗಳನ್ನು ನೋಡಿ →', 'View Facilities →'),
        },
        {
            icon: '📅',
            title: t('ಕಾರ್ಯಕ್ರಮಗಳು', 'Events & Calendar'),
            desc: t(
                'ಮಠದ ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮಗಳು, ಉತ್ಸವಗಳು ಮತ್ತು ಧಾರ್ಮಿಕ ಆಚರಣೆಗಳ ಪಟ್ಟಿ.',
                'Special events, festivals and religious observances at the Matha.'
            ),
            link: '/events',
            linkLabel: t('ಕಾರ್ಯಕ್ರಮ ಪಟ್ಟಿ →', 'Event Calendar →'),
        },
        {
            icon: '📞',
            title: t('ಸಂಪರ್ಕ', 'Contact Us'),
            desc: t(
                'ಮಠವನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಭೇಟಿ ನೀಡಿ. ಮಾರ್ಗ ನಕ್ಷೆ ಮತ್ತು ಫೋನ್ ಮಾಹಿತಿ.',
                'Get in touch or visit the Matha. Directions, phone and inquiry form.'
            ),
            link: '/contact',
            linkLabel: t('ಸಂಪರ್ಕಿಸಿ →', 'Contact →'),
        },
    ];

    return (
        <>
            {/* ===== HERO ===== */}
            <section
                className="relative overflow-hidden flex flex-col items-center justify-center text-center py-16 md:py-24 px-4"
                style={{
                    background: 'linear-gradient(135deg, var(--pub-hero-from) 0%, var(--pub-hero-to) 100%)',
                    minHeight: '560px',
                }}
            >
                {/* Subtle pattern overlay */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="relative z-10 flex flex-col items-center gap-5 max-w-4xl mx-auto"
                >
                    {/* Page 1 Sacred Invocations */}
                    <div className="inline-flex items-center gap-3 px-5 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs md:text-sm font-bold tracking-wider backdrop-blur-md shadow-lg">
                        <span>|| {t('ಮೂಲರಾಮೋ ವಿಜಯತೇ', 'Moolaramo Vijayate')} ||</span>
                        <span className="text-amber-300">✦</span>
                        <span>|| {t('ಗುರುರಾಜೋ ವಿಜಯತೇ', 'Gururajo Vijayate')} ||</span>
                    </div>

                    {/* Sri Rayaru Sacred Portrait from Page 1 */}
                    <div className="relative group">
                        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 opacity-80 blur-md group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-amber-300/90 shadow-2xl bg-amber-950/40">
                            <img
                                src="/images/aaradhana/rayaru_portrait.png"
                                alt="Sri Guru Raghavendra Swamy"
                                className="w-full h-full object-cover object-top scale-105"
                                onError={(e) => {
                                    // fallback to settings logo if available
                                    if (settings.logoImage) e.currentTarget.src = settings.logoImage;
                                }}
                            />
                        </div>
                    </div>

                    {/* Trust / Organization Title */}
                    <div>
                        <h1
                            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 leading-tight"
                            style={{ fontFamily: 'var(--pub-font-heading)', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
                        >
                            {orgName}
                        </h1>
                        <p className="text-amber-200/90 text-sm md:text-base font-medium tracking-wide">
                            {t('ಸೇವೆ · ಭಕ್ತಿ · ಸಮರ್ಪಣೆ', 'Service · Devotion · Dedication')}
                        </p>
                    </div>

                    {/* Page 1 Sacred Shloka Card */}
                    <div className="bg-black/30 backdrop-blur-md rounded-2xl px-6 py-3.5 border border-amber-300/35 max-w-xl mx-auto shadow-2xl">
                        <p
                            className="text-amber-200 text-sm sm:text-base md:text-lg font-bold leading-relaxed"
                            style={{ fontFamily: 'var(--pub-font-heading)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                        >
                            {lang === 'kn' ? (
                                <>
                                    ಪೂಜ್ಯಾಯ ರಾಘವೇಂದ್ರಾಯ ಸತ್ಯಧರ್ಮ ರತಾಯ ಚ |<br />
                                    ಭಜತಾಂ ಕಲ್ಪವೃಕ್ಷಾಯ ನಮತಾಂ ಕಾಮಧೇನವೇ ||
                                </>
                            ) : (
                                <>
                                    Poojyaya Raghavendraya Satyadharma Rathaya Cha |<br />
                                    Bhajatam Kalpavrukshaya Namatam Kamadhenave ||
                                </>
                            )}
                        </p>
                    </div>

                    {/* Address & Contact Details in Hero Banner */}
                    {(orgAddress || settings.phone || settings.website) && (
                        <div className="bg-black/25 backdrop-blur-md rounded-2xl px-5 py-2.5 border border-white/20 text-white/95 text-xs sm:text-sm shadow-xl flex flex-wrap items-center justify-center gap-x-6 gap-y-2 max-w-2xl mx-auto">
                            {orgAddress && (
                                <div className="flex items-center gap-1.5 text-center sm:text-left">
                                    <MapPin size={14} className="text-amber-300 shrink-0" />
                                    <span>{orgAddress}</span>
                                </div>
                            )}
                            {settings.phone && (
                                <a
                                    href={`tel:${settings.phone}`}
                                    className="flex items-center gap-1.5 hover:text-amber-200 transition-colors"
                                >
                                    <Phone size={13} className="text-amber-300 shrink-0" />
                                    <span className="font-semibold">{settings.phone}</span>
                                </a>
                            )}
                            {settings.website && (
                                <a
                                    href={settings.website.startsWith('http') ? settings.website : `https://${settings.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 hover:text-amber-200 transition-colors"
                                >
                                    <Globe size={13} className="text-amber-300 shrink-0" />
                                    <span>{settings.website.replace(/^https?:\/\//, '')}</span>
                                </a>
                            )}
                        </div>
                    )}

                    {/* Quick CTAs */}
                    <div className="flex flex-wrap gap-3.5 justify-center mt-1">
                        <Link
                            to="/sevas"
                            className="px-6 py-2.5 rounded-2xl font-bold text-sm shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                            style={{ background: 'white', color: 'var(--pub-saffron)' }}
                        >
                            🪔 {t('ಸೇವೆಗಳನ್ನು ನೋಡಿ', 'View Sevas')}
                        </Link>
                        <a
                            href="#e-darshan"
                            className="px-6 py-2.5 rounded-2xl font-bold text-sm shadow-xl transition-all hover:scale-105 border-2 border-amber-300 text-amber-200 hover:bg-amber-400/20 flex items-center gap-1.5"
                        >
                            <span>👁️</span>
                            <span>{t('ಇ-ದರ್ಶನ & ಕಾಣಿಕೆ', 'e-Darshan & Offering')}</span>
                        </a>
                        <Link
                            to="/contact"
                            className="px-6 py-2.5 rounded-2xl font-bold text-sm shadow-xl transition-all hover:scale-105 border-2 border-white/50 text-white hover:bg-white/10"
                        >
                            📞 {t('ಸಂಪರ್ಕಿಸಿ', 'Contact Us')}
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ===== VIRTUAL E-DARSHAN & E-HUNDI SECTION ===== */}
            <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.05 }}
            >
                <EDarshanSection lang={lang} t={t} upiId={settings?.upiVpa} />
            </motion.div>

            {/* Ornament divider */}
            <div className="text-center text-2xl py-4" style={{ color: 'var(--pub-saffron)', opacity: 0.4 }}>❖</div>

            {/* ===== EE DINA / PANCHANGA & TODAY'S SPECIAL EVENTS ===== */}
            <section className="py-10 px-4 md:px-8" style={{ background: 'var(--pub-bg)' }}>
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        className="mb-4 text-center"
                    >
                        <h2
                            className="text-2xl md:text-3xl font-bold mb-2"
                            style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                        >
                            {t('ಇಂದಿನ ಪಂಚಾಂಗ ಮತ್ತು ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮಗಳು', "Today's Panchanga & Special Events")}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
                            {t('ಇಂದಿನ ಮುಹೂರ್ತ, ತಿಥಿ ಮತ್ತು ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮಗಳ ವಿವರ', 'Muhurtha, tithi and highlights for today')}
                        </p>
                    </motion.div>
                    <div className="flex flex-col gap-6">
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            custom={0.1}
                            viewport={{ once: true, amount: 0.1 }}
                            className="w-full"
                        >
                            <EeDinaCard date={selectedDate} onDateChange={setSelectedDate} />
                        </motion.div>
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            custom={0.2}
                            viewport={{ once: true, amount: 0.1 }}
                            className="w-full"
                        >
                            <DaysHighlightsCard
                                date={selectedDate}
                                onRegisterSpecialEvent={() => {
                                    window.location.href = '/contact';
                                }}
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Ornament divider */}
            <div className="text-center text-2xl py-4" style={{ color: 'var(--pub-saffron)', opacity: 0.4 }}>❖</div>

            {/* ===== SERVICES GRID ===== */}
            <section className="py-12 px-4 md:px-8" style={{ background: 'var(--pub-bg)' }}>
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        className="text-center mb-10"
                    >
                        <h2
                            className="text-2xl md:text-3xl font-bold mb-2"
                            style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                        >
                            {t('ಮಠದ ಸೇವೆಗಳು', 'Our Services')}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
                            {t('ಭಕ್ತರಿಗೆ ಲಭ್ಯವಿರುವ ಸೇವೆಗಳು ಮತ್ತು ಸೌಲಭ್ಯಗಳು', 'Services and facilities available for devotees')}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {services.map((svc, i) => (
                            <motion.div
                                key={svc.link}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                custom={i * 0.1}
                                viewport={{ once: true, amount: 0.1 }}
                                className="rounded-2xl p-6 border flex flex-col gap-3 transition-all hover:-translate-y-1"
                                style={{
                                    background: 'var(--pub-bg-card)',
                                    borderColor: 'var(--pub-border)',
                                    boxShadow: 'var(--pub-shadow)',
                                }}
                            >
                                <div className="text-4xl">{svc.icon}</div>
                                <h3
                                    className="text-lg font-bold"
                                    style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                                >
                                    {svc.title}
                                </h3>
                                <p className="text-sm flex-1" style={{ color: 'var(--pub-text-muted)' }}>{svc.desc}</p>
                                <Link
                                    to={svc.link}
                                    className="text-sm font-semibold hover:underline"
                                    style={{ color: 'var(--pub-saffron)' }}
                                >
                                    {svc.linkLabel}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA STRIP ===== */}
            <section
                className="py-14 px-4 text-center"
                style={{ background: 'linear-gradient(135deg, var(--pub-hero-from) 0%, var(--pub-hero-to) 100%)' }}
            >
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <h2
                        className="text-2xl md:text-3xl font-bold text-white mb-4"
                        style={{ fontFamily: 'var(--pub-font-heading)' }}
                    >
                        {t('ಸೇವೆ ಕಾಯ್ದಿರಿಸಲು ಸಂಪರ್ಕಿಸಿ', 'Contact us to book a seva')}
                    </h2>
                    <p className="text-white/80 mb-8 max-w-md mx-auto text-sm">
                        {t(
                            'ನೇರವಾಗಿ ಮಠಕ್ಕೆ ಭೇಟಿ ನೀಡಿ ಅಥವಾ ಫೋನ್ ಮೂಲಕ ಸೇವೆಗಳನ್ನು ಕಾಯ್ದಿರಿಸಬಹುದು.',
                            'Visit the Matha directly or book sevas by phone.'
                        )}
                    </p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition-all hover:scale-105"
                        style={{ background: 'white', color: 'var(--pub-saffron)' }}
                    >
                        📞 {t('ಸಂಪರ್ಕಿಸಿ', 'Contact Us')}
                    </Link>
                </motion.div>
            </section>
        </>
    );
}
