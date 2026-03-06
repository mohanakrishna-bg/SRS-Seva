import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, Phone, Mail, MapPin, MessageCircle, ChevronLeft, ChevronRight,
    Trash2, Edit3, Receipt, Users
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CustomerForm from '../components/CustomerForm';
import { customerApi } from '../api';
import { useToast } from '../components/Toast';

interface Customer {
    ID1: number;
    ID?: string;
    Name: string;
    Sgotra?: string;
    SNakshatra?: string;
    Address?: string;
    City?: string;
    Phone?: string;
    WhatsApp_Phone?: string;
    Email_ID?: string;
    Google_Maps_Location?: string;
}

interface CustomersPageProps {
    onIssueReceipt: (customer: Customer) => void;
}

const PAGE_SIZE = 25;

export default function CustomersPage({ onIssueReceipt }: CustomersPageProps) {
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const { showToast } = useToast();

    // Fetch all customers on mount
    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await customerApi.list();
            setAllCustomers(res.data);
        } catch (err) {
            showToast('error', 'ಭಕ್ತರ ಪಟ್ಟಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ');
        } finally {
            setLoading(false);
        }
    };

    // Client-side search filtering
    const filteredCustomers = useMemo(() => {
        if (!searchQuery.trim()) return allCustomers;
        const q = searchQuery.toLowerCase();
        return allCustomers.filter((c) =>
            (c.Name?.toLowerCase().includes(q)) ||
            (c.Phone?.toLowerCase().includes(q)) ||
            (c.City?.toLowerCase().includes(q)) ||
            (c.Sgotra?.toLowerCase().includes(q)) ||
            (c.ID?.toLowerCase().includes(q))
        );
    }, [allCustomers, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    // Reset page and selections on search
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
    }, [searchQuery]);

    const handleSearch = useCallback((q: string) => {
        setSearchQuery(q);
    }, []);

    const handleAddCustomer = async (data: any) => {
        try {
            if (data.ID1) {
                await customerApi.update(data.ID1, data);
                showToast('success', `${data.Name} ನವೀಕರಿಸಲಾಗಿದೆ`);
            } else {
                await customerApi.create(data);
                showToast('success', `${data.Name} ಸೇರಿಸಲಾಗಿದೆ`);
            }
            setShowForm(false);
            fetchCustomers();
        } catch (err) {
            showToast('error', data.ID1 ? 'ನವೀಕರಿಸಲಾಗಲಿಲ್ಲ' : 'ಭಕ್ತರನ್ನು ಸೇರಿಸಲಾಗಲಿಲ್ಲ');
        }
    };

    const handleEditCustomer = async (data: any) => {
        if (!editCustomer) return;
        try {
            await customerApi.update(editCustomer.ID1, data);
            showToast('success', `${data.Name} ನವೀಕರಿಸಲಾಗಿದೆ`);
            setEditCustomer(null);
            fetchCustomers();
        } catch (err) {
            showToast('error', 'ನವೀಕರಿಸಲಾಗಲಿಲ್ಲ');
        }
    };

    const handleDeleteCustomer = async (c: Customer) => {
        if (!confirm(`${c.Name} ಅಳಿಸಬೇಕೇ?`)) return;
        try {
            await customerApi.delete(c.ID1);
            showToast('success', `${c.Name} ಅಳಿಸಲಾಗಿದೆ`);
            setSelectedIds(prev => prev.filter(id => id !== c.ID1));
            fetchCustomers();
        } catch (err) {
            showToast('error', 'ಅಳಿಸಲಾಗಲಿಲ್ಲ');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`ಆಯ್ಕೆ ಮಾಡಿದ ${selectedIds.length} ಭಕ್ತರನ್ನು ಅಳಿಸಬೇಕೇ? (Delete ${selectedIds.length} devotees?)`)) return;
        try {
            for (const id of selectedIds) {
                await customerApi.delete(id);
            }
            showToast('success', `${selectedIds.length} ಭಕ್ತರನ್ನು ಅಳಿಸಲಾಗಿದೆ`);
            setSelectedIds([]);
            fetchCustomers();
        } catch (err) {
            showToast('error', 'ಕೆಲವು ಭಕ್ತರನ್ನು ಅಳಿಸಲಾಗಲಿಲ್ಲ');
            fetchCustomers();
        }
    };

    const handleBulkUpdateAttempt = () => {
        if (selectedIds.length === 1) {
            const c = allCustomers.find(cust => cust.ID1 === selectedIds[0]);
            if (c) {
                setEditCustomer(c);
                setShowForm(true);
            }
        } else if (selectedIds.length > 1) {
            showToast('error', 'ನವೀಕರಣವನ್ನು ಒಮ್ಮೆಗೆ ಒಂದು ಮಾತ್ರ ಮಾಡಬಹುದು (Update can be performed only one at a time)');
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedCustomers.length && paginatedCustomers.length > 0) {
            // Deselect all on current page
            const currentPageIds = paginatedCustomers.map(c => c.ID1);
            setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            // Select all on current page
            const newIds = new Set(selectedIds);
            paginatedCustomers.forEach(c => newIds.add(c.ID1));
            setSelectedIds(Array.from(newIds));
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Users size={28} className="text-[var(--accent-blue)]" />
                        ಭಕ್ತರು
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {allCustomers.length.toLocaleString()} ರಲ್ಲಿ {filteredCustomers.length.toLocaleString()} ಭಕ್ತರು
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <SearchBar
                        placeholder="ಹೆಸರು, ಫೋನ್, ನಗರ, ಗೋತ್ರದಿಂದ ಹುಡುಕಿ..."
                        onSearch={handleSearch}
                    />
                    <button
                        onClick={() => { setEditCustomer(null); setShowForm(true); }}
                        className="btn-primary shrink-0 text-sm"
                    >
                        <Plus size={16} /> ಸೇರಿಸಿ
                    </button>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                    <span className="text-sm font-medium text-[var(--primary)] flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center bg-[var(--primary)] text-white rounded-full text-xs">{selectedIds.length}</span>
                        ಭಕ್ತರನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ (Devotees selected)
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBulkUpdateAttempt}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${selectedIds.length === 1
                                    ? 'bg-white dark:bg-slate-800 text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'
                                    : 'opacity-50 cursor-not-allowed bg-white/50 dark:bg-slate-800/50 text-[var(--text-secondary)]'
                                }`}
                        >
                            <Edit3 size={14} /> ನವೀಕರಿಸಿ (Update)
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        >
                            <Trash2 size={14} /> ಅಳಿಸಿ (Delete)
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/10">
                                <th className="pb-3 pt-1 w-10 pl-4">
                                    <input
                                        type="checkbox"
                                        checked={paginatedCustomers.length > 0 && selectedIds.length === paginatedCustomers.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                                    />
                                </th>
                                <th className="pb-3 pt-1 font-semibold text-[var(--text-secondary)] uppercase text-xs">ಹೆಸರು ಮತ್ತು ಗೋತ್ರ</th>
                                <th className="pb-3 pt-1 font-semibold text-[var(--text-secondary)] uppercase text-xs">ಸಂಪರ್ಕ</th>
                                <th className="pb-3 pt-1 font-semibold text-[var(--text-secondary)] uppercase text-xs hidden md:table-cell">ಸ್ಥಳ</th>
                                <th className="pb-3 pt-1 font-semibold text-[var(--text-secondary)] uppercase text-xs text-right">ಕ್ರಿಯೆಗಳು</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCustomers.map((c) => (
                                <tr
                                    key={c.ID1}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'A' && (e.target as HTMLElement).tagName !== 'INPUT') {
                                            toggleSelection(c.ID1);
                                        }
                                    }}
                                    className={`border-b border-black/5 hover:bg-black/[0.02] transition-colors group cursor-pointer ${selectedIds.includes(c.ID1) ? 'bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10' : ''}`}
                                >
                                    <td className="py-3.5 pl-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(c.ID1)}
                                            onChange={() => toggleSelection(c.ID1)}
                                            className="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                                        />
                                    </td>
                                    <td className="py-3.5">
                                        <p className="font-medium">{c.Name || 'Unnamed'}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {c.Sgotra || '—'} • {c.SNakshatra || '—'}
                                        </p>
                                    </td>
                                    <td className="py-3.5">
                                        <div className="flex flex-col gap-0.5 text-sm text-[var(--text-secondary)]">
                                            {c.Phone && <span className="flex items-center gap-1.5"><Phone size={11} />{c.Phone}</span>}
                                            {c.WhatsApp_Phone && <span className="flex items-center gap-1.5 text-green-400"><MessageCircle size={11} />{c.WhatsApp_Phone}</span>}
                                            {c.Email_ID && <span className="flex items-center gap-1.5"><Mail size={11} />{c.Email_ID}</span>}
                                            {!c.Phone && !c.Email_ID && <span className="text-slate-600">—</span>}
                                        </div>
                                    </td>
                                    <td className="py-3.5 text-sm text-slate-400 hidden md:table-cell">
                                        {c.City || '—'}
                                        {c.Google_Maps_Location && (
                                            <a href={c.Google_Maps_Location} target="_blank" rel="noreferrer" className="block text-[var(--accent-blue)] text-xs mt-0.5 hover:underline">
                                                <MapPin size={10} className="inline mr-1" />ನಕ್ಷೆ
                                            </a>
                                        )}
                                    </td>
                                    <td className="py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onIssueReceipt(c)}
                                                className="px-2.5 py-1.5 bg-[var(--primary)]/80 hover:bg-[var(--primary)] text-white text-xs rounded-md transition-colors flex items-center gap-1"
                                            >
                                                <Receipt size={12} /> ರಸೀದಿ
                                            </button>
                                            <button
                                                onClick={() => { setEditCustomer(c); setShowForm(true); }}
                                                className="p-1.5 rounded-md hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCustomer(c)}
                                                className="p-1.5 rounded-md hover:bg-red-50 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {paginatedCustomers.length === 0 && !loading && (
                        <div className="text-center py-12 text-slate-500">
                            {searchQuery ? `"${searchQuery}" ಗೆ ಫಲಿತಾಂಶಗಳಿಲ್ಲ` : 'ಭಕ್ತರು ಕಂಡುಬಂದಿಲ್ಲ'}
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-12 text-slate-500">ಭಕ್ತರು ಲೋಡ್ ಆಗುತ್ತಿದೆ...</div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-black/10 px-1">
                        <p className="text-xs text-slate-500">
                            ಪುಟ {currentPage} / {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {/* Page number buttons */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                                const page = start + i;
                                if (page > totalPages) return null;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'hover:bg-black/5 text-slate-400'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Customer Form Modal */}
            <CustomerForm
                isOpen={showForm}
                onClose={() => { setShowForm(false); setEditCustomer(null); }}
                onSubmit={editCustomer ? handleEditCustomer : handleAddCustomer}
                initialData={editCustomer || undefined}
                title={editCustomer ? `${editCustomer.Name} ಬದಲಿಸಿ` : 'ಹೊಸ ಭಕ್ತರನ್ನು ಸೇರಿಸಿ'}
            />
        </motion.div>
    );
}
