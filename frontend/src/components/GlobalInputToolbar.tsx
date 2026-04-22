import { useInputContext } from '../context/InputContext';
import VoiceInputButton from './VoiceInputButton';
import ContextHelp from './ContextHelp';

interface GlobalInputToolbarProps {
    className?: string; // Optional wrapper styling
}

export default function GlobalInputToolbar({ className = '' }: GlobalInputToolbarProps) {
    const { globalLang, setGlobalLang, dispatchCommand } = useInputContext();

    const handleVoiceResult = (text: string) => {
        if (!text) return;
        dispatchCommand({ text, action: 'insert' });
    };

    return (
        <div className={`flex items-center gap-1.5 p-1.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-sm backdrop-blur-md ${className}`}>
            <div className="flex bg-black/5 dark:bg-white/10 rounded-lg p-1 relative">
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
                
                <div className="absolute -top-2 -right-2">
                    <ContextHelp 
                        title="Input Language" 
                        content="English mode: Standard typing. Kannada mode: Type phonetically (e.g., 'namaskaara') for Kannada script suggestion."
                    />
                </div>
            </div>

            <div className="w-px h-5 bg-[var(--glass-border)] mx-0.5" />

            <div className="flex items-center gap-1">
                <VoiceInputButton
                    onResult={handleVoiceResult}
                    lang={globalLang === 'kn' ? 'kn-IN' : 'en-IN'}
                />
                <ContextHelp 
                    title="Voice Typing" 
                    content="Click the microphone to start speaking. In Kannada mode, it listens for Kannada speech. In English mode, it listens for English. Your words will be typed automatically at the cursor position."
                />
            </div>
        </div>
    );
}
