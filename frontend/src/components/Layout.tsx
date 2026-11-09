/**
 * Layout.tsx — Internal app shell (v0.2)
 *
 * Structure:
 *   Header         (brand hero: logo, temple name, address, contact)
 *   TopAppBar      (sticky module-switcher nav bar)
 *   ContextualTabBar (tabs for the active module, driven by navConfig)
 *   WorkspaceContainer (full-width content area, holds <Outlet />)
 *
 * Global modals (RegistrationModal, DonationModal, ReceiptGenerator) are
 * unchanged and still managed here — they are layout-independent overlays.
 */
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MediaCaptureModal from './MediaCaptureModal';
import RegistrationModal from './RegistrationModal';
import DonationModal from './DonationModal';
import ReceiptGenerator from './ReceiptGenerator';
import { useToast } from './Toast';
import Header from './Header';
import TopAppBar from './shell/TopAppBar';
import ContextualTabBar from './shell/ContextualTabBar';
import LeftNavBar from './shell/LeftNavBar';
import WorkspaceContainer from './shell/WorkspaceContainer';
import CommandPalette from './ui/CommandPalette';
import { getModuleForPath, NAV_CONFIG } from '../config/navConfig';
import type { NavLayoutMode } from '../config/navConfig';
import { useSettings } from '../context/SettingsContext';

export type LayoutContextType = {
    openRegModal: (eventName?: string, eventCode?: string) => void;
    openDonModal: () => void;
    openReceiptModal: (receiptData: any) => void;
    navLayoutMode?: NavLayoutMode;
};

export default function Layout() {
    const { settings } = useSettings();
    const bgImage = settings.bgImage;
    const location = useLocation();

    // ── Theme (default to light mode, activate dark only when explicitly selected) ──
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return localStorage.getItem('seva_theme') === 'dark' ? 'dark' : 'light';
    });

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

    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

    // ── Modal States ─────────────────────────────────────────────────────────
    const [mediaModal, setMediaModal] = useState<{ isOpen: boolean; type: 'photo' | 'audio' }>({
        isOpen: false,
        type: 'photo',
    });
    const [regModalOpen, setRegModalOpen] = useState(false);
    const [prefillSevaName, setPrefillSevaName] = useState<string | undefined>(undefined);
    const [prefillEventCode, setPrefillEventCode] = useState<string | undefined>(undefined);
    const [donModalOpen, setDonModalOpen] = useState(false);
    const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    const { showToast } = useToast();

    // ── Media Capture Save ───────────────────────────────────────────────────
    const handleMediaCapture = async (file: File) => {
        try {
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await (window as any).showSaveFilePicker({
                        suggestedName: file.name,
                        types: [
                            {
                                description: file.type.startsWith('image/') ? 'Image File' : 'Audio File',
                                accept: { [file.type]: [file.name.substring(file.name.lastIndexOf('.'))] },
                            },
                        ],
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

    // ── Keyboard Shortcut: Cmd+K ─────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ── Derive active module + tabs ──────────────────────────────────────────
    const activeModule = getModuleForPath(location.pathname);
    const hasTabs = (activeModule?.tabs?.length ?? 0) > 0;

    // ── Navigation Layout Preference per Module (Top menu bar vs Left navigation bar) ──
    const [navLayouts, setNavLayouts] = useState<Record<string, NavLayoutMode>>(() => {
        try {
            const saved = localStorage.getItem('seva_subnav_layout_prefs');
            if (saved) return JSON.parse(saved);
        } catch {
            // ignore JSON error
        }
        return {};
    });

    const toggleModuleNavLayout = (moduleId: string) => {
        setNavLayouts(prev => {
            const current =
                prev[moduleId] ||
                NAV_CONFIG.find(m => m.id === moduleId)?.defaultNavLayout ||
                'top';
            const nextMode: NavLayoutMode = current === 'top' ? 'left' : 'top';
            const updated = { ...prev, [moduleId]: nextMode };
            try {
                localStorage.setItem('seva_subnav_layout_prefs', JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to save layout preference:', e);
            }
            return updated;
        });
    };

    const activeModuleLayout: NavLayoutMode =
        (activeModule ? navLayouts[activeModule.id] : undefined) ||
        activeModule?.defaultNavLayout ||
        'top';
    const isLeftNavActive = Boolean(hasTabs && activeModule && activeModuleLayout === 'left');

    // ── Layout Context (passed via Outlet to child routes) ───────────────────
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
        },
        navLayoutMode: activeModuleLayout,
    };

    // Build primary action button if defined
    let primaryActionButton: React.ReactNode = null;
    if (activeModule?.primaryAction) {
        const action = activeModule.primaryAction;
        const handler = layoutContext[action.contextKey] as (...args: any[]) => void;
        primaryActionButton = (
            <button
                onClick={() => handler()}
                className="px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-[var(--primary)]/20 flex items-center gap-1.5"
            >
                {action.label}
            </button>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-dark)] relative">
            {/* Background image */}
            {bgImage && (
                <>
                    <div
                        className="fixed inset-0 z-0 pointer-events-none print:hidden"
                        style={{
                            backgroundImage: `url(${bgImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            opacity: 0.15,
                        }}
                    />
                    <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-[var(--bg-dark)]/50 via-transparent to-[var(--bg-dark)]/70 print:hidden" />
                </>
            )}

            {/* ── Brand Hero: logo, temple name, address, contact ── */}
            <div className="relative z-20 px-4 md:px-8 pt-5 pb-3 print:hidden">
                <Header />
                {/* Utility controls sit top-right of the header area */}
                <TopAppBar
                    layoutContext={layoutContext}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                />
            </div>

            {/* ── Shell: ContextualTabBar (top tab bar; on mobile, always shown if module has tabs) ── */}
            {hasTabs && activeModule && (
                <div className={activeModuleLayout === 'left' ? 'md:hidden' : 'block'}>
                    <ContextualTabBar
                        tabs={activeModule.tabs}
                        basePath={activeModule.path}
                        actionButton={primaryActionButton}
                        onToggleLayout={() => toggleModuleNavLayout(activeModule.id)}
                    />
                </div>
            )}

            {/* ── Content ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname.split('/').slice(0, 3).join('/')}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex-1 min-h-0 relative z-10 ${
                        isLeftNavActive
                            ? 'flex flex-col md:flex-row px-4 md:px-8 mt-2 pb-4 md:pb-6 gap-4 md:gap-5'
                            : 'flex flex-col'
                    }`}
                >
                    {isLeftNavActive && activeModule && (
                        <div className="hidden md:flex shrink-0">
                            <LeftNavBar
                                module={activeModule}
                                tabs={activeModule.tabs}
                                basePath={activeModule.path}
                                actionButton={primaryActionButton}
                                onToggleLayout={() => toggleModuleNavLayout(activeModule.id)}
                            />
                        </div>
                    )}
                    <WorkspaceContainer
                        noPadding={isLeftNavActive}
                        className={isLeftNavActive ? 'flex-1 min-w-0' : ''}
                    >
                        <Outlet context={layoutContext} />
                    </WorkspaceContainer>
                </motion.div>
            </AnimatePresence>

            {/* ── Global Overlays ── */}
            <CommandPalette
                isOpen={commandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
                layoutContext={layoutContext}
            />

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

                    const firstInvoice = data.invoices[0];
                    const sevas = data.invoices.map((inv: any) => ({
                        description: inv.seva?.Description || inv.SevaCode,
                        amount: inv.Amount || 0,
                    }));
                    const hastodakaAmount =
                        (firstInvoice.GrandTotal || 0) - (firstInvoice.Amount || 0);
                    const totalAmount =
                        data.invoices.reduce(
                            (sum: number, inv: any) => sum + (inv.Amount || 0),
                            0
                        ) + (hastodakaAmount > 0 ? hastodakaAmount : 0);

                    setReceiptData({
                        voucherNo:
                            firstInvoice.VoucherNo ||
                            firstInvoice.RegistrationId?.toString() ||
                            'VCH-XXX',
                        date:
                            firstInvoice.RegistrationDate ||
                            firstInvoice.Date ||
                            new Date().toISOString(),
                        sevaDate: firstInvoice.SevaDate,
                        customerName: data.customer.Name || 'Unknown',
                        gotra: data.customer.Gotra || data.customer.Sgotra || '',
                        nakshatra:
                            data.customer.Nakshatra || data.customer.SNakshatra || '',
                        sevas,
                        amount: totalAmount,
                        hastodakaAmount: hastodakaAmount > 0 ? hastodakaAmount : undefined,
                        familyMembers: firstInvoice.PrasadaCount || undefined,
                        parcelCount: firstInvoice.ParcelCount || undefined,
                        paymentMode:
                            firstInvoice.PaymentMode ||
                            firstInvoice.Payment_Mode ||
                            'Cash',
                        phone: data.customer.Phone || '',
                        whatsappPhone: data.customer.WhatsApp_Phone || '',
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
                        voucherNo:
                            data.donation.DonationReceiptNo ||
                            data.donation.Id?.toString() ||
                            'DON-XXX',
                        date: data.donation.DonationDate || new Date().toISOString(),
                        customerName: data.customer.Name,
                        customerNameEn: data.customer.NameEn,
                        gotra: data.customer.Sgotra,
                        gotraEn: data.customer.SgotraEn,
                        nakshatra: data.customer.SNakshatra,
                        nakshatraEn: data.customer.SNakshatraEn,
                        sevaDescription: data.donation.ItemName || 'ದಾನ',
                        amount: data.donation.EstimatedValue || 0,
                        paymentMode: data.donation.PaymentMode || 'Cash',
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
        </div>
    );
}
