import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertCircle, Save, Info } from 'lucide-react';
import { rolesApi } from '../api';

interface RoleFormModalProps {
    isOpen: boolean;
    role?: any; // Existing role for editing
    onClose: () => void;
    onSuccess: () => void;
}

const PERM_BUTTON_STYLES: Record<string, { active: string; inactive: string }> = {
    none: {
        active: 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 ring-1 ring-gray-300 dark:ring-gray-500',
        inactive: 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50',
    },
    read: {
        active: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-500/50',
        inactive: 'text-gray-400 dark:text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-500/10',
    },
    write: {
        active: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-500/50',
        inactive: 'text-gray-400 dark:text-gray-500 hover:bg-amber-50 dark:hover:bg-amber-500/10',
    },
    full: {
        active: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-500/50',
        inactive: 'text-gray-400 dark:text-gray-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
    },
};

const PERM_LABELS: Record<string, string> = {
    none: 'None',
    read: 'Read',
    write: 'Write',
    full: 'Full',
};

export default function RoleFormModal({ isOpen, role, onClose, onSuccess }: RoleFormModalProps) {
    const isEditing = !!role;

    const [name, setName] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState<Record<string, string>>({});

    const [modulesMeta, setModulesMeta] = useState<Record<string, { label: string; icon: string }>>({});
    const [permLevels, setPermLevels] = useState<string[]>(['none', 'read', 'write', 'full']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Load module metadata
            rolesApi.getModulesMeta().then(res => {
                if (res?.data) {
                    setModulesMeta(res.data.modules || {});
                    setPermLevels(res.data.permission_levels || ['none', 'read', 'write', 'full']);
                }
            }).catch(err => console.error('Failed to load modules meta:', err));

            if (isEditing) {
                setName(role.name || '');
                setLabel(role.label || '');
                setDescription(role.description || '');
                setPermissions(role.permissions || {});
            } else {
                setName('');
                setLabel('');
                setDescription('');
                setPermissions({});
            }
            setError('');
        }
    }, [isOpen, role, isEditing]);

    // Auto-populate permissions with 'none' for any module not yet set
    const effectivePermissions = useMemo(() => {
        const result: Record<string, string> = {};
        for (const mod of Object.keys(modulesMeta)) {
            result[mod] = permissions[mod] || 'none';
        }
        return result;
    }, [permissions, modulesMeta]);

    if (!isOpen) return null;

    const handlePermChange = (mod: string, level: string) => {
        setPermissions(prev => ({ ...prev, [mod]: level }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (isEditing) {
                await rolesApi.update(role.id, {
                    label: label.trim(),
                    description: description.trim() || undefined,
                    permissions: effectivePermissions,
                });
            } else {
                if (!name.trim()) {
                    setError('Role name is required');
                    setIsSubmitting(false);
                    return;
                }
                await rolesApi.create({
                    name: name.trim().toLowerCase(),
                    label: label.trim(),
                    description: description.trim() || undefined,
                    permissions: effectivePermissions,
                });
            }
            onSuccess();
        } catch (err: any) {
            let detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                detail = detail.map((d: any) => `${d.loc?.slice(1)?.join('.') || 'field'}: ${d.msg}`).join('; ');
            }
            setError(detail || err.message || 'Failed to save role');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAdminRole = isEditing && role?.name === 'admin';

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
                                <Shield size={16} />
                            </div>
                            <h2 className="font-bold text-[var(--text-primary)]">
                                {isEditing ? `Edit Role: ${role.label}` : 'Create New Role'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5 overflow-y-auto custom-scrollbar">
                        {error && (
                            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl mb-4 border border-red-200 dark:border-red-500/20">
                                <AlertCircle size={15} className="shrink-0" />
                                <span className="font-semibold">{error}</span>
                            </div>
                        )}

                        {isAdminRole && (
                            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 mb-4">
                                <Info size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                    The admin role has full access to all modules and cannot be modified.
                                </p>
                            </div>
                        )}

                        <form id="role-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                        Role Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
                                        placeholder="e.g. temple_head"
                                        required
                                        disabled={isEditing}
                                        maxLength={30}
                                    />
                                    {!isEditing && (
                                        <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">Lowercase letters, numbers, underscores. 3-30 chars.</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                        Display Label *
                                    </label>
                                    <input
                                        type="text"
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
                                        placeholder="e.g. Temple Head"
                                        required
                                        disabled={isAdminRole}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-light)] dark:bg-slate-800 border border-[var(--glass-border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
                                    placeholder="Brief description of what this role can access"
                                    disabled={isAdminRole}
                                />
                            </div>

                            {/* Permissions Grid */}
                            <div className="space-y-3 pt-2 border-t border-[var(--glass-border)]">
                                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Module Permissions
                                </p>

                                <div className="space-y-2">
                                    {Object.entries(modulesMeta).map(([mod, meta]) => {
                                        const currentPerm = effectivePermissions[mod] || 'none';

                                        return (
                                            <div key={mod} className="flex items-center gap-2">
                                                <span className="text-sm w-5 text-center shrink-0">{meta.icon}</span>
                                                <span className="text-[11px] font-semibold text-[var(--text-primary)] w-24 shrink-0 truncate">
                                                    {meta.label}
                                                </span>
                                                <div className="flex-1 flex gap-0.5 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-0.5">
                                                    {permLevels.map((level) => {
                                                        const isActive = currentPerm === level;
                                                        const styles = PERM_BUTTON_STYLES[level];

                                                        return (
                                                            <button
                                                                key={level}
                                                                type="button"
                                                                onClick={() => !isAdminRole && handlePermChange(mod, level)}
                                                                disabled={isAdminRole}
                                                                className={`flex-1 px-1 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all disabled:cursor-not-allowed ${
                                                                    isActive ? styles.active : styles.inactive
                                                                }`}
                                                            >
                                                                {PERM_LABELS[level] || level}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-[var(--glass-border)] bg-black/5 dark:bg-white/5 flex justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        {!isAdminRole && (
                            <button
                                type="submit"
                                form="role-form"
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] hover:brightness-110 text-white shadow-md disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                <Save size={14} />
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
