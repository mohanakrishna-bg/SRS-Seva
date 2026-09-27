import { Globe } from 'lucide-react';
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

    const toggleLanguage = () => {
        setGlobalLang(globalLang === 'kn' ? 'en' : 'kn');
    };

    return (
        <div className={`flex items-center gap-1.5 p-1.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-sm backdrop-blur-md ${className}`}>
            <div className="relative">
                <button
                    type="button"
                    onClick={toggleLanguage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[var(--text-primary)] border border-transparent hover:border-[var(--glass-border)] shadow-sm cursor-pointer"
                    title={globalLang === 'kn' ? "ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಿಸಿ (Click to switch to English)" : "ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ (Click to switch to Kannada)"}
                >
                    <Globe size={13} className="text-[var(--primary)]" />
                    {globalLang === 'kn' ? (
                        <span className="flex items-center gap-1">
                            <span className="text-orange-600 dark:text-orange-400 font-extrabold">ಕನ್ನಡ</span>
                            <span className="text-[10px] text-[var(--text-secondary)] font-normal">→ English</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">English</span>
                            <span className="text-[10px] text-[var(--text-secondary)] font-normal">→ ಕನ್ನಡ</span>
                        </span>
                    )}
                </button>
                
                <div className="absolute -top-2 -right-2">
                    <ContextHelp 
                        title="Input Language (ಬೆರಳಚ್ಚು ಭಾಷೆ)" 
                        content="ಕನ್ನಡ ಮೋಡ್: ಫೋನೆಟಿಕ್ ಟೈಪಿಂಗ್ (ಉದಾ: 'namaskaara' -> 'ನಮಸ್ಕಾರ'). English mode: Standard typing. ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಭಾಷೆ ಬದಲಿಸಿ."
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
                    title="Voice Typing (ಧ್ವನಿ ಬೆರಳಚ್ಚು)" 
                    content="ಧ್ವನಿ ಮೂಲಕ ಟೈಪ್ ಮಾಡಲು ಮೈಕ್ರೊಫೋನ್ ಕ್ಲಿಕ್ ಮಾಡಿ. ಕನ್ನಡ ಮೋಡ್‌ನಲ್ಲಿ ಕನ್ನಡ ಮಾತುಗಳನ್ನು ಗ್ರಹಿಸುತ್ತದೆ, ಇಂಗ್ಲಿಷ್ ಮೋಡ್‌ನಲ್ಲಿ ಇಂಗ್ಲಿಷ್ ಮಾತುಗಳನ್ನು ಗ್ರಹಿಸುತ್ತದೆ."
                />
            </div>
        </div>
    );
}
