import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CreateSitterPost } from "@/components/sitter-posts/CreateSitterPost";
import { Plus, Calendar, Clock, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SitterPost {
    id: string;
    title: string;
    description: string | null;
    available_date: string;
    start_time: string;
    duration_hours: number;
    hourly_rate: number;
    status: string;
    created_at: string;
}

export default function MySitterPosts() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [posts, setPosts] = useState<SitterPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchPosts();
        }
    }, [user]);

    const fetchPosts = async () => {
        try {
            // First get sitter ID
            const { data: sitterData } = await supabase
                .from("sitters")
                .select("id")
                .eq("user_id", user?.id)
                .single();

            if (!sitterData) return;

            const { data, error } = await (supabase as any)
                .from("sitter_posts")
                .select("*")
                .eq("sitter_id", sitterData.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setPosts((data as SitterPost[]) || []);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (postId: string) => {
        try {
            const { error } = await (supabase as any)
                .from("sitter_posts")
                .delete()
                .eq("id", postId);

            if (error) throw error;

            setPosts(posts.filter(post => post.id !== postId));
            toast({
                title: "İlan Silindi",
                description: "İlan başarıyla kaldırıldı.",
            });
        } catch (error) {
            toast({
                title: "Hata",
                description: "İlan silinirken bir sorun oluştu.",
                variant: "destructive",
            });
        }
    };

    return (
        <AppLayout>
            <div className="container mx-auto py-8 max-w-5xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">İlanlarım</h1>
                        <p className="text-muted-foreground mt-2">
                            Oluşturduğunuz iş ilanlarını yönetin
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Yeni İlan Oluştur
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Yeni İlan Oluştur</DialogTitle>
                                <DialogDescription>
                                    Müsaitlik durumunuza göre yeni bir iş ilanı yayınlayın.
                                </DialogDescription>
                            </DialogHeader>
                            <CreateSitterPost onSuccess={() => {
                                setIsCreateOpen(false);
                                fetchPosts();
                            }} />
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div>Yükleniyor...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                        <h3 className="text-lg font-medium">Henüz İlanınız Yok</h3>
                        <p className="text-muted-foreground mt-2 mb-6">
                            İlk ilanınızı oluşturarak ailelerin size ulaşmasını sağlayın.
                        </p>
                        <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                            İlan Oluştur
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <Card key={post.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl line-clamp-1">{post.title}</CardTitle>
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${post.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {post.status === 'open' ? 'Aktif' : 'Kapalı'}
                                        </div>
                                    </div>
                                    <CardDescription className="line-clamp-2">
                                        {post.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 flex-grow">
                                    <div className="flex items-center text-sm">
                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {format(new Date(post.available_date), "d MMMM yyyy", { locale: tr })}
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {post.start_time} ({post.duration_hours} Saat)
                                    </div>
                                    <div className="font-semibold text-primary">
                                        {post.hourly_rate} TL / Saat
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-4 border-t flex justify-end gap-2">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Sil
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>İlanı silmek istediğinize emin misiniz?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Bu işlem geri alınamaz. İlan kalıcı olarak silinecektir.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(post.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Sil
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
