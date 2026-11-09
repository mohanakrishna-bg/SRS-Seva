import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { NAV_CONFIG, getModuleForPath } from '../config/navConfig';
import ContextualTabBar from '../components/shell/ContextualTabBar';
import LeftNavBar from '../components/shell/LeftNavBar';
import SevaReportsTab from '../components/seva/SevaReportsTab';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../api', () => ({
    statsApi: {
        dailySummary: vi.fn().mockResolvedValue({ data: {} }),
    },
    sevaReportsApi: {
        getSevaBookings: vi.fn().mockResolvedValue({ data: [] }),
        getHastodaka: vi.fn().mockResolvedValue({ data: [] }),
    },
}));

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

    it('configures single-level subItems for reports tab under seva module (ADR 0009)', () => {
        const sevaModule = NAV_CONFIG.find(m => m.id === 'seva')!;
        const reportsTab = sevaModule.tabs.find(t => t.id === 'reports');
        expect(reportsTab).toBeDefined();
        expect(reportsTab?.subItems).toBeDefined();
        expect(reportsTab?.subItems?.length).toBe(6);

        const priestReport = reportsTab?.subItems?.find(s => s.id === 'daily_priest');
        expect(priestReport).toBeDefined();
        expect(priestReport?.label).toBe('ಸೇವಾ ಸಂಕಲ್ಪ ಪಟ್ಟಿ');
        expect(priestReport?.group).toBe('ದೈನಂದಿನ');

        const kitchenReport = reportsTab?.subItems?.find(s => s.id === 'daily_kitchen');
        expect(kitchenReport).toBeDefined();
        expect(kitchenReport?.label).toBe('ಹಸ್ತೋದಕ ಲೆಕ್ಕ');
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

    it('renders single-level indented sub-menu under active tab with subItems (ADR 0009)', () => {
        const sevaModule = NAV_CONFIG.find(m => m.id === 'seva')!;

        render(
            <AuthProvider>
                <MemoryRouter initialEntries={['/app/seva/reports/daily_priest']}>
                    <LeftNavBar
                        module={sevaModule}
                        tabs={sevaModule.tabs}
                        basePath={sevaModule.path}
                        onToggleLayout={vi.fn()}
                    />
                </MemoryRouter>
            </AuthProvider>
        );

        // Parent tab is rendered
        expect(screen.getByText('ವರದಿಗಳು')).toBeInTheDocument();

        // Indented sub-items are rendered because reports tab is active
        expect(screen.getByText('ಸೇವಾ ಸಂಕಲ್ಪ ಪಟ್ಟಿ')).toBeInTheDocument();
        expect(screen.getByText('ಹಸ್ತೋದಕ ಲೆಕ್ಕ')).toBeInTheDocument();
        expect(screen.getByText('ದಿನಾಂಕವಾರು ವಿವರ')).toBeInTheDocument();
        expect(screen.getByText('ಹಸ್ತೋದಕ ವಿತರಣೆ')).toBeInTheDocument();
        expect(screen.getByText('ಹಣಕಾಸು')).toBeInTheDocument();

        // Check active link target
        const priestLink = screen.getByText('ಸೇವಾ ಸಂಕಲ್ಪ ಪಟ್ಟಿ').closest('a');
        expect(priestLink).toHaveAttribute('href', '/app/seva/reports/daily_priest');
    });

    it('collapses sub-menu when parent tab is not active', () => {
        const sevaModule = NAV_CONFIG.find(m => m.id === 'seva')!;

        render(
            <AuthProvider>
                <MemoryRouter initialEntries={['/app/seva/booked']}>
                    <LeftNavBar
                        module={sevaModule}
                        tabs={sevaModule.tabs}
                        basePath={sevaModule.path}
                        onToggleLayout={vi.fn()}
                    />
                </MemoryRouter>
            </AuthProvider>
        );

        // Parent tabs are rendered
        expect(screen.getByText('ಸೇವೆ ನೋಂದಣಿ')).toBeInTheDocument();
        expect(screen.getByText('ವರದಿಗಳು')).toBeInTheDocument();

        // Sub-items must NOT be in the document when reports tab is inactive
        expect(screen.queryByText('ಸೇವಾ ಸಂಕಲ್ಪ ಪಟ್ಟಿ')).toBeNull();
        expect(screen.queryByText('ಹಸ್ತೋದಕ ಲೆಕ್ಕ')).toBeNull();
    });
});

describe('SevaReportsTab Contextual Sidebar Suppression (ADR 0009)', () => {
    const LayoutShell = ({ mode }: { mode: 'left' | 'top' }) => {
        return <Outlet context={{ navLayoutMode: mode }} />;
    };

    it('suppresses internal 320px catalog sidebar when navLayoutMode is left', () => {
        render(
            <MemoryRouter initialEntries={['/app/seva/reports/daily_priest']}>
                <Routes>
                    <Route element={<LayoutShell mode="left" />}>
                        <Route path="/app/seva/reports/:reportId" element={<SevaReportsTab />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        // Internal catalog sidebar header must NOT be rendered
        expect(screen.queryByText('ವರದಿಗಳ ಪಟ್ಟಿ')).toBeNull();

        // Main report title in viewer should still be rendered
        expect(screen.getByText('ಮಾರನೆಯ ದಿನದ ಸೇವಾ ಸಂಕಲ್ಪ ಪಟ್ಟಿ')).toBeInTheDocument();
    });

    it('retains internal catalog sidebar when navLayoutMode is top', () => {
        render(
            <MemoryRouter initialEntries={['/app/seva/reports/daily_priest']}>
                <Routes>
                    <Route element={<LayoutShell mode="top" />}>
                        <Route path="/app/seva/reports/:reportId" element={<SevaReportsTab />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        // Internal catalog sidebar header MUST be rendered in top mode
        expect(screen.getByText('ವರದಿಗಳ ಪಟ್ಟಿ')).toBeInTheDocument();
    });
});
