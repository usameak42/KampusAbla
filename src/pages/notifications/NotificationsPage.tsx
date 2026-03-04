/**
 * NotificationsPage - Full notification center page
 */

import { useState } from "react";
import { ArrowLeft, Bell, Settings, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { NotificationsList } from "@/components/notifications";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationsContext } from "@/contexts/NotificationContext";
import { useAuthentication } from "@/hooks/useAuthentication";

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { user } = useAuthentication();
    const { permissionStatus, requestPermission, isSupported } = useNotificationsContext();
    const currentUserId = user?.id || "";

    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        clearAll,
    } = useNotifications({ userId: currentUserId });

    const [showClearDialog, setShowClearDialog] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-white">
            <div className="container max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold flex items-center gap-2">
                                <Bell className="h-5 w-5 text-blue-500" />
                                Bildirimler
                                {unreadCount > 0 && (
                                    <span className="text-sm font-normal text-muted-foreground">
                                        ({unreadCount} okunmamış)
                                    </span>
                                )}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Tüm bildirimlerinizi görüntüleyin
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate("/settings/notifications")}
                            title="Bildirim Ayarları"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                        {notifications.length > 0 && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowClearDialog(true)}
                                title="Tümünü Temizle"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Push Notification Banner */}
                {isSupported && permissionStatus === "default" && (
                    <Card className="mb-6 border-blue-200 bg-blue-50/50">
                        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Hiçbir randevuyu kaçırmayın!</p>
                                    <p className="text-xs text-muted-foreground">Anlık bildirimleri etkinleştirerek güncellemelerden anında haberdar olun.</p>
                                </div>
                            </div>
                            <Button size="sm" onClick={requestPermission} className="whitespace-nowrap">
                                Etkinleştir
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Notifications List */}
                <Card>
                    <CardContent className="p-4 md:p-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                                ))}
                            </div>
                        ) : (
                            <NotificationsList
                                notifications={notifications}
                                onMarkAsRead={markAsRead}
                                onMarkAsUnread={markAsUnread}
                                onDelete={deleteNotification}
                                onMarkAllAsRead={markAllAsRead}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Stats Card */}
                {notifications.length > 0 && (
                    <Card className="mt-4">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-semibold text-blue-600">
                                        {notifications.length}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Toplam</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold text-purple-600">
                                        {unreadCount}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Okunmamış</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold text-green-600">
                                        {notifications.length - unreadCount}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Okunmuş</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Clear All Confirmation */}
            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tüm Bildirimleri Temizle</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem tüm bildirimlerinizi arşivleyecektir. Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={clearAll}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Temizle
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
