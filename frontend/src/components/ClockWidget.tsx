import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ClockWidget() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'

        const strMin = minutes < 10 ? '0' + minutes : minutes;
        const strSec = seconds < 10 ? '0' + seconds : seconds;

        return { hours, strMin, strSec, ampm };
    };

    const { hours, strMin, strSec, ampm } = formatTime(time);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card flex flex-col items-center justify-center p-6 mb-6"
        >
            <div className="font-mono flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-black tracking-tight text-[var(--primary)] drop-shadow-md">
                    {hours}:{strMin}
                </span>
                <div className="flex flex-col items-start gap-1">
                    <span className="text-sm font-bold text-[var(--text-secondary)] tracking-widest bg-black/5 px-2 py-0.5 rounded-md">
                        {ampm}
                    </span>
                    <span className="text-xs font-medium text-[var(--text-secondary)]/50 font-mono pl-1">
                        {strSec}s
                    </span>
                </div>
            </div>
            <div className="mt-3 text-sm text-[var(--text-secondary)] font-medium">
                {time.toLocaleDateString('kn-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </motion.div>
    );
}
