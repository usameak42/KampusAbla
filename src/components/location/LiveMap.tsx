/**
 * Live Map Component - Shows sitter location to parent
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Navigation,
    RefreshCw,
    AlertCircle,
    Clock,
    User,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { LocationCoord, GeofenceAlert, Geofence } from "@/types/location";

interface LiveMapProps {
    sitterLocation: LocationCoord | null;
    destinationLocation: LocationCoord;
    destinationName: string;
    geofences: Geofence[];
    geofenceAlerts: GeofenceAlert[];
    isTracking: boolean;
    onRefresh: () => void;
    sitterName: string;
    sitterStatus: "on-way" | "arrived" | "in-session";
}

export function LiveMap({
    sitterLocation,
    destinationLocation,
    destinationName,
    geofences,
    geofenceAlerts,
    isTracking,
    onRefresh,
    sitterName,
    sitterStatus,
}: LiveMapProps) {
    const [elapsedTime, setElapsedTime] = useState(0);

    // Update elapsed time
    useEffect(() => {
        if (!isTracking) return;
        const interval = setInterval(() => setElapsedTime(e => e + 1), 1000);
        return () => clearInterval(interval);
    }, [isTracking]);

    // Calculate ETA (mock - would use real routing API)
    const calculateETA = () => {
        if (!sitterLocation) return "—";
        // Mock ETA calculation
        return "~12 dk";
    };

    // Get status info
    const getStatusInfo = () => {
        switch (sitterStatus) {
            case "on-way":
                return { label: "Yolda", color: "bg-blue-500", icon: Navigation };
            case "arrived":
                return { label: "Vardı", color: "bg-orange-500", icon: MapPin };
            case "in-session":
                return { label: "Oturumda", color: "bg-green-500", icon: User };
        }
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        Canlı Konum
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {isTracking && (
                            <Badge variant="outline" className="text-green-500 border-green-500">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                                Canlı
                            </Badge>
                        )}
                        <Button variant="ghost" size="icon" onClick={onRefresh}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Map Placeholder - Would integrate with Google Maps / Mapbox */}
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border overflow-hidden">
                    {/* Mock map visualization */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {sitterLocation ? (
                            <div className="text-center">
                                <div className="relative">
                                    {/* Destination marker */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                                        <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow" />
                                        <p className="text-xs mt-1 font-medium">{destinationName}</p>
                                    </div>

                                    {/* Sitter marker (animated) */}
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                            <StatusIcon className="h-5 w-5 text-white" />
                                        </div>
                                        {sitterStatus === "on-way" && (
                                            <div className="absolute -inset-2 bg-primary/20 rounded-full animate-ping" />
                                        )}
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground mt-4">
                                    Son güncelleme: {sitterLocation.timestamp
                                        ? formatDistanceToNow(sitterLocation.timestamp, { addSuffix: true, locale: tr })
                                        : "—"
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Konum bekleniyor...</p>
                            </div>
                        )}
                    </div>

                    {/* Map controls */}
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        <Button variant="secondary" size="icon" className="h-8 w-8">
                            <span className="text-xs font-bold">+</span>
                        </Button>
                        <Button variant="secondary" size="icon" className="h-8 w-8">
                            <span className="text-xs font-bold">-</span>
                        </Button>
                    </div>
                </div>

                {/* Sitter Status */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${statusInfo.color} rounded-full flex items-center justify-center`}>
                            <StatusIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-medium">{sitterName}</p>
                            <p className="text-sm text-muted-foreground">{statusInfo.label}</p>
                        </div>
                    </div>

                    {sitterStatus === "on-way" && (
                        <div className="text-right">
                            <p className="font-bold text-lg">{calculateETA()}</p>
                            <p className="text-xs text-muted-foreground">tahmini varış</p>
                        </div>
                    )}
                </div>

                {/* Geofence Alerts */}
                {geofenceAlerts.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Son Bildirimler</p>
                        {geofenceAlerts.slice(0, 3).map((alert) => (
                            <div
                                key={alert.id}
                                className={`flex items-center gap-2 p-2 rounded text-sm ${alert.type === "entered" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                                    }`}
                            >
                                <AlertCircle className="h-4 w-4" />
                                <span>
                                    {alert.type === "entered" ? "Giriş: " : "Çıkış: "}
                                    {alert.geofenceName}
                                </span>
                                <span className="ml-auto text-xs opacity-70">
                                    {format(alert.timestamp, "HH:mm")}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tracking Info */}
                {sitterLocation && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                            Doğruluk: {sitterLocation.accuracy?.toFixed(0) || "—"}m
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>
                            Konum: {sitterLocation.lat.toFixed(4)}, {sitterLocation.lng.toFixed(4)}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
