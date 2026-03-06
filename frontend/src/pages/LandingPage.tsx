import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Settings, Moon, Sun, Camera, Mic } from 'lucide-react';
import CalendarWidget from '../components/CalendarWidget';
import ClockWidget from '../components/ClockWidget';
import EeDinaCard from '../components/EeDinaCard';
import Header from '../components/Header';
import MediaCaptureModal from '../components/MediaCaptureModal';
import AdminLoginModal from '../components/AdminLoginModal';
import EventModal from '../components/EventModal';
import RegistrationModal from '../components/RegistrationModal';
import SpecialEventsCard from '../components/SpecialEventsCard';
import { uploadApi } from '../api';
import { useToast } from '../components/Toast';

interface LandingPageProps {
    onNavigate: (tab: string) => void;
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

export default function LandingPage({ onNavigate }: LandingPageProps) {
    const bgImage = getBgImage();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('seva_theme') as 'light' | 'dark') || 'light';
    });
    const [mediaModal, setMediaModal] = useState<{ isOpen: boolean; type: 'photo' | 'audio' }>({ isOpen: false, type: 'photo' });
    const [adminModalOpen, setAdminModalOpen] = useState(false);
    const [eventModalOpen, setEventModalOpen] = useState(false);
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
            await uploadApi.image(file);
            showToast('success', `${file.name} saved to server`);
        } catch {
            showToast('error', 'ಫೈಲ್ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ (Failed to save)');
        }
        setMediaModal({ ...mediaModal, isOpen: false });
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setEventModalOpen(true);
    };

    const handleAdminSuccess = () => {
        setAdminModalOpen(false);
        onNavigate('Settings');
    };

    return (
        <div className="relative min-h-full">
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
                            opacity: 0.08,
                        }}
                    />
                    <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-[var(--bg-dark)]/40 via-transparent to-[var(--bg-dark)]/60" />
                </>
            )}

            <div className="relative z-10 space-y-6">
                <Header compact={false} />

                {/* Icon-only floating toolbar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex justify-center"
                >
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-lg backdrop-blur-md">
                        <button
                            onClick={toggleTheme}
                            className="p-3 rounded-xl hover:bg-white/50 dark:hover:bg-black/20 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all relative group"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">ಥೀಮ್ (Theme)</span>
                        </button>

                        <div className="w-px h-6 bg-[var(--glass-border)]" />

                        <button
                            onClick={() => setMediaModal({ isOpen: true, type: 'photo' })}
                            className="p-3 rounded-xl hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all relative group"
                        >
                            <Camera size={20} />
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">ಕ್ಯಾಪ್ಚರ್ (Photo)</span>
                        </button>

                        <button
                            onClick={() => setMediaModal({ isOpen: true, type: 'audio' })}
                            className="p-3 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all relative group"
                        >
                            <Mic size={20} />
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">ಆಡಿಯೋ (Audio)</span>
                        </button>

                        <button
                            onClick={() => onNavigate('Manage')}
                            className="p-3 rounded-xl hover:bg-[var(--primary)]/10 text-[var(--primary)] transition-all relative group"
                        >
                            <ClipboardList size={20} />
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">ನಿರ್ವಹಣೆ (Manage)</span>
                        </button>

                        <button
                            onClick={() => setRegModalOpen(true)}
                            className="p-3 rounded-xl hover:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold transition-all relative group flex items-center gap-2 px-4 shadow-sm border border-transparent hover:border-orange-500/30"
                        >
                            <ClipboardList size={20} />
                            <span className="hidden sm:inline">ಸೇವಾ ಬುಕಿಂಗ್</span>
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">ನೋಂದಾಯಿಸಿ (Register Seva)</span>
                        </button>

                        <div className="w-px h-6 bg-[var(--glass-border)]" />

                        <button
                            onClick={() => setAdminModalOpen(true)}
                            className="p-3 rounded-xl hover:bg-white/50 dark:hover:bg-black/20 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all relative group"
                        >
                            <Settings size={20} />
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">ಸೆಟ್ಟಿಂಗ್ಸ್ (Settings)</span>
                        </button>
                    </div>
                </motion.div>

                {/* Bottom row */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
                >
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <ClockWidget />
                        <CalendarWidget selectedDate={selectedDate} onChange={handleDateSelect} />
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <EeDinaCard date={selectedDate || new Date()} />
                        <SpecialEventsCard
                            date={selectedDate || new Date()}
                            onRegisterSpecialEvent={() => {
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
                    setSelectedDate(new Date()); // Reset to today when modal closes
                }}
            />

            <RegistrationModal
                isOpen={regModalOpen}
                onClose={() => setRegModalOpen(false)}
                prefillDate={selectedDate}
                onSuccess={(data) => {
                    setRegModalOpen(false);
                    console.log('Registration Success:', data);
                    // Navigate to manage or show receipt...
                }}
            />
        </div>
    );
}
