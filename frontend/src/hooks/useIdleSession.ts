import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;   // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000;  // Show warning 5 min before timeout
const WARNING_AT_MS = IDLE_TIMEOUT_MS - WARNING_BEFORE_MS; // 25 minutes

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown'];

interface UseIdleSessionReturn {
    /** Whether the warning modal should be shown */
    showWarning: boolean;
    /** Seconds remaining until auto-logout */
    secondsRemaining: number;
    /** Extend the session (reset the idle timer) */
    extendSession: () => void;
    /** Logout immediately */
    logoutNow: () => void;
}

/**
 * Monitors user activity and manages idle session timeout.
 * - After 25 minutes of idle: triggers warning
 * - After 30 minutes of idle: auto-logout
 * - Any user activity while NOT in warning state resets the timer
 * - During warning state, only "Extend Session" button resets it
 */
export function useIdleSession(): UseIdleSessionReturn {
    const { isAuthenticated, logout } = useAuth();
    const [showWarning, setShowWarning] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(WARNING_BEFORE_MS / 1000);

    const lastActivityRef = useRef(Date.now());
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearAllTimers = useCallback(() => {
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        warningTimerRef.current = null;
        logoutTimerRef.current = null;
        countdownRef.current = null;
    }, []);

    const startTimers = useCallback(() => {
        clearAllTimers();
        lastActivityRef.current = Date.now();
        setShowWarning(false);

        // Timer 1: Show warning at 25 minutes
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
            setSecondsRemaining(WARNING_BEFORE_MS / 1000);

            // Start countdown
            const startedAt = Date.now();
            countdownRef.current = setInterval(() => {
                const elapsed = Date.now() - startedAt;
                const remaining = Math.max(0, Math.ceil((WARNING_BEFORE_MS - elapsed) / 1000));
                setSecondsRemaining(remaining);

                if (remaining <= 0) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                }
            }, 1000);
        }, WARNING_AT_MS);

        // Timer 2: Auto-logout at 30 minutes
        logoutTimerRef.current = setTimeout(() => {
            clearAllTimers();
            setShowWarning(false);
            logout();
        }, IDLE_TIMEOUT_MS);
    }, [clearAllTimers, logout]);

    const extendSession = useCallback(() => {
        startTimers();
    }, [startTimers]);

    const logoutNow = useCallback(() => {
        clearAllTimers();
        setShowWarning(false);
        logout();
    }, [clearAllTimers, logout]);

    // Handle user activity — reset timers only when NOT in warning state
    useEffect(() => {
        if (!isAuthenticated) return;

        const handleActivity = () => {
            // Don't reset on activity if warning is showing
            // (user must explicitly click "Extend Session")
            if (!showWarning) {
                const now = Date.now();
                // Throttle: only reset if > 30s since last reset
                if (now - lastActivityRef.current > 30000) {
                    startTimers();
                }
            }
        };

        ACTIVITY_EVENTS.forEach((event) =>
            window.addEventListener(event, handleActivity, { passive: true })
        );

        return () => {
            ACTIVITY_EVENTS.forEach((event) =>
                window.removeEventListener(event, handleActivity)
            );
        };
    }, [isAuthenticated, showWarning, startTimers]);

    // Start timers on mount / auth change
    useEffect(() => {
        if (isAuthenticated) {
            startTimers();
        } else {
            clearAllTimers();
            setShowWarning(false);
        }

        return () => clearAllTimers();
    }, [isAuthenticated, startTimers, clearAllTimers]);

    return { showWarning, secondsRemaining, extendSession, logoutNow };
}
