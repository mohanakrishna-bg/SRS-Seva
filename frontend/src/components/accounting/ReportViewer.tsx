import React, { useState } from 'react';
import { reportsApi } from '../../api';

const ReportViewer = () => {
    const [reportType, setReportType] = useState('income_expenditure');
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const generateReport = async () => {
        setLoading(true);
        try {
            if (reportType === 'income_expenditure') {
                const res = await reportsApi.getIncomeExpenditure();
                setReportData(res.data);
            } else if (reportType === 'balance_sheet') {
                const res = await reportsApi.getBalanceSheet();
                setReportData(res.data);
            } else if (reportType === 'receipts_payments') {
                const res = await reportsApi.getReceiptsPayments();
                setReportData(res.data);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium mb-1">Report Type (Live Drill-Down)</label>
                    <select 
                        value={reportType} 
                        onChange={e => {setReportType(e.target.value); setReportData(null);}}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                    >
                        <option value="income_expenditure">Income & Expenditure Statement</option>
                        <option value="balance_sheet">Balance Sheet</option>
                        <option value="receipts_payments">Receipts & Payments (Cash Basis)</option>
                    </select>
                </div>
                <button 
                    onClick={generateReport}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
                >
                    {loading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>

            {reportData && reportType === 'income_expenditure' && (
                <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b bg-muted/20 font-medium">Income & Expenditure Statement</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                        <div className="p-4">
                            <h4 className="font-bold border-b border-muted pb-2 mb-2 text-muted-foreground uppercase tracking-wider text-xs">Expenditure (Dr)</h4>
                            <table className="w-full text-sm">
                                <tbody>
                                    {reportData.Expenditure?.map((e:any, i:number) => (
                                        <tr key={i} className="hover:bg-muted/50 cursor-pointer text-primary transition-colors">
                                            <td className="py-2 hover:underline decoration-1 underline-offset-2">{e.AccountName}</td>
                                            <td className="py-2 text-right">₹{e.Amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {(!reportData.Expenditure || reportData.Expenditure.length === 0) && (
                                        <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">No expenditure recorded</td></tr>
                                    )}
                                    {reportData.SurplusDeficit > 0 && (
                                        <tr className="font-medium text-emerald-600 border-t border-muted">
                                            <td className="py-2">Surplus (Excess Income over Exp.)</td>
                                            <td className="py-2 text-right">₹{reportData.SurplusDeficit.toFixed(2)}</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold border-t-2 border-b-4 border-muted-foreground/30 text-lg">
                                        <td className="py-4">Total</td>
                                        <td className="py-4 text-right">₹{Math.max(reportData.TotalExpenditure + (reportData.SurplusDeficit > 0 ? reportData.SurplusDeficit : 0), reportData.TotalIncome).toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="p-4">
                            <h4 className="font-bold border-b border-muted pb-2 mb-2 text-muted-foreground uppercase tracking-wider text-xs">Income (Cr)</h4>
                            <table className="w-full text-sm">
                                <tbody>
                                    {reportData.Income?.map((inc:any, i:number) => (
                                        <tr key={i} className="hover:bg-muted/50 cursor-pointer text-primary transition-colors">
                                            <td className="py-2 hover:underline decoration-1 underline-offset-2">{inc.AccountName}</td>
                                            <td className="py-2 text-right">₹{inc.Amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {(!reportData.Income || reportData.Income.length === 0) && (
                                        <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">No income recorded</td></tr>
                                    )}
                                    {reportData.SurplusDeficit < 0 && (
                                        <tr className="font-medium text-destructive border-t border-muted">
                                            <td className="py-2">Deficit (Excess Exp. over Income)</td>
                                            <td className="py-2 text-right">₹{Math.abs(reportData.SurplusDeficit).toFixed(2)}</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold border-t-2 border-b-4 border-muted-foreground/30 text-lg">
                                        <td className="py-4">Total</td>
                                        <td className="py-4 text-right">₹{Math.max(reportData.TotalIncome + (reportData.SurplusDeficit < 0 ? Math.abs(reportData.SurplusDeficit) : 0), reportData.TotalExpenditure).toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {reportData && reportType === 'balance_sheet' && (
                <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b bg-muted/20 font-medium">Balance Sheet Snapshot</div>
                    <div className="p-8 text-center text-muted-foreground">
                        Assets: ₹{reportData.TotalAssets?.toFixed(2) || '0.00'} <br/>
                        Liabilities & Surplus: ₹{reportData.TotalLiabilities?.toFixed(2) || '0.00'}
                    </div>
                </div>
            )}
            
            {reportData && reportType === 'receipts_payments' && (
                <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b bg-muted/20 font-medium">Receipts & Payments View</div>
                     <div className="p-8 text-center text-muted-foreground">
                        Generated. Expand rows to view cash equivalents.
                    </div>
                </div>
            )}
            
        </div>
    );
};
export default ReportViewer;
