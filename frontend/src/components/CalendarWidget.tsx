import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarWidgetProps {
    selectedDate: Date;
    onChange: (date: Date) => void;
}

export default function CalendarWidget({ selectedDate, onChange }: CalendarWidgetProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const isToday = (day: number) => {
        const d = new Date();
        return d.getDate() === day && d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    };

    const isSelected = (day: number) => {
        return selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
    };

    const handleDateClick = (day: number) => {
        onChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    };

    const monthNames = [
        'ಜನೆವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್',
        'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್'
    ];

    const daysOfWeek = ['ಭಾನುವಾರ', 'ಸೋಮವಾರ', 'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ', 'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ'];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col items-center shadow-2xl min-w-[320px]">
            <div className="flex items-center justify-between w-full mb-6">
                <button onClick={prevMonth} className="p-2 rounded-full hover:bg-black/5 text-[var(--text-secondary)] transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <CalendarIcon size={20} className="text-[var(--primary)]" />
                    <h3 className="font-extrabold text-xl tracking-tight">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                </div>
                <button onClick={nextMonth} className="p-2 rounded-full hover:bg-black/5 text-[var(--text-secondary)] transition-colors">
                    <ChevronRight size={24} />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 w-full text-center mb-4">
                {daysOfWeek.map((day) => (
                    <div key={day} className="text-[10px] font-bold text-[var(--text-secondary)]/60 uppercase tracking-tighter">
                        {day.substring(0, 1)}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2 w-full">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const selected = isSelected(day);
                    const today = isToday(day);
                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`
                aspect-square flex items-center justify-center p-3 rounded-xl text-base transition-all relative font-medium
                ${selected ? 'bg-[var(--primary)] text-white font-bold shadow-lg scale-110 z-10' : 'hover:bg-black/5 text-[var(--text-primary)]'}
                ${today && !selected ? 'ring-2 ring-[var(--primary)] text-[var(--primary)] font-bold' : ''}
              `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
