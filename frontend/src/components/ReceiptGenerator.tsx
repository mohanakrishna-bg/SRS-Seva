import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, MessageCircle, X, Download, Languages } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { transliterateToKannada, transliterateKnToEn } from '../transliterate';
import { GOTRAS, NAKSHATRAS } from '../constants/panchanga';

interface ReceiptData {
    voucherNo: string;
    date: string;
    customerName: string;
    customerNameEn?: string;
    gotra?: string;
    gotraEn?: string;
    nakshatra?: string;
    nakshatraEn?: string;
    sevaDescription: string;
    sevaDescriptionEn?: string;
    amount: number;
    paymentMode: string;
    paymentModeEn?: string;
}

interface OrgSettings {
    orgName?: string;
    orgNameEn?: string;
    address?: string;
    addressEn?: string;
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

export default function ReceiptGenerator({ isOpen, onClose, receiptData }: ReceiptGeneratorProps) {
    const [generating, setGenerating] = useState(false);
    const [lang, setLang] = useState<'kn' | 'en'>('kn');
    const [kannadaData, setKannadaData] = useState<ReceiptData | null>(null);
    const [showSendMenu, setShowSendMenu] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);
    const settings = getOrgSettings();

    // Default Org names if none specified
    const orgNameKn = settings.orgName && settings.orgName.match(/[\u0C80-\u0CFF]/) ? settings.orgName : 'ಶ್ರೀ ಮಠ ಆಡಳಿತ';
    const orgNameEn = settings.orgNameEn || (settings.orgName ? transliterateKnToEn(settings.orgName) : 'Shri Matha Admin');

    useEffect(() => {
        if (!receiptData) return;
        const prepareKannadaData = async () => {
            const knData: ReceiptData = {
                ...receiptData,
                customerName: await transliterateToKannada(receiptData.customerName),
                gotra: receiptData.gotra ? await transliterateToKannada(receiptData.gotra) : '',
                nakshatra: receiptData.nakshatra ? await transliterateToKannada(receiptData.nakshatra) : '',
                sevaDescription: await transliterateToKannada(receiptData.sevaDescription),
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
        sevaDescription: receiptData.sevaDescriptionEn || receiptData.sevaDescription,
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
        if (currentData.sevaDescription && knRegex.test(currentData.sevaDescription)) {
            currentData.sevaDescription = transliterateKnToEn(currentData.sevaDescription);
        }
    }
    
    const activeOrgName = lang === 'en' ? orgNameEn : orgNameKn;
    const activeAddress = lang === 'en' ? (settings.addressEn || settings.address) : settings.address;
    const activeDate = lang === 'en' ? formatDateToEn(receiptData.date) : formatDateToKn(receiptData.date);

    const labels = {
        receiptNo: lang === 'en' ? 'Receipt No' : 'ರಸೀದಿ ಸಂಖ್ಯೆ',
        date: lang === 'en' ? 'Date' : 'ದಿನಾಂಕ',
        devotee: lang === 'en' ? 'Devotee' : 'ಭಕ್ತರು',
        gotra: lang === 'en' ? 'Gotra' : 'ಗೋತ್ರ',
        nakshatra: lang === 'en' ? 'Nakshatra' : 'ನಕ್ಷತ್ರ',
        seva: lang === 'en' ? 'Seva' : 'ಸೇವೆ',
        amount: lang === 'en' ? 'Amount' : 'ಮೊತ್ತ',
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
        `━━━━━━━━━━━━━━━━━`,
        `${labels.devotee}: ${currentData.customerName}`,
        currentData.gotra ? `${labels.gotra}: ${currentData.gotra}` : '',
        currentData.nakshatra ? `${labels.nakshatra}: ${currentData.nakshatra}` : '',
        `━━━━━━━━━━━━━━━━━`,
        `${labels.seva}: ${currentData.sevaDescription}`,
        `${labels.amount}: ₹${currentData.amount.toLocaleString()}`,
        `${labels.payment}: ${currentData.paymentMode}`,
        `━━━━━━━━━━━━━━━━━`,
        labels.greeting,
    ].filter(Boolean).join('\n');

    const handlePrint = () => {
        if (!receiptRef.current) return;
        const content = receiptRef.current.innerHTML;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt ${currentData.voucherNo}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; font-size: 14px; color: #000; }
                        * { box-sizing: border-box; }
                        .text-center { text-align: center; }
                        .flex { display: flex; }
                        .justify-between { justify-content: space-between; }
                        .items-baseline { align-items: baseline; }
                        .mb-3 { margin-bottom: 12px; }
                        .mb-5 { margin-bottom: 20px; }
                        .font-bold { font-weight: bold; }
                        .text-base { font-size: 16px; }
                        .text-xs { font-size: 12px; }
                        .text-xl { font-size: 20px; }
                        .pt-2 { padding-top: 8px; }
                        .mt-2 { margin-top: 8px; }
                        .border-t { border-top: 1px dashed #ccc; }
                        .space-y-1 > * + * { margin-top: 4px; }
                        .text-secondary { color: #555; }
                        .text-primary { color: #000; }
                        .opacity-0 { display: none !important; } /* Hide any elements that should be invisible */
                    </style>
                </head>
                <body>
                    ${content.replace(/var\(--text-secondary\)/g, '#555').replace(/var\(--text-primary\)/g, '#000')}
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        setGenerating(true);
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 3, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            
            // Standard receipt width ~ 80mm
            const pdfWidth = 80;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Receipt-${currentData.voucherNo}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
        }
        setGenerating(false);
    };

    const handleWhatsApp = () => {
        const encodedText = encodeURIComponent(receiptTextSummary);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        setShowSendMenu(false);
    };

    const handleSMS = () => {
        const encodedText = encodeURIComponent(receiptTextSummary);
        window.open(`sms:?body=${encodedText}`, '_self');
        setShowSendMenu(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setLang(lang === 'kn' ? 'en' : 'kn')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-saffron)]/10 text-[var(--accent-saffron)] hover:bg-[var(--accent-saffron)] hover:text-white transition-colors text-sm font-medium border border-[var(--accent-saffron)]/30"
                                >
                                    <Languages size={14} />
                                    {lang === 'kn' ? 'Switch to English' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ'}
                                </button>
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
                            className="bg-white dark:bg-white text-black rounded-xl border border-gray-200 p-5 mb-5 font-mono text-sm space-y-1 shadow-inner relative"
                        >
                            <div className="text-center mb-3">
                                <p className="text-base font-bold text-gray-900">{activeOrgName}</p>
                                {activeAddress && <p className="text-xs text-gray-600">{activeAddress}</p>}
                                {settings.phone && <p className="text-xs text-gray-600">Ph: {settings.phone}</p>}
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 mt-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{labels.receiptNo}</span>
                                    <span className="text-gray-900 font-bold">{currentData.voucherNo}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{labels.date}</span>
                                    <span className="text-gray-900">{activeDate}</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 mt-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{labels.devotee}</span>
                                    <span className="text-gray-900 font-bold">{currentData.customerName}</span>
                                </div>
                                {currentData.gotra && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{labels.gotra}</span>
                                        <span className="text-gray-900">{currentData.gotra}</span>
                                    </div>
                                )}
                                {currentData.nakshatra && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{labels.nakshatra}</span>
                                        <span className="text-gray-900">{currentData.nakshatra}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 mt-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{labels.seva}</span>
                                    <span className="text-gray-900 font-bold max-w-[60%] text-right leading-tight">{currentData.sevaDescription}</span>
                                </div>
                                <div className="flex justify-between items-baseline mt-2 pt-1 border-t border-gray-100">
                                    <span className="text-gray-500">{labels.amount}</span>
                                    <span className="text-xl font-bold text-gray-900">₹{currentData.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{labels.payment}</span>
                                    <span className="text-gray-900">{currentData.paymentMode}</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-3 mt-3 text-center">
                                <p className="text-gray-600 font-bold text-xs">{labels.greeting}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={handlePrint}
                                disabled={generating || !kannadaData}
                                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-sky-600/20 border border-blue-500/30 hover:border-blue-400/50 transition-all text-sm disabled:opacity-50"
                            >
                                <Printer size={20} className="text-blue-400" />
                                <span className="text-xs font-medium">{lang === 'kn' ? 'ಮುದ್ರಿಸಿ' : 'Print'}</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={generating || !kannadaData}
                                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gradient-to-br from-emerald-600/20 to-green-600/20 border border-emerald-500/30 hover:border-emerald-400/50 transition-all text-sm disabled:opacity-50"
                            >
                                <Download size={20} className="text-emerald-400" />
                                <span className="text-xs font-medium">{lang === 'kn' ? 'ಡೌನ್ಲೋಡ್' : 'Download'}</span>
                            </button>
                            {showSendMenu ? (
                                <div className="flex flex-col gap-1.5 justify-center h-full">
                                    <button
                                        onClick={handleWhatsApp}
                                        className="w-full py-1.5 rounded-lg bg-[#25D366]/20 text-[#075E54] hover:bg-[#25D366]/30 transition-all text-xs font-bold border border-[#25D366]/30 flex items-center justify-center gap-1"
                                    >
                                        WhatsApp
                                    </button>
                                    <button
                                        onClick={handleSMS}
                                        className="w-full py-1.5 rounded-lg bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 transition-all text-xs font-bold border border-blue-500/30 flex items-center justify-center gap-1"
                                    >
                                        SMS
                                    </button>
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
        </AnimatePresence>
    );
}
