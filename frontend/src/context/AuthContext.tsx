/**
 * Authentication Context — provides RBAC-aware auth state to the entire app.
 *
 * Exposes:
 * - `user`: Current user object (with role, accessible_modules)
 * - `isAuthenticated`: Boolean
 * - `login(username, password)`: Authenticate and store JWT
 * - `logout()`: Clear auth state
 * - `can(module, permission?)`: Check if user has access to a module
 * - `hasRole(...roles)`: Check if user has any of the given roles
 * - `changePassword(current, new)`: Change password (for forced change flow)
 * - `updateUser(data)`: Update cached user data (e.g. after password change)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';

interface AccessibleModule {
    module: string;
    permission: 'read' | 'write' | 'full';
}

interface AuthUser {
    id: number;
    username: string;
    role: string;
    display_name?: string;
    is_active: boolean;
    must_change_password: boolean;
    modules?: Record<string, string>;
    accessible_modules: AccessibleModule[];
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    /** Check if the current user can access a module. */
    can: (module: string, permission?: 'read' | 'write' | 'full') => boolean;
    /** Check if the current user has any of the specified roles. */
    hasRole: (...roles: string[]) => boolean;
    /** Change password (for forced password change flow). */
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    /** Update cached user data (e.g. after password change). */
    updateUser: (data: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'seva_token';
const USER_KEY = 'seva_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(() => {
        // Restore from localStorage on mount
        try {
            const stored = localStorage.getItem(USER_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    // Validate existing token on mount
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && !user) {
            // Try to fetch user profile with existing token
            fetch('/api/me', {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => {
                    if (!res.ok) throw new Error('Invalid token');
                    return res.json();
                })
                .then((data) => {
                    setUser(data);
                    localStorage.setItem(USER_KEY, JSON.stringify(data));
                })
                .catch(() => {
                    // Token expired or invalid
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
                    setUser(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const response = await authApi.login(username, password);
        const { access_token, user: userData } = response.data;

        localStorage.setItem(TOKEN_KEY, access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
    }, []);

    const can = useCallback(
        (module: string, permission: 'read' | 'write' | 'full' = 'read'): boolean => {
            if (!user) return false;
            if (user.role === 'admin') return true;

            const mod = user.accessible_modules?.find((m) => m.module === module);
            if (!mod) return false;

            const levels: Record<string, number> = { read: 0, write: 1, full: 2 };
            return (levels[mod.permission] ?? 0) >= (levels[permission] ?? 0);
        },
        [user],
    );

    const hasRole = useCallback(
        (...roles: string[]): boolean => {
            if (!user) return false;
            return roles.includes(user.role);
        },
        [user],
    );

    const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        const response = await authApi.changePassword(currentPassword, newPassword);
        const updatedUser = response.data;
        setUser(updatedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }, []);

    const updateUser = useCallback((data: Partial<AuthUser>) => {
        setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, ...data };
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, isAuthenticated, isLoading, login, logout, can, hasRole, changePassword, updateUser }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
