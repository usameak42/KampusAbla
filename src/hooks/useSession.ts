/**
 * useSession Hook - Manages active session state
 */

import { useState, useCallback, useEffect } from "react";
import type { Session, SessionStatus, SessionState } from "@/types/session";
import { canTransitionTo } from "@/types/session";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UseSessionOptions {
    sessionId?: string;
}

export function useSession(options: UseSessionOptions = {}) {
    const { sessionId } = options;
    const { user } = useAuth();
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch session data
    const fetchSession = useCallback(async () => {
        if (!sessionId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const { data, error: fetchError } = await supabase
                .from('sessions')
                .select(`
                    *,
                    booking:bookings (
                        *,
                        parent:parents (
                            *,
                            user:users (phone)
                        ),
                        sitter:sitters (
                            *,
                            user:users (phone)
                        ),
                        children:booking_children (
                            child:children (*)
                        )
                    ),
                    history:session_status_history (*)
                `)
                .eq('id', sessionId)
                .single();

            if (fetchError) throw fetchError;

            if (data) {
                const rawData = data as any;
                const booking = rawData.booking;
                const parent = booking.parent;
                const sitter = booking.sitter;

                // Transform data into Session interface format
                const transformedSession: Session = {
                    id: rawData.id,
                    bookingId: rawData.booking_id,
                    parentId: parent.id,
                    parentName: parent.full_name,
                    parentPhone: parent.user?.phone || parent.phone || "",
                    sitterId: sitter.id,
                    sitterName: sitter.full_name,
                    sitterPhone: sitter.user?.phone || sitter.phone || "",
                    childrenNames: booking.children.map((c: any) => c.child.name || c.child.full_name),
                    childrenAges: booking.children.map((c: any) => {
                        const child = c.child;
                        if (child.birth_date) {
                            const birthDate = new Date(child.birth_date);
                            return new Date().getFullYear() - birthDate.getFullYear();
                        }
                        return child.age || 0;
                    }),
                    scheduledStart: new Date(booking.booking_date + 'T' + booking.start_time),
                    scheduledEnd: new Date(new Date(booking.booking_date + 'T' + booking.start_time).getTime() + booking.duration_hours * 60 * 60 * 1000),
                    actualStart: rawData.started_at ? new Date(rawData.started_at) : undefined,
                    actualEnd: rawData.ended_at ? new Date(rawData.ended_at) : undefined,
                    address: booking.meeting_address || "",
                    district: parent.district || parent.address || "",
                    emergencyContacts: [],
                    currentStatus: (rawData.status || "pending") as SessionStatus,
                    statusHistory: (rawData.history || []).map((h: any) => ({
                        status: (h.status || "pending") as SessionStatus,
                        timestamp: new Date(h.created_at),
                        note: h.note || undefined,
                        location: h.location_lat ? { lat: h.location_lat, lng: h.location_lng } : undefined
                    })),
                    parentNotes: booking.notes || "",
                    handoverPin: "1234", // Mock PIN
                    handoverStartConfirmedAt: rawData.started_at ? new Date(rawData.started_at) : undefined,
                    handoverEndConfirmedAt: rawData.ended_at ? new Date(rawData.ended_at) : undefined,
                };
                setSession(transformedSession);
            }
        } catch (err: any) {
            console.error("Error fetching session:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    // Set up real-time subscription
    useEffect(() => {
        if (!sessionId) return;

        fetchSession();

        const channel = supabase
            .channel(`session-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sessions',
                    filter: `id=eq.${sessionId}`,
                },
                () => {
                    fetchSession();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, fetchSession]);

    // Update session status
    const updateStatus = useCallback(async (newStatus: SessionStatus, note?: string): Promise<void> => {
        if (!session || !sessionId || !user) return;

        if (!canTransitionTo(session.currentStatus, newStatus)) {
            setError("Bu durum geçişi yapılamaz");
            throw new Error("Invalid status transition");
        }

        setIsLoading(true);
        try {
            // 1. Update session status
            const { error: updateError } = await supabase
                .from('sessions')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', sessionId);

            if (updateError) throw updateError;

            // 2. Refresh
            await fetchSession();

        } catch (err: any) {
            console.error("Error updating status:", err);
            setError(err.message || "Durum güncellenemedi");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [session, sessionId, user, fetchSession]);

    // Add note to session
    const addNote = useCallback(async (note: string, isSitter: boolean): Promise<void> => {
        if (!sessionId) return;
        setIsLoading(true);
        try {
            const { error: noteError } = await supabase
                .from('sessions')
                .update({
                    notes: (session?.parentNotes || "") + "\n" + note,
                    updated_at: new Date().toISOString()
                })
                .eq('id', sessionId);

            if (noteError) throw noteError;
            await fetchSession();
        } catch (err: any) {
            console.error("Error adding note:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, session, fetchSession]);

    // Confirm handover
    const confirmHandover = useCallback(async (mode: "start" | "end"): Promise<void> => {
        if (!sessionId || !session) return;

        try {
            setIsLoading(true);
            const now = new Date().toISOString();

            const updates: any = {};
            if (mode === "start") {
                updates.status = 'in_progress';
                updates.started_at = now;
            } else {
                updates.status = 'completed';
                updates.ended_at = now;
            }

            const { error: handoverError } = await supabase
                .from('sessions')
                .update(updates)
                .eq('id', sessionId);

            if (handoverError) throw handoverError;
            await fetchSession();

        } catch (err: any) {
            console.error("Error confirming handover:", err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, session, fetchSession]);

    return {
        session,
        isLoading,
        error,
        updateStatus,
        addNote,
        confirmHandover,
        refreshSession: fetchSession,
    };
}
