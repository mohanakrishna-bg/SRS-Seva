import { useOutletContext } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
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
        <div className="max-w-4xl mx-auto">{children}</div>
    </section>
);

export default function PublicAboutPage() {
    const { t } = useOutletContext<PublicLayoutContextType>();

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
                className="py-14 px-4 text-center"
                style={{
                    background: 'linear-gradient(135deg, var(--pub-hero-from) 0%, var(--pub-hero-to) 100%)',
                }}
            >
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1
                        className="text-3xl md:text-4xl font-bold text-white mb-3"
                        style={{ fontFamily: 'var(--pub-font-heading)' }}
                    >
                        🕉️ {t('ಮಠದ ಪರಿಚಯ', 'About the Matha')}
                    </h1>
                    <p className="text-white/80 max-w-xl mx-auto text-sm">
                        {t('ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠದ ಇತಿಹಾಸ ಮತ್ತು ಪರಂಪರೆ', 'History and tradition of Sri Raghavendra Swamy Matha')}
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
        </>
    );
}
