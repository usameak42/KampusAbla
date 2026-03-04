/**
 * Notifications Page - View all notifications
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    MessageSquare,
    DollarSign,
    Star,
    CheckCheck,
    Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Notifications() {
    // TODO: Fetch from Supabase
    const notifications = [
        {
            id: 1,
            type: "booking",
            title: "Yeni Rezervasyon",
            message: "Ayşe Yılmaz'dan yeni bir rezervasyon aldınız.",
            time: "5 dakika önce",
            read: false,
            icon: Calendar,
            iconColor: "text-blue-600",
            iconBg: "bg-blue-100",
        },
        {
            id: 2,
            type: "message",
            title: "Yeni Mesaj",
            message: "Fatma Kaya size mesaj gönderdi.",
            time: "1 saat önce",
            read: false,
            icon: MessageSquare,
            iconColor: "text-green-600",
            iconBg: "bg-green-100",
        },
        {
            id: 3,
            type: "payment",
            title: "Ödeme Alındı",
            message: "₺150 tutarında ödeme hesabınıza yatırıldı.",
            time: "3 saat önce",
            read: true,
            icon: DollarSign,
            iconColor: "text-purple-600",
            iconBg: "bg-purple-100",
        },
        {
            id: 4,
            type: "review",
            title: "Yeni Değerlendirme",
            message: "Ahmet Yılmaz size 5 yıldız verdi!",
            time: "1 gün önce",
            read: true,
            icon: Star,
            iconColor: "text-yellow-600",
            iconBg: "bg-yellow-100",
        },
    ];

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllAsRead = () => {
        // TODO: Mark all as read in Supabase
        console.log("Marking all as read");
    };

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Bildirimler</h1>
                        {unreadCount > 0 && (
                            <p className="text-muted-foreground mt-1">
                                {unreadCount} okunmamış bildirim
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Tümünü Okundu İşaretle
                        </Button>
                    )}
                </div>

                <Tabs defaultValue="all" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="all">
                            Tümü ({notifications.length})
                        </TabsTrigger>
                        <TabsTrigger value="unread">
                            Okunmamış ({unreadCount})
                        </TabsTrigger>
                        <TabsTrigger value="bookings">Rezervasyonlar</TabsTrigger>
                        <TabsTrigger value="messages">Mesajlar</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-3">
                        {notifications.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-lg font-semibold mb-2">Bildirim Yok</p>
                                    <p className="text-sm text-muted-foreground">
                                        Henüz herhangi bir bildiriminiz bulunmuyor.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            notifications.map((notification) => {
                                const Icon = notification.icon;
                                return (
                                    <Card
                                        key={notification.id}
                                        className={cn(
                                            "cursor-pointer transition-all hover:shadow-md",
                                            !notification.read && "border-l-4 border-l-blue-500 bg-blue-50/30"
                                        )}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <div className={cn("rounded-lg p-3", notification.iconBg)}>
                                                    <Icon className={cn("h-5 w-5", notification.iconColor)} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <p className="font-semibold">{notification.title}</p>
                                                        {!notification.read && (
                                                            <Badge variant="secondary" className="shrink-0">
                                                                Yeni
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {notification.time}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </TabsContent>

                    <TabsContent value="unread" className="space-y-3">
                        {notifications.filter((n) => !n.read).length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <CheckCheck className="h-12 w-12 mx-auto text-green-600 mb-4" />
                                    <p className="text-lg font-semibold mb-2">Hepsi Okundu!</p>
                                    <p className="text-sm text-muted-foreground">
                                        Tüm bildirimlerinizi okudunuz.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            notifications
                                .filter((n) => !n.read)
                                .map((notification) => {
                                    const Icon = notification.icon;
                                    return (
                                        <Card key={notification.id} className="border-l-4 border-l-blue-500">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-4">
                                                    <div className={cn("rounded-lg p-3", notification.iconBg)}>
                                                        <Icon className={cn("h-5 w-5", notification.iconColor)} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold mb-1">{notification.title}</p>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {notification.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                        )}
                    </TabsContent>

                    <TabsContent value="bookings">
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                Rezervasyon bildirimleri burada görünecek
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="messages">
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                Mesaj bildirimleri burada görünecek
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
