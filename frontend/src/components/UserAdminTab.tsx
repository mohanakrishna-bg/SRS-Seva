import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Pencil, KeyRound, Trash2, Shield, Circle, AlertCircle, History, X } from 'lucide-react';
import { usersApi } from '../api';
import UserFormModal from './UserFormModal';
import ResetPasswordModal from './ResetPasswordModal';
import { useAuth } from '../context/AuthContext';

// Role label mapping (business-friendly names)
const ROLE_LABELS: Record<string, string> = {
    admin: 'Manager',
    accountant: 'Accountant',
    clerk: 'Assistant',
    storekeeper: 'Storekeeper',
    viewer: 'Viewer',
};

// Module badge colors
const MODULE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    seva: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', icon: '🙏' },
    customers: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', icon: '👥' },
    accounting: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: '📊' },
    assets: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: '🏛️' },
    consumables: { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', icon: '📦' },
    donations: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: '🎁' },
    settings: { bg: 'bg-gray-100 dark:bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', icon: '⚙️' },
    users: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', icon: '👤' },
};

// Default module access per role (simplified for badge display)
const DEFAULT_ROLE_MODULES: Record<string, string[]> = {
    admin: ['seva', 'customers', 'accounting', 'assets', 'consumables', 'donations', 'settings', 'users'],
    accountant: ['accounting', 'donations'],
    clerk: ['seva', 'customers', 'donations'],
    storekeeper: ['assets', 'consumables', 'donations'],
    viewer: [], // viewer has read-only to all, shown differently
};

function getUserModules(user: any): string[] {
    if (user.role === 'admin') return DEFAULT_ROLE_MODULES.admin;
    if (user.role === 'viewer') return []; // Special display

    const defaults = DEFAULT_ROLE_MODULES[user.role] || [];
    if (!user.modules) return defaults;

    // Apply overrides
    const result = new Set(defaults);
    Object.entries(user.modules as Record<string, string>).forEach(([mod, perm]) => {
        if (perm === 'none') {
            result.delete(mod);
        } else {
            result.add(mod);
        }
    });
    return Array.from(result);
}

interface AuditEntry {
    id: number;
    timestamp: string;
    admin_username: string;
    target_username: string;
    action: string;
    details: any;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    create: { label: 'Created', color: 'text-emerald-600 dark:text-emerald-400' },
    update_role: { label: 'Role Changed', color: 'text-blue-600 dark:text-blue-400' },
    update_permissions: { label: 'Permissions Changed', color: 'text-amber-600 dark:text-amber-400' },
    update_role_and_permissions: { label: 'Role & Permissions Changed', color: 'text-purple-600 dark:text-purple-400' },
    update_profile: { label: 'Profile Updated', color: 'text-gray-600 dark:text-gray-400' },
    activate: { label: 'Activated', color: 'text-emerald-600 dark:text-emerald-400' },
    deactivate: { label: 'Deactivated', color: 'text-red-600 dark:text-red-400' },
    delete: { label: 'Deleted', color: 'text-red-600 dark:text-red-400' },
    reset_password: { label: 'Password Reset', color: 'text-amber-600 dark:text-amber-400' },
};

export default function UserAdminTab() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [formModalState, setFormModalState] = useState<{ isOpen: boolean; user?: any }>({ isOpen: false });
    const [resetModalState, setResetModalState] = useState<{ isOpen: boolean; userId: number; username: string }>({ isOpen: false, userId: 0, username: '' });
    const [showAuditLog, setShowAuditLog] = useState(false);
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await usersApi.list();
            setUsers(res.data);
            setError('');
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('ಬಳಕೆದಾರರನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAuditLog = async () => {
        setAuditLoading(true);
        try {
            const res = await usersApi.getAuditLog(undefined, 50);
            setAuditLog(res.data);
        } catch (err) {
            console.error('Failed to fetch audit log:', err);
        } finally {
            setAuditLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: number, username: string) => {
        if (currentUser?.id === id) {
            alert('ನಿಮ್ಮ ಸ್ವಂತ ಖಾತೆಯನ್ನು ಅಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ');
            return;
        }
        if (window.confirm(`'${username}' ಬಳಕೆದಾರರನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?`)) {
            try {
                await usersApi.delete(id);
                fetchUsers();
            } catch (err: any) {
                alert(err.response?.data?.detail || 'ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ');
            }
        }
    };

    const handleShowAuditLog = () => {
        setShowAuditLog(true);
        fetchAuditLog();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ</h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">ಬಳಕೆದಾರರ ಖಾತೆಗಳು ಮತ್ತು ಪಾತ್ರಗಳನ್ನು ನಿರ್ವಹಿಸಿ.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleShowAuditLog}
                        className="flex items-center gap-2 px-3 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                        title="View Audit Log"
                    >
                        <History size={14} />
                        Audit Log
                    </button>
                    <button
                        onClick={() => setFormModalState({ isOpen: true })}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-bold shadow-lg shadow-[var(--primary)]/20 hover:brightness-110 transition-all"
                    >
                        <UserPlus size={16} />
                        ಹೊಸ ಬಳಕೆದಾರ
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-500/20">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black/5 dark:bg-white/5 border-b border-[var(--glass-border)]">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">ಬಳಕೆದಾರಹೆಸರು</th>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">ಪ್ರದರ್ಶನ ಹೆಸರು</th>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">ಪಾತ್ರ</th>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Access</th>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">ಸ್ಥಿತಿ</th>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider text-right">ಕ್ರಿಯೆಗಳು</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                                        <div className="flex justify-center mb-2">
                                            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                        </div>
                                        ಲೋಡ್ ಆಗುತ್ತಿದೆ...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                                        ಯಾವುದೇ ಬಳಕೆದಾರರು ಕಂಡುಬಂದಿಲ್ಲ.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const accessModules = getUserModules(user);
                                    const hasOverrides = user.modules && Object.keys(user.modules).length > 0;

                                    return (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                                        >
                                            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                                                {user.username}
                                                {user.must_change_password && (
                                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                                        PWD RESET PENDING
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-[var(--text-secondary)]">
                                                {user.display_name || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold">
                                                    <Shield size={12} />
                                                    {ROLE_LABELS[user.role] || user.role}
                                                </span>
                                                {hasOverrides && (
                                                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 uppercase tracking-wide">
                                                        Custom
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.role === 'viewer' ? (
                                                    <span className="text-[10px] font-semibold text-blue-500 italic">Read-only (all)</span>
                                                ) : user.role === 'admin' ? (
                                                    <span className="text-[10px] font-semibold text-emerald-500 italic">Full (all)</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {accessModules.map(mod => {
                                                            const mc = MODULE_COLORS[mod];
                                                            if (!mc) return null;
                                                            return (
                                                                <span
                                                                    key={mod}
                                                                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${mc.bg} ${mc.text} text-[9px] font-bold`}
                                                                    title={mod}
                                                                >
                                                                    <span className="text-[10px]">{mc.icon}</span>
                                                                    {mod.slice(0, 4)}
                                                                </span>
                                                            );
                                                        })}
                                                        {accessModules.length === 0 && (
                                                            <span className="text-[10px] text-[var(--text-secondary)] italic">No access</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${user.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    <Circle size={8} fill="currentColor" />
                                                    {user.is_active ? 'ಸಕ್ರಿಯ' : 'ನಿಷ್ಕ್ರಿಯ'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setFormModalState({ isOpen: true, user })}
                                                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                        title="ಸಂಪಾದಿಸಿ"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => setResetModalState({ isOpen: true, userId: user.id, username: user.username })}
                                                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                        title="ಗುಪ್ತಪದ ಮರುಹೊಂದಿಸಿ"
                                                    >
                                                        <KeyRound size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id, user.username)}
                                                        disabled={currentUser?.id === user.id}
                                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-30 transition-colors"
                                                        title="ಅಳಿಸಿ"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserFormModal
                isOpen={formModalState.isOpen}
                user={formModalState.user}
                onClose={() => setFormModalState({ isOpen: false })}
                onSuccess={() => {
                    setFormModalState({ isOpen: false });
                    fetchUsers();
                }}
            />

            <ResetPasswordModal
                isOpen={resetModalState.isOpen}
                userId={resetModalState.userId}
                username={resetModalState.username}
                onClose={() => setResetModalState({ isOpen: false, userId: 0, username: '' })}
                onSuccess={() => {
                    setResetModalState({ isOpen: false, userId: 0, username: '' });
                    fetchUsers();
                }}
            />

            {/* Audit Log Drawer */}
            <AnimatePresence>
                {showAuditLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowAuditLog(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-md h-full bg-[var(--glass-card-bg)] border-l border-[var(--glass-border)] shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)] bg-black/5 dark:bg-white/5">
                                <div className="flex items-center gap-2">
                                    <History size={16} className="text-[var(--primary)]" />
                                    <h3 className="font-bold text-sm text-[var(--text-primary)]">Audit Log</h3>
                                </div>
                                <button
                                    onClick={() => setShowAuditLog(false)}
                                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                {auditLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : auditLog.length === 0 ? (
                                    <p className="text-center text-sm text-[var(--text-secondary)] py-8">
                                        No audit entries yet.
                                    </p>
                                ) : (
                                    auditLog.map((entry) => {
                                        const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, color: 'text-gray-500' };
                                        const ts = entry.timestamp ? new Date(entry.timestamp) : null;

                                        return (
                                            <div
                                                key={entry.id}
                                                className="p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${actionInfo.color}`}>
                                                        {actionInfo.label}
                                                    </span>
                                                    {ts && (
                                                        <span className="text-[9px] text-[var(--text-secondary)]">
                                                            {ts.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}{' '}
                                                            {ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[var(--text-primary)]">
                                                    <span className="font-semibold">{entry.admin_username}</span>
                                                    <span className="text-[var(--text-secondary)]"> → </span>
                                                    <span className="font-semibold">{entry.target_username}</span>
                                                </p>
                                                {entry.details && (
                                                    <div className="mt-1.5 text-[10px] text-[var(--text-secondary)] space-y-0.5">
                                                        {Object.entries(entry.details).map(([key, val]: [string, any]) => {
                                                            if (key === 'password') return (
                                                                <p key={key}>Password changed</p>
                                                            );
                                                            if (typeof val === 'object' && val !== null && 'old' in val) {
                                                                const oldVal = typeof val.old === 'object' ? JSON.stringify(val.old) : String(val.old ?? '—');
                                                                const newVal = typeof val.new === 'object' ? JSON.stringify(val.new) : String(val.new ?? '—');
                                                                return (
                                                                    <p key={key}>
                                                                        <span className="font-semibold capitalize">{key}</span>: {oldVal} → {newVal}
                                                                    </p>
                                                                );
                                                            }
                                                            return (
                                                                <p key={key}>
                                                                    <span className="font-semibold capitalize">{key}</span>: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                </p>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
