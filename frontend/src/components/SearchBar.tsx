import { useState, useEffect, useCallback } from 'react';
import { Search, Mic, X } from 'lucide-react';

interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    debounceMs?: number;
}

export default function SearchBar({ placeholder = 'Search...', onSearch, debounceMs = 300 }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query);
        }, debounceMs);
        return () => clearTimeout(timer);
    }, [query, debounceMs, onSearch]);

    const startVoiceSearch = useCallback(() => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        setIsListening(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    }, []);

    return (
        <div className="relative flex items-center w-full max-w-md">
            <Search size={18} className="absolute left-4 text-slate-500 pointer-events-none" />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-11 pr-20 py-3 rounded-xl bg-white border border-black/10 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all text-sm"
            />
            <div className="absolute right-2 flex items-center gap-1">
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="p-1.5 rounded-lg hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
                <button
                    onClick={startVoiceSearch}
                    className={`p-1.5 rounded-lg transition-all ${isListening
                        ? 'text-red-500 bg-red-500/10 animate-pulse'
                        : 'text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-black/5'
                        }`}
                    title="Voice search"
                >
                    <Mic size={16} />
                </button>
            </div>
        </div>
    );
}
