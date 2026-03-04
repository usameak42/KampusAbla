/**
 * Booking Card Component - Displays a single booking
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
    MessageSquare,
    Phone,
    Star,
    CheckCircle,
    XCircle,
    AlertCircle,
    MoreVertical,
    Eye
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { tr } from "date-fns/locale";

export interface Booking {
    id: string;
    // Parent info
    parentId: string;
    parentName: string;
    parentPhoto?: string;
    // Sitter info
    sitterId: string;
    sitterName: string;
    sitterPhoto?: string;
    sitterRating: number;
    sitterUniversity: string;
    // Booking details
    bookingDate: Date;
    startTime: string;
    endTime: string;
    durationHours: number;
    childrenCount: number;
    childrenNames: string[];
    childrenAges: number[];
    // Location
    address: string;
    district: string;
    // Payment
    hourlyRate: number;
    totalAmount: number;
    paymentStatus: "pending" | "paid" | "refunded";
    // Status
    status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
    // Timestamps
    createdAt: Date;
    confirmedAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    refundStatus?: "pending" | "completed" | "failed";
}

interface BookingCardProps {
    booking: Booking;
    viewMode: "parent" | "sitter";
    onViewDetails: (bookingId: string) => void;
    onMessage: (userId: string) => void;
    onCall?: (userId: string) => void;
    onCancel: (bookingId: string) => void;
    onConfirm?: (bookingId: string) => void;
    onComplete?: (bookingId: string) => void;
    onRate?: (bookingId: string) => void;
}

export function BookingCard({
    booking,
    viewMode,
    onViewDetails,
    onMessage,
    onCall,
    onCancel,
    onConfirm,
    onComplete,
    onRate,
}: BookingCardProps) {
    // Get display info based on view mode
    const otherPerson = viewMode === "parent"
        ? { name: booking.sitterName, photo: booking.sitterPhoto, id: booking.sitterId }
        : { name: booking.parentName, photo: booking.parentPhoto, id: booking.parentId };

    // Status styling
    const getStatusBadge = () => {
        switch (booking.status) {
            case "pending":
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Onay Bekliyor
                </Badge>;
            case "confirmed":
                return <Badge className="bg-blue-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Onaylandı
                </Badge>;
            case "in-progress":
                return <Badge className="bg-green-500 animate-pulse">
                    <Clock className="h-3 w-3 mr-1" />
                    Devam Ediyor
                </Badge>;
            case "completed":
                return <Badge variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Tamamlandı
                </Badge>;
            case "cancelled":
                return <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    İptal Edildi
                </Badge>;
        }
    };

    // Date label helpers
    const getDateLabel = () => {
        if (isToday(booking.bookingDate)) return "Bugün";
        if (isTomorrow(booking.bookingDate)) return "Yarın";
        return format(booking.bookingDate, "d MMMM", { locale: tr });
    };

    const isUpcoming = !isPast(booking.bookingDate) &&
        booking.status !== "cancelled" &&
        booking.status !== "completed";

    const canCancel = booking.status === "pending" || booking.status === "confirmed";
    const canConfirm = booking.status === "pending" && viewMode === "sitter";
    const canComplete = booking.status === "in-progress";
    const canRate = booking.status === "completed";

    return (
        <Card className={`transition-all hover:shadow-md ${booking.status === "cancelled" ? "opacity-60" :
            booking.status === "in-progress" ? "border-green-500" : ""
            }`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    {/* Person Info */}
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={otherPerson.photo} alt={otherPerson.name} />
                            <AvatarFallback>
                                {otherPerson.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold">{otherPerson.name}</h3>
                            {viewMode === "parent" && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{booking.sitterRating.toFixed(1)}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>{booking.sitterUniversity}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2">
                        {getStatusBadge()}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewDetails(booking.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Detayları Gör
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onMessage(otherPerson.id)}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Mesaj Gönder
                                </DropdownMenuItem>
                                {onCall && (
                                    <DropdownMenuItem onClick={() => onCall(otherPerson.id)}>
                                        <Phone className="h-4 w-4 mr-2" />
                                        Ara
                                    </DropdownMenuItem>
                                )}
                                {canConfirm && onConfirm && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onConfirm(booking.id)}
                                            className="text-green-600"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Onayla
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {canComplete && onComplete && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onComplete(booking.id)}
                                            className="text-green-600"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Tamamlandı
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {canRate && onRate && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onRate(booking.id)}>
                                            <Star className="h-4 w-4 mr-2" />
                                            Değerlendir
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {canCancel && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onCancel(booking.id)}
                                            className="text-red-600"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            İptal Et
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Calendar className={`h-4 w-4 ${isUpcoming ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                            <p className={`font-medium ${isUpcoming ? "text-primary" : ""}`}>
                                {getDateLabel()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {format(booking.bookingDate, "EEEE", { locale: tr })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="font-medium">
                                {booking.startTime} - {booking.endTime}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {booking.durationHours} saat
                            </p>
                        </div>
                    </div>
                </div>

                {/* Children & Location */}
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                            {booking.childrenCount} çocuk ({booking.childrenNames.join(", ")})
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.district}</span>
                    </div>
                </div>

                {/* Payment */}
                <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-primary" />
                        <span className="text-sm">Toplam Ücret</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-primary">₺{booking.totalAmount}</span>
                            {booking.paymentStatus === "paid" && (
                                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                    Ödendi
                                </Badge>
                            )}
                            {booking.paymentStatus === "refunded" && (
                                <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                                    İptal
                                </Badge>
                            )}
                        </div>
                        {booking.paymentStatus === "refunded" && booking.refundStatus && (
                            <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                <span>İade:</span>
                                <span className={
                                    booking.refundStatus === "completed" ? "text-green-600" :
                                        booking.refundStatus === "failed" ? "text-red-600" :
                                            "text-amber-600"
                                }>
                                    {booking.refundStatus === "completed" ? "Tamamlandı" :
                                        booking.refundStatus === "failed" ? "Hata" :
                                            "Bekliyor"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cancelled reason */}
                {booking.status === "cancelled" && booking.cancelReason && (
                    <div className="p-2 bg-red-50 rounded-lg text-sm text-red-600">
                        <span className="font-medium">İptal sebebi:</span> {booking.cancelReason}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0 gap-2">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onMessage(otherPerson.id)}
                >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Mesaj
                </Button>
                <Button
                    className="flex-1"
                    onClick={() => onViewDetails(booking.id)}
                >
                    <Eye className="h-4 w-4 mr-2" />
                    Detaylar
                </Button>
            </CardFooter>
        </Card>
    );
}
