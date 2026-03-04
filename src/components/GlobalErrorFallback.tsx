import React from "react";
import * as Sentry from "@sentry/react";
import { AlertCircle, WifiOff, Lock, RefreshCw, Home, LogOut, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface GlobalErrorFallbackProps {
    error: unknown;
    resetError: () => void;
}

export function GlobalErrorFallback({ error, resetError }: GlobalErrorFallbackProps) {
    // Safe error object
    const errorObj = error instanceof Error ? error : new Error(String(error || "Unknown error"));

    // Error Classification
    const isNetworkError =
        errorObj.message.toLowerCase().includes("fetch") ||
        errorObj.message.toLowerCase().includes("network") ||
        errorObj.message.toLowerCase().includes("connection") ||
        errorObj.message.toLowerCase().includes("offline");

    const isAuthError =
        errorObj.message.toLowerCase().includes("401") ||
        errorObj.message.toLowerCase().includes("403") ||
        errorObj.message.toLowerCase().includes("unauthorized") ||
        errorObj.message.toLowerCase().includes("forbidden") ||
        errorObj.message.toLowerCase().includes("jwt") ||
        errorObj.message.toLowerCase().includes("token");

    const getErrorContent = () => {
        if (isNetworkError) {
            return {
                icon: <WifiOff className="h-12 w-12 text-blue-500 mb-4" />,
                title: "Bağlantı Hatası",
                description: "İnternet bağlantınızda bir sorun var gibi görünüyor. Lütfen bağlantınızı kontrol edip tekrar deneyin.",
                actionLabel: "Tekrar Dene",
                action: resetError,
            };
        }
        if (isAuthError) {
            return {
                icon: <Lock className="h-12 w-12 text-orange-500 mb-4" />,
                title: "Erişim Hatası",
                description: "Oturumunuzun süresi dolmuş veya bu sayfaya erişim yetkiniz yok olabilir. Lütfen tekrar giriş yapın.",
                actionLabel: "Giriş Yap",
                action: () => {
                    // Clear any stale auth tokens if possible, though strict implementation usually handles this differently
                    window.location.href = "/login";
                },
            };
        }
        return {
            icon: <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />,
            title: "Beklenmeyen Bir Hata",
            description: "Üzgünüz, bir şeyler yanlış gitti. Teknik ekibimiz durumdan haberdar edildi.",
            actionLabel: "Yeniden Dene",
            action: resetError,
        };
    };

    const content = getErrorContent();

    const handleReport = () => {
        const eventId = Sentry.lastEventId();
        if (eventId) {
            Sentry.showReportDialog({ eventId, lang: 'tr' });
        } else {
            // Fallback if no Sentry event ID
            const subject = encodeURIComponent(`Hata Bildirimi: ${errorObj.name}`);
            const body = encodeURIComponent(`Hata Detayı: ${errorObj.message}\nURL: ${window.location.href}\nUserAgent: ${navigator.userAgent}`);
            window.location.href = `mailto:support@kampusabla.com?subject=${subject}&body=${body}`;
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full shadow-lg border-red-50">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center">
                        {content.icon}
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                        {content.title}
                    </CardTitle>
                    <CardDescription className="text-center pt-2">
                        {content.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Developer Details - Only visible in dev or if explicitly enabled */}
                    {import.meta.env.DEV && (
                        <div className="bg-gray-100 p-3 rounded-md text-xs font-mono text-red-700 overflow-auto max-h-32 border border-gray-200">
                            <p className="font-bold mb-1">{errorObj.name}</p>
                            {errorObj.message}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button
                        onClick={content.action}
                        className="w-full bg-blue-600 hover:bg-blue-700 space-x-2"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {content.actionLabel}
                    </Button>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button variant="outline" onClick={() => window.location.href = '/'}>
                            <Home className="h-4 w-4 mr-2" />
                            Ana Sayfa
                        </Button>

                        <Button variant="outline" onClick={handleReport}>
                            <Mail className="h-4 w-4 mr-2" />
                            Sorun Bildir
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
