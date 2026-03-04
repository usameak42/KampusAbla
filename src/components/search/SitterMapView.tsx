/**
 * Sitter Map View Component - Displays sitters on a Google Map
 */

import { useMemo, useState } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, MarkerClustererF } from "@react-google-maps/api";
import { Sitter } from "@/hooks/useSearchSitters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, User } from "lucide-react";
import { SitterCard } from "./SitterCard";

interface SitterMapViewProps {
    sitters: Sitter[];
    onViewProfile: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
}

const DEFAULT_CENTER = {
    lat: 41.0422,
    lng: 29.0073,
};

const MAP_OPTIONS = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true,
    scrollwheel: false,
};

export function SitterMapView({ sitters, onViewProfile, onToggleFavorite, isFavorite }: SitterMapViewProps) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey,
    });

    const [selectedSitter, setSelectedSitter] = useState<Sitter | null>(null);

    const center = useMemo(() => {
        if (sitters.length > 0 && sitters[0].latitude && sitters[0].longitude) {
            return { lat: sitters[0].latitude, lng: sitters[0].longitude };
        }
        return DEFAULT_CENTER;
    }, [sitters]);

    if (loadError) {
        return (
            <div className="bg-red-50 text-red-700 p-8 rounded-lg text-center border border-red-200">
                <p className="font-semibold mb-2">Harita yüklenemedi</p>
                <p className="text-sm">Lütfen API anahtarını kontrol edin veya daha sonra tekrar deneyin.</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="bg-gray-100 rounded-lg h-[600px] flex items-center justify-center animate-pulse">
                <p className="text-muted-foreground">Harita yükleniyor...</p>
            </div>
        );
    }

    if (!apiKey) {
        return (
            <div className="bg-amber-50 text-amber-700 p-8 rounded-lg text-center border border-amber-200">
                <p className="font-semibold mb-2">Google Maps API Anahtarı Eksik</p>
                <p className="text-sm mb-4">Haritayı görüntülemek için .env dosyasına VITE_GOOGLE_MAPS_API_KEY eklenmelidir.</p>
                <div className="bg-white p-4 rounded border text-left font-mono text-xs overflow-auto">
                    {/* Fallback mock visualization if no API key */}
                    <p className="mb-2 text-foreground font-bold italic">// Mock Map Visualization</p>
                    <div className="grid grid-cols-2 gap-2">
                        {sitters.map(s => (
                            <div key={s.id} className="p-2 border rounded hover:bg-gray-50 cursor-pointer flex items-center gap-2" onClick={() => setSelectedSitter(s)}>
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="truncate">{s.fullName}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {selectedSitter && (
                    <div className="mt-4 p-4 bg-white border rounded text-left">
                        <SitterCard
                            sitter={selectedSitter}
                            onViewProfile={onViewProfile}
                            onToggleFavorite={onToggleFavorite}
                            isFavorited={isFavorite(selectedSitter.id)}
                        />
                        <Button variant="ghost" className="w-full mt-2" onClick={() => setSelectedSitter(null)}>Kapat</Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerClassName="w-full h-[400px] md:h-[600px] rounded-lg"
            center={center}
            zoom={14}
            options={MAP_OPTIONS}
        >
            <MarkerClustererF>
                {(clusterer) => (
                    <>
                        {sitters.map((sitter) => (
                            sitter.latitude && sitter.longitude && (
                                <MarkerF
                                    key={sitter.id}
                                    position={{ lat: sitter.latitude, lng: sitter.longitude }}
                                    clusterer={clusterer}
                                    onClick={() => setSelectedSitter(sitter)}
                                    title={sitter.fullName}
                                />
                            )
                        ))}
                    </>
                )}
            </MarkerClustererF>

            {selectedSitter && selectedSitter.latitude && selectedSitter.longitude && (
                <InfoWindowF
                    position={{ lat: selectedSitter.latitude, lng: selectedSitter.longitude }}
                    onCloseClick={() => setSelectedSitter(null)}
                >
                    <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-2">
                            {selectedSitter.profilePhotoUrl ? (
                                <img
                                    src={selectedSitter.profilePhotoUrl}
                                    alt={selectedSitter.fullName}
                                    className="w-10 h-10 rounded-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-sm">{selectedSitter.fullName}</h3>
                                <div className="flex items-center text-xs text-amber-500">
                                    <Star className="h-3 w-3 fill-current mr-1" />
                                    {selectedSitter.rating}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {selectedSitter.bio}
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">₺{selectedSitter.hourlyRate}/sa</span>
                            <Button size="sm" onClick={() => onViewProfile(selectedSitter.id)}>
                                Profili Gör
                            </Button>
                        </div>
                    </div>
                </InfoWindowF>
            )}
        </GoogleMap>
    );
}
