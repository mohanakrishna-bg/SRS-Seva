import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, HeartHandshake, Sparkles, Settings } from 'lucide-react';
import CustomersPage from './CustomersPage';
import SevasPage from './SevasPage';
import SpecialEventsPage from './SpecialEventsPage';
import SettingsPage from './SettingsPage';

const tabs = [
    { id: 'customers', label: 'ಭಕ್ತರು', icon: Users },
    { id: 'sevas', label: 'ಸೇವೆಗಳು', icon: HeartHandshake },
    { id: 'events', label: 'ವಿಶೇಷ ಘಟನೆಗಳು', icon: Sparkles },
    { id: 'settings', label: 'ಸೆಟ್ಟಿಂಗ್ಸ್', icon: Settings },
];

export default function ManagePage() {
    const location = useLocation();

    return (
        <div className="space-y-6">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.id}
                        to={`/manage/${tab.id}`}
                        className={({ isActive }) => `flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                            isActive
                                ? 'bg-[var(--primary)] text-white shadow-lg shadow-orange-500/20'
                                : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)]'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </NavLink>
                ))}
            </div>

            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                <Routes>
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="sevas" element={<SevasPage />} />
                    <Route path="events" element={<SpecialEventsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="" element={<Navigate to="customers" replace />} />
                </Routes>
            </motion.div>
        </div>
    );
}
