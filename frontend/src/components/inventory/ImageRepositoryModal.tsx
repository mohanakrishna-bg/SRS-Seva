import { useState, useEffect } from 'react';
import { X, Search, Loader2, Upload, Check, FolderSync, Image as ImageIcon } from 'lucide-react';
import { inventoryApi, uploadApi } from '../../api';
import { getImgSrc } from './InventoryCard';

interface Category { Id: number; Name: string; ForType?: string; }
interface InventoryItem { ItemId: number; Name: string; ImageLink?: string | null; Category?: string | null; [key: string]: any; }

interface ImageRepositoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectImage: (filename: string) => void;
    currentImage?: string;
    items?: InventoryItem[];
    categories?: Category[];
}

export default function ImageRepositoryModal({
    isOpen,
    onClose,
    onSelectImage,
    currentImage,
    items = [],
    categories = []
}: ImageRepositoryModalProps) {
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const loadImages = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await inventoryApi.browseImages('all');
            setImages(res.data || []);
        } catch (e: any) {
            console.error('Failed to load image repository', e);
            setError('Failed to load images from repository');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            loadImages();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter images
    const filteredImages = images.filter(img => {
        if (search && !img.toLowerCase().includes(search.toLowerCase())) return false;
        if (selectedCategory !== 'all') {
            // Check if the image belongs to the selected category based on the path
            const expectedPrefix = selectedCategory.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + '/';
            if (selectedCategory === 'uncategorized') {
                return img.startsWith('uncategorized/');
            }
            return img.startsWith(expectedPrefix);
        }
        return true;
    });

    // Sort images based on the order they appear in `items`
    const imageOrder = new Map<string, number>();
    items.forEach((item, index) => {
        if (item.ImageLink) {
            const link = item.ImageLink.toLowerCase();
            if (!imageOrder.has(link)) {
                imageOrder.set(link, index);
            }
            const filename = link.split('/').pop()!;
            if (!imageOrder.has(filename)) {
                imageOrder.set(filename, index);
            }
        }
    });

    const sortedImages = [...filteredImages].sort((a, b) => {
        const aLower = a.toLowerCase();
        const aName = aLower.split('/').pop()!;
        const bLower = b.toLowerCase();
        const bName = bLower.split('/').pop()!;
        
        let aIndex = imageOrder.has(aLower) ? imageOrder.get(aLower)! : (imageOrder.has(aName) ? imageOrder.get(aName)! : Infinity);
        let bIndex = imageOrder.has(bLower) ? imageOrder.get(bLower)! : (imageOrder.has(bName) ? imageOrder.get(bName)! : Infinity);

        if (aIndex !== bIndex) {
            return aIndex < bIndex ? -1 : 1;
        }
        return a.localeCompare(b);
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setUploading(true);
        setError('');
        try {
            const res = await uploadApi.image(file);
            const newFilename = res.data.filename;
            await loadImages();
            onSelectImage(newFilename);
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to upload new image to repository');
        }
        setUploading(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 pt-3 sm:pt-4 backdrop-blur-md overflow-y-auto">
            <div className="bg-[var(--bg-dark)] border border-[var(--glass-border)] rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-0 sm:my-2 max-h-[calc(100vh-3rem)] flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-center px-5 py-3.5 border-b border-[var(--glass-border)] bg-black/10 dark:bg-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                            <FolderSync size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[var(--text-primary)]">Application Image Repository</h3>
                            <p className="text-[11px] text-[var(--text-secondary)]">Browse & select images from application storage</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)]">
                        <X size={18} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-[var(--glass-border)] flex flex-wrap gap-3 items-center justify-between bg-black/5 dark:bg-white/[0.02]">
                    <div className="flex gap-2 flex-1 min-w-[200px]">
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search repository images..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="w-1/3 px-3 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)]"
                        >
                            <option value="all">All Categories</option>
                            <option value="uncategorized">Uncategorized</option>
                            {categories.map(c => (
                                <option key={c.Id} value={c.Name}>{c.Name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-600 cursor-pointer transition-colors shadow-md shadow-blue-500/20">
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        <span>{uploading ? 'Uploading...' : 'Upload New File'}</span>
                        <input type="file" onChange={handleFileUpload} accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} />
                    </label>
                </div>

                {/* Content Grid */}
                <div className="p-4 overflow-y-auto flex-1 max-h-[60vh]">
                    {error && (
                        <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
                            <Loader2 className="animate-spin text-blue-500 mb-2" size={28} />
                            <p className="text-xs">Loading application image repository...</p>
                        </div>
                    ) : sortedImages.length === 0 ? (
                        <div className="text-center py-12 text-[var(--text-secondary)]">
                            <ImageIcon size={36} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium">No images found in repository</p>
                            {(search || selectedCategory !== 'all') && <p className="text-xs mt-1">Try clearing your search or filters</p>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {sortedImages.map((filename) => {
                                const isSelected = currentImage === filename || currentImage?.endsWith(filename);
                                const src = getImgSrc(filename);
                                return (
                                    <div
                                        key={filename}
                                        onClick={() => {
                                            onSelectImage(filename);
                                            onClose();
                                        }}
                                        className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 bg-black/10 hover:shadow-lg ${
                                            isSelected 
                                                ? 'border-emerald-500 ring-2 ring-emerald-500/30' 
                                                : 'border-[var(--glass-border)] hover:border-blue-500/50'
                                        }`}
                                    >
                                        <div className="aspect-square relative flex items-center justify-center overflow-hidden bg-black/20">
                                            {src ? (
                                                <img 
                                                    src={src} 
                                                    alt={filename} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <ImageIcon size={24} className="opacity-30" />
                                            )}
                                            
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-white shadow-md">
                                                    <Check size={12} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 bg-[var(--glass-bg)] backdrop-blur-md">
                                            <p className="text-[11px] font-mono text-[var(--text-primary)] truncate font-medium" title={filename}>
                                                {filename.split('/').pop()}
                                            </p>
                                            {filename.includes('/') && (
                                                <p className="text-[9px] text-[var(--text-secondary)] truncate">
                                                    {filename.substring(0, filename.lastIndexOf('/'))}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-[var(--glass-border)] flex justify-between items-center bg-black/10 dark:bg-white/5 text-xs text-[var(--text-secondary)]">
                    <span>Total {images.length} images stored in app repository</span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 text-[var(--text-primary)] font-bold hover:bg-black/20"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
