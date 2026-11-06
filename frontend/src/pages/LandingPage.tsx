import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { Sparkles, CalendarPlus } from 'lucide-react';
import EeDinaCard from '../components/EeDinaCard';
import DaysHighlightsCard from '../components/DaysHighlightsCard';
import type { LayoutContextType } from '../components/Layout';

export default function LandingPage() {
    const { openRegModal } = useOutletContext<LayoutContextType>();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
    };

    return (
        <div className="w-full px-2 md:px-4 py-3 relative z-10">
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex flex-col gap-4 w-full"
            >
                {/* ── Quick Action Hero Banner: Immediate Seva Booking CTA ── */}
                <div className="w-full p-4 md:p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-orange-950/10 border border-orange-200/80 dark:border-orange-800/40 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-amber-500 flex items-center justify-center text-white shadow-md shadow-[var(--primary)]/20 shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base md:text-lg font-bold text-[var(--text-primary)]">
                                ಸೇವಾ ನೋಂದಣಿ
                            </h2>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                                ಭಕ್ತರ ಸೇವಾ ವಿವರಗಳನ್ನು ತ್ವರಿತವಾಗಿ ನೋಂದಾಯಿಸಿ ಮತ್ತು ರಸೀದಿ ಪಡೆಯಿರಿ
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        data-testid="landing-book-seva-btn"
                        onClick={() => openRegModal()}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-amber-600 hover:from-[var(--primary-hover)] hover:to-amber-500 text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer"
                        title="ಸೇವಾ ನೋಂದಣಿ ಆರಂಭಿಸಿ"
                    >
                        <CalendarPlus className="w-5 h-5 shrink-0" />
                        <span>+ ಸೇವೆ ಬುಕ್ ಮಾಡಿ</span>
                    </button>
                </div>

                {/* EeDinaCard — Fixed height inside component */}
                <div className="w-full shrink-0">
                    <EeDinaCard date={selectedDate || new Date()} onDateChange={handleDateSelect} />
                </div>
                {/* Special Events Dashboard */}
                <div className="w-full shrink-0">
                    <DaysHighlightsCard
                            date={selectedDate || new Date()}
                            onRegisterSpecialEvent={(eventName, eventCode) => {
                                openRegModal(eventName, eventCode);
                            }}
                        />
                </div>
            </motion.section>
        </div>
    );
}
