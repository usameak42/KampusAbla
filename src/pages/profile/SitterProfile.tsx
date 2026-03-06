/**
 * Sitter Profile Page - View sitter profile details
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Star,
    MapPin,
    Calendar,
    DollarSign,
    Shield,
    Languages,
    GraduationCap,
    CheckCircle2,
    Play
} from "lucide-react";

export default function SitterProfile() {
    // TODO: Fetch from Supabase using ID from URL params
    const sitter = {
        id: 1,
        fullName: "Ayşe Yılmaz",
        university: "Boğaziçi Üniversitesi",
        department: "Psikoloji",
        year: 3,
        hourlyRate: 75,
        rating: 4.8,
        totalSessions: 45,
        joinDate: "Eylül 2025",
        bio: "Merhaba! Ben Ayşe, Boğaziçi Üniversitesi Psikoloji 3. sınıf öğrencisiyim. Çocuklarla ilgilenmek benim tutkum ve 2 yıldır aktif olarak bakıcılık yapıyorum. Özellikle ilkokul yaş grubundaki çocuklarla harika anlaşıyorum.",
        languages: ["Türkçe", "İngilizce", "Almanca"],
        badges: ["verified", "trusted", "gold"],
        profilePhotoUrl: null as string | null,
        introVideoUrl: null as string | null,
        location: "Beşiktaş, İstanbul",
    };

    const reviews = [
        {
            id: 1,
            parentName: "Ahmet Y.",
            rating: 5,
            comment: "Ayşe çok güvenilir ve çocuklarla harika anlaşıyor. Kesinlikle tavsiye ederim!",
            date: "15 Ocak 2026",
        },
        {
            id: 2,
            parentName: "Fatma K.",
            rating: 5,
            comment: "Profesyonel ve zamanında. Çocuğum çok mutlu oldu.",
            date: "10 Ocak 2026",
        },
    ];

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Profile Photo */}
                            <div className="flex flex-col items-center md:items-start gap-3">
                                <div className="h-32 w-32 rounded-full bg-green-200 flex items-center justify-center">
                                    <span className="text-4xl font-bold text-green-700">
                                        {sitter.fullName.charAt(0)}
                                    </span>
                                </div>
                                {sitter.introVideoUrl && (
                                    <Button variant="outline" size="sm" className="w-full">
                                        <Play className="h-4 w-4 mr-2" />
                                        Tanıtım Videosu
                                    </Button>
                                )}
                            </div>

                            {/* Profile Info */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h1 className="text-2xl font-bold">{sitter.fullName}</h1>
                                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                            <MapPin className="h-4 w-4" />
                                            {sitter.location}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-green-600">₺{sitter.hourlyRate}</p>
                                        <p className="text-sm text-muted-foreground">/saat</p>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {sitter.badges.includes("verified") && (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Doğrulanmış
                                        </Badge>
                                    )}
                                    {sitter.badges.includes("trusted") && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Güvenilir
                                        </Badge>
                                    )}
                                    {sitter.badges.includes("gold") && (
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                            <Star className="h-3 w-3 mr-1" />
                                            Altın Rozetli
                                        </Badge>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-2xl font-bold flex items-center gap-1">
                                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                            {sitter.rating}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Puan</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{sitter.totalSessions}</p>
                                        <p className="text-xs text-muted-foreground">Tamamlanan Seans</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold flex items-center gap-1">
                                            <Calendar className="h-5 w-5" />
                                        </p>
                                        <p className="text-xs text-muted-foreground">{sitter.joinDate}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <Button className="flex-1" size="lg">
                                        Rezervasyon Yap
                                    </Button>
                                    <Button variant="outline" size="lg">
                                        Mesaj Gönder
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* About */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Hakkında</h2>
                        <p className="text-muted-foreground mb-4">{sitter.bio}</p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-semibold mb-2 flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-green-600" />
                                    Eğitim Bilgileri
                                </p>
                                <p className="text-sm text-muted-foreground">{sitter.university}</p>
                                <p className="text-sm text-muted-foreground">
                                    {sitter.department} - {sitter.year}. Sınıf
                                </p>
                            </div>

                            <div>
                                <p className="font-semibold mb-2 flex items-center gap-2">
                                    <Languages className="h-5 w-5 text-green-600" />
                                    Konuştuğu Diller
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {sitter.languages.join(", ")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Reviews */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Değerlendirmeler</h2>
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="border-b pb-4 last:border-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-semibold">{review.parentName}</p>
                                        <div className="flex items-center gap-1">
                                            {[...Array(review.rating)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">{review.comment}</p>
                                    <p className="text-xs text-muted-foreground">{review.date}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
