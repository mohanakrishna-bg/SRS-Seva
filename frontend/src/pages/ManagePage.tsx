import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, HeartHandshake } from 'lucide-react';
import Header from '../components/Header';
import CustomersPage from './CustomersPage';
import SevasPage from './SevasPage';

interface ManagePageProps {
    onBack: () => void;
    onIssueReceipt: (customer: any) => void;
}

const tabs = [
    { id: 'Customers', label: 'ಭಕ್ತರು', icon: Users },
    { id: 'Sevas', label: 'ಸೇವೆಗಳು', icon: HeartHandshake },
];

export default function ManagePage({ onBack, onIssueReceipt }: ManagePageProps) {
    const [activeTab, setActiveTab] = useState('Customers');

    return (
        <div className="space-y-4">
            <Header compact onBack={onBack} />

            {/* Tab bar */}
            <div className="flex gap-2 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
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
                    <CustomersPage onIssueReceipt={onIssueReceipt} />
                )}
                {activeTab === 'Sevas' && <SevasPage />}
            </motion.div>
        </div>
    );
}
