import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check, Pencil, Sparkles } from 'lucide-react';
import TransliteratedInput from './TransliteratedInput';
import GlobalInputToolbar from './GlobalInputToolbar';

interface Highlight {
    id: number;
    text: string;
    time?: string;
}

interface EventModalProps {
    isOpen: boolean;
    date: Date;
    onClose: () => void;
}

export default function EventModal({ isOpen, date, onClose }: EventModalProps) {
    const [events, setEvents] = useState<Highlight[]>([]);

    // Add/Edit State
    const [isAdding, setIsAdding] = useState(false);
    const [newText, setNewText] = useState('');
    const [newTime, setNewTime] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [editTime, setEditTime] = useState('');


    const getStorageKey = () => `seva_highlights_kn_${date.toDateString()}`;

    useEffect(() => {
        if (!isOpen) return;

        // Load Events
        const storedEvents = localStorage.getItem(getStorageKey());
        if (storedEvents) {
            try { setEvents(JSON.parse(storedEvents)); } catch { setEvents([]); }
        } else {
            setEvents([]);
        }


    }, [isOpen, date.toDateString()]);

    const saveEvents = (items: Highlight[]) => {
        setEvents(items);
        localStorage.setItem(getStorageKey(), JSON.stringify(items));
    };

    const handleAdd = () => {
        if (!newText.trim()) return;
        const item: Highlight = { id: Date.now(), text: newText.trim(), time: newTime.trim() || undefined };
        saveEvents([...events, item]);
        setNewText('');
        setNewTime('');
        setIsAdding(false);
    };

    const handleRemove = (id: number) => saveEvents(events.filter((e) => e.id !== id));

    const startEditing = (h: Highlight) => {
        setEditingId(h.id);
        setEditText(h.text);
        setEditTime(h.time || '');
    };

    const saveEdit = () => {
        if (!editText.trim() || !editingId) return;
        saveEvents(events.map((h) => h.id === editingId ? { ...h, text: editText.trim(), time: editTime.trim() || undefined } : h));
        setEditingId(null);
        setEditText('');
        setEditTime('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[var(--glass-border)] overflow-hidden flex flex-col md:flex-row min-h-[400px]"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-[var(--primary)] to-amber-500 p-4 md:p-6 text-white relative flex-shrink-0 flex items-center justify-between">
                        <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-[url('/pattern.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                        <h2 className="text-xl md:text-2xl font-black relative z-10 flex items-center gap-2">
                            <Sparkles size={24} />
                            ವಿಶೇಷ ಸೇವೆಗಳು / ಘಟನೆಗಳು ಸಂಪಾದಿಸಿ
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors relative z-10"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-6">



                        {/* Events Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div></div>
                                <div className="flex items-center gap-3">
                                    <GlobalInputToolbar />
                                    <button
                                        onClick={() => setIsAdding(!isAdding)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-all shadow-sm"
                                    >
                                        {isAdding ? <X size={14} /> : <Plus size={14} />}
                                        {isAdding ? 'ರದ್ದುಗೊಳಿಸಿ' : 'ಸೇರಿಸಿ'}
                                    </button>
                                </div>
                            </div>

                            {/* Add Form */}
                            {isAdding && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] rounded-xl p-4 mb-4 space-y-3"
                                >
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">ವಿವರಣೆ</label>
                                        <TransliteratedInput
                                            value={newText}
                                            onChange={(val) => setNewText(val)}
                                            placeholder="ಘಟನೆಯ ವಿವರಣೆ..."
                                            multiline={true}
                                            enableVoice={true}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">ಸಮಯ (ಐಚ್ಛಿಕ)</label>
                                        <TransliteratedInput
                                            value={newTime}
                                            onChange={(val) => setNewTime(val)}
                                            placeholder="ಉದಾ: 10:00 AM"
                                            enableVoice={true}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button onClick={handleAdd} className="px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[var(--primary-hover)] transition-all">
                                            <Check size={16} /> ಉಳಿಸಿ
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Events List */}
                            <div className="space-y-3">
                                {events.map((h) => (
                                    <div key={h.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-[var(--glass-border)] rounded-xl p-3 group">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shrink-0" />

                                        {editingId === h.id ? (
                                            <div className="flex-1 flex flex-col gap-2">
                                                <TransliteratedInput value={editText} onChange={setEditText} placeholder="ಸೇವಾ ಹೆಸರು" />
                                                <TransliteratedInput value={editTime} onChange={setEditTime} placeholder="ಸಮಯ" />
                                                <div className="flex shrink-0 gap-1 justify-end">
                                                    <button onClick={saveEdit} className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-bold text-xs">ಉಳಿಸಿ</button>
                                                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-black/5 text-[var(--text-secondary)] hover:bg-black/10 transition-all font-bold text-xs">✕</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm md:text-base font-medium text-[var(--text-primary)] whitespace-pre-line">{h.text}</h4>
                                                    {h.time && <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">{h.time}</p>}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                                    <button onClick={() => startEditing(h)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleRemove(h.id)} className="p-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {events.length === 0 && !isAdding && (
                                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 border border-dashed border-[var(--glass-border)] rounded-2xl">
                                        <Sparkles className="mx-auto text-[var(--text-secondary)] opacity-40 mb-2" size={24} />
                                        <p className="text-sm text-[var(--text-secondary)]">ಯಾವುದೇ ವಿಶೇಷ ಘಟನೆಗಳಿಲ್ಲ</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}


