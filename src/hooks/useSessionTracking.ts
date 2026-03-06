/**
 * useSessionTracking Hook
 * Automatically starts/stops GPS tracking for active sessions
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from './useLocation';
import { locationTrackingService } from '@/services/locationTracking';

interface UseSessionTrackingOptions {
    sessionId: string | null;
    isActive: boolean; // true when session status is 'started', 'picked_up', or 'arrived'
}

export function useSessionTracking({ sessionId, isActive }: UseSessionTrackingOptions) {
    const [trackingError, setTrackingError] = useState(false);

    const {
        getCurrentPosition,
        startTracking: startGPSTracking,
        stopTracking: stopGPSTracking,
        isTracking: isGPSActive,
        permissionStatus,
        error: locationError,
    } = useLocation({
        enableHighAccuracy: true,
        watchPosition: false, // We'll manage watch manually
    });

    /**
     * Start session location tracking
     */
    const startSessionTracking = useCallback(async () => {
        if (!sessionId || !isActive) return;

        // Start GPS tracking
        startGPSTracking();

        // Start database recording
        const success = await locationTrackingService.startTracking(
            sessionId,
            getCurrentPosition
        );

        if (!success) {
            setTrackingError(true);
            toast.error(
                'Konum takibi başlatılamadı. GPS izninizi kontrol edin.',
                { duration: 8000 }
            );
        } else {
            // Clear any previous error on successful start
            setTrackingError(false);
        }
    }, [sessionId, isActive, startGPSTracking, getCurrentPosition]);

    /**
     * Stop session location tracking
     */
    const stopSessionTracking = useCallback(() => {
        stopGPSTracking();
        locationTrackingService.stopTracking();
    }, [stopGPSTracking]);

    /**
     * Auto-start/stop tracking based on session state
     */
    useEffect(() => {
        if (sessionId && isActive) {
            startSessionTracking();

            return () => {
                stopSessionTracking();
            };
        } else {
            // Session ended or not active
            stopSessionTracking();
        }
    }, [sessionId, isActive, startSessionTracking, stopSessionTracking]);

    return {
        isTracking: isGPSActive && locationTrackingService.isTracking(),
        isLocationEnabled: permissionStatus === 'granted',
        locationError,
        trackingError,
        startTracking: startSessionTracking,
        stopTracking: stopSessionTracking,
    };
}
