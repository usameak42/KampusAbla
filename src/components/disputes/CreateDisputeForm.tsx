import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Mock booking data type
interface BookingOption {
    id: string;
    sitterName: string;
    date: string;
}

const formSchema = z.object({
    bookingId: z.string().min(1, { message: "Lütfen bir rezervasyon seçiniz" }),
    reason: z.string().min(5, { message: "Lütfen bir neden belirtiniz" }),
    description: z.string()
        .min(20, { message: "Açıklama en az 20 karakter olmalıdır" })
        .max(3000, { message: "Açıklama 3000 karakteri geçemez" }), // KA-122: Increased limit to 3000
});

interface CreateDisputeFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function CreateDisputeForm({ onSuccess, onCancel }: CreateDisputeFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookings, setBookings] = useState<BookingOption[]>([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bookingId: "",
            reason: "",
            description: "",
        },
    });

    // Fetch real bookings
    useEffect(() => {
        const fetchBookings = async () => {
            setIsLoadingBookings(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from("bookings")
                    .select("id, start_time, sitters(full_name)")
                    .or(`parent_id.eq.${user.id},sitter_id.eq.${user.id}`)
                    .order("start_time", { ascending: false });

                if (error) throw error;

                const formattedBookings = data.map((b: any) => ({
                    id: b.id,
                    sitterName: b.sitters?.full_name || "Bilinmeyen Bakıcı",
                    date: new Date(b.start_time).toLocaleDateString("tr-TR"),
                }));

                setBookings(formattedBookings);
            } catch (error) {
                console.error("Error loading bookings:", error);
                toast({
                    title: "Hata",
                    description: "Rezervasyonlar yüklenirken bir hata oluştu.",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingBookings(false);
            }
        };
        fetchBookings();
    }, [toast]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

            // Look up the booking to find the reported user
            const { data: booking, error: bookingError } = await supabase
                .from("bookings")
                .select("sitter_id, parent_id")
                .eq("id", values.bookingId)
                .single();

            if (bookingError) throw bookingError;

            const reportedId = user.id === booking.parent_id ? booking.sitter_id : booking.parent_id;

            const { error } = await supabase.from("reports").insert({
                reporter_id: user.id,
                reported_id: reportedId,
                booking_id: values.bookingId,
                reason: values.reason,
                description: values.description,
                status: "open",
            });

            if (error) throw error;

            toast({
                title: "Destek talebi oluşturuldu",
                description: "Talebiniz başarıyla alındı. En kısa sürede size dönüş yapacağız.",
            });
            onSuccess();
        } catch (error) {
            console.error("Error creating dispute:", error);
            toast({
                title: "Hata",
                description: error instanceof Error ? error.message : "Talep oluşturulurken bir hata meydana geldi.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                <Alert variant="default" className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Önemli</AlertTitle>
                    <AlertDescription className="text-amber-700 text-xs">
                        Anlaşmazlık bildirimleri tarafsız ekibimizce incelenir.
                        Lütfen ilgili rezervasyonu seçerek detaylı bilgi veriniz.
                    </AlertDescription>
                </Alert>

                <FormField
                    control={form.control}
                    name="bookingId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>İlgili Rezervasyon</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isLoadingBookings}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isLoadingBookings ? "Yükleniyor..." : "Rezervasyon seçiniz"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {bookings.map((booking) => (
                                        <SelectItem key={booking.id} value={booking.id}>
                                            {booking.date} - {booking.sitterName} ({booking.id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Sorun yaşadığınız rezervasyonu seçiniz.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Konu</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sorun tipi seçiniz" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="cancellation">İptal Sorunu</SelectItem>
                                    <SelectItem value="payment">Ödeme Sorunu</SelectItem>
                                    <SelectItem value="quality">Hizmet Kalitesi</SelectItem>
                                    <SelectItem value="safety">Güvenlik İhlali</SelectItem>
                                    <SelectItem value="other">Diğer</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Açıklama</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Lütfen yaşadığınız sorunu detaylı bir şekilde anlatınız..."
                                    className="min-h-[150px] resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription className="flex justify-between">
                                <span>En az 20 karakter.</span>
                                <span>{field.value?.length || 0}/3000</span>
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
                        İptal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Talebi Gönder
                    </Button>
                </div>
            </form>
        </Form>
    );
}
