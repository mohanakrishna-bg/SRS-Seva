import React, { useEffect, useState } from 'react';
import { accountingApi } from '../../api';

const JournalTable = () => {
    const [entries, setEntries] = useState<any[]>([]);

    useEffect(() => {
        accountingApi.getJournal({ limit: 50 })
            .then(res => setEntries(res.data))
            .catch(console.error);
    }, []);

    return (
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-4 border-b bg-muted/20 flex justify-between items-center">
                <h3 className="font-medium">Recent Journal Entries</h3>
                <span className="text-xs text-muted-foreground">Last 50 entries</span>
            </div>
            <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">ID</th>
                            <th className="px-4 py-3 text-left font-medium">Date</th>
                            <th className="px-4 py-3 text-left font-medium">Source</th>
                            <th className="px-4 py-3 text-left font-medium w-1/3">Narration</th>
                            <th className="px-4 py-3 text-right font-medium">Total Dr/Cr</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {entries.map((entry) => {
                            const total = entry.lines?.filter((l:any)=>l.Debit>0).reduce((sum:number, l:any)=>sum+l.Debit, 0) || 0;
                            return (
                                <tr key={entry.Id} className="hover:bg-muted/50 group cursor-pointer">
                                    <td className="px-4 py-3 font-mono text-xs">JE-{entry.Id}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{entry.EntryDate}</td>
                                    <td className="px-4 py-3">
                                        <span className="bg-secondary/20 text-secondary-foreground px-2 py-1 rounded text-xs">{entry.SourceModule}</span>
                                    </td>
                                    <td className="px-4 py-3 truncate max-w-xs">{entry.Narration}</td>
                                    <td className="px-4 py-3 text-right font-medium">₹{total.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                        {entries.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No journal entries found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default JournalTable;
