/**
 * Calendar Page - Full calendar view for bookings
 */

import { useNavigate } from "react-router-dom";
import { BookingCalendar } from "@/components/bookings/BookingCalendar";
import { useBookings } from "@/hooks/useBookings";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Would get viewMode from auth context
    const viewMode: "parent" | "sitter" = "parent";
    const userId = "parent-1";

    const {
        bookings,
        isLoading,
        refreshBookings,
    } = useBookings({ userId, viewMode });

    const handleSelectDate = (date: Date) => {
        // Could open a modal or navigate to day view
    };

    const handleSelectBooking = (bookingId: string) => {
        navigate(`/bookings/${bookingId}`);
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Takvim</h1>
                    <p className="text-muted-foreground">
                        Randevularınızı takvimde görüntüleyin
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

            {/* Calendar */}
            <BookingCalendar
                bookings={bookings}
                viewMode={viewMode}
                onSelectDate={handleSelectDate}
                onSelectBooking={handleSelectBooking}
            />
        </div>
    );
}
