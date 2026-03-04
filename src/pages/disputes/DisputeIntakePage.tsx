/**
 * DisputeIntakePage - Dispute intake form for parents/sitters
 */

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Scale, CheckCircle2, AlertTriangle } from "lucide-react";

const DISPUTE_TYPES = [
    { id: "booking", label: "Rezervasyon Anlaşmazlığı" },
    { id: "payment", label: "Ödeme / Ücret Anlaşmazlığı" },
    { id: "service", label: "Hizmet Kalitesi" },
    { id: "behavior", label: "Davranış / İletişim" },
    { id: "other", label: "Diğer" },
] as const;

type DisputeType = (typeof DISPUTE_TYPES)[number]["id"];

export default function DisputeIntakePage() {
    const [type, setType] = useState<DisputeType>("booking");
    const [title, setTitle] = useState("");
    const [bookingId, setBookingId] = useState("");
    const [description, setDescription] = useState("");
    const [resolution, setResolution] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const resetForm = () => {
        setType("booking");
        setTitle("");
        setBookingId("");
        setDescription("");
        setResolution("");
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setSubmitted(false);

        if (title.trim().length < 5) {
            setError("Lütfen en az 5 karakterlik bir başlık girin.");
            return;
        }

        if (bookingId.trim().length === 0) {
            setError("Lütfen Rezervasyon ID giriniz.");
            return;
        }

        if (description.trim().length < 20) {
            setError("Lütfen anlaşmazlığı en az 20 karakterle açıklayın.");
            return;
        }

        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 800));
        setIsSubmitting(false);
        setSubmitted(true);
        resetForm();
    };

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Scale className="h-5 w-5 text-purple-600" />
                            Anlaşmazlık Başvurusu
                        </CardTitle>
                        <CardDescription>
                            Rezervasyon veya ödeme ile ilgili anlaşmazlıkları bu form üzerinden iletebilirsiniz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Anlaşmazlık Türü</Label>
                                    <Select value={type} onValueChange={(value) => setType(value as DisputeType)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tür seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DISPUTE_TYPES.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bookingId">Rezervasyon ID</Label>
                                    <Input
                                        id="bookingId"
                                        value={bookingId}
                                        onChange={(event) => setBookingId(event.target.value)}
                                        placeholder="Örn: BK-2024-1024"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Başlık</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    placeholder="Kısa bir özet"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Detaylar</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    placeholder="Yaşanan durumu detaylıca anlatın..."
                                    rows={5}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {description.length}/2000 karakter
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resolution">Talep Edilen Çözüm</Label>
                                <Textarea
                                    id="resolution"
                                    value={resolution}
                                    onChange={(event) => setResolution(event.target.value)}
                                    placeholder="Örn: Ücret iadesi, rezervasyon güncellemesi..."
                                    rows={3}
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {submitted && (
                                <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <AlertDescription>
                                        Başvurunuz alındı. 24 saat içinde sizinle iletişime geçilecektir.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex justify-end gap-3">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Gönderiliyor...
                                        </>
                                    ) : (
                                        "Başvuruyu Gönder"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">Başvuru Süreci</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Başvurunuz 24 saat içinde değerlendirmeye alınır.</li>
                        <li>Ek belge gerekiyorsa e-posta yoluyla iletişime geçilir.</li>
                        <li>Çözüm önerileri taraflara iletilir ve kayıt altına alınır.</li>
                    </ul>
                </div>
            </div>
        </AppLayout >
    );
}
