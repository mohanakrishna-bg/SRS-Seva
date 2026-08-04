import { useState, useRef } from 'react';
import { X, Loader2, Camera, Upload, Check, RefreshCw, Trash2, ImageIcon, FolderSync, Smartphone } from 'lucide-react';
import { inventoryApi, uploadApi } from '../../api';
import MediaCaptureModal from '../MediaCaptureModal';
import TransliteratedInput from '../TransliteratedInput';
import GlobalInputToolbar from '../GlobalInputToolbar';
import ImageRepositoryModal from './ImageRepositoryModal';
import { getImgSrc } from './InventoryCard';
import type { InventoryItem } from './InventoryCard';

interface Category { Id: number; Name: string; ForType?: string; }
interface Material { Id: number; Name: string; BullionRate?: number | null; }

interface InventoryModalProps {
    item: InventoryItem | null;
    itemType: 'asset' | 'consumable';
    categories: Category[];
    materials?: Material[];
    items?: InventoryItem[];
    onClose: () => void;
    onSaved: () => void;
}

export default function InventoryModal({
    item,
    itemType,
    categories,
    materials = [],
    items = [],
    onClose,
    onSaved
}: InventoryModalProps) {
    const isEdit = !!item;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mobileCameraRef = useRef<HTMLInputElement>(null);

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
    const [repoModalOpen, setRepoModalOpen] = useState(false);

    const handleCameraCapture = async (file: File) => {
        try {
            setError('');
            // Use quickCapture to save directly to the image repository
            const res = await inventoryApi.quickCapture(file, {
                item_name: form.Name || undefined,
                category: form.Category || undefined,
            });
            setForm(prev => ({ ...prev, ImageLink: res.data.path }));
            setCameraOpen(false);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Failed to capture image from camera");
        }
    };

    const handleMobileCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setError('');
            const res = await inventoryApi.quickCapture(file, {
                item_name: form.Name || undefined,
                category: form.Category || undefined,
            });
            setForm(prev => ({ ...prev, ImageLink: res.data.path }));
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Failed to upload camera capture");
        }
        // Reset the input
        if (mobileCameraRef.current) mobileCameraRef.current.value = '';
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 pt-3 sm:pt-4 backdrop-blur-md overflow-y-auto">
            <div className="bg-[var(--bg-dark)] border border-[var(--glass-border)] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-0 sm:my-2 max-h-[calc(100vh-2rem)] flex flex-col">
                {/* Modal Header */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-[var(--glass-border)] bg-black/10 dark:bg-white/5">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        {isEdit ? 'ಸಂಪಾದಿಸಿ' : 'ಹೊಸ ಸೇರ್ಪಡೆ'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)]">
                        <X size={18} />
                    </button>
                </div>

                <GlobalInputToolbar />

                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
                    {error && (
                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-0.5">Item Name *</label>
                        <TransliteratedInput
                            value={form.Name}
                            onChange={val => setForm(prev => ({ ...prev, Name: val }))}
                            placeholder="e.g. Silver Lamp / ಬೆಳ್ಳಿ ದೀಪ"
                            className="w-full px-3.5 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                        />
                    </div>

                    {/* Category & Material/UOM */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-0.5">Category</label>
                            <select
                                value={form.Category}
                                onChange={e => setForm(prev => ({ ...prev, Category: e.target.value }))}
                                className="w-full px-3.5 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                            >
                                <option value="">Select Category</option>
                                {filteredCats.map(c => (
                                    <option key={c.Id} value={c.Name}>{c.Name}</option>
                                ))}
                            </select>
                        </div>

                        {itemType === 'asset' ? (
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-0.5">Material</label>
                                <select
                                    value={form.Material}
                                    onChange={e => setForm(prev => ({ ...prev, Material: e.target.value }))}
                                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                                >
                                    <option value="">Select Material</option>
                                    {materials.map(m => (
                                        <option key={m.Id} value={m.Name}>{m.Name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-0.5">UOM (Unit of Measure)</label>
                                <input
                                    type="text"
                                    value={form.UOM}
                                    onChange={e => setForm(prev => ({ ...prev, UOM: e.target.value }))}
                                    placeholder="e.g. Kg, Ltr, Nos"
                                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                                />
                            </div>
                        )}
                    </div>

                    {/* Pricing & Quantities */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {itemType === 'asset' && (
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-0.5">Weight (Grams)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.WeightGrams}
                                    onChange={e => setForm(prev => ({ ...prev, WeightGrams: e.target.value }))}
                                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] font-mono"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-0.5">Unit Price (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.UnitPrice}
                                onChange={e => setForm(prev => ({ ...prev, UnitPrice: e.target.value }))}
                                className="w-full px-3.5 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-0.5">Quantity</label>
                            <input
                                type="number"
                                value={form.Quantity}
                                onChange={e => setForm(prev => ({ ...prev, Quantity: e.target.value }))}
                                className="w-full px-3.5 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] font-mono"
                            />
                        </div>
                    </div>

                    {/* Image Selection / Replacement */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-1">Item Photo</label>
                        {form.ImageLink ? (
                            <div className="p-2.5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-[var(--glass-border)] bg-black/10 shrink-0 relative flex items-center justify-center">
                                        {getImgSrc(form.ImageLink, form.Category) ? (
                                            <img
                                                src={getImgSrc(form.ImageLink, form.Category)!}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ImageIcon size={20} className="text-[var(--text-secondary)] opacity-40" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-[var(--text-primary)] truncate font-mono">{form.ImageLink}</p>
                                        <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Photo attached</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setRepoModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-xs font-bold transition-colors"
                                        title="Browse & select image from app repository"
                                    >
                                        <FolderSync size={14} /> Replace
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => mobileCameraRef.current?.click()}
                                        className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                                        title="Quick capture from mobile camera"
                                    >
                                        <Smartphone size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCameraOpen(true)}
                                        className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
                                        title="Take new photo with webcam"
                                    >
                                        <Camera size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, ImageLink: '' }))}
                                        className="p-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                        title="Remove photo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRepoModalOpen(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-blue-500/40 bg-blue-500/5 text-blue-500 text-xs font-bold hover:bg-blue-500/10 transition-colors"
                                >
                                    <FolderSync size={15} /> Select from Repository
                                </button>
                                <button
                                    type="button"
                                    onClick={() => mobileCameraRef.current?.click()}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 text-emerald-500 text-xs font-bold hover:bg-emerald-500/10 transition-colors"
                                >
                                    <Smartphone size={15} /> 📱 Quick Capture
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-purple-500/40 bg-purple-500/5 text-purple-500 text-xs font-bold hover:bg-purple-500/10 transition-colors"
                                >
                                    <Upload size={15} /> Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCameraOpen(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 text-amber-500 text-xs font-bold hover:bg-amber-500/10 transition-colors"
                                >
                                    <Camera size={15} /> Webcam
                                </button>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/jpeg,image/png,image/webp" />
                        <input type="file" ref={mobileCameraRef} onChange={handleMobileCameraCapture} className="hidden" accept="image/jpeg,image/png,image/webp" capture="environment" />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 flex gap-3 justify-end border-t border-[var(--glass-border)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] font-bold text-sm hover:bg-black/10 dark:hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
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

            <ImageRepositoryModal
                isOpen={repoModalOpen}
                onClose={() => setRepoModalOpen(false)}
                onSelectImage={(filename) => setForm(prev => ({ ...prev, ImageLink: filename }))}
                currentImage={form.ImageLink}
                items={items}
                categories={categories}
            />
        </div>
    );
}
