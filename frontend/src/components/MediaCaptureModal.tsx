import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Modal from './Modal';
import { Camera, Mic, Square, Save, RotateCcw } from 'lucide-react';

interface MediaCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'photo' | 'audio';
    onCapture: (file: File) => void;
    title?: string;
}

export default function MediaCaptureModal({
    isOpen,
    onClose,
    type,
    onCapture,
    title = type === 'photo' ? 'ಕ್ಯಾಮೆರಾ (Camera)' : 'ರೇಕಾರ್ಡಿಂಗ್ (Audio)',
}: MediaCaptureModalProps) {
    const webcamRef = useRef<Webcam>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [filename, setFilename] = useState('');

    // Format: YYYYMMDD_HHMMSS
    const getDefaultFilename = () => {
        const d = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timestamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        return `Capture_${timestamp}`;
    };

    // --- Photo ---
    const capturePhoto = useCallback(() => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            // Convert base64 to blob
            fetch(imageSrc)
                .then(res => res.blob())
                .then(blob => {
                    setCapturedBlob(blob);
                    setCapturedUrl(URL.createObjectURL(blob));
                    setFilename(getDefaultFilename());
                });
        }
    }, [webcamRef]);

    // --- Audio ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setCapturedBlob(blob);
                setCapturedUrl(URL.createObjectURL(blob));
                setFilename(getDefaultFilename());

                // Stop tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Microphone access denied', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // --- Common ---
    const reset = () => {
        setCapturedBlob(null);
        if (capturedUrl) URL.revokeObjectURL(capturedUrl);
        setCapturedUrl(null);
        setFilename('');
    };

    const handleSave = () => {
        if (!capturedBlob || !filename) return;
        const ext = type === 'photo' ? '.jpg' : '.webm';
        let finalName = filename;
        if (!finalName.endsWith(ext)) finalName += ext;

        const file = new File([capturedBlob], finalName, { type: capturedBlob.type });
        onCapture(file);
        reset();
    };

    const handleClose = () => {
        if (isRecording) stopRecording();
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div className="space-y-4">
                {!capturedBlob ? (
                    <div className="flex flex-col items-center justify-center p-4 bg-black/5 rounded-xl border border-white/10 min-h-[300px]">
                        {type === 'photo' ? (
                            <>
                                <div className="w-full max-w-sm rounded-lg overflow-hidden border border-white/20 mb-4 bg-black">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        videoConstraints={{ facingMode: "environment" }}
                                        className="w-full"
                                    />
                                </div>
                                <button
                                    onClick={capturePhoto}
                                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--primary)] text-white font-bold shadow-lg hover:scale-105 transition-transform"
                                >
                                    <Camera size={20} /> ಕ್ಯಾಪ್ಚರ್ ಮಾಡಿ
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="mb-8 p-6 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                    <Mic size={64} className={isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400'} />
                                </div>
                                {!isRecording ? (
                                    <button
                                        onClick={startRecording}
                                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 text-white font-bold shadow-lg hover:scale-105 transition-transform"
                                    >
                                        <Mic size={20} /> ರೆಕಾರ್ಡ್ ಪ್ರಾರಂಭಿಸಿ
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopRecording}
                                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-700 text-white font-bold shadow-lg hover:bg-slate-800 transition-colors"
                                    >
                                        <Square size={20} className="fill-current text-red-500" /> ರೆಕಾರ್ಡ್ ನಿಲ್ಲಿಸಿ
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-black/10 rounded-xl border border-white/10 flex flex-col items-center justify-center">
                            {type === 'photo' && capturedUrl && (
                                <img src={capturedUrl} alt="Captured" className="max-w-xs w-full rounded-lg shadow-md mb-2" />
                            )}
                            {type === 'audio' && capturedUrl && (
                                <audio src={capturedUrl} controls className="w-full max-w-xs mb-2" />
                            )}
                            <button onClick={reset} className="text-sm text-[var(--primary)] flex items-center gap-1 mt-2 hover:underline">
                                <RotateCcw size={14} /> ಮರುಪ್ರಯತ್ನಿಸಿ
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                                ಫೈಲ್ ಹೆಸರು
                            </label>
                            <input
                                type="text"
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm focus:border-[var(--primary)] focus:outline-none transition-colors"
                                placeholder={`ex: Capture_1234`}
                            />
                        </div>
                    </div>
                )}

                {capturedBlob && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 transition-colors text-sm"
                        >
                            ರದ್ದುಮಾಡಿ
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-saffron)] text-white font-semibold text-sm shadow-lg hover:shadow-orange-500/25 transition-shadow flex items-center gap-2"
                        >
                            <Save size={16} /> ಉಳಿಸಿ
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
