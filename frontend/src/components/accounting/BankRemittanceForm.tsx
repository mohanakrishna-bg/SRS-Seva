import React, { useState, useEffect } from 'react';
import { accountingApi } from '../../api';

const BankRemittanceForm = () => {
    const [accounts, setAccounts] = useState<any[]>([]);
    
    // Form state
    const [bankId, setBankId] = useState('');
    const [type, setType] = useState('Deposit');
    const [mode, setMode] = useState('Cash');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadAccounts();
    }, []);
    
    const loadAccounts = () => {
        accountingApi.getBankAccounts().then(res => {
            setAccounts(res.data);
            if (res.data.length > 0 && !bankId) setBankId(res.data[0].Id.toString());
        }).catch(console.error);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        if (!bankId || !amount || Number(amount) <= 0) {
            setMessage('Please enter a valid amount and select an account.');
            return;
        }
        
        setLoading(true);
        try {
            await accountingApi.createBankTransaction({
                BankAccountId: parseInt(bankId),
                TransactionDate: new Date().toISOString().split('T')[0],
                Type: type,
                Mode: mode,
                Amount: parseFloat(amount),
                Reference: reference || null,
                Narration: `${type} via ${mode}${reference ? ' - Ref: ' + reference : ''}`
            });
            setMessage('Transaction saved successfully!');
            setAmount('');
            setReference('');
            loadAccounts(); // Refresh balances
        } catch(err: any) {
            setMessage(err.response?.data?.detail || 'Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-4">Record Bank Transaction</h3>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium mb-1">Bank Account</label>
                        <select 
                            value={bankId} onChange={e => setBankId(e.target.value)}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                        >
                            {accounts.map(a => <option key={a.Id} value={a.Id}>{a.AccountName} (Bal: ₹{a.CurrentBalance.toFixed(2)})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select 
                                value={type} onChange={e => setType(e.target.value)}
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                            >
                                <option value="Deposit">Deposit</option>
                                <option value="Withdrawal">Withdrawal</option>
                                <option value="Transfer">Transfer</option>
                                <option value="Online">Online Receipt</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Mode</label>
                            <select 
                                value={mode} onChange={e => setMode(e.target.value)}
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="NEFT/RTGS">NEFT/RTGS</option>
                                <option value="UPI">UPI</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                        <input 
                            type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring" 
                            placeholder="0.00" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Reference / Cheque No</label>
                        <input 
                            type="text" value={reference} onChange={e => setReference(e.target.value)}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring" 
                        />
                    </div>
                    
                    {message && (
                        <div className={`p-3 text-sm rounded ${message.includes('success') ? 'bg-emerald-100 text-emerald-800' : 'bg-destructive/10 text-destructive'}`}>
                            {message}
                        </div>
                    )}
                    
                    <button 
                        type="submit" disabled={loading}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Transaction'}
                    </button>
                </form>
            </div>
            
            <div className="bg-card border rounded-lg p-6 shadow-sm flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                 </div>
                 <h3 className="text-lg font-medium mb-2">Automated Reconciliation</h3>
                 <p className="text-sm text-muted-foreground max-w-sm">Transactions recorded here instantly update your bank balances and ledger books. You can reconcile these against your physical bank statements in the Reports tab.</p>
            </div>
        </div>
    );
};
export default BankRemittanceForm;
