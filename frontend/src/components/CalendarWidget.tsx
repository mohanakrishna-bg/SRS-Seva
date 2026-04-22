import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarWidgetProps {
    selectedDate: Date;
    onChange: (date: Date) => void;
    compact?: boolean;
}

export default function CalendarWidget({ selectedDate, onChange, compact = false }: CalendarWidgetProps) {
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

    const daysOfWeek = ['ಭಾ', 'ಸೋ', 'ಮಂ', 'ಬು', 'ಗು', 'ಶು', 'ಶನಿ'];

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl flex flex-col items-center h-full ${compact ? 'p-2 w-full' : 'p-6 shadow-2xl min-w-[320px]'}`}>
            <div className={`flex items-center justify-between w-full ${compact ? 'mb-2' : 'mb-6'}`}>
                <button onClick={prevMonth} className={`${compact ? 'p-1' : 'p-2'} rounded-full hover:bg-black/5 text-[var(--text-secondary)] transition-colors`}>
                    <ChevronLeft size={compact ? 16 : 24} />
                </button>
                <div className="flex items-center gap-2">
                    {!compact && <CalendarIcon size={20} className="text-[var(--primary)]" />}
                    <h3 className={`font-black tracking-tighter ${compact ? 'text-[13px]' : 'text-xl'}`}>
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                </div>
                <button onClick={nextMonth} className={`${compact ? 'p-1' : 'p-2'} rounded-full hover:bg-black/5 text-[var(--text-secondary)] transition-colors`}>
                    <ChevronRight size={compact ? 16 : 24} />
                </button>
            </div>

            <div className={`grid grid-cols-7 ${compact ? 'gap-1' : 'gap-2'} w-full text-center ${compact ? 'mb-2' : 'mb-4'}`}>
                {daysOfWeek.map((day) => (
                    <div key={day} className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-bold text-[var(--text-secondary)]/60 uppercase tracking-tighter`}>
                        {day}
                    </div>
                ))}
            </div>

            <div className={`grid grid-cols-7 ${compact ? 'gap-1' : 'gap-2'} w-full`}>
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className={compact ? 'p-1' : 'p-2'} />
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
                aspect-square flex items-center justify-center rounded-lg transition-all relative font-medium
                ${compact ? 'text-xs p-1' : 'text-base p-3 rounded-xl'}
                ${selected ? 'bg-[var(--primary)] text-white font-bold shadow-md scale-105 z-10' : 'hover:bg-black/5 text-[var(--text-primary)]'}
                ${today && !selected ? 'ring-1 ring-[var(--primary)] text-[var(--primary)] font-bold' : ''}
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
