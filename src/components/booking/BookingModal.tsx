/**
 * Booking Modal Component - Multi-step booking wizard
 */

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/booking/DateTimePicker";
import { ChildrenSelector } from "@/components/booking/ChildrenSelector";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Sitter } from "@/hooks/useSearchSitters";
import { validateBookingDuration } from "@/lib/booking";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createBookingSchema } from "@/schemas/validation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { timeToMinutes } from "@/lib/booking";
import { useToast } from "@/components/ui/use-toast";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    sitter: Sitter;
    onSuccess: (bookingId: string) => void;
}

interface BookingData {
    date: Date | null;
    startTime: string;
    endTime: string;
    childrenIds: string[];
    specialRequirements: string;
    locationAddress: string;
    pickupNeeded: boolean;
    pickupLocationId: string;
}

const INITIAL_DATA: BookingData = {
    date: null,
    startTime: "",
    endTime: "",
    childrenIds: [],
    specialRequirements: "",
    locationAddress: "",
    pickupNeeded: false,
    pickupLocationId: "",
};

export function BookingModal({
    isOpen,
    onClose,
    sitter,
    onSuccess,
}: BookingModalProps) {
    const [step, setStep] = useState(1);
    const [bookingData, setBookingData] = useState<BookingData>(INITIAL_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    // Fetch pickup locations
    const { data: pickupLocations = [] } = useQuery({
        queryKey: ["pickup-locations", user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            // Assuming user.dashboardId matches parent_id or user.id map
            // Since we don't know exact mapping, let's try strict RLS with user_id on parents table to find parent_id
            // Or just select from pickup_locations and let RLS handle it (RLS is "parent_id IN ... user_id = auth.uid()")
            // Actually RLS for SELECT on pickup_locations is: "parents.user_id = auth.uid()" join.
            // So we can just select *.
            const { data, error } = await supabase
                .from("pickup_locations")
                .select("*");
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;

    const isStep1Valid = () => {
        const validation = createBookingSchema.safeParse({
            bookingDate: bookingData.date || new Date(), // Fallback for initial check, schema handles actual date
            startTime: bookingData.startTime,
            durationHours: bookingData.startTime && bookingData.endTime
                ? (timeToMinutes(bookingData.endTime) - timeToMinutes(bookingData.startTime)) / 60
                : 0,
            pickupNeeded: bookingData.pickupNeeded,
            pickupLocationId: bookingData.pickupLocationId || undefined,
            notes: bookingData.specialRequirements
        });

        if (!validation.success) {
            // Check specific fields that are required for enabling the button
            // We mainly care if date/time are set and valid format, and if pickup needs loc
            // However, safeParse returns success=false even for ONE error.
            // Simplified check for button enablement:
            const hasBasicFields = !!bookingData.date && !!bookingData.startTime && !!bookingData.endTime;
            const pickupValid = !bookingData.pickupNeeded || !!bookingData.pickupLocationId;
            return hasBasicFields && pickupValid && validation.success;
        }

        // Custom Business Logic: Pickup Window
        if (bookingData.pickupNeeded && bookingData.pickupLocationId) {
            const location = pickupLocations.find((l: any) => l.id === bookingData.pickupLocationId);
            if (location && location.pickup_window_start && location.pickup_window_end) {
                const bookingStart = timeToMinutes(bookingData.startTime);
                const windowStart = timeToMinutes(location.pickup_window_start);
                const windowEnd = timeToMinutes(location.pickup_window_end);

                if (bookingStart < windowStart || bookingStart > windowEnd) {
                    return false;
                }
            }
        }

        return true;
    };

    const isStep2Valid = () => {
        return bookingData.childrenIds.length > 0;
    };

    const handleNext = () => {
        if (step === 1) {
            if (bookingData.pickupNeeded && bookingData.pickupLocationId) {
                const location = pickupLocations.find((l: any) => l.id === bookingData.pickupLocationId);
                if (location && location.pickup_window_start && location.pickup_window_end) {
                    const bookingStart = timeToMinutes(bookingData.startTime);
                    const windowStart = timeToMinutes(location.pickup_window_start);
                    const windowEnd = timeToMinutes(location.pickup_window_end);

                    if (bookingStart < windowStart || bookingStart > windowEnd) {
                        toast({
                            variant: "destructive",
                            title: "Saat Uyumsuzluğu",
                            description: `Seçilen konum için okul çıkış saati ${location.pickup_window_start.substring(0, 5)} - ${location.pickup_window_end.substring(0, 5)} arasındadır.`
                        });
                        return;
                    }
                }
            }
            if (step < totalSteps) {
                setStep(step + 1);
            }
        } else if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleClose = () => {
        setStep(1);
        setBookingData(INITIAL_DATA);
        onClose();
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Validation before submit
            const validation = createBookingSchema.safeParse({
                bookingDate: bookingData.date,
                startTime: bookingData.startTime,
                durationHours: (timeToMinutes(bookingData.endTime) - timeToMinutes(bookingData.startTime)) / 60,
                pickupNeeded: bookingData.pickupNeeded,
                pickupLocationId: bookingData.pickupLocationId || undefined,
            });

            if (!validation.success) {
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: validation.error.errors[0].message
                });
                return;
            }

            // Mock: Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Success
            onSuccess("mock-booking-id");
            handleClose();
        } catch (error) {
            console.error("Booking error:", error);
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Bir hata oluştu"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        Rezervasyon Yap
                    </DialogTitle>
                    <DialogDescription>
                        {sitter.fullName} ile bakıcılık rezervasyonu oluşturun
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                            Adım {step} / {totalSteps}
                        </span>
                        <span className="text-sm font-medium">
                            {step === 1 && "Tarih & Saat"}
                            {step === 2 && "Çocuk Seçimi"}
                            {step === 3 && "Onay"}
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">
                                    Ne zaman bakıcı arayorsunuz?
                                </h3>
                                <DateTimePicker
                                    selectedDate={bookingData.date}
                                    startTime={bookingData.startTime}
                                    endTime={bookingData.endTime}
                                    onDateChange={(date) =>
                                        setBookingData({ ...bookingData, date })
                                    }
                                    onStartTimeChange={(time) =>
                                        setBookingData({ ...bookingData, startTime: time })
                                    }
                                    onEndTimeChange={(time) =>
                                        setBookingData({ ...bookingData, endTime: time })
                                    }
                                    hourlyRate={sitter.hourlyRate}
                                />
                            </div>

                            {/* Pickup Selection UI */}
                            <div className="flex items-center space-x-2 border p-4 rounded-md bg-slate-50">
                                <Switch
                                    id="pickup-mode"
                                    checked={bookingData.pickupNeeded}
                                    onCheckedChange={(checked) => setBookingData({ ...bookingData, pickupNeeded: checked })}
                                />
                                <div className="flex flex-col">
                                    <h4 className="font-medium text-sm">Okuldan/Kurstan Karşılama İste</h4>
                                    <p className="text-xs text-muted-foreground">Bakıcı çocuğunuzu belirli bir yerden alsın</p>
                                </div>
                            </div>

                            {bookingData.pickupNeeded && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-sm font-medium">Karşılama Konumu Seçin</label>
                                    <Select
                                        value={bookingData.pickupLocationId}
                                        onValueChange={(val) => setBookingData({ ...bookingData, pickupLocationId: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Konum seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pickupLocations.map((loc: any) => (
                                                <SelectItem key={loc.id} value={loc.id}>
                                                    {loc.address}
                                                    {loc.pickup_window_start ? ` (${loc.pickup_window_start.substring(0, 5)} - ${loc.pickup_window_end?.substring(0, 5)})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {pickupLocations.length === 0 && (
                                        <p className="text-sm text-amber-600 flex items-center gap-1">
                                            <span className="text-lg">⚠️</span>
                                            Kayıtlı konumunuz yok. Profil ayarlarından ekleyebilirsiniz.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Hangi çocuk/çocuklar için bakıcı arayorsunuz?
                            </h3>
                            <ChildrenSelector
                                selectedChildrenIds={bookingData.childrenIds}
                                onSelectionChange={(ids) =>
                                    setBookingData({ ...bookingData, childrenIds: ids })
                                }
                                specialRequirements={bookingData.specialRequirements}
                                onSpecialRequirementsChange={(text) =>
                                    setBookingData({ ...bookingData, specialRequirements: text })
                                }
                            />
                        </div>
                    )}

                    {step === 3 && bookingData.date && (
                        <BookingSummary
                            sitter={sitter}
                            date={bookingData.date}
                            startTime={bookingData.startTime}
                            endTime={bookingData.endTime}
                            childrenIds={bookingData.childrenIds}
                            specialRequirements={bookingData.specialRequirements}
                        />
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t">
                    <Button
                        variant="outline"
                        onClick={step === 1 ? handleClose : handleBack}
                        disabled={isSubmitting}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {step === 1 ? "İptal" : "Geri"}
                    </Button>

                    {step < totalSteps ? (
                        <Button
                            onClick={handleNext}
                            disabled={
                                (step === 1 && !isStep1Valid()) ||
                                (step === 2 && !isStep2Valid())
                            }
                        >
                            İleri
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="min-w-[120px]"
                        >
                            {isSubmitting ? (
                                "Gönderiliyor..."
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Onayla
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
