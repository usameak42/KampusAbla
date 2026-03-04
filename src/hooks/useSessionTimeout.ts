import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 2 * 60 * 1000; // 2 minutes before timeout
const PARENT_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const SITTER_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
const REMEMBER_ME_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days

export function useSessionTimeout() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  const [warningType, setWarningType] = useState<'inactivity' | 'absolute' | null>(null);

  const isPublicRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

  // Parse localStorage safely
  const getStoredTime = (key: string): number | null => {
    const val = localStorage.getItem(key);
    if (!val) return null;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? null : parsed;
  };

  const logout = useCallback(async () => {
    localStorage.removeItem('session_start_time');
    localStorage.removeItem('last_activity_time');
    localStorage.removeItem('remember_me');
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }, [navigate]);

  const resetActivity = useCallback(() => {
    if (!user || isPublicRoute) return;
    localStorage.setItem('last_activity_time', Date.now().toString());
    if (showWarning && warningType === 'inactivity') {
      setShowWarning(false);
      setWarningType(null);
    }
  }, [user, isPublicRoute, showWarning, warningType]);

  const keepSessionAlive = useCallback(() => {
    if (warningType === 'inactivity') {
      resetActivity();
    } else if (warningType === 'absolute') {
      // For absolute timeouts, extending means resetting the start time
      // This is a design decision; we allow them to stay signed in if they catch the warning
      localStorage.setItem('session_start_time', Date.now().toString());
      setShowWarning(false);
      setWarningType(null);
    }
  }, [warningType, resetActivity]);

  const checkTimeouts = useCallback(() => {
    if (!user || isPublicRoute) return;

    const now = Date.now();
    const lastActivity = getStoredTime('last_activity_time') || now;
    const sessionStart = getStoredTime('session_start_time') || now;
    const rememberMe = localStorage.getItem('remember_me') === 'true';

    // 1. Check Inactivity
    const timeSinceLastActivity = now - lastActivity;
    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      logout();
      return;
    } else if (timeSinceLastActivity >= INACTIVITY_TIMEOUT - WARNING_BEFORE) {
      if (!showWarning || warningType !== 'inactivity') {
        setShowWarning(true);
        setWarningType('inactivity');
      }
    }

    // 2. Check Absolute Timeout
    let absoluteLimit = PARENT_TIMEOUT; // Default to parent
    if (rememberMe) {
      absoluteLimit = REMEMBER_ME_TIMEOUT;
    } else if (user.user_metadata?.role === 'sitter') {
      absoluteLimit = SITTER_TIMEOUT;
    }

    const timeSinceStart = now - sessionStart;
    if (timeSinceStart >= absoluteLimit) {
      logout();
      return;
    } else if (timeSinceStart >= absoluteLimit - WARNING_BEFORE) {
      if (!showWarning || warningType !== 'absolute') {
        setShowWarning(true);
        setWarningType('absolute');
      }
    }
  }, [user, isPublicRoute, showWarning, warningType, logout]);

  // Set up activity listeners
  useEffect(() => {
    if (!user || isPublicRoute) return;

    // Initialize items if missing
    if (!localStorage.getItem('last_activity_time')) {
      localStorage.setItem('last_activity_time', Date.now().toString());
    }
    if (!localStorage.getItem('session_start_time')) {
      localStorage.setItem('session_start_time', Date.now().toString());
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetActivity, { passive: true }));

    const intervalId = setInterval(checkTimeouts, 30000); // Check every 30 seconds

    return () => {
      events.forEach(event => window.removeEventListener(event, resetActivity));
      clearInterval(intervalId);
    };
  }, [user, isPublicRoute, resetActivity, checkTimeouts]);

  // Handle auth state changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'supabase.auth.token' && e.newValue === null) {
        // Logged out from another tab
        navigate('/login', { replace: true });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  return { showWarning, warningType, keepSessionAlive, logout };
}
