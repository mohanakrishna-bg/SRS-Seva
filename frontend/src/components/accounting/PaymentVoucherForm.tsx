import React, { useState, useEffect } from 'react';
import { accountingApi } from '../../api';
import { Mic, MicOff, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';

interface AccountHead {
    Id: number;
    Code: string;
    Name: string;
    ParentId: number | null;
}

export const PaymentVoucherForm: React.FC = () => {
    const [expenseAccounts, setExpenseAccounts] = useState<AccountHead[]>([]);
    const [assetAccounts, setAssetAccounts] = useState<AccountHead[]>([]);
    
    const [payee, setPayee] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState('');
    const [selectedExpenseId, setSelectedExpenseId] = useState<number | ''>('');
    const [selectedAssetId, setSelectedAssetId] = useState<number | ''>('');
    const [reference, setReference] = useState('');
    const [narration, setNarration] = useState('');
    const [imageLink, setImageLink] = useState('');
    
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const [expRes, assetRes] = await Promise.all([
                    accountingApi.getExpenseAccounts(),
                    accountingApi.getAccounts()
                ]);
                setExpenseAccounts(expRes.data);
                
                // Filter Asset Accounts (Cash A001 and Bank A002)
                const assets = assetRes.data.filter(
                    (acc: any) => acc.Type === 'Asset' && (acc.Code === 'A001' || acc.Code === 'A002')
                );
                setAssetAccounts(assets);
                if (assets.length > 0) {
                    setSelectedAssetId(assets[0].Id);
                }
            } catch (err: any) {
                console.error("Failed to load accounts", err);
                setError("Failed to load chart of accounts.");
            }
        };
        fetchAccounts();
    }, []);

    const handleSpeech = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Voice dictation is not supported in this browser. Please use Chrome or Safari.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        // Default to Kannada, fallback to English
        recognition.lang = 'kn-IN';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech error", event);
            setError("Speech recognition failed. Please try again.");
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setNarration(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!payee || !amount || !selectedExpenseId || !selectedAssetId) {
            setError("All fields marked as required are mandatory.");
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Amount must be greater than zero.");
            return;
        }

        setLoading(true);
        try {
            await accountingApi.saveExpenseVoucher({
                PayeeName: payee,
                Date: date,
                ExpenseAccountId: Number(selectedExpenseId),
                Amount: parsedAmount,
                SourceAccountId: Number(selectedAssetId),
                Reference: reference || undefined,
                Narration: narration || undefined,
                ImageLink: imageLink || undefined
            });
            setSuccess("Payment voucher saved successfully and double-entry journal posted.");
            // Reset form
            setPayee('');
            setAmount('');
            setSelectedExpenseId('');
            setReference('');
            setNarration('');
            setImageLink('');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to save payment voucher.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to render indented hierarchical list of accounts
    const renderHierarchy = (accounts: AccountHead[]) => {
        const rootAccounts = accounts.filter(acc => acc.ParentId === null);
        const rendered: JSX.Element[] = [];

        const traverse = (acc: AccountHead, depth: number) => {
            const indent = '.'.repeat(depth * 2);
            rendered.push(
                <option key={acc.Id} value={acc.Id}>
                    {indent ? `${indent} ` : ''}{acc.Name}
                </option>
            );
            const children = accounts.filter(child => child.ParentId === acc.Id);
            children.forEach(child => traverse(child, depth + 1));
        };

        rootAccounts.forEach(root => traverse(root, 0));
        return rendered;
    };

    return (
        <div className="glass-card max-w-4xl mx-auto my-6 p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md shadow-2xl">
            <div className="border-b border-white/10 pb-4 mb-6">
                <h2 className="font-heading text-2xl font-bold text-white tracking-tight">ಪಾವತಿ ವೋಚರ್ ನಮೂದು (Payment Voucher Entry)</h2>
                <p className="text-sm text-[#7a5c3e] dark:text-[#e67e22]/70 mt-1">
                    Log operational expenditures and automatically post balanced double-entry ledger items.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span className="text-sm font-medium">{success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payee / Vendor Name */}
                    <div>
                        <label className="block text-sm font-semibold text-white/70 mb-2">Payee / Vendor Name *</label>
                        <input
                            type="text"
                            value={payee}
                            onChange={(e) => setPayee(e.target.value)}
                            placeholder="Enter vendor or payee name"
                            className="form-input text-white w-full"
                            required
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-semibold text-white/70 mb-2">Date *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="form-input text-white w-full"
                            required
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-semibold text-white/70 mb-2">Amount (INR) *</label>
                        <div className="relative rounded-xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-white/40 text-sm">₹</span>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="form-input pl-8 text-white w-full"
                                required
                            />
                        </div>
                    </div>

                    {/* Expense Category */}
                    <div>
                        <label className="block text-sm font-semibold text-white/70 mb-2">Expense Category (Account Head) *</label>
                        <select
                            value={selectedExpenseId}
                            onChange={(e) => setSelectedExpenseId(e.target.value ? Number(e.target.value) : '')}
                            className="form-input text-white w-full"
                            required
                        >
                            <option value="">-- Select Category --</option>
                            {renderHierarchy(expenseAccounts)}
                        </select>
                    </div>

                    {/* Source Account */}
                    <div>
                        <label className="block text-sm font-semibold text-white/70 mb-2">Source Asset Account *</label>
                        <select
                            value={selectedAssetId}
                            onChange={(e) => setSelectedAssetId(Number(e.target.value))}
                            className="form-input text-white w-full"
                            required
                        >
                            {assetAccounts.map(acc => (
                                <option key={acc.Id} value={acc.Id}>
                                    {acc.Name} ({acc.Code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reference ID */}
                    <div>
                        <label className="block text-sm font-semibold text-white/70 mb-2">Reference ID / Cheque / UTR</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="e.g. UTR1234567, Chq #098231"
                            className="form-input text-white w-full"
                        />
                    </div>
                </div>

                {/* External Bill Image URL */}
                <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">External Bill Image URL</label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <ImageIcon className="w-5 h-5 text-white/30" />
                        </div>
                        <input
                            type="url"
                            value={imageLink}
                            onChange={(e) => setImageLink(e.target.value)}
                            placeholder="https://example.com/uploaded-bill.jpg"
                            className="form-input pl-10 text-white w-full"
                        />
                    </div>
                </div>

                {/* Narration with speech recognition */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-white/70 mb-2">Narration / Remarks</label>
                    <textarea
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                        placeholder="Log dictation or specific remarks detailing the purchase"
                        className={`form-input text-white w-full h-24 pr-12 transition-all ${
                            isListening ? 'border-[#FF9933] shadow-[0_0_8px_rgba(255,153,51,0.5)]' : ''
                        }`}
                    />
                    <button
                        type="button"
                        onClick={handleSpeech}
                        title="Voice dictation (Kannada/English)"
                        className={`absolute bottom-3 right-3 p-2.5 rounded-full border transition-all ${
                            isListening 
                            ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                            : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary min-h-[2.75rem] w-full md:w-auto px-8"
                    >
                        {loading ? "Saving Voucher..." : "Save Payment Voucher"}
                    </button>
                </div>
            </form>
        </div>
    );
};
