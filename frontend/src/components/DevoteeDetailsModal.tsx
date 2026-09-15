import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, MapPin, Edit3, Trash2, Receipt, UserCircle2 } from 'lucide-react';

interface Devotee {
    DevoteeId: number;
    Name: string;
    Phone?: string;
    WhatsApp_Phone?: string;
    Email?: string;
    Gotra?: string;
    Nakshatra?: string;
    Address?: string;
    City?: string;
    PinCode?: string;
    PhotoPath?: string;
}

interface DevoteeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    devotee: Devotee | null;
    onEdit: (d: Devotee) => void;
    onDelete: (d: Devotee) => void;
    onBookSeva: (d: Devotee) => void;
}

export default function DevoteeDetailsModal({ isOpen, onClose, devotee, onEdit, onDelete, onBookSeva }: DevoteeDetailsModalProps) {
    if (!devotee) return null;

    const details = [
        { label: 'ಹೆಸರು', value: devotee.Name, icon: UserCircle2 },
        { label: 'ಫೋನ್', value: devotee.Phone, icon: Phone },
        { label: 'ವಾಟ್ಸ್ಆಪ್', value: devotee.WhatsApp_Phone, icon: Phone },
        { label: 'ಇಮೇಲ್', value: devotee.Email, icon: Mail },
        { label: 'ಗೋತ್ರ', value: devotee.Gotra },
        { label: 'ನಕ್ಷತ್ರ', value: devotee.Nakshatra },
        { label: 'ನಗರ', value: devotee.City, icon: MapPin },
        { label: 'ಪಿನ್ ಕೋಡ್', value: devotee.PinCode },
        { label: 'ವಿಳಾಸ', value: devotee.Address, icon: MapPin, full: true },
    ].filter(d => d.value);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-[var(--glass-border)] flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[var(--primary)] to-amber-500 p-6 sm:p-8 text-white relative shrink-0">
                            <button 
                                onClick={onClose}
                                className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <div className="flex items-center gap-4 sm:gap-6">
                                {devotee.PhotoPath ? (
                                    <img src={devotee.PhotoPath} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/50 shadow-xl" />
                                ) : (
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30 text-white shadow-xl">
                                        <UserCircle2 size={40} className="sm:w-12 sm:h-12" />
                                    </div>
                                )}
                                <div className="overflow-hidden pr-8">
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{devotee.Name}</h2>
                                    <p className="text-white/80 text-sm sm:text-base font-medium mt-1">{devotee.DevoteeId ? `ID: ${devotee.DevoteeId}` : ''}</p>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50/50 dark:bg-black/10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {details.map((d, i) => (
                                    <div key={i} className={`p-4 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm space-y-1.5 ${d.full ? 'sm:col-span-2' : ''}`}>
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">{d.label}</p>
                                        <div className="flex items-center gap-3 text-[var(--text-primary)]">
                                            {d.icon && <d.icon size={18} className="text-[var(--primary)] shrink-0 opacity-80" />}
                                            <span className="text-sm sm:text-base font-semibold break-words">{d.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-black/20 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-2 justify-between shrink-0">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit(devotee)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 transition-all"
                                >
                                    <Edit3 size={16} /> ಬದಲಿಸಿ
                                </button>
                                <button
                                    onClick={() => onDelete(devotee)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 transition-all"
                                >
                                    <Trash2 size={16} /> ಅಳಿಸಿ
                                </button>
                            </div>
                            <button
                                onClick={() => onBookSeva(devotee)}
                                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <Receipt size={16} /> ಸೇವಾ ಬುಕಿಂಗ್
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
