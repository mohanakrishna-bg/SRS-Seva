import React, { useState } from 'react';
import Modal from './Modal';
import TransliteratedInput from './TransliteratedInput';
import GlobalInputToolbar from './GlobalInputToolbar';

interface SevaFormData {
    SevaCode: string;
    Description: string;
    DescriptionEn?: string;
    Amount: number;
    TPQty: number;
    PrasadaAddonLimit: number;
}

interface SevaFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SevaFormData) => void;
    initialData?: Partial<SevaFormData>;
    title?: string;
    isEdit?: boolean;
}

const emptyForm: SevaFormData = {
    SevaCode: '',
    Description: '',
    DescriptionEn: '',
    Amount: 0,
    TPQty: 0,
    PrasadaAddonLimit: 0,
};

export default function SevaForm({ isOpen, onClose, onSubmit, initialData, title = 'ಹೊಸ ಸೇವೆ ಸೇರಿಸಿ', isEdit = false }: SevaFormProps) {
    const [form, setForm] = useState<SevaFormData>({ ...emptyForm, ...initialData });

    const handleChange = (key: keyof SevaFormData, value: string | number) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.Description.trim()) return;
        onSubmit(form);
    };

    React.useEffect(() => {
        if (isOpen) {
            setForm({ ...emptyForm, ...initialData });
        }
    }, [isOpen, initialData]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-xl">
            <div className="mb-4 flex justify-end">
                <GlobalInputToolbar />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    {/* Description - Kannada (Transliteratable) */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                            ಸೇವೆಯ ವಿವರಣೆ (Description - Kannada)
                        </label>
                        <TransliteratedInput
                            value={form.Description}
                            onChange={(val) => handleChange('Description', val)}
                            placeholder="ಸೇವೆಯ ಹೆಸರು"
                            enableVoice={true}
                            disableTransliteration={false}
                        />
                    </div>

                    {/* Description - English */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                            Description (English)
                        </label>
                        <input
                            type="text"
                            value={form.DescriptionEn || ''}
                            onChange={(e) => handleChange('DescriptionEn', e.target.value)}
                            placeholder="Seva Description in English"
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Seva Code - Only for new or show as read-only for edit */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                ಸೇವಾ ಕೋಡ್ (Seva Code)
                            </label>
                            <input
                                type="text"
                                value={form.SevaCode}
                                onChange={(e) => handleChange('SevaCode', e.target.value.toUpperCase())}
                                placeholder="E.g. RK01"
                                disabled={isEdit}
                                className={`w-full px-4 py-2.5 rounded-xl bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                ಶುಲ್ಕ (Amount)
                            </label>
                            <input
                                type="number"
                                value={form.Amount}
                                onChange={(e) => handleChange('Amount', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* TP Qty */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                ಪ್ರಸಾದ ಸಂಖ್ಯೆ (TP Qty)
                            </label>
                            <input
                                type="number"
                                value={form.TPQty}
                                onChange={(e) => handleChange('TPQty', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                            />
                        </div>

                        {/* Addon Limit */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                ಹೆಚ್ಚುವರಿ ಪ್ರಸಾದ ಮಿತಿ
                            </label>
                            <input
                                type="number"
                                value={form.PrasadaAddonLimit}
                                onChange={(e) => handleChange('PrasadaAddonLimit', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] transition-colors text-sm"
                    >
                        ರದ್ದುಮಾಡಿ (Cancel)
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-saffron)] text-white font-semibold text-sm shadow-lg hover:shadow-orange-500/25 transition-shadow"
                    >
                        {isEdit ? 'ನವೀಕರಿಸಿ (Update)' : 'ಸೇರಿಸಿ (Add)'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
