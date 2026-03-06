import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Link2, Upload, Trash2 } from 'lucide-react';
import MediaCaptureModal from './MediaCaptureModal';

interface ImageInputProps {
    value?: string; // dataUrl or backend url
    onChange: (fileOrUrl: File | string) => void;
    onClear?: () => void;
    label?: string;
    previewClassName?: string;
    disableCamera?: boolean;
}

export default function ImageInput({
    value,
    onChange,
    onClear,
    label = 'ಚಿತ್ರ',
    previewClassName = 'w-24 h-24',
    disableCamera = false,
}: ImageInputProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlValue, setUrlValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onChange(file);
        }
        if (e.target) e.target.value = ''; // reset
    };

    const handleUrlLoad = async () => {
        if (!urlValue.trim()) return;
        setLoading(true);
        try {
            // Check if valid URL can be fetched
            const response = await fetch(urlValue);
            if (response.ok) {
                // Return URL directly or download as blob?
                // Depending on requirements, we can just pass the string URL.
                onChange(urlValue);
                setShowUrlInput(false);
                setUrlValue('');
            }
        } catch {
            alert('URL ನಿಂದ ಚಿತ್ರ ಲೋಡ್ ವಿಫಲ');
        }
        setLoading(false);
    };

    const handleCameraCapture = (file: File) => {
        onChange(file);
        setIsCameraModalOpen(false);
    };


    // Guessing if we are in a dark context or light context is hard, but we can stick to a neutral/glassmorphic look:
    const finalIconBtnClass = "p-2 rounded-lg border border-slate-500/20 bg-slate-500/5 text-slate-600 dark:text-slate-300 hover:bg-slate-500/10 transition-colors";

    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    {label}
                </label>
            )}

            <div className="flex items-center gap-3 flex-wrap">
                {value ? (
                    <img
                        src={value}
                        alt={label}
                        className={`${previewClassName} rounded-xl object-cover border border-slate-500/20 shadow-sm bg-black/5`}
                        onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ddd"/><text x="50" y="55" font-family="sans-serif" font-size="12" text-anchor="middle" fill="%23666">Error</text></svg>';
                        }}
                    />
                ) : (
                    <div className={`${previewClassName} rounded-xl bg-slate-500/5 border border-dashed border-slate-500/20 flex flex-col items-center justify-center text-slate-400 text-xs gap-1`}>
                        <ImageIcon size={20} className="opacity-50" />
                        <span>ಖಾಲಿ</span>
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFile}
                    />
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={loading}
                        className={finalIconBtnClass}
                        title="ಫೈಲ್ ಆಯ್ಕೆ (Upload)"
                    >
                        <Upload size={18} />
                    </button>
                    {!disableCamera && (
                        <button
                            type="button"
                            onClick={() => setIsCameraModalOpen(true)}
                            disabled={loading}
                            className={finalIconBtnClass}
                            title="ಕ್ಯಾಮೆರಾ (Camera)"
                        >
                            <Camera size={18} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        disabled={loading}
                        className={finalIconBtnClass}
                        title="URL ಲಿಂಕ್"
                    >
                        <Link2 size={18} />
                    </button>
                    {value && onClear && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="p-2 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-colors"
                            title="ಅಳಿಸಿ (Clear)"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {showUrlInput && (
                <div className="mt-3 flex gap-2 w-full max-w-sm">
                    <input
                        type="url"
                        value={urlValue}
                        onChange={(e) => setUrlValue(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm focus:outline-none focus:border-[var(--primary)] text-inherit"
                    />
                    <button
                        type="button"
                        onClick={handleUrlLoad}
                        disabled={loading || !urlValue.trim()}
                        className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:brightness-110 transition-colors disabled:opacity-50"
                    >
                        {loading ? '...' : 'ಲೋಡ್'}
                    </button>
                </div>
            )}

            {isCameraModalOpen && (
                <MediaCaptureModal
                    isOpen={isCameraModalOpen}
                    onClose={() => setIsCameraModalOpen(false)}
                    type="photo"
                    onCapture={handleCameraCapture}
                />
            )}
        </div>
    );
}
