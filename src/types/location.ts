/**
 * Location Types - GPS tracking and geofence definitions
 */

export interface LocationCoord {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp: Date;
}

export interface LocationUpdate {
    id: string;
    sessionId: string;
    userId: string;
    userType: "sitter" | "parent";
    coord: LocationCoord;
    status: "on-way" | "arrived" | "in-session";
}

export interface Geofence {
    id: string;
    name: string;
    type: "school" | "custom";
    center: LocationCoord;
    radiusMeters: number;
    isActive: boolean;
}

export interface GeofenceAlert {
    id: string;
    geofenceId: string;
    geofenceName: string;
    type: "entered" | "exited";
    timestamp: Date;
    location: LocationCoord;
}

export interface LocationConsent {
    userId: string;
    consentGiven: boolean;
    consentDate: Date;
    scope: "session-only" | "always-on" | "never";
    expiresAt?: Date;
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(
    point1: LocationCoord,
    point2: LocationCoord
): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// Check if point is inside geofence
export function isInsideGeofence(
    point: LocationCoord,
    geofence: Geofence
): boolean {
    const distance = calculateDistance(point, geofence.center);
    return distance <= geofence.radiusMeters;
}
