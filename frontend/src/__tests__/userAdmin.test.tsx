import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import UserAdminTab from '../components/UserAdminTab';
import { AuthProvider } from '../context/AuthContext';

// Mock usersApi
vi.mock('../api', () => ({
    usersApi: {
        list: vi.fn().mockResolvedValue({
            data: [
                { username: 'admin', role: 'admin', display_name: 'Admin User', id: 1, is_active: true, modules: null, must_change_password: true },
                { username: 'clerk1', role: 'clerk', display_name: 'Clerk 1', id: 2, is_active: true, modules: { accounting: 'read' }, must_change_password: false },
                { username: 'stringmod', role: 'accountant', display_name: 'String Mod', id: 3, is_active: true, modules: 'seva,accounting', must_change_password: false },
                { username: 'invalidmod', role: 'clerk', display_name: 'Invalid Mod', id: 4, is_active: true, modules: true, must_change_password: false },
            ]
        }),
        getRoles: vi.fn().mockResolvedValue({ data: ['admin', 'accountant', 'clerk', 'storekeeper', 'viewer'] }),
        getPermissionMatrix: vi.fn().mockResolvedValue({ data: { roles: {}, modules: {}, defaults: {}, permission_levels: [] } }),
        getAuditLog: vi.fn().mockResolvedValue({ data: [] }),
    },
    authApi: {
        login: vi.fn(),
        me: vi.fn(),
        changePassword: vi.fn(),
    }
}));

describe('UserAdminTab', () => {
    it('renders without crashing with various user shapes', async () => {
        render(
            <AuthProvider>
                <UserAdminTab />
            </AuthProvider>
        );
        expect(screen.getByText('ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ')).toBeDefined();
    });
});
