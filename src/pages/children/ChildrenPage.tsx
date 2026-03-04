/**
 * ChildrenPage - Children management page
 */

import { useState, useCallback } from "react";
import { ArrowLeft, Users, Plus, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChildrenList, AddChildForm } from "@/components/children";
import { useChildren } from "@/hooks/useChildren";
import type { Child } from "@/types/child";

export default function ChildrenPage() {
    const navigate = useNavigate();

    // Mock current user (in production get from auth context)
    const currentUserId = "parent-1";

    const {
        children,
        isLoading,
        error,
        addChild,
        updateChild,
        deleteChild,
    } = useChildren({ parentId: currentUserId });

    // Modal states
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [viewingChild, setViewingChild] = useState<Child | null>(null);
    const [deletingChildId, setDeletingChildId] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const handleAddChild = useCallback(async (data: Omit<Child, "id" | "parentId" | "createdAt" | "updatedAt">) => {
        setFormError(null);
        try {
            await addChild(data);
            setShowAddForm(false);
        } catch (err) {
            setFormError("Çocuk eklenemedi. Lütfen tekrar deneyin.");
        }
    }, [addChild]);

    const handleUpdateChild = useCallback(async (data: Omit<Child, "id" | "parentId" | "createdAt" | "updatedAt">) => {
        if (!editingChild) return;
        setFormError(null);
        try {
            await updateChild(editingChild.id, data);
            setEditingChild(null);
        } catch (err) {
            setFormError("Çocuk bilgileri güncellenemedi.");
        }
    }, [editingChild, updateChild]);

    const handleDeleteChild = useCallback(async () => {
        if (!deletingChildId) return;
        try {
            await deleteChild(deletingChildId);
            setDeletingChildId(null);
        } catch (err) {
            // Error handled in hook
        }
    }, [deletingChildId, deleteChild]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-white">
            <div className="container max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-500" />
                            Çocuklarım
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Çocuklarınızın profillerini yönetin
                        </p>
                    </div>
                </div>

                {/* Children List */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Kayıtlı Çocuklar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChildrenList
                            children={children}
                            isLoading={isLoading}
                            onAddChild={() => setShowAddForm(true)}
                            onEditChild={(child) => setEditingChild(child)}
                            onDeleteChild={(id) => setDeletingChildId(id)}
                            onViewChild={(child) => setViewingChild(child)}
                        />
                    </CardContent>
                </Card>

                {/* Quick Actions */}

            </div>

            {/* Add Child Dialog */}
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Yeni Çocuk Ekle</DialogTitle>
                    </DialogHeader>
                    <AddChildForm
                        onSubmit={handleAddChild}
                        onCancel={() => setShowAddForm(false)}
                        isLoading={isLoading}
                        error={formError}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Child Dialog */}
            <Dialog open={!!editingChild} onOpenChange={() => setEditingChild(null)}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Çocuk Bilgilerini Düzenle</DialogTitle>
                    </DialogHeader>
                    {editingChild && (
                        <AddChildForm
                            child={editingChild}
                            onSubmit={handleUpdateChild}
                            onCancel={() => setEditingChild(null)}
                            isLoading={isLoading}
                            error={formError}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* View Child Dialog */}
            <Dialog open={!!viewingChild} onOpenChange={() => setViewingChild(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{viewingChild?.name}</DialogTitle>
                    </DialogHeader>
                    {viewingChild && (
                        <Tabs defaultValue="info" className="mt-4">
                            <TabsList className="grid w-full grid-cols-1">
                                <TabsTrigger value="info">Bilgiler</TabsTrigger>
                            </TabsList>
                            <TabsContent value="info" className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Sınıf</p>
                                        <p className="font-medium">{viewingChild.grade}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Okul</p>
                                        <p className="font-medium">{viewingChild.schoolName || "-"}</p>
                                    </div>
                                </div>
                                {viewingChild.allergies.length > 0 && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Alerjiler</p>
                                        <div className="space-y-1">
                                            {viewingChild.allergies.map((a, i) => (
                                                <p key={i} className="text-sm">
                                                    • {a.details} ({a.severity})
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {viewingChild.notes && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Notlar</p>
                                        <p className="text-sm">{viewingChild.notes}</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingChildId} onOpenChange={() => setDeletingChildId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Çocuğu Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem geri alınamaz. Çocuk profili kalıcı olarak silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteChild}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
