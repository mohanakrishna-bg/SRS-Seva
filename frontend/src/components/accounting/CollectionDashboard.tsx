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
            <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                <div className="flex items-center gap-2 text-white/60">
                    <CalendarDays size={16} />
                    <span className="text-sm font-medium">Viewing date</span>
                </div>
                <input
                    type="date"
                    value={dateInput}
                    onChange={handleDateChange}
                    className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm [color-scheme:dark] focus:outline-none focus:border-[#FF9933]/60"
                />
            </div>

            {/* Payment mode breakdown pills */}
            <div className="flex gap-3 flex-wrap">
                {['Cash', 'UPI', 'Cheque'].map(mode => {
                    const info = breakdown[mode] || { total: 0, count: 0 };
                    return (
                        <div
                            key={mode}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm"
                        >
                            <span className="text-white/40">{modeIcon(mode)}</span>
                            <span className="text-white/50">{mode}:</span>
                            <span className="text-white font-semibold tabular-nums">
                                ₹{info.total.toFixed(2)}
                            </span>
                            <span className="text-white/30 text-xs">({info.count})</span>
                        </div>
                    );
                })}
            </div>

            {/* Daily Ledger Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="sticky top-0 bg-slate-900/80 backdrop-blur-sm">
                                <th className="px-4 py-3 text-left text-white/50 text-xs uppercase tracking-wider font-medium">Seva</th>
                                <th className="px-4 py-3 text-left text-white/50 text-xs uppercase tracking-wider font-medium">Mode</th>
                                <th className="px-4 py-3 text-right text-white/50 text-xs uppercase tracking-wider font-medium">Count</th>
                                <th className="px-4 py-3 text-right text-white/50 text-xs uppercase tracking-wider font-medium">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-white/30 text-sm">
                                        Loading…
                                    </td>
                                </tr>
                            )}
                            {!loading && (!summary?.items || summary.items.length === 0) && (
                                <tr>
                                    <td colSpan={4}>
                                        <p className="text-center text-white/30 py-16">No transactions today</p>
                                    </td>
                                </tr>
                            )}
                            {!loading && summary?.items?.map((item, i) => (
                                <tr
                                    key={i}
                                    className="hover:bg-white/5 transition-colors border-b border-white/5"
                                >
                                    <td className="px-4 py-3 text-white/80 font-medium">
                                        {item.SevaCode || 'General'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-1.5 text-white/60">
                                            {modeIcon(item.PaymentMode)}
                                            {item.PaymentMode}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-white/50 tabular-nums">
                                        {item.Count}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#00E676]">
                                        ₹{item.TotalAmount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {!loading && grandTotal > 0 && (
                            <tfoot>
                                <tr className="bg-[#FF9933]/10 border-t border-[#FF9933]/30">
                                    <td colSpan={3} className="px-4 py-3 text-[#FF9933] font-bold text-sm">
                                        Total Collection
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold tabular-nums text-[#FF9933] text-base">
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
