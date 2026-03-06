/**
 * Booking Detail Page
 * Shows details for a specific booking by ID
 */

import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, MapPin, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const statusLabels: Record<string, string> = {
    pending: "Beklemede",
    confirmed: "Onaylandı",
    completed: "Tamamlandı",
    cancelled: "İptal Edildi",
    in_progress: "Devam Ediyor",
};

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    in_progress: "bg-purple-100 text-purple-800",
};

export default function BookingDetail() {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();

    const { data: booking, isLoading, error } = useQuery({
        queryKey: ["booking", bookingId],
        queryFn: async () => {
            if (!bookingId) throw new Error("Booking ID required");
            const { data, error } = await supabase
                .from("bookings")
                .select("*")
                .eq("id", bookingId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!bookingId,
    });

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-white">
                <div className="container max-w-2xl mx-auto px-4 py-6">
                    <Button variant="ghost" onClick={() => navigate("/bookings")} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Geri
                    </Button>
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            Rezervasyon bulunamadı.
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-white">
            <div className="container max-w-2xl mx-auto px-4 py-6">
                <Button variant="ghost" onClick={() => navigate("/bookings")} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Rezervasyonlarım
                </Button>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Rezervasyon Detayı</CardTitle>
                            <Badge className={statusColors[booking.status] || "bg-muted text-muted-foreground"}>
                                {statusLabels[booking.status] || booking.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Tarih</p>
                                <p className="font-medium">
                                    {format(new Date(booking.booking_date), "d MMMM yyyy", { locale: tr })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Saat & Süre</p>
                                <p className="font-medium">
                                    {booking.start_time} — {booking.duration_hours} saat
                                </p>
                            </div>
                        </div>

                        {booking.meeting_address && (
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Adres</p>
                                    <p className="font-medium">{booking.meeting_address}</p>
                                </div>
                            </div>
                        )}

                        {booking.total_amount != null && (
                            <>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Toplam Tutar</span>
                                    <span className="text-lg font-bold">{booking.total_amount} ₺</span>
                                </div>
                            </>
                        )}

                        {booking.notes && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Notlar</p>
                                    <p>{booking.notes}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
