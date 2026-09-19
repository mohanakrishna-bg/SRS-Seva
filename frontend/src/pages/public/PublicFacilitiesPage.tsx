import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { 
    CheckCircle2, Download, Phone 
} from 'lucide-react';
import type { PublicLayoutContextType } from '../../components/public/PublicLayout';
import { settingsApi } from '../../api';

export interface FacilityItem {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    descriptionEn: string;
    features: string[];
    featuresEn: string[];
    icon?: string;
    image?: string; // Base64 or URL
    docUrl?: string; // PDF Base64 or URL
    docName?: string;
    htmlContent?: string;
    contactPhone?: string;
}

export const defaultFacilities: FacilityItem[] = [
    {
        id: 'kalpavruksha-hall',
        name: 'ಕಲ್ಪವೃಕ್ಷ ಪ್ರಾರ್ಥನಾ ಮಂದಿರ (ಸಭಾಭವನ)',
        nameEn: 'Kalpavruksha Prarthana Mandira (Function Hall)',
        description: 'ಖಾಸಗಿ ಧಾರ್ಮಿಕ ಮತ್ತು ಸಾಂಸ್ಕೃತಿಕ ಕಾರ್ಯಕ್ರಮಗಳಿಗಾಗಿ ಸುಸಜ್ಜಿತವಾದ ಕಲ್ಯಾಣ ಮಂಟಪ ಮತ್ತು ಸಭಾಂಗಣ. ಉಪನಯನ, ವಿವಾಹ, ಧಾರ್ಮಿಕ ಪ್ರವಚನಗಳು ಮತ್ತು ಕೌಟುಂಬಿಕ ಮಂಗಳ ಕಾರ್ಯಗಳಿಗೆ ಅತ್ಯಂತ ಪ್ರಶಸ್ತವಾದ ಪವಿತ್ರ ಸ್ಥಳ.',
        descriptionEn: 'Well-equipped sanctified function hall dedicated for private religious and cultural programs, Upanayana ceremonies, weddings, spiritual discourses, and sacred family gatherings.',
        features: [
            'ಸುಮಾರು 250+ ಆಸನ ಸಾಮರ್ಥ್ಯದ ವಿಶಾಲ ಮುಖ್ಯ ಸಭಾಂಗಣ',
            'ಪ್ರತ್ಯೇಕ ಊಟದ ಹಾಲ್ (Dining Hall) ಮತ್ತು ಕೈತೊಳೆಯುವ ಜಾಗ',
            'ಶುದ್ಧ ಕುಡಿಯುವ ನೀರು ಹಾಗೂ ನೈರ್ಮಲ್ಯಯುತ ಕೊಠಡಿಗಳು',
            'ಸುಸಜ್ಜಿತ ಧ್ವನಿವರ್ಧಕ (Sound System) ಮತ್ತು ವೇದಿಕೆ/ಮಂಟಪ',
            'ವಾಹನ ನಿಲುಗಡೆ (Parking) ಅನುಕೂಲ'
        ],
        featuresEn: [
            'Spacious main auditorium with 250+ seating capacity',
            'Separate dining hall and handwash area',
            'Purified drinking water and clean restrooms',
            'Integrated sound system and decorated sacred stage',
            'Convenient vehicle parking'
        ],
        icon: '🏛️',
    },
    {
        id: 'priest-services',
        name: 'ಪುರೋಹಿತ ಸೇವೆಗಳು',
        nameEn: 'Priest & Purohit Services',
        description: 'ಭಕ್ತರ ಖಾಸಗಿ ಧಾರ್ಮಿಕ ಕಾರ್ಯಕ್ರಮಗಳಿಗಾಗಿ ವಿದ್ವಾಂಸ ಪುರೋಹಿತರ ಸೇವೆಗಳು ಲಭ್ಯ. ಗೃಹಪ್ರವೇಶ, ಸತ್ಯನಾರಾಯಣ ಪೂಜೆ, ನಾಮಕರಣ, ಆಯುಷ್ಯ ಹೋಮ, ಶ್ರಾದ್ಧ ಹಾಗೂ ಇತರ ಸಾಂಪ್ರದಾಯಿಕ ವೈದಿಕ ವಿಧಿವಿಧಾನಗಳನ್ನು ಶಾಸ್ತ್ರೋಕ್ತವಾಗಿ ನೆರವೇರಿಸಲಾಗುತ್ತದೆ.',
        descriptionEn: 'Experienced Vedic scholars and priests available for private religious ceremonies including Gruhapravesha, Satyanarayana Pooja, Namakarana, Ayushya Homa, and family Samskaras conducted strictly according to authentic shastras.',
        features: [
            'ವೇದ-ವೇದಾಂತ ಸಂಪನ್ನ ವಿದ್ವಾಂಸ ಪುರೋಹಿತರು',
            'ಪೂಜಾ ಸಾಮಗ್ರಿಗಳ ನಿಖರ ಪಟ್ಟಿ ಮತ್ತು ಮಾರ್ಗದರ್ಶನ',
            'ಮನೆಗಳಲ್ಲಿ ಅಥವಾ ಮಠದ ಆವರಣದಲ್ಲಿ ಪೂಜೆ ನೆರವೇರಿಸುವಿಕೆ',
            'ಸಮಯಪಾಲನೆ ಮತ್ತು ಶ್ರದ್ಧಾಪೂರ್ವಕ ಶಾಸ್ತ್ರೋಕ್ತ ಆಚರಣೆ'
        ],
        featuresEn: [
            'Vedic scholars well-versed in authentic rituals',
            'Detailed checklist and prior preparation guidance',
            'Performed at devotee residence or at the Matha hall',
            'Punctual, disciplined, and devotionally compliant'
        ],
        icon: '🙏',
    },
    {
        id: 'cooking-catering',
        name: 'ಅಡುಗೆ ಮತ್ತು ಉಪಾಹಾರ ಸೇವೆಗಳು',
        nameEn: 'Cooking & Catering Services',
        description: 'ಖಾಸಗಿ ಕಾರ್ಯಕ್ರಮಗಳು ಹಾಗೂ ಧಾರ್ಮಿಕ ಸಮಾರಂಭಗಳಿಗೆ ಶುದ್ಧ ಸಾತ್ವಿಕ ಮಧ್ವ ಸಂಪ್ರದಾಯದ ಅಡುಗೆ ಮತ್ತು ತೀರ್ಥಪ್ರಸಾದ ತಯಾರಿಕಾ ಸೇವೆ. ಅನುಭವಿ ಭಟ್ಟರಿಂದ ನೈರ್ಮಲ್ಯ ಮತ್ತು ರುಚಿಕರವಾದ ಸಾಂಪ್ರದಾಯಿಕ ಭೋಜನ ವ್ಯವಸ್ಥೆ.',
        descriptionEn: 'Pure Sattvic traditional Madhwa cuisine preparation and catering services for private functions and religious gatherings. Prepared by veteran traditional Bhattas with utmost hygiene and authentic flavors.',
        features: [
            '೧೦೦% ಶುದ್ಧ ಸಾತ್ವಿಕ ಮಧ್ವ ಸಂಪ್ರದಾಯದ ಅಡುಗೆ',
            'ದೊಡ್ಡ ಸಮಾರಂಭಗಳಿಗೆ ಬೇಕಾದ ಪಾತ್ರೆ-ಉಪಕರಣಗಳ ಲಭ್ಯತೆ',
            'ನೈರ್ಮಲ್ಯ ಹಾಗೂ ಗುಣಮಟ್ಟದ ಪದಾರ್ಥಗಳ ಬಳಕೆ',
            'ಸಾಂಪ್ರದಾಯಿಕ ಪಂಕ್ತಿ ಭೋಜನ ಮತ್ತು ಬಫೆಟ್ ವ್ಯವಸ್ಥೆ'
        ],
        featuresEn: [
            '100% Sattvic traditional Madhwa Brahmin cuisine',
            'Complete heavy vessel and catering equipment availability',
            'Strict hygiene and highest quality ingredients',
            'Traditional seated pankti and buffet dining setups'
        ],
        icon: '🍲',
    },
];

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay } }),
};

export default function PublicFacilitiesPage() {
    const { lang, t } = useOutletContext<PublicLayoutContextType>();
    const [facilities, setFacilities] = useState<FacilityItem[]>(defaultFacilities);

    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                const res = await settingsApi.get('seva_facilities');
                if (res.data && Array.isArray(res.data.value) && res.data.value.length > 0) {
                    setFacilities(res.data.value);
                } else {
                    setFacilities(defaultFacilities);
                }
            } catch {
                const cached = localStorage.getItem('seva_facilities');
                if (cached) {
                    try { setFacilities(JSON.parse(cached)); } catch { setFacilities(defaultFacilities); }
                } else {
                    setFacilities(defaultFacilities);
                }
            }
        };
        fetchFacilities();
    }, []);

    return (
        <div className="pb-16">
            {/* ===== HERO SECTION ===== */}
            <section
                className="py-16 px-4 text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--pub-hero-from), var(--pub-hero-to))' }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl mx-auto relative z-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/30 backdrop-blur-sm">
                        🏛️ {t('ಭಕ್ತರ ಸೌಲಭ್ಯಗಳು', 'Facilities for Devotees')}
                    </div>
                    <h1
                        className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight"
                        style={{ fontFamily: 'var(--pub-font-heading)' }}
                    >
                        {t('ಮಠದ ಸೌಲಭ್ಯಗಳು ಮತ್ತು ಸೇವೆಗಳು', 'Matha Facilities & Services')}
                    </h1>
                    <p className="text-white/85 text-base md:text-lg">
                        {t(
                            'ಖಾಸಗಿ ಧಾರ್ಮಿಕ ಆಚರಣೆಗಳು, ಮಂಗಳ ಕಾರ್ಯಗಳು ಹಾಗೂ ಸತ್ಕಾರ್ಯಗಳಿಗಾಗಿ ಮಠದಲ್ಲಿ ಲಭ್ಯವಿರುವ ಪ್ರಮುಖ ಸೌಲಭ್ಯಗಳು.',
                            'Sacred facilities and reliable services available at the Matha for private religious ceremonies, weddings, and family observances.'
                        )}
                    </p>
                </motion.div>
            </section>

            {/* ===== FACILITIES LIST ===== */}
            <section className="py-12 px-4 md:px-8 max-w-6xl mx-auto">
                <div className="space-y-12">
                    {facilities.map((fac, idx) => {
                        const title = lang === 'en' ? (fac.nameEn || fac.name) : fac.name;
                        const desc = lang === 'en' ? (fac.descriptionEn || fac.description) : fac.description;
                        const features = (lang === 'en' && fac.featuresEn?.length) ? fac.featuresEn : fac.features;

                        return (
                            <motion.div
                                key={fac.id || idx}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                custom={idx * 0.1}
                                viewport={{ once: true, amount: 0.1 }}
                                className="rounded-3xl border overflow-hidden transition-all shadow-md hover:shadow-xl"
                                style={{
                                    background: 'var(--pub-bg-card)',
                                    borderColor: 'var(--pub-border)',
                                }}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 items-start">
                                    {/* Left: Icon & Text Details */}
                                    <div className={`space-y-4 ${fac.image ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md"
                                                style={{ background: 'linear-gradient(135deg, var(--pub-saffron), var(--pub-maroon))', color: 'white' }}
                                            >
                                                {fac.icon || '🏛️'}
                                            </div>
                                            <div>
                                                <h2
                                                    className="text-xl md:text-2xl font-bold"
                                                    style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                                                >
                                                    {title}
                                                </h2>
                                                {lang === 'kn' && fac.nameEn && (
                                                    <p className="text-xs text-[var(--pub-text-muted)] font-medium">
                                                        {fac.nameEn}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--pub-text)' }}>
                                            {desc}
                                        </p>

                                        {/* Rich HTML Content (if attached) */}
                                        {fac.htmlContent && (
                                            <div 
                                                className="p-4 rounded-2xl border text-sm prose dark:prose-invert max-w-none"
                                                style={{ background: 'var(--pub-bg)', borderColor: 'var(--pub-border)' }}
                                                dangerouslySetInnerHTML={{ __html: fac.htmlContent }}
                                            />
                                        )}

                                        {/* Amenities/Features Checklist */}
                                        {features && features.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--pub-saffron)' }}>
                                                    {t('ಮುಖ್ಯ ಸೌಲಭ್ಯಗಳು ಮತ್ತು ವೈಶಿಷ್ಟ್ಯಗಳು', 'Key Amenities & Highlights')}
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    {features.map((feat, fIdx) => (
                                                        <div key={fIdx} className="flex items-start gap-2 text-xs md:text-sm" style={{ color: 'var(--pub-text)' }}>
                                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                                            <span>{feat}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action buttons (Inquire + PDF download) */}
                                        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--pub-border)]">
                                            <Link
                                                to="/contact"
                                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm text-white shadow-md transition-transform hover:scale-105"
                                                style={{ background: 'var(--pub-saffron)' }}
                                            >
                                                <Phone size={14} />
                                                {t('ವಿಚಾರಣೆ ಮತ್ತು ಕಾಯ್ದಿರಿಸುವಿಕೆ', 'Inquire / Book Facility')}
                                            </Link>

                                            {fac.docUrl && (
                                                <a
                                                    href={fac.docUrl}
                                                    download={fac.docName || `${fac.id}-brochure.pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm border transition-all hover:bg-black/5 dark:hover:bg-white/5"
                                                    style={{ borderColor: 'var(--pub-border)', color: 'var(--pub-text)' }}
                                                >
                                                    <Download size={14} className="text-[color:var(--pub-saffron)]" />
                                                    {t('ಬ್ರೋಷರ್ ಡೌನ್‌ಲೋಡ್ (PDF)', 'Download Brochure (PDF)')}
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Facility Image (JPEG/PNG) if present */}
                                    {fac.image && (
                                        <div className="lg:col-span-5 w-full">
                                            <div className="rounded-2xl overflow-hidden border shadow-inner max-h-[340px] bg-black/5"
                                                style={{ borderColor: 'var(--pub-border)' }}
                                            >
                                                <img
                                                    src={fac.image}
                                                    alt={title}
                                                    className="w-full h-full object-cover max-h-[340px] hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom Guidance Card */}
                <div
                    className="mt-12 p-6 md:p-8 rounded-3xl border text-center"
                    style={{ background: 'var(--pub-cream-dark, #F5EDE0)', borderColor: 'var(--pub-border)' }}
                >
                    <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}>
                        {t('ವಿಶೇಷ ದಿನಾಂಕಗಳಿಗೆ ಮುಂಚಿತವಾಗಿ ಕಾಯ್ದಿರಿಸಿ', 'Advance Booking Recommended for Auspicious Dates')}
                    </h3>
                    <p className="text-sm max-w-xl mx-auto mb-5" style={{ color: 'var(--pub-text-muted)' }}>
                        {t(
                            'ಮುಹೂರ್ತದ ದಿನಗಳು ಮತ್ತು ವಿಶೇಷ ಮಾಸಗಳಲ್ಲಿ ಸಭಾಭವನ ಮತ್ತು ಪುರೋಹಿತ ಸೇವೆಗಳಿಗೆ ಮುಂಚಿತವಾಗಿ ಕಾಯ್ದಿರಿಸಿಕೊಳ್ಳುವುದು ಸೂಕ್ತ.',
                            'Please contact the Matha office well in advance for wedding dates, Upanayana seasons, and auspicious muhurthas.'
                        )}
                    </p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl font-bold text-sm text-white shadow-lg transition-transform hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, var(--pub-saffron), var(--pub-maroon))' }}
                    >
                        📞 {t('ಮಠದ ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ', 'Contact Matha Office')}
                    </Link>
                </div>
            </section>
        </div>
    );
}
