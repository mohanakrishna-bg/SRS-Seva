import { useOutletContext } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Phone, ShieldCheck, Users } from 'lucide-react';
import type { PublicLayoutContextType } from '../../components/public/PublicLayout';

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut', delay } }),
};

const Section = ({ children, alt }: { children: React.ReactNode; alt?: boolean }) => (
    <section
        className="py-14 px-4 md:px-8"
        style={{ background: alt ? 'var(--pub-cream-dark, #F5EDE0)' : 'var(--pub-bg)' }}
    >
        <div className="max-w-5xl mx-auto">{children}</div>
    </section>
);

interface CommitteeMember {
    nameKn: string;
    nameEn: string;
    roleKn: string;
    roleEn: string;
    phone: string;
    badgeColor?: string;
    icon?: string;
}

const executiveCommittee: CommitteeMember[] = [
    { nameKn: 'ಶ್ರೀ ಜಯರಾಂ ಎಸ್.', nameEn: 'Sri Jayaram S.', roleKn: 'ಅಧ್ಯಕ್ಷರು', roleEn: 'President', phone: '76248 77447', badgeColor: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30', icon: '👑' },
    { nameKn: 'ಶ್ರೀ ಶಿವಶಂಕರ್ ಕೆ. ಆರ್.', nameEn: 'Sri Shivashankar K. R.', roleKn: 'ಕಾರ್ಯಾಧ್ಯಕ್ಷರು', roleEn: 'Working President', phone: '94484 13041', badgeColor: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30', icon: '⚜️' },
    { nameKn: 'ಶ್ರೀ ನಂದನ್ ಹೆಚ್. ಎನ್.', nameEn: 'Sri Nandan H. N.', roleKn: 'ಉಪಾಧ್ಯಕ್ಷರು', roleEn: 'Vice President', phone: '99860 70750', badgeColor: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30', icon: '👥' },
    { nameKn: 'ಶ್ರೀ ವಿಜಯಕುಮಾರ್ ಬಿ. ಜೆ.', nameEn: 'Sri Vijaykumar B. J.', roleKn: 'ಉಪಾಧ್ಯಕ್ಷರು', roleEn: 'Vice President', phone: '94495 29746', badgeColor: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30', icon: '👥' },
    { nameKn: 'ಶ್ರೀ ದ್ವಾರಕಾನಾಥ್ ಕೆ. ಜಿ.', nameEn: 'Sri Dwarakanath K. G.', roleKn: 'ಕಾರ್ಯದರ್ಶಿಗಳು', roleEn: 'Secretary', phone: '98805 45631', badgeColor: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30', icon: '📝' },
    { nameKn: 'ಶ್ರೀ ರಾಜಾರಾಂ ಕೆ.', nameEn: 'Sri Rajaram K.', roleKn: 'ಸಹ ಕಾರ್ಯದರ್ಶಿಗಳು', roleEn: 'Joint Secretary', phone: '94498 42102', badgeColor: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30', icon: '📑' },
    { nameKn: 'ಶ್ರೀ ಸತ್ಯಮೂರ್ತಿ ಎ.', nameEn: 'Sri Satyamurthy A.', roleKn: 'ಖಜಾಂಚಿ', roleEn: 'Treasurer', phone: '94492 64611', badgeColor: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30', icon: '💰' },
];

const trustees = [
    { nameKn: 'ಶ್ರೀ ಮುಕುಂದ ರಾವ್ ಎನ್.ಕೆ.', nameEn: 'Sri Mukunda Rao N. K.', phone: '97407 99912' },
    { nameKn: 'ಶ್ರೀ ಸುಬ್ಬರಾವ್ ಹೆಚ್. ಎಸ್.', nameEn: 'Sri Subba Rao H. S.', phone: '87626 61660' },
    { nameKn: 'ಶ್ರೀ ಕೃಷ್ಣಮೂರ್ತಿ ಎಂ.ಜಿ.', nameEn: 'Sri Krishnamurthy M. G.', phone: '94496 79971' },
    { nameKn: 'ಶ್ರೀ ವೇಣುಗೋಪಾಲರಾವ್ ಬಿ. ಎಲ್.', nameEn: 'Sri Venugopal Rao B. L.', phone: '90082 74807' },
    { nameKn: 'ಶ್ರೀ ಪದ್ಮನಾಭರಾವ್ ಹೆಚ್. ಬಿ.', nameEn: 'Sri Padmanabha Rao H. B.', phone: '99641 80152' },
    { nameKn: 'ಶ್ರೀ ನಾಗರಾಜ್ ಕೆ.', nameEn: 'Sri Nagaraj K.', phone: '93412 07011' },
    { nameKn: 'ಶ್ರೀ ನರಸಿಂಹರಾಜು', nameEn: 'Sri Narasimharaju', phone: '98861 68997' },
    { nameKn: 'ಶ್ರೀ ಚಂದ್ರಶೇಖರ್ ಹೆಚ್. ಎನ್.', nameEn: 'Sri Chandrashekhar H. N.', phone: '97403 99992' },
    { nameKn: 'ಶ್ರೀ ಮುಕುಂದ ವೈ.ಎನ್.', nameEn: 'Sri Mukunda Y. N.', phone: '94812 18826' },
    { nameKn: 'ಶ್ರೀ ಮೋಹನ ಕೃಷ್ಣ', nameEn: 'Sri Mohana Krishna', phone: '97422 87905' },
];

export default function PublicAboutPage() {
    const { lang, t } = useOutletContext<PublicLayoutContextType>();

    const sections = [
        {
            heading: t('ಮಠದ ಇತಿಹಾಸ', 'History of the Matha'),
            body: t(
                'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠವು ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿಗಳ ಪರಂಪರೆ ಮತ್ತು ಮಧ್ವ ವೇದಾಂತ ಸಂಪ್ರದಾಯದ ಆಧಾರದ ಮೇಲೆ ನಿರ್ಮಿಸಲ್ಪಟ್ಟ ಧಾರ್ಮಿಕ ಕೇಂದ್ರ. ಈ ಮಠವು ಭಕ್ತರಿಗೆ ಆಧ್ಯಾತ್ಮಿಕ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ಸೇವಾ ಅವಕಾಶಗಳನ್ನು ಒದಗಿಸುತ್ತದೆ.',
                'Sri Raghavendra Swamy Matha is a religious institution built on the legacy of Sri Raghavendra Swamy and the Madhva Vedanta tradition. The Matha provides spiritual guidance and service opportunities for devotees.'
            ),
            icon: '🕉️',
        },
        {
            heading: t('ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿಗಳ ಮಹಿಮೆ', 'Glory of Sri Raghavendra Swamy'),
            body: t(
                'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿಗಳು ೧೬ನೇ ಶತಮಾನದ ಮಹಾನ್ ಸಂತ, ವಿದ್ವಾಂಸ ಮತ್ತು ದ್ವೈತ ವೇದಾಂತದ ಪ್ರಮುಖ ಪ್ರತಿನಿಧಿ. ಅವರ ಬೋಧನೆಗಳು ಮತ್ತು ಮಹಿಮೆಗಳು ಇಂದಿಗೂ ಲಕ್ಷಾಂತರ ಭಕ್ತರ ಹೃದಯದಲ್ಲಿ ಉಳಿದಿವೆ.',
                'Sri Raghavendra Swamy was a great saint, scholar, and leading exponent of Dvaita Vedanta in the 16th century. His teachings and miracles continue to inspire millions of devotees to this day.'
            ),
            icon: '🪔',
        },
        {
            heading: t('ಮಠದ ಸೇವಾ ಕಾರ್ಯಕ್ರಮಗಳು', 'Matha Service Programs'),
            body: t(
                'ಮಠವು ದೈನಂದಿನ ಪೂಜೆ, ಅಭಿಷೇಕ, ಅರ್ಚನೆ, ಹೋಮ ಮತ್ತು ಅನ್ನಸಂತರ್ಪಣೆ ಸೇವೆಗಳನ್ನು ನಡೆಸುತ್ತದೆ. ಭಕ್ತರು ತಮ್ಮ ಕೌಟುಂಬಿಕ ಸಂದರ್ಭಗಳಲ್ಲಿ ವಿಶೇಷ ಸೇವೆಗಳನ್ನು ಕಾಯ್ದಿರಿಸಬಹುದು.',
                'The Matha conducts daily puja, Abhisheka, Archana, Homa, and Annadana services. Devotees can book special sevas for family occasions and religious milestones.'
            ),
            icon: '📿',
        },
        {
            heading: t('ಆಧ್ಯಾತ್ಮಿಕ ಕಾರ್ಯಕ್ರಮಗಳು', 'Spiritual Programs'),
            body: t(
                'ಪ್ರತಿ ವರ್ಷ ಆರಾಧನೆ, ರಥಸಪ್ತಮಿ, ರಾಮನವಮಿ ಮತ್ತು ಇತರ ಪ್ರಮುಖ ಹಬ್ಬಗಳನ್ನು ವಿಶೇಷ ರೀತಿಯಲ್ಲಿ ಆಚರಿಸಲಾಗುತ್ತದೆ. ಈ ಕಾರ್ಯಕ್ರಮಗಳಲ್ಲಿ ಭಾಗವಹಿಸಲು ಭಕ್ತರಿಗೆ ಮುಕ್ತ ಅವಕಾಶ ನೀಡಲಾಗುತ್ತದೆ.',
                'Every year, Aradhana, Ratha Saptami, Ramanavami and other major festivals are celebrated with great devotion. Devotees are warmly welcome to participate in all programs.'
            ),
            icon: '🎊',
        },
    ];

    return (
        <>
            {/* Page Header */}
            <section
                className="py-16 px-4 text-center"
                style={{
                    background: 'linear-gradient(135deg, var(--pub-hero-from) 0%, var(--pub-hero-to) 100%)',
                }}
            >
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/15 border border-white/25 text-amber-200 text-xs font-bold mb-3 backdrop-blur-sm">
                        <span>|| {t('ಮೂಲರಾಮೋ ವಿಜಯತೇ', 'Moolaramo Vijayate')} ||</span>
                        <span>✦</span>
                        <span>|| {t('ಗುರುರಾಜೋ ವಿಜಯತೇ', 'Gururajo Vijayate')} ||</span>
                    </div>
                    <h1
                        className="text-3xl md:text-5xl font-bold text-white mb-3"
                        style={{ fontFamily: 'var(--pub-font-heading)' }}
                    >
                        🕉️ {t('ಮಠದ ಪರಿಚಯ ಮತ್ತು ಇತಿಹಾಸ', 'About the Matha & Tradition')}
                    </h1>
                    <p className="text-white/80 max-w-xl mx-auto text-sm md:text-base">
                        {t('ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠದ ಇತಿಹಾಸ, ತತ್ವ ಸಿದ್ಧಾಂತ ಮತ್ತು ಆಡಳಿತ ಮಂಡಳಿ', 'History, spiritual lineage, and governance of Sri Raghavendra Swamy Matha')}
                    </p>
                </motion.div>
            </section>

            {/* Content sections */}
            {sections.map((sec, i) => (
                <Section key={sec.heading} alt={i % 2 !== 0}>
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        custom={0}
                        viewport={{ once: true, amount: 0.2 }}
                        className="flex flex-col md:flex-row gap-6 items-start"
                    >
                        <div className="text-5xl shrink-0">{sec.icon}</div>
                        <div>
                            <h2
                                className="text-xl md:text-2xl font-bold mb-3"
                                style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                            >
                                {sec.heading}
                            </h2>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--pub-ink-light)' }}>
                                {sec.body}
                            </p>
                        </div>
                    </motion.div>
                </Section>
            ))}

            {/* ===== MANAGEMENT COMMITTEE & TRUSTEES SECTION ===== */}
            <section
                id="committee"
                className="py-16 px-4 md:px-8 border-t"
                style={{
                    background: 'var(--pub-bg-card, #ffffff)',
                    borderColor: 'var(--pub-border)',
                }}
            >
                <div className="max-w-6xl mx-auto space-y-12">
                    {/* Section Title */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        className="text-center max-w-2xl mx-auto"
                    >
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2.5">
                            <Users size={13} />
                            {t('ಆಡಳಿತ ಮಂಡಳಿ', 'Governance & Leadership')}
                        </span>
                        <h2
                            className="text-2xl md:text-4xl font-bold mb-3"
                            style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                        >
                            {t('ಕಾರ್ಯಕಾರಿ ಮಂಡಳಿ ಮತ್ತು ಧರ್ಮದರ್ಶಿಗಳು', 'Executive Committee & Board of Trustees')}
                        </h2>
                        <p className="text-sm text-[var(--pub-text-muted)]">
                            {t(
                                'ಶ್ರೀ ಗುರುರಾಘವೇಂದ್ರ ಸೇವಾ ಟ್ರಸ್ಟ್ (ರಿ) ಸಂಸ್ಥೆಯನ್ನು ಧಾರ್ಮಿಕ ಮತ್ತು ಸಾಮಾಜಿಕ ಸೇವೆಗಳಲ್ಲಿ ಮುನ್ನಡೆಸುತ್ತಿರುವ ಆಡಳಿತ ಮಂಡಳಿ ಸದಸ್ಯರು.',
                                'The dedicated leadership and trustees guiding Sri Guru Raghavendra Seva Trust (Regd.) in religious and social services.'
                            )}
                        </p>
                    </motion.div>

                    {/* Part 1: Executive Committee (ಕಾರ್ಯಕಾರಿ ಮಂಡಳಿ) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-[var(--pub-border)]">
                            <ShieldCheck size={20} className="text-[color:var(--pub-saffron)]" />
                            <h3
                                className="text-lg md:text-xl font-bold"
                                style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                            >
                                {t('ಕಾರ್ಯಕಾರಿ ಮಂಡಳಿ (Executive Committee)', 'Executive Committee')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {executiveCommittee.map((m, idx) => (
                                <motion.div
                                    key={m.phone}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    custom={idx * 0.05}
                                    viewport={{ once: true, amount: 0.1 }}
                                    className="rounded-2xl p-4 border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
                                    style={{
                                        background: 'var(--pub-bg)',
                                        borderColor: 'var(--pub-border)',
                                    }}
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="text-xl">{m.icon}</span>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${m.badgeColor}`}>
                                                {lang === 'kn' ? m.roleKn : m.roleEn}
                                            </span>
                                        </div>
                                        <h4
                                            className="text-sm md:text-base font-bold"
                                            style={{ color: 'var(--pub-ink)' }}
                                        >
                                            {lang === 'kn' ? m.nameKn : m.nameEn}
                                        </h4>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-[var(--pub-border)]/60 flex items-center justify-between">
                                        <a
                                            href={`tel:${m.phone.replace(/\s+/g, '')}`}
                                            className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--pub-saffron)] hover:underline"
                                            title="Call member"
                                        >
                                            <Phone size={13} />
                                            <span>{m.phone}</span>
                                        </a>
                                        <span className="text-[10px] text-[var(--pub-text-muted)] uppercase tracking-wider">
                                            {t('ಸಂಪರ್ಕಿಸಿ', 'Call')}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Part 2: Board of Trustees (ಧರ್ಮದರ್ಶಿಗಳು) */}
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[var(--pub-border)]">
                            <Users size={20} className="text-[color:var(--pub-saffron)]" />
                            <h3
                                className="text-lg md:text-xl font-bold"
                                style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                            >
                                {t('ಧರ್ಮದರ್ಶಿಗಳು (Board of Trustees)', 'Board of Trustees')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                            {trustees.map((tr, idx) => (
                                <motion.div
                                    key={tr.phone}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    custom={idx * 0.04}
                                    viewport={{ once: true, amount: 0.1 }}
                                    className="rounded-xl p-3 border transition-all duration-200 hover:shadow-md flex flex-col justify-between"
                                    style={{
                                        background: 'var(--pub-bg)',
                                        borderColor: 'var(--pub-border)',
                                    }}
                                >
                                    <div>
                                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
                                            <span className="text-xs">✦</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                {t('ಧರ್ಮದರ್ಶಿ', 'Trustee')}
                                            </span>
                                        </div>
                                        <h5
                                            className="text-xs md:text-sm font-bold truncate"
                                            style={{ color: 'var(--pub-ink)' }}
                                            title={lang === 'kn' ? tr.nameKn : tr.nameEn}
                                        >
                                            {lang === 'kn' ? tr.nameKn : tr.nameEn}
                                        </h5>
                                    </div>

                                    <div className="mt-2.5 pt-2 border-t border-[var(--pub-border)]/60">
                                        <a
                                            href={`tel:${tr.phone.replace(/\s+/g, '')}`}
                                            className="flex items-center gap-1 text-[11px] font-semibold text-[color:var(--pub-saffron)] hover:underline"
                                            title="Call trustee"
                                        >
                                            <Phone size={11} />
                                            <span>{tr.phone}</span>
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
