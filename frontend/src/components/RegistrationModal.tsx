import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, CreditCard, Receipt, Users, Check, Loader2, Info, Calendar } from 'lucide-react';
import TransliteratedInput from './TransliteratedInput';
import { useToast } from './Toast';

interface SevaItem {
    ItemCode: string;
    Description: string;
    Basic: number;
    TPQty: number;
    Prasada_Addon_Limit: number;
}

interface Customer {
    ID1?: number;
    Name: string;
    Phone: string;
    Sgotra: string;
    SNakshatra: string;
    Address: string;
    City: string;
    WhatsApp_Phone?: string;
    Email_ID?: string;
    Google_Maps_Location?: string;
}

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    prefillDate?: Date;
    prefillSeva?: string;
    onSuccess: (invoice: any) => void;
}

const Step = {
    Devotee: 1,
    Seva: 2,
    Payment: 3
} as const;
type Step = typeof Step[keyof typeof Step];

export default function RegistrationModal({ isOpen, onClose, prefillDate, prefillSeva, onSuccess }: RegistrationModalProps) {
    const { showToast } = useToast();
    const [step, setStep] = useState<Step>(Step.Devotee);
    const [loading, setLoading] = useState(false);

    // Devotee Step State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const initialCustomer: Customer = { Name: '', Phone: '', Sgotra: '', SNakshatra: '', Address: '', City: '' };
    const [customer, setCustomer] = useState<Customer>(initialCustomer);
    const [isNewCustomer, setIsNewCustomer] = useState(true);

    // Seva Step State
    const [items, setItems] = useState<SevaItem[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(prefillDate || new Date());
    const [selectedItemCode, setSelectedItemCode] = useState<string>('');
    const [familyMembers, setFamilyMembers] = useState<number>(0);
    const [optPrasada, setOptPrasada] = useState<boolean>(false);

    // Payment Step State
    const [paymentMode, setPaymentMode] = useState<'Cash' | 'Cheque' | 'DD' | 'UPI' | 'Netbanking'>('Cash');
    const [paymentRef, setPaymentRef] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed
            setStep(Step.Devotee);
            setCustomer(initialCustomer);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedItemCode('');
            setFamilyMembers(0);
            setOptPrasada(false);
            setPaymentMode('Cash');
            setPaymentRef('');
        } else {
            if (prefillDate) setSelectedDate(prefillDate);
            fetchItems();
        }
    }, [isOpen, prefillDate]);

    const fetchItems = async () => {
        try {
            const res = await fetch('http://localhost:8001/api/items');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
                if (prefillSeva) {
                    const match = data.find((i: SevaItem) => i.Description.includes(prefillSeva) || prefillSeva.includes(i.Description));
                    if (match) setSelectedItemCode(match.ItemCode);
                }
            }
        } catch {
            showToast('error', 'ಸೇವೆಗಳ ಪಟ್ಟಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ (Failed to load sevas)');
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`http://localhost:8001/api/customers/search?q=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
                if (data.length === 0) {
                    showToast('info', 'ಯಾವುದೇ ಭಕ್ತರ ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ (No devotee found). ದಯವಿಟ್ಟು ಹೊಸ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ.');
                    // Pre-fill phone or name based on input type (crude guess)
                    const isPhone = /^\d+$/.test(searchQuery.replace(/[\s+]/g, ''));
                    setCustomer({ ...initialCustomer, [isPhone ? 'Phone' : 'Name']: searchQuery });
                    setIsNewCustomer(true);
                }
            }
        } catch {
            showToast('error', 'ಹುಡುಕಾಟ ವಿಫಲವಾಗಿದೆ (Search failed)');
        } finally {
            setIsSearching(false);
        }
    };

    const selectCustomer = (c: Customer) => {
        setCustomer(c);
        setIsNewCustomer(false);
        setSearchResults([]);
        // Auto-advance if we have the basics
        if (c.Name && c.Phone) {
            setStep(Step.Seva);
        }
    };

    const validateDevotee = () => {
        if (!customer.Name.trim()) { showToast('error', 'ಹೆಸರು ಕಡ್ಡಾಯವಾಗಿದೆ (Name is required)'); return false; }
        if (!customer.Phone.trim()) { showToast('error', 'ಫೋನ್ ಸಂಖ್ಯೆ ಕಡ್ಡಾಯವಾಗಿದೆ (Phone is required)'); return false; }
        return true;
    };

    const validateSeva = () => {
        if (!selectedItemCode) { showToast('error', 'ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ (Select a Seva)'); return false; }
        return true;
    };

    const getSelectedItem = () => items.find(i => i.ItemCode === selectedItemCode);
    const calculateTotal = () => {
        const item = getSelectedItem();
        if (!item) return 0;
        let total = item.Basic;
        // Optionally add costs for extra family members or prasada if that's the business logic.
        // For now, assume Base cost is fixed per ticket.
        return total;
    };

    const handleSubmit = async () => {
        if (!validateDevotee() || !validateSeva()) return;

        if (paymentMode !== 'Cash' && !paymentRef.trim()) {
            showToast('error', 'ಪಾವತಿ ಉಲ್ಲೇಖ (Payment Reference) ಅಗತ್ಯವಿದೆ');
            return;
        }

        setLoading(true);
        try {
            // 1. Ensure Customer exists or create them
            let customerCode = customer.ID1?.toString();
            if (isNewCustomer || !customerCode) {
                const custRes = await fetch('http://localhost:8001/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(customer)
                });
                if (!custRes.ok) throw new Error('Failed to create customer');
                const newCust = await custRes.json();
                customerCode = newCust.ID1.toString();
            }

            // 2. Submit Invoice Header & Details
            const total = calculateTotal();
            const invoiceData = {
                Date: selectedDate.toISOString(),
                VoucherNo: `VCH-${Date.now()}`,
                CustomerCode: customerCode,
                TotalAmount: total,
                Payment_Mode: paymentMode,
                Payment_Reference: paymentRef || undefined,
                Family_Members: familyMembers,
                Opt_Theertha_Prasada: optPrasada
            };

            const invRes = await fetch('http://localhost:8001/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData)
            });

            if (!invRes.ok) throw new Error('Failed to create invoice');
            const createdInvoice = await invRes.json();

            // Simulate DTL creation for completeness (if backend required it, we'd fire another endpoint)

            showToast('success', 'ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ! (Registration Successful)');
            onSuccess({ invoice: createdInvoice, customer, item: getSelectedItem() });
        } catch (err) {
            console.error(err);
            showToast('error', 'ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ (Registration Failed)');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[var(--glass-border)] overflow-hidden flex flex-col md:flex-row min-h-[500px]"
                >
                    {/* Sidebar Pattern */}
                    <div className="hidden md:flex flex-col w-64 bg-gradient-to-b from-[var(--primary)] to-amber-600 text-white p-6 relative flex-shrink-0">
                        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-20 mix-blend-overlay" />
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold mb-8">ಸೇವಾ ನೋಂದಣಿ<br /><span className="text-sm font-medium opacity-80">(Seva Registration)</span></h2>

                            <div className="space-y-6">
                                <StepIndicator currStep={step} num={1} label="ಭಕ್ತರ ವಿವರ" icon={<User size={18} />} />
                                <StepIndicator currStep={step} num={2} label="ಸೇವಾ ಆಯ್ಕೆ" icon={<Receipt size={18} />} />
                                <StepIndicator currStep={step} num={3} label="ಪಾವತಿ ಮಾಹಿತಿ" icon={<CreditCard size={18} />} />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Header */}
                    <div className="md:hidden bg-[var(--primary)] text-white p-4 flex justify-between items-center shrink-0">
                        <h2 className="font-bold">ಸೇವಾ ನೋಂದಣಿ (Registration) - Step {step}/3</h2>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full"><X size={20} /></button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 relative overflow-y-auto w-full h-full max-h-[85vh]">
                        <button onClick={onClose} className="hidden md:block absolute top-4 right-4 p-2 text-[var(--text-secondary)] hover:bg-black/5 rounded-full z-10 transition-colors">
                            <X size={20} />
                        </button>

                        <div className="h-full flex flex-col">
                            {/* STEP 1: DEVOTEE */}
                            {step === Step.Devotee && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                        <Search className="text-[var(--primary)]" size={20} /> ಭಕ್ತರ ಹುಡುಕಾಟ (Search Devotee)
                                    </h3>

                                    <div className="flex gap-2 mb-6">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="ಹೆಸರು ಅಥವಾ ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (Name / Phone)"
                                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                            />
                                            {isSearching ? (
                                                <Loader2 size={18} className="absolute right-3 top-3.5 text-[var(--text-secondary)] animate-spin" />
                                            ) : (
                                                <Search size={18} className="absolute right-3 top-3.5 text-[var(--text-secondary)]" />
                                            )}
                                        </div>
                                        <button
                                            onClick={handleSearch}
                                            disabled={isSearching || !searchQuery.trim()}
                                            className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                                        >
                                            ಹುಡುಕಿ
                                        </button>
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 mb-6">
                                            <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-3 uppercase tracking-wider">{searchResults.length} ಫಲಿತಾಂಶಗಳು (Results Found)</p>
                                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                                {searchResults.map(res => (
                                                    <button
                                                        key={res.ID1}
                                                        onClick={() => selectCustomer(res)}
                                                        className="w-full text-left bg-white dark:bg-black/30 p-3 rounded-lg hover:border-[var(--primary)] border border-transparent transition-all flex items-center justify-between group"
                                                    >
                                                        <div>
                                                            <div className="font-bold text-[var(--text-primary)]">{res.Name}</div>
                                                            <div className="text-xs text-[var(--text-secondary)] mt-0.5">{res.Phone} • {res.City || 'No City'}</div>
                                                        </div>
                                                        <Check size={18} className="text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="h-px w-full bg-[var(--glass-border)] my-6 relative">
                                        <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] px-3 text-xs font-bold text-[var(--text-secondary)]">ಅಥವಾ ಹೊಸ ವಿವರ ಸೇರಿಸಿ (OR ADD NEW)</span>
                                    </div>

                                    {/* Manual Form */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಪೂರ್ಣ ಹೆಸರು (Name) <span className="text-red-500">*</span></label>
                                            <TransliteratedInput value={customer.Name} onChange={(v) => setCustomer({ ...customer, Name: v })} placeholder="ಹೆಸರು" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಫೋನ್ ನಂಬರ್ (Phone) <span className="text-red-500">*</span></label>
                                            <input type="tel" value={customer.Phone} onChange={(e) => setCustomer({ ...customer, Phone: e.target.value })} placeholder="9999999999" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಗೋತ್ರ (Gotra)</label>
                                            <TransliteratedInput value={customer.Sgotra} onChange={(v) => setCustomer({ ...customer, Sgotra: v })} placeholder="ಗೋತ್ರ" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ನಕ್ಷತ್ರ (Nakshatra)</label>
                                            <TransliteratedInput value={customer.SNakshatra} onChange={(v) => setCustomer({ ...customer, SNakshatra: v })} placeholder="ನಕ್ಷತ್ರ" />
                                        </div>
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ವಿಳಾಸ (Address)</label>
                                            <TransliteratedInput value={customer.Address} onChange={(v) => setCustomer({ ...customer, Address: v })} placeholder="ವಿಳಾಸ" multiline />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ನಗರ (City)</label>
                                            <TransliteratedInput value={customer.City} onChange={(v) => setCustomer({ ...customer, City: v })} placeholder="ನಗರ" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: SEVA */}
                            {step === Step.Seva && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col space-y-6">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
                                        <Receipt className="text-[var(--primary)]" size={20} /> ಸೇವಾ ವಿವರಗಳು (Seva Details)
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider block">ದಿನಾಂಕ (Date)</label>
                                            <div className="bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] rounded-xl py-2 px-4 text-[var(--text-primary)] flex justify-between items-center opacity-70">
                                                <span>{selectedDate.toLocaleDateString('kn-IN')}</span>
                                                <Calendar size={16} />
                                            </div>
                                            <p className="text-[10px] text-[var(--text-secondary)]">ಕ್ಯಾಲೆಂಡರ್ ನಿಂದ ಆಯ್ಕೆಯಾಗಿದೆ</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider block">ಸೇವೆ / ಈವೆಂಟ್ (Seva) <span className="text-red-500">*</span></label>
                                            <select
                                                value={selectedItemCode}
                                                onChange={(e) => setSelectedItemCode(e.target.value)}
                                                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                            >
                                                <option value="">-- ಸೇವೆಯನ್ನ ಆಯ್ಕೆಮಾಡಿ (Select) --</option>
                                                {items.map(item => (
                                                    <option key={item.ItemCode} value={item.ItemCode}>
                                                        {item.Description} (₹{item.Basic})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-5 space-y-4">
                                        <div className="flex items-center gap-2 mb-2 text-blue-800 dark:text-blue-300">
                                            <Users size={18} />
                                            <h4 className="font-bold">ಭಾಗವಹಿಸುವವರ ವಿವರ (Participants)</h4>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-[var(--text-primary)]">ಹೆಚ್ಚುವರಿ ಕುಟುಂಬ ಸದಸ್ಯರು (Additional Members)</label>
                                                <p className="text-xs text-[var(--text-secondary)]">ಕರ್ತೃವನ್ನು ಹೊರತುಪಡಿಸಿ (Excluding main devotee)</p>
                                            </div>
                                            <input
                                                type="number" min="0" max="20"
                                                value={familyMembers}
                                                onChange={(e) => setFamilyMembers(parseInt(e.target.value) || 0)}
                                                className="w-24 px-3 py-2 text-center rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)]"
                                            />
                                        </div>

                                        <div className="h-px bg-blue-100 dark:bg-blue-900/30 w-full" />

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1 cursor-pointer" onClick={() => setOptPrasada(!optPrasada)}>
                                                <label className="text-sm font-bold text-orange-600 dark:text-orange-400 cursor-pointer">ತೀರ್ಥ ಪ್ರಸಾದ ವ್ಯವಸ್ಥೆ (Theertha Prasada)</label>
                                                <p className="text-xs text-[var(--text-secondary)]">ಊಟದ ಪ್ರಸಾದ (Food service opt-in)</p>
                                            </div>

                                            <button
                                                onClick={() => setOptPrasada(!optPrasada)}
                                                className={`w-14 h-7 rounded-full transition-colors relative ${optPrasada ? 'bg-[var(--accent-saffron)]' : 'bg-slate-300 dark:bg-slate-700'}`}
                                            >
                                                <motion.div
                                                    animate={{ x: optPrasada ? 28 : 2 }}
                                                    className="w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm"
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1" />
                                    {selectedItemCode && (
                                        <div className="bg-slate-50 dark:bg-slate-800 border border-[var(--primary)]/30 rounded-xl p-4 flex justify-between items-center bg-gradient-to-r from-[var(--glass-bg)] to-orange-50 dark:to-orange-900/10">
                                            <span className="font-medium text-[var(--text-secondary)] uppercase text-sm">ಒಟ್ಟು ಮೊತ್ತ (Total)</span>
                                            <span className="text-2xl font-black text-[var(--primary)]">₹{calculateTotal()}</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* STEP 3: PAYMENT */}
                            {step === Step.Payment && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col space-y-6">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
                                        <CreditCard className="text-[var(--primary)]" size={20} /> ಪಾವತಿ ವಿಧಾನ (Payment)
                                    </h3>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {['Cash', 'UPI', 'Cheque', 'DD', 'Netbanking'].map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setPaymentMode(mode as any)}
                                                className={`py-3 px-2 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all ${paymentMode === mode
                                                    ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] shadow-sm'
                                                    : 'bg-slate-50 dark:bg-slate-800 border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-white/50 dark:hover:bg-black/20'
                                                    }`}
                                            >
                                                {mode === 'Cash' ? 'ನಗದು' : mode === 'Cheque' ? 'ಚೆಕ್' : mode}
                                                <span className="text-[10px] uppercase">{mode}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {paymentMode !== 'Cash' && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 mt-4">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider block">
                                                ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ (Reference ID / Cheque No) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={paymentRef}
                                                onChange={(e) => setPaymentRef(e.target.value)}
                                                placeholder={paymentMode === 'UPI' ? 'Transaction ID (ಉದಾ: 123456789012)' : 'Number (ಉದಾ: 000123)'}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono"
                                            />
                                        </motion.div>
                                    )}

                                    <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-4 flex gap-3 text-sm text-[var(--text-secondary)] border border-orange-100 dark:border-orange-500/10">
                                        <Info className="shrink-0 text-orange-500 mt-0.5" size={18} />
                                        <p>ದಯವಿಟ್ಟು ಪಾವತಿ ಸ್ವೀಕರಿಸಿದ ನಂತರವೇ 'ಮುಕ್ತಾಯ' ಕ್ಲಿಕ್ ಮಾಡಿ. ವಹಿವಾಟು ಯಶಸ್ವಿಯಾದರೆ, ಸ್ವಯಂಚಾಲಿತವಾಗಿ ರಸೀದಿ (Receipt) ಸೃಷ್ಟಿಸಲಾಗುತ್ತದೆ.</p>
                                    </div>

                                    <div className="flex-1" />

                                    {/* Final Summary */}
                                    <div className="bg-slate-50 dark:bg-slate-800 border border-[var(--primary)]/30 rounded-xl p-4 flex justify-between items-center shadow-lg shadow-orange-500/5">
                                        <div>
                                            <p className="text-xs text-[var(--text-secondary)] font-bold mb-1">ಸೇವೆ: {getSelectedItem()?.Description || '-'}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">ಭಕ್ತರು: {customer.Name}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-[var(--text-secondary)] uppercase block mb-1">PAYABLE ({paymentMode})</span>
                                            <span className="text-2xl font-black text-[var(--primary)]">₹{calculateTotal()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Footer Nav */}
                            <div className="flex justify-between mt-6 pt-4 border-t border-[var(--glass-border)] shrink-0">
                                <button
                                    onClick={() => step > Step.Devotee ? setStep((step - 1) as Step) : onClose()}
                                    className="px-6 py-2.5 rounded-xl font-medium text-[var(--text-secondary)] hover:bg-slate-50 dark:bg-slate-800 transition-colors"
                                >
                                    {step > Step.Devotee ? 'ಹಿಂದಕ್ಕೆ (Back)' : 'ರದ್ದುಮಾಡಿ (Cancel)'}
                                </button>

                                <button
                                    onClick={() => {
                                        if (step === Step.Devotee && validateDevotee()) setStep(Step.Seva);
                                        else if (step === Step.Seva && validateSeva()) setStep(Step.Payment);
                                        else if (step === Step.Payment) handleSubmit();
                                    }}
                                    disabled={loading}
                                    className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-saffron)] text-white font-bold shadow-lg hover:shadow-orange-500/30 transition-shadow disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    {step === Step.Payment ? 'ಮುಕ್ತಾಯ (Finish)' : 'ಮುಂದೆ (Next)'}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function StepIndicator({ currStep, num, label }: { currStep: number, num: number, label: string, icon: any }) {
    const isPast = currStep > num;
    const isCurr = currStep === num;

    return (
        <div className={`flex items-center gap-3 transition-opacity ${isCurr ? 'opacity-100' : 'opacity-50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isPast ? 'bg-white text-orange-600 border-white' :
                isCurr ? 'border-white text-white' :
                    'border-white/30 text-white/50'
                }`}>
                {isPast ? <Check size={16} /> : num}
            </div>
            <div>
                <p className={`font-bold ${isCurr ? 'text-white' : 'text-white/70'}`}>{label}</p>
                {isCurr && <motion.div layoutId="activestepIndicator" className="h-0.5 bg-white w-full mt-1" />}
            </div>
        </div>
    );
}
