import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'en' | 'kn';

interface FormattedText {
    text: string;
    action: 'insert' | 'transliterate_all';
}

interface InputContextType {
    globalLang: Language;
    setGlobalLang: (lang: Language) => void;
    latestCommand: FormattedText | null;
    clearCommand: () => void;
    dispatchCommand: (command: FormattedText) => void;
    // Registry of active input focus
    activeInputId: string | null;
    setActiveInputId: (id: string | null) => void;
}

const InputContext = createContext<InputContextType | undefined>(undefined);

export function InputProvider({ children }: { children: ReactNode }) {
    const [globalLang, setGlobalLang] = useState<Language>('kn');
    const [latestCommand, setLatestCommand] = useState<FormattedText | null>(null);
    const [activeInputId, setActiveInputId] = useState<string | null>(null);

    const clearCommand = () => setLatestCommand(null);
    
    const dispatchCommand = (command: FormattedText) => {
        setLatestCommand(command);
    };

    return (
        <InputContext.Provider value={{
            globalLang,
            setGlobalLang,
            latestCommand,
            clearCommand,
            dispatchCommand,
            activeInputId,
            setActiveInputId
        }}>
            {children}
        </InputContext.Provider>
    );
}

export function useInputContext() {
    const context = useContext(InputContext);
    if (context === undefined) {
        throw new Error('useInputContext must be used within an InputProvider');
    }
    return context;
}
