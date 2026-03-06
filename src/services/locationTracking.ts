/**
 * Location Tracking Service
 * Handles persistent GPS location tracking during active sessions
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { LocationCoord } from '@/types/location';

export class LocationTrackingService {
    private sessionId: string | null = null;
    private trackingInterval: NodeJS.Timeout | null = null;
    private readonly TRACKING_INTERVAL_MS = 30000; // 30 seconds

    /**
     * Start tracking location for a session
     * @param sessionId The session to track
     * @param getLocationFn Function to get current GPS coordinates
     */
    async startTracking(
        sessionId: string,
        getLocationFn: () => Promise<LocationCoord | null>
    ): Promise<boolean> {
        // Stop any existing tracking
        if (this.trackingInterval) {
            this.stopTracking();
        }

        this.sessionId = sessionId;

        // Record initial location immediately
        const success = await this.recordLocation(getLocationFn);
        if (!success) {
            console.error('Failed to record initial location');
            return false;
        }

        // Set up periodic location recording
        this.trackingInterval = setInterval(async () => {
            await this.recordLocation(getLocationFn);
        }, this.TRACKING_INTERVAL_MS);

        logger.info(`Location tracking started for session: ${sessionId}`, { action: 'location.tracking.start', sessionId });
        return true;
    }

    /**
     * Record current location to database
     */
    private async recordLocation(
        getLocationFn: () => Promise<LocationCoord | null>
    ): Promise<boolean> {
        if (!this.sessionId) {
            console.warn('Cannot record location: no active session');
            return false;
        }

        try {
            // Get current GPS coordinates
            const location = await getLocationFn();
            if (!location) {
                console.warn('Could not get current location');
                return false;
            }

            // Insert into session_locations table
            const { error } = await supabase.from('session_locations').insert({
                session_id: this.sessionId,
                latitude: location.lat,
                longitude: location.lng,
                accuracy: location.accuracy || 0,
                recorded_at: new Date().toISOString(),
            });

            if (error) {
                console.error('Failed to insert location:', error);
                return false;
            }

            logger.debug('Location recorded', { action: 'location.recorded', lat: location.lat, lng: location.lng });
            return true;
        } catch (error) {
            console.error('Error recording location:', error);
            return false;
        }
    }

    /**
     * Stop tracking location
     */
    stopTracking(): void {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        const sessionId = this.sessionId;
        this.sessionId = null;

        if (sessionId) {
            logger.info(`Location tracking stopped for session: ${sessionId}`, { action: 'location.tracking.stop', sessionId });
        }
    }

    /**
     * Check if currently tracking
     */
    isTracking(): boolean {
        return this.trackingInterval !== null && this.sessionId !== null;
    }

    /**
     * Get current session ID being tracked
     */
    getCurrentSessionId(): string | null {
        return this.sessionId;
    }
}

// Singleton instance
export const locationTrackingService = new LocationTrackingService();
