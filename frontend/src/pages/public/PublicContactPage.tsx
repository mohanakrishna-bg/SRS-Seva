import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { MapPin, Phone, MessageCircle, Clock, CreditCard, Copy, Check, Navigation, ExternalLink, Compass, Bus, Train } from 'lucide-react';
import type { PublicLayoutContextType } from '../../components/public/PublicLayout';

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay } }),
};

export default function PublicContactPage() {
    const { lang, t, settings } = useOutletContext<PublicLayoutContextType>();
    const [copied, setCopied] = useState(false);

    const orgName = lang === 'en'
        ? (settings.orgNameEn || settings.orgName || 'Sri Raghavendra Swamy Matha')
        : (settings.orgName || 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ');
    const orgAddress = lang === 'en'
        ? (settings.addressEn || settings.address || '# T-1, 10th Main Road, 4th Stage, T.K. Layout, Mysuru 570009')
        : (settings.address || 'ನಂ. ಟಿ- ೧, ೧೦ ನೆಯ ಮುಖ್ಯ ರಸ್ತೆ, ೪ ನೆಯ ಹಂತ, ತೊಣಚಿಕೊಪ್ಪಲು ಬಡಾವಣೆ, ಮೈಸೂರು ೫೭೦೦೦೯');

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        'Sri Guru Raghavendra Seva Trust, 10th Main Road, 4th Stage, TK Layout, Tonachikoppal, Mysuru, Karnataka 570009'
    )}`;

    const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
        'Sri Guru Raghavendra Seva Trust TK Layout Mysuru 570009'
    )}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

    const contactInfo = [
        {
            icon: <MapPin size={18} style={{ color: 'var(--pub-saffron)' }} />,
            label: t('ವಿಳಾಸ', 'Address'),
            value: orgAddress,
            multiline: true,
        },
        ...(settings.phone ? [{
            icon: <Phone size={18} style={{ color: 'var(--pub-saffron)' }} />,
            label: t('ದೂರವಾಣಿ / ಫೋನ್', 'Phone'),
            value: settings.phone,
        }] : []),
        ...(settings.whatsapp ? [{
            icon: <MessageCircle size={18} style={{ color: 'var(--pub-saffron)' }} />,
            label: 'WhatsApp',
            value: settings.whatsapp,
        }] : []),
        {
            icon: <Clock size={18} style={{ color: 'var(--pub-saffron)' }} />,
            label: t('ದರ್ಶನ ಮತ್ತು ಕಾರ್ಯಾಲಯದ ಸಮಯ', 'Darshana & Office Timings'),
            value: t(
                'ಬೆಳಿಗ್ಗೆ ೬:೦೦ ರಿಂದ ಮಧ್ಯಾಹ್ನ ೧:೩೦\nಸಂಜೆ ೫:೩೦ ರಿಂದ ರಾತ್ರಿ ೮:೩೦',
                '6:00 AM to 1:30 PM\n5:30 PM to 8:30 PM'
            ),
            multiline: true,
        },
    ];

    return (
        <>
            {/* Page Header */}
            <section
                className="py-14 px-4 text-center"
                style={{ background: 'linear-gradient(135deg, var(--pub-hero-from), var(--pub-hero-to))' }}
            >
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3 border border-white/30 backdrop-blur-sm">
                        📍 {t('ಮಠದ ಮಾರ್ಗದರ್ಶಿ ಮತ್ತು ಸಂಪರ್ಕ', 'Directions & Contact')}
                    </div>
                    <h1
                        className="text-3xl md:text-4xl font-bold text-white mb-3"
                        style={{ fontFamily: 'var(--pub-font-heading)' }}
                    >
                        {t('ಸಂಪರ್ಕ ಹಾಗೂ ಸ್ಥಳದ ಮಾಹಿತಿ', 'Contact & Location Details')}
                    </h1>
                    <p className="text-white/80 text-sm max-w-lg mx-auto">
                        {t('ಮಠಕ್ಕೆ ಭೇಟಿ ನೀಡಲು ಮಾರ್ಗಸೂಚಿ, ಸ್ಥಳದ ನಕ್ಷೆ ಮತ್ತು ಅಧಿಕೃತ ಸಂಪರ್ಕ ವಿವರಗಳು.', 'Visit the Matha in person. Interactive location map, driving directions, and contact information.')}
                    </p>
                </motion.div>
            </section>

            <section className="py-14 px-4 md:px-8" style={{ background: 'var(--pub-bg)' }}>
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* LEFT COLUMN: Map & Temple Location Details (Replaces Send Message) */}
                    <motion.div 
                        variants={fadeUp} 
                        initial="hidden" 
                        whileInView="visible" 
                        viewport={{ once: true, amount: 0.1 }}
                        className="lg:col-span-7 space-y-6"
                    >
                        <div>
                            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                                <div>
                                    <h2
                                        className="text-xl md:text-2xl font-bold"
                                        style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                                    >
                                        🗺️ {t('ಸ್ಥಳದ ನಕ್ಷೆ (Temple Location Map)', 'Temple Location Map')}
                                    </h2>
                                    <p className="text-xs md:text-sm mt-0.5" style={{ color: 'var(--pub-text-muted)' }}>
                                        {t('ಮೈಸೂರಿನ ತೊಣಚಿಕೊಪ್ಪಲು (ಟಿ.ಕೆ. ಲೇಔಟ್) ನಲ್ಲಿರುವ ಶ್ರೀ ಮಠದ ನಕ್ಷೆ', 'Interactive map of Shri Matha at T.K. Layout, Mysuru')}
                                    </p>
                                </div>

                                <a
                                    href={googleMapsSearchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-transform hover:scale-105"
                                    style={{ background: 'var(--pub-saffron)' }}
                                >
                                    <Navigation size={13} />
                                    {t('ಗೂಗಲ್ ಮ್ಯಾಪ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ', 'Open in Google Maps')}
                                    <ExternalLink size={12} />
                                </a>
                            </div>

                            {/* Embedded Google Map iframe */}
                            <div 
                                className="rounded-3xl overflow-hidden border shadow-lg h-[340px] md:h-[380px] w-full relative bg-black/5"
                                style={{ borderColor: 'var(--pub-border)' }}
                            >
                                <iframe
                                    title="Sri Guru Raghavendra Swamy Matha Location"
                                    src={googleMapsEmbedUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={false}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </div>

                        {/* Location Details & How to Reach Cards */}
                        <div 
                            className="p-6 rounded-3xl border space-y-4"
                            style={{ background: 'var(--pub-bg-card)', borderColor: 'var(--pub-border)' }}
                        >
                            <h3 
                                className="text-base font-bold flex items-center gap-2"
                                style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                            >
                                <Compass size={18} className="text-[color:var(--pub-saffron)]" />
                                {t('ಮಠವನ್ನು ತಲುಪುವ ಮಾರ್ಗಸೂಚಿ ಮತ್ತು ವಿವರಗಳು', 'How to Reach & Location Details')}
                            </h3>

                            <div className="space-y-3 text-xs md:text-sm" style={{ color: 'var(--pub-text)' }}>
                                <div className="flex items-start gap-3">
                                    <MapPin size={16} className="text-[color:var(--pub-saffron)] shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold text-[var(--pub-ink)] block mb-0.5">
                                            {t('ಪ್ರಮುಖ ಗುರುತು (Landmark):', 'Landmark & Neighborhood:')}
                                        </span>
                                        <span>
                                            {t(
                                                'ತೊಣಚಿಕೊಪ್ಪಲು ಬಡಾವಣೆ ೪ ನೆಯ ಹಂತ, ಟಿ.ಕೆ. ಲೇಔಟ್ ಪೋಸ್ಟ್ ಆಫೀಸ್ ಹತ್ತಿರ, ಕುವೆಂಪುನಗರ ಸಮೀಪ.',
                                                'Tonachikoppal 4th Stage, Near T.K. Layout Post Office, Kuvempunagar area, Mysuru.'
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Bus size={16} className="text-[color:var(--pub-saffron)] shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold text-[var(--pub-ink)] block mb-0.5">
                                            {t('ಬಸ್ ಸಾರಿಗೆ (City Bus):', 'City Bus Transit:')}
                                        </span>
                                        <span>
                                            {t(
                                                'ಮೈಸೂರು ನಗರ ಬಸ್ ನಿಲ್ದಾಣದಿಂದ (CBS) ಟಿ.ಕೆ. ಲೇಔಟ್ / ತೊಣಚಿಕೊಪ್ಪಲು ಮಾರ್ಗದ ನೇರ ಬಸ್‌ಗಳು ಲಭ್ಯ (ಬಸ್ ನಿಲ್ದಾಣದಿಂದ ೫ ನಿಮಿಷ ನಡಿಗೆ).',
                                                'Direct city buses available from Mysuru Central City Bus Stand towards T.K. Layout / Tonachikoppalu (approx. 5 min walk from bus stop).'
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Train size={16} className="text-[color:var(--pub-saffron)] shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold text-[var(--pub-ink)] block mb-0.5">
                                            {t('ರೈಲು ನಿಲ್ದಾಣ (Railway Station):', 'Railway Station Proximity:')}
                                        </span>
                                        <span>
                                            {t(
                                                'ಮೈಸೂರು ಜಂಕ್ಷನ್ ರೈಲ್ವೆ ನಿಲ್ದಾಣದಿಂದ ಸುಮಾರು ೪.೫ ಕಿ.ಮೀ. ಆಟೋರಿಕ್ಷಾ ಅಥವಾ ಕ್ಯಾಬ್ ಮೂಲಕ ಸುಲಭವಾಗಿ ತಲುಪಬಹುದು.',
                                                'Approximately 4.5 km from Mysuru Junction Railway Station (12-15 minutes via auto-rickshaw or taxi).'
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: Contact Info & Bank/Donation Details */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        custom={0.15}
                        viewport={{ once: true, amount: 0.1 }}
                        className="lg:col-span-5 space-y-6"
                    >
                        <div>
                            <h2
                                className="text-xl md:text-2xl font-bold mb-4"
                                style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                            >
                                {orgName}
                            </h2>

                            <div className="flex flex-col gap-3.5">
                                {contactInfo.map((info) => (
                                    <div
                                        key={info.label}
                                        className="flex gap-3.5 p-4 rounded-2xl border"
                                        style={{ background: 'var(--pub-bg-card)', borderColor: 'var(--pub-border)' }}
                                    >
                                        <div className="shrink-0 mt-0.5">{info.icon}</div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold mb-1" style={{ color: 'var(--pub-text-muted)' }}>
                                                {info.label}
                                            </p>
                                            <p
                                                className="text-sm whitespace-pre-line font-medium leading-relaxed"
                                                style={{ color: 'var(--pub-ink)' }}
                                            >
                                                {info.value}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bank / UPI Details */}
                        {(settings.bankName || settings.upiVpa) && (
                            <div className="pt-2">
                                <h3
                                    className="text-base font-bold mb-3"
                                    style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                                >
                                    {t('ದಾನ ಮತ್ತು ಸೇವಾ ಸಮರ್ಪಣೆ ವಿವರಗಳು', 'Donation & Seva Account Details')}
                                </h3>
                                <div
                                    className="p-5 rounded-2xl border space-y-2.5"
                                    style={{ background: 'var(--pub-bg-card)', borderColor: 'var(--pub-border)' }}
                                >
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--pub-border)]">
                                        <CreditCard size={18} style={{ color: 'var(--pub-saffron)' }} />
                                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--pub-ink-light)' }}>
                                            {t('ಬ್ಯಾಂಕ್ ವಿವರಗಳು', 'Official Bank Details')}
                                        </span>
                                    </div>
                                    {settings.bankName && (
                                        <p className="text-sm font-semibold" style={{ color: 'var(--pub-text)' }}>{settings.bankName}</p>
                                    )}
                                    {settings.accountNumber && (
                                        <p className="text-sm font-mono" style={{ color: 'var(--pub-text)' }}>
                                            {t('ಖಾತೆ ಸಂಖ್ಯೆ:', 'Account No:')} <span className="font-bold">{settings.accountNumber}</span>
                                        </p>
                                    )}
                                    {settings.branchIfsc && (
                                        <p className="text-sm font-mono" style={{ color: 'var(--pub-text)' }}>
                                            IFSC: <span className="font-bold">{settings.branchIfsc}</span>
                                        </p>
                                    )}
                                    {settings.upiVpa && (
                                        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[var(--pub-border)]">
                                            <span className="text-xs md:text-sm font-mono font-bold" style={{ color: 'var(--pub-ink)' }}>
                                                UPI ID: {settings.upiVpa}
                                            </span>
                                            <button
                                                onClick={() => handleCopy(settings.upiVpa!)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/5"
                                                title="Copy UPI ID"
                                                style={{ borderColor: 'var(--pub-border)', color: 'var(--pub-saffron)' }}
                                            >
                                                {copied ? <Check size={13} /> : <Copy size={13} />}
                                                {copied ? t('ನಕಲಿಸಲಾಗಿದೆ', 'Copied') : t('ಕಾಪಿ', 'Copy')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>
        </>
    );
}
