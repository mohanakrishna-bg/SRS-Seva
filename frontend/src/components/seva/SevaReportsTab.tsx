import { useState, useEffect } from 'react';
import { Calendar, Printer, FileText, PieChart, Activity } from 'lucide-react';
import api from '../../api';
import { useToast } from '../Toast';

export default function SevaReportsTab() {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    
    // Convert YYYY-MM-DD to DDMMYY for API
    const getApiDate = (d: string) => {
        const parts = d.split('-');
        if (parts.length !== 3) return '';
        return `${parts[2]}${parts[1]}${parts[0].slice(-2)}`;
    };

    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const { showToast } = useToast();

    const fetchSummary = async () => {
        setIsLoading(true);
        try {
            const apiDate = getApiDate(selectedDate);
            const res = await api.get(`/stats/daily-summary?date=${apiDate}`);
            setSummary(res.data);
        } catch (error: any) {
            console.error('Failed to fetch summary:', error);
            showToast('error', 'ವರದಿಯನ್ನು ಪಡೆಯಲು ವಿಫಲವಾಗಿದೆ');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [selectedDate]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="h-full flex flex-col p-4 bg-[var(--bg-dark)] rounded-xl relative">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6 no-print">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
                        <Calendar size={18} className="text-[var(--primary)]" />
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-sm focus:outline-none text-[var(--text-primary)]"
                        />
                    </div>
                </div>
                
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[var(--primary)]/20 hover:bg-[var(--primary-hover)]"
                >
                    <Printer size={18} /> ಮುದ್ರಿಸಿ
                </button>
            </div>

            {/* Report Content */}
            <div className="flex-1 overflow-y-auto print:overflow-visible">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48 text-[var(--text-secondary)]">
                        ಲೋಡ್ ಆಗುತ್ತಿದೆ...
                    </div>
                ) : !summary ? (
                    <div className="flex items-center justify-center h-48 text-[var(--text-secondary)]">
                        ಯಾವುದೇ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-8 pb-8 print:p-0">
                        
                        {/* Print Header */}
                        <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
                            <h1 className="text-2xl font-bold">ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ</h1>
                            <h2 className="text-xl">ದೈನಂದಿನ ಸೇವಾ ವರದಿ</h2>
                            <p className="mt-2 font-mono">ದಿನಾಂಕ: {selectedDate}</p>
                        </div>

                        {/* Top KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl flex items-center gap-4 print:border-gray-300 print:shadow-none">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">ಒಟ್ಟು ಸೇವೆಗಳು</div>
                                    <div className="text-3xl font-bold text-[var(--text-primary)]">{summary.total_registrations}</div>
                                </div>
                            </div>

                            <div className="p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl flex items-center gap-4 print:border-gray-300 print:shadow-none">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">ಆದಾಯ</div>
                                    <div className="text-3xl font-bold text-emerald-500">₹{summary.total_income}</div>
                                </div>
                            </div>

                            <div className="p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl flex items-center gap-4 print:border-gray-300 print:shadow-none">
                                <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                                    <PieChart size={24} />
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">ವೆಚ್ಚ</div>
                                    <div className="text-3xl font-bold text-red-500">₹{summary.total_expense}</div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl overflow-hidden print:border-gray-300 print:shadow-none">
                            <div className="p-4 border-b border-[var(--glass-border)] bg-black/5 dark:bg-white/5 print:bg-gray-100">
                                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <PieChart size={18} className="text-[var(--primary)]" />
                                    ಪಾವತಿ ವಿವರ
                                </h3>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-black/5 dark:bg-white/5 print:bg-gray-50 border-b border-[var(--glass-border)] print:border-gray-300 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                                            <th className="px-6 py-3 font-bold">ವಿಧಾನ</th>
                                            <th className="px-6 py-3 font-bold text-right">ಎಣಿಕೆ</th>
                                            <th className="px-6 py-3 font-bold text-right">ಮೊತ್ತ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--glass-border)] print:divide-gray-300">
                                        {Object.entries(summary.payment_breakdown || {}).map(([mode, data]: [string, any]) => (
                                            <tr key={mode} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{mode}</td>
                                                <td className="px-6 py-4 text-right font-mono text-[var(--text-secondary)]">{data.count}</td>
                                                <td className="px-6 py-4 text-right font-bold text-emerald-500">₹{data.total}</td>
                                            </tr>
                                        ))}
                                        {Object.keys(summary.payment_breakdown || {}).length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                                                    ಈ ದಿನಾಂಕಕ್ಕೆ ಯಾವುದೇ ಪಾವತಿಗಳಿಲ್ಲ
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {Object.keys(summary.payment_breakdown || {}).length > 0 && (
                                        <tfoot className="border-t-2 border-[var(--glass-border)] print:border-gray-400 bg-black/5 dark:bg-white/5 print:bg-gray-100">
                                            <tr>
                                                <td className="px-6 py-4 font-bold text-[var(--text-primary)] text-right" colSpan={2}>ಒಟ್ಟು:</td>
                                                <td className="px-6 py-4 text-right font-bold text-emerald-600 text-lg">₹{summary.total_income}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                    </div>
                )}
            </div>
            
            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 1.5cm; }
                    body { background: white !important; color: black !important; }
                    .no-print { display: none !important; }
                    .print\\:block { display: block !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-gray-300 { border-color: #d1d5db !important; }
                    .print\\:divide-gray-300 > :not([hidden]) ~ :not([hidden]) { border-color: #d1d5db !important; }
                    * { color: black !important; }
                    .text-emerald-500, .text-emerald-600 { color: #059669 !important; }
                    .text-red-500 { color: #dc2626 !important; }
                }
            `}} />
        </div>
    );
}
