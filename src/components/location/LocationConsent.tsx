/**
 * Location Consent Component - KVKK compliant consent flow
 */

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    MapPin,
    Shield,
    Eye,
    Lock,
    Loader2,
    Info,
} from "lucide-react";

interface LocationConsentProps {
    isOpen: boolean;
    onClose: () => void;
    onConsent: (scope: "session-only" | "always-on" | "never") => Promise<void>;
    sessionInfo?: {
        parentName: string;
        date: string;
    };
}

export function LocationConsent({
    isOpen,
    onClose,
    onConsent,
    sessionInfo,
}: LocationConsentProps) {
    const [scope, setScope] = useState<"session-only" | "always-on" | "never">("session-only");
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!acceptedTerms) return;

        setIsSubmitting(true);
        try {
            await onConsent(scope);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Konum Paylaşım İzni
                    </DialogTitle>
                    <DialogDescription>
                        Oturum sırasında konumunuzun ebeveyn ile paylaşılması gerekiyor.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[400px] pr-4">
                    <div className="space-y-4">
                        {/* Session Info */}
                        {sessionInfo && (
                            <div className="p-3 bg-primary/5 rounded-lg">
                                <p className="text-sm">
                                    <span className="font-medium">{sessionInfo.parentName}</span> ile{" "}
                                    <span className="font-medium">{sessionInfo.date}</span> tarihli
                                    oturumunuz için konum izni isteniyor.
                                </p>
                            </div>
                        )}

                        {/* Privacy Info */}
                        <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertTitle>Gizlilik Güvencesi</AlertTitle>
                            <AlertDescription>
                                Konum verileriniz KVKK kapsamında korunur ve yalnızca aktif oturum
                                sırasında ebeveyn ile paylaşılır.
                            </AlertDescription>
                        </Alert>

                        {/* Consent Scope */}
                        <div className="space-y-3">
                            <Label>Konum Paylaşım Tercihi</Label>
                            <RadioGroup
                                value={scope}
                                onValueChange={(value: "session-only" | "always-on" | "never") => setScope(value)}
                            >
                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                                    <RadioGroupItem value="session-only" id="session-only" className="mt-0.5" />
                                    <div className="flex-1">
                                        <Label htmlFor="session-only" className="font-medium cursor-pointer">
                                            Sadece Bu Oturum
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Konum sadece bu oturum süresince paylaşılır.
                                        </p>
                                    </div>
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                </div>

                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                                    <RadioGroupItem value="always-on" id="always-on" className="mt-0.5" />
                                    <div className="flex-1">
                                        <Label htmlFor="always-on" className="font-medium cursor-pointer">
                                            Tüm Oturumlar
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Her oturum için otomatik konum paylaşımı.
                                        </p>
                                    </div>
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                </div>

                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                                    <RadioGroupItem value="never" id="never" className="mt-0.5" />
                                    <div className="flex-1">
                                        <Label htmlFor="never" className="font-medium cursor-pointer">
                                            Konum Paylaşma
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Konum hiçbir zaman paylaşılmaz. Not: Bu bazı özellikleri kısıtlayabilir.
                                        </p>
                                    </div>
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </RadioGroup>
                        </div>

                        {/* KVKK Terms */}
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-start space-x-2">
                                <Checkbox
                                    id="terms"
                                    checked={acceptedTerms}
                                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                                />
                                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                                    <span className="font-medium">KVKK Aydınlatma Metni</span>'ni okudum ve
                                    kişisel verilerimin işlenmesini kabul ediyorum. Konum verilerimin
                                    güvenliği ve gizliliği konusunda bilgilendirildim.
                                </Label>
                            </div>
                        </div>

                        {/* Data Retention Info */}
                        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="text-muted-foreground">
                                <p>Konum verileri:</p>
                                <ul className="list-disc list-inside mt-1 space-y-0.5">
                                    <li>Oturum bitiminden 7 gün sonra silinir</li>
                                    <li>Üçüncü taraflarla paylaşılmaz</li>
                                    <li>Yalnızca güvenlik amaçlı saklanır</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!acceptedTerms || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <Shield className="h-4 w-4 mr-2" />
                                Onayla
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
