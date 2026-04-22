import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

interface ContextHelpProps {
    title: string;
    content: string;
}

export default function ContextHelp({ title, content }: ContextHelpProps) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX
            });
        }
    };

    const handleEnter = () => {
        updateCoords();
        setOpen(true);
    };

    return (
        <div className="inline-block ml-1 leading-none">
            <button 
                ref={triggerRef}
                type="button"
                onMouseEnter={handleEnter}
                onMouseLeave={() => setOpen(false)}
                onClick={(e) => { e.stopPropagation(); handleEnter(); }}
                className="text-[var(--text-secondary)] opacity-60 hover:opacity-100 hover:text-emerald-500 transition-all focus:outline-none cursor-help"
            >
                <HelpCircle size={14} />
            </button>
            {open && coords && createPortal(
                <div 
                    data-help-active="true"
                    className="fixed z-[9999] w-64 p-3 bg-slate-900 text-white rounded-xl shadow-2xl text-[11px] leading-relaxed border border-emerald-500/30 backdrop-blur-lg pointer-events-none"
                    style={{ 
                        top: coords.top - 8, 
                        left: Math.max(10, Math.min(coords.left, window.innerWidth - 270)), 
                        transform: 'translateY(-100%)' 
                    }}
                >
                    <p className="font-bold mb-1.5 text-emerald-400 uppercase tracking-wider">{title}</p>
                    <p className="opacity-90 font-medium">{content}</p>
                    <div className="absolute top-full left-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900" />
                </div>,
                document.body
            )}
        </div>
    );
}
