import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, BarChart3, FolderSync, Plus, Search, RefreshCw, 
    X, Loader2, ImageIcon, Eye, EyeOff 
} from 'lucide-react';
import { inventoryApi } from '../../api';
import InventoryCard, { getImgSrc } from './InventoryCard';
import type { InventoryItem } from './InventoryCard';
import InventoryModal from './InventoryModal';
import SyncDashboard from './SyncDashboard';

interface Category { Id: number; Name: string; ForType?: string; }
interface Material { Id: number; Name: string; BullionRate?: number | null; }
interface Summary {
    totalItems: number; totalValuation: number;
    byMaterial: { material: string; itemCount: number; totalValue: number }[];
    byCategory: { category: string; itemCount: number }[];
}

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface InventoryLayoutProps {
    itemType: 'asset' | 'consumable';
    title: string;
    subtitle: string;
}

export default function InventoryLayout({ itemType, title, subtitle }: InventoryLayoutProps) {
    const [tab, setTab] = useState<'dashboard' | 'register' | 'sync' | 'auditlog'>('dashboard');
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterMat, setFilterMat] = useState('');
    const [showDeleted, setShowDeleted] = useState(false);

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(() => {
        const saved = localStorage.getItem('inventory_page_size');
        return saved ? parseInt(saved, 10) : 10;
    });
    const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [viewItem, setViewItem] = useState<InventoryItem | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const params: any = { item_type: itemType, include_deleted: showDeleted };
            if (search) params.search = search;
            if (filterCat) params.category = filterCat;
            if (filterMat) params.material = filterMat;

            const [itemsRes, catsRes, matsRes, sumRes] = await Promise.all([
                inventoryApi.listItems(params),
                inventoryApi.listCategories(itemType),
                inventoryApi.listMaterials(),
                inventoryApi.summary({ item_type: itemType })
            ]);

            setItems(itemsRes.data);
            setCategories(catsRes.data);
            setMaterials(matsRes.data);
            setSummary(sumRes.data);
        } catch (e) {
            console.error('Error loading inventory data', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [itemType, search, filterCat, filterMat, showDeleted]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterCat, filterMat, showDeleted]);

    const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSoftDelete = async (id: number) => {
        try {
            await inventoryApi.deleteItem(id, false, 'Deleted by user');
            setViewItem(null);
            loadData();
        } catch (e) {
            console.error('Failed to soft delete', e);
        }
    };

    const handleRestore = async (id: number) => {
        try {
            await inventoryApi.restoreItem(id);
            setViewItem(null);
            loadData();
        } catch (e) {
            console.error('Failed to restore item', e);
        }
    };

    const handleRevalue = async () => {
        try {
            await inventoryApi.revalueAll();
            loadData();
        } catch (e) {
            console.error('Failed to revalue', e);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Package className="text-emerald-500" size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">{title}</h1>
                        <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-1">
                {[
                    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                    { key: 'register', label: 'Item Register', icon: Package },
                    { key: 'sync', label: 'Image Sync', icon: FolderSync },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key as any)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            tab === t.key
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {tab === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-md">
                                    <p className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">Total Items</p>
                                    <p className="text-2xl font-black text-[var(--text-primary)]">{summary?.totalItems || 0}</p>
                                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">Active items recorded</p>
                                </div>
                                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5 backdrop-blur-md">
                                    <p className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">Total Valuation</p>
                                    <p className="text-2xl font-black text-[var(--text-primary)]">{fmt(summary?.totalValuation || 0)}</p>
                                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">Current ledger valuation</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 backdrop-blur-md">
                                    <p className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">Categories</p>
                                    <p className="text-2xl font-black text-[var(--text-primary)]">{summary?.byCategory?.length || 0}</p>
                                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">Active categories</p>
                                </div>
                            </div>

                            {itemType === 'asset' && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleRevalue}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/30 transition-colors"
                                    >
                                        <RefreshCw size={14} /> Revalue Precious Metals
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'sync' && <SyncDashboard />}

                    {tab === 'register' && (
                        <div className="space-y-4">
                            {/* Filter Toolbar */}
                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="flex-1 min-w-[200px] relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search items..."
                                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] focus:outline-none"
                                    />
                                    {search && (
                                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-secondary)]">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                <select
                                    value={filterCat}
                                    onChange={e => setFilterCat(e.target.value)}
                                    className="px-3 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(c => <option key={c.Id} value={c.Name}>{c.Name}</option>)}
                                </select>

                                {itemType === 'asset' && (
                                    <select
                                        value={filterMat}
                                        onChange={e => setFilterMat(e.target.value)}
                                        className="px-3 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                                    >
                                        <option value="">All Materials</option>
                                        {materials.map(m => <option key={m.Id} value={m.Name}>{m.Name}</option>)}
                                    </select>
                                )}

                                <button
                                    onClick={() => setShowDeleted(!showDeleted)}
                                    className={`flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                                        showDeleted
                                            ? 'bg-red-500/10 border-red-500/30 text-red-500'
                                            : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                                    }`}
                                >
                                    {showDeleted ? <EyeOff size={14} /> : <Eye size={14} />}
                                    {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
                                </button>

                                <button
                                    onClick={() => { setEditItem(null); setIsModalOpen(true); }}
                                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    <Plus size={16} /> Add Item
                                </button>

                                <div className="flex items-center gap-2 ml-auto">
                                    <span className="text-xs text-[var(--text-secondary)] font-medium">Rows:</span>
                                    <select
                                        value={pageSize}
                                        onChange={e => {
                                            const newSize = Number(e.target.value);
                                            setPageSize(newSize);
                                            localStorage.setItem('inventory_page_size', String(newSize));
                                            setCurrentPage(1);
                                        }}
                                        className="px-2 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)]"
                                    >
                                        {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Main Table / Grid */}
                            {loading ? (
                                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-500" size={28} /></div>
                            ) : items.length === 0 ? (
                                <div className="text-center py-16 text-[var(--text-secondary)]">
                                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                                    <p>No items found</p>
                                </div>
                            ) : (
                                <>
                                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-[var(--glass-bg)] text-left text-[var(--text-secondary)] text-xs uppercase">
                                                    <th className="px-4 py-3">#</th>
                                                    <th className="px-4 py-3">Image</th>
                                                    <th className="px-4 py-3">Name</th>
                                                    <th className="px-4 py-3">Category</th>
                                                    {itemType === 'asset' ? <th className="px-4 py-3">Material</th> : <th className="px-4 py-3">UOM</th>}
                                                    <th className="px-4 py-3 text-right">Unit Price</th>
                                                    <th className="px-4 py-3 text-right">Qty</th>
                                                    <th className="px-4 py-3 text-right">Total Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedItems.map((item, i) => (
                                                    <tr
                                                        key={item.ItemId}
                                                        onClick={() => setViewItem(item)}
                                                        className={`border-t border-[var(--glass-border)] cursor-pointer hover:bg-emerald-500/10 ${
                                                            item.IsDeleted ? 'bg-red-500/5 opacity-60' : i % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.02] dark:bg-white/[0.02]'
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{item.ItemId}</td>
                                                        <td className="px-4 py-3">
                                                            {getImgSrc(item.ImageLink, item.Category) ? (
                                                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--glass-border)] bg-black/5 dark:bg-white/5">
                                                                    <img src={getImgSrc(item.ImageLink, item.Category)!} alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--text-secondary)] opacity-30">
                                                                    <ImageIcon size={16} />
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{item.Name}</td>
                                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{item.Category || '—'}</td>
                                                        {itemType === 'asset' ? (
                                                            <td className="px-4 py-3 text-[var(--text-secondary)]">{item.Material || '—'}</td>
                                                        ) : (
                                                            <td className="px-4 py-3 text-[var(--text-secondary)]">{item.UOM || 'Nos'}</td>
                                                        )}
                                                        <td className="px-4 py-3 text-right font-mono">{fmt(item.UnitPrice)}</td>
                                                        <td className="px-4 py-3 text-right font-mono">{item.Quantity}</td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmt(item.TotalValue)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="grid grid-cols-1 gap-4 md:hidden">
                                        {paginatedItems.map(item => (
                                            <InventoryCard
                                                key={item.ItemId}
                                                item={item}
                                                itemType={itemType}
                                                onClick={() => setViewItem(item)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <InventoryModal
                    item={editItem}
                    itemType={itemType}
                    categories={categories}
                    materials={materials}
                    onClose={() => setIsModalOpen(false)}
                    onSaved={() => { setIsModalOpen(false); loadData(); }}
                />
            )}

            {/* Details Modal */}
            {viewItem && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setViewItem(null)}>
                    <div className="bg-[var(--bg-dark)] border border-[var(--glass-border)] rounded-3xl p-0 max-w-4xl w-full overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                        
                        {/* Left Side: Image */}
                        <div className="w-full md:w-1/2 bg-black/5 dark:bg-white/5 relative min-h-[300px] flex items-center justify-center border-b md:border-b-0 md:border-r border-[var(--glass-border)]">
                            {getImgSrc(viewItem.ImageLink, viewItem.Category) ? (
                                <img src={getImgSrc(viewItem.ImageLink, viewItem.Category)!} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="text-[var(--text-secondary)] flex flex-col items-center opacity-30">
                                    <ImageIcon size={48} className="mb-2" />
                                    <span>No Image Available</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Right Side: Information */}
                        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] leading-tight">{viewItem.Name}</h3>
                                    <p className="text-sm font-mono text-[var(--text-secondary)] mt-1">ID: #{viewItem.ItemId}</p>
                                </div>
                                <button onClick={() => setViewItem(null)} className="p-2 bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            
                            <div className="space-y-4 text-sm mb-8 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl">
                                        <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Category</p>
                                        <p className="font-bold text-[var(--text-primary)]">{viewItem.Category || '—'}</p>
                                    </div>
                                    {itemType === 'asset' ? (
                                        <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl">
                                            <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Material</p>
                                            <p className="font-bold text-[var(--text-primary)]">{viewItem.Material || '—'}</p>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl">
                                            <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">UOM</p>
                                            <p className="font-bold text-[var(--text-primary)]">{viewItem.UOM || 'Nos'}</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl">
                                        <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Unit Price</p>
                                        <p className="font-mono font-bold text-[var(--text-primary)]">{fmt(viewItem.UnitPrice)}</p>
                                    </div>
                                    <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl">
                                        <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Quantity</p>
                                        <p className="font-mono font-bold text-[var(--text-primary)]">{viewItem.Quantity}</p>
                                    </div>
                                </div>
                                
                                {itemType === 'asset' && viewItem.WeightGrams && (
                                    <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl">
                                        <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Weight</p>
                                        <p className="font-bold text-[var(--text-primary)]">{viewItem.WeightGrams}g</p>
                                    </div>
                                )}
                                
                                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl">
                                    <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Total Valuation</p>
                                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{fmt(viewItem.TotalValue)}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 justify-end mt-auto pt-6 border-t border-[var(--glass-border)]">
                                {viewItem.IsDeleted ? (
                                    <button onClick={() => handleRestore(viewItem.ItemId)} className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20">Restore Item</button>
                                ) : (
                                    <>
                                        <button onClick={() => handleSoftDelete(viewItem.ItemId)} className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-colors">Delete</button>
                                        <button onClick={() => { setEditItem(viewItem); setViewItem(null); setIsModalOpen(true); }} className="flex-1 px-4 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors">Edit Item</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
