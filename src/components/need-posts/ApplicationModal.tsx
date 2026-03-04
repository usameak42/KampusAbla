/**
 * Application Modal Component - Sitter applies to a need post
 */

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Banknote,
    Send,
    Loader2,
    Info
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { NeedPost } from "./NeedPostCard";

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    needPost: NeedPost;
    onSubmit: (message: string, proposedRate?: number) => Promise<void>;
}

export function ApplicationModal({
    isOpen,
    onClose,
    needPost,
    onSubmit,
}: ApplicationModalProps) {
    const [message, setMessage] = useState("");
    const [wantToNegotiateRate, setWantToNegotiateRate] = useState(false);
    const [proposedRate, setProposedRate] = useState(needPost.hourlyRateOffered);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const minMessageLength = 50;
    const isMessageValid = message.trim().length >= minMessageLength;

    const handleSubmit = async () => {
        if (!isMessageValid) {
            setError(`Mesajınız en az ${minMessageLength} karakter olmalı`);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(
                message,
                wantToNegotiateRate ? proposedRate : undefined
            );
            // Reset form
            setMessage("");
            setWantToNegotiateRate(false);
            setProposedRate(needPost.hourlyRateOffered);
        } catch (err) {
            setError("Başvuru gönderilemedi. Lütfen tekrar deneyin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setMessage("");
            setWantToNegotiateRate(false);
            setError(null);
            onClose();
        }
    };

    const totalAmount = needPost.hourlyRateOffered * needPost.durationHours;
    const proposedTotal = proposedRate * needPost.durationHours;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-primary" />
                        İlana Başvur
                    </DialogTitle>
                    <DialogDescription>
                        "{needPost.title}" ilanına başvurunuzu gönderin
                    </DialogDescription>
                </DialogHeader>

                {/* Need Post Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(needPost.needDate, "d MMMM yyyy, EEEE", { locale: tr })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{needPost.startTime} ({needPost.durationHours} saat)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{needPost.district}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{needPost.childrenCount} çocuk ({needPost.childrenAges.join(", ")} yaş)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">₺{needPost.hourlyRateOffered}/saat</span>
                        <span className="text-muted-foreground">(Toplam: ₺{totalAmount})</span>
                    </div>
                    {/* Features */}
                    <div className="flex flex-wrap gap-1 pt-1">

                        {needPost.homeworkHelp && (
                            <Badge variant="outline" className="text-xs">Ödev Yardımı</Badge>
                        )}
                        {needPost.languageGoal && (
                            <Badge variant="outline" className="text-xs">{needPost.languageGoal}</Badge>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Application Form */}
                <div className="space-y-4">
                    {/* Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message">
                            Kendinizi Tanıtın *
                        </Label>
                        <Textarea
                            id="message"
                            placeholder="Merhaba, ben üniversite öğrencisiyim ve çocuklarla çalışmayı çok seviyorum. Daha önce benzer yaştaki çocuklara baktım ve..."
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                if (error) setError(null);
                            }}
                            rows={5}
                            className={error ? "border-red-500" : ""}
                        />
                        <div className="flex justify-between text-xs">
                            <span className={message.length < minMessageLength ? "text-muted-foreground" : "text-green-600"}>
                                {message.length} / {minMessageLength} karakter (min)
                            </span>
                            {error && <span className="text-red-500">{error}</span>}
                        </div>
                    </div>

                    {/* Rate Negotiation */}
                    <div className="space-y-3 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-primary" />
                                <Label htmlFor="negotiate" className="cursor-pointer">
                                    Farklı ücret önermek istiyorum
                                </Label>
                            </div>
                            <Switch
                                id="negotiate"
                                checked={wantToNegotiateRate}
                                onCheckedChange={setWantToNegotiateRate}
                            />
                        </div>

                        {wantToNegotiateRate && (
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Önerdiğim ücret:</span>
                                    <div className="flex items-center">
                                        <span className="text-muted-foreground mr-1">₺</span>
                                        <Input
                                            type="number"
                                            value={proposedRate}
                                            onChange={(e) => setProposedRate(Number(e.target.value))}
                                            min={50}
                                            max={300}
                                            className="w-20 text-center"
                                        />
                                        <span className="text-muted-foreground ml-1">/saat</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Toplam: ₺{proposedTotal} ({needPost.durationHours} saat)
                                </p>
                                {proposedRate < needPost.hourlyRateOffered && (
                                    <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>
                                            Teklif edilen ücretten düşük ücret önermek kabul şansınızı azaltabilir.
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 space-y-1">
                        <p className="font-medium">💡 İpuçları:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Deneyimlerinizi ve referanslarınızı belirtin</li>
                            <li>Neden bu iş için uygun olduğunuzu açıklayın</li>
                            <li>İlanın gereksinimlerini karşıladığınızı gösterin</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isMessageValid || isSubmitting}
                        className="min-w-[120px]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Başvur
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
