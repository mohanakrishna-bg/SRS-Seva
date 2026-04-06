import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, HeartHandshake, Sparkles, Settings, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import CustomersPage from './CustomersPage';
import SevasPage from './SevasPage';
import SpecialEventsPage from './SpecialEventsPage';
import SettingsPage from './SettingsPage';

interface ManagePageProps {
    onHome?: () => void;
}

const tabs = [
    { id: 'Customers', label: 'ಭಕ್ತರು', icon: Users },
    { id: 'Sevas', label: 'ಸೇವೆಗಳು', icon: HeartHandshake },
    { id: 'Events', label: 'ವಿಶೇಷ ಘಟನೆಗಳು', icon: Sparkles },
    { id: 'Settings', label: 'ಸೆಟ್ಟಿಂಗ್ಸ್', icon: Settings },
];

export default function ManagePage({ onHome }: ManagePageProps) {
    const [activeTab, setActiveTab] = useState('Customers');

    return (
        <div className="space-y-6">
            <Header 
                onHome={onHome} 
                rightContent={
                    <button 
                        onClick={onHome}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-sm"
                    >
                        <ArrowLeft size={18} /> Back to Home
                    </button>
                } 
            />

            {/* Tab bar */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-[var(--primary)] text-white shadow-lg shadow-orange-500/20'
                            : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)]'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'Customers' && (
                    <CustomersPage />
                )}
                {activeTab === 'Sevas' && <SevasPage />}
                {activeTab === 'Events' && <SpecialEventsPage />}
                {activeTab === 'Settings' && <SettingsPage />}
            </motion.div>
        </div>
    );
}
