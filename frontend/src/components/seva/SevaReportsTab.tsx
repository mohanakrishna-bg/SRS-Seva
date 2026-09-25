import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calendar, 
    Printer, 
    FileText, 
    PieChart, 
    Activity, 
    Search, 
    Flame, 
    UtensilsCrossed, 
    FileSpreadsheet, 
    BarChart3, 
    ChevronDown, 
    ChevronRight, 
    RefreshCw, 
    PanelLeftClose, 
    PanelLeft, 
    Filter, 
    AlertCircle 
} from 'lucide-react';
import api, { sevaReportsApi } from '../../api';
import { useToast } from '../Toast';

// ─── Scalable Report Registry Types ───
export type ReportCategory = 'daily' | 'on_demand' | 'financial';

export interface ReportDefinition {
    id: string;
    category: ReportCategory;
    titleKn: string;
    titleEn: string;
    subtitleKn: string;
    subtitleEn: string;
    audience: 'priest' | 'kitchen' | 'admin' | 'accounts';
    audienceLabelKn: string;
    audienceLabelEn: string;
    badgeColor: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    defaultDateMode: 'tomorrow' | 'today' | 'range';
    supportsDateRange: boolean;
    supportsDateType: boolean;
}

const CATEGORY_LABELS: Record<ReportCategory, { kn: string; en: string }> = {
    daily: { kn: 'ದೈನಂದಿನ ಕಾರ್ಯಚಟುವಟಿಕೆಗಳು', en: 'Daily Operations' },
    on_demand: { kn: 'ವಿವರವಾದ ಆನ್-ಡಿಮಾಂಡ್ ವರದಿಗಳು', en: 'On-Demand Reports' },
    financial: { kn: 'ಹಣಕಾಸು ಸಾರಾಂಶ', en: 'Financial Summary' }
};

export const REPORTS_REGISTRY: ReportDefinition[] = [
    {
        id: 'daily_priest',
        category: 'daily',
        titleKn: 'ಮಾರನೆಯ ದಿನದ ಸೇವಾ ಸಂಕಲ್ಪ ಪಟ್ಟಿ',
        titleEn: 'Priest Pooja Sankalpa List (Tomorrow)',
        subtitleKn: 'ಮಾರನೆಯ ದಿನದ ಪೂಜಾ ಸಂಕಲ್ಪಕ್ಕೆ ಸೇವೆವಾರು ಭಕ್ತರ ಹೆಸರು, ಗೋತ್ರ, ನಕ್ಷತ್ರ ಮತ್ತು ಸೇವಾ ಸಂಖ್ಯೆ',
        subtitleEn: 'Devotee Name, Gothra, Nakshatra grouped by Seva for Sankalpa',
        audience: 'priest',
        audienceLabelKn: 'ಅರ್ಚಕರು',
        audienceLabelEn: 'Priests',
        badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: Flame,
        defaultDateMode: 'tomorrow',
        supportsDateRange: false,
        supportsDateType: false
    },
    {
        id: 'daily_kitchen',
        category: 'daily',
        titleKn: 'ಮಾರನೆಯ ದಿನದ ಹಸ್ತೋದಕ ಲೆಕ್ಕ',
        titleEn: 'Kitchen Hastodaka Count (Tomorrow)',
        subtitleKn: 'ಮಾರನೆಯ ದಿನ ತಯಾರಿಸಬೇಕಾದ ಹಸ್ತೋದಕ ಎಲೆಗಳ ಪೂರ್ಣ ಲೆಕ್ಕ (ಉಚಿತ ಹಸ್ತೋದಕ + ಹೆಚ್ಚುವರಿ)',
        subtitleEn: 'Included free + additional hastodaka plate count for kitchen preparation',
        audience: 'kitchen',
        audienceLabelKn: 'ಪಾಕಶಾಲೆ',
        audienceLabelEn: 'Kitchen',
        badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: UtensilsCrossed,
        defaultDateMode: 'tomorrow',
        supportsDateRange: false,
        supportsDateType: false
    },
    {
        id: 'on_demand_full',
        category: 'on_demand',
        titleKn: 'ದಿನಾಂಕವಾರು ಸೇವಾ ಬುಕಿಂಗ್ ಪೂರ್ಣ ವಿವರ',
        titleEn: 'Seva Bookings Grouped by Date & Seva',
        subtitleKn: 'ಆಯ್ದ ಅವಧಿಯ ದಿನ ಮತ್ತು ಸೇವೆವಾರು ಭಕ್ತರು, ಮೊಬೈಲ್, ಗೋತ್ರ, ನಕ್ಷತ್ರ, ಹೆಚ್ಚುವರಿ ಹಸ್ತೋದಕ ವಿವರ',
        subtitleEn: 'Complete bookings with Phone, Gothra, Nakshatra & extra hastodaka',
        audience: 'admin',
        audienceLabelKn: 'ಆಡಳಿತ & ಕಚೇರಿ',
        audienceLabelEn: 'Administration',
        badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        icon: FileSpreadsheet,
        defaultDateMode: 'range',
        supportsDateRange: true,
        supportsDateType: true
    },
    {
        id: 'hastodaka_distribution',
        category: 'on_demand',
        titleKn: 'ಅವಧಿಯ ದಿನವಾರು ಹಸ್ತೋದಕ ವಿತರಣೆ',
        titleEn: 'Day-wise Hastodaka Distribution',
        subtitleKn: 'ನಿರ್ದಿಷ್ಟ ಅವಧಿಯಲ್ಲಿ ಪ್ರತಿ ದಿನದ ಸೇವೆವಾರು ಹಸ್ತೋದಕ ಸಿದ್ಧತೆ ಮತ್ತು ವಿತರಣೆಯ ಲೆಕ್ಕ',
        subtitleEn: 'Day-by-day plate preparation breakdown across date range',
        audience: 'kitchen',
        audienceLabelKn: 'ಪಾಕಶಾಲೆ & ಲೆಕ್ಕಪತ್ರ',
        audienceLabelEn: 'Kitchen & Audit',
        badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
        icon: BarChart3,
        defaultDateMode: 'range',
        supportsDateRange: true,
        supportsDateType: false
    },
    {
        id: 'financial_summary',
        category: 'financial',
        titleKn: 'ದೈನಂದಿನ ಹಣಕಾಸು ಮತ್ತು ಪಾವತಿ ವಿವರ',
        titleEn: 'Daily Financial & Payment Summary',
        subtitleKn: 'ದಿನದ ಒಟ್ಟು ನಗದು/ಬ್ಯಾಂಕ್/ಯುಪಿಐ ಸಂಗ್ರಹ, ಆದಾಯ ಹಾಗೂ ವೆಚ್ಚದ ಸಾರಾಂಶ',
        subtitleEn: 'Cash/UPI/Bank breakdown, total income and day expenses',
        audience: 'accounts',
        audienceLabelKn: 'ಲೆಕ್ಕಪತ್ರ',
        audienceLabelEn: 'Accounts',
        badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
        icon: PieChart,
        defaultDateMode: 'today',
        supportsDateRange: false,
        supportsDateType: false
    }
];

// ─── Helpers ───
const getTomorrowIso = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

const getTodayIso = () => new Date().toISOString().split('T')[0];

const getYesterdayIso = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
};

const getThisWeekStartIso = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    return d.toISOString().split('T')[0];
};

const getThisMonthStartIso = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};

const formatIsoToDisplay = (iso: string) => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export default function SevaReportsTab() {
    const { showToast } = useToast();

    // Active report selection
    const [activeReportId, setActiveReportId] = useState<string>('daily_priest');
    const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

    // Dates and filters
    const [startDate, setStartDate] = useState<string>(getTomorrowIso());
    const [endDate, setEndDate] = useState<string>(getTomorrowIso());
    const [dateType, setDateType] = useState<'SevaDate' | 'RegistrationDate'>('SevaDate');
    const [tableFilter, setTableFilter] = useState<string>('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // Data and state
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [reportData, setReportData] = useState<any>(null);

    const activeReport = useMemo(() => {
        return REPORTS_REGISTRY.find(r => r.id === activeReportId) || REPORTS_REGISTRY[0];
    }, [activeReportId]);

    // Handle switching report
    const handleSelectReport = (report: ReportDefinition) => {
        setActiveReportId(report.id);
        setTableFilter('');
        setExpandedGroups({});

        if (report.defaultDateMode === 'tomorrow') {
            const tomorrow = getTomorrowIso();
            setStartDate(tomorrow);
            setEndDate(tomorrow);
        } else if (report.defaultDateMode === 'today') {
            const today = getTodayIso();
            setStartDate(today);
            setEndDate(today);
        } else if (report.defaultDateMode === 'range') {
            const today = getTodayIso();
            const tomorrow = getTomorrowIso();
            setStartDate(today);
            setEndDate(tomorrow);
        }
    };

    // Fetch report data
    const fetchReport = async () => {
        setIsLoading(true);
        try {
            if (activeReport.id === 'daily_priest') {
                const res = await sevaReportsApi.getSevaBookings({
                    start_date: startDate,
                    end_date: startDate,
                    report_type: 'daily_priest',
                    date_type: 'SevaDate'
                });
                setReportData(res.data);
            } else if (activeReport.id === 'daily_kitchen') {
                const res = await sevaReportsApi.getHastodaka({
                    start_date: startDate,
                    end_date: startDate
                });
                setReportData(res.data);
            } else if (activeReport.id === 'on_demand_full') {
                const res = await sevaReportsApi.getSevaBookings({
                    start_date: startDate,
                    end_date: endDate || startDate,
                    report_type: 'on_demand_full',
                    date_type: dateType
                });
                setReportData(res.data);
            } else if (activeReport.id === 'hastodaka_distribution') {
                const res = await sevaReportsApi.getHastodaka({
                    start_date: startDate,
                    end_date: endDate || startDate
                });
                setReportData(res.data);
            } else if (activeReport.id === 'financial_summary') {
                // Convert start_date YYYY-MM-DD to DDMMYY
                const parts = startDate.split('-');
                const ddmmyy = parts.length === 3 ? `${parts[2]}${parts[1]}${parts[0].slice(-2)}` : '';
                const res = await api.get(`/stats/daily-summary?date=${ddmmyy}`);
                setReportData(res.data);
            }
        } catch (err: any) {
            console.error('Error fetching report:', err);
            showToast('error', 'ವರದಿಯನ್ನು ಪಡೆಯಲು ವಿಫಲವಾಗಿದೆ (Failed to fetch report)');
            setReportData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [activeReportId, startDate, endDate, dateType]);

    // Accordion expand/collapse
    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [key]: prev[key] === undefined ? false : !prev[key]
        }));
    };

    const isGroupExpanded = (key: string) => {
        return expandedGroups[key] !== false; // default expanded
    };

    const handleExpandAll = (expand: boolean) => {
        if (!reportData) return;
        const newMap: Record<string, boolean> = {};
        if (reportData.days) {
            reportData.days.forEach((day: any, dIdx: number) => {
                newMap[`day_${dIdx}`] = expand;
                if (day.sevas) {
                    day.sevas.forEach((_s: any, sIdx: number) => {
                        newMap[`day_${dIdx}_seva_${sIdx}`] = expand;
                    });
                }
            });
        }
        setExpandedGroups(newMap);
    };

    // Filter reports in registry for the sidebar
    const filteredRegistry = useMemo(() => {
        if (!reportSearchQuery.trim()) return REPORTS_REGISTRY;
        const q = reportSearchQuery.toLowerCase();
        return REPORTS_REGISTRY.filter(r => 
            r.titleKn.toLowerCase().includes(q) ||
            r.titleEn.toLowerCase().includes(q) ||
            r.subtitleKn.toLowerCase().includes(q) ||
            r.audienceLabelKn.toLowerCase().includes(q) ||
            r.audienceLabelEn.toLowerCase().includes(q)
        );
    }, [reportSearchQuery]);

    // Group filtered registry by category
    const groupedRegistry = useMemo(() => {
        const groups: Record<ReportCategory, ReportDefinition[]> = {
            daily: [],
            on_demand: [],
            financial: []
        };
        filteredRegistry.forEach(r => {
            if (groups[r.category]) {
                groups[r.category].push(r);
            }
        });
        return groups;
    }, [filteredRegistry]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 bg-[var(--bg-dark)] rounded-2xl overflow-hidden relative">
            
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* SCALABLE REPORT CATALOG / NAVIGATION (SIDEBAR)              */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <aside 
                className={`print:hidden flex flex-col transition-all duration-300 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md rounded-2xl p-4 shrink-0 ${
                    sidebarCollapsed ? 'w-full md:w-16 items-center' : 'w-full md:w-80'
                }`}
            >
                {/* Sidebar Header & Toggle */}
                <div className="flex items-center justify-between w-full mb-3 pb-3 border-b border-[var(--glass-border)]">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                            <FileSpreadsheet size={18} className="text-[var(--primary)]" />
                            <span className="text-base tracking-tight">ವರದಿಗಳ ಪಟ್ಟಿ (Reports)</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title={sidebarCollapsed ? 'ಪಟ್ಟಿಯನ್ನು ವಿಸ್ತರಿಸಿ (Expand Reports)' : 'ಪಟ್ಟಿಯನ್ನು ಮರೆಮಾಡಿ (Collapse)'}
                    >
                        {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                {/* Search in Reports Catalog */}
                {!sidebarCollapsed && (
                    <div className="relative mb-3 w-full">
                        <Search size={15} className="absolute left-3 top-2.5 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            value={reportSearchQuery}
                            onChange={(e) => setReportSearchQuery(e.target.value)}
                            placeholder="ವರದಿ ಹುಡುಕಿ / Search reports..."
                            className="w-full pl-9 pr-3 py-2 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                        />
                    </div>
                )}

                {/* Categorized Report Navigation List */}
                <div className="flex-1 overflow-y-auto space-y-4 w-full pr-1">
                    {(['daily', 'on_demand', 'financial'] as ReportCategory[]).map(category => {
                        const items = groupedRegistry[category];
                        if (items.length === 0) return null;

                        return (
                            <div key={category} className="space-y-1">
                                {!sidebarCollapsed && (
                                    <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]/80 flex items-center justify-between">
                                        <span>{CATEGORY_LABELS[category].kn}</span>
                                        <span className="text-[10px] font-normal">{CATEGORY_LABELS[category].en}</span>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    {items.map(report => {
                                        const Icon = report.icon;
                                        const isSelected = activeReportId === report.id;

                                        return (
                                            <button
                                                key={report.id}
                                                onClick={() => handleSelectReport(report)}
                                                title={sidebarCollapsed ? `${report.titleKn} (${report.titleEn})` : undefined}
                                                className={`w-full text-left rounded-xl transition-all flex items-start gap-2.5 ${
                                                    sidebarCollapsed 
                                                        ? 'p-2.5 justify-center' 
                                                        : 'p-2.5'
                                                } ${
                                                    isSelected 
                                                        ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20 font-bold' 
                                                        : 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                                                }`}
                                            >
                                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                                    isSelected 
                                                        ? 'bg-white/20 text-white' 
                                                        : 'bg-black/5 dark:bg-white/5 text-[var(--primary)]'
                                                }`}>
                                                    <Icon size={16} />
                                                </div>

                                                {!sidebarCollapsed && (
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <div className={`text-xs truncate ${isSelected ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                                                                {report.titleKn}
                                                            </div>
                                                        </div>
                                                        <div className={`text-[11px] truncate ${isSelected ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                                                            {report.titleEn}
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-1.5">
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${
                                                                isSelected 
                                                                    ? 'bg-white/20 text-white border-white/30' 
                                                                    : report.badgeColor
                                                            }`}>
                                                                {report.audienceLabelKn}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {filteredRegistry.length === 0 && !sidebarCollapsed && (
                        <div className="text-center py-6 text-xs text-[var(--text-secondary)]">
                            ಯಾವುದೇ ವರದಿ ಕಂಡುಬಂದಿಲ್ಲ (No reports found)
                        </div>
                    )}
                </div>
            </aside>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* MAIN REPORT VIEWER & PRINT CONTAINER                        */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <main className="flex-1 flex flex-col bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-4 md:p-6 overflow-hidden min-w-0">
                
                {/* Action & Filter Toolbar */}
                <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-[var(--glass-border)] print:hidden">
                    
                    {/* Top Row: Report Title, Audience Badge, and Print Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
                                {React.createElement(activeReport.icon, { size: 20 })}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                                        {activeReport.titleKn}
                                    </h2>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${activeReport.badgeColor}`}>
                                        {activeReport.audienceLabelKn} ({activeReport.audienceLabelEn})
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    {activeReport.titleEn} — {activeReport.subtitleKn}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchReport}
                                disabled={isLoading}
                                className="p-2 border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                title="ವರದಿ ಮರುಲೋಡ್ ಮಾಡಿ (Refresh)"
                            >
                                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            </button>

                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[var(--primary)]/20"
                            >
                                <Printer size={16} /> ಮುದ್ರಿಸಿ (Print)
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: Dynamic Date Controls & In-Table Search */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        
                        {/* Date Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            
                            {/* Quick Shortcuts */}
                            {activeReport.supportsDateRange ? (
                                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-[var(--glass-border)]">
                                    <button
                                        onClick={() => {
                                            const today = getTodayIso();
                                            setStartDate(today);
                                            setEndDate(today);
                                        }}
                                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                                            startDate === getTodayIso() && endDate === getTodayIso()
                                                ? 'bg-[var(--primary)] text-white shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        ಇಂದು (Today)
                                    </button>
                                    <button
                                        onClick={() => {
                                            const tomorrow = getTomorrowIso();
                                            setStartDate(tomorrow);
                                            setEndDate(tomorrow);
                                        }}
                                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                                            startDate === getTomorrowIso() && endDate === getTomorrowIso()
                                                ? 'bg-[var(--primary)] text-white shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        ನಾಳೆ (Tomorrow)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStartDate(getThisWeekStartIso());
                                            setEndDate(getTomorrowIso());
                                        }}
                                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                                            startDate === getThisWeekStartIso()
                                                ? 'bg-[var(--primary)] text-white shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        ಈ ವಾರ (This Week)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStartDate(getThisMonthStartIso());
                                            setEndDate(getTomorrowIso());
                                        }}
                                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                                            startDate === getThisMonthStartIso()
                                                ? 'bg-[var(--primary)] text-white shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        ಈ ತಿಂಗಳು (This Month)
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-[var(--glass-border)]">
                                    <button
                                        onClick={() => {
                                            const tomorrow = getTomorrowIso();
                                            setStartDate(tomorrow);
                                            setEndDate(tomorrow);
                                        }}
                                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                                            startDate === getTomorrowIso()
                                                ? 'bg-[var(--primary)] text-white shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        ಮಾರನೆಯ ದಿನ (Tomorrow)
                                    </button>
                                    <button
                                        onClick={() => {
                                            const today = getTodayIso();
                                            setStartDate(today);
                                            setEndDate(today);
                                        }}
                                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                                            startDate === getTodayIso()
                                                ? 'bg-[var(--primary)] text-white shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        ಇಂದು (Today)
                                    </button>
                                    <button
                                        onClick={() => {
                                            const yesterday = getYesterdayIso();
                                            setStartDate(yesterday);
                                            setEndDate(yesterday);
                                        }}
                                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                                            startDate === getYesterdayIso()
                                                ? 'bg-[var(--primary)] text-white shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        ನಿನ್ನೆ (Yesterday)
                                    </button>
                                </div>
                            )}

                            {/* Date Pickers */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-xl text-xs">
                                    <Calendar size={14} className="text-[var(--primary)]" />
                                    <span className="text-[11px] text-[var(--text-secondary)]">
                                        {activeReport.supportsDateRange ? 'ಆರಂಭ (From):' : 'ದಿನಾಂಕ (Date):'}
                                    </span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            if (!activeReport.supportsDateRange) {
                                                setEndDate(e.target.value);
                                            }
                                        }}
                                        className="bg-transparent text-xs font-semibold focus:outline-none text-[var(--text-primary)] cursor-pointer"
                                    />
                                </div>

                                {activeReport.supportsDateRange && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-xl text-xs">
                                        <span className="text-[11px] text-[var(--text-secondary)]">ಅಂತ್ಯ (To):</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-transparent text-xs font-semibold focus:outline-none text-[var(--text-primary)] cursor-pointer"
                                        />
                                    </div>
                                )}

                                {/* Date Type Filter for Bookings */}
                                {activeReport.supportsDateType && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-xl text-xs">
                                        <span className="text-[11px] text-[var(--text-secondary)]">ಆಧಾರ:</span>
                                        <select
                                            value={dateType}
                                            onChange={(e) => setDateType(e.target.value as any)}
                                            className="bg-transparent text-xs font-semibold focus:outline-none text-[var(--text-primary)] cursor-pointer"
                                        >
                                            <option value="SevaDate" className="bg-[var(--bg-dark)] text-[var(--text-primary)]">
                                                ಸೇವಾ ದಿನಾಂಕ (Seva Date)
                                            </option>
                                            <option value="RegistrationDate" className="bg-[var(--bg-dark)] text-[var(--text-primary)]">
                                                ನೋಂದಣಿ ದಿನಾಂಕ (Registration Date)
                                            </option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search in Current Report & Accordion Controls */}
                        <div className="flex items-center gap-2">
                            {activeReport.id !== 'financial_summary' && (
                                <>
                                    <div className="relative">
                                        <Filter size={13} className="absolute left-2.5 top-2 text-[var(--text-secondary)]" />
                                        <input
                                            type="text"
                                            value={tableFilter}
                                            onChange={(e) => setTableFilter(e.target.value)}
                                            placeholder="ವರದಿಯಲ್ಲಿ ಹುಡುಕಿ (Filter table)..."
                                            className="pl-7 pr-3 py-1 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] w-48"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleExpandAll(true)}
                                        className="text-[11px] px-2 py-1 border border-[var(--glass-border)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        title="Expand all groups"
                                    >
                                        ಎಲ್ಲಾ ವಿಸ್ತರಿಸಿ
                                    </button>
                                    <button
                                        onClick={() => handleExpandAll(false)}
                                        className="text-[11px] px-2 py-1 border border-[var(--glass-border)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        title="Collapse all groups"
                                    >
                                        ಕುಗ್ಗಿಸಿ
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* REPORT BODY WITH PRINT STYLES                               */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className="flex-1 overflow-y-auto print:overflow-visible pr-1">
                    
                    {/* Temple Print Header (Visible ONLY on print) */}
                    <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
                        <h1 className="text-2xl font-bold tracking-wide">ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ / ಸೇವಾ ಸಮಿತಿ</h1>
                        <p className="text-sm font-medium">Shri Raghavendra Swamy Matha & Seva Samithi</p>
                        <div className="mt-2 text-lg font-bold">
                            {activeReport.titleKn} ({activeReport.titleEn})
                        </div>
                        <div className="text-xs mt-1 flex justify-between px-4 font-mono">
                            <span>
                                {startDate === endDate 
                                    ? `ದಿನಾಂಕ (Date): ${formatIsoToDisplay(startDate)}`
                                    : `ಅವಧಿ (Period): ${formatIsoToDisplay(startDate)} ರಿಂದ ${formatIsoToDisplay(endDate)}`}
                            </span>
                            <span>ಮುದ್ರಿತ ದಿನಾಂಕ (Printed On): {new Date().toLocaleString()}</span>
                            <span>ಉದ್ದೇಶ: {activeReport.audienceLabelKn} ({activeReport.audienceLabelEn})</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)] gap-2">
                            <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
                            <span className="text-sm font-semibold">ವರದಿ ಸಿದ್ಧವಾಗುತ್ತಿದೆ... (Generating report...)</span>
                        </div>
                    ) : !reportData ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
                            <AlertCircle size={32} className="mb-2 text-amber-500" />
                            <span>ಯಾವುದೇ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ (No data available)</span>
                        </div>
                    ) : (
                        <div>
                            {/* Render matching report layout */}
                            {activeReport.id === 'daily_priest' && (
                                <PriestSankalpaReportView 
                                    data={reportData} 
                                    filter={tableFilter} 
                                    isExpanded={isGroupExpanded} 
                                    onToggle={toggleGroup} 
                                />
                            )}

                            {activeReport.id === 'daily_kitchen' && (
                                <KitchenHastodakaReportView 
                                    data={reportData} 
                                    filter={tableFilter} 
                                    isExpanded={isGroupExpanded} 
                                    onToggle={toggleGroup} 
                                />
                            )}

                            {activeReport.id === 'on_demand_full' && (
                                <OnDemandBookingsReportView 
                                    data={reportData} 
                                    filter={tableFilter} 
                                    isExpanded={isGroupExpanded} 
                                    onToggle={toggleGroup} 
                                />
                            )}

                            {activeReport.id === 'hastodaka_distribution' && (
                                <HastodakaDistributionReportView 
                                    data={reportData} 
                                    filter={tableFilter} 
                                    isExpanded={isGroupExpanded} 
                                    onToggle={toggleGroup} 
                                />
                            )}

                            {activeReport.id === 'financial_summary' && (
                                <FinancialSummaryReportView data={reportData} selectedDate={startDate} />
                            )}

                            {/* Formal Grand Summary Block for Print and Screen */}
                            {activeReport.id !== 'financial_summary' && (
                                <div className="mt-8 pt-4 border-t-2 border-[var(--glass-border)] print:border-black break-inside-avoid">
                                    <div className="hidden print:grid grid-cols-3 gap-8 mt-12 text-center text-xs font-bold">
                                        <div className="border-t border-black pt-2">ತಯಾರು ಮಾಡಿದವರು (Prepared By)</div>
                                        <div className="border-t border-black pt-2">
                                            {activeReport.audience === 'priest' ? 'ಪ್ರಧಾನ ಅರ್ಚಕರು (Chief Priest)' : 'ಪಾಕಶಾಲೆ ಉಸ್ತುವಾರಿ (Kitchen In-charge)'}
                                        </div>
                                        <div className="border-t border-black pt-2">ಆಡಳಿತಾಧಿಕಾರಿ / ಮ್ಯಾನೇಜರ್ (Manager)</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </main>

            {/* Print Styling Fixes */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { 
                        size: A4 portrait;
                        margin: 1.2cm; 
                    }
                    body { 
                        background: white !important; 
                        color: black !important; 
                    }
                    nav, header, aside, .print\\:hidden, .no-print { 
                        display: none !important; 
                    }
                    main {
                        border: none !important;
                        padding: 0 !important;
                        background: transparent !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        font-size: 11px !important;
                    }
                    th, td {
                        border: 1px solid #666 !important;
                        padding: 4px 6px !important;
                        color: black !important;
                    }
                    th {
                        background-color: #f3f4f6 !important;
                        font-weight: bold !important;
                    }
                    .break-inside-avoid {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    * { 
                        box-shadow: none !important; 
                        text-shadow: none !important;
                    }
                }
            `}} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SUB-VIEW 1: PRIEST POOJA SANKALPA LIST (TOMORROW)
// Devotee Name, Gothra, Nakshatra, Seva Count (Priests)
// ═══════════════════════════════════════════════════════════
function PriestSankalpaReportView({ 
    data, 
    filter, 
    isExpanded, 
    onToggle 
}: { 
    data: any; 
    filter: string; 
    isExpanded: (key: string) => boolean; 
    onToggle: (key: string) => void; 
}) {
    const q = (filter || '').toLowerCase().trim();

    return (
        <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 print:grid-cols-3">
                <div className="p-4 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">ದಿನಾಂಕ (Pooja Date)</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                        {data.start_date_formatted}
                    </div>
                    <div className="text-xs text-[var(--primary)] font-semibold">
                        {data.days?.[0]?.day_kannada}
                    </div>
                </div>

                <div className="p-4 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">ಒಟ್ಟು ಸಂಕಲ್ಪ ಸೇವೆಗಳು (Total Sevas)</div>
                    <div className="text-2xl font-bold text-[var(--primary)]">
                        {data.total_bookings}
                    </div>
                </div>

                <div className="p-4 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">ಸೇವಾರ್ಥಿಗಳು (Sevakartas)</div>
                    <div className="text-2xl font-bold text-emerald-600">
                        {data.total_devotees}
                    </div>
                </div>
            </div>

            {/* List Grouped by Seva */}
            {data.days?.map((day: any, dIdx: number) => {
                const dayKey = `priest_day_${dIdx}`;

                return (
                    <div key={dayKey} className="space-y-4">
                        {day.sevas?.length === 0 ? (
                            <div className="text-center py-12 text-sm text-[var(--text-secondary)] border border-dashed border-[var(--glass-border)] rounded-2xl">
                                ಈ ದಿನಾಂಕಕ್ಕೆ ಯಾವುದೇ ಸೇವಾ ಸಂಕಲ್ಪಗಳು ನೋಂದಣಿಯಾಗಿಲ್ಲ (No Seva Bookings for this date)
                            </div>
                        ) : (
                            day.sevas?.map((seva: any, sIdx: number) => {
                                const sevaKey = `${dayKey}_seva_${sIdx}`;
                                const expanded = isExpanded(sevaKey);

                                // Filter bookings inside seva
                                const matchingBookings = seva.bookings?.filter((b: any) => {
                                    if (!q) return true;
                                    return (
                                        b.devotee_name?.toLowerCase().includes(q) ||
                                        b.gothra?.toLowerCase().includes(q) ||
                                        b.nakshatra?.toLowerCase().includes(q) ||
                                        seva.seva_name?.toLowerCase().includes(q)
                                    );
                                }) || [];

                                if (q && matchingBookings.length === 0) return null;

                                return (
                                    <div 
                                        key={sevaKey} 
                                        className="bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl overflow-hidden print:border-gray-500 break-inside-avoid"
                                    >
                                        {/* Seva Header Bar */}
                                        <div 
                                            onClick={() => onToggle(sevaKey)}
                                            className="p-3.5 bg-[var(--primary)]/10 dark:bg-[var(--primary)]/15 border-b border-[var(--glass-border)] flex items-center justify-between cursor-pointer select-none print:bg-gray-100"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="print:hidden text-[var(--primary)]">
                                                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded bg-[var(--primary)] text-white text-xs font-mono">
                                                            {seva.seva_code}
                                                        </span>
                                                        <span>{seva.seva_name}</span>
                                                        {seva.seva_name_en && (
                                                            <span className="text-xs font-normal text-[var(--text-secondary)]">
                                                                ({seva.seva_name_en})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="px-2.5 py-1 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs font-bold text-[var(--text-primary)] print:border-gray-400">
                                                    ಸಂಕಲ್ಪ ಸಂಖ್ಯೆ: {seva.total_bookings}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Devotees Sankalpa Table */}
                                        {(expanded || q) && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--glass-border)] text-[var(--text-secondary)] font-bold">
                                                            <th className="px-4 py-2.5 w-12 text-center">ಕ್ರಮ ಸಂ.</th>
                                                            <th className="px-4 py-2.5 font-bold">ಸೇವಾರ್ಥಿಯ ಹೆಸರು (Devotee Name)</th>
                                                            <th className="px-4 py-2.5">ಗೋತ್ರ (Gothra)</th>
                                                            <th className="px-4 py-2.5">ನಕ್ಷತ್ರ (Nakshatra)</th>
                                                            <th className="px-4 py-2.5 text-center w-24">ಸೇವೆಗಳ ಸಂಖ್ಯೆ (Qty)</th>
                                                            <th className="px-4 py-2.5 text-right w-28 print:hidden">ರಶೀದಿ ಸಂ.</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[var(--glass-border)] print:divide-gray-400">
                                                        {matchingBookings.map((b: any, bIdx: number) => (
                                                            <tr key={b.registration_id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-2.5 text-center font-mono text-[var(--text-secondary)]">
                                                                    {bIdx + 1}
                                                                </td>
                                                                <td className="px-4 py-2.5 font-bold text-[var(--text-primary)] text-sm">
                                                                    {b.devotee_name}
                                                                </td>
                                                                <td className="px-4 py-2.5 font-semibold text-amber-700 dark:text-amber-400">
                                                                    {b.gothra}
                                                                </td>
                                                                <td className="px-4 py-2.5 font-semibold text-purple-700 dark:text-purple-400">
                                                                    {b.nakshatra}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-center font-bold text-sm text-[var(--primary)]">
                                                                    {b.qty}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-right font-mono text-[var(--text-secondary)] text-[11px] print:hidden">
                                                                    {b.voucher_no}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-black/5 dark:bg-white/5 font-bold border-t border-[var(--glass-border)] text-xs">
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-2 text-right">
                                                                {seva.seva_name} ಒಟ್ಟು ಸಂಕಲ್ಪಗಳು:
                                                            </td>
                                                            <td className="px-4 py-2 text-center text-sm text-[var(--primary)]">
                                                                {seva.total_bookings}
                                                            </td>
                                                            <td className="print:hidden"></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                );
            })}

            {/* Traditional Blessing Note */}
            <div className="text-center py-4 text-xs font-semibold text-[var(--text-secondary)] border-t border-dashed border-[var(--glass-border)] print:border-gray-400">
                || ಶ್ರೀ ಮೂಲರಾಮೋ ವಿಜಯತೇ || ಶ್ರೀ ಗುರುರಾಜೋ ವಿಜಯತೇ || ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿಗಳ ಅನುಗ್ರಹ ಪ್ರಾಪ್ತಿರಸ್ತು ||
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SUB-VIEW 2: KITCHEN HASTODAKA COUNT (TOMORROW)
// Included Free + Additional = Total Plates to Prepare
// ═══════════════════════════════════════════════════════════
function KitchenHastodakaReportView({ 
    data, 
    filter 
}: { 
    data: any; 
    filter: string; 
    isExpanded?: (key: string) => boolean; 
    onToggle?: (key: string) => void; 
}) {
    const q = (filter || '').toLowerCase().trim();

    return (
        <div className="space-y-6">
            {/* Top Kitchen KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
                <div className="p-4 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">ಸಿದ್ಧತೆಯ ದಿನಾಂಕ (Date)</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                        {data.start_date_formatted}
                    </div>
                    <div className="text-xs text-[var(--primary)] font-semibold">
                        {data.days?.[0]?.day_kannada}
                    </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-400">ಉಚಿತ ಹಸ್ತೋದಕ (Included Free)</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {data.grand_total_free_hastodaka}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">ಸೇವೆಗೆ ಸೇರಿರುವ ಲೆಕ್ಕ</div>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-purple-700 dark:text-purple-400">ಹೆಚ್ಚುವರಿ ಹಸ್ತೋದಕ (Additional)</div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                        {data.grand_total_additional_hastodaka}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">ಕೋರಿಕೆಯ ಹೆಚ್ಚುವರಿ ಎಲೆಗಳು</div>
                </div>

                <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl print:border-gray-600 shadow-lg shadow-emerald-500/10">
                    <div className="text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                        ಒಟ್ಟು ಹಸ್ತೋದಕ ಎಲೆಗಳು (Total Plates)
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                        {data.grand_total_hastodaka}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                        ಪಾಕಶಾಲೆಯಲ್ಲಿ ತಯಾರಿಸಬೇಕಾದ ಎಣಿಕೆ
                    </div>
                </div>
            </div>

            {/* Kitchen Preparation Table Grouped by Seva */}
            {data.days?.map((day: any, dIdx: number) => {
                const sevas = day.sevas?.filter((s: any) => {
                    if (!q) return true;
                    return (
                        s.seva_name?.toLowerCase().includes(q) ||
                        s.seva_code?.toLowerCase().includes(q)
                    );
                }) || [];

                return (
                    <div key={`kitchen_day_${dIdx}`} className="bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl overflow-hidden print:border-gray-500">
                        <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--primary)]/10 print:bg-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                                    <UtensilsCrossed size={16} className="text-[var(--primary)]" />
                                    ಸೇವೆವಾರು ಹಸ್ತೋದಕ ಎಲೆಗಳ ಸಿದ್ಧತಾ ಪಟ್ಟಿ (Seva-wise Plate Preparation Breakdown)
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                    ಪ್ರತಿ ಸೇವೆಗೆ ನಿಗದಿತ ಉಚಿತ ಹಸ್ತೋದಕ ಮತ್ತು ಹೆಚ್ಚುವರಿ ಕೋರಿಕೆಗಳ ಒಟ್ಟುಗೂಡಿಸಿದ ಲೆಕ್ಕ
                                </p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-[var(--primary)] text-white font-bold">
                                ಒಟ್ಟು ಸೇವೆಗಳು: {day.day_bookings}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--glass-border)] text-[var(--text-secondary)] font-bold">
                                        <th className="px-4 py-3 w-12 text-center">ಕ್ರಮ ಸಂ.</th>
                                        <th className="px-4 py-3">ಸೇವೆಯ ಹೆಸರು (Seva Name)</th>
                                        <th className="px-4 py-3 text-center">ಬುಕಿಂಗ್ ಸಂಖ್ಯೆ (Bookings)</th>
                                        <th className="px-4 py-3 text-center"># of Hastodaka included</th>
                                        <th className="px-4 py-3 text-right">ಒಳಗೊಂಡ ಉಚಿತ ಹಸ್ತೋದಕ</th>
                                        <th className="px-4 py-3 text-right">ಹೆಚ್ಚುವರಿ ಹಸ್ತೋದಕ</th>
                                        <th className="px-4 py-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10">
                                            ಒಟ್ಟು ತಯಾರಿಸಬೇಕಾದ ಹಸ್ತೋದಕ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--glass-border)] print:divide-gray-400">
                                    {sevas.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                                                ಈ ದಿನಾಂಕಕ್ಕೆ ಯಾವುದೇ ಹಸ್ತೋದಕ ಸೇವೆಗಳಿಲ್ಲ (No Hastodaka sevas for this date)
                                            </td>
                                        </tr>
                                    ) : (
                                        sevas.map((s: any, sIdx: number) => (
                                            <tr key={s.seva_code} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-center font-mono text-[var(--text-secondary)]">
                                                    {sIdx + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-[var(--text-primary)] text-sm">
                                                        {s.seva_name}
                                                    </div>
                                                    <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                                                        {s.seva_code} {s.seva_name_en ? `• ${s.seva_name_en}` : ''}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold text-sm">
                                                    {s.booking_count}
                                                </td>
                                                <td className="px-4 py-3 text-center font-semibold text-[var(--text-secondary)]">
                                                    {s.tp_qty_per_booking}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-400">
                                                    {s.free_hastodaka}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-purple-700 dark:text-purple-400">
                                                    {s.additional_hastodaka}
                                                </td>
                                                <td className="px-4 py-3 text-right font-extrabold text-base text-emerald-700 dark:text-emerald-400 bg-emerald-500/10">
                                                    {s.total_hastodaka}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="border-t-2 border-[var(--glass-border)] print:border-black bg-black/10 dark:bg-white/10 font-bold text-xs">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider">
                                            ಒಟ್ಟು ಮೊತ್ತ (Grand Total):
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm">{day.day_bookings}</td>
                                        <td className="px-4 py-3 text-center">—</td>
                                        <td className="px-4 py-3 text-right text-sm text-blue-700 dark:text-blue-400">
                                            {day.day_free_hastodaka}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-purple-700 dark:text-purple-400">
                                            {day.day_additional_hastodaka}
                                        </td>
                                        <td className="px-4 py-3 text-right text-lg font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/15">
                                            {day.day_total_hastodaka}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SUB-VIEW 3: ON-DEMAND BOOKINGS (DATE & SEVA GROUPED)
// Devotee Name, Phone, Gothra, Nakshatra, Additional Hastodaka
// ═══════════════════════════════════════════════════════════
function OnDemandBookingsReportView({ 
    data, 
    filter, 
    isExpanded, 
    onToggle 
}: { 
    data: any; 
    filter: string; 
    isExpanded: (key: string) => boolean; 
    onToggle: (key: string) => void; 
}) {
    const q = (filter || '').toLowerCase().trim();

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
                <div className="p-4 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">ಅವಧಿ (Period)</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                        {data.start_date_formatted} ರಿಂದ {data.end_date_formatted}
                    </div>
                    <div className="text-[10px] text-[var(--primary)] font-semibold mt-1">
                        ಆಧಾರ: {data.date_type === 'SevaDate' ? 'ಸೇವಾ ದಿನಾಂಕ' : 'ನೋಂದಣಿ ದಿನಾಂಕ'}
                    </div>
                </div>

                <div className="p-4 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">ಒಟ್ಟು ಸೇವೆಗಳು (Bookings)</div>
                    <div className="text-2xl font-bold text-[var(--primary)]">{data.total_bookings}</div>
                </div>

                <div className="p-4 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">ಒಟ್ಟು ಭಕ್ತರು (Devotees)</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.total_devotees}</div>
                </div>

                <div className="p-4 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">ಹೆಚ್ಚುವರಿ ಹಸ್ತೋದಕ (Extra)</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.total_additional_hastodaka}</div>
                </div>
            </div>

            {/* Chronological Date Groups */}
            {data.days?.map((day: any, dIdx: number) => {
                const dayKey = `ondemand_day_${dIdx}`;
                const dayExpanded = isExpanded(dayKey);

                const hasMatchingSevas = day.sevas?.some((s: any) => {
                    if (!q) return true;
                    return (
                        s.seva_name?.toLowerCase().includes(q) ||
                        s.bookings?.some((b: any) => 
                            b.devotee_name?.toLowerCase().includes(q) ||
                            b.phone?.includes(q) ||
                            b.gothra?.toLowerCase().includes(q) ||
                            b.nakshatra?.toLowerCase().includes(q)
                        )
                    );
                });

                if (q && !hasMatchingSevas) return null;

                return (
                    <div 
                        key={dayKey} 
                        className="bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl overflow-hidden print:border-gray-500 break-inside-avoid"
                    >
                        {/* Date Accordion Header */}
                        <div 
                            onClick={() => onToggle(dayKey)}
                            className="p-4 bg-black/10 dark:bg-white/10 border-b border-[var(--glass-border)] flex items-center justify-between cursor-pointer select-none print:bg-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="print:hidden text-[var(--primary)]">
                                    {dayExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-[var(--primary)]" />
                                    <span className="font-extrabold text-sm md:text-base text-[var(--text-primary)]">
                                        {day.formatted_date}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)] font-medium">
                                        — {day.day_kannada}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-bold">
                                <span className="px-2.5 py-1 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                    ದಿನದ ಒಟ್ಟು ಸೇವೆಗಳು: {day.day_total_bookings}
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-purple-700 dark:text-purple-400">
                                    ಹೆಚ್ಚುವರಿ ಹಸ್ತೋದಕ: {day.day_total_additional_hastodaka}
                                </span>
                            </div>
                        </div>

                        {/* Seva Groups inside the Day */}
                        {(dayExpanded || q) && (
                            <div className="p-3 space-y-4">
                                {day.sevas?.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-[var(--text-secondary)]">
                                        ಈ ದಿನ ಯಾವುದೇ ಬುಕಿಂಗ್ ಇಲ್ಲ
                                    </div>
                                ) : (
                                    day.sevas?.map((seva: any, sIdx: number) => {
                                        const sevaKey = `${dayKey}_seva_${sIdx}`;
                                        const sevaExpanded = isExpanded(sevaKey);

                                        const matchingBookings = seva.bookings?.filter((b: any) => {
                                            if (!q) return true;
                                            return (
                                                b.devotee_name?.toLowerCase().includes(q) ||
                                                b.phone?.includes(q) ||
                                                b.gothra?.toLowerCase().includes(q) ||
                                                b.nakshatra?.toLowerCase().includes(q) ||
                                                seva.seva_name?.toLowerCase().includes(q)
                                            );
                                        }) || [];

                                        if (q && matchingBookings.length === 0) return null;

                                        return (
                                            <div 
                                                key={sevaKey} 
                                                className="border border-[var(--glass-border)] rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 print:border-gray-400"
                                            >
                                                {/* Sub-header for Seva */}
                                                <div 
                                                    onClick={() => onToggle(sevaKey)}
                                                    className="p-3 bg-[var(--primary)]/10 flex items-center justify-between cursor-pointer select-none print:bg-gray-100"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="print:hidden text-[var(--primary)]">
                                                            {sevaExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                        </div>
                                                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--primary)] text-white">
                                                            {seva.seva_code}
                                                        </span>
                                                        <span className="font-bold text-xs md:text-sm text-[var(--text-primary)]">
                                                            {seva.seva_name}
                                                        </span>
                                                        {seva.tp_qty_included > 0 && (
                                                            <span className="text-[11px] text-[var(--text-secondary)]">
                                                                (ಹಸ್ತೋದಕ: {seva.tp_qty_included})
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs font-semibold">
                                                        <span>ಬುಕಿಂಗ್: {seva.total_bookings}</span>
                                                        <span className="text-purple-700 dark:text-purple-400">
                                                            ಹೆಚ್ಚುವರಿ ಹಸ್ತೋದಕ: {seva.total_additional_hastodaka}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Bookings Table */}
                                                {(sevaExpanded || q) && (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse text-xs">
                                                            <thead>
                                                                <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--glass-border)] text-[var(--text-secondary)] font-bold">
                                                                    <th className="px-3 py-2 w-10 text-center">ಕ್ರ.ಸಂ.</th>
                                                                    <th className="px-3 py-2">ಭಕ್ತರ ಹೆಸರು (Devotee Name)</th>
                                                                    <th className="px-3 py-2">ಮೊಬೈಲ್ (Phone)</th>
                                                                    <th className="px-3 py-2">ಗೋತ್ರ (Gothra)</th>
                                                                    <th className="px-3 py-2">ನಕ್ಷತ್ರ (Nakshatra)</th>
                                                                    <th className="px-3 py-2 text-center">ಸಂಖ್ಯೆ (Qty)</th>
                                                                    <th className="px-3 py-2 text-center text-purple-700 dark:text-purple-400">
                                                                        ಹೆಚ್ಚುವರಿ ಹಸ್ತೋದಕ
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right">ರಶೀದಿ ಸಂ.</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[var(--glass-border)] print:divide-gray-400">
                                                                {matchingBookings.map((b: any, bIdx: number) => (
                                                                    <tr key={b.registration_id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                                        <td className="px-3 py-2 text-center font-mono text-[var(--text-secondary)]">
                                                                            {bIdx + 1}
                                                                        </td>
                                                                        <td className="px-3 py-2 font-bold text-[var(--text-primary)]">
                                                                            {b.devotee_name}
                                                                        </td>
                                                                        <td className="px-3 py-2 font-mono text-[var(--text-secondary)]">
                                                                            {b.phone}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-amber-700 dark:text-amber-400 font-medium">
                                                                            {b.gothra}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-purple-700 dark:text-purple-400 font-medium">
                                                                            {b.nakshatra}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center font-bold text-[var(--primary)]">
                                                                            {b.qty}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center font-bold text-purple-700 dark:text-purple-400">
                                                                            {b.additional_hastodaka}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right font-mono text-[11px] text-[var(--text-secondary)]">
                                                                            {b.voucher_no}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot className="bg-black/5 dark:bg-white/5 font-bold border-t border-[var(--glass-border)] text-xs">
                                                                <tr>
                                                                    <td colSpan={5} className="px-3 py-2 text-right">
                                                                        {seva.seva_name} ಉಪ-ಮೊತ್ತ (Subtotal):
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-[var(--primary)]">
                                                                        {seva.total_bookings}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-purple-700 dark:text-purple-400">
                                                                        {seva.total_additional_hastodaka}
                                                                    </td>
                                                                    <td></td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SUB-VIEW 4: HASTODAKA DISTRIBUTION (PERIOD DAY-WISE)
// Day-by-Day plate breakdown across date range
// ═══════════════════════════════════════════════════════════
function HastodakaDistributionReportView({ 
    data, 
    filter, 
    isExpanded, 
    onToggle 
}: { 
    data: any; 
    filter: string; 
    isExpanded: (key: string) => boolean; 
    onToggle: (key: string) => void; 
}) {
    const q = (filter || '').toLowerCase().trim();

    return (
        <div className="space-y-6">
            {/* Distribution Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
                <div className="p-4 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">ವರದಿ ಅವಧಿ (Period)</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                        {data.start_date_formatted} ರಿಂದ {data.end_date_formatted}
                    </div>
                    <div className="text-xs text-[var(--primary)] font-semibold mt-0.5">
                        ಒಟ್ಟು ದಿನಗಳು: {data.days?.length || 0}
                    </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-400">ಅವಧಿಯ ಉಚಿತ ಹಸ್ತೋದಕ</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {data.grand_total_free_hastodaka}
                    </div>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl print:border-gray-400">
                    <div className="text-[11px] font-bold uppercase text-purple-700 dark:text-purple-400">ಅವಧಿಯ ಹೆಚ್ಚುವರಿ ಹಸ್ತೋದಕ</div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                        {data.grand_total_additional_hastodaka}
                    </div>
                </div>

                <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl print:border-gray-600">
                    <div className="text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                        ಅವಧಿಯ ಒಟ್ಟು ಹಸ್ತೋದಕ (Grand Total)
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                        {data.grand_total_hastodaka}
                    </div>
                </div>
            </div>

            {/* Daily Breakdown Accordions */}
            {data.days?.map((day: any, dIdx: number) => {
                const dayKey = `dist_day_${dIdx}`;
                const dayExpanded = isExpanded(dayKey);

                const sevas = day.sevas?.filter((s: any) => {
                    if (!q) return true;
                    return (
                        s.seva_name?.toLowerCase().includes(q) ||
                        s.seva_code?.toLowerCase().includes(q)
                    );
                }) || [];

                if (q && sevas.length === 0) return null;

                return (
                    <div 
                        key={dayKey} 
                        className="bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl overflow-hidden print:border-gray-500 break-inside-avoid"
                    >
                        {/* Day Header */}
                        <div 
                            onClick={() => onToggle(dayKey)}
                            className="p-4 bg-black/10 dark:bg-white/10 border-b border-[var(--glass-border)] flex items-center justify-between cursor-pointer select-none print:bg-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="print:hidden text-[var(--primary)]">
                                    {dayExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-[var(--primary)]" />
                                    <span className="font-extrabold text-sm md:text-base text-[var(--text-primary)]">
                                        {day.formatted_date}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)] font-medium">
                                        — {day.day_kannada}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-bold">
                                <span className="px-2.5 py-1 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-blue-700 dark:text-blue-400">
                                    ಉಚಿತ: {day.day_free_hastodaka}
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-purple-700 dark:text-purple-400">
                                    ಹೆಚ್ಚುವರಿ: {day.day_additional_hastodaka}
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold">
                                    ದಿನದ ಒಟ್ಟು ಎಲೆಗಳು: {day.day_total_hastodaka}
                                </span>
                            </div>
                        </div>

                        {/* Seva table inside day */}
                        {(dayExpanded || q) && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--glass-border)] text-[var(--text-secondary)] font-bold">
                                            <th className="px-4 py-2.5 w-12 text-center">ಕ್ರ.ಸಂ.</th>
                                            <th className="px-4 py-2.5">ಸೇವೆಯ ಹೆಸರು (Seva Name)</th>
                                            <th className="px-4 py-2.5 text-center">ಬುಕಿಂಗ್ (Bookings)</th>
                                            <th className="px-4 py-2.5 text-center"># included</th>
                                            <th className="px-4 py-2.5 text-right">ಉಚಿತ ಹಸ್ತೋದಕ</th>
                                            <th className="px-4 py-2.5 text-right">ಹೆಚ್ಚುವರಿ ಹಸ್ತೋದಕ</th>
                                            <th className="px-4 py-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10">
                                                ದಿನದ ಒಟ್ಟು ಹಸ್ತೋದಕ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--glass-border)] print:divide-gray-400">
                                        {sevas.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-6 text-center text-[var(--text-secondary)]">
                                                    ಯಾವುದೇ ಹಸ್ತೋದಕ ಬುಕಿಂಗ್ ಇಲ್ಲ
                                                </td>
                                            </tr>
                                        ) : (
                                            sevas.map((s: any, sIdx: number) => (
                                                <tr key={s.seva_code} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-2.5 text-center font-mono text-[var(--text-secondary)]">
                                                        {sIdx + 1}
                                                    </td>
                                                    <td className="px-4 py-2.5 font-bold text-[var(--text-primary)]">
                                                        {s.seva_name}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center font-semibold">
                                                        {s.booking_count}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center font-mono text-[var(--text-secondary)]">
                                                        {s.tp_qty_per_booking}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-semibold text-blue-700 dark:text-blue-400">
                                                        {s.free_hastodaka}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-semibold text-purple-700 dark:text-purple-400">
                                                        {s.additional_hastodaka}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10">
                                                        {s.total_hastodaka}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot className="bg-black/5 dark:bg-white/5 font-bold border-t border-[var(--glass-border)] text-xs">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-2.5 text-right">
                                                {day.formatted_date} ದಿನದ ಒಟ್ಟು:
                                            </td>
                                            <td className="px-4 py-2.5 text-center">{day.day_bookings}</td>
                                            <td></td>
                                            <td className="px-4 py-2.5 text-right text-blue-700 dark:text-blue-400">{day.day_free_hastodaka}</td>
                                            <td className="px-4 py-2.5 text-right text-purple-700 dark:text-purple-400">{day.day_additional_hastodaka}</td>
                                            <td className="px-4 py-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15">
                                                {day.day_total_hastodaka}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SUB-VIEW 5: DAILY FINANCIAL SUMMARY (EXISTING CAPABILITY)
// Retained seamlessly within the scalable reports hub
// ═══════════════════════════════════════════════════════════
function FinancialSummaryReportView({ data, selectedDate }: { data: any; selectedDate: string }) {
    return (
        <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl flex items-center gap-4 print:border-gray-400">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                        <FileText size={24} />
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">ಒಟ್ಟು ಸೇವೆಗಳು</div>
                        <div className="text-3xl font-bold text-[var(--text-primary)]">{data.total_registrations}</div>
                    </div>
                </div>

                <div className="p-6 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl flex items-center gap-4 print:border-gray-400">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                        <Activity size={24} />
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">ಆದಾಯ (Income)</div>
                        <div className="text-3xl font-bold text-emerald-500">₹{data.total_income}</div>
                    </div>
                </div>

                <div className="p-6 bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl flex items-center gap-4 print:border-gray-400">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                        <PieChart size={24} />
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">ವೆಚ್ಚ (Expense)</div>
                        <div className="text-3xl font-bold text-red-500">₹{data.total_expense}</div>
                    </div>
                </div>
            </div>

            {/* Payment Breakdown Table */}
            <div className="bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl overflow-hidden print:border-gray-400">
                <div className="p-4 border-b border-[var(--glass-border)] bg-black/5 dark:bg-white/5 print:bg-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-sm">
                        <PieChart size={18} className="text-[var(--primary)]" />
                        ಪಾವತಿ ವಿಧಾನವಾರು ಸಂಗ್ರಹ (Payment Mode Breakdown)
                    </h3>
                    <span className="text-xs font-mono text-[var(--text-secondary)]">
                        ದಿನಾಂಕ: {formatIsoToDisplay(selectedDate)}
                    </span>
                </div>
                <div className="p-0">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider">
                                <th className="px-6 py-3 font-bold">ವಿಧಾನ (Payment Mode)</th>
                                <th className="px-6 py-3 font-bold text-right">ಎಣಿಕೆ (Count)</th>
                                <th className="px-6 py-3 font-bold text-right">ಮೊತ್ತ (Amount)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)] print:divide-gray-300">
                            {Object.entries(data.payment_breakdown || {}).map(([mode, d]: [string, any]) => (
                                <tr key={mode} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{mode}</td>
                                    <td className="px-6 py-4 text-right font-mono text-[var(--text-secondary)]">{d.count}</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-500">₹{d.total}</td>
                                </tr>
                            ))}
                            {Object.keys(data.payment_breakdown || {}).length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                                        ಈ ದಿನಾಂಕಕ್ಕೆ ಯಾವುದೇ ಪಾವತಿಗಳಿಲ್ಲ (No transactions found)
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {Object.keys(data.payment_breakdown || {}).length > 0 && (
                            <tfoot className="border-t-2 border-[var(--glass-border)] print:border-gray-400 bg-black/5 dark:bg-white/5 font-bold">
                                <tr>
                                    <td className="px-6 py-4 text-right" colSpan={2}>ಒಟ್ಟು ಸಂಗ್ರಹ (Total Collection):</td>
                                    <td className="px-6 py-4 text-right text-emerald-600 text-base">₹{data.total_income}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
