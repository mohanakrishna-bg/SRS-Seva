import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, Check, Pencil } from 'lucide-react';
import TransliteratedInput from './TransliteratedInput';
import GlobalInputToolbar from './GlobalInputToolbar';

interface Highlight {
    id: number;
    text: string;
    time?: string;
}

const defaultHighlights: Highlight[] = [
    { id: 1, text: 'ಬೆಳಗಿನ ಪೂಜೆ', time: '6:30 AM' },
    { id: 2, text: 'ಅಭಿಷೇಕ', time: '8:00 AM' },
    { id: 3, text: 'ಸಂಜೆ ಆರತಿ', time: '6:30 PM' },
];

export default function TodayHighlights({ editable = false, date }: { editable?: boolean, date?: Date }) {
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [newText, setNewText] = useState('');
    const [newTime, setNewTime] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [editTime, setEditTime] = useState('');

    const activeDate = date || new Date();
    const isToday = activeDate.toDateString() === new Date().toDateString();

    const getStorageKey = () => `seva_highlights_kn_${activeDate.toDateString()}`;

    useEffect(() => {
        const key = getStorageKey();
        let stored = localStorage.getItem(key);

        // Migrate old data if it's today and new key doesn't exist
        if (!stored && isToday) {
            stored = localStorage.getItem('seva_highlights_kn');
            if (stored) localStorage.setItem(key, stored);
        }

        if (stored) {
            try { setHighlights(JSON.parse(stored)); } catch { setHighlights(defaultHighlights); }
        } else {
            setHighlights(defaultHighlights);
            localStorage.setItem(key, JSON.stringify(defaultHighlights));
        }
    }, [activeDate.toDateString()]);

    const save = (items: Highlight[]) => {
        setHighlights(items);
        localStorage.setItem(getStorageKey(), JSON.stringify(items));
    };

    const addHighlight = () => {
        if (!newText.trim()) return;
        const item: Highlight = { id: Date.now(), text: newText.trim(), time: newTime.trim() || undefined };
        save([...highlights, item]);
        setNewText('');
        setNewTime('');
        setIsAdding(false);
    };

    const removeHighlight = (id: number) => save(highlights.filter((h) => h.id !== id));

    const startEditing = (h: Highlight) => {
        setEditingId(h.id);
        setEditText(h.text);
        setEditTime(h.time || '');
    };

    const saveEdit = () => {
        if (!editText.trim() || !editingId) return;
        save(highlights.map((h) => h.id === editingId ? { ...h, text: editText.trim(), time: editTime.trim() || undefined } : h));
        setEditingId(null);
        setEditText('');
        setEditTime('');
    };

    const cancelEdit = () => { setEditingId(null); setEditText(''); setEditTime(''); };


    return (
        <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-[var(--primary)]" />
                    <h3 className="font-bold text-lg">ಇಂದಿನ ವಿಶೇಷಗಳು</h3>
                </div>
                <div className="flex items-center gap-3">
                    {editable && <GlobalInputToolbar />}
                    {editable && (
                        <button onClick={() => setIsAdding(!isAdding)}
                            className="p-1.5 rounded-lg hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                            <Plus size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-2.5">
                {highlights.map((h) => (
                    <div key={h.id} className="flex items-center gap-3 group">
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />

                        {editingId === h.id ? (
                            <div className="flex-1 flex flex-col gap-2">
                                <TransliteratedInput value={editText} onChange={setEditText} placeholder="ಸೇವಾ ಹೆಸರು" />
                                <TransliteratedInput value={editTime} onChange={setEditTime} placeholder="ಸಮಯ" />
                                <div className="flex justify-end gap-2">
                                    <button onClick={saveEdit} className="p-1.5 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-all">
                                        <Check size={14} />
                                    </button>
                                    <button onClick={cancelEdit} className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-xs font-bold">✕</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm whitespace-pre-line">{h.text}</span>
                                    {h.time && <span className="text-xs text-[var(--text-secondary)] ml-2">— {h.time}</span>}
                                </div>
                                {editable && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => startEditing(h)} className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-orange-50 transition-all">
                                            <Pencil size={12} />
                                        </button>
                                        <button onClick={() => removeHighlight(h.id)} className="p-1 rounded text-red-400 hover:bg-red-50 transition-all">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}

                {highlights.length === 0 && (
                    <p className="text-sm text-[var(--text-secondary)] text-center py-4">ಇಂದು ವಿಶೇಷಗಳಿಲ್ಲ</p>
                )}
            </div>

            {/* Enhanced Add form */}
            {isAdding && editable && (
                <div className="mt-4 pt-4 border-t border-black/10 space-y-3">
                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">ವಿವರಣೆ</label>
                        <TransliteratedInput
                            value={newText}
                            onChange={(val) => setNewText(val)}
                            placeholder="ವಿವರಣೆ ನಮೂದಿಸಿ..."
                            multiline={true}
                            enableVoice={true}
                        />
                    </div>

                    {/* Time */}
                    <div className="flex flex-col gap-1.5 mt-2">
                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">ಸಮಯ (ಐಚ್ಛಿಕ)</label>
                        <TransliteratedInput
                            value={newTime}
                            onChange={(val) => setNewTime(val)}
                            placeholder="ಉದಾ: 6:30 AM"
                            enableVoice={true}
                        />
                    </div>

                    <button onClick={addHighlight}
                        className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-1">
                        <Check size={14} /> ಸೇರಿಸಿ
                    </button>
                </div>
            )}
        </div>
    );
}
