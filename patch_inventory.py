import re

with open('frontend/src/pages/InventoryPage.tsx', 'r') as f:
    code = f.read()

# 1. Add new imports
if "import MediaCaptureModal" not in code:
    code = code.replace("import { createPortal } from 'react-dom';", "import { createPortal } from 'react-dom';\nimport MediaCaptureModal from '../components/MediaCaptureModal';\nimport { uploadApi } from '../api';")

code = code.replace("import {", "import {\n    Camera, ChevronLeft, ChevronRight,")

# 2. Add Helper to get image source
if "const getImgSrc" not in code:
    img_src_helper = """
const getImgSrc = (link?: string) => {
    if (!link) return null;
    if (isHttpUrl(link)) return link;
    return `/uploads/${link}`;
};
"""
    code = code.replace("const isHttpUrl =", img_src_helper + "const isHttpUrl =")

# 3. Rewrite AssetRegisterTab
tab_start = code.find("function AssetRegisterTab() {")
tab_end = code.find("/* ==================================================================", tab_start)

asset_tab_new = """
function AssetRegisterTab() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterMat, setFilterMat] = useState('');
    const [showDeleted, setShowDeleted] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [viewItem, setViewItem] = useState<InventoryItem | null>(null);
    const [previewImg, setPreviewImg] = useState<string | null>(null);
    const [captureModal, setCaptureModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        type: 'soft' | 'hard'; itemId: number; itemName: string;
    } | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            if (filterCat) params.category = filterCat;
            if (filterMat) params.material = filterMat;
            const [itemsRes, catsRes, matsRes] = await Promise.all([
                inventoryApi.listItems({ ...params, include_deleted: showDeleted }),
                inventoryApi.listCategories(),
                inventoryApi.listMaterials(),
            ]);
            setItems(itemsRes.data);
            setCategories(catsRes.data);
            setMaterials(matsRes.data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { load(); }, [search, filterCat, filterMat, showDeleted]);
    useEffect(() => { setCurrentPage(1); }, [search, filterCat, filterMat, showDeleted]);

    const activeItems = items.filter(i => !i.IsDeleted);
    const deletedItems = items.filter(i => i.IsDeleted);
    
    const totalPages = Math.ceil(items.length / pageSize);
    const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSoftDelete = async (id: number) => {
        try {
            await inventoryApi.deleteItem(id, false);
            setConfirmDialog(null);
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

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-500/30" />
                </div>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.Id} value={c.Name}>{c.Name}</option>)}
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
                <button onClick={() => { setEditItem(null); setModalOpen(true); }}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                    <Plus size={16} /> Add Item
                </button>
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
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedItems.map((item, i) => (
                                <tr key={item.ItemId}
                                    onClick={() => setViewItem(item)}
                                    className={`border-t border-[var(--glass-border)] transition-colors cursor-pointer group ${
                                        item.IsDeleted
                                            ? 'bg-red-500/5 opacity-60 hover:opacity-80'
                                            : `hover:bg-emerald-500/10 ${i % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.02] dark:bg-white/[0.02]'}`
                                    }`}>
                                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{item.ItemId}</td>
                                    <td className="px-4 py-3">
                                        {getImgSrc(item.ImageLink) ? (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--glass-border)] bg-black/5 dark:bg-white/5 relative">
                                                <img src={getImgSrc(item.ImageLink)!} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" class="text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><circle cx="7" cy="7" r="7"/></svg>'; }} />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                                <ImageIcon size={14} className="text-[var(--text-secondary)] opacity-30" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <p className={`font-bold group-hover:text-[var(--primary)] transition-colors ${item.IsDeleted ? 'line-through text-red-400' : 'text-[var(--text-primary)]'}`}>{item.Name}</p>
                                                {item.Description && <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{item.Description}</p>}
                                            </div>
                                            {item.IsDeleted && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/20 text-red-500">Deleted</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[var(--text-secondary)]">{item.Category || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            item.Material === 'Gold' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                            item.Material === 'Silver' ? 'bg-slate-300/30 text-slate-600 dark:text-slate-300' :
                                            'bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]'
                                        }`}>
                                            {item.Material || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">{item.WeightGrams ?? '—'}</td>
                                    <td className="px-4 py-3 text-right font-mono text-[var(--text-primary)]">{fmt(item.UnitPrice)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">{item.Quantity}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmt(item.TotalValue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--glass-border)]">
                            <span className="text-xs text-[var(--text-secondary)]">Showing page {currentPage} of {totalPages}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 disabled:opacity-50"><ChevronLeft size={16}/></button>
                                <span className="text-sm font-mono px-2">{currentPage}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 disabled:opacity-50"><ChevronRight size={16}/></button>
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
            {modalOpen && createPortal(
                <ItemFormModal
                    item={editItem}
                    categories={categories}
                    materials={materials}
                    onClose={() => { setModalOpen(false); setEditItem(null); setViewItem(null); }}
                    onSaved={() => { setModalOpen(false); setEditItem(null); setViewItem(null); load(); }}
                />,
                document.body
            )}

            {/* Item Details Modal */}
            {viewItem && createPortal(
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewItem(null)}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-[var(--bg-dark)] border border-[var(--glass-border)] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row">
                        
                        {/* Image Section */}
                        <div className="md:w-1/2 relative bg-black/20 flex flex-col items-center justify-center min-h-[300px]">
                            {getImgSrc(viewItem.ImageLink) ? (
                                <img 
                                    src={getImgSrc(viewItem.ImageLink)!} 
                                    className="w-full h-full object-cover cursor-zoom-in" 
                                    alt={viewItem.Name}
                                    onClick={() => setPreviewImg(getImgSrc(viewItem.ImageLink)!)} 
                                />
                            ) : (
                                <div className="text-center p-6 text-[var(--text-secondary)] opacity-50">
                                    <ImageIcon size={64} className="mx-auto mb-2" />
                                    <p>No Image Available</p>
                                </div>
                            )}
                            <button 
                                onClick={() => setCaptureModal(true)}
                                className="absolute bottom-4 right-4 bg-[var(--primary)] text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform">
                                <Camera size={18} />
                            </button>
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
                                <button onClick={() => setViewItem(null)} className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20"><X size={16} /></button>
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
                                        <button onClick={() => { setEditItem(viewItem); setModalOpen(true); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--primary)] text-white font-bold shadow-md hover:bg-orange-600 transition-colors text-sm">
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
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                                This will mark the item as deleted. You can restore it later.
                            </p>
                        )}

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmDialog(null)}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmDialog.type === 'hard'
                                    ? handleHardDelete(confirmDialog.itemId)
                                    : handleSoftDelete(confirmDialog.itemId)
                                }
                                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-colors ${
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

"""
code = code[:tab_start] + asset_tab_new + code[tab_end:]

with open('frontend/src/pages/InventoryPage.tsx', 'w') as f:
    f.write(code)
