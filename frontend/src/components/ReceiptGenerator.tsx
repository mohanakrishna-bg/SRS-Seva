import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, MessageCircle, X, Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface ReceiptData {
    voucherNo: string;
    date: string;
    customerName: string;
    gotra?: string;
    nakshatra?: string;
    sevaDescription: string;
    amount: number;
    paymentMode: string;
}

interface OrgSettings {
    orgName?: string;
    address?: string;
    phone?: string;
    whatsapp?: string;
    logoImage?: string;
}

interface ReceiptGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    receiptData: ReceiptData | null;
}

const SETTINGS_KEY = 'seva_org_settings';

function getOrgSettings(): OrgSettings {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return {};
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('kn-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ReceiptGenerator({ isOpen, onClose, receiptData }: ReceiptGeneratorProps) {
    const [generating, setGenerating] = useState(false);
    const settings = getOrgSettings();
    const orgName = settings.orgName || 'ಶ್ರೀ ಮಠ ಆಡಳಿತ';

    if (!receiptData) return null;

    const receiptTextSummary = [
        `🙏 ${orgName}`,
        settings.address ? `📍 ${settings.address}` : '',
        settings.phone ? `📞 ${settings.phone}` : '',
        `━━━━━━━━━━━━━━━━━`,
        `ರಸೀದಿ ಸಂಖ್ಯೆ: ${receiptData.voucherNo}`,
        `ದಿನಾಂಕ: ${formatDate(receiptData.date)}`,
        `━━━━━━━━━━━━━━━━━`,
        `ಭಕ್ತರು: ${receiptData.customerName}`,
        receiptData.gotra ? `ಗೋತ್ರ: ${receiptData.gotra}` : '',
        receiptData.nakshatra ? `ನಕ್ಷತ್ರ: ${receiptData.nakshatra}` : '',
        `━━━━━━━━━━━━━━━━━`,
        `ಸೇವೆ: ${receiptData.sevaDescription}`,
        `ಮೊತ್ತ: ₹${receiptData.amount.toLocaleString()}`,
        `ಪಾವತಿ: ${receiptData.paymentMode}`,
        `━━━━━━━━━━━━━━━━━`,
        `🙏 ಓಂ ಶ್ರೀ 🙏`,
    ].filter(Boolean).join('\n');

    const generatePDF = (): jsPDF => {
        const doc = new jsPDF({ unit: 'mm', format: [80, 150] }); // receipt-size
        const w = 80;
        let y = 8;

        // Header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(orgName, w / 2, y, { align: 'center' });
        y += 5;

        if (settings.address) {
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(settings.address, w / 2, y, { align: 'center' });
            y += 4;
        }
        if (settings.phone) {
            doc.setFontSize(7);
            doc.text(`Ph: ${settings.phone}`, w / 2, y, { align: 'center' });
            y += 4;
        }

        // Divider
        doc.setDrawColor(180);
        doc.setLineWidth(0.3);
        doc.line(5, y, w - 5, y);
        y += 5;

        // Voucher & Date
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Voucher: ${receiptData.voucherNo}`, 5, y);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDate(receiptData.date), w - 5, y, { align: 'right' });
        y += 6;

        // Divider
        doc.line(5, y, w - 5, y);
        y += 5;

        // Customer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Devotee:', 5, y);
        doc.setFont('helvetica', 'normal');
        doc.text(receiptData.customerName, 25, y);
        y += 5;

        if (receiptData.gotra) {
            doc.text(`Gotra: ${receiptData.gotra}`, 5, y);
            y += 4;
        }
        if (receiptData.nakshatra) {
            doc.text(`Nakshatra: ${receiptData.nakshatra}`, 5, y);
            y += 4;
        }

        // Divider
        y += 1;
        doc.line(5, y, w - 5, y);
        y += 5;

        // Seva & Amount
        doc.setFont('helvetica', 'bold');
        doc.text('Seva:', 5, y);
        doc.setFont('helvetica', 'normal');
        doc.text(receiptData.sevaDescription, 18, y, { maxWidth: w - 23 });
        y += 6;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rs. ${receiptData.amount.toLocaleString()}/-`, w / 2, y, { align: 'center' });
        y += 5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Payment: ${receiptData.paymentMode}`, 5, y);
        y += 6;

        // Footer
        doc.line(5, y, w - 5, y);
        y += 4;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text('OM SRI', w / 2, y, { align: 'center' });

        return doc;
    };

    const handlePrint = () => {
        setGenerating(true);
        try {
            const doc = generatePDF();
            // Open PDF in new tab for printing
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = () => printWindow.print();
            }
        } catch (err) {
            console.error('PDF generation failed:', err);
        }
        setGenerating(false);
    };

    const handleDownload = () => {
        setGenerating(true);
        try {
            const doc = generatePDF();
            doc.save(`receipt_${receiptData.voucherNo}.pdf`);
        } catch (err) {
            console.error('PDF download failed:', err);
        }
        setGenerating(false);
    };

    const handleWhatsApp = () => {
        const encodedText = encodeURIComponent(receiptTextSummary);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">ರಸೀದಿ</h3>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Receipt Preview */}
                        <div className="bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)] p-5 mb-5 font-mono text-sm space-y-1">
                            <div className="text-center mb-3">
                                <p className="text-base font-bold text-amber-500 dark:text-amber-300">{orgName}</p>
                                {settings.address && <p className="text-xs text-[var(--text-secondary)]">{settings.address}</p>}
                                {settings.phone && <p className="text-xs text-[var(--text-secondary)]">📞 {settings.phone}</p>}
                            </div>

                            <div className="border-t border-dashed border-[var(--glass-border)] pt-2 space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">ರಸೀದಿ ಸಂಖ್ಯೆ</span>
                                    <span className="text-[var(--text-primary)] font-medium">{receiptData.voucherNo}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">ದಿನಾಂಕ</span>
                                    <span className="text-[var(--text-primary)]">{formatDate(receiptData.date)}</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-[var(--glass-border)] pt-2 space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">ಭಕ್ತರು</span>
                                    <span className="text-[var(--text-primary)] font-medium">{receiptData.customerName}</span>
                                </div>
                                {receiptData.gotra && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-secondary)]">ಗೋತ್ರ</span>
                                        <span className="text-[var(--text-primary)]">{receiptData.gotra}</span>
                                    </div>
                                )}
                                {receiptData.nakshatra && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-secondary)]">ನಕ್ಷತ್ರ</span>
                                        <span className="text-[var(--text-primary)]">{receiptData.nakshatra}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-dashed border-[var(--glass-border)] pt-2 space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">ಸೇವೆ</span>
                                    <span className="text-[var(--text-primary)]">{receiptData.sevaDescription}</span>
                                </div>
                                <div className="flex justify-between items-baseline mt-2">
                                    <span className="text-[var(--text-secondary)]">ಮೊತ್ತ</span>
                                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{receiptData.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">ಪಾವತಿ</span>
                                    <span className="text-[var(--text-primary)]">{receiptData.paymentMode}</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-[var(--glass-border)] pt-2 text-center">
                                <p className="text-[var(--text-secondary)] text-xs">🙏 ಓಂ ಶ್ರೀ 🙏</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={handlePrint}
                                disabled={generating}
                                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-sky-600/20 border border-blue-500/30 hover:border-blue-400/50 transition-all text-sm disabled:opacity-50"
                            >
                                <Printer size={20} className="text-blue-400" />
                                <span className="text-xs font-medium">ಮುದ್ರಿಸಿ</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={generating}
                                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gradient-to-br from-emerald-600/20 to-green-600/20 border border-emerald-500/30 hover:border-emerald-400/50 transition-all text-sm disabled:opacity-50"
                            >
                                <Download size={20} className="text-emerald-400" />
                                <span className="text-xs font-medium">ಡೌನ್ಲೋಡ್</span>
                            </button>
                            <button
                                onClick={handleWhatsApp}
                                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gradient-to-br from-green-600/20 to-lime-600/20 border border-green-500/30 hover:border-green-400/50 transition-all text-sm"
                            >
                                <MessageCircle size={20} className="text-green-400" />
                                <span className="text-xs font-medium">ವಾಟ್ಸ್ಆಪ್</span>
                            </button>
                        </div>

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="w-full mt-4 px-4 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] transition-colors text-sm text-center"
                        >
                            ಮುಚ್ಚಿ
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
