/**
 * Booking Calendar Component - Calendar view for bookings
 */

import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CalendarDays,
    Clock,
    Users,
    ChevronLeft,
    ChevronRight,
    List,
    Grid3X3,
} from "lucide-react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
} from "date-fns";
import { tr } from "date-fns/locale";
import type { Booking } from "./BookingCard";

interface BookingCalendarProps {
    bookings: Booking[];
    viewMode: "parent" | "sitter";
    onSelectDate: (date: Date) => void;
    onSelectBooking: (bookingId: string) => void;
}

export function BookingCalendar({
    bookings,
    viewMode,
    onSelectDate,
    onSelectBooking,
}: BookingCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [displayMode, setDisplayMode] = useState<"month" | "list">("month");

    // Get bookings for the current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Create a map of date -> bookings
    const bookingsByDate = useMemo(() => {
        const map = new Map<string, Booking[]>();

        bookings.forEach((booking) => {
            const dateKey = format(booking.bookingDate, "yyyy-MM-dd");
            const existing = map.get(dateKey) || [];
            map.set(dateKey, [...existing, booking]);
        });

        return map;
    }, [bookings]);

    // Get bookings for selected date
    const selectedDateBookings = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = format(selectedDate, "yyyy-MM-dd");
        return bookingsByDate.get(dateKey) || [];
    }, [selectedDate, bookingsByDate]);

    // Get days with bookings for calendar highlighting
    const daysWithBookings = useMemo(() => {
        return bookings
            .filter(b => b.status !== "cancelled")
            .map(b => new Date(b.bookingDate));
    }, [bookings]);

    // Navigation
    const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const goToToday = () => {
        setCurrentMonth(new Date());
        setSelectedDate(new Date());
    };

    // Handle date selection
    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        if (date) {
            onSelectDate(date);
        }
    };

    // Status badge for bookings
    const getStatusBadge = (status: Booking["status"]) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs">Bekliyor</Badge>;
            case "confirmed":
                return <Badge className="bg-blue-500 text-xs">Onaylı</Badge>;
            case "in-progress":
                return <Badge className="bg-green-500 text-xs">Devam Ediyor</Badge>;
            case "completed":
                return <Badge variant="secondary" className="text-xs">Tamamlandı</Badge>;
            case "cancelled":
                return <Badge variant="destructive" className="text-xs">İptal</Badge>;
        }
    };

    // Monthly stats
    const monthlyStats = useMemo(() => {
        const monthBookings = bookings.filter(b => {
            const date = new Date(b.bookingDate);
            return date >= monthStart && date <= monthEnd;
        });

        return {
            total: monthBookings.length,
            confirmed: monthBookings.filter(b => b.status === "confirmed" || b.status === "completed").length,
            pending: monthBookings.filter(b => b.status === "pending").length,
            earnings: monthBookings
                .filter(b => b.status === "completed")
                .reduce((sum, b) => sum + b.totalAmount, 0),
        };
    }, [bookings, monthStart, monthEnd]);

    // Task 52: Restrict Future Date Selection (max 3 months)
    const maxDate = addMonths(new Date(), 3);

    // Filter out dates beyond maxDate for navigation
    const canGoNext = startOfMonth(addMonths(currentMonth, 1)) <= maxDate;

    return (
        <div className="space-y-4">
            {/* Header with navigation */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-bold min-w-[200px] text-center">
                        {format(currentMonth, "MMMM yyyy", { locale: tr })}
                    </h2>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToNextMonth}
                        disabled={!canGoNext}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Bugün
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Tabs value={displayMode} onValueChange={(v) => setDisplayMode(v as "month" | "list")}>
                        <TabsList>
                            <TabsTrigger value="month" className="gap-2">
                                <Grid3X3 className="h-4 w-4" />
                                Takvim
                            </TabsTrigger>
                            <TabsTrigger value="list" className="gap-2">
                                <List className="h-4 w-4" />
                                Liste
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            <div>
                                <p className="text-lg font-bold">{monthlyStats.total}</p>
                                <p className="text-xs text-muted-foreground">Toplam</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <div>
                                <p className="text-lg font-bold">{monthlyStats.confirmed}</p>
                                <p className="text-xs text-muted-foreground">Onaylı</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-yellow-500" />
                            <div>
                                <p className="text-lg font-bold">{monthlyStats.pending}</p>
                                <p className="text-xs text-muted-foreground">Bekleyen</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-green-500 border-green-500">₺</Badge>
                            <div>
                                <p className="text-lg font-bold">₺{monthlyStats.earnings.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                    {viewMode === "sitter" ? "Kazanç" : "Harcama"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar / List View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Calendar */}
                <Card className="lg:col-span-2">
                    <CardContent className="pt-4">
                        {displayMode === "month" ? (
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                month={currentMonth}
                                onMonthChange={setCurrentMonth}
                                locale={tr}
                                className="w-full"
                                disabled={{ after: maxDate }} // Task 52: Restrict future selection
                                fromDate={new Date(2024, 0, 1)} // Optional: limit past if needed, but keeping for history
                                toDate={maxDate} // Task 51: Disable year navigation implicitly by limiting range
                                classNames={{
                                    day_today: "bg-primary/20 text-primary font-bold",
                                    day_selected: "bg-primary text-white",
                                }}
                                modifiers={{
                                    hasBooking: daysWithBookings,
                                }}
                                modifiersStyles={{
                                    hasBooking: {
                                        fontWeight: "bold",
                                        textDecoration: "underline",
                                        textDecorationColor: "#3b82f6",
                                    },
                                }}
                            />
                        ) : (
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-2">
                                    {eachDayOfInterval({ start: monthStart, end: monthEnd }).map((day) => {
                                        const dateKey = format(day, "yyyy-MM-dd");
                                        const dayBookings = bookingsByDate.get(dateKey) || [];

                                        if (dayBookings.length === 0) return null;

                                        return (
                                            <div
                                                key={dateKey}
                                                className={`p-3 rounded-lg border ${isToday(day) ? "border-primary bg-primary/5" : ""}`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium">
                                                        {format(day, "d MMMM, EEEE", { locale: tr })}
                                                    </span>
                                                    <Badge variant="outline">{dayBookings.length} randevu</Badge>
                                                </div>
                                                <div className="space-y-1">
                                                    {dayBookings.map((booking) => (
                                                        <div
                                                            key={booking.id}
                                                            className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted"
                                                            onClick={() => onSelectBooking(booking.id)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-3 w-3" />
                                                                <span>{booking.startTime} - {booking.endTime}</span>
                                                                <span className="text-muted-foreground">
                                                                    {viewMode === "parent" ? booking.sitterName : booking.parentName}
                                                                </span>
                                                            </div>
                                                            {getStatusBadge(booking.status)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                {/* Selected Date Details */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                            {selectedDate
                                ? format(selectedDate, "d MMMM yyyy", { locale: tr })
                                : "Bir Gün Seçin"
                            }
                        </CardTitle>
                        <CardDescription>
                            {selectedDate
                                ? `${selectedDateBookings.length} randevu`
                                : "Detayları görmek için takvimden gün seçin"
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            {selectedDateBookings.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">
                                        {selectedDate
                                            ? "Bu gün için randevu yok"
                                            : "Gün seçin"
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDateBookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => onSelectBooking(booking.id)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium">
                                                    {booking.startTime} - {booking.endTime}
                                                </span>
                                                {getStatusBadge(booking.status)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {viewMode === "parent" ? booking.sitterName : booking.parentName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                <Users className="h-3 w-3" />
                                                <span>{booking.childrenCount} çocuk</span>
                                                <span className="text-gray-300">•</span>
                                                <span>₺{booking.totalAmount}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
