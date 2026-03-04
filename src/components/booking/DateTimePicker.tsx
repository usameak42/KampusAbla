/**
 * Date Time Picker Component - Select date and time for booking
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface DateTimePickerProps {
    selectedDate: Date | null;
    startTime: string;
    endTime: string;
    onDateChange: (date: Date) => void;
    onStartTimeChange: (time: string) => void;
    onEndTimeChange: (time: string) => void;
    hourlyRate: number;
}

export function DateTimePicker({
    selectedDate,
    startTime,
    endTime,
    onDateChange,
    onStartTimeChange,
    onEndTimeChange,
    hourlyRate,
}: DateTimePickerProps) {
    const [showCalendar, setShowCalendar] = useState(false);

    // Generate time slots (8:00 AM to 10:00 PM, 30 min intervals)
    const timeSlots = [];
    for (let hour = 8; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
            timeSlots.push(time);
        }
    }

    // Calculate duration and total
    const calculateDuration = () => {
        if (!startTime || !endTime) return 0;

        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        const duration = (endMinutes - startMinutes) / 60;
        return duration > 0 ? duration : 0;
    };

    const duration = calculateDuration();
    const total = Math.ceil(duration * 2) / 2 * hourlyRate; // Round to nearest 0.5 hour

    // Disable past dates
    const disabledDays = { before: new Date() };

    return (
        <div className="space-y-6">
            {/* Date Selection */}
            <div>
                <Label className="text-base font-semibold mb-3 block">
                    Tarih Seçin
                </Label>
                <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-auto p-4"
                    onClick={() => setShowCalendar(!showCalendar)}
                >
                    <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                    {selectedDate ? (
                        <span className="font-medium">
                            {format(selectedDate, "d MMMM yyyy, EEEE", { locale: tr })}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">Tarih seçin</span>
                    )}
                </Button>

                {showCalendar && (
                    <Card className="mt-3">
                        <CardContent className="p-3">
                            <Calendar
                                mode="single"
                                selected={selectedDate || undefined}
                                onSelect={(date) => {
                                    if (date) {
                                        onDateChange(date);
                                        setShowCalendar(false);
                                    }
                                }}
                                disabled={disabledDays}
                                locale={tr}
                                className="rounded-md"
                            />
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm font-medium mb-2 block">
                        Başlangıç Saati
                    </Label>
                    <Select value={startTime} onValueChange={onStartTimeChange}>
                        <SelectTrigger>
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Saat seçin" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                    {time}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label className="text-sm font-medium mb-2 block">
                        Bitiş Saati
                    </Label>
                    <Select value={endTime} onValueChange={onEndTimeChange}>
                        <SelectTrigger>
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Saat seçin" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {timeSlots
                                .filter((time) => !startTime || time > startTime)
                                .map((time) => (
                                    <SelectItem key={time} value={time}>
                                        {time}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Duration & Cost Summary */}
            {duration > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-900">Süre:</span>
                        <span className="font-semibold text-blue-900">
                            {duration} saat
                        </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-900">Saatlik Ücret:</span>
                        <span className="font-semibold text-blue-900">
                            ₺{hourlyRate}
                        </span>
                    </div>
                    <div className="h-px bg-blue-200 my-2" />
                    <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-blue-900">
                            Toplam:
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                            ₺{total}
                        </span>
                    </div>
                </div>
            )}

            {/* Validation Messages */}
            {selectedDate && (!startTime || !endTime) && (
                <p className="text-sm text-amber-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Lütfen başlangıç ve bitiş saatini seçin
                </p>
            )}

            {duration > 0 && duration < 2 && (
                <p className="text-sm text-amber-600">
                    Not: Minimum rezervasyon süresi 2 saattir
                </p>
            )}

            {duration > 8 && (
                <p className="text-sm text-amber-600">
                    Not: Maksimum rezervasyon süresi 8 saattir
                </p>
            )}
        </div>
    );
}
