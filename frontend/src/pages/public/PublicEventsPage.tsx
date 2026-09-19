import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Clock, Calendar, MapPin, Sparkles, Download } from 'lucide-react';
import type { PublicLayoutContextType } from '../../components/public/PublicLayout';
import EeDinaCard from '../../components/EeDinaCard';
import DaysHighlightsCard from '../../components/DaysHighlightsCard';
import { settingsApi } from '../../api';

export interface UpcomingEventItem {
    id: string;
    title: string;
    titleEn: string;
    date: string;
    dateDisplay?: string;
    time?: string;
    description: string;
    descriptionEn: string;
    venue?: string;
    badge?: string;
    image?: string;
    docUrl?: string;
    docName?: string;
    htmlContent?: string;
}

export const defaultUpcomingEvents: UpcomingEventItem[] = [
    {
        id: 'evt-ekadashi',
        title: 'ಸರ್ವೈಕಾದಶಿ ಮಹಾಪೂಜೆ ಹಾಗೂ ಹರಿಕಥಾಮೃತ ಪ್ರವಚನ',
        titleEn: 'Sarva Ekadashi Special Pooja & Harikatha Discourse',
        date: 'ಮುಂಬರುವ ಏಕಾದಶಿ',
        dateDisplay: 'ಶುಕ್ಲ/ಕೃಷ್ಣ ಏಕಾದಶಿ',
        time: 'ಬೆಳಿಗ್ಗೆ ೮:೦೦ – ಸಂಜೆ ೮:೩೦',
        venue: 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ, ಮೈಸೂರು',
        description: 'ವಿಶೇಷ ಪಂಚಾಮೃತ ಅಭಿಷೇಕ, ಫಲಹಾರ ಪ್ರಸಾದ ಸಂಕಲ್ಪ, ಸಂಜೆ ವಿದ್ವಾಂಸರಿಂದ ಶ್ರೀ ಹರಿಕಥಾಮೃತಸಾರ ಪ್ರವಚನ ಮತ್ತು ಭಜನಾ ಸೇವೆ.',
        descriptionEn: 'Special Panchamrutha Abhisheka, sacred upasana, and evening Harikathamruthasara spiritual lecture by eminent scholars followed by community bhajans.',
        badge: 'ಮಾಸಿಕ ವ್ರತ / Monthly',
    },
    {
        id: 'evt-madhwanavami',
        title: 'ಶ್ರೀ ಮಧ್ವನವಮಿ ಮಹೋತ್ಸವ ಮತ್ತು ಸರ್ವಮೂಲ ಗ್ರಂಥ ಪಾರಾಯಣ',
        titleEn: 'Sri Madhwanavami Mahotsava & Sarvamoola Parayana',
        date: 'ಮಾಘ ಶುಕ್ಲ ನವಮಿ',
        dateDisplay: 'ಫೆಬ್ರವರಿ / ಮಾಘ ಮಾಸ',
        time: 'ಬೆಳಿಗ್ಗೆ ೭:೩೦ – ಮಧ್ಯಾಹ್ನ ೧:೩೦',
        venue: 'ಕಲ್ಪವೃಕ್ಷ ಪ್ರಾರ್ಥನಾ ಮಂದಿರ',
        description: 'ಜಗದ್ಗುರು ಶ್ರೀ ಮಧ್ವಾಚಾರ್ಯರ ಬದರಿಕಾಶ್ರಮ ಪ್ರವೇಶ ದಿನದ ಅಂಗವಾಗಿ ಶ್ರೀ ಸರ್ವಮೂಲ ಗ್ರಂಥಗಳ ಸಾಮೂಹಿಕ ಪಾರಾಯಣ, ಮಹಾ ಸಮರ್ಪಣೆ ಮತ್ತು ಬ್ರಾಹ್ಮಣ ಸುವಾಸಿನಿ ಪೂಜೆ.',
        descriptionEn: 'Commemorating Jagadguru Sri Madhwacharya\'s journey to Badarikashrama with congregational parayana of Sarvamoola granthas and grand maha-annadana.',
        badge: 'ಮಹೋತ್ಸವ / Festival',
    },
    {
        id: 'evt-satsanga',
        title: 'ಸಾಪ್ತಾಹಿಕ ಗುರುಸ್ತೋತ್ರ ಪಠಣ ಹಾಗೂ ಭಜನಾ ಸಂಜೆ',
        titleEn: 'Weekly Guru Stotra & Devotional Bhajan Satsanga',
        date: 'ಪ್ರತಿ ಗುರುವಾರ',
        dateDisplay: 'ಪ್ರತಿ ಗುರುವಾರ',
        time: 'ಸಂಜೆ ೬:೩೦ – ರಾತ್ರಿ ೮:೦೦',
        venue: 'ಮುಖ್ಯ ಪ್ರಾರ್ಥನಾ ಮಂದಿರ',
        description: 'ಗುರುವಾರದ ವಿಶೇಷ ರಾಯರ ವೃಂದಾವನ ದೀಪಾಲಂಕಾರ, ಶ್ರೀ ಗುರುರಾಜರ ಅಷ್ಟೋತ್ತರ ಶತನಾಮಾವಳಿ ಪಠಣ ಮತ್ತು ಭಜನಾ ಮಂಡಳಿಯಿಂದ ದಾಸರ ಪದಗಳ ಗಾಯನ.',
        descriptionEn: 'Thursday special deepalankara around Sri Rayara sacred Vrindavana, chanting of Guru Stotra, and uplifting devotional singing of Dasa Sahitya.',
        badge: 'ಸಾಪ್ತಾಹಿಕ / Weekly',
    },
];

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay } }),
};

export default function PublicEventsPage() {
    const { lang, t } = useOutletContext<PublicLayoutContextType>();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEventItem[]>(defaultUpcomingEvents);

    useEffect(() => {
        const fetchUpcoming = async () => {
            try {
                const res = await settingsApi.get('seva_upcoming_events');
                if (res.data && Array.isArray(res.data.value) && res.data.value.length > 0) {
                    setUpcomingEvents(res.data.value);
                } else {
                    setUpcomingEvents(defaultUpcomingEvents);
                }
            } catch {
                const cached = localStorage.getItem('seva_upcoming_events');
                if (cached) {
                    try { setUpcomingEvents(JSON.parse(cached)); } catch { setUpcomingEvents(defaultUpcomingEvents); }
                } else {
                    setUpcomingEvents(defaultUpcomingEvents);
                }
            }
        };
        fetchUpcoming();
    }, []);

    return (
        <div className="pb-16">
            {/* ===== PAGE HERO ===== */}
            <section
                className="py-14 px-4 text-center"
                style={{ background: 'linear-gradient(135deg, var(--pub-hero-from), var(--pub-hero-to))' }}
            >
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/30 backdrop-blur-sm">
                        📅 {t('ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ಉತ್ಸವಗಳು', 'Programs & Festivals')}
                    </div>
                    <h1
                        className="text-3xl md:text-4xl font-bold text-white mb-3"
                        style={{ fontFamily: 'var(--pub-font-heading)' }}
                    >
                        {t('ಮಠದ ಕಾರ್ಯಕ್ರಮಗಳ ವಿವರ', 'Matha Events & Calendar')}
                    </h1>
                    <p className="text-white/80 text-sm md:text-base max-w-xl mx-auto">
                        {t('ದಿನದ ಪಂಚಾಂಗ, ದಿನದ ವಿಶೇಷಗಳು, ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ವಾರ್ಷಿಕ ಉತ್ಸವಗಳ ಸಮಗ್ರ ಮಾಹಿತಿ.', 'Comprehensive schedule of daily panchanga, today\'s special events, upcoming programs, and annual festivals.')}
                    </p>
                </motion.div>
            </section>

            {/* ===== 1. PANCHANGA & TODAY\'S SPECIAL HIGHLIGHTS (View Only) ===== */}
            <section className="py-12 px-4 md:px-8" style={{ background: 'var(--pub-bg)' }}>
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        className="text-center mb-8"
                    >
                        <h2
                            className="text-2xl font-bold mb-1"
                            style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                        >
                            {t('ದಿನದ ಪಂಚಾಂಗ ಮತ್ತು ವಿಶೇಷ ಘಟನೆಗಳು', "Today's Panchanga & Special Events")}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
                            {t('ದಿನಾಂಕ ಆಯ್ಕೆ ಮಾಡಿ ಆ ದಿನದ ಪಂಚಾಂಗ ಮತ್ತು ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ನೋಡಿ (ವೀಕ್ಷಣೆ ಮಾತ್ರ)', 'Select a date to view daily panchanga and scheduled events (View Only)')}
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
                                onRegisterSpecialEvent={() => { window.location.href = '/contact'; }}
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== 2. UPCOMING EVENTS (Read Only) ===== */}
            <section className="py-14 px-4 md:px-8" style={{ background: 'var(--pub-bg-card)', borderTop: '1px solid var(--pub-border)', borderBottom: '1px solid var(--pub-border)' }}>
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        className="text-center mb-10"
                    >
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
                            style={{ background: 'rgba(232,101,42,0.1)', color: 'var(--pub-saffron)' }}
                        >
                            <Sparkles size={14} />
                            {t('ಮುಂಬರುವ ದಿನಗಳು', 'Upcoming Highlights')}
                        </div>
                        <h2
                            className="text-2xl md:text-3xl font-bold mb-2"
                            style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                        >
                            {t('ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು', 'Upcoming Events & Observances')}
                        </h2>
                        <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--pub-text-muted)' }}>
                            {t('ಮಠದಲ್ಲಿ ನಿಗದಿಯಾಗಿರುವ ಮುಂಬರುವ ಧಾರ್ಮಿಕ ಪೂಜೆಗಳು, ಪ್ರವಚನಗಳು ಮತ್ತು ಸತ್ಸಂಗಗಳ ಪಟ್ಟಿ.', 'Schedule of upcoming poojas, discourses, and devotional gatherings at the Matha.')}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingEvents.map((evt, i) => {
                            const title = lang === 'en' ? (evt.titleEn || evt.title) : evt.title;
                            const desc = lang === 'en' ? (evt.descriptionEn || evt.description) : evt.description;

                            return (
                                <motion.div
                                    key={evt.id || i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    custom={i * 0.1}
                                    viewport={{ once: true, amount: 0.1 }}
                                    className="rounded-3xl border overflow-hidden flex flex-col transition-all hover:shadow-lg"
                                    style={{
                                        background: 'var(--pub-bg)',
                                        borderColor: 'var(--pub-border)',
                                    }}
                                >
                                    {evt.image && (
                                        <div className="w-full h-44 overflow-hidden bg-black/5 border-b border-[var(--pub-border)]">
                                            <img
                                                src={evt.image}
                                                alt={title}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}

                                    <div className="p-6 flex flex-col flex-1 gap-3">
                                        {/* Date & Badge Header */}
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                                                style={{ background: 'var(--pub-saffron)', color: 'white' }}
                                            >
                                                <Calendar size={12} />
                                                {evt.dateDisplay || evt.date}
                                            </span>

                                            {evt.badge && (
                                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                                                    style={{ borderColor: 'var(--pub-border)', color: 'var(--pub-text-muted)' }}
                                                >
                                                    {evt.badge}
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3
                                            className="text-lg font-bold leading-snug"
                                            style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                                        >
                                            {title}
                                        </h3>

                                        {/* Time and Venue */}
                                        <div className="space-y-1.5 text-xs" style={{ color: 'var(--pub-text-muted)' }}>
                                            {evt.time && (
                                                <div className="flex items-center gap-2">
                                                    <Clock size={13} className="text-[color:var(--pub-saffron)] shrink-0" />
                                                    <span>{evt.time}</span>
                                                </div>
                                            )}
                                            {evt.venue && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={13} className="text-[color:var(--pub-saffron)] shrink-0" />
                                                    <span>{evt.venue}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm leading-relaxed flex-1 mt-1" style={{ color: 'var(--pub-text)' }}>
                                            {desc}
                                        </p>

                                        {/* Rich HTML Content if attached */}
                                        {evt.htmlContent && (
                                            <div
                                                className="p-3 rounded-xl border text-xs prose dark:prose-invert max-w-none my-1"
                                                style={{ background: 'var(--pub-bg-card)', borderColor: 'var(--pub-border)' }}
                                                dangerouslySetInnerHTML={{ __html: evt.htmlContent }}
                                            />
                                        )}

                                        {/* Footer Actions (PDF download + Contact link) */}
                                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--pub-border)] mt-auto">
                                            {evt.docUrl ? (
                                                <a
                                                    href={evt.docUrl}
                                                    download={evt.docName || `${evt.id}-flyer.pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--pub-saffron)] hover:underline"
                                                >
                                                    <Download size={13} />
                                                    {t('ಕರಪತ್ರ (PDF)', 'Flyer (PDF)')}
                                                </a>
                                            ) : <div />}

                                            <Link
                                                to="/contact"
                                                className="text-xs font-bold hover:underline"
                                                style={{ color: 'var(--pub-saffron)' }}
                                            >
                                                {t('ವಿವರಗಳಿಗೆ ಸಂಪರ್ಕಿಸಿ →', 'Contact for details →')}
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ===== 3. MAJOR ANNUAL FESTIVALS (Read Only) ===== */}
            <section
                className="py-14 px-4 md:px-8"
                style={{ background: 'var(--pub-cream-dark, #F5EDE0)' }}
            >
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        className="text-center mb-8"
                    >
                        <h2
                            className="text-2xl font-bold mb-1"
                            style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                        >
                            {t('ಪ್ರಮುಖ ವಾರ್ಷಿಕ ಉತ್ಸವಗಳು', 'Major Annual Festivals')}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
                            {t('ಪ್ರತಿವರ್ಷ ಮಠದಲ್ಲಿ ವಿಜೃಂಭಣೆಯಿಂದ ಆಚರಿಸಲಾಗುವ ಪ್ರಧಾನ ವಾರ್ಷಿಕ ಧಾರ್ಮಿಕ ಮಹೋತ್ಸವಗಳು', 'Grand annual festivities celebrated every year with great devotion at the Matha')}
                        </p>
                    </motion.div>

                    {[
                        {
                            icon: '🌸',
                            title: t('ರಾಮನವಮಿ', 'Ramanavami'),
                            desc: t('ಶ್ರೀ ರಾಮಚಂದ್ರ ಜನ್ಮೋತ್ಸವ — ವಿಶೇಷ ಪೂಜೆ, ಕಲ್ಯಾಣೋತ್ಸವ ಮತ್ತು ಅನ್ನಸಂತರ್ಪಣೆ.', "Sri Ramachandra's birth celebration — special puja, kalyanotsava, and Annadana."),
                            month: t('ಚೈತ್ರ', 'Chaitra (Apr)'),
                        },
                        {
                            icon: '🎺',
                            title: t('ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿಗಳ ಆರಾಧನಾ ಮಹೋತ್ಸವ', 'Sri Raghavendra Swamy Aradhana Mahotsava'),
                            desc: t('ಶ್ರೀ ಗುರುರಾಜರ ವೃಂದಾವನ ಪ್ರವೇಶ ದಿನದ ಪವಿತ್ರ ಮಹೋತ್ಸವ — ಮೂರು ದಿನಗಳ ರಥೋತ್ಸವ, ಕನಕಾಭಿಷೇಕ ಮತ್ತು ಸಾರ್ವಜನಿಕ ಮಹಾಸಂತರ್ಪಣೆ.', "Commemorating Sri Raghavendra Swamy's Vrindavana Pravesha. 3-day grand festival with Rathotsava, Kanakabhisheka and mass Annadana."),
                            month: t('ಶ್ರಾವಣ', 'Shravana (Aug)'),
                        },
                        {
                            icon: '🌟',
                            title: t('ರಥಸಪ್ತಮಿ', 'Ratha Saptami'),
                            desc: t('ಸೂರ್ಯ ಭಗವಾನ್‌ ಹಾಗೂ ಶ್ರೀ ಹರಿ ಆರಾಧನಾ ಪರ್ವ — ಸೂರ್ಯ ನಮಸ್ಕಾರ, ವಿಶೇಷ ನವಗ್ರಹ ಹೋಮ ಮತ್ತು ಅರ್ಚನೆ.', 'Sun God & Sri Hari worship day — Surya Namaskara, special Navagraha Homa, and Archana.'),
                            month: t('ಮಾಘ', 'Magha (Feb)'),
                        },
                        {
                            icon: '🪔',
                            title: t('ದೀಪಾವಳಿ ಮತ್ತು ತುಳಸಿ ಪೂಜೆ', 'Deepavali & Tulasi Pooja'),
                            desc: t('ದೀಪಗಳ ಮಹಾಪರ್ವ — ಮಠದಾದ್ಯಂತ ವಿಶೇಷ ದೀಪಾಲಂಕಾರ, ಲಕ್ಷ್ಮೀ ಪೂಜೆ ಮತ್ತು ತುಳಸಿ ವಿವಾಹ ಮಹೋತ್ಸವ.', 'Festival of lights — temple-wide illuminations, Lakshmi Pooja, and Tulasi Vivaha celebrations.'),
                            month: t('ಕಾರ್ತಿಕ', 'Kartika (Oct/Nov)'),
                        },
                    ].map((fest, i) => (
                        <motion.div
                            key={fest.title}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            custom={i * 0.08}
                            viewport={{ once: true, amount: 0.1 }}
                            className="flex gap-4 items-start p-5 rounded-2xl border mb-4 transition-all hover:shadow-md"
                            style={{
                                background: 'var(--pub-bg-card)',
                                borderColor: 'var(--pub-border)',
                            }}
                        >
                            <div className="text-4xl shrink-0">{fest.icon}</div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <h3
                                        className="font-bold text-base"
                                        style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                                    >
                                        {fest.title}
                                    </h3>
                                    <span
                                        className="text-xs px-2.5 py-0.5 rounded-full font-bold shrink-0"
                                        style={{ background: 'var(--pub-saffron)', color: 'white' }}
                                    >
                                        {fest.month}
                                    </span>
                                </div>
                                <p className="text-sm mt-1" style={{ color: 'var(--pub-text)' }}>{fest.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
}
