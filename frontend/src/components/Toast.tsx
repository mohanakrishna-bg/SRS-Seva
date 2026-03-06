import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastItem {
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastItem['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => { } });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((type: ToastItem['type'], message: string) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, message }]);
    }, []);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const icons = {
        success: <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />,
        error: <AlertCircle size={20} className="text-red-400 shrink-0" />,
        info: <Info size={20} className="text-sky-400 shrink-0" />,
    };

    const borders = {
        success: 'border-emerald-500/30',
        error: 'border-red-500/30',
        info: 'border-sky-500/30',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl bg-[#1e293b]/95 backdrop-blur-xl border ${borders[toast.type]} shadow-2xl`}
        >
            {icons[toast.type]}
            <p className="text-sm text-slate-200 flex-1 leading-snug">{toast.message}</p>
            <button onClick={() => onDismiss(toast.id)} className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 mt-0.5">
                <X size={14} />
            </button>
        </motion.div>
    );
}
