import { useState, useCallback, useMemo, useEffect } from "react";
import type { Application } from "@/components/need-posts/ApplicationCard";
import { supabase } from "@/integrations/supabase/client";

interface UseApplicationsOptions {
    needPostId: string;
}

export function useApplications({ needPostId }: UseApplicationsOptions) {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = useCallback(async () => {
        if (!needPostId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from("need_applications")
                .select(`
                    *,
                    sitter:sitters (
                        id,
                        full_name,
                        profile_photo_url,
                        university,
                        department,
                        student_year,
                        rating,
                        review_count,
                        verification_status
                    ),
                    needPost:need_posts (
                        hourly_rate_min
                    )
                `)
                .eq("need_post_id", needPostId);

            if (fetchError) throw fetchError;

            if (data) {
                const transformedApps: Application[] = data.map((item) => ({
                    id: item.id,
                    needPostId: item.need_post_id,
                    sitterId: item.sitter_id,
                    sitterName: item.sitter?.full_name || "Bilinmeyen Bakıcı",
                    sitterPhoto: item.sitter?.profile_photo_url,
                    sitterUniversity: item.sitter?.university || "",
                    sitterDepartment: item.sitter?.department || "",
                    sitterYear: item.sitter?.student_year || 1,
                    sitterRating: Number(item.sitter?.rating || 0),
                    sitterReviewCount: item.sitter?.review_count || 0,
                    sitterCompletedSessions: 0,
                    sitterLanguages: [] as string[],
                    isVerified: item.sitter?.verification_status === "verified" || item.sitter?.verification_status === "approved",
                    message: item.message || "",
                    proposedRate: item.proposed_rate ? Number(item.proposed_rate) : undefined,
                    originalRate: Number(item.needPost?.hourly_rate_min || 0),
                    status: item.status as ("pending" | "accepted" | "rejected"),
                    createdAt: new Date(item.created_at),
                }));
                setApplications(transformedApps);
            }
        } catch (err: any) {
            console.error("Error fetching applications:", err);
            setError(err.message || "Başvurular yüklenemedi");
        } finally {
            setIsLoading(false);
        }
    }, [needPostId]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    // Accept an application
    const acceptApplication = useCallback(async (applicationId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Fetch application and need post data + children
            const { data: application, error: appFetchError } = await supabase
                .from("need_applications")
                .select(`
                    *,
                    needPost:need_posts (
                        *,
                        children:need_post_children (
                            child_id
                        )
                    )
                `)
                .eq("id", applicationId)
                .single();

            if (appFetchError) throw appFetchError;
            const needPost = application.needPost;
            const childIds = (needPost.children as { child_id: string }[] || []).map((c) => c.child_id);

            // 2. Update accepted application status
            const { error: updateAppError } = await supabase
                .from("need_applications")
                .update({ status: "accepted" })
                .eq("id", applicationId);

            if (updateAppError) throw updateAppError;

            // 3. Reject other pending applications for same post
            await supabase
                .from("need_applications")
                .update({ status: "rejected" })
                .eq("need_post_id", needPostId)
                .neq("id", applicationId)
                .eq("status", "pending");

            // 4. Update need post status to matched
            await supabase
                .from("need_posts")
                .update({ status: "matched" })
                .eq("id", needPostId);

            // 5. Create booking
            const { data: booking, error: bookingError } = await supabase
                .from("bookings")
                .insert({
                    parent_id: needPost.parent_id,
                    sitter_id: application.sitter_id,
                    status: "accepted",
                    booking_date: needPost.needed_date,
                    start_time: needPost.start_time,
                    duration_hours: needPost.duration_hours,
                    pickup_needed: needPost.pickup_needed,
                    meeting_address: needPost.meeting_address,
                    notes: needPost.description,
                    total_amount: (application.proposed_rate || needPost.hourly_rate_min) * needPost.duration_hours,
                })
                .select()
                .single();

            if (bookingError) throw bookingError;

            // 6. Create booking_children entries
            if (childIds.length > 0) {
                const bookingChildren = childIds.map(childId => ({
                    booking_id: booking.id,
                    child_id: childId
                }));

                const { error: junctionError } = await supabase
                    .from("booking_children")
                    .insert(bookingChildren);

                if (junctionError) console.error("Error adding children to booking:", junctionError);
            }

            await fetchApplications();
        } catch (err) {
            console.error("Error accepting application:", err);
            setError(err instanceof Error ? err.message : "Başvuru kabul edilemedi");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [needPostId, fetchApplications]);

    // Reject an application
    const rejectApplication = useCallback(async (applicationId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const { error: rejectError } = await supabase
                .from("need_applications")
                .update({ status: "rejected" })
                .eq("id", applicationId);

            if (rejectError) throw rejectError;

            await fetchApplications();
        } catch (err) {
            console.error("Error rejecting application:", err);
            setError(err instanceof Error ? err.message : "Başvuru reddedilemedi");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [fetchApplications]);

    // Get statistics
    const stats = useMemo(() => {
        const pending = applications.filter(a => a.status === "pending").length;
        const accepted = applications.filter(a => a.status === "accepted").length;
        const rejected = applications.filter(a => a.status === "rejected").length;
        const total = applications.length;

        return { pending, accepted, rejected, total };
    }, [applications]);

    return {
        applications,
        isLoading,
        error,
        stats,
        acceptApplication,
        rejectApplication,
        refreshApplications: fetchApplications,
    };
}
