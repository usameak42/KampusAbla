/**
 * useFavorites Hook - Manage favorite sitters with persistence
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useFavorites() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchFavorites();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const fetchFavorites = async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from("favorites")
                .select("sitter_id")
                .eq("parent_id", user.id);

            if (error) throw error;

            const favoriteIds = new Set(data?.map(f => f.sitter_id) || []);
            setFavorites(favoriteIds);
        } catch (error) {
            console.error("Error fetching favorites:", error);
            toast({
                title: "Hata",
                description: "Favoriler yüklenemedi",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFavorite = async (sitterId: string) => {
        if (!user) {
            toast({
                title: "Giriş yapmalısınız",
                description: "Favorilere eklemek için lütfen giriş yapın",
                variant: "destructive",
            });
            return;
        }

        const newFavorites = new Set(favorites);
        const isAdding = !newFavorites.has(sitterId);

        if (isAdding) {
            newFavorites.add(sitterId);
        } else {
            newFavorites.delete(sitterId);
        }

        setFavorites(newFavorites);

        try {
            if (isAdding) {
                const { error } = await supabase
                    .from("favorites")
                    .insert({
                        parent_id: user.id,
                        sitter_id: sitterId,
                    });

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("favorites")
                    .delete()
                    .match({
                        parent_id: user.id,
                        sitter_id: sitterId,
                    });

                if (error) throw error;
            }

            toast({
                title: isAdding ? "Favorilere eklendi" : "Favorilerden çıkarıldı",
                description: isAdding
                    ? "Bakıcı favorilerinize eklendi"
                    : "Bakıcı favorilerinizden çıkarıldı",
            });
        } catch (error) {
            console.error("Error toggling favorite:", error);

            // Revert on error
            setFavorites(favorites);

            toast({
                title: "Hata",
                description: "Bir sorun oluştu. Lütfen tekrar deneyin.",
                variant: "destructive",
            });
        }
    };

    const isFavorite = (sitterId: string) => favorites.has(sitterId);

    return {
        favorites: Array.from(favorites),
        isLoading,
        toggleFavorite,
        isFavorite,
        count: favorites.size,
    };
}
