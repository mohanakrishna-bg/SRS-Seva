import React, { useState, useRef } from 'react';
import Modal from './Modal';
import TransliteratedInput from './TransliteratedInput';
import { customerApi } from '../api';

interface CustomerFormData {
    ID1?: number;
    Name: string;
    Sgotra: string;
    SNakshatra: string;
    Address: string;
    City: string;
    Phone: string;
    WhatsApp_Phone: string;
    Email_ID: string;
    Google_Maps_Location: string;
}

interface CustomerFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CustomerFormData) => void;
    initialData?: Partial<CustomerFormData>;
    title?: string;
}

const emptyForm: CustomerFormData = {
    Name: '', Sgotra: '', SNakshatra: '', Address: '', City: '',
    Phone: '', WhatsApp_Phone: '', Email_ID: '', Google_Maps_Location: '',
};

const fields: {
    key: keyof CustomerFormData;
    label: string;
    type?: string;
    placeholder: string;
    voiceEnabled?: boolean;
    canTransliterate?: boolean;
    multiline?: boolean;
}[] = [
        { key: 'Name', label: 'ಪೂರ್ಣ ಹೆಸರು', placeholder: 'ಭಕ್ತರ ಹೆಸರು ನಮೂದಿಸಿ', voiceEnabled: true, canTransliterate: true },
        { key: 'Sgotra', label: 'ಗೋತ್ರ (ಗೋತ್ರ)', placeholder: 'ಉದಾ: ವಿಷ್ಣು, ಕಶ್ಯಪ', voiceEnabled: true, canTransliterate: true },
        { key: 'SNakshatra', label: 'ನಕ್ಷತ್ರ (ನಕ್ಷತ್ರ)', placeholder: 'ಉದಾ: ಅಶ್ವಿನಿ, ರೋಹಿಣಿ', voiceEnabled: true, canTransliterate: true },
        { key: 'Phone', label: 'ಫೋನ್', type: 'tel', placeholder: '+91 XXXXX XXXXX' },
        { key: 'WhatsApp_Phone', label: 'ವಾಟ್ಸ್ಆಪ್', type: 'tel', placeholder: '+91 XXXXX XXXXX' },
        { key: 'Email_ID', label: 'ಇಮೇಲ್', type: 'email', placeholder: 'email@example.com' },
        { key: 'Address', label: 'ವಿಳಾಸ', placeholder: 'ರಸ್ತೆ ವಿಳಾಸ', voiceEnabled: true, canTransliterate: true, multiline: true },
        { key: 'City', label: 'ನಗರ', placeholder: 'ನಗರದ ಹೆಸರು', voiceEnabled: true, canTransliterate: true },
        { key: 'Google_Maps_Location', label: 'ಗೂಗಲ್ ನಕ್ಷೆ ಲಿಂಕ್', placeholder: 'https://maps.google.com/...' },
    ];

export default function CustomerForm({ isOpen, onClose, onSubmit, initialData, title = 'ಹೊಸ ಭಕ್ತರನ್ನು ಸೇರಿಸಿ' }: CustomerFormProps) {
    const [form, setForm] = useState<CustomerFormData>({ ...emptyForm, ...initialData });
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState<{ [key: string]: boolean }>({});
    const searchTimeout = useRef<any>(null);

    const handleChange = (key: keyof CustomerFormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));

        if (key === 'Name' || key === 'Phone') {
            if (value.length > 2) {
                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                searchTimeout.current = setTimeout(async () => {
                    try {
                        const res = await customerApi.search(value);
                        setSearchResults(res.data);
                        setShowDropdown({ [key]: res.data.length > 0 });
                    } catch (e) {
                        setSearchResults([]);
                        setShowDropdown({});
                    }
                }, 300);
            } else {
                setSearchResults([]);
                setShowDropdown({});
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.Name.trim()) return;
        onSubmit(form);
        setForm(emptyForm);
    };


    React.useEffect(() => {
        if (isOpen) {
            setForm({ ...emptyForm, ...initialData });
            setSearchResults([]);
            setShowDropdown({});
        }
    }, [isOpen, initialData]);

    const displayTitle = form.ID1 && !initialData ? `${form.Name} ನವೀಕರಿಸಿ (Update)` : title;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={displayTitle} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map((f) => {
                        return (
                            <div key={f.key} className={`relative ${f.key === 'Address' || f.key === 'Google_Maps_Location' ? 'md:col-span-2' : ''}`}>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                                    {f.label}
                                </label>
                                <TransliteratedInput
                                    value={form[f.key] as string}
                                    onChange={(val) => handleChange(f.key, val)}
                                    placeholder={f.placeholder}
                                    multiline={f.multiline}
                                    type={f.type}
                                    enableVoice={f.voiceEnabled}
                                    disableTransliteration={!f.canTransliterate}
                                />
                                {(f.key === 'Name' || f.key === 'Phone') && showDropdown[f.key] && searchResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        <div className="sticky top-0 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs px-3 py-1.5 font-medium border-b border-[var(--glass-border)]">
                                            ಈ ಭಕ್ತರು ಮೊದಲೇ ಇದ್ದಾರೆ (Existing Devotees)
                                        </div>
                                        {searchResults.map((c: any) => (
                                            <div
                                                key={c.ID1}
                                                onClick={() => {
                                                    setForm(c);
                                                    setShowDropdown({});
                                                }}
                                                className="p-3 hover:bg-[var(--glass-border)] cursor-pointer border-b last:border-0 border-[var(--glass-border)] transition-colors"
                                            >
                                                <p className="font-semibold text-sm text-[var(--text-primary)]">{c.Name}</p>
                                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                    {c.Phone ? `📱 ${c.Phone}` : ''} {c.Sgotra ? `• ಗೋತ್ರ: ${c.Sgotra}` : ''}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] transition-colors text-sm"
                    >
                        ರದ್ದುಮಾಡಿ
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-saffron)] text-white font-semibold text-sm shadow-lg hover:shadow-orange-500/25 transition-shadow"
                    >
                        {initialData || form.ID1 ? 'ಭಕ್ತರನ್ನು ನವೀಕರಿಸಿ (Update)' : 'ಭಕ್ತರನ್ನು ಸೇರಿಸಿ (Add)'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
