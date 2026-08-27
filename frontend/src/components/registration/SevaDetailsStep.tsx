import { motion, AnimatePresence } from 'framer-motion';
import { Receipt } from 'lucide-react';
import type { SevaItem, SelectedSeva } from '../RegistrationModal';
import { convertKnNumeralsToEn } from './DevoteeSelectionStep';
import { Trash2 } from 'lucide-react';

interface SevaDetailsStepProps {
    selectedDate: Date;
    setSelectedDate: (d: Date) => void;
    selectedSevas: SelectedSeva[];
    setSelectedSevas: (sevas: SelectedSeva[]) => void;
    items: SevaItem[];
    optPrasada: boolean;
    setOptPrasada: (v: boolean) => void;
    familyMembers: number;
    setFamilyMembers: (v: number) => void;
    foodServiceRateStr: string;
    setFoodServiceRateStr: (v: string) => void;
    defaultFoodRates: number[];
    calculateTotal: () => number;
}

export default function SevaDetailsStep({
    selectedDate, setSelectedDate, selectedSevas, setSelectedSevas,
    items,
    optPrasada, setOptPrasada, familyMembers, setFamilyMembers,
    foodServiceRateStr, setFoodServiceRateStr, defaultFoodRates, calculateTotal
}: SevaDetailsStepProps) {

    const handleAddSeva = (code: string) => {
        if (!code) return;
        if (selectedSevas.length >= 4) return;
        if (selectedSevas.find(s => s.sevaCode === code)) return;
        
        const item = items.find(i => String(i.ItemCode) === String(code));
        if (item) {
            const baseAmount = parseFloat(String(item.Amount ?? item.Basic ?? 0)) || 0;
            setSelectedSevas([
                ...selectedSevas, 
                { 
                    sevaCode: code, 
                    description: item.Description, 
                    amount: baseAmount > 0 ? baseAmount : '', 
                    isCustomPrice: baseAmount <= 0 
                }
            ]);
        }
    };

    const handleRemoveSeva = (code: string) => {
        setSelectedSevas(selectedSevas.filter(s => s.sevaCode !== code));
    };

    const handleUpdateAmount = (code: string, amountStr: string) => {
        const val = parseFloat(convertKnNumeralsToEn(amountStr));
        setSelectedSevas(selectedSevas.map(s => {
            if (s.sevaCode === code) {
                return { ...s, amount: isNaN(val) ? '' : val };
            }
            return s;
        }));
    };

    return (
        <div className="flex flex-col space-y-2.5 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-lg border border-[var(--glass-border)] h-full">
            <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-1.5">
                <Receipt className="text-[var(--primary)]" size={14} /> ಸೇವಾ ವಿವರಗಳು
            </h3>

            <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1">
                <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">ಸೇವಾ ದಿನಾಂಕ (Seva Date) <span className="text-red-500">*</span></label>
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
                        className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                </div>

                <div className="space-y-0.5 mt-1">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase flex justify-between">
                        <span>ಸೇವೆ ಸೇರಿಸಿ (Add Seva) <span className="text-red-500">*</span></span>
                        <span>{selectedSevas.length}/4</span>
                    </label>
                    <select
                        value=""
                        onChange={(e) => handleAddSeva(e.target.value)}
                        disabled={selectedSevas.length >= 4}
                        className="w-full px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)]"
                    >
                        <option value="" disabled>-- ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ --</option>
                        {items.map(item => (
                            <option className="bg-[var(--bg-light)] dark:bg-slate-800" key={item.ItemCode} value={item.ItemCode} disabled={!!selectedSevas.find(s => s.sevaCode === String(item.ItemCode))}>
                                {item.Description} {(item.Basic ?? 0) > 0 ? `(₹${item.Basic})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedSevas.length > 0 && (
                    <div className="space-y-2 mt-2">
                        {selectedSevas.map(seva => (
                            <div key={seva.sevaCode} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-[var(--glass-border)]">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">{seva.description}</p>
                                    {!seva.isCustomPrice && <p className="text-[10px] text-[var(--text-secondary)]">₹{seva.amount}</p>}
                                </div>
                                {seva.isCustomPrice && (
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="ಮೊತ್ತ (₹)"
                                            value={seva.amount}
                                            onChange={(e) => handleUpdateAmount(seva.sevaCode, e.target.value)}
                                            className="w-full px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 rounded border border-orange-300/40 focus:outline-none focus:border-[var(--primary)]"
                                        />
                                    </div>
                                )}
                                <button
                                    onClick={() => handleRemoveSeva(seva.sevaCode)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg p-2 space-y-1.5">
                <div className="flex items-center justify-between pb-1 border-b border-blue-100 dark:border-blue-900/30">
                    <div className="space-y-0.5 cursor-pointer" onClick={() => setOptPrasada(!optPrasada)}>
                        <label className="text-xs font-bold text-orange-600 dark:text-orange-400 cursor-pointer">ಹಸ್ತೋದಕ</label>
                    </div>

                    <button
                        type="button"
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
                            className="overflow-hidden flex flex-col gap-2 pt-1"
                        >
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ಹೆಚ್ಚುವರಿ ಸದಸ್ಯರು</label>
                                    <input
                                        type="number" min="0" max="20"
                                        value={familyMembers}
                                        onChange={(e) => setFamilyMembers(parseInt(convertKnNumeralsToEn(e.target.value)) || 0)}
                                        className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)]"
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">ದರ</label>
                                    <select
                                        value={foodServiceRateStr}
                                        onChange={(e) => setFoodServiceRateStr(convertKnNumeralsToEn(e.target.value))}
                                        className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)]"
                                    >
                                        {defaultFoodRates.map((rate: number) => (
                                            <option key={rate} value={rate.toString()}>₹{rate}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex-1 min-h-[16px]" />
            {selectedSevas.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 border border-[var(--primary)]/30 rounded-xl p-2.5 flex justify-between items-center bg-gradient-to-r from-[var(--glass-bg)] to-orange-50 dark:to-orange-900/10 shrink-0">
                    <span className="font-medium text-[var(--text-secondary)] uppercase text-xs">ಒಟ್ಟು ಮೊತ್ತ</span>
                    <span className="text-sm font-black text-[var(--primary)]">₹{calculateTotal()}</span>
                </div>
            )}
        </div>
    );
}
