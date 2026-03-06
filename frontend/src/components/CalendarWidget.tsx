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

    const daysOfWeek = ['ಭಾನು', 'ಸೋಮ', 'ಮಂಗಳ', 'ಬುಧ', 'ಗುರು', 'ಶುಕ್ರ', 'ಶನಿ'];

    return (
        <div className="glass-card flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4">
                <button onClick={prevMonth} className="p-1 rounded-full hover:bg-black/5 text-[var(--text-secondary)] transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-[var(--primary)]" />
                    <h3 className="font-bold text-lg">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                </div>
                <button onClick={nextMonth} className="p-1 rounded-full hover:bg-black/5 text-[var(--text-secondary)] transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 w-full text-center mb-2">
                {daysOfWeek.map((day) => (
                    <div key={day} className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 w-full">
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
                aspect-square flex items-center justify-center p-2 rounded-lg text-sm transition-all relative
                ${selected ? 'bg-[var(--primary)] text-white font-bold shadow-md' : 'hover:bg-black/5 text-[var(--text-primary)]'}
                ${today && !selected ? 'border border-[var(--primary)] text-[var(--primary)] font-bold' : ''}
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
