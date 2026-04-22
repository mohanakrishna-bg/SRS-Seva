import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ClipboardList, Moon, Sun, Camera, Mic } from 'lucide-react';
import Header from './Header';
import MediaCaptureModal from './MediaCaptureModal';
import RegistrationModal from './RegistrationModal';
import DonationModal from './DonationModal';
import ReceiptGenerator from './ReceiptGenerator';
import { useToast } from './Toast';

const SETTINGS_KEY = 'seva_org_settings';

function getBgImage(): string | undefined {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.bgImage;
        }
    } catch { /* ignore */ }
    return undefined;
}

export type LayoutContextType = {
    openRegModal: (eventName?: string, eventCode?: string) => void;
    openDonModal: () => void;
    openReceiptModal: (receiptData: any) => void;
};

export default function Layout() {
    const bgImage = getBgImage();
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

    const navLinkClass = ({ isActive }: { isActive: boolean }) => 
        `flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left ${
            isActive 
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'
        }`;

    return (
        <div className="min-h-screen relative flex flex-col bg-[var(--bg-dark)]">
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
                <aside className="w-64 shrink-0 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-4 space-y-2 flex flex-col h-[calc(100vh-8rem)] sticky top-24 backdrop-blur-md shadow-lg z-20">
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
        </div>
    );
}
