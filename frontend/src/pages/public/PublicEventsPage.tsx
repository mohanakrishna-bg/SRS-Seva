import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import type { PublicLayoutContextType } from '../../components/public/PublicLayout';
import EeDinaCard from '../../components/EeDinaCard';
import DaysHighlightsCard from '../../components/DaysHighlightsCard';

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay } }),
};

export default function PublicEventsPage() {
    const { t } = useOutletContext<PublicLayoutContextType>();
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <>
            {/* Page Header */}
            <section
                className="py-14 px-4 text-center"
                style={{ background: 'linear-gradient(135deg, var(--pub-hero-from), var(--pub-hero-to))' }}
            >
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1
                        className="text-3xl md:text-4xl font-bold text-white mb-3"
                        style={{ fontFamily: 'var(--pub-font-heading)' }}
                    >
                        📅 {t('ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ಉತ್ಸವಗಳು', 'Events & Festivals')}
                    </h1>
                    <p className="text-white/80 text-sm">
                        {t('ಮಠದಲ್ಲಿ ನಡೆಯುವ ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ಧಾರ್ಮಿಕ ಉತ್ಸವಗಳು', 'Special programs and religious festivals at the Matha')}
                    </p>
                </motion.div>
            </section>

            {/* Panchanga & Highlights */}
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
                            {t('ಪಂಚಾಂಗ ಮಾಹಿತಿ', 'Panchanga Information')}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
                            {t('ದಿನಾಂಕ ಆಯ್ಕೆ ಮಾಡಿ ಆ ದಿನದ ಮಾಹಿತಿ ನೋಡಿ', 'Select a date to view panchanga details')}
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

            {/* Annual Festivals */}
            <section
                className="py-12 px-4 md:px-8"
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
                    </motion.div>

                    {[
                        {
                            icon: '🌸',
                            title: t('ರಾಮನವಮಿ', 'Ramanavami'),
                            desc: t('ಶ್ರೀ ರಾಮಚಂದ್ರ ಜನ್ಮೋತ್ಸವ — ವಿಶೇಷ ಪೂಜೆ ಮತ್ತು ಅನ್ನಸಂತರ್ಪಣೆ.', "Sri Ramachandra's birth celebration — special puja and Annadana."),
                            month: t('ಚೈತ್ರ', 'Chaitra (Apr)'),
                        },
                        {
                            icon: '🎺',
                            title: t('ಶ್ರೀ ರಾಘವೇಂದ್ರ ಆರಾಧನೆ', 'Sri Raghavendra Aradhana'),
                            desc: t('ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿಗಳ ವೃಂದಾವನ ಪ್ರವೇಶ ದಿನ. ಮಹೋತ್ಸವ ಆಚರಣೆ.', "Commemorating Sri Raghavendra Swamy's Vrindavana Pravesha. Grand celebration."),
                            month: t('ಶ್ರಾವಣ', 'Shravana (Aug)'),
                        },
                        {
                            icon: '🌟',
                            title: t('ರಥಸಪ್ತಮಿ', 'Ratha Saptami'),
                            desc: t('ಸೂರ್ಯ ಭಗವಾನ್‌ ಆರಾಧನಾ ದಿನ — ವಿಶೇಷ ಹೋಮ ಮತ್ತು ಅರ್ಚನೆ.', 'Sun God worship day — special Homa and Archana.'),
                            month: t('ಮಾಘ', 'Magha (Feb)'),
                        },
                        {
                            icon: '🪔',
                            title: t('ದೀಪಾವಳಿ', 'Deepavali'),
                            desc: t('ದೀಪಗಳ ಹಬ್ಬ — ವಿಶೇಷ ದೀಪಾಲಂಕಾರ ಮತ್ತು ಸಮೂಹ ಪ್ರಾರ್ಥನೆ.', 'Festival of lights — special lamp decoration and congregational prayers.'),
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
                                        className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                                        style={{ background: 'var(--pub-saffron)', color: 'white' }}
                                    >
                                        {fest.month}
                                    </span>
                                </div>
                                <p className="text-sm mt-1" style={{ color: 'var(--pub-ink-light)' }}>{fest.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
        </>
    );
}
