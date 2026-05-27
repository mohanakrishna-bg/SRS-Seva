import React, { useState, useEffect } from 'react';
import { accountingApi } from '../../api';
import { Check, X, AlertTriangle, RefreshCw, Landmark } from 'lucide-react';

interface BankTransaction {
    Id: number;
    BankAccountId: number;
    TransactionDate: str;
    Type: string;
    Mode: string;
    Amount: number;
    Reference: string | null;
    Narration: string | null;
    IsReconciled: boolean;
    Status: string;
}

export const ReconciliationBoard: React.FC = () => {
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const [txnRes, bankRes] = await Promise.all([
                accountingApi.getBankTransactions(selectedBankId ? { bank_id: selectedBankId } : undefined),
                accountingApi.getBankAccounts()
            ]);
            setTransactions(txnRes.data);
            setBankAccounts(bankRes.data);
            if (!selectedBankId && bankRes.data.length > 0) {
                setSelectedBankId(bankRes.data[0].Id);
            }
        } catch (err: any) {
            console.error(err);
            setError("Failed to retrieve bank transactions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [selectedBankId]);

    const handleReconcile = async (id: number, status: 'Reconciled' | 'Bounced') => {
        try {
            await accountingApi.reconcileTransaction(id, status);
            fetchTransactions();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to update reconciliation status.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Warning Alert Bar */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#ff8c00]">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">
                    Note: Uncleared funds (Pending Verification) are excluded from active bank balances until manually marked as Reconciled.
                </span>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                    <Landmark className="w-6 h-6 text-[#FF9933]" />
                    <h3 className="font-heading text-lg font-bold text-white">ಬ್ಯಾಂಕ್ ಹೊಂದಾಣಿಕೆ ಮಂಡಳಿ (Bank Reconciliation Board)</h3>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedBankId}
                        onChange={(e) => setSelectedBankId(e.target.value ? Number(e.target.value) : '')}
                        className="form-input text-white text-sm"
                    >
                        <option value="">All Accounts</option>
                        {bankAccounts.map(acc => (
                            <option key={acc.Id} value={acc.Id}>
                                {acc.BankName} - {acc.AccountName} (₹{acc.CurrentBalance.toLocaleString()})
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={fetchTransactions}
                        title="Refresh"
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Transactions Grid */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-white/50 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-4 px-6">Date</th>
                            <th className="py-4 px-6">Description</th>
                            <th className="py-4 px-6">Reference</th>
                            <th className="py-4 px-6 text-right">Amount</th>
                            <th className="py-4 px-6 text-center">Status</th>
                            <th className="py-4 px-6 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {loading && transactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-white/40">
                                    Loading bank transactions...
                                </td>
                            </tr>
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-16 text-center text-white/30">
                                    No bank transactions recorded.
                                </td>
                            </tr>
                        ) : (
                            transactions.map(txn => {
                                const isPending = txn.Status === 'Pending';
                                const isReconciled = txn.Status === 'Reconciled';
                                const isBounced = txn.Status === 'Bounced';
                                
                                return (
                                    <tr key={txn.Id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6 font-medium text-white/70 tabular-nums">
                                            {txn.TransactionDate}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-white font-semibold">{txn.Narration || `${txn.Type} Transfer`}</div>
                                            <div className="text-xs text-white/40 mt-0.5">{txn.Type} ({txn.Mode})</div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-white/50">
                                            {txn.Reference || '-'}
                                        </td>
                                        <td className={`py-4 px-6 text-right font-bold tabular-nums ${
                                            txn.Type in ['Deposit', 'Online'] ? 'text-[#00E676]' : 'text-[#FF5252]'
                                        }`}>
                                            {txn.Type in ['Deposit', 'Online'] ? '+' : '-'}₹{txn.Amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {isPending && (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold border border-[#ff8c00]/30 text-[#ff8c00] bg-[#ff8c00]/5">
                                                    Pending Verification
                                                </span>
                                            )}
                                            {isReconciled && (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white border border-emerald-500">
                                                    Reconciled
                                                </span>
                                            )}
                                            {isBounced && (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white border border-red-500">
                                                    Bounced / Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {isPending ? (
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleReconcile(txn.Id, 'Reconciled')}
                                                        title="Mark as Reconciled"
                                                        className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReconcile(txn.Id, 'Bounced')}
                                                        title="Mark as Bounced / Failed"
                                                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-white/20 text-xs">Locked</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
