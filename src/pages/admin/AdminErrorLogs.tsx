/**
 * Admin Error Logs Dashboard - View client-side error reports
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, RefreshCw, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ErrorLog {
    id: string;
    userId: string | null;
    errorMessage: string;
    stackTrace: string | null;
    pageUrl: string | null;
    userAgent: string | null;
    createdAt: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function AdminErrorLogs() {
    const { toast } = useToast();
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("error_logs" as any)
                .select("*")
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) throw error;

            setLogs(
                (data || []).map((item: any) => ({
                    id: item.id,
                    userId: item.user_id,
                    errorMessage: item.error_message,
                    stackTrace: item.stack_trace,
                    pageUrl: item.page_url,
                    userAgent: item.user_agent,
                    createdAt: item.created_at,
                }))
            );
        } catch (error) {
            console.error("Error fetching error logs:", error);
            toast({
                title: "Hata",
                description: "Hata kayıtları yüklenemedi",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredLogs = logs.filter(
        (log) =>
            log.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.pageUrl ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.userId ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
            <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <div>
                            <h1 className="text-2xl font-bold">Hata Kayıtları</h1>
                            <p className="text-muted-foreground text-sm">
                                Kullanıcıların bildirdiği istemci tarafı hatalar
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchLogs}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Yenile
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <p className="text-sm text-muted-foreground">Toplam Hata</p>
                            <p className="text-2xl font-bold">{logs.length}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <p className="text-sm text-muted-foreground">Son 24 Saat</p>
                            <p className="text-2xl font-bold">
                                {logs.filter(l => new Date(l.createdAt) > new Date(Date.now() - ONE_DAY_MS)).length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <p className="text-sm text-muted-foreground">Eşsiz Kullanıcı</p>
                            <p className="text-2xl font-bold">
                                {new Set(logs.map(l => l.userId).filter(Boolean)).size}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Hata mesajı veya URL ile ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Error Logs List */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Hata Listesi
                            {filteredLogs.length !== logs.length && (
                                <Badge variant="secondary" className="ml-2">
                                    {filteredLogs.length} / {logs.length}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                {searchQuery ? "Arama sonucu bulunamadı" : "Hata kaydı bulunmuyor"}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {filteredLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="border rounded-lg p-4 space-y-2 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-red-700 truncate">
                                                    {log.errorMessage}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                                    <span>
                                                        {format(new Date(log.createdAt), "d MMM yyyy HH:mm")}
                                                    </span>
                                                    {log.pageUrl && (
                                                        <span className="truncate max-w-xs">📍 {log.pageUrl}</span>
                                                    )}
                                                    {log.userId && (
                                                        <span className="truncate max-w-xs">👤 {log.userId}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                            >
                                                {expandedId === log.id ? "Gizle" : "Detay"}
                                            </Button>
                                        </div>

                                        {expandedId === log.id && log.stackTrace && (
                                            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto text-gray-700 whitespace-pre-wrap">
                                                {log.stackTrace}
                                            </pre>
                                        )}
                                        {expandedId === log.id && log.userAgent && (
                                            <p className="text-xs text-muted-foreground">
                                                <strong>User Agent:</strong> {log.userAgent}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
