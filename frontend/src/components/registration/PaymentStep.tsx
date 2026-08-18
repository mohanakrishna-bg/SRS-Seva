import { motion } from 'framer-motion';
import { CreditCard, Info } from 'lucide-react';
import type { SevaItem } from '../RegistrationModal';
import { convertKnNumeralsToEn } from './DevoteeSelectionStep';
import upiQrImage from '../../assets/upi-qr.jpeg';

interface PaymentStepProps {
    paymentMode: string;
    setPaymentMode: (m: string) => void;
    orgSettings?: any;
    upiDetails: any;
    setUpiDetails: (d: any) => void;
    setPaymentRef: (r: string) => void;
    calculateTotal: () => number;
    getSelectedItem: () => SevaItem | undefined;
    customer: any;
    optPrasada: boolean;
    familyMembers: number;
}

export default function PaymentStep({
    paymentMode, setPaymentMode, upiDetails, setUpiDetails,
    setPaymentRef, calculateTotal, getSelectedItem, customer, optPrasada, familyMembers
}: PaymentStepProps) {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col space-y-2 h-full overflow-y-auto pr-1 pb-4">
            <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-1.5 relative">
                <CreditCard className="text-[var(--primary)]" size={16} /> ಪಾವತಿ ವಿಧಾನ
            </h3>

            <div className="grid grid-cols-2 gap-2 max-w-xs">
                {['Cash', 'UPI'].map((mode) => (
                    <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`py-2 px-1 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${paymentMode === mode
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
                    <div className="flex flex-col items-center justify-center space-y-2 mb-2">
                        <img src={upiQrImage} alt="UPI QR Code" className="w-36 h-36 object-contain bg-white p-2 rounded-xl shadow-md border-2 border-[var(--glass-border)]" />
                        <p className="text-[10px] font-mono text-[var(--text-secondary)]">Scan to Pay via UPI</p>
                    </div>
                    
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
                            className="w-full px-2 py-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-xs font-mono text-center tracking-widest focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
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
                    {optPrasada && familyMembers > 0 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-bold">ಹಸ್ತೋದಕ: {familyMembers} ಹೆಚ್ಚುವರಿ ಸದಸ್ಯರು</p>
                    )}
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase block mb-1">ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ ({paymentMode === 'Cash' ? 'ನಗದು' : 'UPI'})</span>
                    <span className="text-xl font-black text-[var(--primary)]">₹{calculateTotal()}</span>
                </div>
            </div>
        </motion.div>
    );
}
