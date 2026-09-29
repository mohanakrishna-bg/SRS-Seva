import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MemoryRouter } from 'react-router-dom';
import ManagePage from '../pages/ManagePage';
import { AuthProvider } from '../context/AuthContext';

// Mock usersApi
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
        list: vi.fn().mockResolvedValue({ data: [] }),
    },
    sevaApi: {
        list: vi.fn().mockResolvedValue({ data: [] }),
    },
    eventsApi: {
        list: vi.fn().mockResolvedValue({ data: [] }),
    }
}));

import { SettingsProvider } from '../context/SettingsContext';

describe('ManagePage', () => {
    it('renders users tab route correctly without blank page', async () => {
        render(
            <AuthProvider>
                <SettingsProvider>
                    <MemoryRouter initialEntries={['/users']}>
                        <ManagePage />
                    </MemoryRouter>
                </SettingsProvider>
            </AuthProvider>
        );
        expect(await screen.findByText('ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ')).toBeDefined();
    });

    it('renders customers tab without inline action buttons in rows', async () => {
        render(
            <AuthProvider>
                <SettingsProvider>
                    <MemoryRouter initialEntries={['/customers']}>
                        <ManagePage />
                    </MemoryRouter>
                </SettingsProvider>
            </AuthProvider>
        );
        expect(await screen.findByText('ಭಕ್ತರು ಕಂಡುಬಂದಿಲ್ಲ')).toBeDefined();
        // Actions column header should not exist
        expect(screen.queryByText('ಕ್ರಿಯೆಗಳು')).toBeNull();
    });

    it('renders sevas tab without inline action buttons in rows', async () => {
        render(
            <AuthProvider>
                <SettingsProvider>
                    <MemoryRouter initialEntries={['/sevas']}>
                        <ManagePage />
                    </MemoryRouter>
                </SettingsProvider>
            </AuthProvider>
        );
        expect(await screen.findByText('ಸೇವೆಗಳು ಲಭ್ಯವಿಲ್ಲ')).toBeDefined();
        // Actions column header should not exist
        expect(screen.queryByText('ಕ್ರಿಯೆಗಳು')).toBeNull();
    });
});

