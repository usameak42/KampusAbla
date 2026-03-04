/**
 * LiveTrackingMap Component
 * Displays real-time GPS tracking on Google Maps for active sessions
 */

import { useState, useEffect, useMemo } from "react";
import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api";
import { useSessionLocationUpdates } from "@/hooks/useSessionLocationUpdates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation, Clock } from "lucide-react";
import { mapsService } from "@/services/maps";

interface LiveTrackingMapProps {
    sessionId: string;
}

const mapContainerStyle = {
    width: "100%",
    height: "400px",
    borderRadius: "8px",
};

const DEFAULT_CENTER = {
    lat: 41.0351,
    lng: 28.9833,
};

export function LiveTrackingMap({ sessionId }: LiveTrackingMapProps) {
    const { locationHistory: locations, isLoading, error } = useSessionLocationUpdates(sessionId);
    const [currentAddress, setCurrentAddress] = useState<string>("");
    const [distance, setDistance] = useState<number>(0);

    // Get latest location
    const latestLocation = useMemo(() => {
        if (locations.length === 0) return null;
        return locations[locations.length - 1];
    }, [locations]);

    // Map center
    const mapCenter = useMemo(() => {
        if (!latestLocation) return DEFAULT_CENTER;
        return {
            lat: latestLocation.lat,
            lng: latestLocation.lng,
        };
    }, [latestLocation]);

    // Polyline path
    const polylinePath = useMemo(() => {
        return locations.map((loc) => ({
            lat: loc.lat,
            lng: loc.lng,
        }));
    }, [locations]);

    // Calculate total distance
    useEffect(() => {
        if (locations.length < 2) {
            setDistance(0);
            return;
        }

        let totalDistance = 0;
        for (let i = 1; i < locations.length; i++) {
            const prev = { lat: locations[i - 1].lat, lng: locations[i - 1].lng };
            const curr = { lat: locations[i].lat, lng: locations[i].lng };
            totalDistance += mapsService.calculateDistance(prev, curr);
        }
        setDistance(totalDistance);
    }, [locations]);

    // Reverse geocode latest location
    useEffect(() => {
        if (!latestLocation) return;

        const fetchAddress = async () => {
            try {
                const address = await mapsService.reverseGeocode(
                    latestLocation.lat,
                    latestLocation.lng
                );
                setCurrentAddress(address.formattedAddress);
            } catch (err) {
                console.error("Failed to reverse geocode:", err);
                setCurrentAddress("Konum bilgisi alınamadı");
            }
        };

        fetchAddress();
    }, [latestLocation]);

    if (error) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-48">
                    <p className="text-destructive">Konum bilgisi yüklenemedi: {error}</p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-48">
                    <div className="text-center">
                        <Navigation className="h-8 w-8 animate-pulse text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground">Konum bilgisi yükleniyor...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    Canlı Konum Takibi
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Map */}
                <div className="rounded-lg overflow-hidden border">
                    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}>
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={mapCenter}
                            zoom={15}
                            options={{
                                disableDefaultUI: false,
                                zoomControl: true,
                                streetViewControl: false,
                                mapTypeControl: false,
                            }}
                        >
                            {/* Current position marker */}
                            {latestLocation && (
                                <Marker
                                    position={{
                                        lat: latestLocation.lat,
                                        lng: latestLocation.lng,
                                    }}
                                    icon={{
                                        url: "data:image/svg+xml;charset=UTF-8," +
                                            encodeURIComponent(
                                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
                                            ),
                                        scaledSize: new google.maps.Size(24, 24),
                                        anchor: new google.maps.Point(12, 12),
                                    }}
                                />
                            )}

                            {/* Route polyline */}
                            {polylinePath.length > 1 && (
                                <Polyline
                                    path={polylinePath}
                                    options={{
                                        strokeColor: "#3b82f6",
                                        strokeOpacity: 0.8,
                                        strokeWeight: 3,
                                    }}
                                />
                            )}
                        </GoogleMap>
                    </LoadScript>
                </div>

                {/* Info cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                        <MapPin className="h-4 w-4 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">Mevcut Konum</p>
                            <p className="text-sm font-medium truncate">
                                {currentAddress || "Belirleniyor..."}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                        <Clock className="h-4 w-4 text-primary" />
                        <div>
                            <p className="text-xs text-muted-foreground">Toplam Mesafe</p>
                            <p className="text-sm font-medium">
                                {distance < 1000
                                    ? `${Math.round(distance)} m`
                                    : `${(distance / 1000).toFixed(1)} km`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Last update */}
                {latestLocation && (
                    <p className="text-xs text-muted-foreground text-center">
                        Son güncelleme: {latestLocation.timestamp.toLocaleTimeString("tr-TR")}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
