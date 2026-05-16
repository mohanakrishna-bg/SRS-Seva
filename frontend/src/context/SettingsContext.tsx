import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsApi } from '../api';

interface OrgSettings {
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

const defaultSettings: OrgSettings = {
    orgName: 'ಶ್ರೀ ಮಠ ಆಡಳಿತ',
    orgNameEn: 'Shri Matha Admin',
    address: '',
    addressEn: '',
    phone: '',
    whatsapp: '',
    website: '',
    foodServiceCharges: '100, 150, 200',
};

interface SettingsContextType {
    settings: OrgSettings;
    updateSettings: (newSettings: OrgSettings) => Promise<void>;
    refreshSettings: () => Promise<void>;
    loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<OrgSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const refreshSettings = async () => {
        try {
            const response = await settingsApi.get(SETTINGS_KEY);
            if (response.data && response.data.value) {
                setSettings(response.data.value);
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(response.data.value));
            }
        } catch (error) {
            console.error('Failed to fetch settings from backend', error);
            // Fallback to localStorage
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                setSettings(JSON.parse(stored));
            }
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (newSettings: OrgSettings) => {
        setSettings(newSettings);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
        try {
            await settingsApi.save(SETTINGS_KEY, newSettings);
        } catch (error) {
            console.error('Failed to save settings to backend', error);
        }
    };

    useEffect(() => {
        refreshSettings();
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
