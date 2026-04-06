import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Building2, BarChart3 } from 'lucide-react';
import CollectionDashboard from '../components/accounting/CollectionDashboard';
import JournalTable from '../components/accounting/JournalTable';
import BankRemittanceForm from '../components/accounting/BankRemittanceForm';
import ReportViewer from '../components/accounting/ReportViewer';
import { testApi } from '../api';

type TabType = 'dashboard' | 'journal' | 'bank' | 'reports';

interface AccountingPageProps {
    onHome?: () => void;
}

const AccountingPage: React.FC<AccountingPageProps> = ({ onHome }) => {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [loading, setLoading] = useState(false);

    const handleSimulate = async () => {
        setLoading(true);
        try {
            await testApi.simulate();
            window.location.reload();
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCleanup = async () => {
        if (!window.confirm("Delete all test data? (Migrated data will be preserved)")) return;
        setLoading(true);
        try {
            await testApi.cleanup();
            window.location.reload();
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard': return <CollectionDashboard />;
            case 'journal': return <JournalTable />;
            case 'bank': return <BankRemittanceForm />;
            case 'reports': return <ReportViewer />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border border-dashed border-primary/50 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Accounting</h1>
                    <p className="text-secondary-foreground/60">Manage temple finances, view collections and generate reports.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <button onClick={handleSimulate} disabled={loading} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium rounded hover:bg-secondary/80 disabled:opacity-50">
                            {loading ? 'Working...' : 'Simulate Test Data'}
                        </button>
                        <button onClick={handleCleanup} disabled={loading} className="px-3 py-1.5 bg-destructive text-destructive-foreground text-sm font-medium rounded hover:bg-destructive/90 disabled:opacity-50">
                            {loading ? 'Working...' : 'Cleanup UI Data'}
                        </button>
                    </div>
                    {onHome && (
                        <button 
                            onClick={onHome}
                            className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-sm ml-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                            Back to Home
                        </button>
                    )}
                </div>
            </div>

            <div className="border-b bg-card rounded-t-lg px-4 flex flex-wrap gap-4 overflow-x-auto">
                <button 
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="whitespace-nowrap">Dashboard</span>
                </button>
                <button 
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${activeTab === 'journal' ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('journal')}
                >
                    <BookOpen className="w-4 h-4" />
                    <span className="whitespace-nowrap">Journal</span>
                </button>
                <button 
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${activeTab === 'bank' ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('bank')}
                >
                    <Building2 className="w-4 h-4" />
                    <span className="whitespace-nowrap">Bank & Cash</span>
                </button>
                <button 
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${activeTab === 'reports' ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('reports')}
                >
                    <BarChart3 className="w-4 h-4" />
                    <span className="whitespace-nowrap">Reports</span>
                </button>
            </div>

            <div className="min-h-[500px]">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default AccountingPage;
