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

const PERM_LABELS: Record<string, string> = {
    read: 'View Only',
    write: 'Modify',
    full: 'Delete',
};

export default function RoleFormModal({ isOpen, role, onClose, onSuccess }: RoleFormModalProps) {
    const isEditing = !!role;

    const [name, setName] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState<Record<string, string>>({});

    const [modulesMeta, setModulesMeta] = useState<Record<string, { label: string; icon: string }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Load module metadata
            rolesApi.getModulesMeta().then(res => {
                if (res?.data) {
                    setModulesMeta(res.data.modules || {});
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

    const handleModuleToggle = (mod: string, checked: boolean) => {
        if (checked) {
            // Default to read when enabled
            setPermissions(prev => ({ ...prev, [mod]: 'read' }));
        } else {
            setPermissions(prev => ({ ...prev, [mod]: 'none' }));
        }
    };

    const handlePermChange = (mod: string, level: string, checked: boolean) => {
        if (!checked) return; // Ignore unchecking a level (must switch to another or disable module)
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
            if (err.response?.status === 404) {
                setError('Role management is not available. Ensure the latest backend is deployed to production.');
                return;
            }
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
            <div className="absolute inset-0 z-10 flex flex-col bg-[var(--bg-base)] rounded-2xl overflow-hidden shadow-inner border border-[var(--glass-border)]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    className="flex flex-col h-full bg-[var(--glass-card-bg)] backdrop-blur-md"
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

                                <div className="space-y-4">
                                    {Object.entries(modulesMeta).map(([mod, meta]) => {
                                        const currentPerm = effectivePermissions[mod] || 'none';
                                        const isEnabled = currentPerm !== 'none';

                                        return (
                                            <div key={mod} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)]">
                                                {/* Module Toggle */}
                                                <label className="flex items-center gap-3 w-40 shrink-0 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isEnabled}
                                                        onChange={(e) => !isAdminRole && handleModuleToggle(mod, e.target.checked)}
                                                        disabled={isAdminRole}
                                                        className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] border-[var(--glass-border)] cursor-pointer disabled:opacity-50"
                                                    />
                                                    <span className="text-sm shrink-0">{meta.icon}</span>
                                                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                                                        {meta.label}
                                                    </span>
                                                </label>

                                                {/* Levels (Checkboxes acting like radios) */}
                                                <div className={`flex flex-wrap items-center gap-4 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                                    {['read', 'write', 'full'].map((level) => (
                                                        <label key={level} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={currentPerm === level}
                                                                onChange={(e) => !isAdminRole && handlePermChange(mod, level, e.target.checked)}
                                                                disabled={isAdminRole || !isEnabled}
                                                                className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] border-[var(--glass-border)] cursor-pointer disabled:opacity-50"
                                                            />
                                                            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                                                {PERM_LABELS[level]}
                                                            </span>
                                                        </label>
                                                    ))}
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
