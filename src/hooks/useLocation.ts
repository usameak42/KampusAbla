/**
 * useLocation Hook - Manages GPS location tracking
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { LocationCoord, GeofenceAlert, Geofence } from "@/types/location";
import { isInsideGeofence } from "@/types/location";

interface UseLocationOptions {
    enableHighAccuracy?: boolean;
    watchPosition?: boolean;
    geofences?: Geofence[];
    onGeofenceAlert?: (alert: GeofenceAlert) => void;
}

interface LocationState {
    currentLocation: LocationCoord | null;
    isTracking: boolean;
    error: string | null;
    permissionStatus: "granted" | "denied" | "prompt" | "unknown";
}

export function useLocation(options: UseLocationOptions = {}) {
    const {
        enableHighAccuracy = true,
        watchPosition = false,
        geofences = [],
        onGeofenceAlert,
    } = options;

    const [state, setState] = useState<LocationState>({
        currentLocation: null,
        isTracking: false,
        error: null,
        permissionStatus: "unknown",
    });

    const watchIdRef = useRef<number | null>(null);
    const previousGeofenceStatesRef = useRef<Map<string, boolean>>(new Map());

    // Check if geolocation is supported
    const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

    // Check geofence status
    const checkGeofences = useCallback((location: LocationCoord) => {
        if (!onGeofenceAlert) return;

        geofences.forEach((geofence) => {
            if (!geofence.isActive) return;

            const isInside = isInsideGeofence(location, geofence);
            const wasInside = previousGeofenceStatesRef.current.get(geofence.id) ?? false;

            if (isInside !== wasInside) {
                onGeofenceAlert({
                    id: `alert-${Date.now()}`,
                    geofenceId: geofence.id,
                    geofenceName: geofence.name,
                    type: isInside ? "entered" : "exited",
                    timestamp: new Date(),
                    location,
                });
            }

            previousGeofenceStatesRef.current.set(geofence.id, isInside);
        });
    }, [geofences, onGeofenceAlert]);

    // Get current position once
    const getCurrentPosition = useCallback(async (): Promise<LocationCoord | null> => {
        if (!isSupported) {
            setState((prev) => ({ ...prev, error: "Geolocation not supported" }));
            return null;
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location: LocationCoord = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date(position.timestamp),
                    };
                    setState((prev) => ({
                        ...prev,
                        currentLocation: location,
                        error: null,
                        permissionStatus: "granted",
                    }));
                    checkGeofences(location);
                    resolve(location);
                },
                (error) => {
                    let errorMessage = "Location error";
                    let permissionStatus: LocationState["permissionStatus"] = "unknown";

                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Konum izni reddedildi";
                            permissionStatus = "denied";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Konum alınamadı";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "Konum isteği zaman aşımına uğradı";
                            break;
                    }

                    setState((prev) => ({ ...prev, error: errorMessage, permissionStatus }));
                    resolve(null);
                },
                { enableHighAccuracy, timeout: 10000, maximumAge: 60000 }
            );
        });
    }, [isSupported, enableHighAccuracy, checkGeofences]);

    // Start watching position
    const startTracking = useCallback(() => {
        if (!isSupported || watchIdRef.current !== null) return;

        setState((prev) => ({ ...prev, isTracking: true }));

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const location: LocationCoord = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date(position.timestamp),
                };
                setState((prev) => ({
                    ...prev,
                    currentLocation: location,
                    error: null,
                    permissionStatus: "granted",
                }));
                checkGeofences(location);
            },
            (error) => {
                setState((prev) => ({
                    ...prev,
                    error: error.message,
                    permissionStatus: error.code === error.PERMISSION_DENIED ? "denied" : prev.permissionStatus,
                }));
            },
            { enableHighAccuracy, timeout: 15000, maximumAge: 30000 }
        );
    }, [isSupported, enableHighAccuracy, checkGeofences]);

    // Stop watching position
    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setState((prev) => ({ ...prev, isTracking: false }));
        }
    }, []);

    // Request permission
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        const result = await getCurrentPosition();
        return result !== null;
    }, [isSupported, getCurrentPosition]);

    // Auto-start watching if option is set
    useEffect(() => {
        if (watchPosition) {
            startTracking();
        }
        return () => stopTracking();
    }, [watchPosition, startTracking, stopTracking]);

    return {
        ...state,
        isSupported,
        getCurrentPosition,
        startTracking,
        stopTracking,
        requestPermission,
    };
}
