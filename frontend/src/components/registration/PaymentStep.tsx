import { motion } from 'framer-motion';
import { CreditCard, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { SevaItem } from '../RegistrationModal';
import { convertKnNumeralsToEn } from './DevoteeSelectionStep';

interface PaymentStepProps {
    paymentMode: string;
    setPaymentMode: (m: string) => void;
    orgSettings?: any;
    upiDetails: any;
    setUpiDetails: (d: any) => void;
    setPaymentRef: (r: string) => void;
    calculateTotal: () => number;
    selectedSevas: SevaItem[];
    customer: any;
    optPrasada: boolean;
    familyMembers: number;
    parcelCount?: number;
}

export default function PaymentStep({
    paymentMode, setPaymentMode, orgSettings, upiDetails, setUpiDetails,
    setPaymentRef, calculateTotal, selectedSevas, customer, optPrasada, familyMembers, parcelCount = 0
}: PaymentStepProps) {
    const totalAmount = calculateTotal();
    const upiId = orgSettings?.upiVpa || 'pinelabs.stq3957386@pineaxis';
    const payeeName = orgSettings?.orgNameEn || orgSettings?.orgName || 'SRS Seva';
    
    let note = 'Seva Payment';
    if (selectedSevas.length > 0) {
        if (selectedSevas.length === 1) note = `Seva - ${selectedSevas[0].Description}`;
        else note = `Seva - ${selectedSevas[0].Description} +${selectedSevas.length - 1} more`;
    }
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount.toFixed(2)}&tn=${encodeURIComponent(note)}&cu=INR`;

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col space-y-4 h-full overflow-y-auto pr-1 pb-4">
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-2.5 relative">
                <CreditCard className="text-[var(--primary)]" size={18} /> 
                <span>ಪಾವತಿ ವಿಧಾನ (Payment Method)</span>
            </h3>

            {/* Payment Mode Selector */}
            <div className="grid grid-cols-2 gap-3 max-w-sm">
                {['Cash', 'UPI'].map((mode) => (
                    <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`py-3 px-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            paymentMode === mode
                                ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700/60'
                        }`}
                    >
                        <span className="text-base">{mode === 'Cash' ? '💵 ನಗದು (Cash)' : '📱 UPI'}</span>
                    </button>
                ))}
            </div>

            {paymentMode === 'UPI' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-1 bg-slate-50/70 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-[var(--glass-border)]">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                        <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-[var(--glass-border)] flex items-center justify-center">
                            <QRCodeSVG
                                value={upiUri}
                                size={160}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-base sm:text-lg font-mono font-bold text-[var(--primary)]">₹{totalAmount.toFixed(2)}</p>
                            <p className="text-xs font-mono text-[var(--text-secondary)]">Scan QR code to Pay via any UPI App</p>
                            <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">{upiId}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-2 max-w-md mx-auto">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                Transaction ID / UTR ಸಂಖ್ಯೆ
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    const sbCode = `SB-${Date.now().toString().slice(-6)}`;
                                    setUpiDetails({ ...upiDetails, transactionId: sbCode, gateway: 'Soundbox' });
                                    setPaymentRef(sbCode);
                                }}
                                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:underline flex items-center gap-1.5 cursor-pointer bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30"
                                title="ಧ್ವನಿಪೆಟ್ಟಿಗೆಯಲ್ಲಿ ದೃಢೀಕರಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿ"
                            >
                                🔔 ಧ್ವನಿಪೆಟ್ಟಿಗೆ (Soundbox Verified)
                            </button>
                        </div>
                        <input
                            type="text"
                            value={upiDetails.transactionId}
                            onChange={(e) => {
                                const cleaned = convertKnNumeralsToEn(e.target.value);
                                setUpiDetails({ ...upiDetails, transactionId: cleaned, gateway: 'Direct' });
                                setPaymentRef(cleaned);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/20 border border-[var(--glass-border)] text-sm font-mono text-center tracking-widest focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                            placeholder="123456789012 ಅಥವಾ 'ಧ್ವನಿಪೆಟ್ಟಿಗೆ' ಕ್ಲಿಕ್ ಮಾಡಿ"
                        />
                    </div>
                </motion.div>
            )}

            <div className="flex-1 min-h-[4px]" />
            
            <div className="bg-orange-50/60 dark:bg-orange-900/15 rounded-xl p-3 flex gap-2.5 text-xs text-[var(--text-secondary)] border border-orange-200/50 dark:border-orange-500/20">
                <Info className="shrink-0 text-orange-500 mt-0.5" size={16} />
                <p>ದಯವಿಟ್ಟು ಪಾವತಿ ಸ್ವೀಕರಿಸಿದ ನಂತರವೇ 'ಮುಕ್ತಾಯ & ರಸೀದಿ' ಕ್ಲಿಕ್ ಮಾಡಿ. ವಹಿವಾಟು ಯಶಸ್ವಿಯಾದರೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮುದ್ರಣ ರಸೀದಿ ತೆರೆಯುತ್ತದೆ.</p>
            </div>
            
            {/* Final Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-800 border border-[var(--primary)]/30 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md shadow-orange-500/5">
                <div>
                    <p className="text-sm font-bold text-[var(--text-primary)] mb-0.5">
                        ಸೇವೆ: {selectedSevas.length > 0 ? (selectedSevas.length === 1 ? selectedSevas[0].Description : `${selectedSevas[0].Description} (+${selectedSevas.length - 1} more)`) : '-'}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">ಭಕ್ತರು: <strong className="text-[var(--text-primary)]">{customer.Name || '-'}</strong> ({customer.Phone || '-'})</p>
                    {optPrasada && (familyMembers > 0 || parcelCount > 0) && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-semibold space-y-0.5">
                            {familyMembers > 0 && <span>ಊಟ (Dine-in): {familyMembers} ಸದಸ್ಯರು </span>}
                            {parcelCount > 0 && <span>• ಪಾರ್ಸಲ್ (Parcel): {parcelCount} ಪ್ಯಾಕೆಟ್</span>}
                        </div>
                    )}
                </div>
                <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-0.5">
                        ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ ({paymentMode === 'Cash' ? 'ನಗದು' : 'UPI'})
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-[var(--primary)] font-mono">₹{calculateTotal()}</span>
                </div>
            </div>
        </motion.div>
    );
}
