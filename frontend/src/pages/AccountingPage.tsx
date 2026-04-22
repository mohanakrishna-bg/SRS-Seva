import React, { useState } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Building2, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import CollectionDashboard from '../components/accounting/CollectionDashboard';
import JournalTable from '../components/accounting/JournalTable';
import BankRemittanceForm from '../components/accounting/BankRemittanceForm';
import ReportViewer from '../components/accounting/ReportViewer';
import { reportsApi, accountingApi, testApi } from '../api';
import { useToast } from '../components/Toast';

const AccountingPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [actionState, setActionState] = useState<{ 
        stage: 'none' | 'confirm' | 'status', 
        type?: 'success' | 'error',
        message?: string 
    }>({ stage: 'none' });

    const handleSimulate = async () => {
        setLoading(true);
        try {
            await testApi.simulate();
            setActionState({ 
                stage: 'status', 
                type: 'success', 
                message: 'Simulation complete! Test data has been generated across all temple modules.' 
            });
        } catch(e) { 
            setActionState({ 
                stage: 'status', 
                type: 'error', 
                message: 'Simulation failed. Database might be busy or Master data missing.' 
            });
            console.error(e); 
        }
        finally { setLoading(false); }
    };

    const triggerCleanup = () => {
        setActionState({ 
            stage: 'confirm', 
            message: 'Are you sure you want to delete all test data? This will purge all simulated Seva registrations and audit logs marked as test. Migrated data will remain safe.' 
        });
    };

    const handleCleanup = async () => {
        setLoading(true);
        setActionState({ stage: 'none' }); // Close confirm modal
        try {
            await testApi.cleanup();
            setActionState({ 
                stage: 'status', 
                type: 'success', 
                message: 'Cleanup complete! All transient test records have been purged.' 
            });
        } catch(e) { 
            setActionState({ 
                stage: 'status', 
                type: 'error', 
                message: 'Cleanup failed. Some records might be locked or in use.' 
            });
            console.error(e); 
        }
        finally { setLoading(false); }
    };

    const ActionModal = () => {
        if (actionState.stage === 'none') return null;
        
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-[var(--glass-border)] transform transition-all scale-100">
                    <div className={`p-6 text-center ${actionState.stage === 'confirm' ? 'bg-amber-500/10' : (actionState.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10')}`}>
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 text-white shadow-lg ${
                            actionState.stage === 'confirm' ? 'bg-amber-500' : (actionState.type === 'success' ? 'bg-emerald-500' : 'bg-red-500')
                        }`}>
                            {actionState.stage === 'confirm' ? <AlertCircle size={32} /> : (actionState.type === 'success' ? <CheckCircle2 size={32} /> : <X size={32} />)}
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                            {actionState.stage === 'confirm' ? 'Confirmation' : (actionState.type === 'success' ? 'Success!' : 'Oops!')}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            {actionState.message}
                        </p>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-2">
                        {actionState.stage === 'confirm' ? (
                            <>
                                <button 
                                    onClick={handleCleanup}
                                    className="w-full py-3 rounded-xl font-bold text-white bg-destructive hover:bg-red-600 transition-all shadow-lg active:scale-95"
                                >
                                    Yes, Purge Test Data
                                </button>
                                <button 
                                    onClick={() => setActionState({ stage: 'none' })}
                                    className="w-full py-3 rounded-xl font-medium text-[var(--text-secondary)] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 transition-all"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => window.location.reload()}
                                className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 ${
                                    actionState.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-slate-700 hover:bg-slate-800 shadow-slate-500/20'
                                }`}
                            >
                                Refresh Dashboard
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="space-y-6">
            <ActionModal />
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
                        <button onClick={triggerCleanup} disabled={loading} className="px-3 py-1.5 bg-destructive text-destructive-foreground text-sm font-medium rounded hover:bg-destructive/90 disabled:opacity-50">
                            {loading ? 'Working...' : 'Cleanup UI Data'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-b bg-card rounded-t-lg px-4 flex flex-wrap gap-4 overflow-x-auto">
                <NavLink 
                    to="/accounting/dashboard"
                    className={({ isActive }) => `flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${isActive ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="whitespace-nowrap">Dashboard</span>
                </NavLink>
                <NavLink 
                    to="/accounting/journal"
                    className={({ isActive }) => `flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${isActive ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span className="whitespace-nowrap">Journal</span>
                </NavLink>
                <NavLink 
                    to="/accounting/bank"
                    className={({ isActive }) => `flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${isActive ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    <Building2 className="w-4 h-4" />
                    <span className="whitespace-nowrap">Bank & Cash</span>
                </NavLink>
                <NavLink 
                    to="/accounting/reports"
                    className={({ isActive }) => `flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${isActive ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    <BarChart3 className="w-4 h-4" />
                    <span className="whitespace-nowrap">Reports</span>
                </NavLink>
            </div>

            <div className="min-h-[500px]">
                <Routes>
                    <Route path="dashboard" element={<CollectionDashboard />} />
                    <Route path="journal" element={<JournalTable />} />
                    <Route path="bank" element={<BankRemittanceForm />} />
                    <Route path="reports" element={<ReportViewer />} />
                    <Route path="" element={<Navigate to="dashboard" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default AccountingPage;
