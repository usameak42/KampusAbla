/**
 * Active Session Page - Live session view for both parent and sitter
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SessionStatusControls } from "@/components/session/SessionStatusControls";
import { SessionTimer } from "@/components/session/SessionTimer";
import { EmergencyContacts } from "@/components/session/EmergencyContacts";
import { useSession } from "@/hooks/useSession";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Users,
    MessageSquare,
    Phone,
    FileText,
    ChevronLeft,
    RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STATUS_INFO, type SessionStatus } from "@/types/session";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function ActiveSession() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { user } = useAuth();
    const { session, isLoading, updateStatus, refreshSession, confirmHandover } = useSession({ sessionId });

    // Determine view mode based on user role
    const viewMode: "parent" | "sitter" = user?.user_metadata?.role === "sitter" ? "sitter" : "parent";

    // GPS Tracking — auto-starts when session is active; exposes error state for the UI
    const isSessionActive = !!(session && (["started", "picked_up", "arrived"] as string[]).includes(session.currentStatus));
    const { trackingError } = useSessionTracking({
        sessionId: sessionId ?? null,
        isActive: isSessionActive,
    });

    if (!session) {
        return (
            <div className="container mx-auto py-12 text-center">
                <p className="text-muted-foreground">Aktif oturum bulunamadı</p>
                <Button variant="link" onClick={() => navigate("/bookings")}>
                    Randevulara Dön
                </Button>
            </div>
        );
    }

    const handleCall = (phone: string) => {
        window.location.href = `tel:${phone}`;
    };

    const handleMessage = () => {
        toast({
            title: "Mesaj",
            description: "Mesajlaşma özelliği yakında eklenecek.",
        });
    };

    const handleStatusChange = async (newStatus: SessionStatus, note?: string) => {
        try {
            await updateStatus(newStatus, note);
            toast({
                title: "Durum Güncellendi ✓",
                description: `Durum: ${STATUS_INFO[newStatus].label}`,
            });

            if (newStatus === "completed") {
                navigate("/bookings");
            }
        } catch {
            toast({
                title: "Hata",
                description: "Durum güncellenemedi.",
                variant: "destructive",
            });
        }
    };

    const otherPerson = viewMode === "sitter"
        ? { name: session.parentName, phone: session.parentPhone }
        : { name: session.sitterName, phone: session.sitterPhone };

    const statusInfo = STATUS_INFO[session.currentStatus];

    return (
        <div className="container mx-auto py-6 space-y-6 pb-24">
            {/* GPS Tracking Error Alert */}
            {trackingError && (
                <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                        <strong>Konum Takibi Devre Dışı:</strong> GPS takibi başlatılamadı.
                        Konum izninizi kontrol edin — ebeveyn canlı konumunuzu göremeyebilir.
                    </AlertDescription>
                </Alert>
            )}
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">Aktif Oturum</h1>
                        <Badge className={statusInfo.color.replace("text-", "bg-").replace("-500", "-100")}>
                            {statusInfo.emoji} {statusInfo.label}
                        </Badge>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={refreshSession}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Session Info */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Timer */}
                    {session.actualStart && (
                        <SessionTimer
                            startTime={session.actualStart}
                            scheduledEnd={session.scheduledEnd}
                            isActive={session.currentStatus === "in-progress"}
                        />
                    )}

                    {/* Person Info */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback>
                                            {otherPerson.name.split(" ").map(n => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{otherPerson.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {viewMode === "sitter" ? "Ebeveyn" : "Bakıcı"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" onClick={handleMessage}>
                                        <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" onClick={() => handleCall(otherPerson.phone)}>
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Children Info */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Çocuklar
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {session.childrenNames.map((name, i) => (
                                    <Badge key={name} variant="outline" className="py-1 px-3">
                                        {/* Age-based emoji logic */}
                                        {((age) => {
                                            if (age < 3) return "👶";
                                            if (age < 7) return "🧒";
                                            if (age < 13) return "👦";
                                            return "🧑";
                                        })(session.childrenAges[i])} {name} ({session.childrenAges[i]} yaş)
                                    </Badge>
                                ))}
                            </div>
                            {session.parentNotes && (
                                <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                                    <p className="text-sm text-orange-700">
                                        <span className="font-medium">Not:</span> {session.parentNotes}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Konum
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{session.address}</p>
                            <p className="text-sm text-muted-foreground">{session.district}</p>
                            <Button variant="outline" className="mt-3 w-full" size="sm">
                                <MapPin className="h-4 w-4 mr-2" />
                                Haritada Göster
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Controls */}
                <div className="space-y-4">
                    {/* Status Controls (sitter only) */}
                    <SessionStatusControls
                        currentStatus={session.currentStatus}
                        onStatusChange={handleStatusChange}
                        isLoading={isLoading}
                        viewMode={viewMode}
                        handoverPin={session.handoverPin}
                        handoverStartConfirmedAt={session.handoverStartConfirmedAt}
                        handoverEndConfirmedAt={session.handoverEndConfirmedAt}
                        onHandoverConfirm={confirmHandover}
                    />

                    {/* Emergency Contacts */}
                    <EmergencyContacts
                        contacts={session.emergencyContacts}
                        onCall={handleCall}
                    />
                </div>
            </div>
        </div>
    );
}
