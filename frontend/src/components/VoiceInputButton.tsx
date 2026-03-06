import { useState, useCallback, useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';

interface VoiceInputButtonProps {
    /** Called with the recognized text */
    onResult: (text: string) => void;
    /** Language - defaults to kn-IN (Kannada) */
    lang?: string;
    /** Optional error handler */
    onError?: (msg: string) => void;
    /** Additional CSS classes */
    className?: string;
    /** Size of mic icon */
    size?: number;
}

/**
 * A mic button that listens for voice and calls onResult with the transcript.
 * Press once to start, presses again or speech ends to stop.
 */
export default function VoiceInputButton({
    onResult,
    lang = 'kn-IN',
    onError,
    className = '',
    size = 14,
}: VoiceInputButtonProps) {
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const onResultRef = useRef(onResult);
    const keepListeningRef = useRef(false);

    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    useEffect(() => {
        return () => {
            keepListeningRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors on unmount
                }
            }
        };
    }, []);

    const toggle = useCallback(() => {
        if (listening) {
            keepListeningRef.current = false;
            recognitionRef.current?.stop();
            setListening(false);
            return;
        }

        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            onError?.('ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಬೆಂಬಲಿಲ್ಲ');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.interimResults = false;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setListening(true);
        recognition.onresult = (e: any) => {
            let finalTranscript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) {
                    finalTranscript += e.results[i][0].transcript;
                }
            }
            if (finalTranscript.trim()) {
                onResultRef.current(finalTranscript.trim());
            }
        };
        recognition.onerror = (e: any) => {
            if (e.error !== 'aborted' && e.error !== 'no-speech') {
                onError?.(`ಧ್ವನಿ ದೋಷ: ${e.error}`);
            }
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                keepListeningRef.current = false;
            }
        };
        recognition.onend = () => {
            if (keepListeningRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    setListening(false);
                    keepListeningRef.current = false;
                }
            } else {
                setListening(false);
            }
        };

        keepListeningRef.current = true;
        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch (e) {
            setListening(false);
            keepListeningRef.current = false;
        }
    }, [listening, lang, onError]);

    return (
        <button
            type="button"
            onClick={toggle}
            className={`p-2 rounded-lg border transition-all shrink-0 ${listening
                ? 'bg-red-50 border-red-400 text-red-500 animate-pulse'
                : 'bg-white border-black/10 text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--primary)]'
                } ${className}`}
            title={listening ? 'ನಿಲ್ಲಿಸಿ' : 'ಧ್ವನಿ ಇನ್‌ಪುಟ್'}
        >
            <Mic size={size} />
        </button>
    );
}
