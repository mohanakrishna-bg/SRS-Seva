import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { transliterateToKannada } from '../transliterate';
import { X, Loader2 } from 'lucide-react';
import GlobalInputToolbar from './GlobalInputToolbar';
import DevoteeSelectionStep from './registration/DevoteeSelectionStep';
import SevaDetailsStep from './registration/SevaDetailsStep';
import PaymentStep from './registration/PaymentStep';
import { useToast } from './Toast';
import { useSettings } from '../context/SettingsContext';
import { GOTRAS, NAKSHATRAS } from '../constants/panchanga';
import { devoteeApi, registrationApi } from '../api';

export interface SevaItem {
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
            showToast('error', 'ಸೇವೆಗಳ ಪಟ್ಟಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ');
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
            
            // First, transliterate all results so English and Kannada names unify
            const tkDataAll = await Promise.all(res.data.map(async (c: any) => ({
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

            // Then deduplicate based on the unified transliterated names
            const seen = new Set();
            const uniqueTkData = tkDataAll.filter((c: any) => {
                // Name is already transliterated, just remove spaces
                const normName = (c.Name || '').replace(/\s+/g, '');
                // Keep only last 10 digits to normalize phone
                const digits = (c.Phone || '').replace(/\D/g, '');
                const normPhone = digits.length >= 10 ? digits.slice(-10) : digits;
                
                const id = `${normName}-${normPhone}`;
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });

            setSearchResults(uniqueTkData);
        } catch {
            showToast('error', 'ಹುಡುಕಾಟ ವಿಫಲವಾಗಿದೆ');
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
        setSearchQuery('');
        setSearchResults([]);
    };

    const validateDevotee = () => {
        if (!customer.Name.trim()) { showToast('error', 'ಹೆಸರು ಕಡ್ಡಾಯವಾಗಿದೆ'); return false; }
        if (!customer.Phone.trim()) { showToast('error', 'ಫೋನ್ ಸಂಖ್ಯೆ ಕಡ್ಡಾಯವಾಗಿದೆ'); return false; }
        return true;
    };

    const validateSeva = () => {
        if (!selectedItemCode) { showToast('error', 'ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ'); return false; }
        
        // Prevent past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selDate = new Date(selectedDate);
        selDate.setHours(0, 0, 0, 0);
        
        if (selDate < today) {
            showToast('error', 'ಹಿಂದಿನ ದಿನಾಂಕಗಳಿಗೆ ಸೇವೆ ಬುಕ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ');
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

    const getSelectedItem = () => items.find(i => String(i.ItemCode) === String(selectedItemCode));
    const calculateTotal = () => {
        const item = getSelectedItem();
        if (!item) return 0;
        let total = parseFloat(String(item.Amount)) || parseFloat(String(item.Basic)) || 0;
        if (optPrasada) {
            // Food service is charged for additional people only
            total += familyMembers * (parseInt(foodServiceRateStr) || 0);
        }
        return total;
    };

    const handleSubmit = async () => {
        if (!validateDevotee() || !validateSeva()) return;

        if (paymentMode === 'UPI') {
            if (!upiDetails.transactionId) { showToast('error', 'Transaction ID is required'); return; }
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

            showToast('success', 'ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ!');
            
            const trimGotra = (customer.Sgotra || '').trim();
            const trimNak = (customer.SNakshatra || '').trim();
            const gotraMatch = GOTRAS.find(g => g.kn === trimGotra || g.en === trimGotra);
            const nakshatraMatch = NAKSHATRAS.find(n => n.kn === trimNak || n.en === trimNak);
            
            const isKannada = (str: string) => str ? /[\u0C80-\u0CFF]/.test(str) : false;
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
            showToast('error', 'ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] overflow-hidden flex items-start justify-center p-4 pt-24 pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity pointer-events-auto"
                    />

                    {/* Wrapper aligned with Layout max-w-6xl */}
                    <div className="relative w-full max-w-6xl mx-auto flex justify-end pointer-events-none">
                        {/* Modal Card pushed to the right to clear sidebar */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-[var(--glass-border)] flex flex-col max-h-[calc(100vh-6rem)] z-10 overflow-hidden pointer-events-auto"
                        >
                        {/* Unified Modal Header */}
                        <div className="bg-gradient-to-r from-[var(--primary)] to-amber-600 text-white px-4 py-3 flex justify-between items-center shrink-0 border-b border-[var(--glass-border)] z-20">
                            <div>
                                <h2 className="text-sm font-bold">ಸೇವಾ ನೋಂದಣಿ</h2>
                                <p className="text-[10px] text-white/80">
                                    {step === Step.Details ? 'ಹಂತ 1/2: ಭಕ್ತರ & ಸೇವಾ ವಿವರ (Step 1/2: Devotee & Seva Details)' : 'ಹಂತ 2/2: ಪಾವತಿ ಮಾಹಿತಿ (Step 2/2: Payment Info)'}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-5 overflow-y-auto w-full flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-3 shrink-0">
                                <GlobalInputToolbar />
                            </div>

                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* STEP 1: DETAILS (DEVOTEE + SEVA) */}
                                {step === Step.Details && (
                                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col h-full overflow-hidden">
                                        <div className="flex-1 overflow-y-auto pr-1.5 pb-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                                                <div className="flex-1 min-w-[280px]">
                                                    <DevoteeSelectionStep
                                                        customer={customer}
                                                        setCustomer={setCustomer}
                                                        isNewCustomer={isNewCustomer}
                                                        setIsNewCustomer={setIsNewCustomer}
                                                        searchQuery={searchQuery}
                                                        setSearchQuery={setSearchQuery}
                                                        isSearching={isSearching}
                                                        searchResults={searchResults}
                                                        selectCustomer={selectCustomer}
                                                    />
                                                </div>

                                                {/* Right Column: Seva */}
                                                <div className="flex-1 min-w-[280px]">
                                                    <SevaDetailsStep
                                                        selectedDate={selectedDate}
                                                        setSelectedDate={setSelectedDate}
                                                        selectedItemCode={selectedItemCode}
                                                        setSelectedItemCode={setSelectedItemCode}
                                                        items={items}
                                                        optPrasada={optPrasada}
                                                        setOptPrasada={setOptPrasada}
                                                        familyMembers={familyMembers}
                                                        setFamilyMembers={setFamilyMembers}
                                                        foodServiceRateStr={foodServiceRateStr}
                                                        setFoodServiceRateStr={setFoodServiceRateStr}
                                                        defaultFoodRates={defaultFoodRates}
                                                        calculateTotal={calculateTotal}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === Step.Payment && (
                                    <PaymentStep
                                        paymentMode={paymentMode}
                                        setPaymentMode={(m: any) => setPaymentMode(m)}
                                        orgSettings={orgSettings}
                                        upiDetails={upiDetails}
                                        setUpiDetails={setUpiDetails}
                                        setPaymentRef={setPaymentRef}
                                        calculateTotal={calculateTotal}
                                        getSelectedItem={getSelectedItem}
                                        customer={customer}
                                        optPrasada={optPrasada}
                                        familyMembers={familyMembers}
                                    />
                                )}

                                {/* Footer Nav */}
                                <div className="flex justify-between mt-2 pt-2 border-t border-[var(--glass-border)] shrink-0 bg-white dark:bg-slate-900 z-10">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (step > Step.Details) setStep(step - 1 as Step);
                                            else onClose();
                                        }}
                                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:bg-slate-50 dark:bg-slate-800 transition-colors"
                                    >
                                        {step > Step.Details ? 'ಹಿಂದಕ್ಕೆ' : 'ರದ್ದುಮಾಡಿ'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (step === Step.Details && validateDevotee() && validateSeva()) setStep(Step.Payment);
                                            else if (step === Step.Payment) handleSubmit();
                                        }}
                                        disabled={loading}
                                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--accent-saffron)] text-white text-xs font-bold shadow-md hover:shadow-orange-500/30 transition-shadow disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading && <Loader2 size={16} className="animate-spin" />}
                                        {step === Step.Payment ? 'ಮುಕ್ತಾಯ' : 'ಮುಂದುವರಿಯಿರಿ'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
