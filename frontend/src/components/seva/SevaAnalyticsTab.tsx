import { useState, useEffect, useMemo } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    Calendar, 
    Users, 
    UtensilsCrossed, 
    CreditCard, 
    CheckCircle2, 
    RefreshCw, 
    Award
} from 'lucide-react';
import { registrationApi } from '../../api';
import { useToast } from '../Toast';

export type TimeRange = 'today' | 'week' | 'month' | '30days' | '90days';

export default function SevaAnalyticsTab() {
    const [timeRange, setTimeRange] = useState<TimeRange>('30days');
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    // Fetch wide set of registrations for analytics
    const fetchAnalyticsData = async () => {
        setIsLoading(true);
        try {
            // Fetch up to 1000 latest registrations
            const res = await registrationApi.list(0, 1000);
            setRegistrations(res.data || []);
        } catch (error) {
            console.error('Failed to load analytics data:', error);
            showToast('error', 'ವಿಶ್ಲೇಷಣಾ ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    // Filter registrations by selected time horizon
    const filteredRegistrations = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return registrations.filter(r => {
            if (r.IsCancelled) return false;
            // Parse SevaDate or RegistrationDate (DDMMYY)
            const dateStr = r.SevaDate || r.RegistrationDate;
            if (!dateStr || dateStr.length !== 6) return true;
            const dd = parseInt(dateStr.substring(0, 2), 10);
            const mm = parseInt(dateStr.substring(2, 4), 10) - 1;
            const yy = 2000 + parseInt(dateStr.substring(4, 6), 10);
            const regDate = new Date(yy, mm, dd);

            if (timeRange === 'today') {
                return regDate.getTime() >= startOfToday.getTime();
            } else if (timeRange === 'week') {
                const weekAgo = new Date(startOfToday);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return regDate >= weekAgo;
            } else if (timeRange === 'month') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return regDate >= startOfMonth;
            } else if (timeRange === '30days') {
                const thirtyAgo = new Date(startOfToday);
                thirtyAgo.setDate(thirtyAgo.getDate() - 30);
                return regDate >= thirtyAgo;
            } else if (timeRange === '90days') {
                const ninetyAgo = new Date(startOfToday);
                ninetyAgo.setDate(ninetyAgo.getDate() - 90);
                return regDate >= ninetyAgo;
            }
            return true;
        });
    }, [registrations, timeRange]);

    // Aggregate KPIs
    const metrics = useMemo(() => {
        let totalRevenue = 0;
        let totalHastodakaMeals = 0;
        let fulfilledCount = 0;
        const sevaCounts = new Map<string, { desc: string; count: number; revenue: number }>();
        const paymentModeCounts = new Map<string, number>();
        const devoteeIds = new Set<number>();
        const dateRevenueMap = new Map<string, { date: string; amount: number; count: number }>();

        filteredRegistrations.forEach(r => {
            const grandTotal = r.GrandTotal || r.Amount || 0;
            totalRevenue += grandTotal;
            totalHastodakaMeals += (r.PrasadaCount || 0);
            if (r.IsFulfilled) fulfilledCount++;

            // Seva aggregation
            const sevaCode = r.SevaCode || 'OTHER';
            const desc = r.seva?.Description || r.SevaCode || 'ಇತರೆ ಸೇವೆ';
            const currentSeva = sevaCounts.get(sevaCode) || { desc, count: 0, revenue: 0 };
            currentSeva.count += (r.Qty || 1);
            currentSeva.revenue += grandTotal;
            sevaCounts.set(sevaCode, currentSeva);

            // Payment modes
            const mode = r.PaymentMode || 'Cash';
            paymentModeCounts.set(mode, (paymentModeCounts.get(mode) || 0) + grandTotal);

            // Devotee unique
            if (r.DevoteeId) devoteeIds.add(r.DevoteeId);

            // Timeline aggregation (group by ISO date)
            const dateStr = r.SevaDate;
            if (dateStr && dateStr.length === 6) {
                const isoDate = `20${dateStr.substring(4, 6)}-${dateStr.substring(2, 4)}-${dateStr.substring(0, 2)}`;
                const currDate = dateRevenueMap.get(isoDate) || { date: isoDate, amount: 0, count: 0 };
                currDate.amount += grandTotal;
                currDate.count += 1;
                dateRevenueMap.set(isoDate, currDate);
            }
        });

        // Top 5 Sevas
        const topSevas = Array.from(sevaCounts.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Payment Breakdown
        const paymentModes = Array.from(paymentModeCounts.entries()).map(([mode, amount]) => ({
            mode,
            amount,
            percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0
        })).sort((a, b) => b.amount - a.amount);

        // Daily Trend sorted chronologically
        const dailyTrend = Array.from(dateRevenueMap.values())
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-14); // Last 14 active days

        const totalOrders = filteredRegistrations.length;
        const fulfillmentRate = totalOrders > 0 ? Math.round((fulfilledCount / totalOrders) * 100) : 0;

        return {
            totalOrders,
            totalRevenue,
            totalHastodakaMeals,
            fulfilledCount,
            fulfillmentRate,
            uniqueDevotees: devoteeIds.size,
            topSevas,
            paymentModes,
            dailyTrend
        };
    }, [filteredRegistrations]);

    const maxTrendRevenue = Math.max(...metrics.dailyTrend.map(d => d.amount), 1);

    return (
        <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto bg-[var(--bg-dark)] space-y-6">
            {/* ── Top Header & Horizon Selector ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[var(--glass-border)]">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <BarChart3 className="text-[var(--primary)]" size={24} />
                        <span>ಸೇವಾ ವಿಶ್ಲೇಷಣೆ & ಒಳನೋಟಗಳು</span>
                    </h1>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        ಭಕ್ತರ ಸೇವಾ ಭಾಗವಹಿಸುವಿಕೆ, ಆದಾಯ ಪ್ರವೃತ್ತಿ ಹಾಗೂ ಹಸ್ತೋದಕ ವಿತರಣೆಯ ನೈಜ-ಸಮಯದ ಅಂಕಿಅಂಶಗಳು
                    </p>
                </div>

                {/* Horizon Switcher */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center p-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl shadow-sm text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setTimeRange('today')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                timeRange === 'today' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            ಇಂದು
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeRange('week')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                timeRange === 'week' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            ಈ ವಾರ
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeRange('month')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                timeRange === 'month' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            ಈ ತಿಂಗಳು
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeRange('30days')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                timeRange === '30days' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            ಕಳೆದ 30 ದಿನಗಳು
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeRange('90days')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                timeRange === '90days' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            90 ದಿನಗಳು
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={fetchAnalyticsData}
                        disabled={isLoading}
                        className="p-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                        title="ಮಾಹಿತಿ ನವೀಕರಿಸಿ"
                    >
                        <RefreshCw size={15} className={isLoading ? 'animate-spin text-[var(--primary)]' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Top Executive KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Bookings */}
                <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                        <span className="font-bold">ಒಟ್ಟು ನೋಂದಣಿಗಳು</span>
                        <Calendar size={16} className="text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                        {metrics.totalOrders.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                        <Users size={12} />
                        <span>{metrics.uniqueDevotees} ಅನನ್ಯ ಭಕ್ತರು</span>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="p-4 bg-gradient-to-br from-amber-500/10 via-[var(--glass-bg)] to-transparent border border-amber-500/20 rounded-2xl shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                        <span className="font-bold">ಒಟ್ಟು ಸೇವಾ ಆದಾಯ</span>
                        <TrendingUp size={16} />
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                        ₹{metrics.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">
                        ಸರಾಸರಿ: ₹{metrics.totalOrders > 0 ? Math.round(metrics.totalRevenue / metrics.totalOrders) : 0} / ಬುಕಿಂಗ್
                    </div>
                </div>

                {/* Total Hastodaka Meals */}
                <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                        <span className="font-bold">ಹಸ್ತೋದಕ ಊಟಗಳು</span>
                        <UtensilsCrossed size={16} />
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                        {metrics.totalHastodakaMeals.toLocaleString()} <span className="text-sm font-normal text-[var(--text-secondary)]">ಜನರು</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                        ಅನ್ನಪ್ರಸಾದ ತಯಾರಿಕೆಯ ಬೇಡಿಕೆ
                    </div>
                </div>

                {/* Fulfilled % */}
                <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400">
                        <span className="font-bold">ಪೂರೈಕೆ ಪ್ರಮಾಣ (Fulfillment)</span>
                        <CheckCircle2 size={16} />
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                        {metrics.fulfillmentRate}%
                    </div>
                    <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                            className="bg-purple-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${metrics.fulfillmentRate}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Middle Section: Daily Trend Timeline ── */}
            <div className="p-5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-[var(--text-primary)]">ದೈನಂದಿನ ಬುಕಿಂಗ್ ಮತ್ತು ಆದಾಯ ಪ್ರವೃತ್ತಿ</h2>
                        <p className="text-xs text-[var(--text-secondary)]">ಕಳೆದ ದಿನಗಳಲ್ಲಿ ಸಂಗ್ರಹವಾದ ಸೇವಾ ಮೊತ್ತದ ವಿಶ್ಲೇಷಣೆ</p>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">
                        ಗರಿಷ್ಠ ದಿನ: ₹{maxTrendRevenue.toLocaleString()}
                    </span>
                </div>

                {metrics.dailyTrend.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
                        ಆಯ್ದ ಅವಧಿಯಲ್ಲಿ ಟ್ರೆಂಡ್ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ
                    </div>
                ) : (
                    <div className="space-y-2 pt-2">
                        {/* Bar Chart Grid */}
                        <div className="h-44 flex items-end gap-2 md:gap-3 px-2 border-b border-[var(--glass-border)] pb-2">
                            {metrics.dailyTrend.map((day) => {
                                const heightPct = Math.max(8, Math.round((day.amount / maxTrendRevenue) * 100));
                                return (
                                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                            {day.date}: ₹{day.amount.toLocaleString()} ({day.count} ಸೇವೆಗಳು)
                                        </div>

                                        <div
                                            className="w-full bg-gradient-to-t from-[var(--primary)] to-amber-400 rounded-t-md transition-all duration-300 group-hover:brightness-110 min-w-[12px]"
                                            style={{ height: `${heightPct}%` }}
                                        />
                                        <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate w-full text-center">
                                            {day.date.substring(5)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bottom Section: Top Sevas & Payment Breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Top 5 Sevas */}
                <div className="p-5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <Award className="text-amber-500" size={18} />
                        <h2 className="text-base font-bold text-[var(--text-primary)]">ಅತ್ಯಧಿಕ ಆದಾಯ ತಂದ ಜನಪ್ರಿಯ ಸೇವೆಗಳು</h2>
                    </div>

                    <div className="space-y-3">
                        {metrics.topSevas.map((seva, idx) => {
                            const pct = metrics.totalRevenue > 0 ? Math.round((seva.revenue / metrics.totalRevenue) * 100) : 0;
                            return (
                                <div key={seva.desc} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-2 truncate">
                                            <span className="w-4 text-[var(--text-secondary)] text-[10px]">#{idx + 1}</span>
                                            <span className="truncate">{seva.desc}</span>
                                        </span>
                                        <span className="font-mono font-bold text-[var(--text-primary)] shrink-0 ml-2">
                                            ₹{seva.revenue.toLocaleString()} ({seva.count} ಬಾರಿ)
                                        </span>
                                    </div>
                                    <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-[var(--primary)] to-amber-500 h-full rounded-full"
                                            style={{ width: `${Math.max(5, pct)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Payment Modes */}
                <div className="p-5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <CreditCard className="text-blue-500" size={18} />
                        <h2 className="text-base font-bold text-[var(--text-primary)]">ಪಾವತಿ ವಿಧಾನಗಳ ವಿತರಣೆ (Payment Modes)</h2>
                    </div>

                    <div className="space-y-3">
                        {metrics.paymentModes.map((pm) => (
                            <div key={pm.mode} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-[var(--text-primary)]">
                                        {pm.mode}
                                    </span>
                                    <span className="font-mono text-[var(--text-secondary)]">
                                        ₹{pm.amount.toLocaleString()} ({pm.percentage}%)
                                    </span>
                                </div>
                                <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${
                                            pm.mode === 'UPI' ? 'bg-indigo-500' :
                                            pm.mode === 'Cash' ? 'bg-emerald-500' :
                                            pm.mode === 'Cheque' ? 'bg-amber-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${Math.max(5, pm.percentage)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
