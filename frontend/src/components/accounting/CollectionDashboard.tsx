import React, { useEffect, useState } from 'react';
import { reportsApi, accountingApi } from '../../api';

const CollectionDashboard = () => {
    const [summary, setSummary] = useState<any>(null);
    const [balances, setBalances] = useState<any[]>([]);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        
        reportsApi.getCollectionSummary(today, today)
            .then(res => setSummary(res.data))
            .catch(console.error);
            
        accountingApi.getBankAccounts()
            .then(res => setBalances(res.data))
            .catch(console.error);
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-4 shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground">Today's Collection</h3>
                    <div className="mt-2 text-2xl font-bold">₹{summary?.total?.toFixed(2) || '0.00'}</div>
                </div>
                {balances.map(b => (
                    <div key={b.Id} className="bg-card border rounded-lg p-4 shadow-sm">
                        <h3 className="text-sm font-medium text-muted-foreground">{b.AccountName}</h3>
                        <div className="mt-2 text-2xl font-bold">₹{b.CurrentBalance.toFixed(2)}</div>
                    </div>
                ))}
            </div>
            
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/20">
                    <h3 className="font-medium">Collection Breakdown (Today)</h3>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Seva</th>
                                <th className="px-4 py-3 text-left font-medium">Mode</th>
                                <th className="px-4 py-3 text-right font-medium">Count</th>
                                <th className="px-4 py-3 text-right font-medium">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y relative">
                            {summary?.items?.map((item: any, i: number) => (
                                <tr key={i} className="hover:bg-muted/50 cursor-pointer">
                                    <td className="px-4 py-3 text-primary">{item.SevaCode || 'General'}</td>
                                    <td className="px-4 py-3">{item.PaymentMode}</td>
                                    <td className="px-4 py-3 text-right">{item.Count}</td>
                                    <td className="px-4 py-3 text-right font-medium">₹{item.TotalAmount.toFixed(2)}</td>
                                </tr>
                            ))}
                            {(!summary?.items || summary.items.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No collections yet today</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default CollectionDashboard;
