import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
    module: string;
    permission?: 'read' | 'write' | 'full';
    children: React.ReactNode;
}

/**
 * Wraps a route to enforce RBAC access control.
 * - Not authenticated → redirect to / (which shows LoginScreen)
 * - No module permission → show Kannada access-denied card
 * - Has permission → render children
 */
export default function ProtectedRoute({ module, permission = 'read', children }: ProtectedRouteProps) {
    const { isAuthenticated, can } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (!can(module, permission)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full max-w-md bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-8 backdrop-blur-md shadow-lg text-center"
                >
                    <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-500/15 rounded-full flex items-center justify-center mb-4">
                        <ShieldX size={32} className="text-red-500" />
                    </div>

                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                        ಕ್ಷಮಿಸಿ, ನಿಮಗೆ ಈ ವಿಭಾಗಕ್ಕೆ ಪ್ರವೇಶವಿಲ್ಲ
                    </h2>

                    <p className="text-sm text-[var(--text-secondary)] mb-6">
                        ಪ್ರವೇಶ ಪಡೆಯಲು ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.
                    </p>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:brightness-110 transition-all shadow-md"
                    >
                        <Home size={16} />
                        ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ
                    </Link>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}
