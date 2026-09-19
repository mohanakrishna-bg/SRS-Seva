import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import ErrorBoundary from './components/ErrorBoundary';

// Public layout + pages
import PublicLayout from './components/public/PublicLayout';
import PublicHomePage from './pages/public/PublicHomePage';
import PublicAboutPage from './pages/public/PublicAboutPage';
import PublicSevasPage from './pages/public/PublicSevasPage';
import PublicFacilitiesPage from './pages/public/PublicFacilitiesPage';
import PublicEventsPage from './pages/public/PublicEventsPage';
import PublicContactPage from './pages/public/PublicContactPage';

// App (authenticated) pages
import LandingPage from './pages/LandingPage';
import ManagePage from './pages/ManagePage';
import AccountingPage from './pages/AccountingPage';
import AssetsPage from './pages/AssetsPage';
import ConsumablesPage from './pages/ConsumablesPage';
import SevaPage from './pages/SevaPage';

/**
 * LoginPage — a standalone route at /login.
 * Shows the LoginScreen overlay on top of a minimal saffron background.
 * On successful login, the AuthGate inside /app/* will let the user through.
 */
function LoginPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated) {
        // Already logged in — go straight to the app
        return <Navigate to="/app" replace />;
    }

    return (
        <div
            className="min-h-screen"
            style={{
                background: 'linear-gradient(135deg, var(--pub-hero-from, #E8652A) 0%, var(--pub-hero-to, #6B1D2A) 100%)',
            }}
        >
            {/* LoginScreen is positioned fixed/absolute so it renders over any background */}
            <LoginScreen onSuccess={() => navigate('/app', { replace: true })} />
        </div>
    );
}

/**
 * AuthGate — blocks the /app subtree until the user is authenticated.
 * Shows LoginScreen overlay. Starts the idle session monitor once authenticated.
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
        return <Navigate to="/login" replace />;
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
                            <Routes>
                                {/* ===========================
                                    PUBLIC ROUTES (no auth)
                                    =========================== */}
                                <Route element={<PublicLayout />}>
                                    <Route path="/" element={<PublicHomePage />} />
                                    <Route path="/about" element={<PublicAboutPage />} />
                                    <Route path="/sevas" element={<PublicSevasPage />} />
                                    <Route path="/facilities" element={<PublicFacilitiesPage />} />
                                    <Route path="/events" element={<PublicEventsPage />} />
                                    <Route path="/contact" element={<PublicContactPage />} />
                                </Route>

                                {/* Login page (hidden — only via /login URL) */}
                                <Route path="/login" element={<LoginPage />} />

                                {/* ===========================
                                    APP ROUTES (auth required)
                                    =========================== */}
                                <Route
                                    path="/app/*"
                                    element={
                                        <AuthGate>
                                            <ErrorBoundary fallbackTitle="ಅಪ್ಲಿಕೇಶನ್ ದೋಷ ಸಂಭವಿಸಿದೆ">
                                                <Routes>
                                                    <Route element={<Layout />}>
                                                        <Route index element={<LandingPage />} />
                                                        <Route path="seva/*" element={
                                                            <ProtectedRoute module="seva">
                                                                <SevaPage />
                                                            </ProtectedRoute>
                                                        } />
                                                        <Route path="manage/*" element={
                                                            <ProtectedRoute module="settings">
                                                                <ManagePage />
                                                            </ProtectedRoute>
                                                        } />
                                                        <Route path="accounting/*" element={
                                                            <ProtectedRoute module="accounting">
                                                                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg h-full">
                                                                    <AccountingPage />
                                                                </div>
                                                            </ProtectedRoute>
                                                        } />
                                                        <Route path="assets" element={
                                                            <ProtectedRoute module="assets">
                                                                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg h-full">
                                                                    <AssetsPage />
                                                                </div>
                                                            </ProtectedRoute>
                                                        } />
                                                        <Route path="consumables" element={
                                                            <ProtectedRoute module="consumables">
                                                                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg h-full">
                                                                    <ConsumablesPage />
                                                                </div>
                                                            </ProtectedRoute>
                                                        } />
                                                        <Route path="*" element={<Navigate to="/app" replace />} />
                                                    </Route>
                                                </Routes>
                                            </ErrorBoundary>
                                        </AuthGate>
                                    }
                                />

                                {/* Legacy routes redirect to /app/... */}
                                <Route path="/manage/*" element={<Navigate to="/app/manage" replace />} />
                                <Route path="/seva/*" element={<Navigate to="/app/seva" replace />} />
                                <Route path="/accounting/*" element={<Navigate to="/app/accounting" replace />} />
                                <Route path="/assets" element={<Navigate to="/app/assets" replace />} />
                                <Route path="/consumables" element={<Navigate to="/app/consumables" replace />} />

                                {/* Catch-all — send everything else to public home */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </BrowserRouter>
                    </ToastProvider>
                </InputProvider>
            </SettingsProvider>
        </AuthProvider>
    );
}
