import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from './Modal';
import TransliteratedInput from './TransliteratedInput';
import GlobalInputToolbar from './GlobalInputToolbar';
import { devoteeApi } from '../api';
import { Camera, UserCircle2 } from 'lucide-react';
import { GOTRAS, NAKSHATRAS } from '../constants/panchanga';
import { useDebounce } from '../hooks/useDebounce';

const phoneRegex = /^$|^\d{10}$/;
const pinCodeRegex = /^$|^\d{6}$/;

const schema = z.object({
    DevoteeId: z.number().optional(),
    Name: z.string().min(1, 'ಹೆಸರು ಕಡ್ಡಾಯವಾಗಿದೆ (Name is required)'),
    Phone: z.string().regex(phoneRegex, 'ಫೋನ್ ಸಂಖ್ಯೆ 10 ಅಂಕಿಗಳಿರಬೇಕು (Must be 10 digits)').optional(),
    Gotra: z.string().optional(),
    Nakshatra: z.string().optional(),
    Address: z.string().optional(),
    City: z.string().optional(),
    PinCode: z.string().regex(pinCodeRegex, 'ಪಿನ್ ಕೋಡ್ 6 ಅಂಕಿಗಳಿರಬೇಕು (Must be 6 digits)').optional(),
    WhatsApp_Phone: z.string().regex(phoneRegex, 'ಫೋನ್ ಸಂಖ್ಯೆ 10 ಅಂಕಿಗಳಿರಬೇಕು (Must be 10 digits)').optional(),
    Email: z.union([z.literal(''), z.string().email('ಇಮೇಲ್ ಸರಿಯಾಗಿಲ್ಲ (Invalid email)')]).optional(),
    PhotoPath: z.string().optional(),
});

type DevoteeFormData = z.infer<typeof schema>;

interface CustomerFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: DevoteeFormData) => void;
    initialData?: Partial<DevoteeFormData>;
    title?: string;
    loading?: boolean;
}

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
    { key: 'Name', label: 'ಪೂರ್ಣ ಹೆಸರು', placeholder: 'ಭಕ್ತರ ಹೆಸರು ನಮೂದಿಸಿ', voiceEnabled: true, canTransliterate: true },
    { key: 'Phone', label: 'ಫೋನ್', type: 'tel', placeholder: '9876543210' },
    { key: 'Gotra', label: 'ಗೋತ್ರ', placeholder: 'ಉದಾ: ಕಾಶ್ಯಪ', voiceEnabled: true, canTransliterate: true },
    { key: 'Nakshatra', label: 'ನಕ್ಷತ್ರ', placeholder: 'ಉದಾ: ಅಶ್ವಿನಿ', voiceEnabled: true, canTransliterate: true },
    { key: 'WhatsApp_Phone', label: 'ವಾಟ್ಸ್ಆಪ್', type: 'tel', placeholder: '9876543210' },
    { key: 'Email', label: 'ಇಮೇಲ್', type: 'email', placeholder: 'email@example.com' },
    { key: 'Address', label: 'ವಿಳಾಸ', placeholder: 'ರಸ್ತೆ ವಿಳಾಸ', voiceEnabled: true, canTransliterate: true, multiline: true, colSpan2: true },
    { key: 'City', label: 'ನಗರ', placeholder: 'Mysore', voiceEnabled: true, canTransliterate: true },
    { key: 'PinCode', label: 'ಪಿನ್ ಕೋಡ್', type: 'text', placeholder: '570001' },
];

export default function CustomerForm({ isOpen, onClose, onSubmit, initialData, title = 'ಹೊಸ ಭಕ್ತರನ್ನು ಸೇರಿಸಿ', loading = false }: CustomerFormProps) {
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<DevoteeFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            Name: '', Gotra: '', Nakshatra: '', Address: '', City: '',
            PinCode: '', Phone: '', WhatsApp_Phone: '', Email: '', PhotoPath: ''
        }
    });

    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState<{ [key: string]: boolean }>({});
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const watchName = watch('Name');
    const watchPhone = watch('Phone');
    const debouncedName = useDebounce(watchName, 300);
    const debouncedPhone = useDebounce(watchPhone, 300);
    const devoteeId = watch('DevoteeId');

    // Debounced Search Effects
    useEffect(() => {
        const search = async (q: string, key: string) => {
            if (q && q.length > 2) {
                try {
                    const res = await devoteeApi.searchBasic(q);
                    setSearchResults(res.data);
                    setShowDropdown({ [key]: res.data.length > 0 });
                } catch {
                    setSearchResults([]);
                    setShowDropdown({});
                }
            } else {
                setSearchResults([]);
                setShowDropdown({});
            }
        };

        // Prefer phone search over name search if both are modified
        if (debouncedPhone && debouncedPhone.length > 2) {
            search(debouncedPhone, 'Phone');
        } else if (debouncedName && debouncedName.length > 2) {
            search(debouncedName, 'Name');
        } else {
            setSearchResults([]);
            setShowDropdown({});
        }
    }, [debouncedName, debouncedPhone]);


    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const submitForm = async (data: DevoteeFormData) => {
        onSubmit(data);

        // Upload photo if one was captured
        if (photoFile && data.DevoteeId) {
            try {
                await devoteeApi.uploadPhoto(data.DevoteeId, photoFile);
            } catch {
                console.error('Photo upload failed');
            }
        }

        reset();
        setPhotoPreview(null);
        setPhotoFile(null);
    };

    useEffect(() => {
        if (isOpen) {
            reset({
                DevoteeId: initialData?.DevoteeId,
                Name: initialData?.Name || '',
                Gotra: initialData?.Gotra || '',
                Nakshatra: initialData?.Nakshatra || '',
                Address: initialData?.Address || '',
                City: initialData?.City || '',
                PinCode: initialData?.PinCode || '',
                Phone: initialData?.Phone || '',
                WhatsApp_Phone: initialData?.WhatsApp_Phone || '',
                Email: initialData?.Email || '',
                PhotoPath: initialData?.PhotoPath || ''
            });
            setSearchResults([]);
            setShowDropdown({});
            setPhotoPreview(initialData?.PhotoPath || null);
            setPhotoFile(null);
        }
    }, [isOpen, initialData, reset]);

    const getUnifiedSuggestions = (list: {en: string, kn: string}[]) => {
        return list.flatMap(i => [i.en, i.kn]);
    };

    const displayTitle = devoteeId && !initialData ? `${watchName} ನವೀಕರಿಸಿ` : title;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={displayTitle} maxWidth="max-w-2xl">
            <div className="mb-4 flex justify-end">
                <GlobalInputToolbar />
            </div>
            <form onSubmit={handleSubmit(submitForm)} className="space-y-4">
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
                            <Controller
                                name={f.key}
                                control={control}
                                render={({ field }) => (
                                    <TransliteratedInput
                                        value={field.value as string}
                                        onChange={(val) => {
                                            field.onChange(val);
                                            // Handle dropdown closing
                                            if (val.length <= 2) setShowDropdown({});
                                        }}
                                        placeholder={f.placeholder}
                                        multiline={f.multiline}
                                        type={f.type}
                                        enableVoice={f.voiceEnabled}
                                        disableTransliteration={!f.canTransliterate}
                                        list={f.key === 'Gotra' ? 'gotra-list-cf' : f.key === 'Nakshatra' ? 'nakshatra-list-cf' : undefined}
                                    />
                                )}
                            />
                            {errors[f.key] && (
                                <p className="text-red-500 text-xs mt-1">{errors[f.key]?.message}</p>
                            )}
                            
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
                                        ಈ ಭಕ್ತರು ಮೊದಲೇ ಇದ್ದಾರೆ
                                    </div>
                                    {searchResults.map((c: any) => (
                                        <div
                                            key={c.DevoteeId}
                                            onClick={() => {
                                                setValue('DevoteeId', c.DevoteeId);
                                                setValue('Name', c.Name || '');
                                                setValue('Gotra', c.Gotra || '');
                                                setValue('Nakshatra', c.Nakshatra || '');
                                                setValue('Address', c.Address || '');
                                                setValue('City', c.City || '');
                                                setValue('PinCode', c.PinCode || '');
                                                setValue('Phone', c.Phone || '');
                                                setValue('WhatsApp_Phone', c.WhatsApp_Phone || '');
                                                setValue('Email', c.Email || '');
                                                setValue('PhotoPath', c.PhotoPath || '');
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
                        ರದ್ದುಮಾಡಿ
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-saffron)] text-white font-semibold text-sm shadow-lg hover:shadow-orange-500/25 transition-shadow ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {initialData || devoteeId ? (loading ? 'ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...' : 'ನವೀಕರಿಸಿ') : (loading ? 'ಸೇರಿಸಲಾಗುತ್ತಿದೆ...' : 'ಸೇರಿಸಿ')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
