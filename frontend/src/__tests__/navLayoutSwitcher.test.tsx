import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NAV_CONFIG, getModuleForPath } from '../config/navConfig';
import ContextualTabBar from '../components/shell/ContextualTabBar';
import LeftNavBar from '../components/shell/LeftNavBar';
import { AuthProvider } from '../context/AuthContext';

describe('Navigation Layout Configuration', () => {
    it('configures defaultNavLayout for modules with secondary sub-tabs', () => {
        const manageModule = NAV_CONFIG.find(m => m.id === 'manage');
        expect(manageModule).toBeDefined();
        expect(manageModule?.defaultNavLayout).toBe('left');

        const accountingModule = NAV_CONFIG.find(m => m.id === 'accounting');
        expect(accountingModule).toBeDefined();
        expect(accountingModule?.defaultNavLayout).toBe('left');

        const sevaModule = NAV_CONFIG.find(m => m.id === 'seva');
        expect(sevaModule).toBeDefined();
        expect(sevaModule?.defaultNavLayout).toBe('top');
    });

    it('resolves modules correctly for paths', () => {
        expect(getModuleForPath('/app/manage')?.id).toBe('manage');
        expect(getModuleForPath('/app/manage/devotees')?.id).toBe('manage');
        expect(getModuleForPath('/app/accounting/journal')?.id).toBe('accounting');
        expect(getModuleForPath('/app/seva/booked')?.id).toBe('seva');
        expect(getModuleForPath('/app')?.id).toBe('home');
    });
});

describe('ContextualTabBar Layout Switching', () => {
    const manageModule = NAV_CONFIG.find(m => m.id === 'manage')!;

    beforeEach(() => {
        localStorage.setItem('seva_token', 'mock_token');
        localStorage.setItem('seva_user', JSON.stringify({
            username: 'admin',
            role: 'admin',
            is_active: true,
            must_change_password: false,
        }));
    });

    it('renders tabs and switch to left navigation button', () => {
        const onToggle = vi.fn();
        render(
            <AuthProvider>
                <MemoryRouter initialEntries={['/app/manage/devotees']}>
                    <ContextualTabBar
                        tabs={manageModule.tabs}
                        basePath={manageModule.path}
                        onToggleLayout={onToggle}
                    />
                </MemoryRouter>
            </AuthProvider>
        );

        // Verify tabs are rendered
        expect(screen.getByText('ಭಕ್ತರು')).toBeInTheDocument();
        expect(screen.getByText('ಸೇವೆಗಳು')).toBeInTheDocument();

        // Verify switch button is present
        const toggleBtn = screen.getByTitle('ಎಡ ಮೆನುಗೆ ಬದಲಾಯಿಸಿ');
        expect(toggleBtn).toBeInTheDocument();

        // Click the toggle button
        fireEvent.click(toggleBtn);
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('renders optional primary action button alongside toggle button', () => {
        const sevaModule = NAV_CONFIG.find(m => m.id === 'seva')!;
        const actionBtn = <button data-testid="test-action">+ ಸೇವೆ ಬುಕ್ ಮಾಡಿ</button>;

        render(
            <AuthProvider>
                <MemoryRouter initialEntries={['/app/seva/booked']}>
                    <ContextualTabBar
                        tabs={sevaModule.tabs}
                        basePath={sevaModule.path}
                        actionButton={actionBtn}
                        onToggleLayout={vi.fn()}
                    />
                </MemoryRouter>
            </AuthProvider>
        );

        expect(screen.getByTestId('test-action')).toBeInTheDocument();
        expect(screen.getByTitle('ಎಡ ಮೆನುಗೆ ಬದಲಾಯಿಸಿ')).toBeInTheDocument();
    });
});

describe('LeftNavBar Layout Switching', () => {
    const manageModule = NAV_CONFIG.find(m => m.id === 'manage')!;

    beforeEach(() => {
        localStorage.setItem('seva_token', 'mock_token');
        localStorage.setItem('seva_user', JSON.stringify({
            username: 'admin',
            role: 'admin',
            is_active: true,
            must_change_password: false,
        }));
    });

    it('renders module title, vertical tabs, and switch buttons', () => {
        const onToggle = vi.fn();
        render(
            <AuthProvider>
                <MemoryRouter initialEntries={['/app/manage/devotees']}>
                    <LeftNavBar
                        module={manageModule}
                        tabs={manageModule.tabs}
                        basePath={manageModule.path}
                        onToggleLayout={onToggle}
                    />
                </MemoryRouter>
            </AuthProvider>
        );

        // Module title
        expect(screen.getByText('ನಿರ್ವಹಣೆ')).toBeInTheDocument();

        // Tabs
        expect(screen.getByText('ಭಕ್ತರು')).toBeInTheDocument();
        expect(screen.getByText('ಸೇವೆಗಳು')).toBeInTheDocument();
        expect(screen.getByText('ವಿಶೇಷ ಘಟನೆಗಳು')).toBeInTheDocument();
        expect(screen.getByText('ಸೆಟ್ಟಿಂಗ್ಸ್')).toBeInTheDocument();

        // Switch to top bar buttons (header & footer)
        const toggleButtons = screen.getAllByTitle('ಮೇಲಿನ ಮೆನುಗೆ ಬದಲಾಯಿಸಿ');
        expect(toggleButtons.length).toBeGreaterThanOrEqual(1);

        fireEvent.click(toggleButtons[0]);
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('renders action button inside LeftNavBar when provided', () => {
        const sevaModule = NAV_CONFIG.find(m => m.id === 'seva')!;
        const actionBtn = <button data-testid="left-action">+ ಸೇವೆ ಬುಕ್ ಮಾಡಿ</button>;

        render(
            <AuthProvider>
                <MemoryRouter initialEntries={['/app/seva/booked']}>
                    <LeftNavBar
                        module={sevaModule}
                        tabs={sevaModule.tabs}
                        basePath={sevaModule.path}
                        actionButton={actionBtn}
                        onToggleLayout={vi.fn()}
                    />
                </MemoryRouter>
            </AuthProvider>
        );

        expect(screen.getByTestId('left-action')).toBeInTheDocument();
    });
});
