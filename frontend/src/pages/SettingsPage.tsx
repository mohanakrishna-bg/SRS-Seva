// Settings Page — Light Saffron Theme
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Settings as SettingsIcon, Building2, Bell, Save, ImageIcon,
    Trash2, Camera, Link2, Upload, Calendar as CalendarIcon, Plus
} from 'lucide-react';
import TodayHighlights from '../components/TodayHighlights';
import { useToast } from '../components/Toast';
import TransliteratedInput from '../components/TransliteratedInput';

const SETTINGS_KEY = 'seva_org_settings';
const MAX_IMAGE_SIZE = 500 * 1024;

interface OrgSettings {
    orgName: string;
    address: string;
    phone: string;
    whatsapp: string;
    website: string;
    logoImage?: string;
    bgImage?: string;
    standardSchedule?: { id: number; title: string; time: string; period: 'AM' | 'PM' }[];
}

const defaultSettings: OrgSettings = {
    orgName: 'ಶ್ರೀ ಮಠ ಆಡಳಿತ',
    address: '',
    phone: '',
    whatsapp: '',
    website: '',
    standardSchedule: [
        { id: 1, title: 'ಅಭಿಷೇಕ', time: '6:30', period: 'AM' },
        { id: 2, title: 'ಬೆಳಗಿನ ಪೂಜೆ', time: '8:00', period: 'AM' },
        { id: 3, title: 'ಮಹಾಮಂಗಳಾರತಿ', time: '12:30', period: 'PM' },
        { id: 4, title: 'ತೀರ್ಥ ಪ್ರಸಾದ', time: '1:00', period: 'PM' },
        { id: 5, title: 'ಸಂಜೆ ಪೂಜೆ', time: '6:30', period: 'PM' },
        { id: 6, title: 'ರಾತ್ರಿ ಮಂಗಳಾರತಿ', time: '8:00', period: 'PM' },
    ]
};

function downsizeImage(dataUrl: string, maxBytes: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let quality = 0.9;
            let w = img.width;
            let h = img.height;
            const tryCompress = () => {
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, w, h);
                const result = canvas.toDataURL('image/jpeg', quality);
                if (result.length <= maxBytes * 1.37 || quality <= 0.1) {
                    resolve(result);
                } else {
                    if (quality > 0.3) { quality -= 0.15; }
                    else { w = Math.floor(w * 0.75); h = Math.floor(h * 0.75); quality = 0.7; }
                    tryCompress();
                }
            };
            tryCompress();
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}

function validatePhone(val: string): string | null {
    if (!val) return null;
    if (!/^[\d\s+\-()]+$/.test(val)) return 'ಅಮಾನ್ಯ ಫೋನ್ ಸಂಖ್ಯೆ';
    return null;
}

function validateUrl(val: string): string | null {
    if (!val) return null;
    try { new URL(val.startsWith('http') ? val : `https://${val}`); return null; } catch { return 'ಅಮಾನ್ಯ URL'; }
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<OrgSettings>(defaultSettings);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showUrlInput, setShowUrlInput] = useState<'logoImage' | 'bgImage' | null>(null);
    const [urlValue, setUrlValue] = useState('');
    const [loadingImage, setLoadingImage] = useState(false);
    const { showToast } = useToast();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const cameraTargetRef = useRef<'logoImage' | 'bgImage'>('logoImage');

    useEffect(() => {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            try { setSettings({ ...defaultSettings, ...JSON.parse(stored) }); } catch { setSettings(defaultSettings); }
        }
    }, []);

    const handleChange = (key: keyof OrgSettings, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    };

    const handleScheduleChange = (id: number, key: 'title' | 'time' | 'period', value: string) => {
        setSettings((prev) => {
            const schedule = prev.standardSchedule || [];
            return {
                ...prev,
                standardSchedule: schedule.map(s => s.id === id ? { ...s, [key]: value } : s)
            };
        });
    };

    const addScheduleItem = () => {
        setSettings((prev) => {
            const schedule = prev.standardSchedule || [];
            return {
                ...prev,
                standardSchedule: [...schedule, { id: Date.now(), title: 'ಹೊಸ ಸೇವೆ', time: '12:00', period: 'AM' }]
            };
        });
    };

    const removeScheduleItem = (id: number) => {
        setSettings((prev) => {
            const schedule = prev.standardSchedule || [];
            return {
                ...prev,
                standardSchedule: schedule.filter(s => s.id !== id)
            };
        });
    };

    const persistSettings = (updated: OrgSettings) => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    };

    const validateAll = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!settings.orgName.trim()) newErrors.orgName = 'ಸಂಸ್ಥೆಯ ಹೆಸರು ಅವಶ್ಯ';
        const phoneErr = validatePhone(settings.phone);
        if (phoneErr) newErrors.phone = phoneErr;
        const waErr = validatePhone(settings.whatsapp);
        if (waErr) newErrors.whatsapp = waErr;
        const webErr = validateUrl(settings.website);
        if (webErr) newErrors.website = webErr;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateAll()) { showToast('error', 'ದಯವಿಟ್ಟು ದೋಷಗಳನ್ನು ಸರಿಪಡಿಸಿ'); return; }
        persistSettings(settings);
        showToast('success', 'ಸೆಟ್ಟಿಂಗ್ಸ್ ಉಳಿಸಲಾಗಿದೆ');
    };

    const handleImageUpload = async (key: 'logoImage' | 'bgImage', file: File) => {
        setLoadingImage(true);
        try {
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Read failed'));
                reader.readAsDataURL(file);
            });
            let finalData = dataUrl;
            if (file.size > MAX_IMAGE_SIZE) {
                showToast('info', 'ಚಿತ್ರವನ್ನು ಕುಗ್ಗಿಸಲಾಗುತ್ತಿದೆ...');
                finalData = await downsizeImage(dataUrl, MAX_IMAGE_SIZE);
            }
            const newSettings = { ...settings, [key]: finalData };
            setSettings(newSettings);
            persistSettings(newSettings);
            showToast('success', 'ಚಿತ್ರ ಉಳಿಸಲಾಗಿದೆ');
        } catch { showToast('error', 'ಚಿತ್ರ ಲೋಡ್ ವಿಫಲ'); }
        setLoadingImage(false);
    };

    const openCamera = (key: 'logoImage' | 'bgImage') => {
        cameraTargetRef.current = key;
        cameraInputRef.current?.click();
    };

    const loadImageFromUrl = async (key: 'logoImage' | 'bgImage') => {
        if (!urlValue.trim()) return;
        setLoadingImage(true);
        try {
            const response = await fetch(urlValue);
            const blob = await response.blob();
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Read failed'));
                reader.readAsDataURL(blob);
            });
            let finalData = dataUrl;
            if (blob.size > MAX_IMAGE_SIZE) finalData = await downsizeImage(dataUrl, MAX_IMAGE_SIZE);
            const newSettings = { ...settings, [key]: finalData };
            setSettings(newSettings);
            persistSettings(newSettings);
            showToast('success', 'ಚಿತ್ರ ಉಳಿಸಲಾಗಿದೆ');
            setShowUrlInput(null);
            setUrlValue('');
        } catch { showToast('error', 'URL ನಿಂದ ಚಿತ್ರ ಲೋಡ್ ವಿಫಲ'); }
        setLoadingImage(false);
    };

    const removeImage = (key: 'logoImage' | 'bgImage') => {
        const newSettings = { ...settings };
        delete newSettings[key];
        setSettings(newSettings);
        persistSettings(newSettings);
    };

    const fields: { key: keyof OrgSettings; label: string; placeholder: string; canTransliterate: boolean; multiline?: boolean }[] = [
        { key: 'orgName', label: 'ಸಂಸ್ಥೆಯ ಹೆಸರು', placeholder: 'ಮಠ / ದೇವಸ್ಥಾನದ ಹೆಸರು', canTransliterate: true },
        { key: 'address', label: 'ವಿಳಾಸ', placeholder: 'ಪೂರ್ಣ ವಿಳಾಸ', canTransliterate: true, multiline: true },
        { key: 'phone', label: 'ಫೋನ್', placeholder: 'ಸಂಪರ್ಕ ಸಂಖ್ಯೆ', canTransliterate: false },
        { key: 'whatsapp', label: 'ವಾಟ್ಸ್ಆಪ್', placeholder: 'ವಾಟ್ಸ್ಆಪ್ ಸಂಖ್ಯೆ', canTransliterate: false },
        { key: 'website', label: 'ವೆಬ್ಸೈಟ್', placeholder: 'ವೆಬ್ಸೈಟ್ URL', canTransliterate: false },
    ];

    const iconBtnClass = "p-2 rounded-lg border border-black/10 bg-white/60 text-[var(--text-secondary)] hover:bg-white hover:text-[var(--primary)] transition-colors disabled:opacity-40";
    const iconBtnDeleteClass = "p-2 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors";

    const renderImageSection = (key: 'logoImage' | 'bgImage', label: string, ref: React.RefObject<HTMLInputElement | null>, previewClass: string) => (
        <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">{label}</label>
            <div className="flex items-center gap-3">
                {settings[key] ? (
                    <img src={settings[key]} alt={label} className={`${previewClass} rounded-xl object-cover border border-black/10 shadow-sm`} />
                ) : (
                    <div className={`${previewClass} rounded-xl bg-black/[0.03] border border-dashed border-black/15 flex items-center justify-center text-[var(--text-secondary)] text-xs`}>
                        ಚಿತ್ರ
                    </div>
                )}
                {/* Icon-only horizontal buttons */}
                <div className="flex gap-1.5">
                    <input ref={ref} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(key, file); if (e.target) e.target.value = ''; }}
                    />
                    <button onClick={() => ref.current?.click()} disabled={loadingImage} className={iconBtnClass} title="ಫೈಲ್ ಆಯ್ಕೆ">
                        <Upload size={16} />
                    </button>
                    <button onClick={() => openCamera(key)} disabled={loadingImage} className={iconBtnClass} title="ಕ್ಯಾಮೆರಾ">
                        <Camera size={16} />
                    </button>
                    <button onClick={() => { setShowUrlInput(showUrlInput === key ? null : key); setUrlValue(''); }} disabled={loadingImage} className={iconBtnClass} title="URL ಲಿಂಕ್">
                        <Link2 size={16} />
                    </button>
                    {settings[key] && (
                        <button onClick={() => removeImage(key)} className={iconBtnDeleteClass} title="ಅಳಿಸಿ">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
            {showUrlInput === key && (
                <div className="mt-2 flex gap-2">
                    <input type="url" value={urlValue} onChange={(e) => setUrlValue(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-black/10 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20"
                    />
                    <button onClick={() => loadImageFromUrl(key)} disabled={loadingImage || !urlValue.trim()}
                        className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                    >
                        {loadingImage ? '...' : 'ಲೋಡ್'}
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-[var(--primary)]">
                <SettingsIcon size={28} />
                ಸೆಟ್ಟಿಂಗ್ಸ್
            </h2>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(cameraTargetRef.current, file); if (e.target) e.target.value = ''; }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Organization Info */}
                <div className="glass-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 size={20} className="text-[var(--primary)]" />
                        <h3 className="font-bold text-lg">ಸಂಸ್ಥೆ</h3>
                    </div>
                    <div className="space-y-3">
                        {fields.map((field) => {
                            const err = errors[field.key];
                            return (
                                <div key={field.key}>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">{field.label}</label>
                                    <div className="mt-1">
                                        <TransliteratedInput
                                            value={(settings[field.key] as string) || ''}
                                            onChange={(val) => handleChange(field.key, val)}
                                            placeholder={field.placeholder}
                                            multiline={field.multiline}
                                            enableVoice={true}
                                            disableTransliteration={!field.canTransliterate}
                                        />
                                    </div>
                                    {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
                                </div>
                            );
                        })}
                        <button onClick={handleSave}
                            className="mt-4 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm shadow hover:shadow-md flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-all">
                            <Save size={16} /> ಉಳಿಸಿ
                        </button>
                    </div>
                </div>

                {/* Image Settings */}
                <div className="glass-card">
                    <div className="flex items-center gap-2 mb-4">
                        <ImageIcon size={20} className="text-[var(--primary)]" />
                        <h3 className="font-bold text-lg">ಚಿತ್ರ ಸೆಟ್ಟಿಂಗ್ಸ್</h3>
                    </div>
                    <div className="space-y-5">
                        {renderImageSection('logoImage', 'ಲೋಗೋ ಚಿತ್ರ', logoInputRef, 'w-16 h-16')}
                        {renderImageSection('bgImage', 'ಹಿನ್ನೆಲೆ ಚಿತ್ರ', bgInputRef, 'w-24 h-16')}
                        <p className="text-xs text-[var(--text-secondary)] italic">
                            ಗಮನಿಸಿ: ದೊಡ್ಡ ಚಿತ್ರಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ 500KB ಗೆ ಕುಗ್ಗಿಸಲಾಗುತ್ತದೆ.
                        </p>
                    </div>
                </div>

                {/* Today's Highlights */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Bell size={20} className="text-[var(--primary)]" />
                        <h3 className="font-bold text-lg">ಇಂದಿನ ವಿಶೇಷಗಳು</h3>
                        <span className="text-xs text-[var(--text-secondary)]">(ಸಂಪಾದಿಸಬಹುದು)</span>
                    </div>
                    <TodayHighlights editable={true} />
                </div>

                {/* Standard Daily Schedule */}
                <div className="glass-card lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <CalendarIcon size={20} className="text-[var(--primary)]" />
                            <h3 className="font-bold text-lg">ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ (Standard Schedule)</h3>
                        </div>
                        <button onClick={addScheduleItem} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary)]/20 transition-colors">
                            <Plus size={16} /> ಸೇರಿಸಿ
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(settings.standardSchedule || []).map((item) => (
                            <div key={item.id} className="flex flex-col gap-2 p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                <div className="flex justify-between items-start">
                                    <TransliteratedInput
                                        value={item.title}
                                        onChange={(val) => handleScheduleChange(item.id, 'title', val)}
                                        placeholder="ಉದಾ: ಅಭಿಷೇಕ"
                                        className="h-8 py-1 text-sm bg-white/50"
                                        enableVoice={false}
                                    />
                                    <button onClick={() => removeScheduleItem(item.id)} className="p-1.5 ml-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors shrink-0">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={item.time}
                                        onChange={(e) => handleScheduleChange(item.id, 'time', e.target.value)}
                                        className="w-16 h-8 px-2 rounded-md bg-white border border-black/10 text-sm focus:outline-none focus:border-[var(--primary)]"
                                        placeholder="12:00"
                                    />
                                    <select
                                        value={item.period}
                                        onChange={(e) => handleScheduleChange(item.id, 'period', e.target.value)}
                                        className="h-8 px-2 rounded-md bg-white border border-black/10 text-sm focus:outline-none focus:border-[var(--primary)] appearance-none"
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
