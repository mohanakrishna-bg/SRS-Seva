import { useState, useEffect, useId, useRef } from 'react';
import { ReactTransliterate } from 'react-transliterate';
import 'react-transliterate/dist/index.css';
import { transliterateToKannada } from '../transliterate';
import { useInputContext } from '../context/InputContext';

interface TransliteratedInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    multiline?: boolean;
    className?: string;
    id?: string;
    type?: string;
    enableVoice?: boolean; // Kept for compatibility but controlled globally
    disableTransliteration?: boolean;
    list?: string;
}

export default function TransliteratedInput({
    value,
    onChange,
    placeholder,
    multiline,
    className,
    id,
    type = 'text',
    disableTransliteration = false,
    list,
}: TransliteratedInputProps) {
    const defaultId = useId();
    const componentId = id || defaultId;
    
    const { globalLang, latestCommand, clearCommand, activeInputId, setActiveInputId } = useInputContext();
    
    const [isTransliterating, setIsTransliterating] = useState(false);
    const [cursorPos, setCursorPos] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    const activeLang = disableTransliteration ? 'en' : globalLang;

    // Listen for commands from the Global Toolbar
    useEffect(() => {
        if (activeInputId !== componentId || !latestCommand) return;

        const processCommand = async () => {
            if (latestCommand.action === 'insert') {
                const text = latestCommand.text;
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
                
                // Keep focus
                if (inputRef.current) {
                    setTimeout(() => {
                        inputRef.current?.focus();
                        inputRef.current?.setSelectionRange(newPos, newPos);
                    }, 50);
                }
            } else if (latestCommand.action === 'transliterate_all') {
                await handleTransliterateAll();
            }
            clearCommand();
        };

        processCommand();
    }, [latestCommand, activeInputId, componentId, cursorPos, value, onChange, clearCommand]);

    const handleFocus = () => {
        setActiveInputId(componentId);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCursorPos(e.target.selectionStart);
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCursorPos((e.target as any).selectionStart);
    };

    const handleTransliterateAll = async () => {
        if (!value || !/[a-zA-Z]/.test(value)) return;
        setIsTransliterating(true);
        try {
            // Transliterate selected text if any, else whole text
            let textToProcess = value;
            let startIndex = 0;
            let endIndex = value.length;
            
            if (inputRef.current) {
                const el = inputRef.current;
                if (el.selectionStart !== null && el.selectionEnd !== null && el.selectionStart !== el.selectionEnd) {
                    startIndex = el.selectionStart;
                    endIndex = el.selectionEnd;
                    textToProcess = value.slice(startIndex, endIndex);
                }
            }

            const regex = /([a-zA-Z]+)/g;
            const parts = textToProcess.split(regex);

            const translatedParts = await Promise.all(
                parts.map(async (part) => {
                    if (/[a-zA-Z]/.test(part)) {
                        return await transliterateToKannada(part);
                    }
                    return part;
                })
            );

            const finalTransliterated = translatedParts.join('');
            
            // Reconstruct value
            const newValue = value.slice(0, startIndex) + finalTransliterated + value.slice(endIndex);
            onChange(newValue);
            
            // Keep focus and fix cursor
            const newPos = startIndex + finalTransliterated.length;
            setCursorPos(newPos);
            if (inputRef.current) {
                setTimeout(() => {
                    inputRef.current?.focus();
                    inputRef.current?.setSelectionRange(newPos, newPos);
                }, 50);
            }
        } catch { /* ignore */ }
        setIsTransliterating(false);
    };

    const baseInputClassName = `w-full px-3 py-2.5 rounded-lg bg-[var(--glass-bg)] border ${activeInputId === componentId ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/30' : 'border-[var(--glass-border)]'} text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30 transition-all ${className || ''}`;

    const renderInputProps = {
        placeholder,
        className: baseInputClassName,
        id: componentId,
        lang: activeLang === 'kn' ? 'kn' : 'en',
        list,
    };

    return (
        <div className={`relative ${multiline ? 'items-start' : 'items-center'} w-full`}>
            <div className={`flex-1 relative ${isTransliterating ? 'opacity-70 pointer-events-none' : ''}`}>
                {activeLang === 'kn' && !disableTransliteration ? (
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
                                onFocus: (e: any) => {
                                    handleFocus();
                                    if (props.onFocus) props.onFocus(e as any);
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
                                return <textarea ref={(el) => { (inputRef as any).current = el; if (typeof props.ref === 'function') (props as any).ref(el); }} {...mergedProps} rows={3} className={`${mergedProps.className} resize-none`} />;
                            }
                            return <input ref={(el) => { (inputRef as any).current = el; if (typeof props.ref === 'function') (props as any).ref(el); }} {...mergedProps} type={type} />;
                        }}
                    />
                ) : (
                    multiline ? (
                        <textarea
                            ref={inputRef as React.Ref<HTMLTextAreaElement>}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            {...renderInputProps}
                            onBlur={handleBlur}
                            onFocus={handleFocus}
                            onClick={handleSelect}
                            onKeyUp={handleSelect}
                            rows={3}
                            className={`${renderInputProps.className} resize-none`}
                        />
                    ) : (
                        <input
                            ref={inputRef as React.Ref<HTMLInputElement>}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            {...renderInputProps}
                            onBlur={handleBlur}
                            onFocus={handleFocus}
                            onClick={handleSelect}
                            onKeyUp={handleSelect}
                            type={type}
                        />
                    )
                )}
            </div>
        </div>
    );
}
