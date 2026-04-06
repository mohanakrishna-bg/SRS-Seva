import { Languages } from 'lucide-react';
import { useInputContext } from '../context/InputContext';
import VoiceInputButton from './VoiceInputButton';

interface GlobalInputToolbarProps {
    className?: string; // Optional wrapper styling
}

export default function GlobalInputToolbar({ className = '' }: GlobalInputToolbarProps) {
    const { globalLang, setGlobalLang, dispatchCommand, activeInputId } = useInputContext();

    const handleVoiceResult = (text: string) => {
        if (!text) return;
        dispatchCommand({ text, action: 'insert' });
    };

    const handleTransliterateAll = () => {
        dispatchCommand({ text: '', action: 'transliterate_all' });
    };

    return (
        <div className={`flex items-center gap-1.5 p-1.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-sm backdrop-blur-md ${className}`}>
            <div className="flex bg-black/5 dark:bg-white/10 rounded-lg p-1">
                <button
                    type="button"
                    onClick={() => setGlobalLang('en')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        globalLang === 'en'
                            ? 'bg-white dark:bg-emerald-500 text-emerald-600 dark:text-white shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                >
                    English
                </button>
                <button
                    type="button"
                    onClick={() => setGlobalLang('kn')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        globalLang === 'kn'
                            ? 'bg-white dark:bg-orange-500 text-orange-600 dark:text-white shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                >
                    ಕನ್ನಡ
                </button>
            </div>

            <div className="w-px h-5 bg-[var(--glass-border)] mx-0.5" />

            <div className="flex items-center gap-1">
                <VoiceInputButton
                    onResult={handleVoiceResult}
                    lang={globalLang === 'kn' ? 'kn-IN' : 'en-IN'}
                />

                <button
                    type="button"
                    onClick={handleTransliterateAll}
                    disabled={!activeInputId}
                    className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Translate field to Kannada"
                >
                    <Languages size={18} />
                </button>
            </div>
        </div>
    );
}
