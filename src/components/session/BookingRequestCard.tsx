/**
 * Booking Request Card - Displays incoming booking request for sitter
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Banknote,
    Bell,
    CheckCircle,
    XCircle,
    User,
    Baby,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export interface BookingRequest {
    id: string;
    // Parent info
    parentId: string;
    parentName: string;
    parentPhoto?: string;
    parentRating: number;
    parentBookingsCount: number;
    // Booking details
    bookingDate: Date;
    startTime: string;
    endTime: string;
    durationHours: number;
    // Children
    childrenCount: number;
    childrenNames: string[];
    childrenAges: number[];
    specialNeeds?: string;
    // Location
    address: string;
    district: string;
    distanceKm?: number;
    // Payment
    hourlyRate: number;
    totalAmount: number;
    // Notes
    notes?: string;
    // Timestamp
    createdAt: Date;
    expiresAt: Date;
}

interface BookingRequestCardProps {
    request: BookingRequest;
    onAccept: (requestId: string) => void;
    onDecline: (requestId: string) => void;
    onViewDetails: (requestId: string) => void;
    isLoading?: boolean;
}

export function BookingRequestCard({
    request,
    onAccept,
    onDecline,
    onViewDetails,
    isLoading = false,
}: BookingRequestCardProps) {
    const timeAgo = formatDistanceToNow(request.createdAt, { addSuffix: true, locale: tr });
    const isExpiringSoon = request.expiresAt.getTime() - Date.now() < 2 * 60 * 60 * 1000; // 2 hours

    return (
        <Card className={`transition-all hover:shadow-lg ${isExpiringSoon ? "border-yellow-500 animate-pulse" : ""}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    {/* New Request Badge */}
                    <div className="flex items-center gap-2">
                        <Badge className="bg-primary gap-1">
                            <Bell className="h-3 w-3" />
                            Yeni Talep
                        </Badge>
                        <span className="text-xs text-muted-foreground">{timeAgo}</span>
                    </div>

                    {/* Expiry Warning */}
                    {isExpiringSoon && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Süresi doluyor!
                        </Badge>
                    )}
                </div>

                {/* Parent Info */}
                <div className="flex items-center gap-3 mt-3">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarImage src={request.parentPhoto} alt={request.parentName} />
                        <AvatarFallback className="bg-primary/10">
                            <User className="h-6 w-6 text-primary" />
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-lg">{request.parentName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>⭐ {request.parentRating.toFixed(1)}</span>
                            <span className="text-gray-300">•</span>
                            <span>{request.parentBookingsCount} randevu</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-primary/5 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                            <p className="font-medium">{format(request.bookingDate, "d MMMM", { locale: tr })}</p>
                            <p className="text-xs text-muted-foreground">
                                {format(request.bookingDate, "EEEE", { locale: tr })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <div>
                            <p className="font-medium">{request.startTime} - {request.endTime}</p>
                            <p className="text-xs text-muted-foreground">{request.durationHours} saat</p>
                        </div>
                    </div>
                </div>

                {/* Children Info */}
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Baby className="h-5 w-5 text-pink-500 mt-0.5" />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{request.childrenCount} Çocuk</span>
                            <span className="text-muted-foreground text-sm">
                                ({request.childrenAges.map(age => `${age} yaş`).join(", ")})
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.childrenNames.join(", ")}</p>
                        {request.specialNeeds && (
                            <p className="text-sm text-orange-600 mt-1">
                                <span className="font-medium">Özel not:</span> {request.specialNeeds}
                            </p>
                        )}
                    </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{request.district}</span>
                    {request.distanceKm && (
                        <>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-muted-foreground">{request.distanceKm} km uzaklıkta</span>
                        </>
                    )}
                </div>

                {/* Notes */}
                {request.notes && (
                    <div className="p-2 bg-blue-50 rounded-lg text-sm">
                        <span className="font-medium text-blue-700">Not:</span>{" "}
                        <span className="text-blue-600">{request.notes}</span>
                    </div>
                )}

                {/* Payment */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700">Kazanç</span>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-xl text-green-700">₺{request.totalAmount}</p>
                        <p className="text-xs text-green-600">₺{request.hourlyRate}/saat</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0 gap-2">
                <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={() => onDecline(request.id)}
                    disabled={isLoading}
                >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reddet
                </Button>
                <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => onAccept(request.id)}
                    disabled={isLoading}
                >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Kabul Et
                </Button>
            </CardFooter>
        </Card>
    );
}
