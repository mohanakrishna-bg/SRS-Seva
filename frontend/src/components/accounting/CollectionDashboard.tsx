import React, { useEffect, useState } from 'react';
import { reportsApi, accountingApi } from '../../api';
import { CalendarDays, Banknote, QrCode, CheckSquare } from 'lucide-react';

interface CollectionItem {
    Date: string;
    PaymentMode: string;
    SevaCode: string;
    TotalAmount: number;
    Count: number;
}

interface CollectionSummary {
    items: CollectionItem[];
    total: number;
}

function todayDdmmyy() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    return `${d}${m}${y}`;
}

function toInputDate(ddmmyy: string): string {
    if (ddmmyy.length !== 6) return '';
    const day = ddmmyy.slice(0, 2);
    const mon = ddmmyy.slice(2, 4);
    const yr = '20' + ddmmyy.slice(4, 6);
    return `${yr}-${mon}-${day}`;
}

function fromInputDate(iso: string): string {
    if (!iso) return todayDdmmyy();
    const [yr, mon, day] = iso.split('-');
    return `${day}${mon}${yr.slice(-2)}`;
}

const modeIcon = (mode: string) => {
    if (mode === 'UPI') return <QrCode size={14} />;
    if (mode === 'Cheque' || mode === 'DD') return <CheckSquare size={14} />;
    return <Banknote size={14} />;
};

const CollectionDashboard: React.FC = () => {
    const [summary, setSummary] = useState<CollectionSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [dateInput, setDateInput] = useState(toInputDate(todayDdmmyy()));

    const fetchData = (ddmmyy: string) => {
        setLoading(true);
        reportsApi.getCollectionSummary(ddmmyy, ddmmyy)
            .then(res => setSummary(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData(todayDdmmyy());
    }, []);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setDateInput(val);
        if (val) fetchData(fromInputDate(val));
    };

    // Payment mode breakdown
    const breakdown: Record<string, { total: number; count: number }> = {};
    (summary?.items || []).forEach(item => {
        const mode = item.PaymentMode || 'Cash';
        if (!breakdown[mode]) breakdown[mode] = { total: 0, count: 0 };
        breakdown[mode].total += item.TotalAmount;
        breakdown[mode].count += item.Count;
    });

    const grandTotal = summary?.total ?? 0;

    return (
        <div className="space-y-6">
            {/* Date filter header */}
            <div className="flex items-center justify-between gap-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-5 py-4">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <CalendarDays size={16} />
                    <span className="text-sm font-medium">Viewing date</span>
                </div>
                <input
                    type="date"
                    value={dateInput}
                    onChange={handleDateChange}
                    className="bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] dark:[color-scheme:dark] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                />
            </div>

            {/* Payment mode breakdown pills */}
            <div className="flex gap-3 flex-wrap">
                {['Cash', 'UPI', 'Cheque'].map(mode => {
                    const info = breakdown[mode] || { total: 0, count: 0 };
                    return (
                        <div
                            key={mode}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm"
                        >
                            <span className="text-[var(--text-secondary)]/60">{modeIcon(mode)}</span>
                            <span className="text-[var(--text-secondary)]">{mode}:</span>
                            <span className="text-[var(--text-primary)] font-semibold tabular-nums">
                                ₹{info.total.toFixed(2)}
                            </span>
                            <span className="text-[var(--text-secondary)]/60 text-xs">({info.count})</span>
                        </div>
                    );
                })}
            </div>

            {/* Daily Ledger Table */}
            <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="sticky top-0 bg-[var(--glass-card-bg)] border-b border-[var(--glass-border)] backdrop-blur-sm">
                                <th className="px-4 py-3 text-left text-[var(--text-secondary)] text-xs uppercase tracking-wider font-medium">Seva</th>
                                <th className="px-4 py-3 text-left text-[var(--text-secondary)] text-xs uppercase tracking-wider font-medium">Mode</th>
                                <th className="px-4 py-3 text-right text-[var(--text-secondary)] text-xs uppercase tracking-wider font-medium">Count</th>
                                <th className="px-4 py-3 text-right text-[var(--text-secondary)] text-xs uppercase tracking-wider font-medium">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-[var(--text-secondary)]/50 text-sm">
                                        Loading…
                                    </td>
                                </tr>
                            )}
                            {!loading && (!summary?.items || summary.items.length === 0) && (
                                <tr>
                                    <td colSpan={4}>
                                        <p className="text-center text-[var(--text-secondary)]/50 py-16">No transactions today</p>
                                    </td>
                                </tr>
                            )}
                            {!loading && summary?.items?.map((item, i) => (
                                <tr
                                    key={i}
                                    className="hover:bg-[var(--glass-bg)] transition-colors border-b border-[var(--glass-border)]/50"
                                >
                                    <td className="px-4 py-3 text-[var(--text-primary)] font-medium">
                                        {item.SevaCode || 'General'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                                            {modeIcon(item.PaymentMode)}
                                            {item.PaymentMode}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-[var(--text-secondary)] tabular-nums">
                                        {item.Count}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                        ₹{item.TotalAmount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {!loading && grandTotal > 0 && (
                            <tfoot>
                                <tr className="bg-[var(--primary)]/10 border-t border-[var(--primary)]/30">
                                    <td colSpan={3} className="px-4 py-3 text-[var(--primary)] font-bold text-sm">
                                        Total Collection
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold tabular-nums text-[var(--primary)] text-base">
                                        ₹{grandTotal.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CollectionDashboard;
