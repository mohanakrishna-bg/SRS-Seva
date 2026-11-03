import { useState, useEffect } from 'react';
import { Search, Loader2, X, Check, RotateCcw, Plus } from 'lucide-react';
import TransliteratedInput from '../TransliteratedInput';
import { GOTRAS, NAKSHATRAS } from '../../constants/panchanga';
import { registrationApi } from '../../api';

export const convertKnNumeralsToEn = (knStr: string) => {
    const knMap: { [key: string]: string } = { '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4', '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9' };
    return knStr.replace(/[೦-೯]/g, match => knMap[match]);
};

export const getUnifiedSuggestions = (list: {en: string, kn: string}[]) => {
    return list.flatMap(i => [i.en, i.kn]);
};

interface DevoteeSelectionStepProps {
    customer: any;
    setCustomer: (c: any) => void;
    isNewCustomer: boolean;
    setIsNewCustomer: (val: boolean) => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    isSearching: boolean;
    searchResults: any[];
    selectCustomer: (c: any) => void;
    onRebookSeva?: (sevaCode: string) => void;
}

export default function DevoteeSelectionStep({
    customer, setCustomer, isNewCustomer, setIsNewCustomer,
    searchQuery, setSearchQuery, isSearching, searchResults, selectCustomer,
    onRebookSeva
}: DevoteeSelectionStepProps) {
    const [pastSevas, setPastSevas] = useState<any[]>([]);
    const [loadingPastSevas, setLoadingPastSevas] = useState(false);

    useEffect(() => {
        const devId = customer?.DevoteeId || customer?.ID1;
        if (!isNewCustomer && devId) {
            setLoadingPastSevas(true);
            registrationApi.byDevotee(devId)
                .then((res: any) => {
                    const regs: any[] = res.data || [];
                    const map = new Map<string, any>();
                    for (const r of regs) {
                        if (r.SevaCode && !map.has(r.SevaCode)) {
                            map.set(r.SevaCode, r);
                        }
                    }
                    setPastSevas(Array.from(map.values()).slice(0, 4));
                })
                .catch(() => setPastSevas([]))
                .finally(() => setLoadingPastSevas(false));
        } else {
            setPastSevas([]);
        }
    }, [isNewCustomer, customer?.DevoteeId, customer?.ID1]);

    return (
        <div className="flex flex-col space-y-3.5 bg-slate-50/60 dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-[var(--glass-border)] h-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2.5">
                <span className="flex items-center gap-2 text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    <Search className="text-[var(--primary)]" size={18} />
                    <span>ಭಕ್ತರ ಹುಡುಕಿ / ವಿವರ (Devotee Info)</span>
                </span>
            </div>

            {isNewCustomer ? (
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        ಹೆಸರು ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮೂಲಕ ಹುಡುಕಿ
                    </label>
                    <div className="relative">
                        <TransliteratedInput
                            value={searchQuery}
                            onChange={(v) => setSearchQuery(v)}
                            placeholder="ಹೆಸರು ಅಥವಾ 10-ಅಂಕಿಯ ಫೋನ್ ಸಂಖ್ಯೆ..."
                        />
                        {isSearching && (
                            <Loader2 size={16} className="absolute right-3 top-3 text-[var(--text-secondary)] animate-spin" />
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {/* Selected Devotee Summary Card */}
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 sm:p-3.5 flex items-center justify-between shadow-2xs">
                        <div>
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                                ಆಯ್ಕೆಯಾದ ಭಕ್ತರು (Selected Devotee)
                            </p>
                            <p className="text-sm sm:text-base font-bold text-[var(--text-primary)]">{customer.Name}</p>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono">{customer.Phone}</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => { 
                                setIsNewCustomer(true); 
                                setCustomer({ Name: '', Phone: '', Sgotra: '', SNakshatra: '', Address: '', City: '' }); 
                                setSearchQuery(''); 
                            }} 
                            className="text-xs sm:text-sm flex py-2 px-3 items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 hover:bg-emerald-200/70 rounded-xl transition-colors cursor-pointer"
                        >
                            <X size={16} /> ಬದಲಾಯಿಸಿ (Change)
                        </button>
                    </div>

                    {/* Quick Rebook for returning devotees */}
                    <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 sm:p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                                <RotateCcw size={14} className="text-amber-600" /> ಹಿಂದಿನ ಸೇವೆಗಳ ಮರು ನೋಂದಣಿ (Quick Rebook)
                            </span>
                            {loadingPastSevas && <Loader2 size={14} className="animate-spin text-amber-600" />}
                        </div>
                        {pastSevas.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {pastSevas.map((ps) => (
                                    <button
                                        key={ps.RegistrationId || ps.SevaCode}
                                        type="button"
                                        onClick={() => onRebookSeva && onRebookSeva(ps.SevaCode)}
                                        className="text-xs bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs transition-all font-medium cursor-pointer"
                                        title={`${ps.SevaName || ps.SevaCode} - ₹${ps.Amount}`}
                                    >
                                        <span className="font-semibold">{ps.SevaNameKn || ps.SevaName || ps.SevaCode}</span>
                                        <span className="text-xs font-mono text-amber-700 dark:text-amber-400 font-bold">₹{ps.Amount}</span>
                                        <Plus size={14} className="text-amber-700 dark:text-amber-300" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--text-secondary)] italic">
                                {loadingPastSevas ? 'ಹಿಂದಿನ ಸೇವೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : 'ಹಿಂದಿನ ಸೇವೆಗಳ ದಾಖಲೆ ಇಲ್ಲ'}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Instant Search Results Dropdown/Card */}
            {isNewCustomer && searchResults.length > 0 && (
                <div className="bg-orange-50/90 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-xl p-3 shadow-sm">
                    <p className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-2 uppercase tracking-wider">
                        {searchResults.length} ಭಕ್ತರು ಲಭ್ಯವಿದೆ (Select from existing):
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {searchResults.map(res => (
                            <button
                                key={res.ID1}
                                type="button"
                                onClick={() => selectCustomer(res)}
                                className="w-full text-left bg-white dark:bg-slate-800 p-2.5 rounded-lg hover:border-[var(--primary)] border border-transparent transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                            >
                                <div>
                                    <div className="font-bold text-[var(--text-primary)] text-sm">{res.Name}</div>
                                    <div className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">{res.Phone} {res.City ? `• ${res.City}` : ''}</div>
                                </div>
                                <Check size={16} className="text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Form Section Separator */}
            <div className="h-px w-full bg-[var(--glass-border)] my-1 relative">
                <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] px-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {isNewCustomer ? 'ಅಥವಾ ಹೊಸ ವಿವರ ನಮೂದಿಸಿ' : 'ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ'}
                </span>
            </div>

            {/* Devotee Input Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        ಪೂರ್ಣ ಹೆಸರು (Full Name) <span className="text-red-500">*</span>
                    </label>
                    <TransliteratedInput 
                        value={customer.Name} 
                        onChange={(v) => setCustomer({ ...customer, Name: v })} 
                        placeholder="ಭಕ್ತರ ಹೆಸರು" 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        ಫೋನ್ ನಂಬರ್ (Phone) <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="tel" 
                        value={customer.Phone} 
                        onChange={(e) => setCustomer({ ...customer, Phone: convertKnNumeralsToEn(e.target.value) })} 
                        placeholder="9999999999" 
                        className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] shadow-2xs font-mono" 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        ಗೋತ್ರ (Gotra)
                    </label>
                    <TransliteratedInput 
                        value={customer.Sgotra} 
                        onChange={(v) => setCustomer({ ...customer, Sgotra: v })} 
                        placeholder="ಗೋತ್ರ" 
                        list="gotra-list" 
                    />
                    <datalist id="gotra-list">
                        {getUnifiedSuggestions(GOTRAS).map((g) => <option key={g} value={g} />)}
                    </datalist>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        ನಕ್ಷತ್ರ (Nakshatra)
                    </label>
                    <TransliteratedInput 
                        value={customer.SNakshatra} 
                        onChange={(v) => setCustomer({ ...customer, SNakshatra: v })} 
                        placeholder="ನಕ್ಷತ್ರ" 
                        list="nakshatra-list" 
                    />
                    <datalist id="nakshatra-list">
                        {getUnifiedSuggestions(NAKSHATRAS).map((n) => <option key={n} value={n} />)}
                    </datalist>
                </div>
                <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        ವಿಳಾಸ (Address)
                    </label>
                    <TransliteratedInput 
                        value={customer.Address} 
                        onChange={(v) => setCustomer({ ...customer, Address: v })} 
                        placeholder="ವಿಳಾಸ" 
                        multiline 
                    />
                </div>
                <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        ನಗರ ಮತ್ತು ಪಿನ್ ಸಂಖ್ಯೆ (City & Pin)
                    </label>
                    <TransliteratedInput 
                        value={customer.City} 
                        onChange={(v) => setCustomer({ ...customer, City: v })} 
                        placeholder="ಉದಾ: ಮೈಸೂರು 570009" 
                    />
                </div>
            </div>
        </div>
    );
}
