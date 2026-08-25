import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ClipboardList, Moon, Sun, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import MediaCaptureModal from './MediaCaptureModal';
import RegistrationModal from './RegistrationModal';
import DonationModal from './DonationModal';
import ReceiptGenerator from './ReceiptGenerator';
import { useToast } from './Toast';
import GlobalInputToolbar from './GlobalInputToolbar';

import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import CommandPalette from './ui/CommandPalette';

export type LayoutContextType = {
    openRegModal: (eventName?: string, eventCode?: string) => void;
    openDonModal: () => void;
    openReceiptModal: (receiptData: any) => void;
};

export default function Layout() {
    const { settings } = useSettings();
    const { can, user, logout } = useAuth();
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
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { showToast } = useToast();

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.documentElement.classList.remove('dark');
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
                    showToast('success', `${file.name} ಸ್ಥಳೀಯವಾಗಿ ಉಳಿಸಲಾಗಿದೆ`);
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
                showToast('success', `${file.name} ಡೌನ್ಲೋಡ್ ಮಾಡಲಾಗಿದೆ`);
            }
        } catch (error) {
            console.error('Local save failed:', error);
            showToast('error', 'ಫೈಲ್ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ');
        }
        setMediaModal({ ...mediaModal, isOpen: false });
    };

    // Command Palette Shortcut (Ctrl+K / Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const layoutContext: LayoutContextType = {
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
                {/* Global Input Toolbar (Language Switcher) & Theme Switcher */}
                <div className="absolute top-6 right-6 md:right-10 hidden sm:flex items-center gap-3 z-50">
                    <GlobalInputToolbar />
                    <button 
                        onClick={toggleTheme} 
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs font-bold text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-all shadow-sm backdrop-blur-md cursor-pointer"
                    >
                        {theme === 'light' ? <Moon size={14} className="text-[var(--primary)]" /> : <Sun size={14} className="text-[var(--primary)]" />}
                        <span>{theme === 'light' ? 'ಕತ್ತಲೆ' : 'ಬೆಳಕು'}</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-1 relative max-w-6xl mx-auto w-full px-4 md:px-8 py-2 md:py-6 gap-6">
                {/* Global Navigation Sidebar */}
                <aside className="hidden lg:flex w-64 shrink-0 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-4 space-y-2 flex-col h-[calc(100vh-8rem)] sticky top-24 backdrop-blur-md shadow-lg z-20">
                    <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`} end>
                        <span className="flex items-center justify-center w-5 h-5">🏠</span>
                        ಮುಖಪುಟ
                    </NavLink>

                    {can('seva') && (
                        <NavLink to="/seva" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}>
                            <ClipboardList size={20} />
                            ಸೇವಾ ಸಂಬಂಧಿತ ಕ್ರಿಯೆಗಳು
                        </NavLink>
                    )}

                    {can('accounting') && (
                        <NavLink to="/accounting" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}>
                            <span className="flex items-center justify-center w-5 h-5">📊</span>
                            ಲೆಕ್ಕಪತ್ರ
                        </NavLink>
                    )}

                    {can('assets') && (
                        <NavLink to="/assets" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}>
                            <span className="flex items-center justify-center w-5 h-5">🏛️</span>
                            ಆಸ್ತಿಗಳು
                        </NavLink>
                    )}

                    {can('consumables') && (
                        <NavLink to="/consumables" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}>
                            <span className="flex items-center justify-center w-5 h-5">📦</span>
                            ಬಳಕೆ ವಸ್ತುಗಳು
                        </NavLink>
                    )}

                    {can('donations') && (
                        <button onClick={() => setDonModalOpen(true)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold transition-all text-left text-[var(--text-secondary)]">
                            <span className="flex items-center justify-center w-5 h-5">🎁</span>
                            ದಾನ ನೋಂದಣಿ
                        </button>
                    )}

                    {can('settings') && (
                        <NavLink to="/manage" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}>
                            <ClipboardList size={20} />
                            ನಿರ್ವಹಣೆ
                        </NavLink>
                    )}

                    <div className="mt-auto space-y-3">
                        {/* User Badge */}
                        {user && (
                            <div className="border-t border-[var(--glass-border)] pt-3">
                                <div className="flex items-center gap-2.5 px-2">
                                    <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-bold text-[var(--primary)]">
                                            {(user.display_name || user.username).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                                            {user.display_name || user.username}
                                        </p>
                                        <p className="text-[10px] text-[var(--text-secondary)] capitalize">
                                            {user.role}
                                        </p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                                        title="ಲಾಗ್ ಔಟ್"
                                    >
                                        <LogOut size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Routable Main Content Area */}
                <main className="flex-1 relative z-10 w-full min-w-0">
                    <Outlet context={layoutContext} />
                </main>
            </div>

            {/* Global UI Overlays */}
            <CommandPalette 
                isOpen={commandPaletteOpen} 
                onClose={() => setCommandPaletteOpen(false)} 
                layoutContext={layoutContext} 
            />

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
                        voucherNo: data.invoice.VoucherNo || data.invoice.RegistrationId?.toString() || 'VCH-XXX',
                        date: data.invoice.RegistrationDate || data.invoice.Date || new Date().toISOString(),
                        customerName: data.customer.Name || 'Unknown',
                        gotra: data.customer.Gotra || data.customer.Sgotra || '',
                        nakshatra: data.customer.Nakshatra || data.customer.SNakshatra || '',
                        sevaDescription: data.item?.Description || 'Seva Registration',
                        amount: data.invoice.GrandTotal ?? data.invoice.TotalAmount ?? data.invoice.Amount ?? data.item?.Amount ?? 0,
                        sevaAmount: data.invoice.Amount ?? data.item?.Amount ?? 0,
                        hastodakaAmount: ((data.invoice.GrandTotal ?? 0) - (data.invoice.Amount ?? 0)) > 0 ? (data.invoice.GrandTotal ?? 0) - (data.invoice.Amount ?? 0) : undefined,
                        paymentMode: data.invoice.PaymentMode || data.invoice.Payment_Mode || 'Cash'
                    });
                    setShowReceiptGenerator(true);
                    window.dispatchEvent(new Event('registration_created'));
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
                        sevaDescription: data.donation.ItemName || 'ದಾನ',
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
                    <span>ಮುಖಪುಟ</span>
                </NavLink>

                <NavLink to="/assets" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 text-[10px] font-bold ${isActive ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
                    <span className="text-xl">🏛️</span>
                    <span>ಆಸ್ತಿಗಳು</span>
                </NavLink>

                <button onClick={() => setRegModalOpen(true)} className="flex flex-col items-center justify-center flex-1 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/20 transform -translate-y-4 border-4 border-[var(--bg-dark)] text-xl font-bold">+</span>
                    <span className="-mt-3">ಸೇವೆ ಬುಕ್ ಮಾಡಿ</span>
                </button>

                <NavLink to="/consumables" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 text-[10px] font-bold ${isActive ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
                    <span className="text-xl">📦</span>
                    <span>ಬಳಕೆ ವಸ್ತುಗಳು</span>
                </NavLink>

                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`flex flex-col items-center justify-center flex-1 text-[10px] font-bold ${isMobileMenuOpen ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`}>
                    <span className="text-xl">{isMobileMenuOpen ? '✕' : '⚙️'}</span>
                    <span>{isMobileMenuOpen ? 'ಮುಚ್ಚು' : 'ಹೆಚ್ಚು'}</span>
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
                            ಹೆಚ್ಚಿನ ಆಯ್ಕೆಗಳು
                        </div>

                        <button 
                            onClick={() => { setDonModalOpen(true); setIsMobileMenuOpen(false); }} 
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold transition-all text-left"
                        >
                            <span className="text-lg">🎁</span>
                            ದಾನ ನೋಂದಣಿ
                        </button>

                        <NavLink 
                            to="/accounting" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}
                        >
                            <span className="text-lg">📊</span>
                            ಲೆಕ್ಕಪತ್ರ
                        </NavLink>

                        <NavLink 
                            to="/manage" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-amber-500/10 text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'}`}
                        >
                            <ClipboardList size={18} />
                            ನಿರ್ವಹಣೆ
                        </NavLink>

                        <div className="border-t border-[var(--glass-border)] pt-3 space-y-3">
                            {/* User Badge — Mobile */}
                            {user && (
                                <div className="flex items-center gap-2.5 px-1">
                                    <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-bold text-[var(--primary)]">
                                            {(user.display_name || user.username).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                                            {user.display_name || user.username}
                                        </p>
                                        <p className="text-[10px] text-[var(--text-secondary)] capitalize">
                                            {user.role}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-xs font-bold text-red-500 hover:bg-red-500/20 transition-colors"
                                    >
                                        <LogOut size={13} />
                                        ಲಾಗ್ ಔಟ್
                                    </button>
                                </div>
                            )}
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }} 
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-bold text-[var(--text-primary)]"
                                >
                                    {theme === 'light' ? <Moon size={16} className="text-[var(--primary)]" /> : <Sun size={16} className="text-[var(--primary)]" />}
                                    <span>{theme === 'light' ? 'ಕತ್ತಲೆ' : 'ಬೆಳಕು'}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
