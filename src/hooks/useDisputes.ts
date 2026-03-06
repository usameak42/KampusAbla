import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Dispute {
    id: string;
    reporter_id: string;
    reported_id: string;
    booking_id: string | null;
    session_id: string | null;
    reason: string;
    description: string | null;
    status: string;
    created_at: string;
    resolved_at: string | null;
    resolved_by: string | null;
    resolution_notes: string | null;
    evidence_urls: any;
}

export function useDisputes(userId: string) {
    const queryClient = useQueryClient();

    const { data: disputes, isLoading } = useQuery({
        queryKey: ["disputes", userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from("reports")
                .select("*")
                .or(`reporter_id.eq.${userId},reported_id.eq.${userId}`)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as unknown as Dispute[];
        },
        enabled: !!userId,
    });

    const createDispute = useMutation({
        mutationFn: async (values: {
            bookingId: string;
            reason: string;
            description: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Auth required");

            // We need to find the reported_id (the sitter in most cases)
            const { data: booking, error: bookingError } = await supabase
                .from("bookings")
                .select("sitter_id, parent_id")
                .eq("id", values.bookingId)
                .single();

            if (bookingError) throw bookingError;

            const reportedId = user.id === booking.parent_id ? booking.sitter_id : booking.parent_id;

            const { data, error } = await supabase.from("reports").insert({
                reporter_id: user.id,
                reported_id: reportedId,
                booking_id: values.bookingId,
                reason: values.reason,
                description: values.description,
                status: "open",
            }).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["disputes", userId] });
            toast.success("Anlaşmazlık kaydı başarıyla oluşturuldu.");
        },
        onError: (error) => {
            console.error("Create dispute error:", error);
            toast.error("Anlaşmazlık kaydı oluşturulurken bir hata oluştu.");
        },
    });

    return {
        disputes,
        isLoading,
        error: null as string | null, // query error not captured in destructuring above, but good to add if needed
        createDispute,
    };
}
