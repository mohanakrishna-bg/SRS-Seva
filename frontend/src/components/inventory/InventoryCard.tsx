import { ImageIcon } from 'lucide-react';

export interface InventoryItem {
    ItemId: number;
    Name: string;
    Description?: string;
    Category?: string;
    ItemType?: string;
    UOM?: string;
    Material?: string;
    WeightGrams?: number;
    Purity?: number;
    UnitPrice: number;
    Quantity: number;
    TotalValue: number;
    GSTRate?: number;
    HSNCode?: string;
    IsMaintainable?: boolean;
    AddedOnDate?: string;
    ImagePath?: string;
    ImageLink?: string;
    IsDeleted: boolean;
    NeedsReview?: boolean;
    CreatedAt?: string;
    UpdatedAt?: string;
}

const isHttpUrl = (str: string) => {
    try { return new URL(str).protocol.startsWith('http'); } 
    catch { return false; }
};

export const getImgSrc = (link?: string, category?: string) => {
    if (!link) return null;
    if (isHttpUrl(link)) return link;
    if (link.includes('/')) return `/uploads/photos/${link}`;
    const slug = (category || 'uncategorized').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    return `/uploads/photos/${slug}/${link}`;
};

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface InventoryCardProps {
    item: InventoryItem;
    itemType: 'asset' | 'consumable';
    onClick: () => void;
}

export default function InventoryCard({ item, itemType, onClick }: InventoryCardProps) {
    return (
        <div 
            onClick={onClick}
            className={`p-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] transition-all active:scale-[0.98] cursor-pointer ${
                item.IsDeleted 
                    ? 'bg-red-500/5 opacity-60' 
                    : item.NeedsReview 
                        ? 'bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5' 
                        : 'hover:border-emerald-500/30'
            }`}
        >
            <div className="flex gap-4 items-start">
                {/* Thumbnail Image */}
                {getImgSrc(item.ImageLink, item.Category) ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-[var(--glass-border)] shrink-0 bg-black/5 dark:bg-white/5 relative">
                        <img 
                            src={getImgSrc(item.ImageLink, item.Category)!} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={e => { 
                                e.currentTarget.style.display = 'none'; 
                                if (e.currentTarget.parentElement) {
                                    e.currentTarget.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" class="text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z"/></svg>';
                                }
                            }} 
                        />
                    </div>
                ) : (
                    <div className="w-20 h-20 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 text-[var(--text-secondary)] opacity-30">
                        <ImageIcon size={28} />
                    </div>
                )}

                {/* Content Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]">#{item.ItemId}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            (item as any).AcquisitionMode === 'donation'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                            {(item as any).AcquisitionMode === 'donation' ? '🎁 Donation' : '🏷️ Purchase'}
                        </span>
                    </div>

                    <h4 className={`font-bold truncate text-base mt-0.5 ${item.IsDeleted ? 'line-through text-red-400' : 'text-[var(--text-primary)]'}`}>
                        {item.Name}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{item.Category || 'Uncategorized'}</p>

                    <div className="flex flex-wrap gap-2 mt-2">
                        {itemType === 'asset' && item.Material && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                item.Material === 'Gold' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                item.Material === 'Silver' ? 'bg-slate-300/30 text-slate-600 dark:text-slate-300' :
                                'bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]'
                            }`}>
                                {item.Material}
                            </span>
                        )}
                        {itemType === 'asset' && item.WeightGrams && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] font-mono">
                                {item.WeightGrams}g
                            </span>
                        )}
                        {itemType === 'consumable' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/5 dark:bg-white/5 text-[var(--text-secondary)]">
                                UOM: {item.UOM || 'Nos'}
                            </span>
                        )}
                        {item.NeedsReview && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-500 animate-pulse uppercase">Review</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[var(--glass-border)] flex justify-between items-center text-xs">
                <div className="text-[var(--text-secondary)]">
                    Qty: <span className="font-mono font-bold text-[var(--text-primary)]">{item.Quantity}</span>
                </div>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {fmt(item.TotalValue)}
                </div>
            </div>
        </div>
    );
}
