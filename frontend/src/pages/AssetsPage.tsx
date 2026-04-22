import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MediaCaptureModal from '../components/MediaCaptureModal';

const isHttpUrl = (str: string) => {
    try { return new URL(str).protocol.startsWith('http'); } 
    catch { return false; }
};
import TransliteratedInput from '../components/TransliteratedInput';
import GlobalInputToolbar from '../components/GlobalInputToolbar';
import ContextHelp from '../components/ContextHelp';

const getImgSrc = (link?: string, category?: string) => {
    if (!link) return null;
    if (isHttpUrl(link)) return link;
    // Normalized slug for category
    const slug = (category || 'uncategorized').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    // Check if it might be an uncategorized one (from recently unzipped)
    // Actually, fallback system logic:
    return `/uploads/photos/${slug}/${link}`;
};

import {
    Camera, ChevronLeft, ChevronRight, Upload,
    Package, BarChart3, ScrollText, Plus, Search, Edit3, Trash2, RefreshCw,
    ChevronDown, X, Loader2, AlertTriangle, ImageIcon, RotateCcw, Eye, EyeOff, Skull,
    FolderSync, Settings, FileArchive, Image as ImageIconLucide, CheckCircle2, XCircle, CloudUpload,
    HelpCircle
} from 'lucide-react';
import { inventoryApi, uploadApi } from '../api';
import { useInputContext } from '../context/InputContext';

/* ─── Types ─── */
interface InventoryItem {
    ItemId: number; Name: string; Description?: string; Category?: string;
    ItemType?: string; UOM?: string;
    Material?: string; WeightGrams?: number; UnitPrice: number; Quantity: number;
    TotalValue: number; GSTRate?: number; HSNCode?: string; IsMaintainable?: boolean;
    AddedOnDate?: string; ImagePath?: string; ImageLink?: string;
    IsDeleted: boolean; NeedsReview?: boolean; CreatedAt?: string; UpdatedAt?: string;
}
interface Category { Id: number; Name: string; ForType?: string; }
interface Material { Id: number; Name: string; BullionRate?: number | null; }
interface Location { LocationId: number; Name: string; Description?: string; }
interface AuditEntry {
    Id: number; Timestamp?: string; User?: string; Action: string;
    ItemId?: number; Details?: Record<string, any>;
}
interface Summary {
    totalItems: number; totalValuation: number;
    byMaterial: { material: string; itemCount: number; totalValue: number }[];
    byCategory: { category: string; itemCount: number }[];
}

const TABS = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'register', label: 'Asset Register', icon: Package },
    { key: 'auditlog', label: 'Audit Log', icon: ScrollText },
] as const;
type TabKey = typeof TABS[number]['key'];

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ================================================================== */
export default function AssetsPage() {
    const [tab, setTab] = useState<TabKey>('dashboard');
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterMat, setFilterMat] = useState('');

    const handleDrillDown = (filters: { material?: string; category?: string }) => {
        if (filters.material) {
            setFilterMat(filters.material);
            setFilterCat('');
            setSearch('');
        }
        if (filters.category) {
            setFilterCat(filters.category);
            setFilterMat('');
            setSearch('');
        }
        setTab('register');
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Package className="text-emerald-500" size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">Fixed Asset Register</h1>
                        <p className="text-xs text-[var(--text-secondary)]">ಸ್ಥಿರ ಆಸ್ತಿ ದಾಖಲೆ</p>
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-1">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                            ${tab === t.key
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Content area */}
            <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    {tab === 'dashboard'  && <DashboardTab onDrillDown={handleDrillDown} />}
                    {tab === 'register'   && (
                        <AssetRegisterTab 
                            search={search} setSearch={setSearch}
                            filterCat={filterCat} setFilterCat={setFilterCat}
                            filterMat={filterMat} setFilterMat={setFilterMat}
                        />
                    )}
                    {tab === 'auditlog'   && <AuditLogTab />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ================================================================== */
/*  DASHBOARD TAB                                                      */
/* ================================================================== */
function DashboardTab({ onDrillDown }: { onDrillDown: (f: { material?: string; category?: string }) => void }) {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [revaluing, setRevaluing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [editRate, setEditRate] = useState<{ id: number; rate: string } | null>(null);
    const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleString('en-IN'));

    const load = async () => {
        setLoading(true);
        try {
            const [s, m] = await Promise.all([inventoryApi.summary({ item_type: 'asset' }), inventoryApi.listMaterials()]);
            setSummary(s.data);
            setMaterials(m.data);
        } catch { /* ignore */ }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const handleSaveRate = async (mat: Material) => {
        if (!editRate) return;
        try {
            await inventoryApi.updateMaterial(mat.Id, { BullionRate: parseFloat(editRate.rate) });
            setEditRate(null);
            load();
        } catch { /* ignore */ }
    };

    const handleRevalue = async () => {
        setRevaluing(true);
        try {
            await inventoryApi.revalueAll();
            await load();
        } catch { /* ignore */ }
        setRevaluing(false);
    };

    const handleRefreshRates = async () => {
        setRefreshing(true);
        try {
            await inventoryApi.refreshBullionRates();
            setLastRefresh(new Date().toLocaleString('en-IN'));
            await load();
        } catch { /* ignore */ }
        setRefreshing(false);
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
    if (!summary) return <p className="text-center text-[var(--text-secondary)] py-10">Unable to load summary</p>;

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard label="Total Items" value={summary.totalItems.toString()} sub="Active assets" color="emerald" />
                <SummaryCard label="Total Valuation" value={fmt(summary.totalValuation)} sub="At current rates" color="amber" />
                <SummaryCard label="Categories" value={summary.byCategory.length.toString()} sub="Asset categories" color="blue" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* By Material */}
                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Valuation by Material
                    </h3>
                    <div className="space-y-3">
                        {summary.byMaterial.map(m => (
                            <div key={m.material} onClick={() => onDrillDown({ material: m.material })}
                                className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-emerald-500/5 cursor-pointer transition-colors group">
                                <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] font-medium">
                                    {m.material} <span className="text-xs opacity-60">({m.itemCount})</span>
                                </span>
                                <span className="font-mono font-bold text-[var(--text-primary)]">{fmt(m.totalValue)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By Category */}
                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> Items by Category
                    </h3>
                    <div className="space-y-3">
                        {summary.byCategory.map(c => (
                            <div key={c.category} onClick={() => onDrillDown({ category: c.category })}
                                className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-blue-500/5 cursor-pointer transition-colors group">
                                <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] font-medium">{c.category}</span>
                                <span className="font-mono font-bold text-[var(--text-primary)]">{c.itemCount}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bullion Rates */}
            <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" /> 
                        Bullion Rates (Bangalore - {lastRefresh})
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handleRefreshRates} disabled={refreshing}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                            <CloudUpload size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh Rates
                        </button>
                        <button onClick={handleRevalue} disabled={revaluing}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/30 transition-colors disabled:opacity-50">
                            <RefreshCw size={12} className={revaluing ? 'animate-spin' : ''} /> Revalue All
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                    {materials
                        .filter(mat => ['Gold', 'Silver'].includes(mat.Name))
                        .map(mat => {
                            const displayRate = mat.BullionRate;
                            return (
                                <div key={mat.Id} className="bg-black/5 dark:bg-white/5 rounded-xl p-3 text-sm border border-emerald-500/10">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-bold text-[var(--text-primary)]">{mat.Name}</p>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mat.Name === 'Gold' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-slate-500/20 text-slate-600'}`}>Bangalore</span>
                                    </div>
                                    {editRate?.id === mat.Id ? (
                                        <div className="flex gap-1 mt-1">
                                            <input type="number" value={editRate.rate} onChange={e => setEditRate({ ...editRate, rate: e.target.value })}
                                                className="w-24 px-2 py-1 rounded bg-white dark:bg-black/30 border border-[var(--glass-border)] text-xs font-mono" autoFocus />
                                            <button onClick={() => handleSaveRate(mat)} className="text-emerald-500 text-xs font-bold">✓</button>
                                            <button onClick={() => setEditRate(null)} className="text-red-400 text-xs font-bold">✕</button>
                                        </div>
                                    ) : (
                                        <p className="text-[var(--text-secondary)] mt-1 cursor-pointer hover:text-emerald-500 transition-colors"
                                            onClick={() => displayRate !== null && displayRate !== undefined ? setEditRate({ id: mat.Id, rate: displayRate.toString() }) : null}>
                                            ₹{displayRate}/gm
                                            <Edit3 size={10} className="inline ml-1 opacity-50" />
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
    const colors: Record<string, string> = {
        emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
        amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
        blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 backdrop-blur-md`}>
            <p className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">{label}</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">{sub}</p>
        </div>
    );
}


/* ================================================================== */
/*  ASSET REGISTER TAB                                                 */
/* ================================================================== */

function AssetRegisterTab({ 
    search, setSearch, 
    filterCat, setFilterCat, 
    filterMat, setFilterMat 
}: { 
    search: string; setSearch: (s: string) => void;
    filterCat: string; setFilterCat: (s: string) => void;
    filterMat: string; setFilterMat: (s: string) => void;
}) {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeleted, setShowDeleted] = useState(false);
    const typeFilter = 'asset';
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(() => {
        const saved = localStorage.getItem('inventory_page_size');
        return saved ? parseInt(saved) : 10;
    });
    const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [viewItem, setViewItem] = useState<InventoryItem | null>(null);
    const [previewImg, setPreviewImg] = useState<string | null>(null);
    const [captureModal, setCaptureModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        type: 'soft' | 'hard'; itemId: number; itemName: string;
    } | null>(null);
    const [delReason, setDelReason] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            if (filterCat) params.category = filterCat;
            if (filterMat) params.material = filterMat;
            if (typeFilter !== 'all') params.item_type = typeFilter;
            const [itemsRes, catsRes, matsRes] = await Promise.all([
                inventoryApi.listItems({ ...params, include_deleted: showDeleted }),
                inventoryApi.listCategories(), // always load all to allow toggling in form
                inventoryApi.listMaterials(),
            ]);
            setItems(itemsRes.data);
            setCategories(catsRes.data);
            setMaterials(matsRes.data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { load(); }, [search, filterCat, filterMat, showDeleted, typeFilter]);
    useEffect(() => { setCurrentPage(1); }, [search, filterCat, filterMat, showDeleted]);

    const activeItems = items.filter(i => !i.IsDeleted);
    const deletedItems = items.filter(i => i.IsDeleted);
    
    const totalPages = Math.ceil(items.length / pageSize);
    const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSoftDelete = async (id: number) => {
        if (!delReason.trim()) return;
        try {
            await inventoryApi.deleteItem(id, false, delReason.trim());
            setConfirmDialog(null);
            setDelReason('');
            setViewItem(null);
            load();
        } catch { /* ignore */ }
    };

    const handleHardDelete = async (id: number) => {
        try {
            await inventoryApi.deleteItem(id, true);
            setConfirmDialog(null);
            setViewItem(null);
            load();
        } catch { /* ignore */ }
    };

    const handleRestore = async (id: number) => {
        try {
            await inventoryApi.restoreItem(id);
            setViewItem(null);
            load();
        } catch { /* ignore */ }
    };

    const handleCaptureImage = async (file: File) => {
        if (!viewItem) return;
        try {
            const res = await uploadApi.image(file);
            await inventoryApi.updateItem(viewItem.ItemId, { ImageLink: res.data.filename });
            setCaptureModal(false);
            setViewItem({ ...viewItem, ImageLink: res.data.filename });
            load();
        } catch (e) {
            console.error("Failed to upload recaptured image", e);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!viewItem || !e.target.files?.[0]) return;
        const file = e.target.files[0];
        try {
            const res = await uploadApi.image(file);
            await inventoryApi.updateItem(viewItem.ItemId, { ImageLink: res.data.filename });
            setViewItem({ ...viewItem, ImageLink: res.data.filename });
            load();
        } catch (e) {
            console.error("Failed to upload image from file", e);
        }
    };

    const currentViewIndex = viewItem ? items.findIndex(i => i.ItemId === viewItem.ItemId) : -1;
    const canPrev = currentViewIndex > 0;
    const canNext = currentViewIndex !== -1 && currentViewIndex < items.length - 1;

    const handlePrevItem = () => {
        if (!canPrev) return;
        setViewItem(items[currentViewIndex - 1]);
    };

    const handleNextItem = () => {
        if (!canNext) return;
        setViewItem(items[currentViewIndex + 1]);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-500/30" />
                    {search && (
                        <button onClick={() => setSearch('')} title="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>


                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]">
                    <option value="">All Categories</option>
                    {categories.filter(c => typeFilter === 'all' || c.ForType === typeFilter).map(c => <option key={c.Id} value={c.Name}>{c.Name}</option>)}
                </select>
                <select value={filterMat} onChange={e => setFilterMat(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]">
                    <option value="">All Materials</option>
                    {materials.map(m => <option key={m.Id} value={m.Name}>{m.Name}</option>)}
                </select>
                <button onClick={() => setShowDeleted(!showDeleted)}
                    className={`flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        showDeleted
                            ? 'bg-red-500/10 border-red-500/30 text-red-500'
                            : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                    }`}>
                    {showDeleted ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
                    {showDeleted && deletedItems.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{deletedItems.length}</span>
                    )}
                </button>
                <button onClick={() => { setEditItem(null); setIsAddModalOpen(true); }}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                    <Plus size={16} /> Add Item
                </button>
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-[var(--text-secondary)] font-medium">Rows:</span>
                    <select value={pageSize} onChange={e => {
                        const newSize = Number(e.target.value);
                        setPageSize(newSize);
                        localStorage.setItem('inventory_page_size', String(newSize));
                        setCurrentPage(1);
                    }}
                        className="px-2 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none">
                        {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-500" size={28} /></div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-secondary)]">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No items found</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[var(--glass-bg)] text-left text-[var(--text-secondary)] text-xs uppercase cursor-default">
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Image</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Material</th>
                                <th className="px-4 py-3 text-right">Weight (g)</th>
                                <th className="px-4 py-3 text-right">Unit Price</th>
                                <th className="px-4 py-3 text-right">Qty</th>
                                <th className="px-4 py-3 text-right">Total Value</th>
                                <th className="px-4 py-3">Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedItems.map((item, i) => {
                                // Adaptive row padding based on page size
                                const pyClass = pageSize <= 5 ? 'py-6' : pageSize <= 10 ? 'py-4' : 'py-2';
                                return (
                                <tr key={item.ItemId}
                                    onClick={() => {
                                        if (item.NeedsReview) {
                                            setEditItem(item);
                                            setIsAddModalOpen(true);
                                        } else {
                                            setViewItem(item);
                                        }
                                    }}
                                    className={`border-t border-[var(--glass-border)] transition-colors cursor-pointer group ${
                                        item.IsDeleted
                                            ? 'bg-red-500/5 opacity-60 hover:opacity-80'
                                            : item.NeedsReview
                                                ? 'bg-amber-500/5 hover:bg-amber-500/10'
                                                : `hover:bg-emerald-500/10 ${i % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.02] dark:bg-white/[0.02]'}`
                                    }`}>
                                    <td className={`px-4 ${pyClass} font-mono text-xs text-[var(--text-secondary)] transition-all`}>{item.ItemId}</td>
                                    <td className={`px-4 ${pyClass} transition-all`}>
                                        {getImgSrc(item.ImageLink, item.Category) ? (
                                            <div className={`${pageSize <= 10 ? 'w-16 h-16' : 'w-10 h-10'} rounded-lg overflow-hidden border border-[var(--glass-border)] bg-black/5 dark:bg-white/5 relative transition-all`}>
                                                <img src={getImgSrc(item.ImageLink, item.Category)!} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" class="text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><circle cx="7" cy="7" r="7"/></svg>'; }} />
                                            </div>
                                        ) : (
                                            <div className={`${pageSize <= 10 ? 'w-16 h-16' : 'w-10 h-10'} rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center transition-all text-[var(--text-secondary)] opacity-30`}>
                                                <ImageIcon size={pageSize <= 10 ? 24 : 14} />
                                            </div>
                                        )}
                                    </td>
                                    <td className={`px-4 ${pyClass} transition-all`}>
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <p className={`font-bold transition-colors ${item.IsDeleted ? 'line-through text-red-400' : 'text-[var(--text-primary)] group-hover:text-[var(--primary)]'} ${pageSize <= 5 ? 'text-base' : 'text-sm'}`}>{item.Name}</p>
                                                {item.Description && <p className={`${pageSize <= 5 ? 'text-xs' : 'text-[10px]'} text-[var(--text-secondary)] mt-0.5`}>{item.Description}</p>}
                                            </div>
                                            {item.IsDeleted && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/20 text-red-500">Deleted</span>
                                            )}
                                            {item.NeedsReview && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-500 animate-pulse">ಹೊಸ (New)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`px-4 ${pyClass} text-[var(--text-secondary)] transition-all`}>{item.Category || '—'}</td>
                                        <td className={`px-4 ${pyClass} transition-all`}>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                item.Material === 'Gold' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                                item.Material === 'Silver' ? 'bg-slate-300/30 text-slate-600 dark:text-slate-300' :
                                                'bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]'
                                            }`}>
                                                {item.Material || '—'}
                                            </span>
                                        </td>
                                        <td className={`px-4 ${pyClass} text-right font-mono text-[var(--text-secondary)] transition-all`}>{item.WeightGrams ?? '—'}</td>
                                    <td className={`px-4 ${pyClass} text-right font-mono text-[var(--text-primary)] transition-all`}>{fmt(item.UnitPrice)}</td>
                                    <td className={`px-4 ${pyClass} text-right font-mono text-[var(--text-secondary)] transition-all`}>{item.Quantity}</td>
                                    <td className={`px-4 ${pyClass} text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 transition-all`}>{fmt(item.TotalValue)}</td>
                                    <td className={`px-4 ${pyClass} transition-all`}>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            (item as any).AcquisitionMode === 'donation'
                                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        }`}>
                                            {(item as any).AcquisitionMode === 'donation' ? '🎁 Donation' : '🏷️ Purchase'}
                                        </span>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--glass-border)]">
                            <span className="text-xs text-[var(--text-secondary)] font-medium">Page {currentPage} of {totalPages}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors disabled:opacity-30"><ChevronLeft size={16}/></button>
                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: totalPages }).map((_, i) => {
                                        const p = i + 1;
                                        if (totalPages > 6 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                                            if (p === 2 || p === totalPages - 1) return <span key={p} className="px-1 opacity-30">...</span>;
                                            return null;
                                        }
                                        return (
                                            <button key={p} onClick={() => setCurrentPage(p)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-black/5 text-[var(--text-secondary)]'}`}>
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors disabled:opacity-30"><ChevronRight size={16}/></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Total row */}
            {items.length > 0 && (
                <div className="flex justify-between items-center px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {activeItems.length} active items
                        {showDeleted && deletedItems.length > 0 && (
                            <span className="text-red-400 ml-2 font-normal">+ {deletedItems.length} deleted</span>
                        )}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Total: {fmt(activeItems.reduce((s, i) => s + (i.TotalValue || 0), 0))}
                    </span>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isAddModalOpen && createPortal(
                <ItemFormModal
                    item={editItem}
                    categories={categories}
                    materials={materials}
                    onClose={() => { setIsAddModalOpen(false); setEditItem(null); }}
                    onSaved={() => { 
                        setIsAddModalOpen(false); 
                        setEditItem(null); 
                        load(); 
                        if (viewItem) {
                            inventoryApi.getItem(viewItem.ItemId)
                                .then(res => setViewItem(res.data))
                                .catch(err => console.error("Failed to refresh view item:", err));
                        }
                    }}
                />,
                document.body
            )}

            {/* Item Details Modal */}
            {viewItem && createPortal(
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setViewItem(null)}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-[var(--bg-dark)] border border-[var(--glass-border)] rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] h-auto">
                        
                        {/* Image Section */}
                        <div className="md:w-1/2 relative bg-black/20 flex flex-col items-center justify-center min-h-[300px]">
                            {getImgSrc(viewItem.ImageLink, viewItem.Category) ? (
                                <img 
                                    src={getImgSrc(viewItem.ImageLink, viewItem.Category)!} 
                                    className="w-full h-full object-cover cursor-zoom-in" 
                                    alt={viewItem.Name}
                                    onClick={() => setPreviewImg(getImgSrc(viewItem.ImageLink, viewItem.Category)!)} 
                                />
                            ) : (
                                <div className="text-center p-6 text-[var(--text-secondary)] opacity-50">
                                    <ImageIcon size={64} className="mx-auto mb-2" />
                                    <p>No Image Available</p>
                                </div>
                            )}
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <button 
                                    onClick={() => setCaptureModal(true)}
                                    title="ಬೆಳಕು (Camera)"
                                    className="bg-[var(--primary)] text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform">
                                    <Camera size={18} />
                                </button>
                                <label title="ಅಪ್ಲೋಡ್ (Upload from File)" className="bg-emerald-500 text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer">
                                    <Upload size={18} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </label>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="md:w-1/2 p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className={`text-xl font-bold ${viewItem.IsDeleted ? 'line-through text-red-400' : 'text-[var(--text-primary)]'}`}>
                                        {viewItem.Name}
                                    </h2>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1 tracking-wider uppercase">{viewItem.Category || 'Uncategorized'}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handlePrevItem}
                                        disabled={!canPrev}
                                        title="Previous Item (ಹಿಂದಿನ)"
                                        className={`p-1.5 rounded-lg transition-colors ${!canPrev ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-primary)]'}`}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="flex flex-col items-center px-1 min-w-[32px]">
                                        <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                                            {currentViewIndex + 1} / {items.length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleNextItem}
                                        disabled={!canNext}
                                        title="Next Item (ಮುಂದಿನ)"
                                        className={`p-1.5 rounded-lg transition-colors ${!canNext ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-primary)]'}`}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                    <div className="w-1" />
                                    <button onClick={() => setViewItem(null)} className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-[var(--text-primary)]"><X size={16} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                            <p className="text-[10px] text-[var(--text-secondary)] uppercase">Material</p>
                                            <p className="font-bold text-sm">{viewItem.Material || '—'}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                            <p className="text-[10px] text-[var(--text-secondary)] uppercase">Weight</p>
                                            <p className="font-bold text-sm font-mono">{viewItem.WeightGrams ? `${viewItem.WeightGrams}g` : '—'}</p>
                                        </div>
                                <div className="p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                    <p className="text-[10px] text-[var(--text-secondary)] uppercase">Valuation</p>
                                    <p className="font-bold text-sm text-emerald-500 font-mono">{fmt(viewItem.TotalValue)}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                    <p className="text-[10px] text-[var(--text-secondary)] uppercase">Added On</p>
                                    <p className="font-bold text-sm font-mono">{viewItem.AddedOnDate || '—'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                    <p className="text-[10px] text-[var(--text-secondary)] uppercase">Source</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                                        (viewItem as any).AcquisitionMode === 'donation'
                                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    }`}>
                                        {(viewItem as any).AcquisitionMode === 'donation' ? '🎁 Donation' : '🏷️ Purchase'}
                                    </span>
                                </div>
                                {(viewItem as any).AcquisitionMode === 'donation' && (viewItem as any).DonorId && (
                                    <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                                        <p className="text-[10px] text-[var(--text-secondary)] uppercase">Donor</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Navigate to devotee — store in sessionStorage and go to Manage tab
                                                sessionStorage.setItem('highlight_devotee_id', String((viewItem as any).DonorId));
                                                window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'Manage' }));
                                            }}
                                            className="text-sm font-bold text-rose-600 dark:text-rose-400 hover:underline mt-0.5 text-left"
                                        >
                                            View Devotee #{(viewItem as any).DonorId} →
                                        </button>
                                    </div>
                                )}
                            </div>
                            

                            
                            {viewItem.Description && (
                                <div className="mb-6 p-4 rounded-xl bg-black/5 dark:bg-white/5 text-sm text-[var(--text-secondary)]">
                                    {viewItem.Description}
                                </div>
                            )}

                            <div className="mt-auto pt-4 flex gap-3 border-t border-[var(--glass-border)]">
                                {viewItem.IsDeleted ? (
                                    <>
                                        <button onClick={() => handleRestore(viewItem.ItemId)} className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold hover:bg-emerald-500/20 text-sm flex justify-center items-center gap-2"><RotateCcw size={16}/> Restore</button>
                                        <button onClick={() => setConfirmDialog({ type: 'hard', itemId: viewItem.ItemId, itemName: viewItem.Name })} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 text-sm flex justify-center items-center gap-2"><Skull size={16}/> Delete Forever</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setEditItem(viewItem); setIsAddModalOpen(true); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--primary)] text-white font-bold shadow-md hover:bg-orange-600 transition-colors text-sm">
                                            <Edit3 size={16} /> Edit
                                        </button>
                                        <button onClick={() => setConfirmDialog({ type: 'soft', itemId: viewItem.ItemId, itemName: viewItem.Name })} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors text-sm">
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* Image Preview (Full Size) */}
            {previewImg && createPortal(
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-6 cursor-zoom-out" onClick={() => setPreviewImg(null)}>
                    <div className="relative w-full h-full flex items-center justify-center">
                        <button onClick={() => setPreviewImg(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm"><X size={20} /></button>
                        <img src={previewImg} alt="Asset Full preview" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>,
                document.body
            )}
            
            {/* Camera Capture Modal */}
            {captureModal && (
                <MediaCaptureModal
                    isOpen={captureModal}
                    type="photo"
                    onClose={() => setCaptureModal(false)}
                    onCapture={handleCaptureImage}
                    title="Recapture Image"
                />
            )}

            {/* Delete Confirmation Dialog */}
            {confirmDialog && createPortal(
                <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-[var(--bg-dark)] border border-[var(--glass-border)] rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            {confirmDialog.type === 'hard' ? (
                                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                    <Skull className="text-red-500" size={20} />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                    <Trash2 className="text-amber-500" size={20} />
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)]">
                                    {confirmDialog.type === 'hard' ? 'Permanently Delete?' : 'Delete Item?'}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    {confirmDialog.itemName}
                                </p>
                            </div>
                        </div>

                        {confirmDialog.type === 'hard' ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                                <p className="text-sm text-red-500 font-medium flex items-center gap-2">
                                    <AlertTriangle size={14} /> This action is irreversible
                                </p>
                                <p className="text-xs text-red-400 mt-1">
                                    This will <strong>permanently remove</strong> the item from the register.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-4">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    This will mark the item as deleted. You can restore it later.
                                </p>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Reason for deletion *</label>
                                    <textarea 
                                        value={delReason} 
                                        onChange={e => setDelReason(e.target.value)}
                                        placeholder="e.g. Scrapped, Lost, Sold..."
                                        className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/30 min-h-[80px] resize-none"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                             <button onClick={() => { setConfirmDialog(null); setDelReason(''); }}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                             <button
                                onClick={() => confirmDialog.type === 'hard'
                                    ? handleHardDelete(confirmDialog.itemId)
                                    : handleSoftDelete(confirmDialog.itemId)
                                }
                                disabled={confirmDialog.type === 'soft' && !delReason.trim()}
                                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    confirmDialog.type === 'hard'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-amber-500 hover:bg-amber-600'
                                }`}
                            >
                                {confirmDialog.type === 'hard' ? <><Skull size={14} /> Delete Forever</> : <><Trash2 size={14} /> Delete</>}
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
}

function ItemFormModal({ item, categories, materials, onClose, onSaved }: {
    item: InventoryItem | null; categories: Category[]; materials: Material[];
    onClose: () => void; onSaved: () => void;
}) {
    const isEdit = !!item;
    const [uncatImages, setUncatImages] = useState<string[]>([]);
    const [browsingMode, setBrowsingMode] = useState<'uncategorized' | 'category' | null>(null);
    const [browseCategory, setBrowseCategory] = useState<string>(item?.Category || '');
    const [browsingFiles, setBrowsingFiles] = useState<string[]>([]);
    const [selectedUncatImg, setSelectedUncatImg] = useState<string>('');
    const [loadingImages, setLoadingImages] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        Name: item?.Name || '',
        Description: item?.Description || '',
        Category: item?.Category || '',
        ItemType: 'asset',
        Material: item?.Material || '',
        WeightGrams: item?.WeightGrams?.toString() || '',
        UnitPrice: item?.UnitPrice?.toString() || '',
        Quantity: item?.Quantity?.toString() || '1',
        IsMaintainable: item?.IsMaintainable || false,
        AddedOnDate: item?.AddedOnDate || new Date().toLocaleDateString('en-GB'),
        ImageLink: item?.ImageLink || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const { setGlobalLang } = useInputContext();

    const loadImages = async (cat?: string) => {
        setLoadingImages(true);
        try {
            const r = await inventoryApi.browseImages(cat);
            if (!cat || cat.toLowerCase() === 'uncategorized') {
                setUncatImages(r.data);
            }
            setBrowsingFiles(r.data);
        } catch (e) { 
            console.error(e); 
            setBrowsingFiles([]);
        }
        setLoadingImages(false);
    };
    const handleDiscardImg = async (filename: string) => {
        if (!window.confirm("Permanently delete this photo from the pending pool?")) return;
        try {
            await inventoryApi.discardUncategorizedImage(filename);
            loadImages('uncategorized');
        } catch (e) {
            console.error("Failed to discard image", e);
        }
    };


    const detectLanguage = (data: any) => {
        let knCount = 0;
        let enCount = 0;
        const knRegex = /[\u0C80-\u0CFF]/; // Kannada Unicode range
        const enRegex = /[a-zA-Z]/;

        const checkValue = (val: any) => {
            if (typeof val === 'string') {
                for (const char of val) {
                    if (knRegex.test(char)) knCount++;
                    else if (enRegex.test(char)) enCount++;
                }
            } else if (typeof val === 'object' && val !== null) {
                Object.values(val).forEach(checkValue);
            }
        };

        checkValue(data);
        return knCount >= enCount ? 'kn' : 'en';
    };

    useEffect(() => {
        if (isEdit && item) {
            setGlobalLang(detectLanguage(item));
        } else {
            // For new items, maybe look at first few pending images names?
            // Or just default to the user's last preference (default context).
        }
        
        if (!isEdit) {
            loadImages('uncategorized');
        }
    }, [isEdit, item]);

    useEffect(() => {
        if (browsingMode === 'category') {
            loadImages(browseCategory);
        } else if (browsingMode === 'uncategorized') {
            loadImages('uncategorized');
        }
    }, [browsingMode, browseCategory]);

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            await inventoryApi.uploadToUncategorized(files);
            await loadImages('uncategorized');
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Upload failed');
        }
        setUploading(false);
    };

    // Auto-calculate unit price for precious metals
    const selectedMat = materials.find(m => m.Name === form.Material);
    const autoPriceAvailable = selectedMat?.BullionRate && form.WeightGrams;
    const autoPrice = autoPriceAvailable ? (selectedMat!.BullionRate! * parseFloat(form.WeightGrams || '0')) : null;

    const handleSubmit = async () => {
        if (!form.Name.trim()) { setError('Name is required'); return; }
        if (!form.Category) { setError('Category is required'); return; }
        
        setSaving(true);
        setError('');
        try {
            const payload: any = {
                Name: form.Name,
                Description: form.Description || null,
                Category: form.Category,
                ItemType: 'asset',
                Material: form.Material || null,
                WeightGrams: form.WeightGrams ? parseFloat(form.WeightGrams) : null,
                UnitPrice: form.UnitPrice ? parseFloat(form.UnitPrice) : (autoPrice || 0),
                Quantity: parseInt(form.Quantity) || 1,
                IsMaintainable: form.IsMaintainable || false,
                AddedOnDate: form.AddedOnDate || null,
                ImageLink: form.ImageLink || null,
            };
            if (selectedUncatImg) {
                payload.UncategorizedFilename = selectedUncatImg;
            }
            if (isEdit) {
                await inventoryApi.updateItem(item!.ItemId, payload);
            } else {
                await inventoryApi.createItem(payload);
            }
            onSaved();
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to save');
        }
        setSaving(false);
    };

    const getPreviewUrl = (filename: string, mode: 'uncategorized' | 'category' | null, catName?: string) => {
        if (!filename) return '';
        if (isHttpUrl(filename)) return filename;
        if (mode === 'uncategorized' || selectedUncatImg === filename) {
            return `/uploads/photos/uncategorized/${filename}`;
        }
        const slug = (catName || 'uncategorized').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        return `/uploads/photos/${slug}/${filename}`;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-[var(--bg-dark)] border border-[var(--glass-border)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-[var(--glass-border)] shrink-0">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">{isEdit ? 'Edit Item' : 'Add New Item'}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"><X size={18} /></button>
                </div>
                <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] flex justify-end shrink-0">
                    <GlobalInputToolbar />
                </div>
                
                <div className="p-5 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column (Image Management) */}
                    <div className="flex flex-col space-y-4 md:border-r border-[var(--glass-border)] md:pr-6">
                        <AnimatePresence mode="wait">
                            {browsingMode ? (
                                <motion.div key="browsing" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex flex-col h-full space-y-4">
                                    <div className="flex flex-col space-y-3">
                                        <div className="flex items-center justify-between">
                                            <button onClick={() => setBrowsingMode(null)} className="flex items-center gap-1 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                                <ChevronLeft size={16} /> Back to Preview
                                            </button>
                                            <span className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1">
                                                Browsing Mode
                                                <ContextHelp title="Photo Search" content="Pending Photos includes any newly unzipped ZIP files or individual uploads. Select a category to browse existing photos already assigned to that section." />
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={browsingMode === 'uncategorized' ? 'uncategorized' : browseCategory} 
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'uncategorized') setBrowsingMode('uncategorized');
                                                    else {
                                                        setBrowsingMode('category');
                                                        setBrowseCategory(val);
                                                    }
                                                }}
                                                className="form-input text-xs flex-1"
                                            >
                                                <option value="uncategorized">Pending Photos (Uncategorized)</option>
                                                {categories.filter(c => c.ForType === 'asset').map(c => <option key={c.Id} value={c.Name}>{c.Name}</option>)}
                                            </select>
                                            {browsingMode === 'uncategorized' && (
                                                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                                                    <Upload size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-[350px] rounded-xl border-2 border-dashed border-[var(--glass-border)] overflow-y-auto p-2 custom-scrollbar">
                                        {loadingImages ? (
                                            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
                                        ) : browsingFiles.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40">
                                                <ImageIconLucide size={40} className="mb-2" />
                                                <p className="text-sm font-medium">No images found in this folder</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-3">
                                                {browsingFiles.map(img => (
                                                    <div key={img} className="relative group/img aspect-square">
                                                        <div onClick={() => {
                                                            if (browsingMode === 'uncategorized') {
                                                                setSelectedUncatImg(img);
                                                                setForm({ ...form, ImageLink: img });
                                                            } else {
                                                                setSelectedUncatImg('');
                                                                setForm({ ...form, ImageLink: img });
                                                            }
                                                            setBrowsingMode(null);
                                                        }}
                                                            className="w-full h-full cursor-pointer rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-500 hover:scale-[1.05] transition-all bg-black/10">
                                                            <img src={getPreviewUrl(img, browsingMode, browseCategory)} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        {browsingMode === 'uncategorized' && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDiscardImg(img); }}
                                                                className="absolute top-1 right-1 p-1.5 rounded-lg bg-red-500 text-white opacity-0 group-hover/img:opacity-100 transition-opacity transform hover:scale-110 shadow-lg"
                                                                title="Discard photo"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="preview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex flex-col h-full space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                                            {isEdit ? 'Asset Image' : 'Selected Photo'}
                                            <ContextHelp title="Photo Selection" content="Open 'Pending Pool' to see recently uploaded files. Use 'Browse Folders' to pick a photo already stored in a category." />
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {/* Redundant icons removed */}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-[350px] rounded-2xl overflow-hidden border-2 border-[var(--glass-border)] bg-black/20 shadow-inner group relative flex items-center justify-center">
                                        {form.ImageLink || selectedUncatImg ? (
                                            <>
                                                <img 
                                                    src={getPreviewUrl(selectedUncatImg || form.ImageLink, selectedUncatImg ? 'uncategorized' : 'category', form.Category)}
                                                    alt="Asset" 
                                                    className="w-full h-full object-contain"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                    <button onClick={() => setBrowsingMode('uncategorized')} className="flex flex-col items-center gap-2 text-white hover:scale-110 transition-transform">
                                                        <Camera size={32} />
                                                        <span className="text-[10px] font-bold uppercase">Pending Pool</span>
                                                    </button>
                                                    <button onClick={() => { setBrowsingMode('category'); setBrowseCategory(form.Category || 'uncategorized'); }} className="flex flex-col items-center gap-2 text-white hover:scale-110 transition-transform">
                                                        <FolderSync size={32} />
                                                        <span className="text-[10px] font-bold uppercase">Browse Files</span>
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-[var(--text-secondary)] opacity-30">
                                                <ImageIconLucide size={64} />
                                                <p className="font-bold mt-2">No Image Selected</p>
                                            </div>
                                        )}
                                        
                                        {(selectedUncatImg || form.ImageLink) && (
                                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                                                    {selectedUncatImg ? 'From Pending Pool' : 'Saved Path'}
                                                </p>
                                                <p className="text-xs font-mono text-white truncate">{selectedUncatImg || form.ImageLink}</p>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" multiple accept=".zip,image/*" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column (Form) */}
                    <div className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}

                        {item?.NeedsReview && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm border border-amber-500/20">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span>ಈ ಐಟಂ ಫೋಟೋ ಸಿಂಕ್ ಮೂಲಕ ಸೇರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ. (This item was added via photo sync. Please fill in the details.)</span>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase flex items-center gap-1">
                                Name *
                                <ContextHelp title="Input Translation" content="Type phonetically in English to see Kannada suggestions. Adjust the language mode using the bar at the bottom." />
                            </label>
                            <TransliteratedInput value={form.Name} onChange={v => setForm({ ...form, Name: v })}
                                placeholder="e.g. Bangarada Kireeta" />
                        </div>

                        <FormField label="Description / Size">
                            <TransliteratedInput value={form.Description} onChange={v => setForm({ ...form, Description: v })}
                                multiline placeholder="e.g. Utsava Murthi, 6 inches" />
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Category *">
                                <select value={form.Category} onChange={e => setForm({ ...form, Category: e.target.value })} className="form-input">
                                    <option value="">Select...</option>
                                    {categories.filter(c => c.ForType === 'asset').map(c => <option key={c.Id} value={c.Name}>{c.Name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Material">
                                <select value={form.Material} onChange={e => setForm({ ...form, Material: e.target.value })} className="form-input">
                                    <option value="">Select...</option>
                                    {materials.map(m => <option key={m.Id} value={m.Name}>{m.Name}</option>)}
                                </select>
                            </FormField>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField label="Weight (g)">
                                <input type="number" step="0.01" value={form.WeightGrams} onChange={e => setForm({ ...form, WeightGrams: e.target.value })}
                                    className="form-input font-mono" placeholder="0.00" />
                            </FormField>
                            <FormField label="Unit Price (₹)">
                                <input type="number" step="0.01" value={form.UnitPrice} onChange={e => setForm({ ...form, UnitPrice: e.target.value })}
                                    className="form-input font-mono" placeholder={autoPrice ? autoPrice.toFixed(2) : '0.00'} />
                            </FormField>
                            <FormField label="Quantity">
                                <input type="number" min="1" value={form.Quantity} onChange={e => setForm({ ...form, Quantity: e.target.value })}
                                    className="form-input font-mono" />
                            </FormField>
                        </div>

                        {autoPrice !== null && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                                💡 Auto-calculated price for {form.Material}: {form.WeightGrams}g × ₹{selectedMat?.BullionRate}/gm = <strong>₹{autoPrice.toFixed(2)}</strong>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Added on">
                                <input value={form.AddedOnDate} onChange={e => setForm({ ...form, AddedOnDate: e.target.value })}
                                    className="form-input" placeholder="DD/MM/YYYY" />
                            </FormField>
                            {(!selectedUncatImg || isEdit) && (
                                <FormField label="Image Link">
                                    <input value={form.ImageLink} onChange={e => setForm({ ...form, ImageLink: e.target.value })}
                                        className="form-input text-xs font-mono" placeholder="Internal or URL" />
                                </FormField>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-5 border-t border-[var(--glass-border)] shrink-0 bg-[var(--bg-dark)]">
                    <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="flex items-center gap-1 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg disabled:opacity-50">
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {isEdit ? 'Update' : 'Add Item'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">{label}</label>
            {children}
        </div>
    );
}


/* ================================================================== */
/*  AUDIT LOG TAB                                                      */
/* ================================================================== */
function AuditLogTab() {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await inventoryApi.auditLog({ limit: 200 });
                setEntries(res.data);
            } catch { /* ignore */ }
            setLoading(false);
        })();
    }, []);

    const actionColor = (action: string) => {
        if (action.includes('Addition')) return 'text-emerald-500 bg-emerald-500/10';
        if (action.includes('Modification') || action.includes('Revaluation')) return 'text-blue-500 bg-blue-500/10';
        if (action.includes('Delete')) return 'text-red-500 bg-red-500/10';
        return 'text-[var(--text-secondary)] bg-black/5';
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={28} /></div>;

    return (
        <div className="space-y-3">
            {entries.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-secondary)]">
                    <ScrollText size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No audit entries yet</p>
                </div>
            ) : entries.map(e => (
                <div key={e.Id} className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === e.Id ? null : e.Id)}>
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${actionColor(e.Action)}`}>{e.Action}</span>
                            <span className="text-sm text-[var(--text-primary)] font-medium">Item #{e.ItemId}</span>
                            <span className="text-xs text-[var(--text-secondary)]">by {e.User || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-secondary)]">
                                {e.Timestamp ? new Date(e.Timestamp).toLocaleString('en-IN') : '—'}
                            </span>
                            <ChevronDown size={14} className={`text-[var(--text-secondary)] transition-transform ${expanded === e.Id ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                    {expanded === e.Id && e.Details && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3 border-t border-[var(--glass-border)] space-y-3">
                            {e.Details.reason && (
                                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">Reason for Deletion</p>
                                    <p className="text-sm text-[var(--text-primary)] italic">"{e.Details.reason}"</p>
                                </div>
                            )}
                            
                            {e.Details.changes && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {Object.entries(e.Details.changes).map(([field, delta]: [string, any]) => (
                                        <div key={field} className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)]">
                                            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">{field}</p>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-red-500 line-through opacity-70">{String(delta.old ?? '—')}</span>
                                                <span className="text-[var(--text-secondary)]">→</span>
                                                <span className="text-emerald-500 font-bold">{String(delta.new ?? '—')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <TechnicalDetails details={e.Details} />
                        </motion.div>
                    )}
                </div>
            ))}
        </div>
    );
}


function TechnicalDetails({ details }: { details: any }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="pt-2">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline flex items-center gap-1"
            >
                {open ? 'Hide technical details' : 'View technical source data (JSON)'}
            </button>
            {open && (
                <pre className="mt-2 p-3 rounded-lg bg-black/10 dark:bg-white/5 text-[10px] font-mono text-[var(--text-secondary)] overflow-x-auto border border-[var(--glass-border)]">
                    {JSON.stringify(details, null, 2)}
                </pre>
            )}
        </div>
    );
}

