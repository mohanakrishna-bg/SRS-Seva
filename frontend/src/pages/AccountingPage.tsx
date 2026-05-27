import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { 
    LayoutDashboard, BookOpen, Building2, BarChart3, CheckCircle2, 
    AlertCircle, X, TrendingUp, TrendingDown, Wallet, PiggyBank, 
    Lock, Landmark, ClipboardList 
} from 'lucide-react';
import CollectionDashboard from '../components/accounting/CollectionDashboard';
import JournalTable from '../components/accounting/JournalTable';
import BankRemittanceForm from '../components/accounting/BankRemittanceForm';
import ReportViewer from '../components/accounting/ReportViewer';
import { PaymentVoucherForm } from '../components/accounting/PaymentVoucherForm';
import { ReconciliationBoard } from '../components/accounting/ReconciliationBoard';
import { LedgerDrilldown } from '../components/accounting/LedgerDrilldown';
import { reportsApi, accountingApi, testApi, statsApi } from '../api';
import { useToast } from '../components/Toast';

interface DailySummary {
    total_income: number;
    total_expense: number;
    payment_breakdown: Record<string, any>;
}

const SummaryCard = ({
    label,
    value,
    icon,
    color,
    subtitle,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
}) => (
    <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 flex flex-col gap-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] text-sm font-medium">{label}</span>
            <span style={{ color }} className="opacity-70">{icon}</span>
        </div>
        <div className="font-heading text-3xl font-bold tabular-nums" style={{ color }}>
            {value}
        </div>
        {subtitle && <p className="text-[var(--text-secondary)]/70 text-xs">{subtitle}</p>}
    </div>
);

const AccountingPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<DailySummary | null>(null);
    const [selectedDrilldown, setSelectedDrilldown] = useState<{ id: string | number; name: string } | null>(null);

    
    // Close Day Dialog State
    const [showCloseDialog, setShowCloseDialog] = useState(false);
    const [lockDate, setLockDate] = useState(new Date().toISOString().split('T')[0]);

    const [actionState, setActionState] = useState<{
        stage: 'none' | 'confirm' | 'status';
        type?: 'success' | 'error';
        message?: string;
    }>({ stage: 'none' });

    const toast = useToast();

    const fetchSummary = () => {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = String(now.getFullYear()).slice(-2);
        const ddmmyy = `${d}${m}${y}`;

        statsApi.dailySummary(ddmmyy)
            .then(res => setSummary(res.data))
            .catch(() => {
                reportsApi.getCollectionSummary(ddmmyy, ddmmyy)
                    .then(res => {
                        const total = res.data?.total || 0;
                        setSummary({ total_income: total, total_expense: 0, payment_breakdown: {} });
                    })
                    .catch(console.error);
            });
    };

    useEffect(() => {
        fetchSummary();

        // Sub-ledger Drilldown custom event listener
        const handleDrilldown = (e: any) => {
            if (e.detail && e.detail.id) {
                setSelectedDrilldown({ id: e.detail.id, name: e.detail.name });
            }
        };
        window.addEventListener('open-ledger-drilldown', handleDrilldown);
        return () => window.removeEventListener('open-ledger-drilldown', handleDrilldown);
    }, []);

    const handleSimulate = async () => {
        setLoading(true);
        try {
            await testApi.simulate();
            setActionState({
                stage: 'status',
                type: 'success',
                message: 'Simulation complete! Test data has been generated across all temple modules.',
            });
        } catch (e) {
            setActionState({
                stage: 'status',
                type: 'error',
                message: 'Simulation failed. Database might be busy or Master data missing.',
            });
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const triggerCleanup = () => {
        setActionState({
            stage: 'confirm',
            message:
                'Are you sure you want to delete all test data? This will purge all simulated Seva registrations and audit logs marked as test. Migrated data will remain safe.',
        });
    };

    const handleCleanup = async () => {
        setLoading(true);
        setActionState({ stage: 'none' });
        try {
            await testApi.cleanup();
            setActionState({
                stage: 'status',
                type: 'success',
                message: 'Cleanup complete! All transient test records have been purged.',
            });
        } catch (e) {
            setActionState({
                stage: 'status',
                type: 'error',
                message: 'Cleanup failed. Some records might be locked or in use.',
            });
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDay = async () => {
        if (!lockDate) return;
        setLoading(true);
        try {
            await accountingApi.closeDay(lockDate);
            toast.show("Day closed and daily ledger locked successfully.", "success");
            setShowCloseDialog(false);
            fetchSummary();
        } catch (err: any) {
            console.error(err);
            toast.show(err.response?.data?.detail || "Failed to lockbooks for selected date.", "error");
        } finally {
            setLoading(false);
        }
    };

    const income = summary?.total_income ?? 0;
    const expense = summary?.total_expense ?? 0;
    const closing = income - expense;

    const ActionModal = () => {
        if (actionState.stage === 'none') return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-sm bg-[#2c1810] dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-[var(--glass-border)] transform transition-all scale-100">
                    <div
                        className={`p-6 text-center ${
                            actionState.stage === 'confirm'
                                ? 'bg-amber-500/10'
                                : actionState.type === 'success'
                                ? 'bg-emerald-500/10'
                                : 'bg-red-500/10'
                        }`}
                    >
                        <div
                            className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 text-white shadow-lg ${
                                actionState.stage === 'confirm'
                                    ? 'bg-amber-500'
                                    : actionState.type === 'success'
                                    ? 'bg-emerald-500'
                                    : 'bg-red-500'
                            }`}
                        >
                            {actionState.stage === 'confirm' ? (
                                <AlertCircle size={32} />
                            ) : actionState.type === 'success' ? (
                                <CheckCircle2 size={32} />
                            ) : (
                                <X size={32} />
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {actionState.stage === 'confirm'
                                ? 'Confirmation'
                                : actionState.type === 'success'
                                ? 'Success!'
                                : 'Oops!'}
                        </h3>
                        <p className="text-sm text-white/70 leading-relaxed">
                            {actionState.message}
                        </p>
                    </div>
                    <div className="p-4 bg-white/5 flex flex-col gap-2">
                        {actionState.stage === 'confirm' ? (
                            <>
                                <button
                                    onClick={handleCleanup}
                                    className="w-full py-3 rounded-xl font-bold text-white bg-[#FF5252] hover:bg-red-600 transition-all shadow-lg active:scale-95 border-none cursor-pointer"
                                >
                                    Yes, Purge Test Data
                                </button>
                                <button
                                    onClick={() => setActionState({ stage: 'none' })}
                                    className="w-full py-3 rounded-xl font-medium text-white/50 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => window.location.reload()}
                                className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 border-none cursor-pointer ${
                                    actionState.type === 'success'
                                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                        : 'bg-slate-700 hover:bg-slate-800 shadow-slate-500/20'
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

            {/* Sub-ledger drilldown popover */}
            {selectedDrilldown && (
                <LedgerDrilldown
                    accountId={selectedDrilldown.id}
                    accountName={selectedDrilldown.name}
                    onClose={() => setSelectedDrilldown(null)}
                />
            )}

            {/* Close Day Dialog */}
            {showCloseDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-sm border border-white/10 rounded-2xl bg-[#2c1810] dark:bg-slate-900 shadow-2xl p-6">
                        <h3 className="font-heading text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-[#FF9933]" />
                            ಪುಸ್ತಕಗಳನ್ನು ಮುಚ್ಚಿ (Close Daily Books)
                        </h3>
                        <p className="text-xs text-white/50 mb-4 leading-relaxed">
                            Select a date to close daily books. Once locked, counter staff can no longer book sevas or log expenses for that date.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-white/70 mb-1.5">Close Date</label>
                                <input
                                    type="date"
                                    value={lockDate}
                                    onChange={(e) => setLockDate(e.target.value)}
                                    className="form-input text-white w-full"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleCloseDay}
                                    disabled={loading}
                                    className="btn-primary flex-1 py-2 text-sm"
                                >
                                    {loading ? 'Locking...' : 'Lock books'}
                                </button>
                                <button
                                    onClick={() => setShowCloseDialog(false)}
                                    className="px-4 py-2 bg-white/5 border border-white/10 text-white/70 rounded-xl hover:bg-white/10 hover:text-white transition-all text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-[var(--glass-card-bg)] border border-[var(--glass-border)] rounded-2xl p-8 no-print">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                            ಹಣಕಾಸು ನಿರ್ವಹಣೆ
                        </h1>
                        <p className="text-[var(--text-secondary)]/80 mt-1 text-sm">
                            Financial Management · Receipt Generation · Daily Ledger
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCloseDialog(true)}
                            className="px-3 py-1.5 bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] hover:bg-[#FF9933] hover:text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Lock className="w-4 h-4" />
                            Close Books
                        </button>
                        <button
                            onClick={handleSimulate}
                            disabled={loading}
                            className="px-3 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm font-medium rounded-lg hover:bg-[var(--primary)] hover:text-white disabled:opacity-50 transition-all cursor-pointer"
                        >
                            {loading ? 'Working...' : 'Simulate'}
                        </button>
                        <button
                            onClick={triggerCleanup}
                            disabled={loading}
                            className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium rounded-lg hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
                        >
                            {loading ? 'Working...' : 'Cleanup'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Daily Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
                <SummaryCard
                    label="Opening Balance"
                    value="₹0.00"
                    icon={<PiggyBank size={20} />}
                    color="#D4AF37"
                    subtitle="Start of day"
                />
                <SummaryCard
                    label="Today's Income"
                    value={`₹${income.toFixed(2)}`}
                    icon={<TrendingUp size={20} />}
                    color="#00E676"
                    subtitle="Seva collections"
                />
                <SummaryCard
                    label="Today's Expenses"
                    value={`₹${expense.toFixed(2)}`}
                    icon={<TrendingDown size={20} />}
                    color="#FF5252"
                    subtitle="Vouchers logged"
                />
                <SummaryCard
                    label="Closing Balance"
                    value={`₹${closing.toFixed(2)}`}
                    icon={<Wallet size={20} />}
                    color="#FF9933"
                    subtitle="Income − Expenses"
                />
            </div>

            {/* Pill-style Tab Nav */}
            <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-1 flex gap-1 overflow-x-auto no-print">
                {[
                    { to: '/accounting/dashboard', icon: <LayoutDashboard size={15} />, label: 'Dashboard' },
                    { to: '/accounting/journal', icon: <BookOpen size={15} />, label: 'Journal' },
                    { to: '/accounting/vouchers', icon: <ClipboardList size={15} />, label: 'Payment Vouchers' },
                    { to: '/accounting/bank', icon: <Building2 size={15} />, label: 'Bank & Cash' },
                    { to: '/accounting/reconcile', icon: <Landmark size={15} />, label: 'Reconciliation' },
                    { to: '/accounting/reports', icon: <BarChart3 size={15} />, label: 'Reports' },
                ].map(tab => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        className={({ isActive }) =>
                            `flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                isActive
                                    ? 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 font-semibold'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
                            }`
                        }
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </NavLink>
                ))}
            </div>

            {/* Route Content */}
            <div className="min-h-[500px]">
                <Routes>
                    <Route path="dashboard" element={<CollectionDashboard />} />
                    <Route path="journal" element={<JournalTable />} />
                    <Route path="vouchers" element={<PaymentVoucherForm />} />
                    <Route path="bank" element={<BankRemittanceForm />} />
                    <Route path="reconcile" element={<ReconciliationBoard />} />
                    <Route path="reports" element={<ReportViewer />} />
                    <Route path="" element={<Navigate to="dashboard" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default AccountingPage;
