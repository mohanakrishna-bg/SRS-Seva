import { useState, useEffect } from 'react';

import { Search, Ban, Edit3, Printer, X } from 'lucide-react';
import { registrationApi } from '../../api';
import { useToast } from '../Toast';
import SplitPaneLayout from '../ui/SplitPaneLayout';
import ReceiptGenerator from '../ReceiptGenerator';

// ── Date Formatting Helper ──
function formatDDMMYY(dateStr: string): string {
    if (!dateStr || dateStr.length !== 6) return dateStr || '-';
    const dd = dateStr.substring(0, 2);
    const mm = dateStr.substring(2, 4);
    const yy = dateStr.substring(4, 6);
    return `${dd}/${mm}/20${yy}`;
}

export default function BookedSevasTab() {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    
    // Convert YYYY-MM-DD to DDMMYY for API
    const getApiDate = (d: string) => {
        const parts = d.split('-');
        if (parts.length !== 3) return '';
        return `${parts[2]}${parts[1]}${parts[0].slice(-2)}`;
    };

    const [registrations, setRegistrations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedReg, setSelectedReg] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelRefundAmount, setCancelRefundAmount] = useState<number>(0);
    const [cancelRefundMode, setCancelRefundMode] = useState<string>('Cash');
    const [isCancelling, setIsCancelling] = useState(false);
    
    const [showModifyModal, setShowModifyModal] = useState(false);
    const [modifyRemarks, setModifyRemarks] = useState('');
    const [modifySevaDate, setModifySevaDate] = useState('');
    const [modifyPrasadaCount, setModifyPrasadaCount] = useState(0);
    const [modifyOptPrasada, setModifyOptPrasada] = useState(false);
    const [modifyPaymentMode, setModifyPaymentMode] = useState('Cash');
    const [isModifying, setIsModifying] = useState(false);
    
    const [showReceipt, setShowReceipt] = useState(false);
    const [additionalReceiptData, setAdditionalReceiptData] = useState<any>(null);
    const [showAdditionalReceipt, setShowAdditionalReceipt] = useState(false);
    
    const { showToast } = useToast();

    const fetchRegistrations = async () => {
        setIsLoading(true);
        try {
            const apiDate = getApiDate(selectedDate);
            const res = await registrationApi.byDate(apiDate, "SevaDate");
            setRegistrations(res.data);
            if (selectedReg) {
                const updated = res.data.find((r: any) => r.RegistrationId === selectedReg.RegistrationId);
                setSelectedReg(updated || null);
            }
        } catch (error: any) {
            console.error('Failed to fetch registrations:', error);
            showToast('error', 'ಸೇವೆಗಳನ್ನು ಪಡೆಯಲು ವಿಫಲವಾಗಿದೆ');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
        const handleRefresh = () => fetchRegistrations();
        window.addEventListener('registration_created', handleRefresh);
        return () => window.removeEventListener('registration_created', handleRefresh);
    }, [selectedDate]);

    const handleCancel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReg) return;
        setIsCancelling(true);
        try {
            await registrationApi.cancel(selectedReg.RegistrationId, {
                refund_amount: cancelRefundAmount,
                refund_mode: cancelRefundMode
            });
            showToast('success', 'ರದ್ದುಪಡಿಸಲಾಗಿದೆ');
            setShowCancelModal(false);
            fetchRegistrations();
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'ರದ್ದುಪಡಿಸಲು ವಿಫಲವಾಗಿದೆ');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleModify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReg) return;
        setIsModifying(true);
        try {
            const oldCount = selectedReg.PrasadaCount || 0;
            const deltaCount = modifyPrasadaCount - oldCount;
            const hastodakaRate = getHastodakaPerHeadRate();
            const additionalAmount = deltaCount > 0 ? deltaCount * hastodakaRate : 0;

            const payload: any = {
                Remarks: modifyRemarks,
            };

            // Only send SevaDate if changed
            if (modifySevaDate) {
                const parts = modifySevaDate.split('-');
                if (parts.length === 3) {
                    payload.SevaDate = `${parts[2]}${parts[1]}${parts[0].slice(-2)}`;
                }
            }

            // Only send hastodaka fields if count actually changed
            if (deltaCount > 0) {
                payload.PrasadaCount = modifyPrasadaCount;
                payload.OptTheerthaPrasada = true;
                payload.AdditionalAmount = additionalAmount;
                payload.AdditionalPaymentMode = modifyPaymentMode;
            } else if (modifyOptPrasada !== selectedReg.OptTheerthaPrasada) {
                payload.OptTheerthaPrasada = modifyOptPrasada;
            }

            await registrationApi.modify(selectedReg.RegistrationId, payload);
            showToast('success', 'ನವೀಕರಿಸಲಾಗಿದೆ');
            setShowModifyModal(false);

            // If there was an additional payment, show receipt for delta
            if (deltaCount > 0 && additionalAmount > 0) {
                setAdditionalReceiptData({
                    voucherNo: `VCH-ADD-${selectedReg.RegistrationId}`,
                    date: selectedReg.RegistrationDate,
                    sevaDate: selectedReg.SevaDate,
                    customerName: selectedReg.devotee?.Name || '',
                    gotra: selectedReg.devotee?.Gotra || '',
                    nakshatra: selectedReg.devotee?.Nakshatra || '',
                    sevas: [{
                        description: selectedReg.seva?.Description || selectedReg.SevaCode,
                        amount: 0
                    }],
                    amount: additionalAmount,
                    hastodakaAmount: additionalAmount,
                    paymentMode: modifyPaymentMode,
                });
                setShowAdditionalReceipt(true);
            }

            fetchRegistrations();
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ');
        } finally {
            setIsModifying(false);
        }
    };

    const getHastodakaPerHeadRate = (): number => {
        if (!selectedReg) return 200;
        const oldCount = selectedReg.PrasadaCount || 0;
        const sevaAmount = selectedReg.Amount || 0;
        const grandTotal = selectedReg.GrandTotal || 0;
        if (oldCount > 0) {
            return (grandTotal - sevaAmount) / oldCount;
        }
        return 200; // default per-head rate
    };

    const openModifyModal = () => {
        // Convert DDMMYY to YYYY-MM-DD for the date input
        const sevaDate = selectedReg.SevaDate || '';
        let formattedDate = '';
        if (sevaDate.length === 6) {
            formattedDate = `20${sevaDate.substring(4, 6)}-${sevaDate.substring(2, 4)}-${sevaDate.substring(0, 2)}`;
        }
        setModifySevaDate(formattedDate);
        setModifyRemarks(selectedReg.Remarks || '');
        setModifyPrasadaCount(selectedReg.PrasadaCount || 0);
        setModifyOptPrasada(selectedReg.OptTheerthaPrasada || false);
        setModifyPaymentMode('Cash');
        setShowModifyModal(true);
    };

    const openCancelModal = () => {
        setCancelRefundAmount(selectedReg.GrandTotal || 0);
        setCancelRefundMode('Cash');
        setShowCancelModal(true);
    };

    const filteredRegs = registrations.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (r.devotee?.Name || '').toLowerCase().includes(q) ||
            (r.seva?.Description || r.SevaCode || '').toLowerCase().includes(q) ||
            r.RegistrationId.toString().includes(q)
        );
    });

    // ── Compute hastodaka delta for modify modal ──
    const oldPrasadaCount = selectedReg?.PrasadaCount || 0;
    const deltaCount = modifyPrasadaCount - oldPrasadaCount;
    const hastodakaRate = selectedReg ? getHastodakaPerHeadRate() : 200;
    const additionalAmount = deltaCount > 0 ? deltaCount * hastodakaRate : 0;

    return (
        <div className="absolute inset-0 flex">
            <SplitPaneLayout
                masterContent={
                    <div className="h-full flex flex-col p-4">
                        <div className="flex items-center justify-between mb-4 gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                                <input
                                    type="text"
                                    placeholder="ಹುಡುಕಿ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-dark)] border border-[var(--glass-border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                                />
                            </div>
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-3 py-2 rounded-xl bg-[var(--bg-dark)] border border-[var(--glass-border)] text-sm focus:outline-none focus:border-[var(--primary)] text-[var(--text-primary)]"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                            {isLoading ? (
                                <div className="text-center p-8 text-[var(--text-secondary)]">ಲೋಡ್ ಆಗುತ್ತಿದೆ...</div>
                            ) : filteredRegs.length === 0 ? (
                                <div className="text-center p-8 text-[var(--text-secondary)]">ಯಾವುದೇ ಸೇವೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ</div>
                            ) : (
                                filteredRegs.map(reg => (
                                    <button
                                        key={reg.RegistrationId}
                                        onClick={() => setSelectedReg(reg)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                                            selectedReg?.RegistrationId === reg.RegistrationId
                                                ? 'bg-[var(--primary)]/10 border-[var(--primary)]'
                                                : 'bg-[var(--bg-dark)] border-[var(--glass-border)] hover:border-[var(--text-secondary)]'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm text-[var(--text-primary)]">
                                                {reg.devotee?.Name || 'Unknown'}
                                            </span>
                                            <span className="text-xs font-mono text-[var(--text-secondary)]">
                                                #{reg.RegistrationId}
                                            </span>
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)] truncate">
                                            {reg.seva?.Description || reg.SevaCode}
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs font-bold text-orange-500">₹{reg.GrandTotal}</span>
                                            {reg.IsCancelled ? (
                                                <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">ರದ್ದು</span>
                                            ) : reg.IsFulfilled ? (
                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full">ಪೂರ್ಣ</span>
                                            ) : (
                                                <span className="text-[10px] bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full">ಬಾಕಿ</span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                }
                detailContent={
                    <div className="h-full bg-[var(--bg-dark)] p-6 pb-32 overflow-y-auto">
                        {!selectedReg ? (
                            <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
                                ಸೇವಾ ವಿವರಗಳನ್ನು ನೋಡಲು ಆಯ್ಕೆಮಾಡಿ
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start border-b border-[var(--glass-border)] pb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                                            {selectedReg.devotee?.Name}
                                        </h2>
                                        <div className="text-sm text-[var(--text-secondary)] flex items-center gap-2 mt-1">
                                            <span>#{selectedReg.RegistrationId}</span>
                                            <span>•</span>
                                            <span>{selectedReg.devotee?.Phone}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {selectedReg.IsCancelled && (
                                            <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-bold flex items-center gap-2">
                                                <Ban size={16} /> ರದ್ದುಪಡಿಸಲಾಗಿದೆ
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => setSelectedReg(null)}
                                            className="p-2 hover:bg-[var(--glass-border)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                            title="Close details"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
                                        <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">ಸೇವಾ ಹೆಸರು</div>
                                        <div className="font-bold">{selectedReg.seva?.Description || selectedReg.SevaCode}</div>
                                    </div>
                                    <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
                                        <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">ಸೇವಾ ದಿನಾಂಕ</div>
                                        <div className="font-bold">{formatDDMMYY(selectedReg.SevaDate)}</div>
                                    </div>
                                    <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
                                        <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">ಗೋತ್ರ</div>
                                        <div className="font-bold">{selectedReg.devotee?.Gotra || '-'}</div>
                                    </div>
                                    <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
                                        <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">ನಕ್ಷತ್ರ</div>
                                        <div className="font-bold">{selectedReg.devotee?.Nakshatra || '-'}</div>
                                    </div>
                                    <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
                                        <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">ನೋಂದಣಿ ದಿನಾಂಕ</div>
                                        <div className="font-bold">{formatDDMMYY(selectedReg.RegistrationDate)}</div>
                                    </div>
                                    {selectedReg.OptTheerthaPrasada && (
                                        <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                                            <div className="text-[10px] uppercase tracking-wider text-orange-500 mb-1">ಹಸ್ತೋದಕ</div>
                                            <div className="font-bold">{selectedReg.PrasadaCount || 0} ಜನರು</div>
                                        </div>
                                    )}
                                </div>

                                {/* ── Amount Breakdown ── */}
                                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-3">
                                    <h3 className="text-sm font-bold text-orange-500 mb-2">ಪಾವತಿ ವಿವರಗಳು</h3>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-secondary)]">ಸೇವಾ ಮೊತ್ತ</span>
                                        <span className="font-bold">₹{(selectedReg.Amount || 0).toLocaleString()}</span>
                                    </div>
                                    {selectedReg.OptTheerthaPrasada && (selectedReg.GrandTotal - selectedReg.Amount) > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[var(--text-secondary)]">ಹಸ್ತೋದಕ ಮೊತ್ತ ({selectedReg.PrasadaCount} ಜನರು)</span>
                                            <span className="font-bold">₹{((selectedReg.GrandTotal || 0) - (selectedReg.Amount || 0)).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-sm border-t border-orange-500/20 pt-2">
                                        <span className="text-[var(--text-secondary)] font-bold">ಒಟ್ಟು ಮೊತ್ತ</span>
                                        <span className="font-bold text-lg">₹{(selectedReg.GrandTotal || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-secondary)]">ವಿಧಾನ</span>
                                        <span className="font-bold">{selectedReg.PaymentMode}</span>
                                    </div>
                                </div>

                                {selectedReg.Remarks && (
                                    <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
                                        <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">ಷರಾ</div>
                                        <div className="text-sm">{selectedReg.Remarks}</div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--glass-border)]">
                                    {!selectedReg.IsCancelled && (
                                        <>
                                            <button 
                                                onClick={openModifyModal}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold rounded-xl transition-colors text-sm"
                                            >
                                                <Edit3 size={16} /> ತಿದ್ದುಪಡಿ
                                            </button>
                                            <button 
                                                onClick={openCancelModal}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-colors text-sm"
                                            >
                                                <Ban size={16} /> ರದ್ದು
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        onClick={() => setShowReceipt(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[var(--glass-border)] hover:bg-[var(--text-secondary)]/20 text-[var(--text-primary)] font-bold rounded-xl transition-colors text-sm ml-auto"
                                    >
                                        <Printer size={16} /> ರಶೀದಿ
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                }
                showDetailOnMobile={!!selectedReg}
                onBackToMaster={() => setSelectedReg(null)}
            />

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--bg-dark)] border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
                            <Ban size={20} /> ರದ್ದುಪಡಿಸಿ
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">
                            ಈ ಸೇವೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲು ನಿಮಗೆ ಖಚಿತವೇ?
                        </p>
                        
                        <form onSubmit={handleCancel} className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-2">
                                    <input 
                                        type="checkbox" 
                                        checked={cancelRefundAmount > 0} 
                                        onChange={(e) => setCancelRefundAmount(e.target.checked ? selectedReg.GrandTotal : 0)}
                                    />
                                    ಹಣ ಹಿಂತಿರುಗಿಸಿ
                                </label>
                                {cancelRefundAmount > 0 && (
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex-1">
                                            <label className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">ಮೊತ್ತ</label>
                                            <input 
                                                type="number" 
                                                value={cancelRefundAmount}
                                                onChange={(e) => setCancelRefundAmount(Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] border border-[var(--glass-border)] text-sm focus:outline-none focus:border-red-500"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">ವಿಧಾನ</label>
                                            <select 
                                                value={cancelRefundMode}
                                                onChange={(e) => setCancelRefundMode(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] border border-[var(--glass-border)] text-sm focus:outline-none focus:border-red-500"
                                            >
                                                <option value="Cash">ನಗದು</option>
                                                <option value="UPI">ಯುಪಿಐ</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={() => setShowCancelModal(false)} className="px-4 py-2 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--glass-border)]">
                                    ಹಿಂದೆ
                                </button>
                                <button type="submit" disabled={isCancelling} className="px-4 py-2 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600">
                                    {isCancelling ? 'ರದ್ದುಪಡಿಸುತ್ತಿದೆ...' : 'ಖಚಿತಪಡಿಸಿ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Enhanced Modify Modal ── */}
            {showModifyModal && selectedReg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--bg-dark)] border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <Edit3 size={20} /> ತಿದ್ದುಪಡಿ
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            {selectedReg.seva?.Description || selectedReg.SevaCode} — {selectedReg.devotee?.Name}
                        </p>
                        
                        <form onSubmit={handleModify} className="space-y-4">
                            {/* Seva Date */}
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">ಸೇವಾ ದಿನಾಂಕ</label>
                                <input 
                                    type="date"
                                    value={modifySevaDate}
                                    onChange={(e) => setModifySevaDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] border border-[var(--glass-border)] text-sm focus:outline-none focus:border-blue-500 text-[var(--text-primary)]"
                                />
                            </div>

                            {/* Hastodaka Section */}
                            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-orange-500">
                                    <input 
                                        type="checkbox"
                                        checked={modifyOptPrasada}
                                        onChange={(e) => {
                                            setModifyOptPrasada(e.target.checked);
                                            if (!e.target.checked) {
                                                setModifyPrasadaCount(selectedReg.PrasadaCount || 0);
                                            }
                                        }}
                                    />
                                    ಹಸ್ತೋದಕ
                                </label>
                                
                                {modifyOptPrasada && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                                ಹಸ್ತೋದಕ ಸಂಖ್ಯೆ (ಪ್ರಸ್ತುತ: {oldPrasadaCount})
                                            </label>
                                            <input 
                                                type="number"
                                                min={oldPrasadaCount}
                                                value={modifyPrasadaCount}
                                                onChange={(e) => {
                                                    const val = Math.max(oldPrasadaCount, Number(e.target.value));
                                                    setModifyPrasadaCount(val);
                                                }}
                                                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] border border-[var(--glass-border)] text-sm focus:outline-none focus:border-orange-500"
                                            />
                                        </div>

                                        {deltaCount > 0 && (
                                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl space-y-2">
                                                <div className="text-xs font-bold text-green-500">ಹೆಚ್ಚುವರಿ ಪಾವತಿ</div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-secondary)]">+{deltaCount} ಜನರು × ₹{hastodakaRate}</span>
                                                    <span className="font-bold text-green-500">₹{additionalAmount.toLocaleString()}</span>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">ಪಾವತಿ ವಿಧಾನ</label>
                                                    <select 
                                                        value={modifyPaymentMode}
                                                        onChange={(e) => setModifyPaymentMode(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] border border-[var(--glass-border)] text-sm focus:outline-none focus:border-green-500"
                                                    >
                                                        <option value="Cash">ನಗದು</option>
                                                        <option value="UPI">ಯುಪಿಐ</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">ಷರಾ</label>
                                <textarea 
                                    value={modifyRemarks}
                                    onChange={(e) => setModifyRemarks(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] border border-[var(--glass-border)] text-sm focus:outline-none focus:border-blue-500 h-20"
                                    placeholder="ಟಿಪ್ಪಣಿ ಸೇರಿಸಿ..."
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={() => setShowModifyModal(false)} className="px-4 py-2 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--glass-border)]">
                                    ರದ್ದು
                                </button>
                                <button type="submit" disabled={isModifying} className="px-4 py-2 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600">
                                    {isModifying ? 'ಉಳಿಸುತ್ತಿದೆ...' : 'ಉಳಿಸಿ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            <ReceiptGenerator
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                receiptData={(() => {
                    if (!selectedReg) return null;
                    
                    const voucherNo = selectedReg.VoucherNo || `REG-${selectedReg.RegistrationId}`;
                    const groupedRegs = registrations.filter((r: any) => 
                        (r.VoucherNo === voucherNo) || (r.RegistrationId === selectedReg.RegistrationId)
                    );
                    
                    const sevas = groupedRegs.map((r: any) => ({
                        description: r.seva?.Description || r.SevaCode,
                        amount: r.Amount || 0
                    }));
                    
                    const firstReg = groupedRegs[0];
                    const hastodakaAmount = ((firstReg.GrandTotal || 0) - (firstReg.Amount || 0));
                    const totalAmount = groupedRegs.reduce((sum: number, r: any) => sum + (r.Amount || 0), 0) + (hastodakaAmount > 0 ? hastodakaAmount : 0);

                    return {
                        voucherNo: voucherNo,
                        date: firstReg.RegistrationDate,
                        sevaDate: firstReg.SevaDate,
                        customerName: firstReg.devotee?.Name,
                        gotra: firstReg.devotee?.Gotra,
                        nakshatra: firstReg.devotee?.Nakshatra,
                        sevas: sevas,
                        amount: totalAmount,
                        hastodakaAmount: hastodakaAmount > 0 ? hastodakaAmount : undefined,
                        paymentMode: firstReg.PaymentMode,
                        phone: firstReg.devotee?.Phone,
                        whatsappPhone: firstReg.devotee?.WhatsApp_Phone
                    };
                })()}
            />

            {/* Additional Payment Receipt */}
            <ReceiptGenerator
                isOpen={showAdditionalReceipt}
                onClose={() => setShowAdditionalReceipt(false)}
                receiptData={additionalReceiptData}
            />
        </div>
    );
}
