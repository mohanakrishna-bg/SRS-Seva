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

describe('ManagePage', () => {
    it('renders users tab route correctly without blank page', async () => {
        render(
            <AuthProvider>
                <MemoryRouter initialEntries={['/manage/users']}>
                    <ManagePage />
                </MemoryRouter>
            </AuthProvider>
        );
        expect(screen.getByText('ಬಳಕೆದಾರರು')).toBeDefined();
    });

    it('renders customers tab without inline action buttons in rows', async () => {
        render(
            <AuthProvider>
                <MemoryRouter initialEntries={['/manage/customers']}>
                    <ManagePage />
                </MemoryRouter>
            </AuthProvider>
        );
        expect(screen.getByText('ಭಕ್ತರು')).toBeDefined();
        // Actions column header should not exist
        expect(screen.queryByText('ಕ್ರಿಯೆಗಳು')).toBeNull();
    });

    it('renders sevas tab without inline action buttons in rows', async () => {
        render(
            <AuthProvider>
                <MemoryRouter initialEntries={['/manage/sevas']}>
                    <ManagePage />
                </MemoryRouter>
            </AuthProvider>
        );
        expect(screen.getByText('ಸೇವೆಗಳು')).toBeDefined();
        // Actions column header should not exist
        expect(screen.queryByText('ಕ್ರಿಯೆಗಳು')).toBeNull();
    });
});

