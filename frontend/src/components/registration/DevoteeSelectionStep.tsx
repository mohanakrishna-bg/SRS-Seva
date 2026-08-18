import { Search, Loader2, X, Check } from 'lucide-react';
import TransliteratedInput from '../TransliteratedInput';
import { GOTRAS, NAKSHATRAS } from '../../constants/panchanga';

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
}

export default function DevoteeSelectionStep({
    customer, setCustomer, isNewCustomer, setIsNewCustomer,
    searchQuery, setSearchQuery, isSearching, searchResults, selectCustomer
}: DevoteeSelectionStepProps) {
    return (
        <div className="flex flex-col space-y-2 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-lg border border-[var(--glass-border)] h-full">
            <h3 className="text-xs font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2 border-b border-[var(--glass-border)] pb-1.5">
                <Search className="text-[var(--primary)]" size={14} /> ಭಕ್ತರ ಹುಡುಕಿ
            </h3>

            {isNewCustomer ? (
                <div className="flex gap-2 mb-1">
                    <div className="flex-1 relative">
                        <TransliteratedInput
                            value={searchQuery}
                            onChange={(v) => setSearchQuery(v)}
                            placeholder="ಹೆಸರು ಅಥವಾ ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ"
                        />
                        {isSearching && (
                            <Loader2 size={14} className="absolute right-3 top-2 text-[var(--text-secondary)] animate-spin" />
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/20 rounded-lg p-2 mb-1 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-bold text-green-700 dark:text-green-400 mb-0.5 uppercase tracking-wider">ಆಯ್ಕೆಯಾದ ಭಕ್ತರು</p>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{customer.Name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{customer.Phone}</p>
                    </div>
                    <button 
                        type="button"
                        onClick={() => { setIsNewCustomer(true); setCustomer({ Name: '', Phone: '', Sgotra: '', SNakshatra: '', Address: '', City: '' }); setSearchQuery(''); }} 
                        className="text-xs flex py-1.5 px-2.5 items-center gap-1 font-bold text-green-700 dark:text-green-400 hover:bg-green-200/50 dark:hover:bg-green-800/30 rounded-lg transition-colors"
                    >
                        <X size={14} /> ಬದಲಾಯಿಸಿ
                    </button>
                </div>
            )}

            {isNewCustomer && searchResults.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-3 mb-2">
                    <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wider">{searchResults.length} ಫಲಿತಾಂಶಗಳು</p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {searchResults.map(res => (
                            <button
                                key={res.ID1}
                                type="button"
                                onClick={() => selectCustomer(res)}
                                className="w-full text-left bg-white dark:bg-black/30 p-2 rounded-lg hover:border-[var(--primary)] border border-transparent transition-all flex items-center justify-between group"
                            >
                                <div>
                                    <div className="font-bold text-[var(--text-primary)] text-xs">{res.Name}</div>
                                    <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">{res.Phone} • {res.City || 'No City'}</div>
                                </div>
                                <Check size={14} className="text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="h-px w-full bg-[var(--glass-border)] my-1.5 relative">
                <span className="absolute left-1/2 -top-2 -translate-x-1/2 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] px-2 text-[9px] font-bold text-[var(--text-secondary)]">
                    {isNewCustomer ? 'ಅಥವಾ ಹೊಸ ವಿವರ ಸೇರಿಸಿ' : 'ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ'}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1">
                <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ಪೂರ್ಣ ಹೆಸರು <span className="text-red-500">*</span></label>
                    <TransliteratedInput value={customer.Name} onChange={(v) => setCustomer({ ...customer, Name: v })} placeholder="ಹೆಸರು" />
                </div>
                <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ಫೋನ್ ನಂಬರ್ <span className="text-red-500">*</span></label>
                    <input type="tel" value={customer.Phone} onChange={(e) => setCustomer({ ...customer, Phone: convertKnNumeralsToEn(e.target.value) })} placeholder="9999999999" className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ಗೋತ್ರ</label>
                    <TransliteratedInput value={customer.Sgotra} onChange={(v) => setCustomer({ ...customer, Sgotra: v })} placeholder="ಗೋತ್ರ" list="gotra-list" />
                    <datalist id="gotra-list">
                        {getUnifiedSuggestions(GOTRAS).map((g) => <option key={g} value={g} />)}
                    </datalist>
                </div>
                <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ನಕ್ಷತ್ರ</label>
                    <TransliteratedInput value={customer.SNakshatra} onChange={(v) => setCustomer({ ...customer, SNakshatra: v })} placeholder="ನಕ್ಷತ್ರ" list="nakshatra-list" />
                    <datalist id="nakshatra-list">
                        {getUnifiedSuggestions(NAKSHATRAS).map((n) => <option key={n} value={n} />)}
                    </datalist>
                </div>
                <div className="sm:col-span-2 space-y-0.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ವಿಳಾಸ</label>
                    <TransliteratedInput value={customer.Address} onChange={(v) => setCustomer({ ...customer, Address: v })} placeholder="ವಿಳಾಸ" multiline />
                </div>
                <div className="sm:col-span-2 space-y-0.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ನಗರ ಮತ್ತು ಪಿನ್ ಸಂಖ್ಯೆ</label>
                    <TransliteratedInput value={customer.City} onChange={(v) => setCustomer({ ...customer, City: v })} placeholder="ನಗರ ಮತ್ತು ಪಿನ್ ಸಂಖ್ಯೆ" />
                </div>
            </div>
        </div>
    );
}
