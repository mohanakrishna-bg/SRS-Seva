/**
 * OverflowMenu — kebab / ellipsis action menu.
 * Elevates the primary action and hides secondary/destructive ones.
 */
import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface OverflowMenuItem {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
}

interface OverflowMenuProps {
    items: OverflowMenuItem[];
    /** aria-label for the trigger button */
    label?: string;
}

export default function OverflowMenu({ items, label = 'More actions' }: OverflowMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click or Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onClick);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onClick);
        };
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                aria-label={label}
                aria-expanded={open}
                aria-haspopup="menu"
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
                <MoreVertical size={16} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="menu"
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="
                            absolute right-0 top-full mt-1.5 z-50 min-w-[180px]
                            bg-[var(--glass-card-bg)] border border-[var(--glass-border)]
                            rounded-xl shadow-xl backdrop-blur-xl overflow-hidden py-1
                        "
                    >
                        {items.map((item, i) => {
                            const Icon = item.icon;
                            const isDanger = item.variant === 'danger';
                            return (
                                <button
                                    key={i}
                                    role="menuitem"
                                    disabled={item.disabled}
                                    onClick={() => { item.onClick(); setOpen(false); }}
                                    className={`
                                        w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-left
                                        transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                                        ${isDanger
                                            ? 'text-red-500 hover:bg-red-500/10'
                                            : 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/8'}
                                    `}
                                >
                                    {Icon && <Icon size={14} className="shrink-0" />}
                                    {item.label}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
