import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
    contentBounded?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-lg',
    contentBounded = true
}: ModalProps) {
    const containerClasses = contentBounded
        ? "fixed inset-0 top-[5.5rem] lg:left-72 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-30 overflow-y-auto"
        : "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 py-8 sm:py-12 z-[100] overflow-y-auto";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={containerClasses}
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={`glass-card ${maxWidth} w-full p-6 sm:p-8 relative max-h-[calc(100vh-7.5rem)] overflow-y-auto shadow-2xl border border-[var(--glass-border)] rounded-2xl`}
                    >
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--glass-border)] sticky top-0 bg-[var(--glass-bg)] z-10 backdrop-blur-md">
                            <h3 className="text-xl sm:text-2xl font-bold text-[var(--primary)]">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                                title="ಮುಚ್ಚಿ / Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
