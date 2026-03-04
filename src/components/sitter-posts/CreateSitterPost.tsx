import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const formSchema = z.object({
    title: z.string().min(5, "Başlık en az 5 karakter olmalıdır"),
    description: z.string().min(20, "Açıklama en az 20 karakter olmalıdır"),
    available_date: z.date({
        required_error: "Lütfen bir tarih seçin",
    }),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Saat formatı HH:MM olmalıdır"),
    duration_hours: z.coerce.number().min(1, "En az 1 saat olmalıdır").max(24, "En fazla 24 saat olabilir"),
    hourly_rate: z.coerce.number().min(0, "Ücret 0'dan küçük olamaz"),
});

export function CreateSitterPost({ onSuccess }: { onSuccess?: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            duration_hours: 2,
            hourly_rate: 0,
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) return;
        setIsLoading(true);

        try {
            // Get sitter ID
            const { data: sitterData } = await supabase
                .from("sitters")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!sitterData) throw new Error("Sitter profile not found");

            const { error } = await (supabase as any)
                .from("sitter_posts")
                .insert({
                    sitter_id: sitterData.id,
                    title: values.title,
                    description: values.description,
                    available_date: format(values.available_date, "yyyy-MM-dd"),
                    start_time: values.start_time,
                    duration_hours: values.duration_hours,
                    hourly_rate: values.hourly_rate,
                    status: "open",
                });

            if (error) throw error;

            toast({
                title: "İlan Oluşturuldu",
                description: "Bakıcılık ilanınız başarıyla yayınlandı.",
            });

            form.reset();
            onSuccess?.();
        } catch (error) {
            console.error("Error creating post:", error);
            toast({
                title: "Hata",
                description: "İlan oluşturulurken bir sorun oluştu.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Başlık</FormLabel>
                            <FormControl>
                                <Input placeholder="Örn: Hafta sonu oyun ablası" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="available_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Tarih</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "d MMMM yyyy", { locale: tr })
                                                ) : (
                                                    <span>Tarih seçin</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date()
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Başlangıç Saati</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="duration_hours"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Süre (Saat)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.5" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="hourly_rate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Saatlik Ücret (TL)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Açıklama</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Deneyimlerinizden ve yapabileceğiniz aktivitelerden bahsedin..."
                                    className="min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    İlanı Yayınla
                </Button>
            </form>
        </Form>
    );
}
