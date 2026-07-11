import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlideOverPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
    hideCloseButton?: boolean;
}

export default function SlideOverPanel({
    isOpen,
    onClose,
    title,
    children,
    width = '2xl',
    hideCloseButton = false,
}: SlideOverPanelProps) {
    // Prevent background scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const widthClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        full: 'max-w-full',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={onClose}
                    />

                    {/* Sliding Panel */}
                    <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`w-screen ${widthClasses[width]}`}
                        >
                            <div className="flex h-full flex-col bg-[var(--bg-dark)] shadow-2xl border-l border-[var(--glass-border)]">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md">
                                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                        {title}
                                    </h2>
                                    {!hideCloseButton && (
                                        <button
                                            onClick={onClose}
                                            className="rounded-full p-2 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-rose-500 transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="relative flex-1 overflow-y-auto p-6 bg-[var(--bg-dark)]">
                                    {children}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
