import { useState } from 'react';
import Modal from './Modal';
import { Printer } from 'lucide-react';

interface PrintConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPrint: (itemsPerPage: number) => void;
    totalItems: number;
    defaultPageSize?: number;
    title?: string;
}

const PRINT_PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 50, 100];

export default function PrintConfigModal({
    isOpen,
    onClose,
    onPrint,
    totalItems,
    defaultPageSize = 10,
    title = 'ಮುದ್ರಣ ಸಂರಚನೆ (Print Options)'
}: PrintConfigModalProps) {
    const [selectedSize, setSelectedSize] = useState<number>(defaultPageSize);

    const handleConfirm = () => {
        onPrint(selectedSize);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
            <div className="space-y-5">
                <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                        ಪ್ರತಿ ಪುಟಕ್ಕೆ ಮುದ್ರಿಸಬೇಕಾದ ದಾಖಲೆಗಳ ಸಂಖ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ (Select rows per page to print):
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {PRINT_PAGE_SIZE_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => setSelectedSize(opt)}
                                className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                                    selectedSize === opt
                                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                                        : 'bg-white dark:bg-black/20 text-[var(--text-primary)] border-black/10 dark:border-white/10 hover:border-[var(--primary)]/50'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-[var(--text-secondary)] flex justify-between items-center">
                    <span>ಒಟ್ಟು ದಾಖಲೆಗಳು (Total records):</span>
                    <span className="font-bold text-[var(--text-primary)]">{totalItems}</span>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--glass-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] transition-colors"
                    >
                        ರದ್ದುಮಾಡಿ (Cancel)
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-bold shadow-md hover:shadow-orange-500/20 flex items-center gap-2 transition-all"
                    >
                        <Printer size={16} /> ಮುದ್ರಿಸಿ (Print)
                    </button>
                </div>
            </div>
        </Modal>
    );
}
