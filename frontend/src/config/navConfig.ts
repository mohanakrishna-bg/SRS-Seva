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
    CheckCircle2,
    Flame,
    UtensilsCrossed,
    FileSpreadsheet,
    PieChart,
    AlertCircle,
} from 'lucide-react';
import type { LayoutContextType } from '../components/Layout';

export type NavLayoutMode = 'top' | 'left';

export interface SubItem {
    id: string;
    label: string;
    path: string;
    group?: string;
    icon?: LucideIcon;
    permission?: string;
    description?: string;
}

export interface Tab {
    id: string;
    label: string;
    icon?: LucideIcon;
    path: string;
    permission?: string;
    subItems?: SubItem[];
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
    defaultNavLayout?: NavLayoutMode;
}

export const NAV_CONFIG: ModuleConfig[] = [
    {
        id: 'home',
        label: 'ಮುಖಪುಟ',
        icon: Home,
        path: '/app',
        permission: '',
        primaryAction: { label: '+ ಸೇವೆ ಬುಕ್ ಮಾಡಿ', contextKey: 'openRegModal' },
        tabs: [],
    },
    {
        id: 'seva',
        label: 'ಸೇವೆ',
        icon: ClipboardList,
        path: '/app/seva',
        permission: 'seva',
        primaryAction: { label: '+ ಸೇವೆ ಬುಕ್ ಮಾಡಿ', contextKey: 'openRegModal' },
        defaultNavLayout: 'top',
        tabs: [
            { id: 'booked',      label: 'ಸೇವೆ ನೋಂದಣಿ',   icon: ClipboardList,  path: 'booked'      },
            { id: 'fulfilment',  label: 'ಸೇವಾ ಪೂರೈಕೆ',   icon: CheckCircle2,   path: 'fulfilment'  },
            {
                id: 'reports',
                label: 'ವರದಿಗಳು',
                icon: FileBarChart2,
                path: 'reports',
                subItems: [
                    { id: 'daily_priest',           group: 'ದೈನಂದಿನ',     label: 'ಸೇವಾ ಸಂಕಲ್ಪ ಪಟ್ಟಿ', path: 'daily_priest',           icon: Flame,           description: 'ಮಾರನೆಯ ದಿನದ ಸೇವಾ ಸಂಕಲ್ಪ ಪಟ್ಟಿ' },
                    { id: 'daily_kitchen',          group: 'ದೈನಂದಿನ',     label: 'ಹಸ್ತೋದಕ ಲೆಕ್ಕ',     path: 'daily_kitchen',          icon: UtensilsCrossed, description: 'ಮಾರನೆಯ ದಿನದ ಹಸ್ತೋದಕ ಲೆಕ್ಕ' },
                    { id: 'on_demand_full',         group: 'ಆನ್-ಡಿಮಾಂಡ್', label: 'ದಿನಾಂಕವಾರು ವಿವರ',  path: 'on_demand_full',         icon: FileSpreadsheet, description: 'ದಿನಾಂಕವಾರು ಸೇವಾ ಬುಕಿಂಗ್ ಪೂರ್ಣ ವಿವರ' },
                    { id: 'hastodaka_distribution', group: 'ಆನ್-ಡಿಮಾಂಡ್', label: 'ಹಸ್ತೋದಕ ವಿತರಣೆ',    path: 'hastodaka_distribution', icon: BarChart3,       description: 'ಅವಧಿಯ ದಿನವಾರು ಹಸ್ತೋದಕ ವಿತರಣೆ' },
                    { id: 'exigency_exceptions',    group: 'ಆನ್-ಡಿಮಾಂಡ್', label: 'ಅಪವಾದ ವರದಿ',        path: 'exigency_exceptions',    icon: AlertCircle,     description: 'ವಿನಾಯಿತಿ / ಅಪವಾದ ವರದಿ' },
                    { id: 'financial_summary',      group: 'ಹಣಕಾಸು',      label: 'ಹಣಕಾಸು ಸಾರಾಂಶ',     path: 'financial_summary',      icon: PieChart,        description: 'ದೈನಂದಿನ / ಅವಧಿಯ ಹಣಕಾಸು ಮತ್ತು ಪಾವತಿ ವಿವರ' },
                ],
            },
            { id: 'analytics',   label: 'ವಿಶ್ಲೇಷಣೆ',      icon: BarChart3,      path: 'analytics'   },
        ],
    },
    {
        id: 'accounting',
        label: 'ಲೆಕ್ಕಪತ್ರ',
        icon: BarChart3,
        path: '/app/accounting',
        permission: 'accounting',
        defaultNavLayout: 'left',
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
        defaultNavLayout: 'left',
        tabs: [
            { id: 'devotees',  label: 'ಭಕ್ತರು',              icon: Users,          path: 'devotees', permission: 'customers' },
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
