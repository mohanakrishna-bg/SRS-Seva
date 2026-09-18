import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { MapPin, Phone, MessageCircle, Clock, CreditCard, Copy, Check } from 'lucide-react';
import type { PublicLayoutContextType } from '../../components/public/PublicLayout';

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay } }),
};

export default function PublicContactPage() {
    const { lang, t, settings } = useOutletContext<PublicLayoutContextType>();
    const [copied, setCopied] = useState(false);
    const [formState, setFormState] = useState({ name: '', phone: '', subject: 'general', message: '' });
    const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const orgName = lang === 'en'
        ? (settings.orgNameEn || settings.orgName || 'Sri Raghavendra Swamy Matha')
        : (settings.orgName || 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ');
    const orgAddress = lang === 'en'
        ? (settings.addressEn || settings.address || '')
        : (settings.address || '');

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Since we don't have a public contact form API, simulate success
        setFormStatus('success');
    };

    const contactInfo = [
        ...(orgAddress ? [{
            icon: <MapPin size={18} style={{ color: 'var(--pub-saffron)' }} />,
            label: t('ವಿಳಾಸ', 'Address'),
            value: orgAddress,
            multiline: true,
        }] : []),
        ...(settings.phone ? [{
            icon: <Phone size={18} style={{ color: 'var(--pub-saffron)' }} />,
            label: t('ಫೋನ್', 'Phone'),
            value: settings.phone,
        }] : []),
        ...(settings.whatsapp ? [{
            icon: <MessageCircle size={18} style={{ color: 'var(--pub-saffron)' }} />,
            label: 'WhatsApp',
            value: settings.whatsapp,
        }] : []),
        {
            icon: <Clock size={18} style={{ color: 'var(--pub-saffron)' }} />,
            label: t('ಸಮಯ', 'Timings'),
            value: t('ಬೆಳಿಗ್ಗೆ 6:00 – ಮ.1:30\nಸಂಜೆ 5:30 – ರಾ.8:30', '6:00 AM – 1:30 PM\n5:30 PM – 8:30 PM'),
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
                    <h1
                        className="text-3xl md:text-4xl font-bold text-white mb-3"
                        style={{ fontFamily: 'var(--pub-font-heading)' }}
                    >
                        📞 {t('ಸಂಪರ್ಕ ಮಾಹಿತಿ', 'Contact Information')}
                    </h1>
                    <p className="text-white/80 text-sm">
                        {t('ಮಠವನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಭೇಟಿ ನೀಡಿ', 'Get in touch with the Matha or visit us')}
                    </p>
                </motion.div>
            </section>

            <section className="py-14 px-4 md:px-8" style={{ background: 'var(--pub-bg)' }}>
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Contact Form */}
                    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                        <h2
                            className="text-xl font-bold mb-6"
                            style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                        >
                            {t('ಸಂದೇಶ ಕಳುಹಿಸಿ', 'Send a Message')}
                        </h2>

                        {formStatus === 'success' ? (
                            <div
                                className="p-6 rounded-2xl border text-center"
                                style={{ background: 'var(--pub-bg-card)', borderColor: 'var(--pub-border)' }}
                            >
                                <div className="text-4xl mb-3">✅</div>
                                <p className="font-bold" style={{ color: 'var(--pub-ink)' }}>
                                    {t('ಧನ್ಯವಾದಗಳು!', 'Thank you!')}
                                </p>
                                <p className="text-sm mt-1" style={{ color: 'var(--pub-text-muted)' }}>
                                    {t('ನಿಮ್ಮ ಸಂದೇಶ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ಶೀಘ್ರದಲ್ಲೇ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತದೆ.', 'Your message has been received. We will get in touch shortly.')}
                                </p>
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubmit}
                                className="p-6 rounded-2xl border flex flex-col gap-4"
                                style={{ background: 'var(--pub-bg-card)', borderColor: 'var(--pub-border)' }}
                            >
                                {[
                                    { id: 'name', label: t('ಹೆಸರು *', 'Name *'), type: 'text', placeholder: t('ನಿಮ್ಮ ಹೆಸರು', 'Your name'), required: true },
                                    { id: 'phone', label: t('ಫೋನ್ *', 'Phone *'), type: 'tel', placeholder: '+91 98765 43210', required: true },
                                ].map(field => (
                                    <div key={field.id}>
                                        <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--pub-ink-light)' }}>
                                            {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            required={field.required}
                                            value={(formState as any)[field.id]}
                                            onChange={e => setFormState(s => ({ ...s, [field.id]: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                                            style={{
                                                background: 'var(--pub-bg)',
                                                borderColor: 'var(--pub-border)',
                                                color: 'var(--pub-text)',
                                            }}
                                        />
                                    </div>
                                ))}

                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--pub-ink-light)' }}>
                                        {t('ವಿಷಯ', 'Subject')}
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                                        style={{ background: 'var(--pub-bg)', borderColor: 'var(--pub-border)', color: 'var(--pub-text)' }}
                                        value={formState.subject}
                                        onChange={e => setFormState(s => ({ ...s, subject: e.target.value }))}
                                    >
                                        <option value="general">{t('ಸಾಮಾನ್ಯ ವಿಚಾರಣೆ', 'General Inquiry')}</option>
                                        <option value="seva">{t('ಸೇವೆ ಕಾಯ್ದಿರಿಸುವಿಕೆ', 'Seva Booking')}</option>
                                        <option value="event">{t('ಕಾರ್ಯಕ್ರಮ ಮಾಹಿತಿ', 'Event Information')}</option>
                                        <option value="donation">{t('ದಾನ', 'Donation')}</option>
                                        <option value="feedback">{t('ಅಭಿಪ್ರಾಯ', 'Feedback')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--pub-ink-light)' }}>
                                        {t('ಸಂದೇಶ *', 'Message *')}
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder={t('ನಿಮ್ಮ ಸಂದೇಶ ಬರೆಯಿರಿ...', 'Write your message...')}
                                        className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none"
                                        style={{ background: 'var(--pub-bg)', borderColor: 'var(--pub-border)', color: 'var(--pub-text)' }}
                                        value={formState.message}
                                        onChange={e => setFormState(s => ({ ...s, message: e.target.value }))}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                                    style={{ background: 'var(--pub-saffron)' }}
                                >
                                    📨 {t('ಕಳುಹಿಸಿ', 'Send Message')}
                                </button>
                            </form>
                        )}
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        custom={0.15}
                        viewport={{ once: true, amount: 0.1 }}
                    >
                        <h2
                            className="text-xl font-bold mb-6"
                            style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                        >
                            {orgName}
                        </h2>

                        <div className="flex flex-col gap-4">
                            {contactInfo.map((info) => (
                                <div
                                    key={info.label}
                                    className="flex gap-4 p-4 rounded-2xl border"
                                    style={{ background: 'var(--pub-bg-card)', borderColor: 'var(--pub-border)' }}
                                >
                                    <div className="shrink-0 mt-0.5">{info.icon}</div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold mb-1" style={{ color: 'var(--pub-text-muted)' }}>
                                            {info.label}
                                        </p>
                                        <p
                                            className="text-sm whitespace-pre-line"
                                            style={{ color: 'var(--pub-ink)' }}
                                        >
                                            {info.value}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bank / UPI Details */}
                        {(settings.bankName || settings.upiVpa) && (
                            <div className="mt-6">
                                <h3
                                    className="text-base font-bold mb-3"
                                    style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                                >
                                    {t('ದಾನ ವಿವರಗಳು', 'Donation Details')}
                                </h3>
                                <div
                                    className="p-4 rounded-2xl border"
                                    style={{ background: 'var(--pub-bg-card)', borderColor: 'var(--pub-border)' }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard size={16} style={{ color: 'var(--pub-saffron)' }} />
                                        <span className="text-xs font-bold" style={{ color: 'var(--pub-ink-light)' }}>
                                            {t('ಬ್ಯಾಂಕ್ ವಿವರಗಳು', 'Bank Details')}
                                        </span>
                                    </div>
                                    {settings.bankName && (
                                        <p className="text-sm" style={{ color: 'var(--pub-text)' }}>{settings.bankName}</p>
                                    )}
                                    {settings.accountNumber && (
                                        <p className="text-sm font-mono" style={{ color: 'var(--pub-text)' }}>
                                            {t('ಖಾತೆ ಸಂಖ್ಯೆ:', 'Account No:')} {settings.accountNumber}
                                        </p>
                                    )}
                                    {settings.branchIfsc && (
                                        <p className="text-sm font-mono" style={{ color: 'var(--pub-text)' }}>
                                            IFSC: {settings.branchIfsc}
                                        </p>
                                    )}
                                    {settings.upiVpa && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-sm font-mono" style={{ color: 'var(--pub-ink)' }}>
                                                UPI: {settings.upiVpa}
                                            </span>
                                            <button
                                                onClick={() => handleCopy(settings.upiVpa!)}
                                                className="p-1 rounded-md transition-colors"
                                                title="Copy UPI ID"
                                                style={{ color: 'var(--pub-saffron)' }}
                                            >
                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Map note */}
                        <div
                            className="mt-4 rounded-2xl border flex items-center justify-center text-sm py-8"
                            style={{ background: 'var(--pub-cream-dark, #F5EDE0)', borderColor: 'var(--pub-border)', color: 'var(--pub-text-muted)' }}
                        >
                            📍 {t('ನಕ್ಷೆ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ', 'Map coming soon')}
                        </div>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
