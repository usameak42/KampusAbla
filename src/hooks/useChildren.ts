import { useState, useCallback, useEffect } from "react";
import type { Child, Allergy } from "@/types/child";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { childSchema } from "@/schemas/validation";

interface UseChildrenOptions {
    parentId?: string;
}

export function useChildren({ parentId }: UseChildrenOptions = {}) {
    const [children, setChildren] = useState<Child[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchChildren = useCallback(async () => {
        if (!parentId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from("children")
                .select("*")
                .eq("parent_id", parentId);

            if (fetchError) throw fetchError;

            if (data) {
                const transformedChildren: Child[] = data.map((item) => ({
                    id: item.id,
                    parentId: item.parent_id,
                    name: item.name,
                    dateOfBirth: new Date(item.birth_date || item.created_at),
                    gender: (item.gender as "male" | "female" | "other") || "other",
                    grade: "1", // Default grade since DB doesn't store this yet
                    languages: ["turkish"], // Default language
                    allergies: typeof item.allergies === 'string' ? JSON.parse(item.allergies || '[]') : (item.allergies || []),
                    dietaryRestrictions: [] as string[],
                    medicalConditions: item.special_needs ? [item.special_needs] : [],
                    interests: [] as string[],
                    notes: item.notes || "",
                    createdAt: new Date(item.created_at),
                    updatedAt: new Date(item.updated_at),
                }));
                setChildren(transformedChildren);
            }
        } catch (err) {
            console.error("Error fetching children:", err);
            setError(err instanceof Error ? err.message : "Çocuklar yüklenemedi");
        } finally {
            setIsLoading(false);
        }
    }, [parentId]);

    useEffect(() => {
        fetchChildren();
    }, [fetchChildren]);

    // Add a child
    const addChild = useCallback(
        async (data: Omit<Child, "id" | "parentId" | "createdAt" | "updatedAt">): Promise<Child> => {
            if (!parentId) throw new Error("Parent ID required");

            // Validate data
            const validation = childSchema.safeParse(data);
            if (!validation.success) {
                throw new Error(validation.error.errors[0].message);
            }

            setIsLoading(true);
            setError(null);

            try {
                const { data: newChildData, error: insertError } = await supabase
                    .from("children")
                    .insert({
                        parent_id: parentId,
                        name: data.name,
                        birth_date: data.dateOfBirth.toISOString().split('T')[0],
                        gender: data.gender,
                        allergies: JSON.stringify(data.allergies),
                        notes: data.notes,
                        // Mapping some fields to special_needs or notes as placeholders if DB doesn't have them
                        special_needs: data.medicalConditions.join(", "),
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                const newChild: Child = {
                    ...data,
                    id: newChildData.id,
                    parentId: newChildData.parent_id,
                    createdAt: new Date(newChildData.created_at),
                    updatedAt: new Date(newChildData.updated_at),
                };

                setChildren((prev) => [...prev, newChild]);
                return newChild;
            } catch (err) {
                console.error("Error adding child:", err);
                setError(err instanceof Error ? err.message : "Çocuk eklenemedi");
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [parentId]
    );

    // Update a child
    const updateChild = useCallback(
        async (childId: string, data: Partial<Child>): Promise<Child> => {
            // Validate partial data
            if (data.name || data.dateOfBirth || data.gender || data.notes) {
                const validation = childSchema.partial().safeParse(data);
                if (!validation.success) {
                    throw new Error(validation.error.errors[0].message);
                }
            }

            setIsLoading(true);
            setError(null);

            try {
                const updateData: Database['public']['Tables']['children']['Update'] = {};
                if (data.name) updateData.name = data.name;
                if (data.dateOfBirth) updateData.birth_date = data.dateOfBirth.toISOString().split('T')[0];
                if (data.gender) updateData.gender = data.gender;
                if (data.allergies) updateData.allergies = JSON.stringify(data.allergies);
                if (data.notes) updateData.notes = data.notes;
                if (data.medicalConditions) updateData.special_needs = data.medicalConditions.join(", ");

                const { data: updatedChildData, error: updateError } = await supabase
                    .from("children")
                    .update(updateData)
                    .eq("id", childId)
                    .select()
                    .single();

                if (updateError) throw updateError;

                const transformedChild: Child = {
                    ...children.find(c => c.id === childId)!,
                    ...data,
                    id: updatedChildData.id,
                    parentId: updatedChildData.parent_id,
                    updatedAt: new Date(updatedChildData.updated_at),
                };

                setChildren((prev) =>
                    prev.map((c) => (c.id === childId ? transformedChild : c))
                );

                return transformedChild;
            } catch (err) {
                console.error("Error updating child:", err);
                setError(err instanceof Error ? err.message : "Çocuk bilgileri güncellenemedi");
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [children]
    );

    // Delete a child
    const deleteChild = useCallback(async (childId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from("children")
                .delete()
                .eq("id", childId);

            if (deleteError) throw deleteError;

            setChildren((prev) => prev.filter((c) => c.id !== childId));
        } catch (err) {
            console.error("Error deleting child:", err);
            setError(err instanceof Error ? err.message : "Çocuk silinemedi");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get a single child
    const getChild = useCallback(
        (childId: string): Child | undefined => {
            return children.find((c) => c.id === childId);
        },
        [children]
    );

    // Update allergies
    const updateAllergies = useCallback(
        async (childId: string, allergies: Allergy[]): Promise<void> => {
            await updateChild(childId, { allergies });
        },
        [updateChild]
    );

    return {
        children,
        isLoading,
        error,
        getChild,
        addChild,
        updateChild,
        deleteChild,
        updateAllergies,
        refreshChildren: fetchChildren,
    };
}
