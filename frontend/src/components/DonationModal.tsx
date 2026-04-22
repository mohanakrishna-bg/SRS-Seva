import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { transliterateToKannada } from '../transliterate';
import { X, Search, User, Gift, Receipt, Check, Loader2, Heart, Camera, CreditCard } from 'lucide-react';
import TransliteratedInput from './TransliteratedInput';
import GlobalInputToolbar from './GlobalInputToolbar';
import { useToast } from './Toast';
import { GOTRAS, NAKSHATRAS } from '../constants/panchanga';
import { devoteeApi, inventoryApi, uploadApi, paymentApi } from '../api';

interface Customer {
    ID1?: number;
    DevoteeId?: number;
    Name: string;
    NameEn?: string;
    Phone: string;
    Sgotra: string;
    SgotraEn?: string;
    SNakshatra: string;
    SNakshatraEn?: string;
    Address: string;
    City: string;
    CityEn?: string;
    WhatsApp_Phone?: string;
    Email_ID?: string;
}

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
    prefillDevotee?: any;
    onSuccess: (donationData: any) => void;
}

const Step = { Donor: 1, Item: 2, Confirm: 3 } as const;
type StepType = typeof Step[keyof typeof Step];

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DonationModal({ isOpen, onClose, prefillDevotee, onSuccess }: DonationModalProps) {
    const { showToast } = useToast();
    const [step, setStep] = useState<StepType>(Step.Donor);
    const [loading, setLoading] = useState(false);

    // --- Donor State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const initialCustomer: Customer = { Name: '', Phone: '', Sgotra: '', SNakshatra: '', Address: '', City: '' };
    const [customer, setCustomer] = useState<Customer>(initialCustomer);
    const [isNewCustomer, setIsNewCustomer] = useState(true);

    // --- Item State ---
    type DonationKind = 'monetary' | 'asset' | 'consumable';
    const [donationKind, setDonationKind] = useState<DonationKind>('asset');
    // Derived legacy values for API compatibility
    const donationType = donationKind === 'monetary' ? 'monetary' : 'in_kind';
    const itemType = donationKind === 'monetary' ? 'asset' : donationKind;
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [material, setMaterial] = useState('');
    const [weightGrams, setWeightGrams] = useState('');
    const [uom, setUom] = useState('Nos');
    const [quantity, setQuantity] = useState('1');
    const [estimatedValue, setEstimatedValue] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [remarks, setRemarks] = useState('');
    const [donationDate, setDonationDate] = useState(new Date().toLocaleDateString('en-CA'));

    // Categories and Materials
    const [categories, setCategories] = useState<{ Id: number; Name: string; ForType?: string }[]>([]);
    const [materials, setMaterials] = useState<{ Id: number; Name: string; BullionRate?: number | null }[]>([]);

    // --- Payment State ---
    const [paymentMode, setPaymentMode] = useState<'Cash' | 'Cheque' | 'DD' | 'UPI' | 'Netbanking'>('Cash');
    const [paymentRef, setPaymentRef] = useState('');
    const [upiDetails, setUpiDetails] = useState({ gateway: '', transactionId: '', vpa: '', screenshot: '' });
    const [chqDetails, setChqDetails] = useState({ accNo: '', holder: '', bank: '', branch: '', date: '', number: '' });
    const [netDetails, setNetDetails] = useState({ bank: '', utr: '', date: '' });
    const [uploading, setUploading] = useState(false);
    const [verifyingUpi, setVerifyingUpi] = useState(false);
    const [upiStatus, setUpiStatus] = useState<{ status: 'idle' | 'success' | 'failure', message: string }>({ status: 'idle', message: '' });

    useEffect(() => {
        if (!isOpen) {
            setStep(Step.Donor);
            setCustomer(initialCustomer);
            setSearchQuery('');
            setSearchResults([]);
            setIsNewCustomer(true);
            setDonationKind('asset');
            setItemName('');
            setDescription('');
            setCategory('');
            setMaterial('');
            setWeightGrams('');
            setUom('Nos');
            setQuantity('1');
            setEstimatedValue('');
            setPanNumber('');
            setRemarks('');
            setDonationDate(new Date().toLocaleDateString('en-CA'));
            setPaymentMode('Cash');
            setPaymentRef('');
            setUpiDetails({ gateway: '', transactionId: '', vpa: '', screenshot: '' });
            setChqDetails({ accNo: '', holder: '', bank: '', branch: '', date: '', number: '' });
            setNetDetails({ bank: '', utr: '', date: '' });
            setUpiStatus({ status: 'idle', message: '' });
        } else {
            if (prefillDevotee) {
                setCustomer({
                    Name: prefillDevotee.Name || '',
                    Phone: prefillDevotee.Phone || '',
                    Sgotra: prefillDevotee.Gotra || '',
                    SNakshatra: prefillDevotee.Nakshatra || '',
                    Address: prefillDevotee.Address || '',
                    City: prefillDevotee.City || '',
                    WhatsApp_Phone: prefillDevotee.WhatsApp_Phone || '',
                    Email_ID: prefillDevotee.Email || '',
                    DevoteeId: prefillDevotee.DevoteeId,
                });
                setIsNewCustomer(false);
                setStep(Step.Item);
            }
            // Load categories/materials
            Promise.all([inventoryApi.listCategories(), inventoryApi.listMaterials()]).then(([c, m]) => {
                setCategories(c.data || []);
                setMaterials(m.data || []);
            }).catch(() => {});
        }
    }, [isOpen, prefillDevotee]);

    // --- Devotee search (debounced) ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 2) handleSearch();
            else if (searchQuery.trim().length === 0) setSearchResults([]);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await devoteeApi.searchBasic(searchQuery);
            const tkData = await Promise.all(res.data.map(async (c: any) => ({
                ...c,
                NameEn: c.Name,
                Name: await transliterateToKannada(c.Name || ''),
                GotraEn: c.Gotra,
                Gotra: c.Gotra ? await transliterateToKannada(c.Gotra) : '',
                NakshatraEn: c.Nakshatra,
                Nakshatra: c.Nakshatra ? await transliterateToKannada(c.Nakshatra) : '',
                CityEn: c.City,
                City: c.City ? await transliterateToKannada(c.City) : '',
            })));
            setSearchResults(tkData);
        } catch {
            showToast('error', 'ಹುಡುಕಾಟ ವಿಫಲವಾಗಿದೆ (Search failed)');
        } finally {
            setIsSearching(false);
        }
    };

    const selectCustomer = (c: any) => {
        setCustomer({
            Name: c.Name || '', NameEn: c.NameEn || '',
            Phone: c.Phone || '', Sgotra: c.Gotra || '', SgotraEn: c.GotraEn || '',
            SNakshatra: c.Nakshatra || '', SNakshatraEn: c.NakshatraEn || '',
            Address: c.Address || '', City: c.City || '', CityEn: c.CityEn || '',
            WhatsApp_Phone: c.WhatsApp_Phone || '', Email_ID: c.Email || '',
            DevoteeId: c.DevoteeId,
        });
        setIsNewCustomer(false);
        setSearchResults([]);
    };

    const validateDonor = () => {
        if (!customer.Name.trim()) { showToast('error', 'ದಾನಿಯ ಹೆಸರು ಕಡ್ಡಾಯವಾಗಿದೆ (Donor name is required)'); return false; }
        if (!customer.Phone.trim()) { showToast('error', 'ಫೋನ್ ಸಂಖ್ಯೆ ಕಡ್ಡಾಯವಾಗಿದೆ (Phone is required)'); return false; }
        return true;
    };

    const validateItem = () => {
        if (donationKind === 'monetary') {
            if (!estimatedValue || parseFloat(estimatedValue) <= 0) { showToast('error', 'ಮೊತ್ತ ಕಡ್ಡಾಯವಾಗಿದೆ (Amount is required for monetary donations)'); return false; }
            if (!panNumber.trim()) { showToast('error', 'PAN ಸಂಖ್ಯೆ ಕಡ್ಡಾಯವಾಗಿದೆ (PAN Number is required for monetary donations)'); return false; }
        } else {
            if (!itemName.trim()) { showToast('error', 'ವಸ್ತುವಿನ ಹೆಸರು ಕಡ್ಡಾಯವಾಗಿದೆ (Item name is required)'); return false; }
        }
        return true;
    };

    // Auto-calculate bullion value
    const getAutoValue = (): number | null => {
        if (material && weightGrams) {
            const mat = materials.find(m => m.Name === material);
            if (mat?.BullionRate) return parseFloat(weightGrams) * mat.BullionRate;
        }
        return null;
    };

    const getDisplayValue = (): number => {
        if (estimatedValue && parseFloat(estimatedValue) > 0) return parseFloat(estimatedValue);
        const auto = getAutoValue();
        if (auto !== null) return auto;
        return 0;
    };

    const handleSubmit = async () => {
        if (!validateDonor() || !validateItem()) return;

        // Payment Validations for Monetary
        if (donationKind === 'monetary') {
            if (paymentMode === 'UPI') {
                if (!upiDetails.gateway) { showToast('error', 'Payment Gateway is required'); return; }
                if (!upiDetails.transactionId) { showToast('error', 'Transaction ID is required'); return; }
                if (upiStatus.status === 'failure') {
                    showToast('error', 'ವಹಿವಾಟು ವಿಫಲವಾಗಿದೆ, ದಯವಿಟ್ಟು ಪರೀಕ್ಷಿಸಿ (Transaction failed verification, please check)');
                    return;
                }
                if (upiStatus.status === 'idle') {
                    const proceed = confirm('ವಹಿವಾಟನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ. ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಬೇಕೆ? (Transaction not verified. Proceed anyway?)');
                    if (!proceed) return;
                }
            } else if (paymentMode === 'Cheque' || paymentMode === 'DD') {
                if (!chqDetails.bank) { showToast('error', 'Bank Name is required'); return; }
                if (!chqDetails.number) { showToast('error', 'Number is required'); return; }
                if (!chqDetails.date) { showToast('error', 'Date is required'); return; }
            } else if (paymentMode === 'Netbanking') {
                if (!netDetails.utr) { showToast('error', 'UTR is required'); return; }
                if (!netDetails.date) { showToast('error', 'Date of Transfer is required'); return; }
            }
        }

        setLoading(true);
        try {
            // 1. Ensure Devotee exists
            let devoteeId = (customer as any).DevoteeId;
            if (isNewCustomer || !devoteeId) {
                const devoteePayload = {
                    Name: customer.Name, Phone: customer.Phone || null,
                    WhatsApp_Phone: customer.WhatsApp_Phone || null,
                    Email: customer.Email_ID || null,
                    Gotra: customer.Sgotra || null, Nakshatra: customer.SNakshatra || null,
                    Address: customer.Address || null, City: customer.City || null,
                };
                const res = await devoteeApi.create(devoteePayload);
                devoteeId = res.data.DevoteeId;
            }

            // 2. Format date
            const [y, m, d] = donationDate.split('-');
            const formattedDate = `${d}/${m}/${y}`;

            // 3. Submit Donation
            const effectiveItemName = donationKind === 'monetary'
                ? (itemName.trim() || 'Monetary Donation')
                : itemName;
            const donationPayload = {
                DonorId: devoteeId,
                DonationDate: formattedDate,
                DonationType: donationType,
                ItemType: itemType,
                Category: category || null,
                ItemName: effectiveItemName,
                Description: description || null,
                Material: material || null,
                WeightGrams: weightGrams ? parseFloat(weightGrams) : null,
                UOM: uom,
                Quantity: parseInt(quantity) || 1,
                EstimatedValue: getDisplayValue(),
                PANNumber: panNumber || null,
                Remarks: remarks || null,
                PaymentMode: donationKind === 'monetary' ? paymentMode : 'Cash',
                PaymentReference: donationKind === 'monetary' ? paymentRef : null,
                PaymentDetails: donationKind === 'monetary' ? (
                    paymentMode === 'UPI' ? upiDetails : 
                    (paymentMode === 'Cheque' || paymentMode === 'DD') ? chqDetails :
                    paymentMode === 'Netbanking' ? netDetails : null
                ) : null,
            };
            const donRes = await inventoryApi.createDonation(donationPayload);
            showToast('success', 'ದಾನ ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಯಿತು! (Donation Registered)');

            const gotraMatch = GOTRAS.find(g => g.kn === customer.Sgotra || g.en === customer.Sgotra);
            const nakshatraMatch = NAKSHATRAS.find(n => n.kn === customer.SNakshatra || n.en === customer.SNakshatra);

            onSuccess({
                donation: donRes.data,
                customer: {
                    ...customer,
                    SgotraEn: gotraMatch ? gotraMatch.en : customer.SgotraEn,
                    SNakshatraEn: nakshatraMatch ? nakshatraMatch.en : customer.SNakshatraEn,
                },
            });
        } catch (err: any) {
            console.error('Donation error:', err?.response?.data || err);
            showToast('error', 'ದಾನ ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ (Donation Failed)');
        } finally {
            setLoading(false);
        }
    };

    const handleUpiVerify = async () => {
        if (!upiDetails.gateway || !upiDetails.transactionId) {
            showToast('error', 'Gateway and Transaction ID are required for verification');
            return;
        }

        setVerifyingUpi(true);
        setUpiStatus({ status: 'idle', message: 'Verifying...' });
        try {
            const res = await paymentApi.verifyUPI({
                gateway: upiDetails.gateway,
                transaction_id: upiDetails.transactionId
            });
            const { status, message } = res.data;
            setUpiStatus({ status, message });
            if (status === 'success') showToast('success', message);
            else showToast('error', message);
        } catch (err: any) {
            setUpiStatus({ status: 'failure', message: 'Verification Error' });
            showToast('error', 'ವಹಿವಾಟು ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ (Verification Failed)');
        } finally {
            setVerifyingUpi(false);
        }
    };

    const handleScreenshotUpload = async (file: File) => {
        setUploading(true);
        try {
            const res = await uploadApi.image(file);
            setUpiDetails(prev => ({ ...prev, screenshot: `/uploads/${res.data.filename}` }));
            showToast('success', 'Screenshot uploaded');
        } catch {
            showToast('error', 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const getUnifiedSuggestions = (list: { en: string; kn: string }[]) => list.flatMap(i => [i.en, i.kn]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[var(--glass-border)] overflow-hidden flex flex-col md:flex-row min-h-[500px]"
                >
                    {/* Sidebar */}
                    <div className="hidden md:flex flex-col w-64 bg-gradient-to-b from-rose-600 to-amber-600 text-white p-6 relative flex-shrink-0">
                        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-20 mix-blend-overlay" />
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><Heart size={20} /> ದಾನ ನೋಂದಣಿ</h2>
                            <div className="space-y-6">
                                <StepIndicator currStep={step} num={1} label="ದಾನಿ ವಿವರ" icon={<User size={18} />} />
                                <StepIndicator currStep={step} num={2} label="ವಸ್ತು ವಿವರ" icon={<Gift size={18} />} />
                                <StepIndicator currStep={step} num={3} label="ಖಚಿತಪಡಿಸಿ" icon={<Receipt size={18} />} />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Header */}
                    <div className="md:hidden bg-gradient-to-r from-rose-600 to-amber-600 text-white p-4 flex justify-between items-center shrink-0">
                        <h2 className="font-bold flex items-center gap-2"><Heart size={18} /> ದಾನ ನೋಂದಣಿ - {step}/3</h2>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full"><X size={20} /></button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-5 py-3 relative overflow-y-auto w-full h-full max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <GlobalInputToolbar />
                            <button onClick={onClose} className="hidden md:block p-2 text-[var(--text-secondary)] hover:bg-black/5 rounded-full z-10 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="h-full flex flex-col">
                            {/* STEP 1: DONOR */}
                            {step === Step.Donor && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col">
                                    <h3 className="text-base font-bold text-[var(--text-primary)] mb-2.5 flex items-center gap-2">
                                        <Search className="text-rose-500" size={18} /> ದಾನಿ ಹುಡುಕಾಟ (Donor Search)
                                    </h3>

                                    {isNewCustomer ? (
                                        <div className="flex gap-2 mb-4">
                                            <div className="flex-1 relative">
                                                <TransliteratedInput value={searchQuery} onChange={v => setSearchQuery(v)} placeholder="ಹೆಸರು ಅಥವಾ ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ" />
                                                {isSearching && <Loader2 size={18} className="absolute right-3 top-3.5 text-[var(--text-secondary)] animate-spin" />}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/20 rounded-xl p-3 mb-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 mb-0.5 uppercase tracking-wider">ಆಯ್ಕೆಯಾದ ದಾನಿ</p>
                                                <p className="text-base font-bold text-[var(--text-primary)]">{customer.Name}</p>
                                                <p className="text-xs text-[var(--text-secondary)]">{customer.Phone}</p>
                                            </div>
                                            <button
                                                onClick={() => { setIsNewCustomer(true); setCustomer(initialCustomer); setSearchQuery(''); }}
                                                className="text-sm flex py-2 px-3 items-center gap-1 font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-200/50 dark:hover:bg-rose-800/30 rounded-lg transition-colors"
                                            ><X size={16} /> ಬದಲಾಯಿಸಿ</button>
                                        </div>
                                    )}

                                    {/* Search Results */}
                                    {searchResults.length > 0 && (
                                        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 mb-6">
                                            <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-3 uppercase tracking-wider">{searchResults.length} ಫಲಿತಾಂಶಗಳು</p>
                                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                                {searchResults.map(res => (
                                                    <button key={res.ID1 || (res as any).DevoteeId} onClick={() => selectCustomer(res)}
                                                        className="w-full text-left bg-white dark:bg-black/30 p-3 rounded-lg hover:border-rose-500 border border-transparent transition-all flex items-center justify-between group">
                                                        <div>
                                                            <div className="font-bold text-[var(--text-primary)]">{res.Name}</div>
                                                            <div className="text-xs text-[var(--text-secondary)] mt-0.5">{res.Phone} • {res.City || 'No City'}</div>
                                                        </div>
                                                        <Check size={18} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="h-px w-full bg-[var(--glass-border)] my-4 relative">
                                        <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] px-3 text-xs font-bold text-[var(--text-secondary)]">
                                            {isNewCustomer ? 'ಅಥವಾ ಹೊಸ ವಿವರ ಸೇರಿಸಿ' : 'ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ'}
                                        </span>
                                    </div>

                                    {/* Donor Form */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಪೂರ್ಣ ಹೆಸರು <span className="text-red-500">*</span></label>
                                            <TransliteratedInput value={customer.Name} onChange={v => setCustomer({ ...customer, Name: v })} placeholder="ಹೆಸರು" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಫೋನ್ ನಂಬರ್ <span className="text-red-500">*</span></label>
                                            <input type="tel" value={customer.Phone} onChange={e => setCustomer({ ...customer, Phone: e.target.value })} placeholder="9999999999"
                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-rose-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಗೋತ್ರ</label>
                                            <TransliteratedInput value={customer.Sgotra} onChange={v => setCustomer({ ...customer, Sgotra: v })} placeholder="ಗೋತ್ರ" list="don-gotra-list" />
                                            <datalist id="don-gotra-list">{getUnifiedSuggestions(GOTRAS).map(g => <option key={g} value={g} />)}</datalist>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ನಕ್ಷತ್ರ</label>
                                            <TransliteratedInput value={customer.SNakshatra} onChange={v => setCustomer({ ...customer, SNakshatra: v })} placeholder="ನಕ್ಷತ್ರ" list="don-nak-list" />
                                            <datalist id="don-nak-list">{getUnifiedSuggestions(NAKSHATRAS).map(n => <option key={n} value={n} />)}</datalist>
                                        </div>
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ವಿಳಾಸ</label>
                                            <TransliteratedInput value={customer.Address} onChange={v => setCustomer({ ...customer, Address: v })} placeholder="ವಿಳಾಸ" multiline />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ನಗರ</label>
                                            <TransliteratedInput value={customer.City} onChange={v => setCustomer({ ...customer, City: v })} placeholder="ನಗರ" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: ITEM DETAILS */}
                            {step === Step.Item && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col space-y-4">
                                    <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-2">
                                        <Gift className="text-rose-500" size={18} /> ದಾನ ವಿವರಗಳು (Donation Details)
                                    </h3>

                                    {/* Donor context */}
                                    <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg p-3 text-sm text-[var(--text-secondary)] flex items-center justify-between">
                                        <div><span className="font-medium mr-1 text-[var(--text-primary)]">ದಾನಿ:</span> {customer.Name}</div>
                                        {/* Date — shared for all types */}
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium text-[var(--text-secondary)]">ದಿನಾಂಕ:</label>
                                            <input type="date" value={donationDate} onChange={e => setDonationDate(e.target.value)}
                                                className="px-2 py-1 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] text-xs focus:outline-none focus:border-rose-500" />
                                        </div>
                                    </div>

                                    {/* ── Donation Kind Radio Selector ── */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">ದಾನ ವಿಧ (Donation Type)</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {([
                                                { key: 'monetary', icon: '💰', label: 'ಹಣಕಾಸು', labelEn: 'Monetary', color: 'emerald', desc: 'Cash / UPI / Cheque' },
                                                { key: 'asset', icon: '🏛️', label: 'ಆಸ್ತಿ', labelEn: 'Asset', color: 'amber', desc: 'Vessels, Jewellery, etc.' },
                                                { key: 'consumable', icon: '📦', label: 'ಬಳಕೆ ವಸ್ತು', labelEn: 'Consumable', color: 'sky', desc: 'Rice, Oil, Flowers, etc.' },
                                            ] as const).map(t => {
                                                const selected = donationKind === t.key;
                                                const colors: Record<string, string> = {
                                                    emerald: selected ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'border-[var(--glass-border)] hover:border-emerald-400/50',
                                                    amber:   selected ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30' : 'border-[var(--glass-border)] hover:border-amber-400/50',
                                                    sky:     selected ? 'border-sky-500 bg-sky-500/10 ring-1 ring-sky-500/30' : 'border-[var(--glass-border)] hover:border-sky-400/50',
                                                };
                                                const dotColors: Record<string, string> = {
                                                    emerald: selected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600',
                                                    amber:   selected ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600',
                                                    sky:     selected ? 'border-sky-500 bg-sky-500' : 'border-slate-300 dark:border-slate-600',
                                                };
                                                return (
                                                    <button key={t.key} type="button"
                                                        onClick={() => {
                                                            setDonationKind(t.key as any);
                                                            // Clear fields that don't apply when switching
                                                            if (t.key === 'monetary') { setMaterial(''); setWeightGrams(''); setUom('Nos'); setQuantity('1'); }
                                                            if (t.key === 'consumable') { setMaterial(''); setWeightGrams(''); }
                                                            if (t.key === 'asset') { setUom('Nos'); }
                                                        }}
                                                        className={`relative flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${colors[t.color]}`}
                                                    >
                                                        {/* Radio dot */}
                                                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${dotColors[t.color]}`}>
                                                            {selected && <div className="w-1.5 h-1.5 rounded-full bg-white m-auto mt-[3px]" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-base">{t.icon}</span>
                                                                <span className="font-bold text-sm text-[var(--text-primary)]">{t.label}</span>
                                                                <span className="text-[10px] text-[var(--text-secondary)]">({t.labelEn})</span>
                                                            </div>
                                                            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-tight">{t.desc}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ══════════════ MONETARY FIELDS ══════════════ */}
                                    {donationKind === 'monetary' && (
                                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 border-t border-emerald-500/20 pt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಮೊತ್ತ (Amount ₹) <span className="text-red-500">*</span></label>
                                                    <input type="number" step="0.01" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} placeholder="e.g., 5000"
                                                        className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] font-mono text-lg focus:outline-none focus:border-emerald-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">PAN ಸಂಖ್ಯೆ (80G) <span className="text-red-500">*</span></label>
                                                    <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10}
                                                        className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] font-mono focus:outline-none focus:border-emerald-500" />
                                                    <p className="text-[10px] text-[var(--text-secondary)] italic">80G ತೆರಿಗೆ ಕಡಿತ ಪ್ರಮಾಣಪತ್ರಕ್ಕೆ ಅಗತ್ಯ (Required for 80G tax certificate)</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಉದ್ದೇಶ (Purpose)</label>
                                                    <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g., Temple Renovation, Annadana"
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-emerald-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಟಿಪ್ಪಣಿ (Remarks)</label>
                                                    <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any notes"
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-emerald-500" />
                                                </div>
                                            </div>
                                            {/* Value preview */}
                                            {estimatedValue && parseFloat(estimatedValue) > 0 && (
                                                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/10 dark:to-emerald-900/5 border border-emerald-500/30 rounded-xl p-4 flex justify-between items-center">
                                                    <span className="font-medium text-emerald-700 dark:text-emerald-400 uppercase text-sm">ದಾನ ಮೊತ್ತ (Donation Amount)</span>
                                                    <span className="text-2xl font-black text-emerald-600">{fmt(parseFloat(estimatedValue))}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* ══════════════ ASSET FIELDS ══════════════ */}
                                    {donationKind === 'asset' && (
                                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 border-t border-amber-500/20 pt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ವಸ್ತು ಹೆಸರು (Item Name) <span className="text-red-500">*</span></label>
                                                    <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g., Silver Lamp, Brass Bell"
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-amber-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ವರ್ಗ (Category)</label>
                                                    <select value={category} onChange={e => setCategory(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-amber-500">
                                                        <option value="">-- Select --</option>
                                                        {categories.filter(c => !c.ForType || c.ForType === 'asset').map(c => <option key={c.Id} value={c.Name}>{c.Name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಲೋಹ (Material)</label>
                                                    <select value={material} onChange={e => setMaterial(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-amber-500">
                                                        <option value="">-- None --</option>
                                                        {materials.map(m => <option key={m.Id} value={m.Name}>{m.Name}{m.BullionRate ? ` (₹${m.BullionRate}/gm)` : ''}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ತೂಕ (Weight grams)</label>
                                                    <input type="number" step="0.01" value={weightGrams} onChange={e => setWeightGrams(e.target.value)} placeholder="e.g., 25.5"
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-amber-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಸಂಖ್ಯೆ (Qty)</label>
                                                    <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-amber-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">
                                                        ಅಂದಾಜು ಮೌಲ್ಯ (Est. Value ₹)
                                                        {getAutoValue() !== null && <span className="text-emerald-500 ml-1 normal-case">(Auto: {fmt(getAutoValue()!)})</span>}
                                                    </label>
                                                    <input type="number" step="0.01" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)}
                                                        placeholder={getAutoValue() !== null ? `Auto: ${getAutoValue()!.toFixed(2)}` : '0.00'}
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-amber-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ವಿವರಣೆ (Description)</label>
                                                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details"
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-amber-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಟಿಪ್ಪಣಿ (Remarks)</label>
                                                    <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any notes"
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-amber-500" />
                                                </div>
                                            </div>
                                            {/* Value preview */}
                                            {(itemName || getDisplayValue() > 0) && (
                                                <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/10 dark:to-amber-900/5 border border-amber-500/30 rounded-xl p-4 flex justify-between items-center mt-auto">
                                                    <span className="font-medium text-amber-700 dark:text-amber-400 uppercase text-sm">ಅಂದಾಜು ಮೌಲ್ಯ (Estimated Value)</span>
                                                    <span className="text-2xl font-black text-amber-600">{fmt(getDisplayValue() * (parseInt(quantity) || 1))}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* ══════════════ CONSUMABLE FIELDS ══════════════ */}
                                    {donationKind === 'consumable' && (
                                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 border-t border-sky-500/20 pt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ವಸ್ತು ಹೆಸರು (Item Name) <span className="text-red-500">*</span></label>
                                                    <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g., Rice, Ghee, Flowers"
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-sky-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ವರ್ಗ (Category)</label>
                                                    <select value={category} onChange={e => setCategory(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-sky-500">
                                                        <option value="">-- Select --</option>
                                                        {categories.filter(c => !c.ForType || c.ForType === 'consumable').map(c => <option key={c.Id} value={c.Name}>{c.Name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಪ್ರಮಾಣ (Quantity) <span className="text-red-500">*</span></label>
                                                    <div className="flex gap-2">
                                                        <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)}
                                                            className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-sky-500" />
                                                        <select value={uom} onChange={e => setUom(e.target.value)}
                                                            className="w-28 px-2 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] text-xs focus:outline-none focus:border-sky-500">
                                                            {['Nos', 'Kg', 'Grams', 'Litres', 'Packets', 'Bags', 'Bunches', 'Boxes'].map(u => <option key={u} value={u}>{u}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಅಂದಾಜು ಮೌಲ್ಯ (Est. Value ₹)</label>
                                                    <input type="number" step="0.01" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} placeholder="0.00"
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-sky-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ವಿವರಣೆ (Description)</label>
                                                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details"
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-sky-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">ಟಿಪ್ಪಣಿ (Remarks)</label>
                                                    <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any notes"
                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-sky-500" />
                                                </div>
                                            </div>
                                            {/* Value preview */}
                                            {(itemName || getDisplayValue() > 0) && (
                                                <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 dark:from-sky-900/10 dark:to-sky-900/5 border border-sky-500/30 rounded-xl p-4 flex justify-between items-center mt-auto">
                                                    <span className="font-medium text-sky-700 dark:text-sky-400 uppercase text-sm">ಅಂದಾಜು ಮೌಲ್ಯ (Estimated Value)</span>
                                                    <span className="text-2xl font-black text-sky-600">{fmt(getDisplayValue() * (parseInt(quantity) || 1))}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* STEP 3: CONFIRMATION */}
                            {step === Step.Confirm && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col space-y-4">
                                    <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-2">
                                        <Check className="text-rose-500" size={18} /> ಖಚಿತಪಡಿಸಿ (Confirmation)
                                    </h3>

                                    <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-5 space-y-4 text-sm">
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                            <div>
                                                <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-0.5">ದಾನಿ (Donor)</p>
                                                <p className="font-bold text-[var(--text-primary)]">{customer.Name}</p>
                                                <p className="text-xs text-[var(--text-secondary)]">{customer.Phone}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-0.5">ದಿನಾಂಕ (Date)</p>
                                                <p className="font-bold text-[var(--text-primary)]">{donationDate}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-0.5">ವಸ್ತು (Item)</p>
                                                <p className="font-bold text-[var(--text-primary)]">{itemName}</p>
                                                {description && <p className="text-xs text-[var(--text-secondary)]">{description}</p>}
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-0.5">ವರ್ಗ (Type)</p>
                                                <p className="font-bold text-[var(--text-primary)] capitalize">
                                                    {donationKind === 'monetary' ? '💰 Monetary' : donationKind === 'asset' ? '🏛️ Asset' : '📦 Consumable'}
                                                </p>
                                            </div>
                                            {material && (
                                                <div>
                                                    <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-0.5">ಲೋಹ (Material)</p>
                                                    <p className="font-bold text-[var(--text-primary)]">{material}{weightGrams ? ` — ${weightGrams}g` : ''}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-0.5">ಸಂಖ್ಯೆ (Qty)</p>
                                                <p className="font-bold text-[var(--text-primary)]">{quantity} {uom}</p>
                                            </div>
                                            {panNumber && (
                                                <div>
                                                    <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mb-0.5">PAN (80G)</p>
                                                    <p className="font-mono font-bold text-[var(--text-primary)]">{panNumber}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-[var(--glass-border)] pt-3 flex justify-between items-center">
                                            <span className="font-medium text-[var(--text-secondary)] uppercase">ಒಟ್ಟು ಅಂದಾಜು ಮೌಲ್ಯ</span>
                                            <span className="text-2xl font-black text-rose-600">{fmt(getDisplayValue() * (parseInt(quantity) || 1))}</span>
                                        </div>
                                    </div>

                                    {remarks && (
                                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/20 rounded-lg p-3 text-sm text-[var(--text-secondary)]">
                                            <span className="font-medium text-[var(--text-primary)]">ಟಿಪ್ಪಣಿ:</span> {remarks}
                                        </div>
                                    )}

                                    {/* ════ PAYMENT DETAILS (Only for Monetary) ════ */}
                                    {donationKind === 'monetary' && (
                                        <div className="mt-4 pt-4 border-t border-[var(--glass-border)] space-y-4">
                                            <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                                <CreditCard className="text-emerald-500" size={16} /> ಪಾವತಿ ವಿಧಾನ (Payment Mode)
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                {['Cash', 'UPI', 'Cheque', 'DD', 'Netbanking'].map((mode) => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setPaymentMode(mode as any)}
                                                        className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                                                            paymentMode === mode
                                                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-sm'
                                                                : 'bg-slate-50 dark:bg-slate-800 border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-white/50 dark:hover:bg-black/20'
                                                        }`}
                                                    >
                                                        {mode === 'Cash' ? 'ನಗದು' : mode === 'Cheque' ? 'ಚೆಕ್' : mode}
                                                        <span className="text-[9px] uppercase">{mode}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {paymentMode === 'UPI' && (
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Gateway <span className="text-red-500">*</span></label>
                                                            <select value={upiDetails.gateway} onChange={e => setUpiDetails({ ...upiDetails, gateway: e.target.value })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-sm">
                                                                <option value="">Select</option>
                                                                <option value="PhonePe">PhonePe</option>
                                                                <option value="GooglePay">GooglePay</option>
                                                                <option value="Paytm">Paytm</option>
                                                                <option value="AmazonPay">AmazonPay</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Transaction ID / RRN (12 digits) <span className="text-red-500">*</span></label>
                                                            <input type="text" value={upiDetails.transactionId}
                                                                onChange={e => {
                                                                    setUpiDetails({ ...upiDetails, transactionId: e.target.value });
                                                                    setPaymentRef(e.target.value);
                                                                    if (upiStatus.status !== 'idle') setUpiStatus({ status: 'idle', message: '' });
                                                                }}
                                                                className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border text-sm font-mono ${
                                                                    upiStatus.status === 'success' ? 'border-green-500' :
                                                                    upiStatus.status === 'failure' ? 'border-red-500' : 'border-[var(--glass-border)]'
                                                                }`}
                                                                placeholder="e.g. 1234..." />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            {upiStatus.status !== 'idle' && (
                                                                <div className={`text-xs font-bold flex items-center gap-1.5 ${upiStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {upiStatus.status === 'success' ? <Check size={14} /> : <X size={14} />} {upiStatus.message}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button type="button" onClick={handleUpiVerify} disabled={verifyingUpi || !upiDetails.gateway || !upiDetails.transactionId}
                                                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50 flex items-center gap-2">
                                                            {verifyingUpi ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Verify Status
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">VPA (Optional)</label>
                                                            <input type="text" value={upiDetails.vpa} onChange={e => setUpiDetails({ ...upiDetails, vpa: e.target.value })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-sm" placeholder="user@bank" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Screenshot</label>
                                                            <div className="flex items-center gap-2">
                                                                <button type="button" onClick={() => document.getElementById('don-screenshot')?.click()} disabled={uploading}
                                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs font-bold">
                                                                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                                                    {upiDetails.screenshot ? 'Changed' : 'Upload'}
                                                                </button>
                                                                <input id="don-screenshot" type="file" accept="image/*" className="hidden"
                                                                    onChange={e => e.target.files?.[0] && handleScreenshotUpload(e.target.files[0])} />
                                                                {upiDetails.screenshot && <Check size={14} className="text-green-500" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {(paymentMode === 'Cheque' || paymentMode === 'DD') && (
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Account Number</label>
                                                            <input type="text" value={chqDetails.accNo} onChange={e => setChqDetails({ ...chqDetails, accNo: e.target.value })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-sm" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Holder Name</label>
                                                            <input type="text" value={chqDetails.holder} onChange={e => setChqDetails({ ...chqDetails, holder: e.target.value })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-sm" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Bank Name <span className="text-red-500">*</span></label>
                                                            <input type="text" value={chqDetails.bank} onChange={e => setChqDetails({ ...chqDetails, bank: e.target.value })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-sm" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Branch / IFSC</label>
                                                            <input type="text" value={chqDetails.branch} onChange={e => setChqDetails({ ...chqDetails, branch: e.target.value })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-sm" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Number <span className="text-red-500">*</span></label>
                                                            <input type="text" value={chqDetails.number} onChange={e => { setChqDetails({ ...chqDetails, number: e.target.value }); setPaymentRef(e.target.value); }}
                                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-sm font-mono" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Date <span className="text-red-500">*</span></label>
                                                            <input type="date" value={chqDetails.date} onChange={e => setChqDetails({ ...chqDetails, date: e.target.value })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-xs" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {paymentMode === 'Netbanking' && (
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Sender Bank Name <span className="text-red-500">*</span></label>
                                                            <input type="text" value={netDetails.bank} onChange={e => setNetDetails({ ...netDetails, bank: e.target.value })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-sm" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Date of Transfer <span className="text-red-500">*</span></label>
                                                            <input type="date" value={netDetails.date} onChange={e => setNetDetails({ ...netDetails, date: e.target.value })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-sm" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">UTR Number <span className="text-red-500">*</span></label>
                                                        <input type="text" value={netDetails.utr} onChange={e => { setNetDetails({ ...netDetails, utr: e.target.value }); setPaymentRef(e.target.value); }}
                                                            className="w-full px-3 py-3 rounded-xl bg-white dark:bg-black/20 border border-[var(--glass-border)] text-base font-mono tracking-widest text-center" placeholder="UTR-0000..." />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between mt-5 pt-3 border-t border-[var(--glass-border)]">
                                {step > 1 ? (
                                    <button onClick={() => setStep(s => (s - 1) as StepType)}
                                        className="px-5 py-2.5 text-sm font-bold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                                        ← ಹಿಂದೆ
                                    </button>
                                ) : <div />}

                                {step < 3 ? (
                                    <button
                                        onClick={() => {
                                            if (step === Step.Donor && !validateDonor()) return;
                                            if (step === Step.Item && !validateItem()) return;
                                            setStep(s => (s + 1) as StepType);
                                        }}
                                        className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all">
                                        ಮುಂದೆ →
                                    </button>
                                ) : (
                                    <button onClick={handleSubmit} disabled={loading}
                                        className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2">
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} />}
                                        {loading ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' : 'ದಾನ ದಾಖಲಿಸಿ'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function StepIndicator({ currStep, num, label, icon }: { currStep: number; num: number; label: string; icon: React.ReactNode }) {
    const isActive = currStep === num;
    const isDone = currStep > num;
    return (
        <div className={`flex items-center gap-3 ${isActive ? 'opacity-100' : isDone ? 'opacity-80' : 'opacity-40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isActive ? 'bg-white text-rose-600' : isDone ? 'bg-white/60 text-rose-700' : 'bg-white/20 text-white'}`}>
                {isDone ? <Check size={16} /> : icon}
            </div>
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}
