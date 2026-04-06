import React, { useState, useRef } from 'react';
import Modal from './Modal';
import TransliteratedInput from './TransliteratedInput';
import GlobalInputToolbar from './GlobalInputToolbar';
import { devoteeApi } from '../api';
import { Camera, UserCircle2 } from 'lucide-react';
import { GOTRAS, NAKSHATRAS } from '../constants/panchanga';

interface DevoteeFormData {
    DevoteeId?: number;
    Name: string;
    Gotra: string;
    Nakshatra: string;
    Address: string;
    City: string;
    PinCode: string;
    Phone: string;
    WhatsApp_Phone: string;
    Email: string;
    PhotoPath?: string;
}

interface CustomerFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: DevoteeFormData) => void;
    initialData?: Partial<DevoteeFormData>;
    title?: string;
    loading?: boolean;
}

const emptyForm: DevoteeFormData = {
    Name: '', Gotra: '', Nakshatra: '', Address: '', City: '',
    PinCode: '', Phone: '', WhatsApp_Phone: '', Email: '',
};

const fields: {
    key: keyof DevoteeFormData;
    label: string;
    type?: string;
    placeholder: string;
    voiceEnabled?: boolean;
    canTransliterate?: boolean;
    multiline?: boolean;
    colSpan2?: boolean;
}[] = [
    { key: 'Name', label: 'ಪೂರ್ಣ ಹೆಸರು (Name)', placeholder: 'ಭಕ್ತರ ಹೆಸರು ನಮೂದಿಸಿ', voiceEnabled: true, canTransliterate: true },
    { key: 'Phone', label: 'ಫೋನ್ (Phone)', type: 'tel', placeholder: '9876543210' },
    { key: 'Gotra', label: 'ಗೋತ್ರ (Gotra)', placeholder: 'ಉದಾ: ಕಾಶ್ಯಪ', voiceEnabled: true, canTransliterate: true },
    { key: 'Nakshatra', label: 'ನಕ್ಷತ್ರ (Nakshatra)', placeholder: 'ಉದಾ: ಅಶ್ವಿನಿ', voiceEnabled: true, canTransliterate: true },
    { key: 'WhatsApp_Phone', label: 'ವಾಟ್ಸ್ಆಪ್ (WhatsApp)', type: 'tel', placeholder: '9876543210' },
    { key: 'Email', label: 'ಇಮೇಲ್ (Email)', type: 'email', placeholder: 'email@example.com' },
    { key: 'Address', label: 'ವಿಳಾಸ (Address)', placeholder: 'ರಸ್ತೆ ವಿಳಾಸ', voiceEnabled: true, canTransliterate: true, multiline: true, colSpan2: true },
    { key: 'City', label: 'ನಗರ (City)', placeholder: 'Mysore', voiceEnabled: true, canTransliterate: true },
    { key: 'PinCode', label: 'ಪಿನ್ ಕೋಡ್ (PIN Code)', type: 'text', placeholder: '570001' },
];

export default function CustomerForm({ isOpen, onClose, onSubmit, initialData, title = 'ಹೊಸ ಭಕ್ತರನ್ನು ಸೇರಿಸಿ', loading = false }: CustomerFormProps) {
    const [form, setForm] = useState<DevoteeFormData>({ ...emptyForm, ...initialData });
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState<{ [key: string]: boolean }>({});
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const searchTimeout = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (key: keyof DevoteeFormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));

        if (key === 'Name' || key === 'Phone') {
            if (value.length > 2) {
                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                searchTimeout.current = setTimeout(async () => {
                    try {
                        const res = await devoteeApi.searchBasic(value);
                        setSearchResults(res.data);
                        setShowDropdown({ [key]: res.data.length > 0 });
                    } catch {
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

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.Name.trim()) return;

        // Submit form data first
        onSubmit(form);

        // Upload photo if one was captured
        if (photoFile && form.DevoteeId) {
            try {
                await devoteeApi.uploadPhoto(form.DevoteeId, photoFile);
            } catch {
                console.error('Photo upload failed');
            }
        }

        setForm(emptyForm);
        setPhotoPreview(null);
        setPhotoFile(null);
    };

    React.useEffect(() => {
        if (isOpen) {
            setForm({ ...emptyForm, ...initialData });
            setSearchResults([]);
            setShowDropdown({});
            setPhotoPreview(initialData?.PhotoPath || null);
            setPhotoFile(null);
        }
    }, [isOpen, initialData]);

    const getUnifiedSuggestions = (list: {en: string, kn: string}[]) => {
        return list.flatMap(i => [i.en, i.kn]);
    };

    const displayTitle = form.DevoteeId && !initialData ? `${form.Name} ನವೀಕರಿಸಿ (Update)` : title;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={displayTitle} maxWidth="max-w-2xl">
            <div className="mb-4 flex justify-end">
                <GlobalInputToolbar />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Photo Section */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="relative group">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Devotee" className="w-20 h-20 rounded-full object-cover border-2 border-[var(--primary)]/30" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                <UserCircle2 size={40} />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                            <Camera size={14} />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoCapture}
                            className="hidden"
                        />
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                        <p className="font-medium text-[var(--text-primary)]">ಭಕ್ತರ ಫೋಟೋ</p>
                        <p className="text-xs mt-0.5">Tap camera to capture or upload a photo</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map((f) => (
                        <div key={f.key} className={`relative ${f.colSpan2 ? 'md:col-span-2' : ''}`}>
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
                                list={f.key === 'Gotra' ? 'gotra-list-cf' : f.key === 'Nakshatra' ? 'nakshatra-list-cf' : undefined}
                            />
                            {f.key === 'Gotra' && (
                                <datalist id="gotra-list-cf">
                                    {getUnifiedSuggestions(GOTRAS).map((g: string) => <option key={g} value={g} />)}
                                </datalist>
                            )}
                            {f.key === 'Nakshatra' && (
                                <datalist id="nakshatra-list-cf">
                                    {getUnifiedSuggestions(NAKSHATRAS).map((n: string) => <option key={n} value={n} />)}
                                </datalist>
                            )}
                            {(f.key === 'Name' || f.key === 'Phone') && showDropdown[f.key] && searchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                    <div className="sticky top-0 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs px-3 py-1.5 font-medium border-b border-[var(--glass-border)]">
                                        ಈ ಭಕ್ತರು ಮೊದಲೇ ಇದ್ದಾರೆ (Existing Devotees)
                                    </div>
                                    {searchResults.map((c: any) => (
                                        <div
                                            key={c.DevoteeId}
                                            onClick={() => {
                                                setForm({
                                                    DevoteeId: c.DevoteeId,
                                                    Name: c.Name || '',
                                                    Gotra: c.Gotra || '',
                                                    Nakshatra: c.Nakshatra || '',
                                                    Address: c.Address || '',
                                                    City: c.City || '',
                                                    PinCode: c.PinCode || '',
                                                    Phone: c.Phone || '',
                                                    WhatsApp_Phone: c.WhatsApp_Phone || '',
                                                    Email: c.Email || '',
                                                    PhotoPath: c.PhotoPath || '',
                                                });
                                                setPhotoPreview(c.PhotoPath || null);
                                                setShowDropdown({});
                                            }}
                                            className="p-3 hover:bg-[var(--glass-border)] cursor-pointer border-b last:border-0 border-[var(--glass-border)] transition-colors"
                                        >
                                            <p className="font-semibold text-sm text-[var(--text-primary)]">{c.Name}</p>
                                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                {c.Phone ? `📱 ${c.Phone}` : ''} {c.Gotra ? `• ಗೋತ್ರ: ${c.Gotra}` : ''}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
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
                        disabled={loading}
                        className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-saffron)] text-white font-semibold text-sm shadow-lg hover:shadow-orange-500/25 transition-shadow ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {initialData || form.DevoteeId ? (loading ? 'ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...' : 'ನವೀಕರಿಸಿ (Update)') : (loading ? 'ಸೇರಿಸಲಾಗುತ್ತಿದೆ...' : 'ಸೇರಿಸಿ (Add)')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
