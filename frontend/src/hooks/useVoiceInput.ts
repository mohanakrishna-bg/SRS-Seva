import { useState, useCallback, useRef } from 'react';

/**
 * Reusable hook for voice input on any text field.
 * Uses the Web Speech API (SpeechRecognition).
 * Returns { isListening, startListening, stopListening, transcript }.
 */
export function useVoiceInput(options?: {
    lang?: string;
    continuous?: boolean;
    onResult?: (transcript: string) => void;
    onError?: (error: string) => void;
}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    const startListening = useCallback(() => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            options?.onError?.('ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿಲ್ಲ');
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        const recognition = new SpeechRecognition();
        recognition.lang = options?.lang || 'kn-IN'; // Kannada by default
        recognition.interimResults = false;
        recognition.continuous = options?.continuous ?? false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: any) => {
            const result = event.results[event.results.length - 1][0].transcript;
            setTranscript(result);
            options?.onResult?.(result);
        };

        recognition.onerror = (event: any) => {
            setIsListening(false);
            if (event.error !== 'aborted') {
                options?.onError?.(`ಧ್ವನಿ ದೋಷ: ${event.error}`);
            }
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    }, [options]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    return { isListening, startListening, stopListening, transcript };
}
