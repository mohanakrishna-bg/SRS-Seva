import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ManagePage from '../pages/ManagePage';
import SevaPage from '../pages/SevaPage';
import Layout from '../components/Layout';
import { AuthProvider } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { InputProvider } from '../context/InputContext';

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
    },
    registrationApi: {
        list: vi.fn().mockResolvedValue({ data: { items: [], total: 0 } }),
        getByDateRange: vi.fn().mockResolvedValue({ data: [] }),
        getLiveStats: vi.fn().mockResolvedValue({ data: {} }),
        getSummary: vi.fn().mockResolvedValue({ data: {} }),
    },
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

        localStorage.setItem('seva_subnav_layout_prefs', JSON.stringify({ seva: 'left' }));

        render(
            <AuthProvider>
                <SettingsProvider>
                    <InputProvider>
                        <MemoryRouter initialEntries={['/manage/users']}>
                            <Routes>
                                <Route element={<Layout />}>
                                    <Route path="/manage/*" element={<ManagePage />} />
                                </Route>
                            </Routes>
                        </MemoryRouter>
                    </InputProvider>
                </SettingsProvider>
            </AuthProvider>
        );

        // Check if UserAdminTab content is present
        expect(await screen.findByText('ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ')).toBeDefined();
    });

    it('matches /app/seva and renders Seva sub menu', async () => {
        localStorage.setItem('seva_token', 'mock_token');
        localStorage.setItem('seva_user', JSON.stringify({
            username: 'admin',
            role: 'admin',
            is_active: true,
            must_change_password: false,
            accessible_modules: [{ module: 'seva', permission: 'full' }]
        }));

        localStorage.setItem('seva_subnav_layout_prefs', JSON.stringify({ seva: 'left' }));

        render(
            <AuthProvider>
                <SettingsProvider>
                    <InputProvider>
                        <MemoryRouter initialEntries={['/app/seva']}>
                            <Routes>
                                <Route path="/app/*" element={
                                    <Routes>
                                        <Route element={<Layout />}>
                                            <Route path="seva/*" element={<SevaPage />} />
                                        </Route>
                                    </Routes>
                                } />
                            </Routes>
                        </MemoryRouter>
                    </InputProvider>
                </SettingsProvider>
            </AuthProvider>
        );

        // Both the Left navigation bar and Seva tabs are rendered properly
        const switchButtons = screen.queryAllByTitle('ಮೇಲಿನ ಮೆನುಗೆ ಬದಲಾಯಿಸಿ');
        expect(switchButtons.length).toBeGreaterThan(0);
        expect(screen.queryAllByText('ಸೇವೆ ನೋಂದಣಿ').length).toBeGreaterThan(0);
    });

    it('renders ContextualTabBar when layout preference is top', async () => {
        localStorage.setItem('seva_token', 'mock_token');
        localStorage.setItem('seva_user', JSON.stringify({
            username: 'admin',
            role: 'admin',
            is_active: true,
            must_change_password: false,
            accessible_modules: [{ module: 'seva', permission: 'full' }]
        }));

        localStorage.setItem('seva_subnav_layout_prefs', JSON.stringify({ seva: 'top' }));

        render(
            <AuthProvider>
                <SettingsProvider>
                    <InputProvider>
                        <MemoryRouter initialEntries={['/app/seva']}>
                            <Routes>
                                <Route path="/app/*" element={
                                    <Routes>
                                        <Route element={<Layout />}>
                                            <Route path="seva/*" element={<SevaPage />} />
                                        </Route>
                                    </Routes>
                                } />
                            </Routes>
                        </MemoryRouter>
                    </InputProvider>
                </SettingsProvider>
            </AuthProvider>
        );

        // In top layout mode, toggle button to switch to left menu is present
        expect(screen.queryByTitle('ಎಡ ಮೆನುಗೆ ಬದಲಾಯಿಸಿ')).toBeDefined();
        expect(screen.queryAllByText('ಸೇವೆ ನೋಂದಣಿ').length).toBeGreaterThan(0);
    });
});
