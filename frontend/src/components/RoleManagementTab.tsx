import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Pencil, Trash2, AlertCircle, Lock, Users } from 'lucide-react';
import { rolesApi } from '../api';
import RoleFormModal from './RoleFormModal';

// Permission level colors for the visual grid
const PERM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    none: { bg: 'bg-gray-100 dark:bg-gray-700/40', text: 'text-gray-400 dark:text-gray-500', label: 'None' },
    read: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'Read' },
    write: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Write' },
    full: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Full' },
};

// Module icon/label config
const MODULE_ICONS: Record<string, string> = {
    seva: '🙏', customers: '👥', accounting: '📊', assets: '🏛️',
    consumables: '📦', donations: '🎁', settings: '⚙️', users: '👤',
};

interface RoleData {
    id: number;
    name: string;
    label: string;
    description?: string;
    permissions: Record<string, string>;
    is_builtin: boolean;
    user_count: number;
}

export default function RoleManagementTab() {
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [formModalState, setFormModalState] = useState<{ isOpen: boolean; role?: RoleData }>({ isOpen: false });
    const [expandedRole, setExpandedRole] = useState<number | null>(null);

    const fetchRoles = async () => {
        setIsLoading(true);
        try {
            const res = await rolesApi.list();
            setRoles(Array.isArray(res?.data) ? res.data : []);
            setError('');
        } catch (err: any) {
            console.error('Failed to fetch roles:', err);
            setError(err?.response?.data?.detail || 'Failed to load roles');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDelete = async (role: RoleData) => {
        if (role.is_builtin) {
            alert('Built-in roles cannot be deleted.');
            return;
        }
        if (role.user_count > 0) {
            alert(`Cannot delete role '${role.label}': ${role.user_count} user(s) are assigned. Reassign them first.`);
            return;
        }
        if (window.confirm(`Are you sure you want to delete the role '${role.label}'?`)) {
            try {
                await rolesApi.delete(role.id);
                fetchRoles();
            } catch (err: any) {
                alert(err.response?.data?.detail || 'Failed to delete role');
            }
        }
    };

    const toggleExpanded = (id: number) => {
        setExpandedRole(prev => prev === id ? null : id);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">ಪಾತ್ರ ನಿರ್ವಹಣೆ</h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">ಪಾತ್ರಗಳು ಮತ್ತು ಅನುಮತಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ. ಬಳಕೆದಾರರು ತಮ್ಮ ಪಾತ್ರದ ಅನುಮತಿಗಳನ್ನು ಪಡೆಯುತ್ತಾರೆ.</p>
                </div>
                <button
                    onClick={() => setFormModalState({ isOpen: true })}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-bold shadow-lg shadow-[var(--primary)]/20 hover:brightness-110 transition-all"
                >
                    <Plus size={16} />
                    ಹೊಸ ಪಾತ್ರ
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-500/20">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : roles.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                    No roles found.
                </div>
            ) : (
                <div className="grid gap-3">
                    {roles.map((role) => {
                        const isExpanded = expandedRole === role.id;
                        const isAdmin = role.name === 'admin';
                        const permEntries = Object.entries(role.permissions || {});

                        return (
                            <motion.div
                                key={role.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl overflow-hidden shadow-sm backdrop-blur-md"
                            >
                                {/* Role Header */}
                                <div
                                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    onClick={() => toggleExpanded(role.id)}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        isAdmin
                                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                                            : role.is_builtin
                                                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                                : 'bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                    }`}>
                                        <Shield size={18} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-sm text-[var(--text-primary)]">
                                                {role.label}
                                            </h3>
                                            <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                                {role.name}
                                            </span>
                                            {role.is_builtin && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 uppercase tracking-wide">
                                                    <Lock size={8} />
                                                    Built-in
                                                </span>
                                            )}
                                        </div>
                                        {role.description && (
                                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
                                                {role.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* User count badge */}
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 shrink-0">
                                        <Users size={12} className="text-[var(--text-secondary)]" />
                                        <span className="text-xs font-bold text-[var(--text-primary)]">
                                            {role.user_count}
                                        </span>
                                    </div>

                                    {/* Quick permission summary */}
                                    <div className="hidden sm:flex gap-1 shrink-0">
                                        {permEntries.slice(0, 4).map(([mod, perm]) => {
                                            const colors = PERM_COLORS[perm] || PERM_COLORS.none;
                                            return (
                                                <span
                                                    key={mod}
                                                    className={`w-2 h-2 rounded-full ${
                                                        perm === 'full' ? 'bg-emerald-500' :
                                                        perm === 'write' ? 'bg-amber-500' :
                                                        perm === 'read' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                                    title={`${mod}: ${colors.label}`}
                                                />
                                            );
                                        })}
                                        {permEntries.length > 4 && (
                                            <span className="text-[9px] text-[var(--text-secondary)]">+{permEntries.length - 4}</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                        {!isAdmin && (
                                            <button
                                                onClick={() => setFormModalState({ isOpen: true, role })}
                                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                title="Edit Role"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                        )}
                                        {!role.is_builtin && (
                                            <button
                                                onClick={() => handleDelete(role)}
                                                disabled={role.user_count > 0}
                                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                title={role.user_count > 0 ? `${role.user_count} user(s) assigned — reassign before deleting` : 'Delete Role'}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded: Permission Details */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-4 pt-1 border-t border-[var(--glass-border)]">
                                                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 mt-3">
                                                    Module Permissions
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                                    {permEntries.map(([mod, perm]) => {
                                                        const colors = PERM_COLORS[perm] || PERM_COLORS.none;
                                                        const icon = MODULE_ICONS[mod] || '📋';

                                                        return (
                                                            <div
                                                                key={mod}
                                                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${colors.bg} transition-colors`}
                                                            >
                                                                <span className="text-sm">{icon}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] font-semibold text-[var(--text-primary)] truncate capitalize">
                                                                        {mod}
                                                                    </p>
                                                                </div>
                                                                <span className={`text-[8px] font-bold uppercase tracking-wide ${colors.text} whitespace-nowrap`}>
                                                                    {colors.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <RoleFormModal
                isOpen={formModalState.isOpen}
                role={formModalState.role}
                onClose={() => setFormModalState({ isOpen: false })}
                onSuccess={() => {
                    setFormModalState({ isOpen: false });
                    fetchRoles();
                }}
            />
        </div>
    );
}
