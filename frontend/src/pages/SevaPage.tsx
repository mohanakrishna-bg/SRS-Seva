/**
 * SevaPage — Seva module content area.
 *
 * Tab strip and "Book Seva" action are now rendered by Layout via navConfig.
 * This component only contains the routable sub-views.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookedSevasTab from '../components/seva/BookedSevasTab';
import SevaReportsTab from '../components/seva/SevaReportsTab';

export default function SevaPage() {
    const { can } = useAuth();

    if (!can('seva')) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-[var(--glass-bg)] border border-red-500/20 rounded-2xl backdrop-blur-md">
                    <div className="text-red-500 mb-2">⚠️</div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">ಪ್ರವೇಶವಿಲ್ಲ</h2>
                    <p className="text-[var(--text-secondary)]">ಸೇವಾ ಸೇವೆಗಳನ್ನು ವೀಕ್ಷಿಸಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col print:h-auto print:block">
            <Routes>
                <Route path="" element={<Navigate to="booked" replace />} />
                <Route path="booked" element={<BookedSevasTab />} />
                <Route path="reports" element={<SevaReportsTab />} />
            </Routes>
        </div>
    );
}
