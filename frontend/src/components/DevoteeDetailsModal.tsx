import { useState } from 'react';
import { Phone, Mail, MapPin, Edit3, Trash2, Receipt, UserCircle2, ArrowLeft } from 'lucide-react';
import Modal from './Modal';
import CustomerForm from './CustomerForm';

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
    onSave: (data: any) => Promise<void>;
    onDelete: (d: Devotee) => void;
    onBookSeva: (d: Devotee) => void;
}

export default function DevoteeDetailsModal({ isOpen, onClose, devotee, onSave, onDelete, onBookSeva }: DevoteeDetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false);

    if (!devotee) return null;

    const handleClose = () => {
        setIsEditing(false);
        onClose();
    };

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
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEditing ? 'ಭಕ್ತರ ವಿವರ ಬದಲಿಸಿ (Edit Devotee)' : (devotee.Name || 'ಭಕ್ತರ ವಿವರ (Devotee Details)')}
            maxWidth="max-w-2xl"
            contentBounded={true}
            isLocked={true}
        >
            {isEditing ? (
                <CustomerForm
                    isOpen={true}
                    onClose={() => setIsEditing(false)}
                    onSubmit={async (data) => {
                        await onSave(data);
                        setIsEditing(false);
                    }}
                    initialData={devotee}
                    inline={true}
                    title=""
                />
            ) : (
                <div className="space-y-6">
                    {/* Devotee Header summary */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)]">
                        {devotee.PhotoPath ? (
                            <img src={devotee.PhotoPath} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[var(--primary)] shrink-0" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/20 shrink-0">
                                <UserCircle2 size={36} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-bold text-[var(--text-primary)] truncate">{devotee.Name}</h4>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                {devotee.DevoteeId ? `ID: #${devotee.DevoteeId}` : ''}
                                {devotee.Gotra ? ` • ಗೋತ್ರ: ${devotee.Gotra}` : ''}
                                {devotee.Nakshatra ? ` • ನಕ್ಷತ್ರ: ${devotee.Nakshatra}` : ''}
                            </p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
                        {details.map((d, i) => (
                            <div key={i} className={`p-3.5 rounded-xl bg-white dark:bg-black/20 border border-black/5 dark:border-white/10 space-y-1 ${d.full ? 'sm:col-span-2' : ''}`}>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{d.label}</p>
                                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                                    {d.icon && <d.icon size={15} className="text-[var(--primary)] shrink-0" />}
                                    <span className="text-sm font-semibold break-words">{d.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons: Edit, Delete, Return to list view */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--glass-border)]">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] border border-black/10 dark:border-white/10 transition-colors"
                        >
                            <ArrowLeft size={16} /> ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ (Back to List)
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-sm font-bold transition-all border border-blue-500/20"
                            >
                                <Edit3 size={15} /> ಬದಲಿಸಿ (Edit)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onDelete(devotee);
                                    handleClose();
                                }}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-sm font-bold transition-all border border-red-500/20"
                            >
                                <Trash2 size={15} /> ಅಳಿಸಿ (Delete)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onBookSeva(devotee);
                                    handleClose();
                                }}
                                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-bold shadow-md hover:shadow-orange-500/20 transition-all"
                            >
                                <Receipt size={15} /> ಸೇವಾ ಬುಕಿಂಗ್
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}

