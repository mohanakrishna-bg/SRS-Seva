import { useState, useEffect } from 'react';

interface OrgSettings {
    orgName: string;
    orgNameEn?: string;
    address: string;
    addressEn?: string;
    phone: string;
    whatsapp: string;
    website: string;
    logoImage?: string;
    bgImage?: string;
    bankName?: string;
    branchIfsc?: string;
    accountNumber?: string;
    accountType?: string;
    upiVpa?: string;
    standardSchedule?: { id: number; title: string; time: string; period: 'AM' | 'PM' }[];
}

const defaultSettings: OrgSettings = {
    orgName: 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ',
    orgNameEn: 'Sri Raghavendra Swamy Matha',
    address: '',
    phone: '',
    whatsapp: '',
    website: '',
};

const SETTINGS_KEY = 'seva_org_settings';

/**
 * Lightweight public settings hook — reads org settings without requiring
 * authentication. The backend GET /api/settings/{key} endpoint requires no auth.
 * Falls back to localStorage cache when the backend is unavailable.
 */
export function usePublicSettings() {
    const [settings, setSettings] = useState<OrgSettings>(() => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            return stored ? JSON.parse(stored) : defaultSettings;
        } catch {
            return defaultSettings;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/settings/${SETTINGS_KEY}`)
            .then(res => {
                if (!res.ok) throw new Error('settings fetch failed');
                return res.json();
            })
            .then(data => {
                if (data?.value) {
                    setSettings(data.value);
                    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.value));
                }
            })
            .catch(() => {
                // Silently use cached/default value
            })
            .finally(() => setLoading(false));
    }, []);

    return { settings, loading };
}
