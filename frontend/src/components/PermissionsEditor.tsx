import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, RotateCcw, Info, Lock } from 'lucide-react';

interface PermissionMatrix {
    roles: Record<string, { label: string; description: string }>;
    modules: Record<string, { label: string; icon: string }>;
    defaults: Record<string, Record<string, string>>;
    permission_levels: string[];
}

interface PermissionsEditorProps {
    role: string;
    modules: Record<string, string> | null;
    onChange: (modules: Record<string, string> | null) => void;
    matrix: PermissionMatrix | null;
    isLoading?: boolean;
}

const PERM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    none: { bg: 'bg-gray-100 dark:bg-gray-700/40', text: 'text-gray-400 dark:text-gray-500', label: 'No Access' },
    read: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'Read Only' },
    write: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Read + Write' },
    full: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Full Access' },
};

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

export default function PermissionsEditor({ role, modules, onChange, matrix, isLoading }: PermissionsEditorProps) {
    const [isCustomizing, setIsCustomizing] = useState(false);

    // Expand customize section if there are existing overrides
    useEffect(() => {
        if (modules && Object.keys(modules).length > 0) {
            setIsCustomizing(true);
        }
    }, []);

    const defaults = useMemo(() => {
        if (!matrix || !role) return {};
        return matrix.defaults[role] || {};
    }, [matrix, role]);

    const roleInfo = useMemo(() => {
        if (!matrix || !role) return null;
        return matrix.roles[role] || null;
    }, [matrix, role]);

    const isAdmin = role === 'admin';

    // Build effective permissions: defaults overlaid with user overrides
    const effectivePermissions = useMemo(() => {
        const result: Record<string, string> = { ...defaults };
        if (modules) {
            Object.entries(modules).forEach(([mod, perm]) => {
                result[mod] = perm;
            });
        }
        return result;
    }, [defaults, modules]);

    // Count how many overrides differ from defaults
    const overrideCount = useMemo(() => {
        if (!modules) return 0;
        return Object.entries(modules).filter(([mod, perm]) => defaults[mod] !== perm).length;
    }, [modules, defaults]);

    const handlePermChange = (mod: string, perm: string) => {
        const newModules = { ...(modules || {}) };

        // If setting back to default, remove the override
        if (defaults[mod] === perm) {
            delete newModules[mod];
        } else {
            newModules[mod] = perm;
        }

        // If no overrides remain, pass null
        onChange(Object.keys(newModules).length > 0 ? newModules : null);
    };

    const handleReset = () => {
        onChange(null);
        setIsCustomizing(false);
    };

    if (isLoading || !matrix) {
        return (
            <div className="py-4 flex justify-center">
                <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-3 pt-2 border-t border-[var(--glass-border)]">
            {/* Role Info Banner */}
            {roleInfo && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/15">
                    <Info size={14} className="text-[var(--primary)] mt-0.5 shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">
                            {roleInfo.label}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                            {roleInfo.description}
                        </p>
                    </div>
                </div>
            )}

            {/* Default Permissions Grid */}
            <div>
                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Default Permissions
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(matrix.modules).map(([mod, meta]) => {
                        const perm = effectivePermissions[mod] || 'none';
                        const colors = PERM_COLORS[perm] || PERM_COLORS.none;
                        const isOverridden = modules && mod in modules && modules[mod] !== defaults[mod];

                        return (
                            <div
                                key={mod}
                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${colors.bg} transition-colors`}
                            >
                                <span className="text-sm">{meta.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">
                                        {meta.label}
                                    </p>
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-wide ${colors.text} whitespace-nowrap`}>
                                    {colors.label}
                                </span>
                                {isOverridden && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Customized" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Customize Toggle */}
            {isAdmin ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/30 text-[10px] text-[var(--text-secondary)]">
                    <Lock size={12} />
                    Admin always has full access to all modules
                </div>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => setIsCustomizing(!isCustomizing)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <motion.span
                            animate={{ rotate: isCustomizing ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown size={14} />
                        </motion.span>
                        Customize Permissions
                        {overrideCount > 0 && (
                            <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                {overrideCount} override{overrideCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </button>

                    {/* Customization Panel */}
                    <AnimatePresence>
                        {isCustomizing && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-2 pb-1">
                                    {Object.entries(matrix.modules).map(([mod, meta]) => {
                                        const currentPerm = effectivePermissions[mod] || 'none';
                                        const defaultPerm = defaults[mod] || 'none';
                                        const isOverridden = modules && mod in modules && modules[mod] !== defaultPerm;

                                        // Skip admin-only modules (settings, users) for non-admin roles
                                        if (mod === 'settings' || mod === 'users') return null;

                                        return (
                                            <div key={mod} className="flex items-center gap-2">
                                                <span className="text-sm w-5 text-center shrink-0">{meta.icon}</span>
                                                <span className="text-[11px] font-semibold text-[var(--text-primary)] w-24 shrink-0 truncate">
                                                    {meta.label}
                                                </span>
                                                <div className="flex-1 flex gap-0.5 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-0.5">
                                                    {matrix.permission_levels.map((level) => {
                                                        const isActive = currentPerm === level;
                                                        const styles = PERM_BUTTON_STYLES[level];
                                                        const isDefault = defaultPerm === level;

                                                        return (
                                                            <button
                                                                key={level}
                                                                type="button"
                                                                onClick={() => handlePermChange(mod, level)}
                                                                className={`flex-1 px-1 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all relative ${
                                                                    isActive ? styles.active : styles.inactive
                                                                }`}
                                                                title={`${PERM_COLORS[level].label}${isDefault ? ' (default)' : ''}`}
                                                            >
                                                                {level === 'none' ? 'None' : level === 'read' ? 'Read' : level === 'write' ? 'Write' : 'Full'}
                                                                {isDefault && !isActive && (
                                                                    <span className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-[var(--primary)]" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {isOverridden && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Reset Button */}
                                    {overrideCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded-lg text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                        >
                                            <RotateCcw size={11} />
                                            Reset to role defaults
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}
