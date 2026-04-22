import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import VoiceInputButton from '../VoiceInputButton';
import { devoteeApi } from '../../api';

interface AutocompleteBarProps {
    onSelect: (devotee: any) => void;
    placeholder?: string;
}

export default function AutocompleteBar({ onSelect, placeholder = 'Search by Name, Phone, or Gotra...' }: AutocompleteBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const res = await devoteeApi.searchBasic(query);
                setResults(res.data);
                setIsOpen(true);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleVoiceResult = (text: string) => {
        setQuery(prev => prev + (prev ? ' ' : '') + text);
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
            <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg px-4 py-2 focus-within:ring-2 focus-within:ring-saffron-500 transition-all">
                <Search className="text-gray-400 mr-2 shrink-0" size={20} />
                <input
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 py-2"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                />
                <VoiceInputButton onResult={handleVoiceResult} size={18} className="ml-2" />
            </div>

            {isOpen && (query.trim().length >= 2) && (
                <div className="absolute z-50 w-full mt-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-300">Searching...</div>
                    ) : results.length > 0 ? (
                        <ul className="py-2">
                            {results.map((devotee) => (
                                <li
                                    key={devotee.DevoteeId}
                                    onClick={() => {
                                        onSelect(devotee);
                                        setIsOpen(false);
                                        setQuery('');
                                    }}
                                    className="px-4 py-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                                >
                                    <div className="font-semibold text-white">{devotee.Name}</div>
                                    <div className="text-sm text-gray-300 flex items-center gap-2 mt-1">
                                        {devotee.Phone && <span>📞 {devotee.Phone}</span>}
                                        {devotee.Gotra && <span>• {devotee.Gotra}</span>}
                                        {devotee.Nakshatra && <span>• {devotee.Nakshatra}</span>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-gray-300">
                            No devotees found matching "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
