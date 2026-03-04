import { useState, useCallback, useMemo, useEffect } from "react";
import type { NeedPost } from "@/components/need-posts/NeedPostCard";
import type { NeedPostFormData } from "@/components/need-posts/CreateNeedPost";
import { supabase } from "@/integrations/supabase/client";
import { needPostSchema, applicationSchema } from "@/schemas/validation";

interface UseNeedPostsOptions {
    userId?: string;
    viewMode: "sitter" | "parent";
}

export function useNeedPosts({ userId, viewMode }: UseNeedPostsOptions) {
    const [needPosts, setNeedPosts] = useState<NeedPost[]>([]);
    const [appliedPostIds, setAppliedPostIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNeedPosts = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let query = supabase
                .from("need_posts")
                .select(`
                    *,
                    parent:parents (
                        full_name,
                        profile_photo_url
                    ),
                    children:need_post_children (
                        child:children (
                            birth_date
                        )
                    ),
                    applicationsCount:need_applications(count)
                `);

            if (viewMode === "parent" && userId) {
                query = query.eq("parent_id", userId);
            } else {
                // For sitters, show only open posts
                query = query.eq("status", "open");
            }

            const { data, error: fetchError } = await query.order("created_at", { ascending: false });

            if (fetchError) throw fetchError;

            if (data) {
                const transformedPosts: NeedPost[] = data.map((item) => {
                    // Extract ages from birth dates
                    const childrenAges = (item.children as { child: { birth_date?: string } | null }[] || []).map((c) => {
                        if (!c.child?.birth_date) return 0;
                        const birthDate = new Date(c.child.birth_date);
                        const today = new Date();
                        let age = today.getFullYear() - birthDate.getFullYear();
                        if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
                            age--;
                        }
                        return age;
                    }) || [];

                    return {
                        id: item.id,
                        parentId: item.parent_id,
                        parentName: item.parent?.full_name || "Bilinmeyen Ebeveyn",
                        parentPhoto: item.parent?.profile_photo_url,
                        title: item.title,
                        description: item.description,
                        needDate: new Date(item.needed_date),
                        startTime: item.start_time,
                        durationHours: Number(item.duration_hours),
                        childrenCount: childrenAges.length,
                        childrenAges: childrenAges,
                        languageGoal: item.language_goal,
                        homeworkHelp: item.homework_help,
                        address: item.meeting_address,
                        district: "",
                        hourlyRateOffered: Number(item.hourly_rate_min || 0),
                        status: item.status as ("open" | "matched" | "cancelled" | "expired"),
                        applicationsCount: item.applicationsCount?.[0]?.count || 0,
                        createdAt: new Date(item.created_at),
                    };
                });
                setNeedPosts(transformedPosts);
            }

            // Also fetch which posts the current user (if sitter) has already applied to
            if (viewMode === "sitter" && userId) {
                const { data: apps, error: appError } = await supabase
                    .from("need_applications")
                    .select("need_post_id")
                    .eq("sitter_id", userId);

                if (!appError && apps) {
                    setAppliedPostIds(apps.map(a => a.need_post_id));
                }
            }
        } catch (err) {
            console.error("Error fetching need posts:", err);
            setError(err instanceof Error ? err.message : "İlanlar yüklenemedi");
        } finally {
            setIsLoading(false);
        }
    }, [userId, viewMode]);

    useEffect(() => {
        fetchNeedPosts();
    }, [fetchNeedPosts]);

    // Create a new need post
    const createNeedPost = useCallback(async (data: NeedPostFormData): Promise<string> => {
        if (!userId) throw new Error("Ebeveyn ID gerekli");

        // Validate data
        const validation = needPostSchema.safeParse(data);
        if (!validation.success) {
            throw new Error(validation.error.errors[0].message);
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Insert the post
            const { data: newPost, error: insertError } = await supabase
                .from("need_posts")
                .insert({
                    parent_id: userId,
                    title: data.title,
                    description: data.description,
                    needed_date: data.needDate.toISOString().split('T')[0],
                    start_time: data.startTime,
                    duration_hours: data.durationHours,
                    language_goal: data.languageGoal,
                    homework_help: data.homeworkHelp,
                    meeting_address: data.address,
                    hourly_rate_min: data.hourlyRateOffered,
                    hourly_rate_max: data.hourlyRateOffered,
                    status: "open",
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // 2. Insert junction table entries for children
            if (data.selectedChildrenIds.length > 0) {
                const childEntries = data.selectedChildrenIds.map(childId => ({
                    need_post_id: newPost.id,
                    child_id: childId
                }));

                const { error: junctionError } = await supabase
                    .from("need_post_children")
                    .insert(childEntries);

                if (junctionError) console.error("Error adding children to post:", junctionError);
            }

            await fetchNeedPosts();
            return newPost.id;
        } catch (err) {
            console.error("Error creating post:", err);
            const message = err instanceof Error ? err.message : "İlan oluşturulamadı";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [userId, fetchNeedPosts]);

    // Apply to a need post (for sitters)
    const applyToNeedPost = useCallback(async (
        needPostId: string,
        message: string,
        proposedRate?: number
    ): Promise<void> => {
        if (!userId) throw new Error("Bakıcı ID gerekli");

        // Validate application
        const validation = applicationSchema.safeParse({ message, proposedRate });
        if (!validation.success) {
            throw new Error(validation.error.errors[0].message);
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error: applyError } = await supabase
                .from("need_applications")
                .insert({
                    need_post_id: needPostId,
                    sitter_id: userId,
                    message: message,
                    hourly_rate: proposedRate,
                    status: "pending",
                });

            if (applyError) throw applyError;

            setAppliedPostIds((prev) => [...prev, needPostId]);
            await fetchNeedPosts();
        } catch (err) {
            console.error("Error applying to post:", err);
            const message = err instanceof Error ? err.message : "Başvuru gönderilemedi";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [userId, fetchNeedPosts]);

    // Cancel a need post (for parents)
    const cancelNeedPost = useCallback(async (needPostId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const { error: cancelError } = await supabase
                .from("need_posts")
                .update({ status: "cancelled" })
                .eq("id", needPostId);

            if (cancelError) throw cancelError;

            await fetchNeedPosts();
        } catch (err) {
            console.error("Error cancelling post:", err);
            const message = err instanceof Error ? err.message : "İlan iptal edilemedi";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [fetchNeedPosts]);

    // Get statistics
    const stats = useMemo(() => {
        const openPosts = needPosts.filter((p) => p.status === "open").length;
        const totalApplications = needPosts.reduce((sum, p) => sum + p.applicationsCount, 0);
        const myApplicationsCount = appliedPostIds.length;

        return {
            openPosts,
            totalApplications,
            myApplications: myApplicationsCount,
        };
    }, [needPosts, appliedPostIds]);

    return {
        needPosts,
        allNeedPosts: needPosts,
        appliedPostIds,
        isLoading,
        error,
        stats,
        createNeedPost,
        applyToNeedPost,
        cancelNeedPost,
        refreshPosts: fetchNeedPosts,
    };
}
