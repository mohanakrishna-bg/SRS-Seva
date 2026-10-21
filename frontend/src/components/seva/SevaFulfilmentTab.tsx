import { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Calendar, 
    ChevronLeft, 
    ChevronRight, 
    Search, 
    CheckCircle2, 
    Circle, 
    Flame, 
    UtensilsCrossed, 
    RefreshCw, 
    CheckCheck,
    Phone,
    UserCheck,
    AlertTriangle,
    X
} from 'lucide-react';
import { registrationApi } from '../../api';
import { useToast } from '../Toast';

function formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    } catch {
        // fallback
    }
    return dateStr;
}

export default function SevaFulfilmentTab() {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const [activeView, setActiveView] = useState<'priest' | 'prasada'>('priest');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'fulfilled'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);

    // Exigency Exception State
    const [exigencyModalReg, setExigencyModalReg] = useState<any | null>(null);
    const [exigencyReason, setExigencyReason] = useState('');
    const [exigencyStaffName, setExigencyStaffName] = useState('ಕಚೇರಿ ಸಿಬ್ಬಂದಿ');
    const [exigencyAction, setExigencyAction] = useState<'reschedule' | 'refund'>('reschedule');
    const [isSubmittingExigency, setIsSubmittingExigency] = useState(false);

    const { showToast } = useToast();

    const getApiDate = (d: string) => {
        const parts = d.split('-');
        if (parts.length !== 3) return '';
        return `${parts[2]}${parts[1]}${parts[0].slice(-2)}`;
    };

    const fetchRegistrations = async () => {
        setIsLoading(true);
        try {
            const apiDate = getApiDate(selectedDate);
            const res = await registrationApi.list(0, 500, undefined, apiDate, 'SevaDate');
            setRegistrations(res.data || []);
        } catch (error) {
            console.error('Failed to load registrations:', error);
            showToast('error', 'ಸೇವಾ ಪಟ್ಟಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, [selectedDate]);

    const handlePrevDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const handleNextDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const handleSetToday = () => {
        setSelectedDate(today);
    };

    const toggleFulfilment = async (reg: any) => {
        const nextState = !reg.IsFulfilled;
        setIsUpdatingId(reg.RegistrationId);
        try {
            // Optimistic update
            setRegistrations(prev =>
                prev.map(r => r.RegistrationId === reg.RegistrationId ? { ...r, IsFulfilled: nextState } : r)
            );
            await registrationApi.fulfil(reg.RegistrationId, nextState);
            showToast('success', nextState ? 'ಸೇವೆ ಪೂರ್ಣಗೊಳಿಸಲಾಗಿದೆ' : 'ಸೇವೆ ಬಾಕಿ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ');
        } catch (error) {
            console.error('Failed to update fulfilment:', error);
            // Revert on error
            setRegistrations(prev =>
                prev.map(r => r.RegistrationId === reg.RegistrationId ? { ...r, IsFulfilled: !nextState } : r)
            );
            showToast('error', 'ಪೂರೈಕೆ ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ');
        } finally {
            setIsUpdatingId(null);
        }
    };

    const batchFulfilSevaGroup = async (sevaRegs: any[]) => {
        const pendingOnes = sevaRegs.filter(r => !r.IsFulfilled && !r.IsCancelled && !r.IsExigencyCancelled);
        if (pendingOnes.length === 0) return;

        try {
            // Optimistically mark all in group as fulfilled
            const ids = new Set(pendingOnes.map(r => r.RegistrationId));
            setRegistrations(prev =>
                prev.map(r => ids.has(r.RegistrationId) ? { ...r, IsFulfilled: true } : r)
            );

            await Promise.all(
                pendingOnes.map(r => registrationApi.fulfil(r.RegistrationId, true))
            );
            showToast('success', `${pendingOnes.length} ಸೇವೆಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಲಾಗಿದೆ`);
        } catch (error) {
            console.error('Failed batch fulfilment:', error);
            fetchRegistrations();
            showToast('error', 'ಗುಂಪು ಪೂರೈಕೆ ವಿಫಲವಾಗಿದೆ');
        }
    };

    const handleOpenExigency = (reg: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setExigencyModalReg(reg);
        setExigencyReason('');
        setExigencyStaffName('ಕಚೇರಿ ಸಿಬ್ಬಂದಿ');
        setExigencyAction('reschedule');
    };

    const handleConfirmExigency = async () => {
        if (!exigencyModalReg) return;
        if (!exigencyReason.trim()) {
            showToast('error', 'ದಯವಿಟ್ಟು ಅನಿವಾರ್ಯ ಕಾರಣವನ್ನು ನಮೂದಿಸಿ (Reason is required)');
            return;
        }

        setIsSubmittingExigency(true);
        try {
            await registrationApi.exigencyCancel(exigencyModalReg.RegistrationId, {
                exigency_reason: exigencyReason.trim(),
                staff_name: exigencyStaffName.trim() || 'ಕಚೇರಿ ಸಿಬ್ಬಂದಿ',
                action: exigencyAction
            });

            setRegistrations(prev =>
                prev.map(r => r.RegistrationId === exigencyModalReg.RegistrationId ? {
                    ...r,
                    IsExigencyCancelled: true,
                    ExigencyReason: exigencyReason.trim(),
                    ExigencyStaffName: exigencyStaffName.trim(),
                    ExigencyAction: exigencyAction,
                    IsFulfilled: false
                } : r)
            );

            showToast('success', 'ಅಪವಾದ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ (Exigency logged)');
            setExigencyModalReg(null);
        } catch (error) {
            console.error('Failed to log exigency:', error);
            showToast('error', 'ಅಪವಾದ ದಾಖಲಿಸಲು ವಿಫಲವಾಗಿದೆ');
        } finally {
            setIsSubmittingExigency(false);
        }
    };

    // Filter registrations
    const filteredRegistrations = useMemo(() => {
        let items = registrations.filter(r => !r.IsCancelled);

        if (statusFilter === 'pending') {
            items = items.filter(r => !r.IsFulfilled && !r.IsExigencyCancelled);
        } else if (statusFilter === 'fulfilled') {
            items = items.filter(r => r.IsFulfilled);
        }

        if (activeView === 'prasada') {
            // In Prasada view, highlight those who opted Theertha Prasada or have Hastodaka count
            items = items.filter(r => r.OptTheerthaPrasada || (r.PrasadaCount && r.PrasadaCount > 0));
        }

        if (!searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase().trim();
        const qClean = q.replace(/[\s\-\+]/g, '');

        return items.filter(r => {
            const name = (r.devotee?.Name || '').toLowerCase();
            const phone = (r.devotee?.Phone || '').replace(/[\s\-\+]/g, '');
            const voucher = (r.VoucherNo || '').toLowerCase();
            const sevaDesc = (r.seva?.Description || '').toLowerCase();
            const gotra = (r.devotee?.Gotra || '').toLowerCase();
            const nakshatra = (r.devotee?.Nakshatra || '').toLowerCase();
            return (
                name.includes(q) ||
                (qClean && phone.includes(qClean)) ||
                voucher.includes(q) ||
                sevaDesc.includes(q) ||
                gotra.includes(q) ||
                nakshatra.includes(q)
            );
        });
    }, [registrations, statusFilter, activeView, searchQuery]);

    // Grouping by Seva for Priest Sankalpa view
    const groupedBySeva = useMemo(() => {
        const map = new Map<string, { sevaCode: string; description: string; items: any[] }>();
        filteredRegistrations.forEach(r => {
            const code = r.SevaCode || 'OTHER';
            const desc = r.seva?.Description || r.SevaCode || 'ಇತರೆ ಸೇವೆ';
            if (!map.has(code)) {
                map.set(code, { sevaCode: code, description: desc, items: [] });
            }
            map.get(code)!.items.push(r);
        });
        return Array.from(map.values());
    }, [filteredRegistrations]);

    // KPI stats
    const totalCount = registrations.filter(r => !r.IsCancelled).length;
    const fulfilledCount = registrations.filter(r => !r.IsCancelled && r.IsFulfilled).length;
    const exigencyCount = registrations.filter(r => !r.IsCancelled && r.IsExigencyCancelled).length;
    const pendingCount = registrations.filter(r => !r.IsCancelled && !r.IsFulfilled && !r.IsExigencyCancelled).length;
    const totalHastodakaMeals = registrations.filter(r => !r.IsCancelled).reduce((sum, r) => sum + (r.PrasadaCount || 0), 0);

    return (
        <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto bg-[var(--bg-dark)] space-y-5">
            {/* ── Top Header & Stats ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--glass-border)]">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <CheckCheck className="text-[var(--primary)]" size={24} />
                        <span>ಸೇವಾ ಪೂರೈಕೆ & ಪ್ರಸಾದ ವಿತರಣೆ</span>
                    </h1>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        ದೈನಂದಿನ ಸಂಕಲ್ಪ ಪಟ್ಟಿ, ಅರ್ಚಕರ ಪೂಜಾ ಪರಿಶೀಲನೆ ಹಾಗೂ ಹಸ್ತೋದಕ ಊಟದ ವಿತರಣೆ
                    </p>
                </div>

                {/* Date Controls */}
                <div className="flex items-center gap-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] p-1.5 rounded-xl shadow-sm">
                    <button
                        type="button"
                        onClick={handlePrevDay}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                        title="ಹಿಂದಿನ ದಿನ"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            try { dateInputRef.current?.showPicker(); }
                            catch { dateInputRef.current?.focus(); }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-bold text-[var(--text-primary)] transition-all"
                    >
                        <Calendar size={14} className="text-[var(--primary)]" />
                        <span>{formatDisplayDate(selectedDate)}</span>
                    </button>
                    <input
                        ref={dateInputRef}
                        type="date"
                        value={selectedDate}
                        onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                        className="sr-only"
                    />

                    <button
                        type="button"
                        onClick={handleNextDay}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                        title="ಮುಂದಿನ ದಿನ"
                    >
                        <ChevronRight size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={handleSetToday}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedDate === today
                                ? 'bg-[var(--primary)] text-white shadow-sm'
                                : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                        ಇಂದು
                    </button>

                    <button
                        type="button"
                        onClick={fetchRegistrations}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer ml-1"
                        title="ಮರುಲೋಡ್ ಮಾಡಿ"
                    >
                        <RefreshCw size={15} className={isLoading ? 'animate-spin text-[var(--primary)]' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Operational KPI Summary Strip ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-0.5">ಇಂದಿನ ಒಟ್ಟು ಸೇವೆಗಳು</div>
                    <div className="text-xl font-bold text-[var(--text-primary)]">{totalCount}</div>
                </div>
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-blue-500 mb-0.5">ಬಾಕಿ ಇರುವ ಪೂಜೆಗಳು</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{pendingCount}</div>
                </div>
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-emerald-500 mb-0.5">ಪೂರ್ಣಗೊಂಡ ಸೇವೆಗಳು</div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{fulfilledCount}</div>
                </div>
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-rose-500 mb-0.5">ಅಪವಾದ / ರದ್ದು</div>
                    <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{exigencyCount}</div>
                </div>
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-amber-500 mb-0.5">ಹಸ್ತೋದಕ ಊಟಗಳು</div>
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{totalHastodakaMeals} ಜನರು</div>
                </div>
            </div>

            {/* ── View Switcher & Search Bar ── */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Mode Selector Tabs: Priest Sankalpa vs Kitchen/Prasada */}
                <div className="flex items-center p-1 bg-[var(--bg-light)] dark:bg-slate-900/60 border border-[var(--glass-border)] rounded-xl shadow-inner">
                    <button
                        type="button"
                        onClick={() => setActiveView('priest')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeView === 'priest'
                                ? 'bg-[var(--primary)] text-white shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <Flame size={15} />
                        <span>ಅರ್ಚಕರ ಸಂಕಲ್ಪ ಪಟ್ಟಿ (Priest Agenda)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveView('prasada')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeView === 'prasada'
                                ? 'bg-[var(--primary)] text-white shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <UtensilsCrossed size={15} />
                        <span>ಪ್ರಸಾದ & ಹಸ್ತೋದಕ ವಿತರಣೆ (Prasada Desk)</span>
                    </button>
                </div>

                {/* Filter Pills + Search */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-[var(--bg-light)] dark:bg-slate-900/60 border border-[var(--glass-border)] rounded-lg p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('pending')}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                statusFilter === 'pending'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-blue-500 hover:text-blue-400'
                            }`}
                        >
                            ಬಾಕಿ ಮಾತ್ರ
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('fulfilled')}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                statusFilter === 'fulfilled'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-emerald-500 hover:text-emerald-400'
                            }`}
                        >
                            ಪೂರ್ಣಗೊಂಡವು
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                statusFilter === 'all'
                                    ? 'bg-[var(--primary)] text-white shadow-sm'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            ಎಲ್ಲ
                        </button>
                    </div>

                    <div className="relative min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={14} />
                        <input
                            type="text"
                            placeholder="ಭಕ್ತರ ಹೆಸರು, ರಶೀದಿ, ಮೊಬೈಲ್..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--bg-light)] dark:bg-slate-900/60 border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                        />
                    </div>
                </div>
            </div>

            {/* ── Content View ── */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center py-20 text-[var(--text-secondary)]">
                    <RefreshCw className="animate-spin text-[var(--primary)] mr-2" size={20} />
                    <span>ಸೇವಾ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...</span>
                </div>
            ) : filteredRegistrations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-[var(--text-secondary)] bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl">
                    <UserCheck size={36} className="text-[var(--text-secondary)]/50 mb-2" />
                    <p className="text-sm font-semibold">ಈ ದಿನಾಂಕದಲ್ಲಿ ಯಾವುದೇ ಸೇವೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">ಬೇರೆ ದಿನಾಂಕ ಅಥವಾ ಫಿಲ್ಟರ್ ಆಯ್ಕೆಮಾಡಿ</p>
                </div>
            ) : activeView === 'priest' ? (
                /* ── Priest View: Grouped by Seva ── */
                <div className="space-y-6">
                    {groupedBySeva.map((group) => {
                        const pendingInGroup = group.items.filter(r => !r.IsFulfilled);
                        return (
                            <div key={group.sevaCode} className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-5 shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--glass-border)]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs">
                                            {group.items.length}
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-[var(--text-primary)]">{group.description}</h2>
                                            <span className="text-[10px] text-[var(--text-secondary)] font-mono">{group.sevaCode}</span>
                                        </div>
                                    </div>

                                    {pendingInGroup.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => batchFulfilSevaGroup(group.items)}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                                        >
                                            <CheckCheck size={14} />
                                            <span>ಈ ಸೇವೆಯ ಎಲ್ಲರ ಸಂಕಲ್ಪ ಪೂರ್ಣಗೊಳಿಸಿ ({pendingInGroup.length})</span>
                                        </button>
                                    )}
                                </div>

                                {/* Devotee Line Items */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {group.items.map((reg) => (
                                        <div
                                            key={reg.RegistrationId}
                                            onClick={() => !reg.IsExigencyCancelled && toggleFulfilment(reg)}
                                            className={`p-3.5 rounded-xl border transition-all ${reg.IsExigencyCancelled ? 'cursor-default' : 'cursor-pointer'} flex items-start justify-between gap-3 ${
                                                reg.IsExigencyCancelled
                                                    ? 'bg-rose-500/10 border-rose-500/30'
                                                    : reg.IsFulfilled
                                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                                        : 'bg-[var(--bg-dark)] border-[var(--glass-border)] hover:border-[var(--primary)] shadow-sm'
                                            }`}
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                                                    {reg.devotee?.Name || 'ಭಕ್ತರು'}
                                                </div>
                                                <div className="text-xs text-[var(--text-secondary)] flex flex-wrap gap-x-2 gap-y-0.5">
                                                    <span>ಗೋತ್ರ: <strong className="text-[var(--text-primary)]">{reg.devotee?.Gotra || '-'}</strong></span>
                                                    <span>ನಕ್ಷತ್ರ: <strong className="text-[var(--text-primary)]">{reg.devotee?.Nakshatra || '-'}</strong></span>
                                                </div>
                                                {reg.devotee?.Phone && (
                                                    <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                                                        <Phone size={10} />
                                                        <span>{reg.devotee.Phone}</span>
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                                                    ವೌಚರ್: {reg.VoucherNo}
                                                </div>

                                                {/* Exigency Indicator or Action */}
                                                {reg.IsExigencyCancelled ? (
                                                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                                        <AlertTriangle size={11} />
                                                        <span>ಅಪವಾದ: {reg.ExigencyReason} ({reg.ExigencyAction === 'refund' ? 'ಮರುಪಾವತಿ' : 'ಮರುಹೊಂದಿಕೆ'})</span>
                                                    </div>
                                                ) : !reg.IsFulfilled ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleOpenExigency(reg, e)}
                                                        className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                                                        title="ಅನಿವಾರ್ಯ ಕಾರಣದಿಂದ ಸೇವೆ ನೆರವೇರಿಸಲು ಸಾಧ್ಯವಾಗದಿದ್ದರೆ ಅಪವಾದ ದಾಖಲಿಸಿ"
                                                    >
                                                        <AlertTriangle size={10} />
                                                        <span>ಅಪವಾದ ದಾಖಲಿಸಿ</span>
                                                    </button>
                                                ) : null}
                                            </div>

                                            {!reg.IsExigencyCancelled && (
                                                <button
                                                    type="button"
                                                    disabled={isUpdatingId === reg.RegistrationId}
                                                    className={`p-1.5 rounded-full transition-transform shrink-0 ${
                                                        reg.IsFulfilled
                                                            ? 'text-emerald-500 hover:scale-110'
                                                            : 'text-[var(--text-secondary)] hover:text-emerald-500 hover:scale-110'
                                                    }`}
                                                    title={reg.IsFulfilled ? 'ಸಂಕಲ್ಪ ಪೂರ್ಣಗೊಂಡಿದೆ (Completed)' : 'ಸಂಕಲ್ಪ ಪೂರ್ಣಗೊಳಿಸಿ (Click to mark)'}
                                                >
                                                    {reg.IsFulfilled ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ── Prasada & Hastodaka Distribution Counter View ── */
                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="pb-3 border-b border-[var(--glass-border)] flex justify-between items-center">
                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                            ತೀರ್ಥ ಪ್ರಸಾದ & ಹಸ್ತೋದಕ ವಿತರಣಾ ಕೌಂಟರ್
                        </h2>
                        <span className="text-xs font-bold text-amber-500">
                            ಒಟ್ಟು ಫಲಾನುಭವಿಗಳು: {filteredRegistrations.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredRegistrations.map((reg) => (
                            <div
                                key={reg.RegistrationId}
                                onClick={() => !reg.IsExigencyCancelled && toggleFulfilment(reg)}
                                className={`p-4 rounded-xl border transition-all ${reg.IsExigencyCancelled ? 'cursor-default' : 'cursor-pointer'} flex items-start justify-between gap-3 ${
                                    reg.IsExigencyCancelled
                                        ? 'bg-rose-500/10 border-rose-500/30'
                                        : reg.IsFulfilled
                                            ? 'bg-emerald-500/5 border-emerald-500/20'
                                            : 'bg-[var(--bg-dark)] border-[var(--glass-border)] hover:border-amber-500 shadow-sm'
                                }`}
                            >
                                <div className="space-y-1.5 min-w-0">
                                    <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                                        {reg.devotee?.Name || 'ಭಕ್ತರು'}
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">
                                        ಸೇವೆ: <strong className="text-[var(--text-primary)]">{reg.seva?.Description || reg.SevaCode}</strong>
                                    </div>

                                    {/* Hastodaka badge */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {reg.PrasadaCount && reg.PrasadaCount > 0 ? (
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                                <UtensilsCrossed size={11} />
                                                <span>ಹಸ್ತೋದಕ: {reg.PrasadaCount} ಜನರು</span>
                                            </span>
                                        ) : null}
                                        {reg.OptTheerthaPrasada && (
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                                ತೀರ್ಥ ಪ್ರಸಾದ
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-[10px] text-[var(--text-secondary)] font-mono pt-1">
                                        ವೌಚರ್: {reg.VoucherNo} • ID: #{reg.RegistrationId}
                                    </div>

                                    {/* Exigency Indicator or Action */}
                                    {reg.IsExigencyCancelled ? (
                                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                            <AlertTriangle size={11} />
                                            <span>ಅಪವಾದ: {reg.ExigencyReason} ({reg.ExigencyAction === 'refund' ? 'ಮರುಪಾವತಿ' : 'ಮರುಹೊಂದಿಕೆ'})</span>
                                        </div>
                                    ) : !reg.IsFulfilled ? (
                                        <button
                                            type="button"
                                            onClick={(e) => handleOpenExigency(reg, e)}
                                            className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                                            title="ಅನಿವಾರ್ಯ ಕಾರಣದಿಂದ ಸೇವೆ ನೆರವೇರಿಸಲು ಸಾಧ್ಯವಾಗದಿದ್ದರೆ ಅಪವಾದ ದಾಖಲಿಸಿ"
                                        >
                                            <AlertTriangle size={10} />
                                            <span>ಅಪವಾದ ದಾಖಲಿಸಿ</span>
                                        </button>
                                    ) : null}
                                </div>

                                {!reg.IsExigencyCancelled && (
                                    <button
                                        type="button"
                                        disabled={isUpdatingId === reg.RegistrationId}
                                        className={`p-2 rounded-xl transition-all shrink-0 ${
                                            reg.IsFulfilled
                                                ? 'bg-emerald-500/15 text-emerald-500'
                                                : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:bg-emerald-600 hover:text-white'
                                        }`}
                                        title={reg.IsFulfilled ? 'ಪ್ರಸಾದ ವಿತರಿಸಲಾಗಿದೆ' : 'ಪ್ರಸಾದ ವಿತರಿಸಿ'}
                                    >
                                        {reg.IsFulfilled ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Exigency Cancellation Modal (Centered & Constrained per UI Guidelines) ── */}
            {exigencyModalReg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-[var(--bg-light)] dark:bg-slate-900 border border-[var(--glass-border)] rounded-2xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-rose-500/15 text-rose-600 rounded-xl">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                                        ಸೇವಾ ಅಪವಾದ / ಅನಿವಾರ್ಯ ರದ್ದತಿ ದಾಖಲಿಸಿ
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        Log Seva Non-Fulfillment & Exigency Exception
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setExigencyModalReg(null)}
                                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Selected Seva Info */}
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--glass-border)] text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-[var(--text-secondary)]">ಸೇವಾರ್ಥಿ:</span>
                                <strong className="text-[var(--text-primary)]">{exigencyModalReg.devotee?.Name || 'Unknown'}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-secondary)]">ಸೇವೆ:</span>
                                <strong className="text-[var(--text-primary)]">{exigencyModalReg.seva?.Description || exigencyModalReg.SevaCode}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-secondary)]">ವೌಚರ್ ಸಂಖ್ಯೆ:</span>
                                <span className="font-mono">{exigencyModalReg.VoucherNo}</span>
                            </div>
                        </div>

                        {/* Mandatory Reason */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
                                <span>ಅನಿವಾರ್ಯ ಕಾರಣ (Mandatory Reason for Non-Fulfillment) <span className="text-rose-500">*</span></span>
                            </label>
                            <textarea
                                value={exigencyReason}
                                onChange={(e) => setExigencyReason(e.target.value)}
                                placeholder="ಉದಾ: ಮಳೆ/ಪ್ರವಾಹದ ಕಾರಣ ಅಥವಾ ಅರ್ಚಕರ ಅಲಭ್ಯತೆಯಿಂದ ಸೇವೆ ನೆರವೇರಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ..."
                                rows={3}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-black/30 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                            />
                        </div>

                        {/* Proposed Action */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[var(--text-primary)]">
                                    ಪರಿಹಾರ ಕ್ರಮ (Proposed Resolution)
                                </label>
                                <select
                                    value={exigencyAction}
                                    onChange={(e) => setExigencyAction(e.target.value as any)}
                                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-black/30 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
                                >
                                    <option value="reschedule">ಮುಂದಿನ ದಿನಕ್ಕೆ ಮರುಹೊಂದಿಕೆ (Reschedule Seva)</option>
                                    <option value="refund">ಹಣ ಮರುಪಾವತಿ (Initiate Refund)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[var(--text-primary)]">
                                    ದಾಖಲಿಸಿದ ಸಿಬ್ಬಂದಿ (Staff Name)
                                </label>
                                <input
                                    type="text"
                                    value={exigencyStaffName}
                                    onChange={(e) => setExigencyStaffName(e.target.value)}
                                    placeholder="ಸಿಬ್ಬಂದಿ ಹೆಸರು"
                                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-black/30 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end items-center gap-2 pt-3 border-t border-[var(--glass-border)]">
                            <button
                                type="button"
                                onClick={() => setExigencyModalReg(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                            >
                                ರದ್ದುಮಾಡಿ (Cancel)
                            </button>
                            <button
                                type="button"
                                disabled={isSubmittingExigency || !exigencyReason.trim()}
                                onClick={handleConfirmExigency}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                {isSubmittingExigency ? <RefreshCw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                                <span>ಅಪವಾದ ದೃಢೀಕರಿಸಿ (Confirm Exigency)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
