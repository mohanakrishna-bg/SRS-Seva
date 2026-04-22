import React, { useState, useEffect } from 'react';
import AutocompleteBar from '../components/ui/AutocompleteBar';
import { sevaApi, registrationApi } from '../api';

export default function BookingDashboard() {
    const [selectedDevotee, setSelectedDevotee] = useState<any | null>(null);
    const [sevas, setSevas] = useState<any[]>([]);
    const [selectedSeva, setSelectedSeva] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadSevas = async () => {
            try {
                const res = await sevaApi.list();
                setSevas(res.data);
            } catch (err) {
                console.error("Failed to load sevas", err);
            }
        };
        loadSevas();
    }, []);

    const handleSelectDevotee = (devotee: any) => {
        setSelectedDevotee(devotee);
    };

    const handleBookSeva = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDevotee || !selectedSeva || !scheduledDate) return;

        setIsSubmitting(true);
        setMessage('');

        // Convert YYYY-MM-DD to DDMMYY as required by SevaRegistration schema
        const parts = scheduledDate.split('-');
        const formattedDate = `${parts[2]}${parts[1]}${parts[0].substring(2)}`;
        
        // Also registration date is today
        const today = new Date();
        const regDate = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getFullYear()).substring(2)}`;

        const sevaObj = sevas.find(s => s.SevaCode === selectedSeva);

        try {
            await registrationApi.create({
                RegistrationDate: regDate,
                SevaDate: formattedDate,
                DevoteeId: selectedDevotee.DevoteeId,
                SevaCode: selectedSeva,
                Qty: 1,
                Rate: sevaObj?.Amount || 0,
                Amount: sevaObj?.Amount || 0,
                GrandTotal: sevaObj?.Amount || 0,
                PaymentMode: "Cash"
            });
            setMessage('Seva booked successfully!');
            setSelectedDevotee(null);
            setSelectedSeva('');
            setScheduledDate('');
        } catch (err) {
            setMessage('Failed to book seva. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-6">
            <div className="max-w-4xl mx-auto space-y-8 pt-10">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white tracking-tight">Seva Booking Dashboard</h1>
                    <p className="text-indigo-200 mt-2">Search for a devotee to get started</p>
                </div>

                <div className="relative z-50">
                    <AutocompleteBar onSelect={handleSelectDevotee} placeholder="Search devotee by name, phone, or gotra..." />
                </div>

                {selectedDevotee && (
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-start border-b border-white/10 pb-6 mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{selectedDevotee.Name}</h2>
                                <p className="text-indigo-200 mt-1">
                                    {selectedDevotee.Phone && <span className="mr-4">📞 {selectedDevotee.Phone}</span>}
                                    {selectedDevotee.Gotra && <span className="mr-4">Gotra: {selectedDevotee.Gotra}</span>}
                                    {selectedDevotee.Nakshatra && <span>Nakshatra: {selectedDevotee.Nakshatra}</span>}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedDevotee(null)}
                                className="text-sm text-white/50 hover:text-white transition-colors"
                            >
                                Change Devotee
                            </button>
                        </div>

                        <form onSubmit={handleBookSeva} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-indigo-200 mb-2">Select Seva</label>
                                    <select 
                                        className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                        value={selectedSeva}
                                        onChange={(e) => setSelectedSeva(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled className="bg-gray-900">-- Choose a Seva --</option>
                                        {sevas.map(seva => (
                                            <option key={seva.SevaCode} value={seva.SevaCode} className="bg-gray-900 text-white">
                                                {seva.Description} (₹{seva.Amount})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-indigo-200 mb-2">Scheduled Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none [color-scheme:dark]"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl backdrop-blur-sm border ${message.includes('success') ? 'bg-green-500/20 border-green-500/50 text-green-200' : 'bg-red-500/20 border-red-500/50 text-red-200'}`}>
                                    {message}
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Booking...' : 'Book Seva'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
