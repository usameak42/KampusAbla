/**
 * My Need Posts Page - Parents view and manage their need posts
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NeedPostList } from "@/components/need-posts/NeedPostList";
import { CreateNeedPost, type NeedPostFormData } from "@/components/need-posts/CreateNeedPost";
import { useNeedPosts } from "@/hooks/useNeedPosts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Plus, FileText, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock children data - would come from user context
const MOCK_CHILDREN = [
    { id: "child-1", name: "Ali", age: 5 },
    { id: "child-2", name: "Elif", age: 8 },
    { id: "child-3", name: "Mehmet", age: 3 },
];

export default function MyNeedPosts() {
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("open");

    const {
        needPosts,
        allNeedPosts,
        isLoading,
        createNeedPost,
        cancelNeedPost,
        refreshPosts,
    } = useNeedPosts({
        userId: "parent-1", // Would come from auth context
        viewMode: "parent"
    });

    // Filter posts by status for tabs
    const openPosts = allNeedPosts.filter(p => p.status === "open" && p.parentId === "parent-1");
    const matchedPosts = allNeedPosts.filter(p => p.status === "matched" && p.parentId === "parent-1");
    const closedPosts = allNeedPosts.filter(p =>
        (p.status === "cancelled" || p.status === "expired") && p.parentId === "parent-1"
    );

    const navigate = useNavigate();

    // ... (rest of hook usage)

    const handleCreatePost = async (data: NeedPostFormData) => {
        try {
            await createNeedPost(data);
            toast({
                title: "İlan Yayınlandı! ✓",
                description: "İlanınız artık bakıcılar tarafından görülebilir.",
            });
            setIsCreateOpen(false);
        } catch {
            toast({
                title: "Hata",
                description: "İlan oluşturulamadı. Lütfen tekrar deneyin.",
                variant: "destructive",
            });
        }
    };

    const handleViewApplications = (needPostId: string) => {
        navigate(`/my-needs/${needPostId}/applications`);
    };

    const handleEditPost = (needPostId: string) => {
        // TODO: Open edit modal
        toast({
            title: "Düzenleme",
            description: "Düzenleme özelliği yakında eklenecek.",
        });
    };

    const handleCancelPost = async (needPostId: string) => {
        if (!window.confirm("Bu ilanı iptal etmek istediğinize emin misiniz?")) return;

        try {
            await cancelNeedPost(needPostId);
            toast({
                title: "İlan İptal Edildi",
                description: "İlanınız başarıyla iptal edildi.",
            });
        } catch {
            toast({
                title: "Hata",
                description: "İlan iptal edilemedi.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">İlanlarım</h1>
                    <p className="text-muted-foreground">
                        İhtiyaç ilanlarınızı yönetin ve başvuruları inceleyin
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={refreshPosts}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Yenile
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni İlan
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveTab("open")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Açık İlanlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-green-500" />
                            <span className="text-2xl font-bold">{openPosts.length}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveTab("matched")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Eşleşmiş
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                            <span className="text-2xl font-bold">{matchedPosts.length}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveTab("closed")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Kapatılmış
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-gray-400" />
                            <span className="text-2xl font-bold">{closedPosts.length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="open" className="gap-2">
                        Açık
                        {openPosts.length > 0 && (
                            <Badge variant="secondary">{openPosts.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="matched" className="gap-2">
                        Eşleşmiş
                        {matchedPosts.length > 0 && (
                            <Badge variant="secondary">{matchedPosts.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="closed" className="gap-2">
                        Kapatılmış
                        {closedPosts.length > 0 && (
                            <Badge variant="secondary">{closedPosts.length}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="open" className="mt-4">
                    {openPosts.length === 0 ? (
                        <Card className="p-8 text-center">
                            <div className="text-4xl mb-4">📝</div>
                            <h3 className="text-lg font-semibold mb-2">Henüz Açık İlan Yok</h3>
                            <p className="text-muted-foreground mb-4">
                                İhtiyacınızı paylaşarak bakıcılardan başvuru alın
                            </p>
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                İlk İlanı Oluştur
                            </Button>
                        </Card>
                    ) : (
                        <NeedPostList
                            needPosts={openPosts}
                            viewMode="parent"
                            onViewApplications={handleViewApplications}
                            onEdit={handleEditPost}
                            onCancel={handleCancelPost}
                            isLoading={isLoading}
                        />
                    )}
                </TabsContent>

                <TabsContent value="matched" className="mt-4">
                    {matchedPosts.length === 0 ? (
                        <Card className="p-8 text-center">
                            <div className="text-4xl mb-4">🎯</div>
                            <h3 className="text-lg font-semibold mb-2">Henüz Eşleşme Yok</h3>
                            <p className="text-muted-foreground">
                                Başvuruları kabul ettiğinizde ilanlar burada görünür
                            </p>
                        </Card>
                    ) : (
                        <NeedPostList
                            needPosts={matchedPosts}
                            viewMode="parent"
                            isLoading={isLoading}
                        />
                    )}
                </TabsContent>

                <TabsContent value="closed" className="mt-4">
                    {closedPosts.length === 0 ? (
                        <Card className="p-8 text-center">
                            <div className="text-4xl mb-4">📦</div>
                            <h3 className="text-lg font-semibold mb-2">Kapatılmış İlan Yok</h3>
                            <p className="text-muted-foreground">
                                İptal veya süresi dolmuş ilanlar burada görünür
                            </p>
                        </Card>
                    ) : (
                        <NeedPostList
                            needPosts={closedPosts}
                            viewMode="parent"
                            isLoading={isLoading}
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Create Need Post Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Yeni İhtiyaç İlanı</DialogTitle>
                        <DialogDescription>
                            Bakıcı ihtiyacınızı detaylı açıklayın
                        </DialogDescription>
                    </DialogHeader>
                    <CreateNeedPost
                        children={MOCK_CHILDREN}
                        onSubmit={handleCreatePost}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
