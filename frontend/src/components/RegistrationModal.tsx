import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { transliterateToKannada, convertKnNumeralsToEn } from '../transliterate';
import { X, Search, User, CreditCard, Receipt, Check, Loader2, Info, Camera } from 'lucide-react';
import TransliteratedInput from './TransliteratedInput';
import GlobalInputToolbar from './GlobalInputToolbar';
import { useToast } from './Toast';
import { useSettings } from '../context/SettingsContext';
import { GOTRAS, NAKSHATRAS } from '../constants/panchanga';
import { devoteeApi, registrationApi, uploadApi, paymentApi } from '../api';

interface SevaItem {
    SevaCode?: string;
    ItemCode?: string;
    Description: string;
    DescriptionEn?: string;
    Basic?: number;
    Amount?: number;
    TPQty: number;
    Prasada_Addon_Limit?: number;
    PrasadaAddonLimit?: number;
    IsSpecialEvent?: boolean;
    StartTime?: string;
    IsAllDay?: boolean;
}

interface Customer {
    ID1?: number;
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
    Google_Maps_Location?: string;
}

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    prefillDate?: Date;
    prefillSeva?: string;
    prefillEventCode?: string;
    prefillDevotee?: any;
    onSuccess: (invoice: any) => void;
}

const Step = {
    Details: 1,
    Payment: 2
} as const;
type Step = typeof Step[keyof typeof Step];

export default function RegistrationModal({ isOpen, onClose, prefillDate, prefillSeva, prefillEventCode, prefillDevotee, onSuccess }: RegistrationModalProps) {
    const { showToast } = useToast();
    const [step, setStep] = useState<Step>(Step.Details);
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
    
    // Parse settings for food service
    const { settings: orgSettings } = useSettings();
    const defaultFoodRates = (orgSettings.foodServiceCharges || '100, 150, 200').split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
    if (defaultFoodRates.length === 0) defaultFoodRates.push(200);
    const [foodServiceRateStr, setFoodServiceRateStr] = useState<string>(defaultFoodRates[0]?.toString() || '200');

    // Payment Step State
    const [paymentMode, setPaymentMode] = useState<'Cash' | 'Cheque' | 'DD' | 'UPI' | 'Netbanking'>('Cash');
    const [paymentRef, setPaymentRef] = useState('');
    // Granular Payment Details
    const [upiDetails, setUpiDetails] = useState({ gateway: '', transactionId: '', vpa: '', screenshot: '' });
    const [chqDetails, setChqDetails] = useState({ accNo: '', holder: '', bank: '', branch: '', date: '', number: '' });
    const [netDetails, setNetDetails] = useState({ bank: '', utr: '', date: '' });
    const [uploading, setUploading] = useState(false);
    const [verifyingUpi, setVerifyingUpi] = useState(false);
    const [upiStatus, setUpiStatus] = useState<{ status: 'idle' | 'success' | 'failure', message: string }>({ status: 'idle', message: '' });

    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed
            setStep(Step.Details);
            setCustomer(initialCustomer);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedItemCode('');
            setFamilyMembers(0);
            setOptPrasada(false);
            setPaymentMode('Cash');
            setPaymentRef('');
            setUpiDetails({ gateway: '', transactionId: '', vpa: '', screenshot: '' });
            setChqDetails({ accNo: '', holder: '', bank: '', branch: '', date: '', number: '' });
            setNetDetails({ bank: '', utr: '', date: '' });
            setUpiStatus({ status: 'idle', message: '' });
            setIsNewCustomer(true);
        } else {
            if (prefillDate) setSelectedDate(prefillDate);
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
                    ID1: prefillDevotee.DevoteeId
                });
                setIsNewCustomer(false);
                if (prefillDevotee.Name) {
                    setStep(Step.Details);
                }
            }
            fetchItems();
        }
    }, [isOpen, prefillDate, prefillDevotee]);

    const fetchItems = async () => {
        try {
            // Use /api/sevas which maps directly to our modernized DB
            const res = await fetch('/api/sevas');
            if (res.ok) {
                const data = await res.json();
                // Map the new fields to what the component expects
                const mappedData = data.map((i: any) => ({
                    ...i,
                    ItemCode: i.SevaCode,
                    Basic: i.Amount,
                    Prasada_Addon_Limit: i.PrasadaAddonLimit
                }));
                setItems(mappedData);
                
                if (prefillEventCode) {
                    setSelectedItemCode(prefillEventCode);
                } else if (prefillSeva) {
                    const match = mappedData.find((i: SevaItem) => i.Description.includes(prefillSeva) || prefillSeva.includes(i.Description));
                    if (match) setSelectedItemCode(match.ItemCode);
                }
            }
        } catch {
            showToast('error', 'ಸೇವೆಗಳ ಪಟ್ಟಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ (Failed to load sevas)');
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 2) {
                handleSearch();
            } else if (searchQuery.trim().length === 0) {
                setSearchResults([]);
            }
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
                City: c.City ? await transliterateToKannada(c.City) : ''
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
            Name: c.Name || '',
            NameEn: (c.NameEn && c.NameEn !== c.Name) ? c.NameEn : '',
            Phone: c.Phone || '',
            Sgotra: c.Gotra || '',
            SgotraEn: (c.GotraEn && c.GotraEn !== c.Gotra) ? c.GotraEn : '',
            SNakshatra: c.Nakshatra || '',
            SNakshatraEn: (c.NakshatraEn && c.NakshatraEn !== c.Nakshatra) ? c.NakshatraEn : '',
            Address: c.Address || '',
            City: c.City || '',
            CityEn: (c.CityEn && c.CityEn !== c.City) ? c.CityEn : '',
            WhatsApp_Phone: c.WhatsApp_Phone || '',
            Email_ID: c.Email || '',
            ID1: c.DevoteeId
        });
        setIsNewCustomer(false);
        setSearchResults([]);
    };

    const validateDevotee = () => {
        if (!customer.Name.trim()) { showToast('error', 'ಹೆಸರು ಕಡ್ಡಾಯವಾಗಿದೆ (Name is required)'); return false; }
        if (!customer.Phone.trim()) { showToast('error', 'ಫೋನ್ ಸಂಖ್ಯೆ ಕಡ್ಡಾಯವಾಗಿದೆ (Phone is required)'); return false; }
        return true;
    };

    const validateSeva = () => {
        if (!selectedItemCode) { showToast('error', 'ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ (Select a Seva)'); return false; }
        
        // Prevent past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selDate = new Date(selectedDate);
        selDate.setHours(0, 0, 0, 0);
        
        if (selDate < today) {
            showToast('error', 'ಹಿಂದಿನ ದಿನಾಂಕಗಳಿಗೆ ಸೇವೆ ಬುಕ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ (Cannot book for past dates)');
            return false;
        }

        // Special check for event times if it is today
        if (selDate.getTime() === today.getTime()) {
            const item = getSelectedItem();
            if (item && item.IsSpecialEvent && item.StartTime && !item.IsAllDay) {
                const timeParts = item.StartTime.split(':');
                if (timeParts.length >= 2) {
                    const hours = parseInt(timeParts[0], 10);
                    const mins = parseInt(timeParts[1], 10);
                    const now = new Date();
                    if (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= mins)) {
                        showToast('error', `ಈ ಸೇವೆಯ ಸಮಯ ಮುಕ್ತಾಯವಾಗಿದೆ (Event time ${item.StartTime} has passed for today)`);
                        return false;
                    }
                }
            }
        }
        
        return true;
    };

    const getSelectedItem = () => items.find(i => i.ItemCode === selectedItemCode);
    const calculateTotal = () => {
        const item = getSelectedItem();
        if (!item) return 0;
        let total = item.Amount || item.Basic || 0;
        if (optPrasada) {
            // Food service is charged for additional people only
            total += familyMembers * (parseInt(foodServiceRateStr) || 0);
        }
        return total;
    };

    const handleSubmit = async () => {
        if (!validateDevotee() || !validateSeva()) return;

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

        setLoading(true);
        try {
            // 1. Ensure Devotee exists or create them
            let devoteeId = (customer as any).DevoteeId;
            if (isNewCustomer || !devoteeId) {
                const devoteePayload = {
                    Name: customer.Name,
                    Phone: customer.Phone || null,
                    WhatsApp_Phone: customer.WhatsApp_Phone || null,
                    Email: (customer as any).Email || null,
                    Gotra: customer.Sgotra || null,
                    Nakshatra: customer.SNakshatra || null,
                    Address: customer.Address || null,
                    City: customer.City || null,
                    PinCode: (customer as any).PinCode || null,
                };
                const custRes = await devoteeApi.create(devoteePayload);
                devoteeId = custRes.data.DevoteeId;
            }

            // Format date as DDMMYY
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const year = selectedDate.getFullYear().toString().slice(-2);
            const ddmmyy = `${day}${month}${year}`;

            // 2. Submit SevaRegistration
            const total = calculateTotal();
            const regData = {
                RegistrationDate: ddmmyy,
                SevaDate: ddmmyy,
                DevoteeId: devoteeId,
                SevaCode: selectedItemCode,
                Qty: 1,
                Rate: getSelectedItem()?.Amount || 0.0,
                Amount: getSelectedItem()?.Amount || 0.0,
                OptTheerthaPrasada: optPrasada,
                PrasadaCount: optPrasada ? familyMembers : 0,
                PaymentMode: paymentMode,
                PaymentReference: paymentRef || null,
                PaymentDetails: paymentMode === 'UPI' ? upiDetails : 
                                (paymentMode === 'Cheque' || paymentMode === 'DD') ? chqDetails :
                                paymentMode === 'Netbanking' ? netDetails : null,
                VoucherNo: `VCH-${Date.now()}`,
                Remarks: null,
                GrandTotal: total
            };

            const invRes = await registrationApi.create(regData);
            const createdRegistration = invRes.data;

            showToast('success', 'ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ! (Registration Successful)');
            
            const trimGotra = (customer.Sgotra || '').trim();
            const trimNak = (customer.SNakshatra || '').trim();
            const gotraMatch = GOTRAS.find(g => g.kn === trimGotra || g.en === trimGotra);
            const nakshatraMatch = NAKSHATRAS.find(n => n.kn === trimNak || n.en === trimNak);
            
            const isKannada = (str: string) => /[\u0C80-\u0CFF]/.test(str);
            const richCustomer = {
                ...customer,
                NameEn: customer.NameEn && !isKannada(customer.NameEn) ? customer.NameEn : 
                        (searchQuery && !isKannada(searchQuery) ? searchQuery : (customer.NameEn || '')),
                SgotraEn: gotraMatch ? gotraMatch.en : (customer.SgotraEn && !isKannada(customer.SgotraEn) ? customer.SgotraEn : ''),
                SNakshatraEn: nakshatraMatch ? nakshatraMatch.en : (customer.SNakshatraEn && !isKannada(customer.SNakshatraEn) ? customer.SNakshatraEn : ''),
            };

            onSuccess({ invoice: createdRegistration, customer: richCustomer, item: getSelectedItem() });
        } catch (err: any) {
            console.error('Registration error:', err?.response?.data || err);
            showToast('error', 'ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ (Registration Failed)');
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
            if (status === 'success') {
                showToast('success', message);
            } else {
                showToast('error', message);
            }
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

    const getUnifiedSuggestions = (list: {en: string, kn: string}[]) => {
        return list.flatMap(i => [i.en, i.kn]);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={onClose}
                    />

                    {/* Centered Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-[var(--glass-border)] flex flex-col md:flex-row h-[85vh] mt-8 z-10"
                    >
                        {/* Sidebar Pattern */}
                        <div className="hidden md:flex flex-col w-48 bg-gradient-to-b from-[var(--primary)] to-amber-600 text-white p-4 relative flex-shrink-0">
                            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-20 mix-blend-overlay" />
                            <div className="relative z-10">
                                <h2 className="text-lg font-bold mb-6">ಸೇವಾ ನೋಂದಣಿ</h2>

                                <div className="space-y-4">
                                    <StepIndicator currStep={step} num={1} label="ಭಕ್ತರ & ಸೇವಾ ವಿವರ" icon={<User size={18} />} />
                                    <StepIndicator currStep={step} num={2} label="ಪಾವತಿ ಮಾಹಿತಿ" icon={<CreditCard size={18} />} />
                                </div>
                            </div>
                        </div>

                        {/* Mobile Header */}
                        <div className="md:hidden bg-[var(--primary)] text-white p-4 flex justify-between items-center shrink-0 z-20 relative">
                            <h2 className="font-bold">ಸೇವಾ ನೋಂದಣಿ - {step}/2</h2>
                            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full"><X size={20} /></button>
                        </div>

                    {/* Content Area */}
                    <div className="flex-1 px-4 py-2 relative overflow-y-auto w-full h-full max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <GlobalInputToolbar />
                            <button onClick={onClose} className="hidden md:block p-1.5 text-[var(--text-secondary)] hover:bg-black/5 rounded-full z-10 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="h-full flex flex-col overflow-hidden">
                            {/* STEP 1: DETAILS (DEVOTEE + SEVA) */}
                            {step === Step.Details && (
                                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col h-full overflow-hidden">
                                    <div className="flex-1 overflow-y-auto pr-1.5 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-20">
                                        {/* Left Column: Devotee */}
                                        <div className="flex flex-col space-y-2 border-r-0 lg:border-r border-[var(--glass-border)] lg:pr-4">
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1.5 flex items-center gap-2">
                                        <Search className="text-[var(--primary)]" size={16} /> ಭಕ್ತರ ಹುಡುಕಾಟ
                                    </h3>

                                    {isNewCustomer ? (
                                        <div className="flex gap-2 mb-2">
                                            <div className="flex-1 relative">
                                                <TransliteratedInput
                                                    value={searchQuery}
                                                    onChange={(v) => setSearchQuery(v)}
                                                    placeholder="ಹೆಸರು ಅಥವಾ ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ"
                                                />
                                                {isSearching && (
                                                    <Loader2 size={16} className="absolute right-3 top-2.5 text-[var(--text-secondary)] animate-spin" />
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/20 rounded-lg p-2 mb-2 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-green-700 dark:text-green-400 mb-0.5 uppercase tracking-wider">ಆಯ್ಕೆಯಾದ ಭಕ್ತರು</p>
                                                <p className="text-base font-bold text-[var(--text-primary)]">{customer.Name}</p>
                                                <p className="text-xs text-[var(--text-secondary)]">{customer.Phone}</p>
                                            </div>
                                            <button 
                                                onClick={() => { setIsNewCustomer(true); setCustomer({ Name: '', Phone: '', Sgotra: '', SNakshatra: '', Address: '', City: '' }); setSearchQuery(''); }} 
                                                className="text-sm flex py-2 px-3 items-center gap-1 font-bold text-green-700 dark:text-green-400 hover:bg-green-200/50 dark:hover:bg-green-800/30 rounded-lg transition-colors"
                                            >
                                                <X size={16} /> ಬದಲಾಯಿಸಿ
                                            </button>
                                        </div>
                                    )}

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 mb-6">
                                            <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-3 uppercase tracking-wider">{searchResults.length} ಫಲಿತಾಂಶಗಳು</p>
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

                                    <div className="h-px w-full bg-[var(--glass-border)] my-2 relative">
                                        <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] px-2 text-[10px] font-bold text-[var(--text-secondary)]">
                                            {isNewCustomer ? 'ಅಥವಾ ಹೊಸ ವಿವರ ಸೇರಿಸಿ' : 'ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ'}
                                        </span>
                                    </div>

                                    {/* Manual Form */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ಪೂರ್ಣ ಹೆಸರು <span className="text-red-500">*</span></label>
                                            <TransliteratedInput value={customer.Name} onChange={(v) => setCustomer({ ...customer, Name: v })} placeholder="ಹೆಸರು" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ಫೋನ್ ನಂಬರ್ <span className="text-red-500">*</span></label>
                                            <input type="tel" value={customer.Phone} onChange={(e) => setCustomer({ ...customer, Phone: convertKnNumeralsToEn(e.target.value) })} placeholder="9999999999" className="w-full px-2 py-1.5 text-sm rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ಗೋತ್ರ</label>
                                            <TransliteratedInput value={customer.Sgotra} onChange={(v) => setCustomer({ ...customer, Sgotra: v })} placeholder="ಗೋತ್ರ" list="gotra-list" />
                                            <datalist id="gotra-list">
                                                {getUnifiedSuggestions(GOTRAS).map((g: string) => <option key={g} value={g} />)}
                                            </datalist>
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ನಕ್ಷತ್ರ</label>
                                            <TransliteratedInput value={customer.SNakshatra} onChange={(v) => setCustomer({ ...customer, SNakshatra: v })} placeholder="ನಕ್ಷತ್ರ" list="nakshatra-list" />
                                            <datalist id="nakshatra-list">
                                                {getUnifiedSuggestions(NAKSHATRAS).map((n: string) => <option key={n} value={n} />)}
                                            </datalist>
                                        </div>
                                        <div className="md:col-span-2 space-y-0.5">
                                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ವಿಳಾಸ</label>
                                            <TransliteratedInput value={customer.Address} onChange={(v) => setCustomer({ ...customer, Address: v })} placeholder="ವಿಳಾಸ" multiline />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ನಗರ</label>
                                            <TransliteratedInput value={customer.City} onChange={(v) => setCustomer({ ...customer, City: v })} placeholder="ನಗರ" />
                                        </div>
                                    </div>
                                        </div>

                                        {/* Right Column: Seva */}
                                        <div className="flex flex-col space-y-2">
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-1.5 relative">
                                        <Receipt className="text-[var(--primary)]" size={16} /> ಸೇವಾ ವಿವರಗಳು
                                    </h3>
                                    


                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">ದಿನಾಂಕ</label>
                                            <input
                                                type="date"
                                                min={new Date().toLocaleDateString('en-CA')}
                                                value={selectedDate.toLocaleDateString('en-CA')}
                                                onChange={(e) => {
                                                    const d = e.target.value;
                                                    if (d) {
                                                        const [y, m, day] = d.split('-');
                                                        setSelectedDate(new Date(Number(y), Number(m) - 1, Number(day)));
                                                    }
                                                }}
                                                className="w-full px-2 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                            />
                                        </div>

                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">ಸೇವೆ / ಈವೆಂಟ್ <span className="text-red-500">*</span></label>
                                            <select
                                                value={selectedItemCode}
                                                onChange={(e) => setSelectedItemCode(e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                                            >
                                                <option value="">-- ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ --</option>
                                                {items.map(item => (
                                                    <option key={item.ItemCode} value={item.ItemCode}>
                                                        {item.Description} (₹{item.Basic})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg p-2.5 space-y-2">
                                        <div className="flex items-center justify-between pb-2 border-b border-blue-100 dark:border-blue-900/30">
                                            <div className="space-y-0.5 cursor-pointer" onClick={() => setOptPrasada(!optPrasada)}>
                                                <label className="text-xs font-bold text-orange-600 dark:text-orange-400 cursor-pointer">ತೀರ್ಥ ಪ್ರಸಾದ ವ್ಯವಸ್ಥೆ</label>
                                            </div>

                                            <button
                                                onClick={() => setOptPrasada(!optPrasada)}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${optPrasada ? 'bg-[var(--accent-saffron)]' : 'bg-slate-300 dark:bg-slate-700'}`}
                                            >
                                                <motion.div
                                                    animate={{ x: optPrasada ? 20 : 2 }}
                                                    className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm"
                                                />
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {optPrasada && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1"
                                                >
                                                    <div className="flex flex-col md:flex-row justify-between w-full gap-3">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 flex-1 pr-3 border-r border-blue-100 dark:border-blue-900/30">
                                                            <div className="space-y-0.5">
                                                                <label className="text-xs font-bold text-[var(--text-primary)]">ಹೆಚ್ಚುವರಿ ಸದಸ್ಯರು</label>
                                                            </div>
                                                            <input
                                                                type="number" min="0" max="20"
                                                                value={familyMembers}
                                                                onChange={(e) => setFamilyMembers(parseInt(convertKnNumeralsToEn(e.target.value)) || 0)}
                                                                className="w-20 px-2 py-1 text-sm text-center rounded-md bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)]"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 flex-1">
                                                            <label className="text-xs font-bold text-[var(--text-primary)]">ದರ</label>
                                                            <div className="relative w-24">
                                                                <select
                                                                    value={foodServiceRateStr}
                                                                    onChange={(e) => setFoodServiceRateStr(convertKnNumeralsToEn(e.target.value))}
                                                                    className="w-full px-2 py-1 text-sm rounded-md bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)]"
                                                                >
                                                                    {defaultFoodRates.map((rate: number) => (
                                                                        <option key={rate} value={rate}>₹{rate}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex-1" />
                                    {selectedItemCode && (
                                        <div className="bg-slate-50 dark:bg-slate-800 border border-[var(--primary)]/30 rounded-xl p-3 flex justify-between items-center bg-gradient-to-r from-[var(--glass-bg)] to-orange-50 dark:to-orange-900/10">
                                            <span className="font-medium text-[var(--text-secondary)] uppercase text-sm">ಒಟ್ಟು ಮೊತ್ತ</span>
                                            <span className="text-xl font-black text-[var(--primary)]">₹{calculateTotal()}</span>
                                        </div>
                                    )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: PAYMENT */}
                            {step === Step.Payment && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col space-y-2 h-full overflow-y-auto pr-1 pb-4">
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-1.5 relative">
                                        <CreditCard className="text-[var(--primary)]" size={16} /> ಪಾವತಿ ವಿಧಾನ
                                    </h3>

                                    <div className="grid grid-cols-2 gap-2 max-w-xs">
                                        {['Cash', 'UPI'].map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setPaymentMode(mode as any)}
                                                className={`py-2 px-1 rounded-lg border text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all ${paymentMode === mode
                                                    ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] shadow-sm'
                                                    : 'bg-slate-50 dark:bg-slate-800 border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-white/50 dark:hover:bg-black/20'
                                                    }`}
                                            >
                                                {mode === 'Cash' ? 'ನಗದು' : 'UPI'}
                                            </button>
                                        ))}
                                    </div>

                                    {paymentMode === 'UPI' && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-[var(--glass-border)]">
                                            {orgSettings.upiQrCode ? (
                                                <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                                                    <img src={orgSettings.upiQrCode} alt="UPI QR Code" className="w-32 h-32 object-cover rounded-xl shadow-md border-4 border-white" />
                                                    {orgSettings.upiVpa && <p className="text-[10px] font-mono text-[var(--text-secondary)]">{orgSettings.upiVpa}</p>}
                                                </div>
                                            ) : (
                                                <div className="bg-orange-50 text-orange-600 p-2 rounded-lg text-xs text-center">
                                                    QR Code is not configured.
                                                </div>
                                            )}
                                            
                                            <div className="space-y-1 max-w-md mx-auto">
                                                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Transaction ID / UTR Number <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={upiDetails.transactionId}
                                                    onChange={(e) => {
                                                        const cleaned = convertKnNumeralsToEn(e.target.value);
                                                        setUpiDetails({ ...upiDetails, transactionId: cleaned, gateway: 'Direct' });
                                                        setPaymentRef(cleaned);
                                                    }}
                                                    className="w-full px-2 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-sm font-mono text-center tracking-widest focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                                    placeholder="123456789012"
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="flex-1" />
                                    
                                    <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-lg p-2 flex gap-2 text-[10px] text-[var(--text-secondary)] border border-orange-100 dark:border-orange-500/10 mb-2">
                                        <Info className="shrink-0 text-orange-500 mt-0.5" size={14} />
                                        <p>ದಯವಿಟ್ಟು ಪಾವತಿ ಸ್ವೀಕರಿಸಿದ ನಂತರವೇ 'ಮುಕ್ತಾಯ' ಕ್ಲಿಕ್ ಮಾಡಿ. ವಹಿವಾಟು ಯಶಸ್ವಿಯಾದರೆ, ಸ್ವಯಂಚಾಲಿತವಾಗಿ ರಸೀದಿ ಸೃಷ್ಟಿಸಲಾಗುತ್ತದೆ.</p>
                                    </div>
                                    
                                    {/* Final Summary */}
                                    <div className="bg-slate-50 dark:bg-slate-800 border border-[var(--primary)]/30 rounded-xl p-3 flex justify-between items-center shadow-lg shadow-orange-500/5">
                                        <div>
                                            <p className="text-xs text-[var(--text-secondary)] font-bold mb-1">ಸೇವೆ: {getSelectedItem()?.Description || '-'}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">ಭಕ್ತರು: {customer.Name}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-[var(--text-secondary)] uppercase block mb-1">ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ ({paymentMode === 'Cash' ? 'ನಗದು' : 'UPI'})</span>
                                            <span className="text-xl font-black text-[var(--primary)]">₹{calculateTotal()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Footer Nav */}
                            <div className="flex justify-between mt-2 pt-2 border-t border-[var(--glass-border)] shrink-0 bg-white dark:bg-slate-900 z-10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (step > Step.Details) setStep(step - 1 as Step);
                                        else onClose();
                                    }}
                                    className="px-4 py-1.5 rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:bg-slate-50 dark:bg-slate-800 transition-colors"
                                >
                                    {step > Step.Details ? 'ಹಿಂದಕ್ಕೆ' : 'ರದ್ದುಮಾಡಿ'}
                                </button>

                                <button
                                    onClick={() => {
                                        if (step === Step.Details && validateDevotee() && validateSeva()) setStep(Step.Payment);
                                        else if (step === Step.Payment) handleSubmit();
                                    }}
                                    disabled={loading}
                                    className="px-6 py-1.5 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--accent-saffron)] text-white text-sm font-bold shadow-md hover:shadow-orange-500/30 transition-shadow disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    {step === Step.Payment ? 'ಮುಕ್ತಾಯ' : 'ಮುಂದುವರಿಯಿರಿ'}
                                </button>
                            </div>
                        </div>
                    </div>
                    </motion.div>
                </div>
            )}
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
