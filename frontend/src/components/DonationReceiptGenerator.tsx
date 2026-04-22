import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, MessageCircle, X, Download, Languages } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { transliterateToKannada, transliterateKnToEn } from '../transliterate';
import { GOTRAS, NAKSHATRAS } from '../constants/panchanga';

interface DonationReceiptData {
    voucherNo: string;
    date: string;
    donorName: string;
    donorNameEn?: string;
    gotra?: string;
    gotraEn?: string;
    nakshatra?: string;
    nakshatraEn?: string;
    itemName: string;
    itemDescription?: string;
    material?: string;
    quantity: number;
    uom: string;
    estimatedValue: number;
    donationType: string;
    panNumber?: string;
}

interface DonationReceiptProps {
    isOpen: boolean;
    onClose: () => void;
    receiptData: DonationReceiptData | null;
}

const SETTINGS_KEY = 'seva_org_settings';
function getOrgSettings() {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) return JSON.parse(stored);
    } catch {}
    return {};
}

function formatReceiptDate(dateStr: string): string {
    if (!dateStr) return new Date().toLocaleDateString('en-IN');
    // Handle DD/MM/YYYY
    if (dateStr.includes('/')) return dateStr;
    // Handle YYYY-MM-DD
    if (dateStr.includes('-')) {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }
    return dateStr;
}

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DonationReceiptGenerator({ isOpen, onClose, receiptData }: DonationReceiptProps) {
    const [generating, setGenerating] = useState(false);
    const [lang, setLang] = useState<'kn' | 'en'>('kn');
    const [kannadaData, setKannadaData] = useState<DonationReceiptData | null>(null);
    const [showSendMenu, setShowSendMenu] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);
    const settings = getOrgSettings();

    const orgNameKn = settings.orgName && settings.orgName.match(/[\u0C80-\u0CFF]/) ? settings.orgName : 'ಶ್ರೀ ಮಠ ಆಡಳಿತ';
    const orgNameEn = settings.orgNameEn || 'Shri Matha Admin';

    useEffect(() => {
        if (!receiptData) return;
        const prepare = async () => {
            const kn: DonationReceiptData = {
                ...receiptData,
                donorName: await transliterateToKannada(receiptData.donorName),
                gotra: receiptData.gotra ? await transliterateToKannada(receiptData.gotra) : '',
                nakshatra: receiptData.nakshatra ? await transliterateToKannada(receiptData.nakshatra) : '',
                itemName: await transliterateToKannada(receiptData.itemName),
            };
            setKannadaData(kn);
        };
        prepare();
    }, [receiptData]);

    if (!receiptData) return null;

    const currentData = lang === 'en' ? {
        ...receiptData,
        donorName: receiptData.donorNameEn || receiptData.donorName,
        gotra: receiptData.gotraEn || receiptData.gotra,
        nakshatra: receiptData.nakshatraEn || receiptData.nakshatra,
    } : (kannadaData || receiptData);

    // Fix Gotra/Nakshatra for EN
    if (lang === 'en') {
        const knRegex = /[\u0C80-\u0CFF]/;
        if (currentData.gotra && knRegex.test(currentData.gotra)) {
            const match = GOTRAS.find(g => g.kn === currentData.gotra!.trim());
            if (match) currentData.gotra = match.en;
            else currentData.gotra = transliterateKnToEn(currentData.gotra);
        }
        if (currentData.nakshatra && knRegex.test(currentData.nakshatra)) {
            const match = NAKSHATRAS.find(n => n.kn === currentData.nakshatra!.trim());
            if (match) currentData.nakshatra = match.en;
            else currentData.nakshatra = transliterateKnToEn(currentData.nakshatra);
        }
        if (currentData.donorName && knRegex.test(currentData.donorName)) {
            currentData.donorName = transliterateKnToEn(currentData.donorName);
        }
    }

    const activeOrgName = lang === 'en' ? orgNameEn : orgNameKn;
    const activeAddress = lang === 'en' ? (settings.addressEn || settings.address) : settings.address;

    const labels = lang === 'en' ? {
        title: 'DONATION RECEIPT', receiptNo: 'Receipt No', date: 'Date',
        donor: 'Donor', gotra: 'Gotra', nakshatra: 'Nakshatra',
        item: 'Item Donated', qty: 'Quantity', value: 'Estimated Value',
        type: 'Type', pan: 'PAN', greeting: '🙏 Harih Om 🙏',
        is80g: '(Eligible for deduction under Section 80G)',
    } : {
        title: 'ದಾನ ರಸೀದಿ', receiptNo: 'ರಸೀದಿ ಸಂಖ್ಯೆ', date: 'ದಿನಾಂಕ',
        donor: 'ದಾನಿ', gotra: 'ಗೋತ್ರ', nakshatra: 'ನಕ್ಷತ್ರ',
        item: 'ದಾನಿಸಿದ ವಸ್ತು', qty: 'ಪ್ರಮಾಣ', value: 'ಅಂದಾಜು ಮೌಲ್ಯ',
        type: 'ವಿಧ', pan: 'ಪ್ಯಾನ್', greeting: '🙏 ಹರಿಃ ಓಂ 🙏',
        is80g: '(ಸೆಕ್ಷನ್ 80G ಅಡಿಯಲ್ಲಿ ಕಡಿತಕ್ಕೆ ಅರ್ಹ)',
    };

    const receiptText = [
        `🙏 ${activeOrgName}`, activeAddress ? `📍 ${activeAddress}` : '', settings.phone ? `📞 ${settings.phone}` : '',
        `━━━━━━━━━━━━━━━━━`, `${labels.title}`, `━━━━━━━━━━━━━━━━━`,
        `${labels.receiptNo}: ${currentData.voucherNo}`, `${labels.date}: ${formatReceiptDate(currentData.date)}`, `━━━━━━━━━━━━━━━━━`,
        `${labels.donor}: ${currentData.donorName}`, currentData.gotra ? `${labels.gotra}: ${currentData.gotra}` : '',
        `━━━━━━━━━━━━━━━━━`, `${labels.item}: ${currentData.itemName}`,
        `${labels.qty}: ${currentData.quantity} ${currentData.uom}`,
        `${labels.value}: ${fmt(currentData.estimatedValue)}`,
        currentData.panNumber ? `${labels.pan}: ${currentData.panNumber}` : '',
        `━━━━━━━━━━━━━━━━━`, labels.greeting,
    ].filter(Boolean).join('\n');

    const handlePrint = () => {
        if (!receiptRef.current) return;
        const content = receiptRef.current.innerHTML;
        const pw = window.open('', '_blank');
        if (!pw) return;
        pw.document.write(`<html><head><title>Donation Receipt ${currentData.voucherNo}</title>
            <style>body{font-family:sans-serif;padding:20px;font-size:14px;color:#000;}*{box-sizing:border-box;}.text-center{text-align:center;}.flex{display:flex;}.justify-between{justify-content:space-between;}.mb-3{margin-bottom:12px;}.font-bold{font-weight:bold;}.text-xs{font-size:12px;}.text-xl{font-size:20px;}.pt-2{padding-top:8px;}.mt-2{margin-top:8px;}.border-t{border-top:1px dashed #ccc;}.space-y-1>*+*{margin-top:4px;}</style>
            </head><body>${content.replace(/var\(--text-secondary\)/g, '#555').replace(/var\(--text-primary\)/g, '#000')}
            <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script></body></html>`);
        pw.document.close();
    };

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        setGenerating(true);
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 3, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = 80;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Donation-${currentData.voucherNo}.pdf`);
        } catch (err) { console.error('PDF generation failed:', err); }
        setGenerating(false);
    };

    const handleWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(receiptText)}`, '_blank'); setShowSendMenu(false); };
    const handleSMS = () => { window.open(`sms:?body=${encodeURIComponent(receiptText)}`, '_self'); setShowSendMenu(false); };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">ದಾನ ರಸೀದಿ</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setLang(lang === 'kn' ? 'en' : 'kn')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors text-sm font-medium border border-rose-500/30">
                                    <Languages size={14} /> {lang === 'kn' ? 'English' : 'ಕನ್ನಡ'}
                                </button>
                                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400"><X size={18} /></button>
                            </div>
                        </div>

                        {/* Receipt */}
                        <div ref={receiptRef} className="bg-white dark:bg-white text-black rounded-xl border border-gray-200 p-5 mb-5 font-mono text-sm space-y-1 shadow-inner relative">
                            <div className="text-center mb-3">
                                <p className="text-base font-bold text-gray-900">{activeOrgName}</p>
                                {activeAddress && <p className="text-xs text-gray-600">{activeAddress}</p>}
                                {settings.phone && <p className="text-xs text-gray-600">Ph: {settings.phone}</p>}
                                <p className="text-xs font-bold text-rose-700 mt-1 uppercase tracking-wider">{labels.title}</p>
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 mt-2">
                                <div className="flex justify-between"><span className="text-gray-500">{labels.receiptNo}</span><span className="text-gray-900 font-bold">{currentData.voucherNo}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">{labels.date}</span><span className="text-gray-900">{formatReceiptDate(currentData.date)}</span></div>
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 mt-2">
                                <div className="flex justify-between"><span className="text-gray-500">{labels.donor}</span><span className="text-gray-900 font-bold">{currentData.donorName}</span></div>
                                {currentData.gotra && <div className="flex justify-between"><span className="text-gray-500">{labels.gotra}</span><span className="text-gray-900">{currentData.gotra}</span></div>}
                                {currentData.nakshatra && <div className="flex justify-between"><span className="text-gray-500">{labels.nakshatra}</span><span className="text-gray-900">{currentData.nakshatra}</span></div>}
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 mt-2">
                                <div className="flex justify-between"><span className="text-gray-500">{labels.item}</span><span className="text-gray-900 font-bold max-w-[60%] text-right leading-tight">{currentData.itemName}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">{labels.qty}</span><span className="text-gray-900">{currentData.quantity} {currentData.uom}</span></div>
                                {currentData.material && <div className="flex justify-between"><span className="text-gray-500">Material</span><span className="text-gray-900">{currentData.material}</span></div>}
                                <div className="flex justify-between items-baseline mt-2 pt-1 border-t border-gray-100">
                                    <span className="text-gray-500">{labels.value}</span>
                                    <span className="text-xl font-bold text-gray-900">{fmt(currentData.estimatedValue)}</span>
                                </div>
                                {currentData.panNumber && (
                                    <div className="flex justify-between"><span className="text-gray-500">{labels.pan}</span><span className="text-gray-900 font-mono">{currentData.panNumber}</span></div>
                                )}
                            </div>

                            {currentData.panNumber && (
                                <div className="border-t border-dashed border-gray-300 pt-2 mt-2 text-center">
                                    <p className="text-[10px] text-gray-500 italic">{labels.is80g}</p>
                                </div>
                            )}

                            <div className="border-t border-dashed border-gray-300 pt-3 mt-3 text-center">
                                <p className="text-gray-600 font-bold text-xs">{labels.greeting}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={handlePrint} disabled={generating || !kannadaData}
                                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-sky-600/20 border border-blue-500/30 hover:border-blue-400/50 transition-all text-sm disabled:opacity-50">
                                <Printer size={20} className="text-blue-400" /><span className="text-xs font-medium">{lang === 'kn' ? 'ಮುದ್ರಿಸಿ' : 'Print'}</span>
                            </button>
                            <button onClick={handleDownload} disabled={generating || !kannadaData}
                                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gradient-to-br from-emerald-600/20 to-green-600/20 border border-emerald-500/30 hover:border-emerald-400/50 transition-all text-sm disabled:opacity-50">
                                <Download size={20} className="text-emerald-400" /><span className="text-xs font-medium">{lang === 'kn' ? 'ಡೌನ್ಲೋಡ್' : 'Download'}</span>
                            </button>
                            {showSendMenu ? (
                                <div className="flex flex-col gap-1.5 justify-center h-full">
                                    <button onClick={handleWhatsApp} className="w-full py-1.5 rounded-lg bg-[#25D366]/20 text-[#075E54] hover:bg-[#25D366]/30 text-xs font-bold border border-[#25D366]/30">WhatsApp</button>
                                    <button onClick={handleSMS} className="w-full py-1.5 rounded-lg bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 text-xs font-bold border border-blue-500/30">SMS</button>
                                </div>
                            ) : (
                                <button onClick={() => setShowSendMenu(true)} disabled={generating || !kannadaData}
                                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gradient-to-br from-green-600/20 to-lime-600/20 border border-green-500/30 hover:border-green-400/50 transition-all text-sm disabled:opacity-50">
                                    <MessageCircle size={20} className="text-green-500" /><span className="text-xs font-bold text-center leading-tight">ಫೋನ್‌ಗೆ ಕಳುಹಿಸಿ</span>
                                </button>
                            )}
                        </div>

                        <button onClick={onClose} className="w-full mt-4 px-4 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] transition-colors text-sm text-center">
                            {lang === 'kn' ? 'ಮುಚ್ಚಿ' : 'Close'}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
