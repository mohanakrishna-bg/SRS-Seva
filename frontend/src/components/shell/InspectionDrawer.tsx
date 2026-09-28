/**
 * InspectionDrawer — collapsible right-side panel.
 * Slides in from the right; overlays content (does not push).
 * On mobile: full-width with a backdrop.
 */
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface InspectionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    /** Tailwind width class, default 'w-96' */
    width?: string;
}

export default function InspectionDrawer({
    isOpen,
    onClose,
    title,
    children,
    width = 'w-96',
}: InspectionDrawerProps) {
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop (mobile only) */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm print:hidden"
                    />

                    {/* Drawer Panel */}
                    <motion.aside
                        key="drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        className={`
                            fixed top-0 right-0 h-full z-40 ${width}
                            bg-[var(--glass-card-bg)] border-l border-[var(--glass-border)]
                            backdrop-blur-xl shadow-2xl flex flex-col
                            print:hidden
                        `}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--glass-border)] shrink-0">
                            <span className="font-semibold text-sm text-[var(--text-primary)]">{title}</span>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                aria-label="Close panel"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
