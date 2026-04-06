import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import TransliteratedInput from './TransliteratedInput';
import GlobalInputToolbar from './GlobalInputToolbar';
import { sevaApi } from '../api';

export interface SpecialEventFormData {
    SevaCode: string;
    Description: string;
    DescriptionEn?: string;
    Amount: number;
    TPQty: number;
    PrasadaAddonLimit: number;
    IsSpecialEvent: boolean;
    EventDate?: string;
    StartTime?: string;
    EndTime?: string;
    IsAllDay: boolean;
    RecurrenceRule?: string;
    composite_sevas?: string[];
}

interface SpecialEventFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SpecialEventFormData) => void;
    initialData?: Partial<SpecialEventFormData>;
    title?: string;
    isEdit?: boolean;
}

const emptyForm: SpecialEventFormData = {
    SevaCode: '',
    Description: '',
    DescriptionEn: '',
    Amount: 0,
    TPQty: 0,
    PrasadaAddonLimit: 0,
    IsSpecialEvent: true,
    EventDate: '',
    StartTime: '',
    EndTime: '',
    IsAllDay: false,
    RecurrenceRule: 'None',
    composite_sevas: [],
};

export default function SpecialEventForm({ isOpen, onClose, onSubmit, initialData, title = 'ಹೊಸ ವಿಶೇಷ ಘಟನೆ ಸೇರಿಸಿ', isEdit = false }: SpecialEventFormProps) {
    const [form, setForm] = useState<SpecialEventFormData>({ ...emptyForm, ...initialData });
    const [availableSevas, setAvailableSevas] = useState<{SevaCode: string, Description: string}[]>([]);

    useEffect(() => {
        if (isOpen) {
            setForm({ ...emptyForm, ...initialData, IsSpecialEvent: true });
            fetchRegularSevas();
        }
    }, [isOpen, initialData]);

    const fetchRegularSevas = async () => {
        try {
            const res = await sevaApi.list();
            // Filter only non-special events
            setAvailableSevas(res.data.filter((s: any) => !s.IsSpecialEvent));
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (key: keyof SpecialEventFormData, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const toggleCompositeSeva = (code: string) => {
        setForm(prev => {
            const list = prev.composite_sevas || [];
            if (list.includes(code)) {
                return { ...prev, composite_sevas: list.filter(c => c !== code) };
            } else {
                return { ...prev, composite_sevas: [...list, code] };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.Description.trim()) return;
        onSubmit(form);
    };

    const formatToDateInput = (ddmmyy?: string) => {
        if (!ddmmyy || ddmmyy.length !== 6) return '';
        const d = ddmmyy.substring(0, 2);
        const m = ddmmyy.substring(2, 4);
        const y = `20${ddmmyy.substring(4, 6)}`;
        return `${y}-${m}-${d}`;
    };

    const handleDateChange = (val: string) => {
        if (!val) {
            handleChange('EventDate', '');
            return;
        }
        const [y, m, d] = val.split('-');
        const yy = y.slice(2);
        handleChange('EventDate', `${d}${m}${yy}`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-2xl">
            <div className="mb-4 flex justify-end">
                <GlobalInputToolbar />
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 select-none">
                
                {/* 1. Basic Info */}
                <div className="space-y-4">
                    <h4 className="font-bold text-[var(--primary)] border-b border-[var(--glass-border)] pb-2 text-sm uppercase tracking-wider">
                        ಮೂಲ ವಿವರಣೆ (Basic Info)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                ಘಟನೆಯ ಹೆಸರು (Event Name - Kannada)
                            </label>
                            <TransliteratedInput
                                value={form.Description}
                                onChange={(val) => handleChange('Description', val)}
                                placeholder="ಘಟನೆಯ ಹೆಸರು"
                                enableVoice={true}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                Event Name (English)
                            </label>
                            <input
                                type="text"
                                value={form.DescriptionEn || ''}
                                onChange={(e) => handleChange('DescriptionEn', e.target.value)}
                                placeholder="Event Name in English"
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                ಸೇವಾ ಕೋಡ್ (Event Code)
                            </label>
                            <input
                                type="text"
                                value={form.SevaCode}
                                onChange={(e) => handleChange('SevaCode', e.target.value.toUpperCase().replace(/\s/g, ''))}
                                placeholder="E.g. EVT01"
                                disabled={isEdit}
                                className={`w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                ಅಂದಾಜು ಶುಲ್ಕ (Base Amount)
                            </label>
                            <input
                                type="number"
                                value={form.Amount}
                                onChange={(e) => handleChange('Amount', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Scheduling */}
                <div className="space-y-4">
                    <h4 className="font-bold text-[var(--primary)] border-b border-[var(--glass-border)] pb-2 text-sm uppercase tracking-wider">
                        ವೇಳಾಪಟ್ಟಿ (Scheduling)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                ದಿನಾಂಕ / ಆರಂಭಿಕ ದಿನಾಂಕ (Date/Start)
                            </label>
                            <input
                                type="date"
                                min={new Date().toLocaleDateString('en-CA')}
                                value={formatToDateInput(form.EventDate)}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                ಪುನರಾವರ್ತನೆ (Recurrence)
                            </label>
                            <select
                                value={form.RecurrenceRule || 'None'}
                                onChange={(e) => handleChange('RecurrenceRule', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                            >
                                <option value="None">ಪುನರಾವರ್ತನೆ ಇಲ್ಲ (Ad-Hoc / None)</option>
                                <option value="Daily">ದೈನಂದಿನ (Daily)</option>
                                <option value="Weekly">ಸಾಪ್ತಾಹಿಕ (Weekly)</option>
                                <option value="Monthly">ಮಾಸಿಕ (Monthly by Date)</option>
                                <option value="Yearly">ವಾರ್ಷಿಕ (Yearly)</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                id="isAllDay"
                                checked={form.IsAllDay}
                                onChange={(e) => handleChange('IsAllDay', e.target.checked)}
                                className="w-5 h-5 accent-[var(--primary)] rounded cursor-pointer"
                            />
                            <label htmlFor="isAllDay" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
                                ದಿನವಿಡೀ ಘಟನೆ (All-Day Event)
                            </label>
                        </div>

                        {!form.IsAllDay && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                        ಆರಂಭದ ಸಮಯ (Start Time)
                                    </label>
                                    <input
                                        type="time"
                                        value={form.StartTime || ''}
                                        onChange={(e) => handleChange('StartTime', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                        ಅಂತ್ಯದ ಸಮಯ (End Time - Optional)
                                    </label>
                                    <input
                                        type="time"
                                        value={form.EndTime || ''}
                                        onChange={(e) => handleChange('EndTime', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. Composition */}
                <div className="space-y-4">
                    <h4 className="font-bold text-[var(--primary)] border-b border-[var(--glass-border)] pb-2 text-sm uppercase tracking-wider">
                        ಸೇವಾ ಸಂಯೋಜನೆ (Composite Sevas - Optional)
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                        ಈ ಘಟನೆಯು ಬಹು ಸೇವೆಗಳ ಗುಂಪಾಗಿದ್ದರೆ, ಕೆಳಗೆ ಆಯ್ದುಕೊಳ್ಳಿ. (If this event is a bundle of smaller sevas, select them below.)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--glass-border)]">
                        {availableSevas.length === 0 && (
                            <div className="p-4 text-center col-span-2 text-sm text-[var(--text-secondary)]">No base sevas available to compose.</div>
                        )}
                        {availableSevas.map((s) => (
                            <label key={s.SevaCode} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--glass-bg)] cursor-pointer border border-transparent hover:border-[var(--glass-border)] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={(form.composite_sevas || []).includes(s.SevaCode)}
                                    onChange={() => toggleCompositeSeva(s.SevaCode)}
                                    className="mt-1 w-4 h-4 accent-[var(--primary)] rounded border-[var(--glass-border)]"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.Description}</p>
                                    <p className="text-xs text-[var(--text-secondary)] font-mono">{s.SevaCode}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-[var(--glass-border)] bg-[var(--bg-dark)]/80 sticky bottom-0 z-10 p-2">
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
                        {isEdit ? 'ನವೀಕರಿಸಿ (Update)' : 'ಸೇರಿಸಿ (Add Event)'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
