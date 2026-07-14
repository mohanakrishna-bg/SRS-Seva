import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
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
