/**
 * useSessionTracking Hook
 * Automatically starts/stops GPS tracking for active sessions
 */

import { useCallback, useEffect } from 'react';
import { useLocation } from './useLocation';
import { locationTrackingService } from '@/services/locationTracking';

interface UseSessionTrackingOptions {
    sessionId: string | null;
    isActive: boolean; // true when session status is 'started', 'picked_up', or 'arrived'
}

export function useSessionTracking({ sessionId, isActive }: UseSessionTrackingOptions) {
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
            console.error('Failed to start location tracking');
            // TODO: Show user error notification
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
        startTracking: startSessionTracking,
        stopTracking: stopSessionTracking,
    };
}
