/**
 * useSessionLocationUpdates Hook
 * Subscribe to real-time location updates for a session (Parent view)
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { LocationCoord } from '@/types/location';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface SessionLocation {
    id: string;
    session_id: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    recorded_at: string;
}

export function useSessionLocationUpdates(sessionId: string | null) {
    const [currentLocation, setCurrentLocation] = useState<LocationCoord | null>(null);
    const [locationHistory, setLocationHistory] = useState<LocationCoord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch latest location from database
     */
    const fetchLatestLocation = useCallback(async () => {
        if (!sessionId) return;

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('session_locations')
                .select('*')
                .eq('session_id', sessionId)
                .order('recorded_at', { ascending: false })
                .limit(1)
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    // No rows found - session hasn't started tracking yet
                    setCurrentLocation(null);
                } else {
                    throw fetchError;
                }
            } else if (data) {
                const location: LocationCoord = {
                    lat: data.latitude,
                    lng: data.longitude,
                    accuracy: data.accuracy,
                    timestamp: new Date(data.recorded_at),
                };
                setCurrentLocation(location);
            }
        } catch (err) {
            console.error('Error fetching location:', err);
            setError('Konum bilgisi alınamadı');
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    /**
     * Fetch all location history for path visualization
     */
    const fetchLocationHistory = useCallback(async () => {
        if (!sessionId) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('session_locations')
                .select('*')
                .eq('session_id', sessionId)
                .order('recorded_at', { ascending: true });

            if (fetchError) throw fetchError;

            if (data) {
                const history: LocationCoord[] = data.map((loc) => ({
                    lat: loc.latitude,
                    lng: loc.longitude,
                    accuracy: loc.accuracy,
                    timestamp: new Date(loc.recorded_at),
                }));
                setLocationHistory(history);
            }
        } catch (err) {
            console.error('Error fetching location history:', err);
        }
    }, [sessionId]);

    /**
     * Subscribe to real-time location updates
     */
    useEffect(() => {
        if (!sessionId) {
            setCurrentLocation(null);
            setLocationHistory([]);
            setIsLoading(false);
            return;
        }

        // Fetch initial data
        fetchLatestLocation();
        fetchLocationHistory();

        // Subscribe to new location insertions
        const channel: RealtimeChannel = supabase
            .channel(`session-${sessionId}-locations`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'session_locations',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    const newData = payload.new as SessionLocation;
                    const newLocation: LocationCoord = {
                        lat: newData.latitude,
                        lng: newData.longitude,
                        accuracy: newData.accuracy,
                        timestamp: new Date(newData.recorded_at),
                    };

                    // Update current location
                    setCurrentLocation(newLocation);

                    // Append to history
                    setLocationHistory((prev) => [...prev, newLocation]);

                    logger.debug('Realtime location update received', { action: 'location.realtime', lat: newLocation.lat, lng: newLocation.lng });
                }
            )
            .subscribe();

        // Cleanup subscription
        return () => {
            channel.unsubscribe();
        };
    }, [sessionId, fetchLatestLocation, fetchLocationHistory]);

    return {
        currentLocation,
        locationHistory,
        isLoading,
        error,
        refetch: fetchLatestLocation,
    };
}
