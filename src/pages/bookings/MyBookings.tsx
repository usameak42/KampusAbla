/**
 * My Bookings Page - View and manage bookings
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { BookingsList } from "@/components/bookings/BookingsList";
import { CancelBookingModal } from "@/components/bookings/CancelBookingModal";
import { useBookings } from "@/hooks/useBookings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Calendar,
    CheckCircle,
    Banknote,
    RefreshCw,
    Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@/components/bookings/BookingCard";

export default function MyBookings() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    // Would get viewMode from auth context
    const viewMode = "parent" as "parent" | "sitter";
    const userId = "parent-1";

    const {
        bookings,
        isLoading,
        isFetchingNextPage,
        stats,
        confirmBooking,
        cancelBooking,
        completeBooking,
        refreshBookings,
        fetchNextPage,
        hasNextPage,
    } = useBookings({ userId, viewMode });

    // Infinite scroll trigger
    const { ref, inView } = useInView({
        threshold: 0.1,
    });

    // Load more bookings when scroll trigger comes into view
    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleViewDetails = (bookingId: string) => {
        navigate(`/bookings/${bookingId}`);
    };

    const handleMessage = (userId: string) => {
        toast({
            title: "Mesaj",
            description: "Mesajlaşma özelliği yakında eklenecek.",
        });
    };

    const handleCancel = (bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            setSelectedBooking(booking);
            setIsCancelModalOpen(true);
        }
    };

    const handleConfirmCancel = async (reason: string) => {
        if (!selectedBooking) return;

        try {
            await cancelBooking(selectedBooking.id, reason);
            toast({
                title: "Randevu İptal Edildi",
                description: "Randevunuz başarıyla iptal edildi.",
            });
        } catch {
            toast({
                title: "Hata",
                description: "Randevu iptal edilemedi.",
                variant: "destructive",
            });
            throw new Error("Cancel failed");
        }
    };

    const handleConfirm = async (bookingId: string) => {
        try {
            await confirmBooking(bookingId);
            toast({
                title: "Randevu Onaylandı! ✓",
                description: "Randevunuz onaylandı.",
            });
        } catch {
            toast({
                title: "Hata",
                description: "Randevu onaylanamadı.",
                variant: "destructive",
            });
        }
    };

    const handleComplete = async (bookingId: string) => {
        try {
            await completeBooking(bookingId);
            toast({
                title: "Randevu Tamamlandı! ✓",
                description: "Randevu başarıyla tamamlandı.",
            });
        } catch {
            toast({
                title: "Hata",
                description: "Randevu tamamlanamadı.",
                variant: "destructive",
            });
        }
    };

    const handleRate = (bookingId: string) => {
        toast({
            title: "Değerlendirme",
            description: "Değerlendirme özelliği yakında eklenecek.",
        });
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Randevularım</h1>
                    <p className="text-muted-foreground">
                        Tüm randevularınızı görüntüleyin ve yönetin
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={refreshBookings}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Yenile
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Yaklaşan Randevular
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">{stats.upcoming}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tamamlanan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-2xl font-bold">{stats.completed}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {viewMode === "sitter" ? "Toplam Kazanç" : "Toplam Harcama"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-blue-500" />
                            <span className="text-2xl font-bold">₺{stats.totalEarnings.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bookings List */}
            <BookingsList
                bookings={bookings}
                viewMode={viewMode}
                onViewDetails={handleViewDetails}
                onMessage={handleMessage}
                onCancel={handleCancel}
                onConfirm={viewMode === "sitter" ? handleConfirm : undefined}
                onComplete={handleComplete}
                onRate={viewMode === "parent" ? handleRate : undefined}
                isLoading={isLoading}
            />

            {/* Infinite scroll trigger and loading indicator */}
            {hasNextPage && (
                <div ref={ref} className="flex justify-center py-8">
                    {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Daha fazla randevu yükleniyor...</span>
                        </div>
                    )}
                </div>
            )}

            {!hasNextPage && bookings.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    Tüm randevular yüklendi
                </div>
            )}

            {/* Cancel Modal */}
            {selectedBooking && (
                <CancelBookingModal
                    isOpen={isCancelModalOpen}
                    onClose={() => {
                        setIsCancelModalOpen(false);
                        setSelectedBooking(null);
                    }}
                    onConfirm={handleConfirmCancel}
                    bookingDate={selectedBooking.bookingDate}
                    totalAmount={selectedBooking.totalAmount}
                    bookingCreatedAt={selectedBooking.createdAt}
                    viewMode={viewMode}
                    startTime={selectedBooking.startTime}
                />
            )}
        </div>
    );
}
