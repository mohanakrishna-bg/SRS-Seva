import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface Highlight {
    id: number;
    text: string;
    time?: string;
}

interface SpecialEventsCardProps {
    date?: Date;
    onRegisterSpecialEvent?: (eventName: string) => void;
}

export default function SpecialEventsCard({ date, onRegisterSpecialEvent }: SpecialEventsCardProps) {
    const [specialEvents, setSpecialEvents] = useState<Highlight[]>([]);
    const [loading, setLoading] = useState(true);

    const activeDate = date || new Date();

    useEffect(() => {
        setLoading(true);
        try {
            const dateStr = activeDate.toDateString();
            const eventsKey = `seva_highlights_kn_${dateStr}`;
            const storedEvents = localStorage.getItem(eventsKey);
            if (storedEvents) {
                setSpecialEvents(JSON.parse(storedEvents));
            } else {
                setSpecialEvents([]);
            }
        } catch {
            setSpecialEvents([]);
        } finally {
            setLoading(false);
        }
    }, [activeDate.toDateString()]);

    if (loading) return null;

    if (specialEvents.length === 0) {
        return null; // Don't render if no special events
    }

    return (
        <div className="glass-card relative overflow-hidden flex flex-col gap-4 border-2 border-[var(--accent-saffron)]/30 w-full h-full">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-saffron)]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-2 mb-2 text-[var(--primary)]">
                <Sparkles size={20} className="text-[var(--accent-saffron)]" />
                <h3 className="font-bold text-lg md:text-xl">ವಿಶೇಷ ಘಟನೆಗಳು (Special Events)</h3>
            </div>

            <div className="relative z-10 space-y-3 flex-1">
                {specialEvents.map((evt) => (
                    <div key={evt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] p-4 rounded-xl group/event hover:border-[var(--accent-saffron)]/50 transition-colors">
                        <div className="flex-1">
                            <p className="font-bold text-[var(--text-primary)] text-sm md:text-base">{evt.text}</p>
                            {evt.time && <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1 font-mono bg-black/5 dark:bg-white/5 inline-block px-2 py-0.5 rounded-md">{evt.time}</p>}
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onRegisterSpecialEvent) onRegisterSpecialEvent(evt.text);
                            }}
                            className="shrink-0 px-4 py-2 rounded-lg bg-[var(--accent-saffron)] text-white text-sm font-bold shadow-md hover:bg-orange-600 transition-colors hover:shadow-lg active:scale-95"
                        >
                            ನೋಂದಾಯಿಸಿ (Register)
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
