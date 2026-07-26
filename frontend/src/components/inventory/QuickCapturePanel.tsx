import { useState, useRef, useEffect } from 'react';
import { Camera, Check, Loader2, X, Smartphone, ImageIcon, ChevronDown, Send, RotateCcw, Zap } from 'lucide-react';
import { inventoryApi } from '../../api';

interface Category { Id: number; Name: string; ForType?: string; }

interface QuickCapturePanelProps {
    categories: Category[];
    itemType: 'asset' | 'consumable';
    onCaptured?: () => void;
}

interface CaptureResult {
    filename: string;
    path: string;
    item_name?: string;
}

export default function QuickCapturePanel({ categories, itemType, onCaptured }: QuickCapturePanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [itemName, setItemName] = useState('');
    const [category, setCategory] = useState('');
    const [notes, setNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<CaptureResult | null>(null);
    const [error, setError] = useState('');
    const [recentCaptures, setRecentCaptures] = useState<CaptureResult[]>([]);

    const filteredCats = categories.filter(c => !c.ForType || c.ForType === itemType);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCapturedFile(file);
        setResult(null);
        setError('');

        // Create preview
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        if (!capturedFile) return;

        setUploading(true);
        setError('');
        setResult(null);

        try {
            const res = await inventoryApi.quickCapture(capturedFile, {
                item_name: itemName || undefined,
                category: category || undefined,
                notes: notes || undefined,
            });

            const captureResult: CaptureResult = {
                filename: res.data.filename,
                path: res.data.path,
                item_name: res.data.item_name,
            };

            setResult(captureResult);
            setRecentCaptures(prev => [captureResult, ...prev].slice(0, 5));

            // Reset form for next capture
            setTimeout(() => {
                setCapturedFile(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
                setItemName('');
                setNotes('');
                setResult(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                onCaptured?.();
            }, 2500);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Failed to upload capture');
        }
        setUploading(false);
    };

    const handleReset = () => {
        setCapturedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setItemName('');
        setCategory('');
        setNotes('');
        setResult(null);
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-5 backdrop-blur-md space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                        <Smartphone size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                            Quick Capture / ತ್ವರಿತ ಕ್ಯಾಪ್ಚರ್
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)]">
                            Snap a photo directly from your mobile — no Google Photos needed
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                    <Zap size={10} /> Direct Upload
                </div>
            </div>

            {/* Capture Area */}
            {!capturedFile ? (
                <div className="space-y-3">
                    {/* Camera Trigger */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all cursor-pointer group"
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Camera size={28} className="text-emerald-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                Tap to Open Camera / ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                                Takes photo using your device camera and uploads directly
                            </p>
                        </div>
                    </button>

                    {/* Hidden file input with camera capture attribute for mobile */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Preview + Metadata Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Photo Preview */}
                        <div className="relative rounded-2xl overflow-hidden border border-[var(--glass-border)] bg-black/20">
                            {previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt="Captured"
                                    className="w-full h-48 sm:h-full object-cover"
                                />
                            )}
                            {result && (
                                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-sm">
                                    <div className="p-3 rounded-full bg-emerald-500 text-white shadow-lg">
                                        <Check size={28} />
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={handleReset}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                                title="Discard and retake"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Metadata Tags (Optional) */}
                        <div className="space-y-2.5">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-0.5">
                                    Item Name (optional)
                                </label>
                                <input
                                    type="text"
                                    value={itemName}
                                    onChange={e => setItemName(e.target.value)}
                                    placeholder="e.g. Silver Lamp / ಬೆಳ್ಳಿ ದೀಪ"
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-0.5">
                                    Category (optional)
                                </label>
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] appearance-none focus:outline-none focus:border-emerald-500/50"
                                    >
                                        <option value="">No category</option>
                                        {filteredCats.map(c => (
                                            <option key={c.Id} value={c.Name}>{c.Name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-0.5">
                                    Notes (optional)
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="e.g. Located in main sanctum"
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>

                            {error && (
                                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                                    {error}
                                </div>
                            )}

                            {result && (
                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium flex items-center gap-1.5">
                                    <Check size={14} />
                                    Saved as <span className="font-mono font-bold">{result.filename}</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] font-bold text-xs hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                >
                                    <RotateCcw size={13} /> Retake
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={uploading || !!result}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                                    ) : result ? (
                                        <><Check size={14} /> Saved!</>
                                    ) : (
                                        <><Send size={14} /> Upload to Repository</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Captures */}
            {recentCaptures.length > 0 && (
                <div className="pt-3 border-t border-[var(--glass-border)]">
                    <p className="text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-2">
                        Recent Captures This Session
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {recentCaptures.map((cap, i) => (
                            <div
                                key={`${cap.filename}-${i}`}
                                className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs"
                            >
                                <ImageIcon size={12} className="text-emerald-500" />
                                <span className="font-mono text-[var(--text-primary)] font-medium">{cap.filename}</span>
                                {cap.item_name && (
                                    <span className="text-[var(--text-secondary)]">({cap.item_name})</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
