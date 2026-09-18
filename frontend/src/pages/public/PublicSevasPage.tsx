import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import type { PublicLayoutContextType } from '../../components/public/PublicLayout';

interface SevaItem {
    SevaCode: string;
    Description: string;
    DescriptionEn?: string;
    Amount: number;
    TPQty: number;
}

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay } }),
};

export default function PublicSevasPage() {
    const { lang, t } = useOutletContext<PublicLayoutContextType>();
    const [sevas, setSevas] = useState<SevaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetch('/api/sevas')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load sevas');
                return res.json();
            })
            .then(data => setSevas(Array.isArray(data) ? data : []))
            .catch(() => setSevas([]))
            .finally(() => setLoading(false));
    }, []);

    const filteredSevas = sevas.filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (s.Description || '').toLowerCase().includes(q) ||
            (s.DescriptionEn || '').toLowerCase().includes(q) ||
            (s.SevaCode || '').toLowerCase().includes(q)
        );
    });

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
                        🪔 {t('ಸೇವೆಗಳು ಮತ್ತು ಪ್ರಸಾದ', 'Sevas & Prasada')}
                    </h1>
                    <p className="text-white/80 text-sm">
                        {t('ಮಠದಲ್ಲಿ ಲಭ್ಯವಿರುವ ಸೇವೆಗಳ ಸಂಪೂರ್ಣ ಪಟ್ಟಿ', 'Complete list of sevas available at the Matha')}
                    </p>
                </motion.div>
            </section>

            <section className="py-12 px-4 md:px-8" style={{ background: 'var(--pub-bg)' }}>
                <div className="max-w-5xl mx-auto">
                    {/* Search */}
                    <div className="relative mb-8">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--pub-text-muted)' }} />
                        <input
                            type="text"
                            placeholder={t('ಸೇವೆಗಳನ್ನು ಹುಡುಕಿ...', 'Search sevas...')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border text-sm outline-none transition-all"
                            style={{
                                background: 'var(--pub-bg-card)',
                                borderColor: 'var(--pub-border)',
                                color: 'var(--pub-text)',
                            }}
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--pub-saffron)' }} />
                        </div>
                    ) : filteredSevas.length === 0 ? (
                        <div className="text-center py-12" style={{ color: 'var(--pub-text-muted)' }}>
                            {searchQuery
                                ? t(`"${searchQuery}" ಗೆ ಸೇವೆಗಳಿಲ್ಲ`, `No sevas found for "${searchQuery}"`)
                                : t('ಸೇವೆಗಳು ಲಭ್ಯವಿಲ್ಲ', 'No sevas available')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredSevas.map((seva, i) => (
                                <motion.div
                                    key={seva.SevaCode}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    custom={i * 0.03}
                                    viewport={{ once: true, amount: 0.1 }}
                                    className="rounded-2xl p-5 border flex flex-col gap-2 transition-all hover:-translate-y-0.5"
                                    style={{
                                        background: 'var(--pub-bg-card)',
                                        borderColor: 'var(--pub-border)',
                                        boxShadow: 'var(--pub-shadow)',
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className="text-xs font-mono px-2 py-0.5 rounded-full"
                                                    style={{ background: 'var(--pub-saffron)', color: 'white', fontSize: '0.65rem' }}
                                                >
                                                    {seva.SevaCode}
                                                </span>
                                            </div>
                                            <h3
                                                className="font-bold text-base"
                                                style={{ color: 'var(--pub-ink)', fontFamily: 'var(--pub-font-heading)' }}
                                            >
                                                {lang === 'en' ? (seva.DescriptionEn || seva.Description) : (seva.Description || seva.DescriptionEn)}
                                            </h3>
                                            {lang === 'kn' && seva.DescriptionEn && (
                                                <p className="text-xs" style={{ color: 'var(--pub-text-muted)' }}>
                                                    {seva.DescriptionEn}
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            {seva.Amount > 0 ? (
                                                <span
                                                    className="text-lg font-bold"
                                                    style={{ color: 'var(--pub-saffron)' }}
                                                >
                                                    ₹{seva.Amount}
                                                </span>
                                            ) : (
                                                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--pub-gold-light, #E8C96A)', color: 'var(--pub-maroon)' }}>
                                                    {t('ಯಥಾಶಕ್ತಿ', 'Variable')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {seva.TPQty > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--pub-text-muted)' }}>
                                            <span>🍚</span>
                                            <span>{t(`ತೀರ್ಥ ಪ್ರಸಾದ: ${seva.TPQty}`, `Tirtha Prasada Qty: ${seva.TPQty}`)}</span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Note */}
                    <div className="mt-10 text-center text-sm" style={{ color: 'var(--pub-text-muted)' }}>
                        <p>
                            {t(
                                'ಸೇವೆ ಕಾಯ್ದಿರಿಸಲು ಮಠಕ್ಕೆ ಸಂಪರ್ಕಿಸಿ.',
                                'To book a seva, please contact the Matha directly.'
                            )}
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
