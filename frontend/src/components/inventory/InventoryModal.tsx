import { useState, useRef } from 'react';
import { X, Loader2, Camera, Upload, Check } from 'lucide-react';
import { inventoryApi, uploadApi } from '../../api';
import MediaCaptureModal from '../MediaCaptureModal';
import TransliteratedInput from '../TransliteratedInput';
import GlobalInputToolbar from '../GlobalInputToolbar';
import type { InventoryItem } from './InventoryCard';

interface Category { Id: number; Name: string; ForType?: string; }
interface Material { Id: number; Name: string; BullionRate?: number | null; }

interface InventoryModalProps {
    item: InventoryItem | null;
    itemType: 'asset' | 'consumable';
    categories: Category[];
    materials?: Material[];
    onClose: () => void;
    onSaved: () => void;
}

export default function InventoryModal({
    item,
    itemType,
    categories,
    materials = [],
    onClose,
    onSaved
}: InventoryModalProps) {
    const isEdit = !!item;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        Name: item?.Name || '',
        Description: item?.Description || '',
        Category: item?.Category || '',
        ItemType: itemType,
        UOM: item?.UOM || 'Nos',
        Material: item?.Material || '',
        WeightGrams: item?.WeightGrams?.toString() || '',
        UnitPrice: item?.UnitPrice?.toString() || '0',
        Quantity: item?.Quantity?.toString() || '1',
        IsMaintainable: item?.IsMaintainable || false,
        AddedOnDate: item?.AddedOnDate || new Date().toLocaleDateString('en-GB'),
        ImageLink: item?.ImageLink || '',
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [cameraOpen, setCameraOpen] = useState(false);

    const handleCameraCapture = async (file: File) => {
        try {
            setError('');
            const res = await uploadApi.image(file);
            setForm(prev => ({ ...prev, ImageLink: res.data.filename }));
            setCameraOpen(false);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Failed to capture image from camera");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        try {
            setError('');
            const res = await uploadApi.image(file);
            setForm(prev => ({ ...prev, ImageLink: res.data.filename }));
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Failed to upload image file");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.Name.trim()) {
            setError("Name is required");
            return;
        }

        setSaving(true);
        setError('');
        try {
            const payload: any = {
                Name: form.Name.trim(),
                Description: form.Description.trim() || undefined,
                Category: form.Category || undefined,
                ItemType: itemType,
                UnitPrice: parseFloat(form.UnitPrice) || 0,
                Quantity: parseInt(form.Quantity, 10) || 1,
                TotalValue: (parseFloat(form.UnitPrice) || 0) * (parseInt(form.Quantity, 10) || 1),
                AddedOnDate: form.AddedOnDate,
                ImageLink: form.ImageLink || undefined,
                NeedsReview: false,
            };

            if (itemType === 'asset') {
                payload.Material = form.Material || undefined;
                payload.WeightGrams = form.WeightGrams ? parseFloat(form.WeightGrams) : undefined;
                payload.IsMaintainable = form.IsMaintainable;
            } else {
                payload.UOM = form.UOM || 'Nos';
            }

            if (isEdit && item) {
                await inventoryApi.updateItem(item.ItemId, payload);
            } else {
                await inventoryApi.createItem(payload);
            }
            onSaved();
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Failed to save item");
        }
        setSaving(false);
    };

    const filteredCats = categories.filter(c => !c.ForType || c.ForType === itemType);

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
            <div className="bg-[var(--bg-dark)] border border-[var(--glass-border)] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--glass-border)] bg-black/10 dark:bg-white/5">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        {isEdit ? 'ಸಂಪಾದಿಸಿ (Edit Item)' : 'ಹೊಸ ಸೇರ್ಪಡೆ (Add New Item)'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)]">
                        <X size={18} />
                    </button>
                </div>

                <GlobalInputToolbar />

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">Item Name *</label>
                        <TransliteratedInput
                            value={form.Name}
                            onChange={val => setForm(prev => ({ ...prev, Name: val }))}
                            placeholder="e.g. Silver Lamp / ಬೆಳ್ಳಿ ದೀಪ"
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                        />
                    </div>

                    {/* Category & Material/UOM */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">Category</label>
                            <select
                                value={form.Category}
                                onChange={e => setForm(prev => ({ ...prev, Category: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                            >
                                <option value="">Select Category</option>
                                {filteredCats.map(c => (
                                    <option key={c.Id} value={c.Name}>{c.Name}</option>
                                ))}
                            </select>
                        </div>

                        {itemType === 'asset' ? (
                            <div>
                                <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">Material</label>
                                <select
                                    value={form.Material}
                                    onChange={e => setForm(prev => ({ ...prev, Material: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                                >
                                    <option value="">Select Material</option>
                                    {materials.map(m => (
                                        <option key={m.Id} value={m.Name}>{m.Name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">UOM (Unit of Measure)</label>
                                <input
                                    type="text"
                                    value={form.UOM}
                                    onChange={e => setForm(prev => ({ ...prev, UOM: e.target.value }))}
                                    placeholder="e.g. Kg, Ltr, Nos"
                                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                                />
                            </div>
                        )}
                    </div>

                    {/* Pricing & Quantities */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {itemType === 'asset' && (
                            <div>
                                <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">Weight (Grams)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.WeightGrams}
                                    onChange={e => setForm(prev => ({ ...prev, WeightGrams: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] font-mono"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">Unit Price (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.UnitPrice}
                                onChange={e => setForm(prev => ({ ...prev, UnitPrice: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-1">Quantity</label>
                            <input
                                type="number"
                                value={form.Quantity}
                                onChange={e => setForm(prev => ({ ...prev, Quantity: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] font-mono"
                            />
                        </div>
                    </div>

                    {/* Image Selection */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-2">Item Photo</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={form.ImageLink}
                                onChange={e => setForm(prev => ({ ...prev, ImageLink: e.target.value }))}
                                placeholder="Image filename or URL"
                                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setCameraOpen(true)}
                                className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                title="Camera"
                            >
                                <Camera size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                title="Upload File"
                            >
                                <Upload size={18} />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex gap-3 justify-end border-t border-[var(--glass-border)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] font-bold text-sm hover:bg-black/10 dark:hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            {saving ? 'Saving...' : 'Save Item'}
                        </button>
                    </div>
                </form>
            </div>

            <MediaCaptureModal
                isOpen={cameraOpen}
                type="photo"
                onClose={() => setCameraOpen(false)}
                onCapture={handleCameraCapture}
            />
        </div>
    );
}
