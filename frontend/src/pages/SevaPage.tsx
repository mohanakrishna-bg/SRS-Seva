import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { CalendarRange, ClipboardList, FileBarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BookedSevasTab from '../components/seva/BookedSevasTab';
import SevaReportsTab from '../components/seva/SevaReportsTab';
import RegistrationModal from '../components/RegistrationModal';

export default function SevaPage() {
    const { can } = useAuth();
    const location = useLocation();
    const [regModalOpen, setRegModalOpen] = useState(false);

    if (!can('seva')) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-[var(--glass-bg)] border border-red-500/20 rounded-2xl backdrop-blur-md">
                    <div className="text-red-500 mb-2">⚠️</div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">ಪ್ರವೇಶವಿಲ್ಲ (Access Denied)</h2>
                    <p className="text-[var(--text-secondary)]">ಸೇವಾ ಸೇವೆಗಳನ್ನು ವೀಕ್ಷಿಸಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">ಸೇವಾ ಸೇವೆಗಳು</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Seva-related Services</p>
                </div>
                
                <button
                    onClick={() => setRegModalOpen(true)}
                    className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-[var(--primary)]/20 flex items-center gap-2"
                >
                    <span className="text-lg font-normal">+</span> Book Seva
                </button>
            </header>

            <div className="flex gap-2 mb-6 p-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl w-fit backdrop-blur-md">
                <NavLink
                    to="/seva/booked"
                    className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        isActive || location.pathname === '/seva' 
                            ? 'bg-[var(--primary)] text-white shadow-md' 
                            : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                >
                    <ClipboardList size={16} />
                    View booked sevas
                </NavLink>
                
                <NavLink
                    to="/seva/reports"
                    className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        isActive 
                            ? 'bg-[var(--primary)] text-white shadow-md' 
                            : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                >
                    <FileBarChart2 size={16} />
                    Reports
                </NavLink>
            </div>

            <div className="flex-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg overflow-hidden flex flex-col relative">
                <Routes>
                    <Route path="/" element={<Navigate to="booked" replace />} />
                    <Route path="booked" element={<BookedSevasTab />} />
                    <Route path="reports" element={<SevaReportsTab />} />
                </Routes>
            </div>
            
            <RegistrationModal
                isOpen={regModalOpen}
                onClose={() => setRegModalOpen(false)}
                onSuccess={(data) => {
                    setRegModalOpen(false);
                }}
            />
        </div>
    );
}
