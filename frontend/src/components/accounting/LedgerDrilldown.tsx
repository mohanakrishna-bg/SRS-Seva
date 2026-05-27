import React, { useState, useEffect } from 'react';
import { accountingApi } from '../../api';
import { X, Calendar, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface LedgerLine {
    Id: number;
    Date: string;
    Narration: string | null;
    SourceModule: string | null;
    SourceRefId: string | null;
    Debit: number;
    Credit: number;
    Balance: number;
}

interface LedgerDrilldownProps {
    accountId: string | number;
    accountName: string;
    onClose: () => void;
}

export const LedgerDrilldown: React.FC<LedgerDrilldownProps> = ({ accountId, accountName, onClose }) => {
    const [lines, setLines] = useState<LedgerLine[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLedger = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await accountingApi.getLedgerDrilldown(accountId);
                setLines(res.data);
            } catch (err: any) {
                console.error(err);
                setError("Failed to load sub-ledger statements.");
            } finally {
                setLoading(false);
            }
        };
        fetchLedger();
    }, [accountId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-4xl border border-white/10 rounded-2xl bg-[#2c1810] dark:bg-[#121212] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                    <div>
                        <h3 className="font-heading text-xl font-bold text-white tracking-tight">
                            ಖಾತೆ ಉಪ-ಲೆಡ್ಜರ್ ಹೇಳಿಕೆ (Sub-ledger Statement)
                        </h3>
                        <p className="text-sm text-[#FF9933] font-semibold mt-1">
                            {accountName} (Chronological Transactions)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-16 text-center text-white/50">
                            Loading chronological statement...
                        </div>
                    ) : lines.length === 0 ? (
                        <div className="py-20 text-center text-white/30">
                            No ledger entries posted for this account head.
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/5">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-white/50 text-xs uppercase tracking-wider font-semibold">
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Ref/Module</th>
                                        <th className="py-3 px-4">Narration</th>
                                        <th className="py-3 px-4 text-right">Debit (+)</th>
                                        <th className="py-3 px-4 text-right">Credit (-)</th>
                                        <th className="py-3 px-4 text-right">Running Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs">
                                    {lines.map(line => {
                                        const isDebit = line.Debit > 0;
                                        return (
                                            <tr key={line.Id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3 px-4 text-white/70 font-semibold tabular-nums">
                                                    {line.Date}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-white/80 font-bold">{line.SourceModule || 'Manual'}</div>
                                                    <div className="text-white/40 text-[10px] font-mono mt-0.5">{line.SourceRefId || '-'}</div>
                                                </td>
                                                <td className="py-3 px-4 text-white/70 max-w-xs truncate" title={line.Narration || ''}>
                                                    {line.Narration || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-[#00E676] tabular-nums">
                                                    {line.Debit > 0 ? `₹${line.Debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-[#FF5252] tabular-nums">
                                                    {line.Credit > 0 ? `₹${line.Credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-white/90 tabular-nums">
                                                    ₹{line.Balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Summary */}
                <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="btn-primary py-2 px-6"
                    >
                        Close Statement
                    </button>
                </div>
            </div>
        </div>
    );
};
