/**
 * useSupport Hook - Manages support tickets
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { SupportTicket, FAQCategory, TicketResponse } from "@/types/help";

interface UseSupportOptions {
    userId: string;
}

interface CreateTicketData {
    subject: string;
    category: FAQCategory;
    message: string;
}

// Helper to map DB row to SupportTicket
function mapTicket(row: any): SupportTicket {
    return {
        id: row.id,
        userId: row.user_id,
        subject: row.subject,
        category: row.category as FAQCategory,
        message: row.message,
        status: row.status as SupportTicket['status'],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        responses: (row.responses || []).map((r: any): TicketResponse => ({
            id: r.id,
            ticketId: r.ticket_id,
            message: r.message,
            isStaff: r.is_staff,
            createdAt: new Date(r.created_at),
        })),
    };
}

export function useSupport({ userId }: UseSupportOptions) {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchTickets();
        }
    }, [userId]);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('support_tickets')
                .select(`
                    *,
                    responses:ticket_responses(*)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setTickets((data || []).map(mapTicket));
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setError('Talepler yüklenemedi');
            toast({
                title: "Hata",
                description: "Destek talepleri yüklenemedi",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const createTicket = useCallback(
        async (data: CreateTicketData): Promise<SupportTicket> => {
            setIsSubmitting(true);
            setError(null);
            try {
                const { data: newTicket, error: insertError } = await supabase
                    .from('support_tickets')
                    .insert({
                        user_id: userId,
                        subject: data.subject,
                        category: data.category,
                        message: data.message,
                        status: 'open'
                    })
                    .select(`
                        *,
                        responses:ticket_responses(*)
                    `)
                    .single();

                if (insertError) throw insertError;

                const mapped = mapTicket(newTicket);
                setTickets((prev) => [mapped, ...prev]);

                toast({
                    title: "Talep oluşturuldu",
                    description: "Destek talebiniz başarıyla oluşturuldu",
                });

                return mapped;
            } catch (err) {
                console.error('Error creating ticket:', err);
                setError("Destek talebi oluşturulamadı");
                toast({
                    title: "Hata",
                    description: "Destek talebi oluşturulamadı",
                    variant: "destructive",
                });
                throw err;
            } finally {
                setIsSubmitting(false);
            }
        },
        [userId]
    );

    const addResponse = useCallback(
        async (ticketId: string, message: string): Promise<void> => {
            setIsSubmitting(true);
            try {
                const { data, error: insertError } = await supabase
                    .from('ticket_responses')
                    .insert({
                        ticket_id: ticketId,
                        user_id: userId,
                        message,
                        is_staff: false
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                setTickets((prev) =>
                    prev.map((ticket) => {
                        if (ticket.id !== ticketId) return ticket;
                        const newResponse: TicketResponse = {
                            id: data.id,
                            ticketId: data.ticket_id,
                            message: data.message,
                            isStaff: data.is_staff,
                            createdAt: new Date(data.created_at),
                        };
                        return {
                            ...ticket,
                            updatedAt: new Date(),
                            responses: [...(ticket.responses || []), newResponse],
                        };
                    })
                );

                toast({
                    title: "Yanıt gönderildi",
                    description: "Yanıtınız başarıyla gönderildi",
                });
            } catch (err) {
                console.error('Error adding response:', err);
                setError("Yanıt gönderilemedi");
                toast({
                    title: "Hata",
                    description: "Yanıt gönderilemedi",
                    variant: "destructive",
                });
                throw err;
            } finally {
                setIsSubmitting(false);
            }
        },
        [userId]
    );

    const closeTicket = useCallback(async (ticketId: string): Promise<void> => {
        setIsSubmitting(true);
        try {
            const { error: updateError } = await supabase
                .from('support_tickets')
                .update({
                    status: 'closed',
                    closed_at: new Date().toISOString()
                })
                .eq('id', ticketId)
                .eq('user_id', userId);

            if (updateError) throw updateError;

            setTickets((prev) =>
                prev.map((ticket) =>
                    ticket.id === ticketId
                        ? { ...ticket, status: "closed" as const, updatedAt: new Date() }
                        : ticket
                )
            );

            toast({
                title: "Talep kapatıldı",
                description: "Destek talebiniz kapatıldı",
            });
        } catch (err) {
            console.error('Error closing ticket:', err);
            setError("Talep kapatılamadı");
            toast({
                title: "Hata",
                description: "Talep kapatılamadı",
                variant: "destructive",
            });
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, [userId]);

    const getTicketById = useCallback(
        (ticketId: string): SupportTicket | undefined => {
            return tickets.find((t) => t.id === ticketId);
        },
        [tickets]
    );

    const openTicketsCount = tickets.filter(
        (t) => t.status === "open" || t.status === "in_progress"
    ).length;

    return {
        tickets,
        openTicketsCount,
        isLoading,
        isSubmitting,
        error,
        createTicket,
        addResponse,
        closeTicket,
        getTicketById,
    };
}
