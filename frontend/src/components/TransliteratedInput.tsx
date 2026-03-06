import { useState } from 'react';
import { ReactTransliterate } from 'react-transliterate';
import 'react-transliterate/dist/index.css';
import { Languages } from 'lucide-react';
import { transliterateToKannada } from '../transliterate';
import VoiceInputButton from './VoiceInputButton';

interface TransliteratedInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    multiline?: boolean;
    className?: string;
    id?: string;
    type?: string;
    enableVoice?: boolean;
    disableTransliteration?: boolean;
}

export default function TransliteratedInput({
    value,
    onChange,
    placeholder,
    multiline,
    className,
    id,
    type = 'text',
    enableVoice,
    disableTransliteration = false,
}: TransliteratedInputProps) {
    const [lang, setLang] = useState<'en' | 'kn'>(disableTransliteration ? 'en' : 'kn');
    const [isTransliterating, setIsTransliterating] = useState(false);
    const [cursorPos, setCursorPos] = useState<number | null>(null);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCursorPos(e.target.selectionStart);
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCursorPos((e.target as any).selectionStart);
    };

    const handleVoiceResult = (text: string) => {
        if (!text) return;

        let newValue;
        let newPos;

        if (cursorPos !== null && cursorPos >= 0 && cursorPos <= value.length) {
            const before = value.slice(0, cursorPos);
            const after = value.slice(cursorPos);
            const padBefore = before && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
            const padAfter = after && !after.startsWith(' ') && !after.startsWith('\n') ? ' ' : '';
            const insertedText = padBefore + text + padAfter;

            newValue = before + insertedText + after;
            newPos = cursorPos + insertedText.length;
        } else {
            const padBefore = value && !value.endsWith(' ') && !value.endsWith('\n') ? ' ' : '';
            newValue = value + padBefore + text;
            newPos = newValue.length;
        }

        onChange(newValue);
        setCursorPos(newPos);
    };

    const handleTransliterateAll = async () => {
        if (!value || !/[a-zA-Z]/.test(value)) return;
        setIsTransliterating(true);
        try {
            // Split by English words vs everything else to preserve existing Kannada/symbols
            const regex = /([a-zA-Z]+)/g;
            const parts = value.split(regex);

            const translatedParts = await Promise.all(
                parts.map(async (part) => {
                    if (/[a-zA-Z]/.test(part)) {
                        return await transliterateToKannada(part);
                    }
                    return part;
                })
            );

            onChange(translatedParts.join(''));
            setLang('kn');
        } catch { /* ignore */ }
        setIsTransliterating(false);
    };

    const hasEnglishLetters = /[a-zA-Z]/.test(value);

    const baseInputClassName = `w-full px-3 py-2.5 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30 transition-all ${className || ''}`;

    const renderInputProps = {
        placeholder,
        className: baseInputClassName,
        id,
        lang: lang === 'kn' ? 'kn' : 'en',
    };

    return (
        <div className={`flex gap-2 ${multiline ? 'items-start' : 'items-center'} w-full`}>
            <div className="flex-1 relative">
                {lang === 'kn' && !disableTransliteration ? (
                    <ReactTransliterate
                        value={value}
                        onChangeText={onChange}
                        lang="kn"
                        containerClassName="w-full"
                        renderComponent={(props) => {
                            const mergedProps = {
                                ...props,
                                ...renderInputProps,
                                onBlur: (e: any) => {
                                    handleBlur(e);
                                    if (props.onBlur) props.onBlur(e as any);
                                },
                                onClick: (e: any) => {
                                    handleSelect(e);
                                    if (props.onClick) props.onClick(e as any);
                                },
                                onKeyUp: (e: any) => {
                                    handleSelect(e);
                                    if (props.onKeyUp) props.onKeyUp(e as any);
                                },
                                className: `${props.className || ''} ${renderInputProps.className}`.trim()
                            };

                            if (multiline) {
                                return <textarea {...mergedProps} rows={3} className={`${mergedProps.className} resize-none`} />;
                            }
                            return <input {...mergedProps} type={type} />;
                        }}
                    />
                ) : (
                    multiline ? (
                        <textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            {...renderInputProps}
                            onBlur={handleBlur}
                            onClick={handleSelect}
                            onKeyUp={handleSelect}
                            rows={3}
                            className={`${renderInputProps.className} resize-none`}
                        />
                    ) : (
                        <input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            {...renderInputProps}
                            onBlur={handleBlur}
                            onClick={handleSelect}
                            onKeyUp={handleSelect}
                            type={type}
                        />
                    )
                )}
            </div>

            <div className={`flex ${multiline ? 'flex-col' : ''} gap-1 shrink-0`}>
                {enableVoice && (
                    <VoiceInputButton
                        onResult={handleVoiceResult}
                        lang={lang === 'kn' ? 'kn-IN' : 'en-IN'}
                    />
                )}
                {!disableTransliteration && (
                    <>
                        <button
                            type="button"
                            onClick={() => setLang('en')}
                            className={`min-w-[32px] px-2 py-2 rounded-lg border text-xs font-bold transition-colors ${lang === 'en'
                                ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'
                                : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'
                                }`}
                            title="English"
                        >
                            E
                        </button>
                        <button
                            type="button"
                            onClick={() => setLang('kn')}
                            className={`min-w-[32px] px-2 py-2 rounded-lg border text-xs font-bold transition-colors ${lang === 'kn'
                                ? 'bg-[var(--accent-saffron)]/10 border-[var(--accent-saffron)]/30 text-[var(--accent-saffron)]'
                                : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]'
                                }`}
                            title="ಕನ್ನಡ"
                        >
                            K
                        </button>
                        {hasEnglishLetters && (
                            <button
                                type="button"
                                onClick={handleTransliterateAll}
                                disabled={isTransliterating}
                                className="px-2 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1 min-w-[32px]"
                                title="Translate to Kannada"
                            >
                                <Languages size={14} />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
