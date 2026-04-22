import React, { useState, useEffect } from 'react';
import { registrationApi } from '../api';
import { CheckCircle, Circle } from 'lucide-react';

export default function FulfilmentList() {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Default to today in DDMMYY format
    const today = new Date();
    const defaultDate = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getFullYear()).substring(2)}`;
    const [filterDate, setFilterDate] = useState(defaultDate);

    useEffect(() => {
        loadRegistrations();
    }, []);

    const loadRegistrations = async () => {
        setIsLoading(true);
        try {
            // In a real app with many records, we'd add a date filter to the API
            // Here we fetch the latest and filter client-side for simplicity of this phase
            const res = await registrationApi.list(0, 500);
            setRegistrations(res.data);
        } catch (err) {
            console.error("Failed to load registrations", err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFulfilment = async (reg: any) => {
        const newValue = !reg.IsFulfilled;
        try {
            // Optimistic UI update
            setRegistrations(prev => prev.map(r => r.RegistrationId === reg.RegistrationId ? { ...r, IsFulfilled: newValue } : r));
            await registrationApi.fulfil(reg.RegistrationId, newValue);
        } catch (err) {
            console.error("Failed to update fulfilment status", err);
            // Revert on failure
            setRegistrations(prev => prev.map(r => r.RegistrationId === reg.RegistrationId ? { ...r, IsFulfilled: !newValue } : r));
        }
    };

    // Derived state
    const filteredRegistrations = registrations.filter(r => r.SevaDate === filterDate);
    
    // Display helper for Date input
    const displayDateValue = `20${filterDate.substring(4,6)}-${filterDate.substring(2,4)}-${filterDate.substring(0,2)}`;

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const parts = e.target.value.split('-');
        if (parts.length === 3) {
            setFilterDate(`${parts[2]}${parts[1]}${parts[0].substring(2)}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6">
            <div className="max-w-5xl mx-auto space-y-8 pt-10">
                <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Seva Fulfilment</h1>
                        <p className="text-slate-400 mt-1">Track and mark completed sevas</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        <label className="text-sm font-medium text-slate-300">Scheduled Date:</label>
                        <input 
                            type="date" 
                            className="bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none [color-scheme:dark]"
                            value={displayDateValue}
                            onChange={handleDateChange}
                        />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-400">Loading registrations...</div>
                    ) : filteredRegistrations.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            No sevas scheduled for this date.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {filteredRegistrations.map(reg => (
                                <div key={reg.RegistrationId} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-semibold text-white">{reg.devotee?.Name || `Devotee #${reg.DevoteeId}`}</h3>
                                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-slate-300 font-medium tracking-wide">
                                                {reg.seva?.Description || reg.SevaCode}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-400 mt-2 flex gap-4">
                                            <span>Reg ID: {reg.RegistrationId}</span>
                                            <span>Qty: {reg.Qty}</span>
                                            {reg.Remarks && <span>Note: {reg.Remarks}</span>}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => toggleFulfilment(reg)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                                            reg.IsFulfilled 
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' 
                                                : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-white'
                                        }`}
                                    >
                                        {reg.IsFulfilled ? <CheckCircle size={20} /> : <Circle size={20} />}
                                        {reg.IsFulfilled ? 'Fulfilled' : 'Mark Fulfilled'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
