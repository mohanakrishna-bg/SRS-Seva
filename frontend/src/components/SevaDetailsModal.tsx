import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, Trash2, HeartHandshake } from 'lucide-react';
import SevaForm from './SevaForm';

interface SevaItem {
    SevaCode: string;
    Description: string;
    DescriptionEn?: string;
    Amount: number;
    TPQty: number;
    PrasadaAddonLimit?: number;
    IsSpecialEvent?: boolean;
    EventDate?: string;
    StartTime?: string;
    EndTime?: string;
    IsAllDay?: boolean;
    RecurrenceRule?: string;
}

interface SevaDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    seva: SevaItem | null;
    onSave: (d: SevaItem) => Promise<void>;
    onDelete: (d: SevaItem) => void;
    existingSevas: SevaItem[];
}

export default function SevaDetailsModal({ isOpen, onClose, seva, onSave, onDelete, existingSevas }: SevaDetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false);

    if (!seva) return null;

    const handleClose = () => {
        setIsEditing(false);
        onClose();
    };

    const details = [
        { label: 'ವಿವರಣೆ (Kannada)', value: seva.Description },
        { label: 'Description (English)', value: seva.DescriptionEn },
        { label: 'ಶುಲ್ಕ (Amount)', value: seva.Amount > 0 ? `₹${seva.Amount.toLocaleString()}` : 'ಉಚಿತ' },
        { label: 'ಪ್ರಸಾದ (TPQty)', value: (seva.TPQty ?? 0) > 0 ? `${seva.TPQty} ಜನರಿಗೆ` : '—' },
        { label: 'ಹೆಚ್ಚುವರಿ ಪ್ರಸಾದ ಮಿತಿ', value: seva.PrasadaAddonLimit || '—' },
    ].filter(d => d.value !== undefined);

    if (seva.IsSpecialEvent) {
        details.push({ label: 'ದಿನಾಂಕ', value: seva.EventDate || '—' });
        if (!seva.IsAllDay) {
            details.push({ label: 'ಸಮಯ', value: `${seva.StartTime || ''} - ${seva.EndTime || ''}` });
        }
        details.push({ label: 'Recurrence', value: seva.RecurrenceRule || '—' });
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-[var(--glass-border)] flex flex-col max-h-[85vh]"
                    >
                        {isEditing ? (
                            <div className="flex flex-col h-full">
                                <div className="bg-gradient-to-r from-[var(--primary)] to-amber-500 p-6 sm:p-8 text-white relative shrink-0">
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 rounded-full hover:bg-white/20 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">ಸೇವೆ ಬದಲಿಸಿ</h2>
                                </div>
                                <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                                    <SevaForm
                                        isOpen={true}
                                        onClose={() => setIsEditing(false)}
                                        onSubmit={async (data) => {
                                            await onSave(data);
                                            setIsEditing(false);
                                        }}
                                        initialData={seva}
                                        isEdit={true}
                                        existingSevas={existingSevas}
                                        title=""
                                        inline={true}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="bg-gradient-to-r from-[var(--primary)] to-amber-500 p-6 sm:p-8 text-white relative shrink-0">
                                    <button 
                                        onClick={handleClose}
                                        className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 rounded-full hover:bg-white/20 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                    <div className="flex items-center gap-4 sm:gap-6">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30 text-white shadow-xl shrink-0">
                                            <HeartHandshake size={32} className="sm:w-10 sm:h-10" />
                                        </div>
                                        <div className="overflow-hidden pr-8">
                                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{seva.Description}</h2>
                                            <p className="text-white/80 text-sm sm:text-base font-medium mt-1 font-mono">#{seva.SevaCode}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50/50 dark:bg-black/10 flex-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        {details.map((d, i) => (
                                            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm space-y-1.5">
                                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">{d.label}</p>
                                                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                                                    <span className="text-sm sm:text-base font-semibold break-words">{d.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-5 sm:p-6 bg-slate-50 dark:bg-black/20 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-2 justify-between shrink-0">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 transition-all"
                                        >
                                            <Edit3 size={16} /> ಬದಲಿಸಿ
                                        </button>
                                        <button
                                            onClick={() => {
                                                onDelete(seva);
                                                handleClose();
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 size={16} /> ಅಳಿಸಿ
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="px-6 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
                                    >
                                        ಮುಚ್ಚಿ (Close)
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
