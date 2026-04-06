import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Moon, Sun, Camera, Mic } from 'lucide-react';
import Header from '../components/Header';
import EeDinaCard from '../components/EeDinaCard';
import MediaCaptureModal from '../components/MediaCaptureModal';
import AdminLoginModal from '../components/AdminLoginModal';
import EventModal from '../components/EventModal';
import RegistrationModal from '../components/RegistrationModal';
import DaysHighlightsCard from '../components/DaysHighlightsCard';
import { useToast } from '../components/Toast';

interface LandingPageProps {
    onNavigate: (tab: string) => void;
    onShowReceipt?: (receiptData: any) => void;
}

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


export default function LandingPage({ onNavigate, onShowReceipt }: LandingPageProps) {
    const bgImage = getBgImage();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('seva_theme') as 'light' | 'dark') || 'light';
    });
    const [mediaModal, setMediaModal] = useState<{ isOpen: boolean; type: 'photo' | 'audio' }>({ isOpen: false, type: 'photo' });
    const [adminModalOpen, setAdminModalOpen] = useState(false);
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [prefillSevaName, setPrefillSevaName] = useState<string | undefined>(undefined);
    const [prefillEventCode, setPrefillEventCode] = useState<string | undefined>(undefined);
    const [regModalOpen, setRegModalOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem('seva_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleMediaCapture = async (file: File) => {
        try {
            // Check if showSaveFilePicker is supported (File System Access API)
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
                    // User cancelled, do nothing
                }
            } else {
                // Fallback for browsers that don't support File System Access API
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

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
    };

    const handleAdminSuccess = () => {
        setAdminModalOpen(false);
        onNavigate('Settings');
    };

    return (
        <div className="min-h-screen relative flex flex-col">
            {/* Background image — cover without distorting aspect ratio */}
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
            {/* Top Banner Header */}
            <div className="px-4 py-4 md:px-8 pb-0 relative z-20">
                <Header onHome={() => onNavigate('Home')} />
            </div>

            <div className="flex flex-1 relative">
                {/* Left Navigation Panel */}
                <aside className="w-64 bg-[var(--glass-bg)] border-r border-[var(--glass-border)] p-6 space-y-4 flex flex-col h-full sticky top-0 backdrop-blur-md z-20">
                
                <button
                    onClick={() => setRegModalOpen(true)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold transition-all text-left"
                >
                    <ClipboardList size={20} />
                    ಸೇವಾ ಬುಕಿಂಗ್ (Booking)
                </button>

                <button
                    onClick={() => onNavigate('Accounting')}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold transition-all text-left"
                >
                    <span className="flex items-center justify-center w-5 h-5">📊</span>
                    Accounting
                </button>

                <button
                    onClick={() => onNavigate('Inventory')}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold transition-all text-left"
                >
                    <span className="flex items-center justify-center w-5 h-5">📦</span>
                    Inventory
                </button>

                <button
                    onClick={() => onNavigate('Manage')}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--primary)]/10 text-[var(--primary)] transition-all font-bold text-left"
                >
                    <ClipboardList size={20} />
                    ನಿರ್ವಹಣೆ (Manage)
                </button>

                <div className="mt-auto">
                    <div className="flex gap-2">
                        <button
                            onClick={toggleTheme}
                             className="flex-1 flex justify-center p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all"
                             title="Theme"
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        <button
                            onClick={() => setMediaModal({ isOpen: true, type: 'photo' })}
                            className="flex-1 flex justify-center p-3 rounded-xl hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all relative group"
                            title="Photo"
                        >
                            <Camera size={18} />
                        </button>
                        <button
                            onClick={() => setMediaModal({ isOpen: true, type: 'audio' })}
                            className="flex-1 flex justify-center p-3 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all relative group"
                            title="Audio"
                        >
                            <Mic size={18} />
                        </button>
                    </div>
                </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 px-2 md:px-4 py-3 relative z-10 overflow-y-auto">
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-col gap-4 w-full"
                >
                    {/* EeDinaCard — auto height, full width */}
                    <div className="w-full">
                        <EeDinaCard date={selectedDate || new Date()} onDateChange={handleDateSelect} />
                    </div>
                    {/* Special Events Dashboard — full width, grows with content */}
                    <div className="w-full">
                        <DaysHighlightsCard
                                date={selectedDate || new Date()}
                                onRegisterSpecialEvent={(eventName, eventCode) => {
                                    setPrefillSevaName(eventName);
                                    setPrefillEventCode(eventCode);
                                    setRegModalOpen(true);
                                }}
                            />
                    </div>
                </motion.section>
            </div>

            {mediaModal.isOpen && (
                <MediaCaptureModal
                    isOpen={mediaModal.isOpen}
                    onClose={() => setMediaModal({ ...mediaModal, isOpen: false })}
                    type={mediaModal.type}
                    onCapture={handleMediaCapture}
                />
            )}

            <AdminLoginModal
                isOpen={adminModalOpen}
                onClose={() => setAdminModalOpen(false)}
                onSuccess={handleAdminSuccess}
            />

            <EventModal
                isOpen={eventModalOpen}
                date={selectedDate}
                onClose={() => {
                    setEventModalOpen(false);
                }}
            />

            <RegistrationModal
                isOpen={regModalOpen}
                onClose={() => {
                    setRegModalOpen(false);
                    setPrefillSevaName(undefined);
                    setPrefillEventCode(undefined);
                }}
                prefillDate={selectedDate}
                prefillSeva={prefillSevaName}
                prefillEventCode={prefillEventCode}
                onSuccess={(data: any) => {
                    setRegModalOpen(false);
                    if (onShowReceipt) {
                        onShowReceipt({
                            voucherNo: data.invoice.VoucherNo,
                            date: data.invoice.RegistrationDate || data.invoice.Date,
                            customerName: data.customer.Name,
                            customerNameEn: data.customer.NameEn,
                            gotra: data.customer.Sgotra,
                            gotraEn: data.customer.SgotraEn,
                            nakshatra: data.customer.SNakshatra,
                            nakshatraEn: data.customer.SNakshatraEn,
                            sevaDescription: data.item.Description,
                            sevaDescriptionEn: data.item.DescriptionEn || data.item.Description,
                            amount: data.invoice.GrandTotal || data.invoice.TotalAmount,
                            paymentMode: data.invoice.PaymentMode || data.invoice.Payment_Mode,
                            paymentModeEn: data.invoice.PaymentMode || data.invoice.Payment_Mode
                        });
                    }
                }}
            />
            </div>
        </div>
    );
}
