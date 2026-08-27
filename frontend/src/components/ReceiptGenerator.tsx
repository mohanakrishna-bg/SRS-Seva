import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, MessageCircle, X } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { transliterateToKannada, transliterateKnToEn } from '../transliterate';
import { GOTRAS, NAKSHATRAS } from '../constants/panchanga';

interface ReceiptData {
    voucherNo: string;
    date: string;
    sevaDate?: string;
    customerName: string;
    customerNameEn?: string;
    gotra?: string;
    gotraEn?: string;
    nakshatra?: string;
    nakshatraEn?: string;
    sevas: { description: string, descriptionEn?: string, amount: number }[];
    amount: number;
    hastodakaAmount?: number;
    paymentMode: string;
    paymentModeEn?: string;
    phone?: string;
    whatsappPhone?: string;
}

// Removed OrgSettings interface

interface ReceiptGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    receiptData: ReceiptData | null;
}

function parseReceiptDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    // Handle DDMMYY format
    if (dateStr.length === 6 && /^\d+$/.test(dateStr)) {
        const day = parseInt(dateStr.substring(0, 2));
        const month = parseInt(dateStr.substring(2, 4)) - 1;
        const year = 2000 + parseInt(dateStr.substring(4, 6));
        return new Date(year, month, day);
    }
    // Fallback to ISO
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
}

function formatDateToKn(dateStr: string): string {
    const d = parseReceiptDate(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function formatDateToEn(dateStr: string): string {
    const d = parseReceiptDate(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

import { useSettings } from '../context/SettingsContext';

export default function ReceiptGenerator({ isOpen, onClose, receiptData }: ReceiptGeneratorProps) {
    const { settings } = useSettings();
    const [generating] = useState(false);
    const [lang] = useState<'kn' | 'en'>('kn');
    const [kannadaData, setKannadaData] = useState<ReceiptData | null>(null);
    const [showSendMenu, setShowSendMenu] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);
    const [savedLocally, setSavedLocally] = useState(false);

    useEffect(() => {
        setSavedLocally(false);
    }, [receiptData]);

    useEffect(() => {
        if (!isOpen || !receiptData || !kannadaData || savedLocally) return;
        
        const autoSaveReceipt = async () => {
            setTimeout(async () => {
                if (!receiptRef.current) return;
                try {
                    const canvas = await html2canvas(receiptRef.current, { scale: 3, backgroundColor: '#ffffff' });
                    const imgData = canvas.toDataURL('image/png');
                    
                    const pdfWidth = 210;
                    
                    const pdf = new jsPDF({
                        orientation: 'landscape',
                        unit: 'mm',
                        format: [148.5, 210] // A5 half page
                    });
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, (canvas.height * pdfWidth) / canvas.width);
                    const pdfBlob = pdf.output('blob');
                    
                    const formData = new FormData();
                    formData.append('file', pdfBlob, `Receipt-${receiptData.voucherNo}.pdf`);
                    
                    const response = await fetch(`/api/registrations/receipt/save?voucher_no=${receiptData.voucherNo}`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (response.ok) {
                        setSavedLocally(true);
                        console.log("Receipt saved locally automatically.");
                    } else {
                        console.error("Failed to auto-save receipt locally.");
                    }
                } catch (err) {
                    console.error("Auto-save receipt error:", err);
                }
            }, 500);
        };
        autoSaveReceipt();
    }, [isOpen, receiptData, kannadaData, savedLocally]);

    // Default Org names if none specified
    const orgNameKn = settings.orgName || 'ಶ್ರೀ ಮಠ ಆಡಳಿತ';
    const orgNameEn = settings.orgNameEn || (settings.orgName ? transliterateKnToEn(settings.orgName) : 'Shri Matha Admin');

    useEffect(() => {
        if (!receiptData) return;
        const prepareKannadaData = async () => {
            const knData: ReceiptData = {
                ...receiptData,
                customerName: await transliterateToKannada(receiptData.customerName),
                gotra: receiptData.gotra ? await transliterateToKannada(receiptData.gotra) : '',
                nakshatra: receiptData.nakshatra ? await transliterateToKannada(receiptData.nakshatra) : '',
                sevas: await Promise.all(receiptData.sevas.map(async s => ({
                    ...s,
                    description: await transliterateToKannada(s.description)
                }))),
                paymentMode: await transliterateToKannada(receiptData.paymentMode)
            };
            setKannadaData(knData);
        };
        prepareKannadaData();
    }, [receiptData]);

    if (!receiptData) return null;

    const currentData = lang === 'en' ? {
        ...receiptData,
        customerName: receiptData.customerNameEn || receiptData.customerName,
        gotra: receiptData.gotraEn || receiptData.gotra,
        nakshatra: receiptData.nakshatraEn || receiptData.nakshatra,
        sevas: receiptData.sevas.map(s => ({
            ...s,
            description: s.descriptionEn || s.description
        })),
        paymentMode: receiptData.paymentModeEn || receiptData.paymentMode
    } : (kannadaData || receiptData);

    // Final sanity check for English fields if they are missing
    if (lang === 'en') {
        const knRegex = /[\u0C80-\u0CFF]/;
        // Find Gotra/Nakshatra English names even if they weren't passed
        if (currentData.gotra && knRegex.test(currentData.gotra)) {
            const trimGotra = currentData.gotra.trim();
            const match = GOTRAS.find(g => g.kn === trimGotra || g.en === trimGotra);
            if (match) currentData.gotra = match.en;
        }
        if (currentData.nakshatra && knRegex.test(currentData.nakshatra)) {
            const trimNak = currentData.nakshatra.trim();
            // Lenient match: check for exact match first, then if mapping is contained in text
            const match = NAKSHATRAS.find(n => n.kn === trimNak || n.en === trimNak || trimNak.includes(n.kn));
            if (match) {
                currentData.nakshatra = match.en;
            } else {
                currentData.nakshatra = transliterateKnToEn(trimNak);
            }
        }
        if (currentData.gotra && knRegex.test(currentData.gotra)) {
            const trimGotra = currentData.gotra.trim();
            const match = GOTRAS.find(g => g.kn === trimGotra || g.en === trimGotra || trimGotra.includes(g.kn));
            if (match) {
                currentData.gotra = match.en;
            } else {
                currentData.gotra = transliterateKnToEn(trimGotra);
            }
        }
        // Fallback for names and descriptions
        if (currentData.customerName && knRegex.test(currentData.customerName)) {
            currentData.customerName = transliterateKnToEn(currentData.customerName);
        }
        if (currentData.nakshatra && knRegex.test(currentData.nakshatra)) {
            currentData.nakshatra = transliterateKnToEn(currentData.nakshatra);
        }
        currentData.sevas = currentData.sevas.map(s => {
            if (knRegex.test(s.description)) {
                return { ...s, description: transliterateKnToEn(s.description) };
            }
            return s;
        });
        if (knRegex.test(currentData.paymentMode)) {
            currentData.paymentMode = transliterateKnToEn(currentData.paymentMode);
        }
    }
    
    const activeOrgName = lang === 'en' ? orgNameEn : orgNameKn;
    const activeAddress = lang === 'en' ? (settings.addressEn || settings.address) : settings.address;
    const activeDate = lang === 'en' ? formatDateToEn(receiptData.date) : formatDateToKn(receiptData.date);
    const activeSevaDate = receiptData.sevaDate ? (lang === 'en' ? formatDateToEn(receiptData.sevaDate) : formatDateToKn(receiptData.sevaDate)) : undefined;

    const labels = {
        receiptNo: lang === 'en' ? 'Receipt No' : 'ರಸೀದಿ ಸಂಖ್ಯೆ',
        date: lang === 'en' ? 'Booking Date' : 'ನೋಂದಣಿ ದಿನಾಂಕ',
        sevaDate: lang === 'en' ? 'Seva Date' : 'ಸೇವಾ ದಿನಾಂಕ',
        devotee: lang === 'en' ? 'Devotee' : 'ಭಕ್ತರು',
        gotra: lang === 'en' ? 'Gotra' : 'ಗೋತ್ರ',
        nakshatra: lang === 'en' ? 'Nakshatra' : 'ನಕ್ಷತ್ರ',
        seva: lang === 'en' ? 'Seva' : 'ಸೇವೆ',
        amount: lang === 'en' ? 'Amount' : 'ಮೊತ್ತ',
        sevaAmount: lang === 'en' ? 'Seva Amount' : 'ಸೇವಾ ಮೊತ್ತ',
        hastodakaAmount: lang === 'en' ? 'Hastodaka' : 'ಹಸ್ತೋದಕ',
        totalAmount: lang === 'en' ? 'Total' : 'ಒಟ್ಟು',
        payment: lang === 'en' ? 'Payment' : 'ಪಾವತಿ',
        greeting: lang === 'en' ? '🙏 Harih Om 🙏' : '🙏 ಹರಿಃ ಓಂ 🙏'
    };

    const receiptTextSummary = [
        `🙏 ${activeOrgName}`,
        activeAddress ? `📍 ${activeAddress}` : '',
        settings.phone ? `📞 ${settings.phone}` : '',
        `━━━━━━━━━━━━━━━━━`,
        `${labels.receiptNo}: ${currentData.voucherNo}`,
        `${labels.date}: ${activeDate}`,
        activeSevaDate ? `${labels.sevaDate}: ${activeSevaDate}` : '',
        `━━━━━━━━━━━━━━━━━`,
        `${labels.devotee}: ${currentData.customerName}`,
        currentData.gotra ? `${labels.gotra}: ${currentData.gotra}` : '',
        ...(currentData.nakshatra ? [`${labels.nakshatra}: ${currentData.nakshatra}`] : []),
        `━━━━━━━━━━━━━━━━━`,
        ...currentData.sevas.map(s => `${s.description}: ₹${s.amount}`),
        ...(currentData.hastodakaAmount ? [`${labels.hastodakaAmount}: ₹${currentData.hastodakaAmount}`] : []),
        `━━━━━━━━━━━━━━━━━`,
        `${labels.totalAmount}: ₹${currentData.amount}`,
        `${labels.payment}: ${currentData.paymentMode}`,
        `━━━━━━━━━━━━━━━━━`,
        labels.greeting,
    ].filter(Boolean).join('\n');

    const handlePrint = () => {
        if (!receiptRef.current) return;
        
        const printTwoCopies = window.confirm("Do you want to print two copies (Devotee & Office)?\n\nClick OK for both copies, or Cancel for a single copy to save paper.");

        const content = receiptRef.current.innerHTML;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt ${currentData.voucherNo}</title>
                    <style>
                        @page { size: A4 landscape; margin: 0; }
                        body { 
                            font-family: sans-serif; 
                            margin: 0;
                            padding: 0;
                            font-size: 15px; 
                            line-height: 1.4;
                            color: #000; 
                            width: 297mm;
                            height: 210mm;
                            display: flex;
                            overflow: hidden; 
                        }
                        .receipt-wrapper {
                            width: 148.5mm;
                            height: 210mm;
                            padding: 24px 28px;
                            box-sizing: border-box;
                            display: flex;
                            flex-direction: column;
                            justify-content: flex-start;
                        }
                        * { box-sizing: border-box; }
                        .text-center { text-align: center; }
                        .flex { display: flex; }
                        .items-center { align-items: center; }
                        .justify-center { justify-content: center; }
                        .justify-between { justify-content: space-between; }
                        .items-baseline { align-items: baseline; }
                        .gap-3 { gap: 12px; }
                        .gap-2 { gap: 8px; }
                        .mb-2 { margin-bottom: 8px; }
                        .mb-3 { margin-bottom: 12px; }
                        .mb-5 { margin-bottom: 20px; }
                        .font-bold { font-weight: bold; }
                        .font-medium { font-weight: 500; }
                        .text-base { font-size: 16px; }
                        .text-sm { font-size: 14px; }
                        .text-xs { font-size: 12px; }
                        .text-lg { font-size: 18px; }
                        .text-xl { font-size: 22px; }
                        .text-2xl { font-size: 26px; }
                        .pt-2 { padding-top: 8px; }
                        .pt-2\\.5 { padding-top: 10px; }
                        .pt-3 { padding-top: 12px; }
                        .pt-3\\.5 { padding-top: 14px; }
                        .pb-2 { padding-bottom: 8px; }
                        .mt-1 { margin-top: 4px; }
                        .mt-1\\.5 { margin-top: 6px; }
                        .mt-2 { margin-top: 8px; }
                        .mt-2\\.5 { margin-top: 10px; }
                        .mt-3 { margin-top: 12px; }
                        .mt-3\\.5 { margin-top: 14px; }
                        .border-t { border-top: 1px dashed #ccc; }
                        .border-b { border-bottom: 1px dashed #ccc; }
                        .space-y-1 > * + * { margin-top: 4px; }
                        .space-y-1\\.5 > * + * { margin-top: 6px; }
                        .space-y-2 > * + * { margin-top: 8px; }
                        .space-y-2\\.5 > * + * { margin-top: 10px; }
                        .text-secondary, .text-gray-500 { color: #555; }
                        .text-gray-600 { color: #444; }
                        .text-gray-700 { color: #333; }
                        .text-primary, .text-gray-900 { color: #000; }
                        .opacity-0 { display: none !important; }
                        img { max-height: 48px; width: auto; object-fit: contain; }
                    </style>
                </head>
                <body>
                    <div class="receipt-wrapper">
                        ${content.replace(/var\(--text-secondary\)/g, '#555').replace(/var\(--text-primary\)/g, '#000')}
                    </div>
                    ${printTwoCopies ? `
                    <div class="receipt-wrapper" style="border-left: 1px dashed #ccc;">
                        ${content.replace(/var\(--text-secondary\)/g, '#555').replace(/var\(--text-primary\)/g, '#000')}
                    </div>
                    ` : ''}
                    <script>
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                        }, 250);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };



    const handleWhatsApp = () => {
        const encodedText = encodeURIComponent(receiptTextSummary);
        let phone = receiptData?.whatsappPhone || receiptData?.phone;
        if (phone) {
            phone = phone.replace(/\D/g, '');
            if (phone.length === 10) phone = '91' + phone;
            window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
        } else {
            window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        }
        setShowSendMenu(false);
    };

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const handleSMS = () => {
        const encodedText = encodeURIComponent(receiptTextSummary);
        window.open(`sms:?body=${encodedText}`, '_self');
        setShowSendMenu(false);
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">ರಸೀದಿ</h3>
                            <div className="flex items-center gap-2">

                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Receipt Preview (Target for printing/HTML2Canvas) */}
                        <div 
                            ref={receiptRef}
                            className="bg-white dark:bg-white text-black rounded-xl border border-gray-200 p-6 mb-5 font-mono text-base space-y-2.5 shadow-inner relative"
                        >
                            {/* Logo & Org Header in single row */}
                            <div className="flex items-center justify-center gap-3 mb-3 pb-2 border-b border-dashed border-gray-300">
                                {settings.logoImage && (
                                    <img src={settings.logoImage} alt="Logo" className="h-12 w-12 object-contain flex-shrink-0" />
                                )}
                                <div className="text-center">
                                    <p className="text-base sm:text-lg font-bold text-gray-900 break-words leading-tight">{activeOrgName}</p>
                                    {activeAddress && <p className="text-xs text-gray-600 break-words leading-tight">{activeAddress}</p>}
                                    {settings.phone && <p className="text-xs text-gray-600 leading-tight">Ph: {settings.phone}</p>}
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-2.5 space-y-1.5 mt-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 font-medium">{labels.receiptNo}</span>
                                    <span className="text-gray-900 font-bold">{currentData.voucherNo}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 font-medium">{labels.date}</span>
                                    <span className="text-gray-900">{activeDate}</span>
                                </div>
                                {activeSevaDate && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">{labels.sevaDate}</span>
                                        <span className="text-gray-900 font-bold">{activeSevaDate}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-2.5 space-y-1.5 mt-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 font-medium">{labels.devotee}</span>
                                    <span className="text-gray-900 font-bold text-lg">{currentData.customerName}</span>
                                </div>
                                {currentData.gotra && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">{labels.gotra}</span>
                                        <span className="text-gray-900">{currentData.gotra}</span>
                                    </div>
                                )}
                                {currentData.nakshatra && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">{labels.nakshatra}</span>
                                        <span className="text-gray-900">{currentData.nakshatra}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-2.5 space-y-1.5 mt-2">
                                <span className="text-gray-500 font-medium block border-b border-gray-100 pb-1 mb-1">{labels.seva}</span>
                                {currentData.sevas.map((s, idx) => (
                                    <div key={idx} className="flex justify-between mt-1">
                                        <span className="text-gray-900 font-bold text-sm max-w-[70%] leading-tight">{s.description}</span>
                                        <span className="text-gray-700">₹{s.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                
                                {currentData.hastodakaAmount != null && currentData.hastodakaAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-sm">{labels.hastodakaAmount}</span>
                                        <span className="text-gray-700">₹{currentData.hastodakaAmount.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-baseline mt-1.5 pt-1.5 border-t border-gray-100">
                                    <span className="text-gray-500 font-medium">{labels.totalAmount}</span>
                                    <span className="text-2xl font-bold text-gray-900">₹{currentData.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 font-medium">{labels.payment}</span>
                                    <span className="text-gray-900">{currentData.paymentMode}</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-3.5 mt-3.5 text-center">
                                <p className="text-gray-600 font-bold text-sm">{labels.greeting}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handlePrint}
                                disabled={generating || !kannadaData}
                                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-sky-600/20 border border-blue-500/30 hover:border-blue-400/50 transition-all text-sm disabled:opacity-50"
                            >
                                <Printer size={20} className="text-blue-400" />
                                <span className="text-xs font-medium">{lang === 'kn' ? 'ಮುದ್ರಿಸಿ' : 'Print'}</span>
                            </button>

                            {showSendMenu ? (
                                <div className="flex flex-col gap-1.5 justify-center h-full">
                                    <button
                                        onClick={handleWhatsApp}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#25D366]/10 text-[#075E54] dark:bg-[#25D366]/20 dark:text-[#25D366] hover:bg-[#25D366]/20 transition-colors font-bold border border-[#25D366]/20"
                                    >
                                        <MessageCircle size={18} /> WhatsApp
                                    </button>
                                    {isMobile && (
                                        <button
                                            onClick={handleSMS}
                                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors font-bold border border-blue-200/50"
                                        >
                                            <MessageCircle size={18} /> SMS
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowSendMenu(true)}
                                    disabled={generating || !kannadaData}
                                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gradient-to-br from-green-600/20 to-lime-600/20 border border-green-500/30 hover:border-green-400/50 transition-all text-sm disabled:opacity-50"
                                >
                                    <MessageCircle size={20} className="text-green-500" />
                                    <span className="text-xs font-bold text-center leading-tight">ಫೋನ್‌ಗೆ ಕಳುಹಿಸಿ</span>
                                </button>
                            )}
                        </div>

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="w-full mt-4 px-4 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] transition-colors text-sm text-center"
                        >
                            {lang === 'kn' ? 'ಮುಚ್ಚಿ' : 'Close'}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
