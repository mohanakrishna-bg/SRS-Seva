import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ClipboardList, Moon, Sun, Camera, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import MediaCaptureModal from './MediaCaptureModal';
import RegistrationModal from './RegistrationModal';
import DonationModal from './DonationModal';
import ReceiptGenerator from './ReceiptGenerator';
import { useToast } from './Toast';

import { useSettings } from '../context/SettingsContext';

export type LayoutContextType = {
    openRegModal: (eventName?: string, eventCode?: string) => void;
    openDonModal: () => void;
    openReceiptModal: (receiptData: any) => void;
};

export default function Layout() {
    const { settings } = useSettings();
    const bgImage = settings.bgImage;
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('seva_theme') as 'light' | 'dark') || 'light';
    });
    
    // Modal states
    const [mediaModal, setMediaModal] = useState<{ isOpen: boolean; type: 'photo' | 'audio' }>({ isOpen: false, type: 'photo' });
    const [regModalOpen, setRegModalOpen] = useState(false);
    const [prefillSevaName, setPrefillSevaName] = useState<string | undefined>(undefined);
    const [prefillEventCode, setPrefillEventCode] = useState<string | undefined>(undefined);
    const [donModalOpen, setDonModalOpen] = useState(false);
    
    const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { showToast } = useToast();

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem('seva_theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const handleMediaCapture = async (file: File) => {
        try {
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await (window as any).showSaveFilePicker({
                        suggestedName: file.name,
                        types: [{
                            description: file.type.startsWith('image/') ? 'Image File' : 'Audio File',
                            accept: { [file.type]: [file.name.substring(file.name.lastIndexOf('.'))] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(file);
                    await writable.close();
                    showToast('success', `${file.name} ಸ್ಥಳೀಯವಾಗಿ ಉಳಿಸಲಾಗಿದೆ (Saved locally)`);
                } catch (err: any) {
                    if (err.name !== 'AbortError') throw err;
                }
            } else {
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.click();
                URL.revokeObjectURL(url);
                showToast('success', `${file.name} ಡೌನ್ಲೋಡ್ ಮಾಡಲಾಗಿದೆ (Downloaded)`);
            }
        } catch (error) {
            console.error('Local save failed:', error);
            showToast('error', 'ಫೈಲ್ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ (Failed to save locally)');
        }
        setMediaModal({ ...mediaModal, isOpen: false });
    };

    return (
        <div className="min-h-screen relative flex flex-col bg-[var(--bg-dark)] pb-24 lg:pb-0">
            {bgImage && (
                <>
                    <div
                        className="fixed inset-0 z-0 pointer-events-none"
                        style={{
                            backgroundImage: `url(${bgImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            opacity: 0.2,
                        }}
                    />
                    <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-[var(--bg-dark)]/40 via-transparent to-[var(--bg-dark)]/60" />
                </>
            )}
            
            <div className="px-4 py-4 md:px-8 pb-0 relative z-20 max-w-6xl mx-auto w-full">
                <Header />
            </div>

            <div className="flex flex-1 relative max-w-6xl mx-auto w-full px-4 md:px-8 py-2 md:py-6 gap-6">
                {/* Global Navigation Sidebar */}
                <aside className="hidden lg:flex w-64 shrink-0 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-4 space-y-2 flex-col h-[calc(100vh-8rem)] sticky top-24 backdrop-blur-md shadow-lg z-20">
                    <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`} end>
                        <span className="flex items-center justify-center w-5 h-5">🏠</span>
                        ಮುಖಪುಟ (Home)
                    </NavLink>

                    <button onClick={() => setRegModalOpen(true)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold transition-all text-left text-[var(--text-secondary)]">
                        <ClipboardList size={20} />
                        ಸೇವಾ ಬುಕಿಂಗ್
                    </button>

                    <NavLink to="/accounting" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}>
                        <span className="flex items-center justify-center w-5 h-5">📊</span>
                        ಲೆಕ್ಕಪತ್ರ
                    </NavLink>

                    <NavLink to="/assets" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}>
                        <span className="flex items-center justify-center w-5 h-5">🏛️</span>
                        ಆಸ್ತಿಗಳು
                    </NavLink>

                    <NavLink to="/consumables" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}>
                        <span className="flex items-center justify-center w-5 h-5">📦</span>
                        ಬಳಕೆ ವಸ್ತುಗಳು
                    </NavLink>

                    <button onClick={() => setDonModalOpen(true)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold transition-all text-left text-[var(--text-secondary)]">
                        <span className="flex items-center justify-center w-5 h-5">🎁</span>
                        ದಾನ ನೋಂದಣಿ
                    </button>

                    <NavLink to="/manage" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}>
                        <ClipboardList size={20} />
                        ನಿರ್ವಹಣೆ
                    </NavLink>

                    <div className="mt-auto">
                        <div className="flex gap-2">
                            <button onClick={toggleTheme} className="flex-1 flex justify-center p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all" title="Theme">
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                            <button onClick={() => setMediaModal({ isOpen: true, type: 'photo' })} className="flex-1 flex justify-center p-3 rounded-xl hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-600 transition-all">
                                <Camera size={18} />
                            </button>
                            <button onClick={() => setMediaModal({ isOpen: true, type: 'audio' })} className="flex-1 flex justify-center p-3 rounded-xl hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-600 transition-all">
                                <Mic size={18} />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Routable Main Content Area */}
                <main className="flex-1 relative z-10 w-full min-w-0">
                    <Outlet context={{ 
                        openRegModal: (name?: string, code?: string) => {
                            setPrefillSevaName(name);
                            setPrefillEventCode(code);
                            setRegModalOpen(true);
                        },
                        openDonModal: () => setDonModalOpen(true),
                        openReceiptModal: (data: any) => {
                            setReceiptData(data);
                            setShowReceiptGenerator(true);
                        }
                    } satisfies LayoutContextType} />
                </main>
            </div>

            {/* Global Modals */}
            <RegistrationModal
                isOpen={regModalOpen}
                onClose={() => {
                    setRegModalOpen(false);
                    setPrefillSevaName(undefined);
                    setPrefillEventCode(undefined);
                }}
                prefillSeva={prefillSevaName}
                prefillEventCode={prefillEventCode}
                onSuccess={(data) => {
                    setRegModalOpen(false);
                    setPrefillSevaName(undefined);
                    setPrefillEventCode(undefined);
                    setReceiptData({
                        voucherNo: data.invoice.VoucherNo,
                        date: data.invoice.RegistrationDate || data.invoice.Date,
                        customerName: data.customer.Name,
                        gotra: data.customer.Gotra || data.customer.Sgotra,
                        nakshatra: data.customer.Nakshatra || data.customer.SNakshatra,
                        sevaDescription: data.item.Description,
                        amount: data.invoice.GrandTotal || data.invoice.TotalAmount,
                        paymentMode: data.invoice.PaymentMode || data.invoice.Payment_Mode
                    });
                    setShowReceiptGenerator(true);
                }}
            />

            <DonationModal
                isOpen={donModalOpen}
                onClose={() => setDonModalOpen(false)}
                onSuccess={(data) => {
                    setDonModalOpen(false);
                    setReceiptData({
                        voucherNo: data.donation.DonationReceiptNo || data.donation.Id?.toString() || 'DON-XXX',
                        date: data.donation.DonationDate || new Date().toISOString(),
                        customerName: data.customer.Name,
                        customerNameEn: data.customer.NameEn,
                        gotra: data.customer.Sgotra,
                        gotraEn: data.customer.SgotraEn,
                        nakshatra: data.customer.SNakshatra,
                        nakshatraEn: data.customer.SNakshatraEn,
                        sevaDescription: data.donation.ItemName || 'ದಾನ (Donation)',
                        amount: data.donation.EstimatedValue || 0,
                        paymentMode: data.donation.PaymentMode || 'Cash'
                    });
                    setShowReceiptGenerator(true);
                }}
            />

            <ReceiptGenerator
                isOpen={showReceiptGenerator}
                onClose={() => setShowReceiptGenerator(false)}
                receiptData={receiptData}
            />

            {mediaModal.isOpen && (
                <MediaCaptureModal
                    isOpen={mediaModal.isOpen}
                    onClose={() => setMediaModal({ ...mediaModal, isOpen: false })}
                    type={mediaModal.type}
                    onCapture={handleMediaCapture}
                />
            )}

            {/* Mobile Bottom Navigation Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--glass-card-bg)] border-t border-[var(--glass-border)] backdrop-blur-xl shadow-2xl px-4 py-2 flex items-center justify-around h-16 safe-bottom">
                <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 text-[10px] font-bold ${isActive ? 'text-orange-500' : 'text-[var(--text-secondary)]'}`} end>
                    <span className="text-xl">🏠</span>
                    <span>Home</span>
                </NavLink>

                <NavLink to="/assets" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 text-[10px] font-bold ${isActive ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
                    <span className="text-xl">🏛️</span>
                    <span>Assets</span>
                </NavLink>

                <button onClick={() => setRegModalOpen(true)} className="flex flex-col items-center justify-center flex-1 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/20 transform -translate-y-4 border-4 border-[var(--bg-dark)] text-xl font-bold">+</span>
                    <span className="-mt-3">Book Seva</span>
                </button>

                <NavLink to="/consumables" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 text-[10px] font-bold ${isActive ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
                    <span className="text-xl">📦</span>
                    <span>Consumables</span>
                </NavLink>

                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`flex flex-col items-center justify-center flex-1 text-[10px] font-bold ${isMobileMenuOpen ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`}>
                    <span className="text-xl">{isMobileMenuOpen ? '✕' : '⚙️'}</span>
                    <span>{isMobileMenuOpen ? 'Close' : 'More'}</span>
                </button>
            </nav>

            {/* Mobile More Menu Popover Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="lg:hidden fixed bottom-20 left-4 right-4 z-30 bg-[var(--glass-card-bg)] border border-[var(--glass-border)] rounded-2xl p-4 backdrop-blur-2xl shadow-2xl flex flex-col gap-3"
                    >
                        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--glass-border)] pb-2 mb-1">
                            ಹೆಚ್ಚಿನ ಆಯ್ಕೆಗಳು (More Options)
                        </div>

                        <button 
                            onClick={() => { setDonModalOpen(true); setIsMobileMenuOpen(false); }} 
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold transition-all text-left"
                        >
                            <span className="text-lg">🎁</span>
                            ದಾನ ನೋಂದಣಿ (Donation)
                        </button>

                        <NavLink 
                            to="/accounting" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}
                        >
                            <span className="text-lg">📊</span>
                            ಲೆಕ್ಕಪತ್ರ (Accounting)
                        </NavLink>

                        <NavLink 
                            to="/manage" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-amber-500/10 text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}
                        >
                            <ClipboardList size={18} />
                            ನಿರ್ವಹಣೆ (Manage)
                        </NavLink>

                        <div className="border-t border-[var(--glass-border)] pt-3 flex gap-2">
                            <button onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }} className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-bold text-[var(--text-secondary)]">
                                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                            </button>
                            <button onClick={() => { setMediaModal({ isOpen: true, type: 'photo' }); setIsMobileMenuOpen(false); }} className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 text-xs font-bold text-emerald-600">
                                <Camera size={16} /> Photo
                            </button>
                            <button onClick={() => { setMediaModal({ isOpen: true, type: 'audio' }); setIsMobileMenuOpen(false); }} className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/10 text-xs font-bold text-rose-600">
                                <Mic size={16} /> Audio
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
