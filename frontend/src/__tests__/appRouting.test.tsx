import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ManagePage from '../pages/ManagePage';
import Layout from '../components/Layout';
import { AuthProvider } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';

// Mock APIs
vi.mock('../api', () => ({
    usersApi: {
        list: vi.fn().mockResolvedValue({
            data: [
                { username: 'admin', role: 'admin', display_name: 'Admin User', id: 1, is_active: true, modules: null, must_change_password: true },
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
    },
    customerApi: {
        list: vi.fn().mockResolvedValue({ data: { items: [], total: 0 } }),
    },
    sevaApi: {
        list: vi.fn().mockResolvedValue({ data: [] }),
    },
    eventsApi: {
        list: vi.fn().mockResolvedValue({ data: [] }),
    },
    settingsApi: {
        get: vi.fn().mockResolvedValue({ data: {} }),
    }
}));

describe('App Routing to /manage/users', () => {
    it('matches /manage/users in full route hierarchy', async () => {
        // Set user in localStorage
        localStorage.setItem('seva_token', 'mock_token');
        localStorage.setItem('seva_user', JSON.stringify({
            username: 'admin',
            role: 'admin',
            is_active: true,
            must_change_password: false,
            accessible_modules: [{ module: 'settings', permission: 'full' }]
        }));

        render(
            <AuthProvider>
                <SettingsProvider>
                    <MemoryRouter initialEntries={['/manage/users']}>
                        <Routes>
                            <Route element={<Layout />}>
                                <Route path="/manage/*" element={<ManagePage />} />
                            </Route>
                        </Routes>
                    </MemoryRouter>
                </SettingsProvider>
            </AuthProvider>
        );

        // Check if UserAdminTab content is present
        expect(await screen.findByText('ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ')).toBeDefined();
    });
});
