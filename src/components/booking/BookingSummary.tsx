/**
 * Booking Summary Component - Review booking before confirmation
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    Clock,
    MapPin,
    User,
    Baby,
    FileText,
    CreditCard,
    Shield,
    Star,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Sitter } from "@/hooks/useSearchSitters";

interface BookingSummaryProps {
    sitter: Sitter;
    date: Date;
    startTime: string;
    endTime: string;
    childrenIds: string[];
    specialRequirements: string;
    locationAddress?: string;
}

export function BookingSummary({
    sitter,
    date,
    startTime,
    endTime,
    childrenIds,
    specialRequirements,
    locationAddress = "Ev adresiniz",
}: BookingSummaryProps) {
    // Calculate duration and cost
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const durationHours =
        (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
    const roundedDuration = Math.ceil(durationHours * 2) / 2;
    const subtotal = roundedDuration * sitter.hourlyRate;
    const serviceFee = Math.round(subtotal * 0.1); // 10% platform fee
    const total = subtotal + serviceFee;

    // Mock children data
    const mockChildren = [
        { id: "1", name: "Ali", age: 5 },
        { id: "2", name: "Elif", age: 3 },
        { id: "3", name: "Mehmet", age: 8 },
    ];

    const selectedChildren = mockChildren.filter((child) =>
        childrenIds.includes(child.id)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold mb-2">Rezervasyon Özeti</h3>
                <p className="text-sm text-muted-foreground">
                    Lütfen rezervasyon detaylarını kontrol edin
                </p>
            </div>

            {/* Sitter Info */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="h-16 w-16 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                            {sitter.profilePhotoUrl ? (
                                <img
                                    src={sitter.profilePhotoUrl}
                                    alt={sitter.fullName}
                                    className="h-full w-full object-cover rounded-full"
                                    loading="lazy"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-blue-700">
                                    {sitter.fullName.charAt(0)}
                                </span>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-semibold">{sitter.fullName}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                                {sitter.university} • {sitter.department}
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-medium">
                                        {sitter.rating.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        ({sitter.reviewCount})
                                    </span>
                                </div>
                                {sitter.isVerified && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Doğrulanmış
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="font-medium">
                                {format(date, "d MMMM yyyy, EEEE", { locale: tr })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="font-medium">
                                {startTime} - {endTime}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {roundedDuration} saat
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="font-medium">{locationAddress}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Children */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Baby className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium mb-2">Çocuklar</p>
                            <div className="space-y-1">
                                {selectedChildren.map((child) => (
                                    <div key={child.id} className="flex items-center gap-2">
                                        <span className="text-sm">{child.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {child.age} yaş
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Special Requirements */}
            {specialRequirements && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium mb-1">Özel İstekler</p>
                                <p className="text-sm text-muted-foreground">
                                    {specialRequirements}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pricing Breakdown */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                        <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium mb-3">Ödeme Detayı</p>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {roundedDuration} saat × ₺{sitter.hourlyRate}/saat
                                    </span>
                                    <span className="font-medium">₺{subtotal}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Hizmet bedeli (%10)
                                    </span>
                                    <span className="font-medium">₺{serviceFee}</span>
                                </div>

                                <Separator className="my-2" />

                                <div className="flex justify-between">
                                    <span className="font-semibold">Toplam</span>
                                    <span className="text-xl font-bold text-primary">
                                        ₺{total}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-900">
                            💳 Ödeme rezervasyon onaylandıktan sonra alınacaktır
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Important Notes */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-900 mb-2">
                    Önemli Bilgiler
                </p>
                <ul className="text-xs text-amber-800 space-y-1">
                    <li>• Bakıcı rezervasyonu 24 saat içinde onaylayacaktır</li>
                    <li>• İptal politikası: 24 saat öncesine kadar ücretsiz</li>
                    <li>• Seans başladığında canlı konum takibi aktif olacak</li>
                </ul>
            </div>
        </div>
    );
}
