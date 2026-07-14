import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCog, AlertCircle, Save } from 'lucide-react';
import { usersApi } from '../api';
import PermissionsEditor from './PermissionsEditor';

interface UserFormModalProps {
    isOpen: boolean;
    user?: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UserFormModal({ isOpen, user, onClose, onSuccess }: UserFormModalProps) {
    const isEditing = !!user;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('clerk');
    const [displayName, setDisplayName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [modules, setModules] = useState<Record<string, string> | null>(null);

    const [availableRoles, setAvailableRoles] = useState<string[]>(['admin', 'accountant', 'clerk', 'storekeeper', 'viewer']);
    const [permMatrix, setPermMatrix] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                try {
                    const rolesRes = await usersApi.getRoles();
                    if (rolesRes?.data) {
                        setAvailableRoles(rolesRes.data);
                    }
                } catch (err) {
                    console.error('Failed to fetch roles:', err);
                }

                try {
                    const matrixRes = await usersApi.getPermissionMatrix();
                    if (matrixRes?.data) {
                        setPermMatrix(matrixRes.data);
                    }
                } catch (err) {
                    console.error('Failed to fetch permission matrix:', err);
                }
            };

            loadData();

            if (isEditing) {
                setUsername(user.username || '');
                setRole(user.role || 'clerk');
                setDisplayName(user.display_name || '');
                setIsActive(user.is_active ?? true);
                setModules(user.modules || null);
                setPassword('');
            } else {
                setUsername('');
                setPassword('');
                setRole('clerk');
                setDisplayName('');
                setIsActive(true);
                setModules(null);
            }
            setError('');
        }
    }, [isOpen, user, isEditing]);

    if (!isOpen) return null;

    // When role changes, clear module overrides (they were for the old role's defaults)
    const handleRoleChange = (newRole: string) => {
        setRole(newRole);
        setModules(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (isEditing) {
                const data: any = {
                    username,
                    role,
                    display_name: displayName,
                    is_active: isActive,
                    modules: modules,
                };
                if (password) {
                    data.password = password;
                }
                await usersApi.update(user.id, data);
            } else {
                if (!password) {
                    setError('ಗುಪ್ತಪದ ಕಡ್ಡಾಯವಾಗಿದೆ');
                    setIsSubmitting(false);
                    return;
                }
                const data = {
                    username,
                    password,
                    role,
                    display_name: displayName,
                    modules: modules,
                };
                await usersApi.create(data);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get role label from matrix metadata
    const getRoleLabel = (r: string) => {
        if (!permMatrix?.roles?.[r]) return r;
        return `${permMatrix.roles[r].label} (${r})`;
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-lg bg-[var(--glass-card-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-5 border-b border-[var(--glass-border)] bg-black/5 dark:bg-white/5">
                        <div className="flex items-center gap-3 text-[var(--primary)]">
                            <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                                <UserCog size={16} />
                            </div>
                            <h2 className="font-bold text-[var(--text-primary)]">
                                {isEditing ? 'ಬಳಕೆದಾರರನ್ನು ಸಂಪಾದಿಸಿ' : 'ಹೊಸ ಬಳಕೆದಾರರನ್ನು ಸೇರಿಸಿ'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5 overflow-y-auto custom-scrollbar">
                        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                        ಬಳಕೆದಾರಹೆಸರು *
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                        ಪ್ರದರ್ಶನ ಹೆಸರು
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                        ಪಾತ್ರ *
                                    </label>
                                    <select
                                        value={role}
                                        onChange={(e) => handleRoleChange(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                    >
                                        {availableRoles.map(r => (
                                            <option key={r} value={r}>{getRoleLabel(r)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                        ಗುಪ್ತಪದ {isEditing ? '(ಹೊಸದಿದ್ದರೆ ಮಾತ್ರ)' : '*'}
                                    </label>
                                    <input
                                        type="text"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                        required={!isEditing}
                                    />
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex items-center gap-2 pt-2 pb-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] border-[var(--glass-border)] bg-[var(--bg-light)]"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-[var(--text-primary)]">
                                        ಸಕ್ರಿಯವಾಗಿದೆ
                                    </label>
                                </div>
                            )}

                            {/* Visual Permissions Editor */}
                            <PermissionsEditor
                                role={role}
                                modules={modules}
                                onChange={setModules}
                                matrix={permMatrix}
                            />

                            {error && (
                                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-500/10 p-2.5 rounded-lg">
                                    <AlertCircle size={14} className="shrink-0" />
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-[var(--glass-border)] bg-black/5 dark:bg-white/5 flex justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        >
                            ರದ್ದು
                        </button>
                        <button
                            type="submit"
                            form="user-form"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] hover:brightness-110 text-white shadow-md disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <Save size={14} />
                            {isSubmitting ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'ಉಳಿಸಿ'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
