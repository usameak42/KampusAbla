/**
 * Browse Needs Page - Sitters browse and apply to parent need posts
 */

import { useState } from "react";
import { NeedPostList } from "@/components/need-posts/NeedPostList";
import { ApplicationModal } from "@/components/need-posts/ApplicationModal";
import { useNeedPosts } from "@/hooks/useNeedPosts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, FileText, Send, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { NeedPost } from "@/components/need-posts/NeedPostCard";

export default function BrowseNeeds() {
    const { toast } = useToast();
    const [selectedPost, setSelectedPost] = useState<NeedPost | null>(null);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

    const {
        needPosts,
        appliedPostIds,
        isLoading,
        stats,
        applyToNeedPost,
        refreshPosts,
    } = useNeedPosts({ viewMode: "sitter" });

    const handleApply = (needPostId: string) => {
        const post = needPosts.find((p) => p.id === needPostId);
        if (post) {
            setSelectedPost(post);
            setIsApplicationModalOpen(true);
        }
    };

    const handleSubmitApplication = async (message: string, proposedRate?: number) => {
        if (!selectedPost) return;

        try {
            await applyToNeedPost(selectedPost.id, message, proposedRate);
            toast({
                title: "Başvuru Gönderildi! ✓",
                description: "Başvurunuz aileye iletildi. Yanıt bekleyin.",
            });
            setIsApplicationModalOpen(false);
            setSelectedPost(null);
        } catch {
            toast({
                title: "Hata",
                description: "Başvuru gönderilemedi. Lütfen tekrar deneyin.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">İlanları Keşfet</h1>
                    <p className="text-muted-foreground">
                        Ailelerin ihtiyaçlarını inceleyin ve başvurun
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={refreshPosts}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Yenile
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Açık İlanlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">{stats.openPosts}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Başvurularım
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-blue-500" />
                            <span className="text-2xl font-bold">{stats.myApplications}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Kabul Oranı
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <span className="text-2xl font-bold">—</span>
                            <Badge variant="secondary">Yakında</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Need Posts List */}
            <NeedPostList
                needPosts={needPosts}
                viewMode="sitter"
                onApply={handleApply}
                appliedPostIds={appliedPostIds}
                isLoading={isLoading}
            />

            {/* Application Modal */}
            {selectedPost && (
                <ApplicationModal
                    isOpen={isApplicationModalOpen}
                    onClose={() => {
                        setIsApplicationModalOpen(false);
                        setSelectedPost(null);
                    }}
                    needPost={selectedPost}
                    onSubmit={handleSubmitApplication}
                />
            )}
        </div>
    );
}
