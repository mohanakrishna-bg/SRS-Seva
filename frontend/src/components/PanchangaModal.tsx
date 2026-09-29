import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download, BookOpen, ChevronRight, FileText } from 'lucide-react';
import { getPanchangaMetadata, getPanchangaTableOfContents } from '../services/panchangaService';

interface PanchangaModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPage?: number;
    initialSectionTitle?: string;
}

export default function PanchangaModal({
    isOpen,
    onClose,
    initialPage = 1,
    initialSectionTitle = '',
}: PanchangaModalProps) {
    const metadata = getPanchangaMetadata();
    const toc = getPanchangaTableOfContents();
    const [activePage, setActivePage] = useState<number>(initialPage || 1);

    useEffect(() => {
        if (initialPage) {
            setActivePage(initialPage);
        }
    }, [initialPage, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const pdfUrl = metadata.pdfUrl || '/documents/panchanga_parabhava_2026_27.pdf';
    const iframeSrc = `${pdfUrl}#page=${activePage}`;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    transition={{ duration: 0.25 }}
                    className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-[var(--bg-surface)] dark:bg-slate-900 border border-[var(--glass-border)] rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-b border-[var(--glass-border)] shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                                <BookOpen size={20} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] truncate">
                                        {metadata.titleKn}
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm">
                                        ಅಧಿಕೃತ ಪಿಡಿಎಫ್
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] truncate">
                                    {metadata.publisher} · ಶಕ {metadata.shakaYear} (ಕಲಿ {metadata.kaliYear})
                                    {initialSectionTitle ? ` · ${initialSectionTitle}` : ''}
                                </p>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => window.open(`${pdfUrl}#page=${activePage}`, '_blank')}
                                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--glass-border)] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold text-[var(--text-primary)] transition-all shadow-sm"
                                title="ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ"
                            >
                                <ExternalLink size={13} />
                                <span>ಹೊಸ ಟ್ಯಾಬ್</span>
                            </button>

                            <a
                                href={pdfUrl}
                                download="srs_surya_siddhanta_panchanga_2026_27.pdf"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg"
                                title="ಪಂಚಾಂಗ ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ"
                            >
                                <Download size={13} />
                                <span className="hidden sm:inline">ಡೌನ್‌ಲೋಡ್</span>
                            </a>

                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                title="ಮುಚ್ಚಿ"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Section Navigation Bar */}
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-black/[0.02] dark:bg-white/[0.02] border-b border-[var(--glass-border)] overflow-x-auto no-scrollbar shrink-0 text-xs">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] shrink-0 flex items-center gap-1 mr-1">
                            <FileText size={12} className="text-amber-500" />
                            ವಿಭಾಗಗಳು:
                        </span>

                        {initialPage > 1 && (
                            <button
                                onClick={() => setActivePage(initialPage)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                                    activePage === initialPage
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'bg-black/5 dark:bg-white/5 text-[var(--text-primary)] hover:bg-orange-500/10'
                                }`}
                            >
                                ಈ ದಿನದ ಪುಟ ({initialPage})
                            </button>
                        )}

                        <button
                            onClick={() => setActivePage(6)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                                activePage === 6
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-black/5 dark:bg-white/5 text-[var(--text-primary)] hover:bg-orange-500/10'
                            }`}
                        >
                            ರಾಯರ ಆರಾಧನೆ (6)
                        </button>

                        {toc.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.page)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                                    activePage === item.page
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'bg-black/5 dark:bg-white/5 text-[var(--text-primary)] hover:bg-orange-500/10'
                                }`}
                                title={item.titleEn}
                            >
                                {item.titleKn} ({item.page})
                            </button>
                        ))}
                    </div>

                    {/* PDF Viewer Frame */}
                    <div className="flex-1 w-full h-full relative bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
                        <iframe
                            key={activePage}
                            src={iframeSrc}
                            className="w-full h-full border-0"
                            title="ಶ್ರೀ ಪರಾಭವ ನಾಮ ಸಂವತ್ಸರ ಸೂರ್ಯಸಿದ್ಧಾಂತ ಪಂಚಾಂಗ"
                        />

                        {/* Fallback overlay / hint */}
                        <div className="absolute bottom-3 right-3 z-10 hidden sm:flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[11px] font-semibold border border-white/20 shadow-xl pointer-events-auto">
                            <span>ಪುಟ {activePage} / 57</span>
                            <span className="text-white/40">|</span>
                            <a
                                href={`${pdfUrl}#page=${activePage}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-300 hover:text-amber-200 underline inline-flex items-center gap-1"
                            >
                                ಪೂರ್ಣ ತೆರೆ <ChevronRight size={11} />
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
