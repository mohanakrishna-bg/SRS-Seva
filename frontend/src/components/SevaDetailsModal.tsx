import { useState } from 'react';
import { Edit3, Trash2, HeartHandshake, ArrowLeft } from 'lucide-react';
import Modal from './Modal';
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
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEditing ? 'ಸೇವೆ ಬದಲಿಸಿ (Edit Seva)' : (seva.Description || 'ಸೇವಾ ವಿವರ (Seva Details)')}
            maxWidth="max-w-2xl"
            contentBounded={true}
            isLocked={true}
        >
            {isEditing ? (
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
            ) : (
                <div className="space-y-6">
                    {/* Header Summary */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)]">
                        <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/20 shrink-0">
                            <HeartHandshake size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-bold text-[var(--text-primary)] truncate">{seva.Description}</h4>
                            <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
                                #{seva.SevaCode} {seva.DescriptionEn ? `• ${seva.DescriptionEn}` : ''}
                            </p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
                        {details.map((d, i) => (
                            <div key={i} className="p-3.5 rounded-xl bg-white dark:bg-black/20 border border-black/5 dark:border-white/10 space-y-1">
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{d.label}</p>
                                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                                    <span className="text-sm font-semibold break-words">{d.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons: Edit, Delete, Return to list view */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--glass-border)]">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] border border-black/10 dark:border-white/10 transition-colors"
                        >
                            <ArrowLeft size={16} /> ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ (Back to List)
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-sm font-bold transition-all border border-blue-500/20"
                            >
                                <Edit3 size={15} /> ಬದಲಿಸಿ (Edit)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onDelete(seva);
                                    handleClose();
                                }}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-sm font-bold transition-all border border-red-500/20"
                            >
                                <Trash2 size={15} /> ಅಳಿಸಿ (Delete)
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-bold shadow-md hover:shadow-orange-500/20 transition-all"
                            >
                                ಮುಚ್ಚಿ (Close)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}

