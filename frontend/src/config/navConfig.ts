/**
 * navConfig.ts
 * Single source of truth for the internal app navigation.
 * Adding a new module = one new entry here.
 */

import type { LucideIcon } from 'lucide-react';
import {
    Home,
    ClipboardList,
    BarChart3,
    Settings,
    BookOpen,
    Building2,
    Landmark,
    LayoutDashboard,
    Users,
    HeartHandshake,
    Sparkles,
    Package,
    Shield,
    UserCog,
    FileBarChart2,
} from 'lucide-react';
import type { LayoutContextType } from '../components/Layout';

export interface Tab {
    id: string;
    label: string;
    icon?: LucideIcon;
    path: string;
    permission?: string;
}

export interface PrimaryAction {
    label: string;
    contextKey: keyof LayoutContextType;
}

export interface ModuleConfig {
    id: string;
    label: string;
    icon: LucideIcon;
    path: string;
    permission: string;
    tabs: Tab[];
    primaryAction?: PrimaryAction;
}

export const NAV_CONFIG: ModuleConfig[] = [
    {
        id: 'home',
        label: 'ಮುಖಪುಟ',
        icon: Home,
        path: '/app',
        permission: '',
        tabs: [],
    },
    {
        id: 'seva',
        label: 'ಸೇವೆ',
        icon: ClipboardList,
        path: '/app/seva',
        permission: 'seva',
        primaryAction: { label: '+ ಸೇವೆ ಬುಕ್ ಮಾಡಿ', contextKey: 'openRegModal' },
        tabs: [
            { id: 'booked',  label: 'ಸೇವೆ ನೋಂದಣಿ',  icon: ClipboardList,  path: 'booked'  },
            { id: 'reports', label: 'ವರದಿಗಳು',       icon: FileBarChart2,  path: 'reports' },
        ],
    },
    {
        id: 'accounting',
        label: 'ಲೆಕ್ಕಪತ್ರ',
        icon: BarChart3,
        path: '/app/accounting',
        permission: 'accounting',
        tabs: [
            { id: 'dashboard', label: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',  icon: LayoutDashboard, path: 'dashboard'  },
            { id: 'journal',   label: 'ಜರ್ನಲ್',          icon: BookOpen,        path: 'journal'    },
            { id: 'vouchers',  label: 'ವೌಚರ್',            icon: ClipboardList,   path: 'vouchers'   },
            { id: 'bank',      label: 'ಬ್ಯಾಂಕ್ & ನಗದು',  icon: Landmark,        path: 'bank'       },
            { id: 'reconcile', label: 'ಸಮತೋಲನ',           icon: Building2,       path: 'reconcile'  },
            { id: 'reports',   label: 'ವರದಿಗಳು',          icon: BarChart3,       path: 'reports'    },
        ],
    },
    {
        id: 'manage',
        label: 'ನಿರ್ವಹಣೆ',
        icon: Settings,
        path: '/app/manage',
        permission: 'settings',
        tabs: [
            { id: 'customers', label: 'ಭಕ್ತರು',              icon: Users,          path: 'customers' },
            { id: 'sevas',     label: 'ಸೇವೆಗಳು',            icon: HeartHandshake, path: 'sevas'     },
            { id: 'events',    label: 'ವಿಶೇಷ ಘಟನೆಗಳು',      icon: Sparkles,       path: 'events'    },
            { id: 'content',   label: 'ಸೌಲಭ್ಯ & ಕಾರ್ಯಕ್ರಮ', icon: Building2,      path: 'content'   },
            { id: 'settings',  label: 'ಸೆಟ್ಟಿಂಗ್ಸ್',          icon: Settings,       path: 'settings'  },
            { id: 'roles',     label: 'ಪಾತ್ರಗಳು',            icon: Shield,         path: 'roles'     },
            { id: 'users',     label: 'ಬಳಕೆದಾರರು',           icon: UserCog,        path: 'users'     },
        ],
    },
    {
        id: 'assets',
        label: 'ಆಸ್ತಿಗಳು',
        icon: Building2,
        path: '/app/assets',
        permission: 'assets',
        tabs: [],
    },
    {
        id: 'consumables',
        label: 'ಬಳಕೆ ವಸ್ತುಗಳು',
        icon: Package,
        path: '/app/consumables',
        permission: 'consumables',
        tabs: [],
    },
];

/** Find module config by current pathname */
export function getModuleForPath(pathname: string): ModuleConfig | undefined {
    const sorted = [...NAV_CONFIG].sort((a, b) => b.path.length - a.path.length);
    return (
        sorted.find(m => m.path !== '/app' && pathname.startsWith(m.path)) ??
        (pathname === '/app' || pathname === '/app/' ? NAV_CONFIG[0] : undefined)
    );
}
