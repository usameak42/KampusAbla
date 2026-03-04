/**
 * Geolocation and Maps Service Integration
 * Provider: Google Maps API
 * 
 * This service handles:
 * - Address geocoding
 * - Distance calculations
 * - Live location tracking
 * - Route visualization
 */

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface Address {
    street: string;
    district: string;
    city: string;
    postalCode?: string;
    country: string;
    formattedAddress: string;
}

export interface Route {
    distance: number; // in meters
    duration: number; // in seconds
    steps: RouteStep[];
}

export interface RouteStep {
    instruction: string;
    distance: number;
    duration: number;
    startLocation: Coordinates;
    endLocation: Coordinates;
}

const ERROR_MESSAGES: Record<string, string> = {
    'ZERO_RESULTS': 'Adres bulunamadı',
    'OVER_QUERY_LIMIT': 'Sorgu limiti aşıldı, lütfen bekleyin',
    'REQUEST_DENIED': 'Harita servisi erişimi reddedildi',
    'INVALID_REQUEST': 'Geçersiz istek',
    'UNKNOWN_ERROR': 'Bilinmeyen hata oluştu',
};

export class MapsService {
    private apiKey: string;

    constructor() {
        this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

        if (!this.apiKey && import.meta.env.PROD) {
            console.warn('Google Maps API key not configured');
        }
    }

    /**
     * Convert address string to coordinates
     * @param address Address string
     */
    async geocodeAddress(address: string): Promise<Coordinates> {
        if (!window.google?.maps?.Geocoder) {
            throw new Error('Google Maps API not loaded');
        }

        const geocoder = new google.maps.Geocoder();

        return new Promise((resolve, reject) => {
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng(),
                    });
                } else {
                    const errorMessage = ERROR_MESSAGES[status] || ERROR_MESSAGES['UNKNOWN_ERROR'];
                    reject(new Error(errorMessage));
                }
            });
        });
    }

    /**
     * Convert coordinates to address
     * @param lat Latitude
     * @param lng Longitude
     */
    async reverseGeocode(lat: number, lng: number): Promise<Address> {
        if (!window.google?.maps?.Geocoder) {
            throw new Error('Google Maps API not loaded');
        }

        const geocoder = new google.maps.Geocoder();

        return new Promise((resolve, reject) => {
            geocoder.geocode(
                { location: { lat, lng } },
                (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        const addressComponents = results[0].address_components;

                        resolve({
                            street: this.extractComponent(addressComponents, 'route') || '',
                            district: this.extractComponent(addressComponents, 'sublocality') ||
                                this.extractComponent(addressComponents, 'administrative_area_level_2') || '',
                            city: this.extractComponent(addressComponents, 'locality') ||
                                this.extractComponent(addressComponents, 'administrative_area_level_1') || '',
                            postalCode: this.extractComponent(addressComponents, 'postal_code'),
                            country: this.extractComponent(addressComponents, 'country') || '',
                            formattedAddress: results[0].formatted_address,
                        });
                    } else {
                        const errorMessage = ERROR_MESSAGES[status] || ERROR_MESSAGES['UNKNOWN_ERROR'];
                        reject(new Error(errorMessage));
                    }
                }
            );
        });
    }

    /**
     * Extract address component by type
     * @private
     */
    private extractComponent(
        components: google.maps.GeocoderAddressComponent[],
        type: string
    ): string | undefined {
        const component = components.find(c => c.types.includes(type));
        return component?.long_name;
    }

    /**
     * Calculate distance between two points using Haversine formula
     * @param origin Starting coordinates
     * @param destination Ending coordinates
     * @returns Distance in meters
     */
    calculateDistance(origin: Coordinates, destination: Coordinates): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (origin.lat * Math.PI) / 180;
        const φ2 = (destination.lat * Math.PI) / 180;
        const Δφ = ((destination.lat - origin.lat) * Math.PI) / 180;
        const Δλ = ((destination.lng - origin.lng) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Get directions between two points
     * @param origin Starting coordinates
     * @param destination Ending coordinates
     */
    async getDirections(origin: Coordinates, destination: Coordinates): Promise<Route> {
        if (!window.google?.maps?.DirectionsService) {
            throw new Error('Google Maps API not loaded');
        }

        const directionsService = new google.maps.DirectionsService();

        return new Promise((resolve, reject) => {
            directionsService.route(
                {
                    origin: { lat: origin.lat, lng: origin.lng },
                    destination: { lat: destination.lat, lng: destination.lng },
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === 'OK' && result && result.routes[0]) {
                        const route = result.routes[0].legs[0];

                        resolve({
                            distance: route.distance?.value || 0,
                            duration: route.duration?.value || 0,
                            steps: route.steps.map(step => ({
                                instruction: step.instructions,
                                distance: step.distance?.value || 0,
                                duration: step.duration?.value || 0,
                                startLocation: {
                                    lat: step.start_location.lat(),
                                    lng: step.start_location.lng(),
                                },
                                endLocation: {
                                    lat: step.end_location.lat(),
                                    lng: step.end_location.lng(),
                                },
                            })),
                        });
                    } else {
                        const errorMessage = ERROR_MESSAGES[status] || ERROR_MESSAGES['UNKNOWN_ERROR'];
                        reject(new Error(errorMessage));
                    }
                }
            );
        });
    }

    /**
     * Get user's current location
     */
    async getCurrentLocation(): Promise<Coordinates> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation not supported by this browser"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }

    /**
     * Watch user's location for live tracking
     * @param callback Function to call when location changes
     */
    watchLocation(callback: (coords: Coordinates) => void): number {
        if (!navigator.geolocation) {
            throw new Error("Geolocation not supported");
        }

        return navigator.geolocation.watchPosition(
            (position) => {
                callback({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                console.error("Location watch error:", error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    }

    /**
     * Stop watching user's location
     * @param watchId Watch ID returned from watchLocation
     */
    clearWatch(watchId: number): void {
        navigator.geolocation.clearWatch(watchId);
    }
}

export const mapsService = new MapsService();

