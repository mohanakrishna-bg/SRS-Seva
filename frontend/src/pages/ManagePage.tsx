/**
 * ManagePage — Manage module content area.
 *
 * Tab strip is now rendered by Layout via navConfig.
 * This component only contains the routable sub-views.
 */
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import CustomersPage from './CustomersPage';
import SevasPage from './SevasPage';
import SpecialEventsPage from './SpecialEventsPage';
import SettingsPage from './SettingsPage';
import UserAdminTab from '../components/UserAdminTab';
import RoleManagementTab from '../components/RoleManagementTab';
import PublicContentTab from '../components/PublicContentTab';
import ErrorBoundary from '../components/ErrorBoundary';

export default function ManagePage() {
    const location = useLocation();

    return (
        <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="h-full"
        >
            <ErrorBoundary fallbackTitle="ನಿರ್ವಹಣೆ ಪುಟವನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ">
                <Routes>
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="sevas"     element={<SevasPage />} />
                    <Route path="events"    element={<SpecialEventsPage />} />
                    <Route path="content"   element={<PublicContentTab />} />
                    <Route path="settings"  element={<SettingsPage />} />
                    <Route path="roles"     element={<RoleManagementTab />} />
                    <Route path="users"     element={<UserAdminTab />} />
                    <Route path=""          element={<Navigate to="customers" replace />} />
                </Routes>
            </ErrorBoundary>
        </motion.div>
    );
}
