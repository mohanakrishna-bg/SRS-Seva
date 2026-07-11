import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { InputProvider } from './context/InputContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { useAuth } from './context/AuthContext';
import { useIdleSession } from './hooks/useIdleSession';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import ChangePasswordDialog from './components/ChangePasswordDialog';
import ProtectedRoute from './components/ProtectedRoute';
import SessionWarningModal from './components/SessionWarningModal';
import LandingPage from './pages/LandingPage';
import ManagePage from './pages/ManagePage';
import AccountingPage from './pages/AccountingPage';
import AssetsPage from './pages/AssetsPage';
import ConsumablesPage from './pages/ConsumablesPage';
import SevaPage from './pages/SevaPage';

/**
 * Auth Gate — blocks the entire app until the user is authenticated.
 * Shows LoginScreen over a blurred backdrop if not logged in.
 * Shows ChangePasswordDialog if the user must change their password.
 * Starts the idle session monitor once authenticated.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const { showWarning, secondsRemaining, extendSession, logoutNow } = useIdleSession();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-dark)]">
                <div className="w-10 h-10 border-3 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    if (user?.must_change_password) {
        return <ChangePasswordDialog />;
    }

    return (
        <>
            {children}
            <SessionWarningModal
                isOpen={showWarning}
                secondsRemaining={secondsRemaining}
                onExtend={extendSession}
                onLogout={logoutNow}
            />
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <SettingsProvider>
                <InputProvider>
                    <ToastProvider>
                        <BrowserRouter>
                            <AuthGate>
                                <Routes>
                                    <Route element={<Layout />}>
                                        <Route path="/" element={<LandingPage />} />
                                        <Route path="/seva/*" element={
                                            <ProtectedRoute module="seva">
                                                <SevaPage />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/manage/*" element={
                                            <ProtectedRoute module="settings">
                                                <ManagePage />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/accounting/*" element={
                                            <ProtectedRoute module="accounting">
                                                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg h-full">
                                                    <AccountingPage />
                                                </div>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/assets" element={
                                            <ProtectedRoute module="assets">
                                                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg h-full">
                                                    <AssetsPage />
                                                </div>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/consumables" element={
                                            <ProtectedRoute module="consumables">
                                                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg h-full">
                                                    <ConsumablesPage />
                                                </div>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Route>
                                </Routes>
                            </AuthGate>
                        </BrowserRouter>
                    </ToastProvider>
                </InputProvider>
            </SettingsProvider>
        </AuthProvider>
    );
}
