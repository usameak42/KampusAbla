/**
 * useUserPreferences Hook - Database-backed user settings
 * 
 * Focused hook for persisting:
 * - Notification preferences
 * - Privacy settings
 * - Language preference
 * - Theme preference
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserPreferences {
    id: string;
    user_id: string;
    notification_preferences: Record<string, any>;
    privacy_settings: Record<string, any>;
    language: string;
    theme: 'light' | 'dark' | 'system';
    created_at: string;
    updated_at: string;
}

export function useUserPreferences(userId: string) {
    const queryClient = useQueryClient();

    // Fetch user settings
    const { data: preferences, isLoading, error } = useQuery<UserPreferences>({
        queryKey: ['user-preferences', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .single();
            const typedData = data as unknown as UserPreferences;

            if (error) {
                // If no settings exist, create default
                if (error.code === 'PGRST116') {
                    const { data: newSettings, error: insertError } = await supabase
                        .from('user_settings')
                        .insert({ user_id: userId })
                        .select()
                        .single();

                    if (insertError) throw insertError;
                    return newSettings as unknown as UserPreferences;
                }
                throw error;
            }
            return data as unknown as UserPreferences;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Update notification preferences
    const updateNotifications = useMutation({
        mutationFn: async (prefs: Record<string, any>) => {
            const { error } = await supabase
                .from('user_settings')
                .update({ notification_preferences: prefs })
                .eq('user_id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
            toast({
                title: "Ayarlar kaydedildi",
                description: "Bildirim tercihleriniz güncellendi",
            });
        },
        onError: (err) => {
            console.error('Error updating notifications:', err);
            toast({
                title: "Hata",
                description: "Ayarlar kaydedilemedi",
                variant: "destructive",
            });
        },
    });

    // Update privacy settings
    const updatePrivacy = useMutation({
        mutationFn: async (settings: Record<string, any>) => {
            const { error } = await supabase
                .from('user_settings')
                .update({ privacy_settings: settings })
                .eq('user_id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
            toast({
                title: "Gizlilik ayarları güncellendi",
                description: "Değişiklikler kaydedildi",
            });
        },
        onError: (err) => {
            console.error('Error updating privacy:', err);
            toast({
                title: "Hata",
                description: "Gizlilik ayarları kaydedilemedi",
                variant: "destructive",
            });
        },
    });

    // Update language preference
    const updateLanguage = useMutation({
        mutationFn: async (language: string) => {
            const { error } = await supabase
                .from('user_settings')
                .update({ language })
                .eq('user_id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
            toast({
                title: "Dil tercihi kaydedildi",
                description: "Uygulama yeniden başlatıldığında uygulanacak",
            });
        },
        onError: (err) => {
            console.error('Error updating language:', err);
            toast({
                title: "Hata",
                description: "Dil tercihi kaydedilemedi",
                variant: "destructive",
            });
        },
    });

    // Update theme preference
    const updateTheme = useMutation({
        mutationFn: async (theme: 'light' | 'dark' | 'system') => {
            const { error } = await supabase
                .from('user_settings')
                .update({ theme })
                .eq('user_id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
            toast({
                title: "Tema tercihi kaydedildi",
                description: "Tema değişikliği uygulandı",
            });
        },
        onError: (err) => {
            console.error('Error updating theme:', err);
            toast({
                title: "Hata",
                description: "Tema tercihi kaydedilemedi",
                variant: "destructive",
            });
        },
    });

    return {
        preferences,
        isLoading,
        error,
        updateNotifications,
        updatePrivacy,
        updateLanguage,
        updateTheme,
    };
}
