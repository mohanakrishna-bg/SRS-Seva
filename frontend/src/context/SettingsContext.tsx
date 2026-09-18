import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsApi } from '../api';

export interface OrgSettings {
    orgName: string;
    orgNameEn?: string;
    address: string;
    addressEn?: string;
    phone: string;
    whatsapp: string;
    website: string;
    foodServiceCharges?: string;
    logoImage?: string;
    bgImage?: string;
    bankName?: string;
    branchIfsc?: string;
    accountNumber?: string;
    accountType?: string;
    upiVpa?: string;
    upiQrCode?: string;
    standardSchedule?: { id: number; title: string; time: string; period: 'AM' | 'PM' }[];
}

const SETTINGS_KEY = 'seva_org_settings';

export const defaultSettings: OrgSettings = {
    orgName: 'ಶ್ರೀ ಗುರು  ರಾಘವೇಂದ್ರ ಸೇವಾ ಟ್ರಸ್ಟ್ (ರಿ.) ',
    orgNameEn: 'Sri Guru Raghavendra Seva Trust (Regd.)',
    address: 'ನಂ. ಟಿ- 1, 10 ನೆಯ ಮುಖ್ಯ ರಸ್ತೆ, 4 ನೆಯ ಹಂತ, ತೊಣಚಿಕೊಪ್ಪಲು ಬಡಾವಣೆ, ಮೈಸೂರು 570009 ',
    addressEn: '# T-1, 10th Main Road, 4th Stage, T.K. Layout, Mysuru 570009',
    phone: '9876543210',
    whatsapp: '9999999999',
    website: 'https://srigururaghavendrasevatrust.org',
    foodServiceCharges: '200, 220, 240, 260, 280, 300',
    upiVpa: 'pinelabs.stq3957386@pineaxis',
    standardSchedule: [
        { id: 1, title: 'ಅಭಿಷೇಕ', time: '6:30', period: 'AM' },
        { id: 2, title: 'ಬೆಳಗಿನ ಪೂಜೆ', time: '8:00', period: 'AM' },
        { id: 3, title: 'ಮಹಾಮಂಗಳಾರತಿ', time: '12:30', period: 'PM' },
        { id: 4, title: 'ತೀರ್ಥ ಪ್ರಸಾದ', time: '1:00', period: 'PM' },
        { id: 5, title: 'ಸಂಜೆ ಪೂಜೆ', time: '6:30', period: 'PM' },
        { id: 6, title: 'ರಾತ್ರಿ ಮಂಗಳಾರತಿ', time: '8:00', period: 'PM' },
    ],
};

interface SettingsContextType {
    settings: OrgSettings;
    updateSettings: (newSettings: OrgSettings) => Promise<void>;
    refreshSettings: () => Promise<void>;
    loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<OrgSettings>(() => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Clean up stale placeholder name if stored from earlier builds
                if (parsed.orgName === 'ಶ್ರೀ ಮಠ ಆಡಳಿತ') {
                    parsed.orgName = defaultSettings.orgName;
                    parsed.orgNameEn = defaultSettings.orgNameEn;
                }
                return { ...defaultSettings, ...parsed };
            }
            return defaultSettings;
        } catch {
            return defaultSettings;
        }
    });
    const [loading, setLoading] = useState(true);

    const refreshSettings = async () => {
        try {
            const response = await settingsApi.get(SETTINGS_KEY);
            if (response.data && response.data.value) {
                const merged = { ...defaultSettings, ...response.data.value };
                setSettings(merged);
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
            }
        } catch (error) {
            console.error('Failed to fetch settings from backend', error);
            // Fallback to localStorage merged with defaults
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setSettings({ ...defaultSettings, ...parsed });
                } catch {
                    setSettings(defaultSettings);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (newSettings: OrgSettings) => {
        const merged = { ...defaultSettings, ...newSettings };
        setSettings(merged);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
        try {
            await settingsApi.save(SETTINGS_KEY, merged);
        } catch (error) {
            console.error('Failed to save settings to backend', error);
        }
    };

    useEffect(() => {
        refreshSettings();

        // Cross-tab / cross-window synchronization
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === SETTINGS_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    setSettings({ ...defaultSettings, ...parsed });
                } catch {
                    // Ignore JSON parse error
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, refreshSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
