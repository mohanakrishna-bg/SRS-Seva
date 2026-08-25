import { motion, AnimatePresence } from 'framer-motion';
import { Receipt } from 'lucide-react';
import type { SevaItem } from '../RegistrationModal';
import { convertKnNumeralsToEn } from './DevoteeSelectionStep';

interface SevaDetailsStepProps {
    selectedDate: Date;
    setSelectedDate: (d: Date) => void;
    selectedItemCode: string;
    setSelectedItemCode: (c: string) => void;
    customSevaAmount: number | '';
    setCustomSevaAmount: (v: number | '') => void;
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
    selectedDate, setSelectedDate, selectedItemCode, setSelectedItemCode,
    customSevaAmount, setCustomSevaAmount, items,
    optPrasada, setOptPrasada, familyMembers, setFamilyMembers,
    foodServiceRateStr, setFoodServiceRateStr, defaultFoodRates, calculateTotal
}: SevaDetailsStepProps) {
    const selectedItem = items.find(i => String(i.ItemCode) === String(selectedItemCode));

    return (
        <div className="flex flex-col space-y-2.5 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-lg border border-[var(--glass-border)] h-full">
            <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-1.5">
                <Receipt className="text-[var(--primary)]" size={14} /> ಸೇವಾ ವಿವರಗಳು
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1">
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
                        className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                </div>

                <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">ಸೇವೆ <span className="text-red-500">*</span></label>
                    <select
                        value={selectedItemCode}
                        onChange={(e) => setSelectedItemCode(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)]"
                    >
                        {items.map(item => (
                            <option className="bg-[var(--bg-light)] dark:bg-slate-800" key={item.ItemCode} value={item.ItemCode}>
                                {item.Description} {(item.Basic ?? 0) > 0 ? `(₹${item.Basic})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedItem && (
                    <div className="space-y-0.5 sm:col-span-2 bg-orange-50/60 dark:bg-orange-950/20 p-2 rounded-lg border border-orange-200/60 dark:border-orange-900/30">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase block">
                                ಸೇವಾ ಶುಲ್ಕ (₹) <span className="text-red-500">*</span>
                            </label>
                        </div>
                        <input
                            type="number"
                            min="1"
                            value={customSevaAmount === 0 || customSevaAmount === '' ? '' : customSevaAmount}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                                const val = parseFloat(convertKnNumeralsToEn(e.target.value));
                                setCustomSevaAmount(isNaN(val) ? '' : val);
                            }}
                            placeholder="ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ"
                            className="w-full px-2.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 rounded-lg bg-white dark:bg-black/30 border border-orange-300/40 focus:outline-none focus:border-[var(--primary)] font-mono"
                        />
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
            {selectedItemCode && (
                <div className="bg-slate-50 dark:bg-slate-800 border border-[var(--primary)]/30 rounded-xl p-2.5 flex justify-between items-center bg-gradient-to-r from-[var(--glass-bg)] to-orange-50 dark:to-orange-900/10 shrink-0">
                    <span className="font-medium text-[var(--text-secondary)] uppercase text-xs">ಒಟ್ಟು ಮೊತ್ತ</span>
                    <span className="text-sm font-black text-[var(--primary)]">₹{calculateTotal()}</span>
                </div>
            )}
        </div>
    );
}
