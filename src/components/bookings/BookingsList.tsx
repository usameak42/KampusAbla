/**
 * Bookings List Component - Displays all bookings with tabs and filters
 */

import { useState, useMemo } from "react";
import { BookingCard, type Booking } from "./BookingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Filter,
    ArrowUpDown,
} from "lucide-react";

interface BookingsListProps {
    bookings: Booking[];
    viewMode: "parent" | "sitter";
    onViewDetails: (bookingId: string) => void;
    onMessage: (userId: string) => void;
    onCall?: (userId: string) => void;
    onCancel: (bookingId: string) => void;
    onConfirm?: (bookingId: string) => void;
    onComplete?: (bookingId: string) => void;
    onRate?: (bookingId: string) => void;
    isLoading?: boolean;
}

type TabValue = "upcoming" | "past" | "cancelled";
type SortOption = "date-asc" | "date-desc" | "amount-asc" | "amount-desc";

export function BookingsList({
    bookings,
    viewMode,
    onViewDetails,
    onMessage,
    onCall,
    onCancel,
    onConfirm,
    onComplete,
    onRate,
    isLoading = false,
}: BookingsListProps) {
    const [activeTab, setActiveTab] = useState<TabValue>("upcoming");
    const [sortBy, setSortBy] = useState<SortOption>("date-asc");

    // Filter bookings by tab
    const filterByTab = (booking: Booking) => {
        const now = new Date();
        const isUpcoming = new Date(booking.bookingDate) >= now &&
            booking.status !== "cancelled" &&
            booking.status !== "completed";
        const isPast = booking.status === "completed" ||
            (new Date(booking.bookingDate) < now && booking.status !== "cancelled");
        const isCancelled = booking.status === "cancelled";

        switch (activeTab) {
            case "upcoming": return isUpcoming;
            case "past": return isPast;
            case "cancelled": return isCancelled;
            default: return true;
        }
    };

    // Sort bookings
    const sortBookings = (a: Booking, b: Booking) => {
        switch (sortBy) {
            case "date-asc":
                return new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime();
            case "date-desc":
                return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
            case "amount-asc":
                return a.totalAmount - b.totalAmount;
            case "amount-desc":
                return b.totalAmount - a.totalAmount;
            default:
                return 0;
        }
    };

    const filteredBookings = useMemo(() => {
        return bookings
            .filter(filterByTab)
            .sort(sortBookings);
    }, [bookings, activeTab, sortBy]);

    // Count by status
    const counts = useMemo(() => {
        const now = new Date();
        return {
            upcoming: bookings.filter(b =>
                new Date(b.bookingDate) >= now &&
                b.status !== "cancelled" &&
                b.status !== "completed"
            ).length,
            past: bookings.filter(b =>
                b.status === "completed" ||
                (new Date(b.bookingDate) < now && b.status !== "cancelled")
            ).length,
            cancelled: bookings.filter(b => b.status === "cancelled").length,
        };
    }, [bookings]);

    // Empty state messages
    const getEmptyMessage = () => {
        switch (activeTab) {
            case "upcoming":
                return {
                    emoji: "📅",
                    title: "Yaklaşan Randevu Yok",
                    description: viewMode === "parent"
                        ? "Henüz randevunuz yok. Bir bakıcı arayarak rezervasyon yapabilirsiniz."
                        : "Henüz randevunuz yok. İlanlara başvurarak randevu alabilirsiniz.",
                };
            case "past":
                return {
                    emoji: "📋",
                    title: "Geçmiş Randevu Yok",
                    description: "Tamamlanan randevularınız burada görünecek.",
                };
            case "cancelled":
                return {
                    emoji: "✖️",
                    title: "İptal Edilen Randevu Yok",
                    description: "İptal edilen randevular burada görünecek.",
                };
        }
    };

    return (
        <div className="space-y-4">
            {/* Tabs & Sort */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                    <TabsList>
                        <TabsTrigger value="upcoming" className="gap-2">
                            <Calendar className="h-4 w-4" />
                            Yaklaşan
                            {counts.upcoming > 0 && (
                                <span className="bg-primary text-white text-xs rounded-full px-2">
                                    {counts.upcoming}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="past" className="gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Geçmiş
                            {counts.past > 0 && (
                                <span className="bg-gray-200 text-gray-600 text-xs rounded-full px-2">
                                    {counts.past}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="cancelled" className="gap-2">
                            <XCircle className="h-4 w-4" />
                            İptal
                            {counts.cancelled > 0 && (
                                <span className="bg-gray-200 text-gray-600 text-xs rounded-full px-2">
                                    {counts.cancelled}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Sırala" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date-asc">Tarihe Göre (En Yakın)</SelectItem>
                            <SelectItem value="date-desc">Tarihe Göre (En Uzak)</SelectItem>
                            <SelectItem value="amount-desc">Ücrete Göre (Yüksek)</SelectItem>
                            <SelectItem value="amount-asc">Ücrete Göre (Düşük)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Bookings Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex gap-3">
                                    <div className="h-12 w-12 bg-muted rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-muted rounded w-1/2" />
                                        <div className="h-4 bg-muted rounded w-3/4" />
                                    </div>
                                </div>
                                <div className="h-20 bg-muted rounded" />
                                <div className="h-12 bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredBookings.length === 0 ? (
                <Card className="p-8 text-center">
                    <div className="text-4xl mb-4">{getEmptyMessage().emoji}</div>
                    <h3 className="text-lg font-semibold mb-2">{getEmptyMessage().title}</h3>
                    <p className="text-muted-foreground">{getEmptyMessage().description}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredBookings.map((booking) => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            viewMode={viewMode}
                            onViewDetails={onViewDetails}
                            onMessage={onMessage}
                            onCall={onCall}
                            onCancel={onCancel}
                            onConfirm={onConfirm}
                            onComplete={onComplete}
                            onRate={onRate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
