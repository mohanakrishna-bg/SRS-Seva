import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplitPaneLayoutProps {
    masterContent: React.ReactNode;
    detailContent: React.ReactNode;
    showDetailOnMobile: boolean;
    onBackToMaster?: () => void;
}

export default function SplitPaneLayout({
    masterContent,
    detailContent,
    showDetailOnMobile,
    onBackToMaster,
}: SplitPaneLayoutProps) {
    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Master Pane (List View) */}
            <div
                className={`flex-shrink-0 w-full lg:w-1/3 xl:w-1/4 h-full border-r border-[var(--glass-border)] bg-[var(--bg-dark)] ${
                    showDetailOnMobile ? 'hidden lg:block' : 'block'
                }`}
            >
                {masterContent}
            </div>

            {/* Detail Pane */}
            <div
                className={`flex-1 h-full bg-[var(--bg-dark)] relative ${
                    !showDetailOnMobile ? 'hidden lg:block' : 'block'
                }`}
            >
                {/* Mobile Back Button */}
                {showDetailOnMobile && onBackToMaster && (
                    <div className="lg:hidden p-4 border-b border-[var(--glass-border)] flex items-center bg-[var(--glass-bg)] backdrop-blur-md">
                        <button
                            onClick={onBackToMaster}
                            className="flex items-center text-[var(--primary)] font-medium hover:underline"
                        >
                            <span className="mr-2">←</span> Back to List
                        </button>
                    </div>
                )}
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={showDetailOnMobile ? 'mobile' : 'desktop'}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full overflow-y-auto"
                    >
                        {detailContent}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
