import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { QrCode, Calculator, CheckCircle, Loader2 } from "lucide-react";

interface HandoverVerificationProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "start" | "end";
    viewMode: "parent" | "sitter";
    handoverPin: string; // In real app this might only be visible to parent
    onVerify: () => Promise<void>;
}

export function HandoverVerification({
    isOpen,
    onClose,
    mode,
    viewMode,
    handoverPin,
    onVerify
}: HandoverVerificationProps) {
    const [enteredPin, setEnteredPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        if (enteredPin !== handoverPin) {
            setError("Hatalı PIN kodu");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await onVerify();
            onClose();
        } catch (err) {
            setError("Doğrulama başarısız");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinChange = (value: string) => {
        // Only allow numbers and max 4 digits
        if (/^\d{0,4}$/.test(value)) {
            setEnteredPin(value);
            setError(null);
        }
    };

    const title = mode === "start" ? "Teslim Alma Doğrulaması (Başlangıç)" : "Teslim Etme Doğrulaması (Bitiş)";
    const description = mode === "start"
        ? "Çocuğu teslim alırken güvenlik doğrulamasını tamamlayın."
        : "Çocuğu teslim ederken güvenlik doğrulamasını tamamlayın.";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {viewMode === "parent" ? (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 w-48 h-48 flex items-center justify-center">
                                {/* Placeholder for QR Code */}
                                <QrCode className="h-24 w-24 text-gray-400" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm text-muted-foreground">Bakıcıya gösterilecek PIN kodu:</p>
                                <p className="text-4xl font-bold tracking-widest text-primary">{handoverPin}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pin">Ebeveynden aldığınız PIN kodunu girin</Label>
                                <div className="relative">
                                    <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="pin"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0000"
                                        value={enteredPin}
                                        onChange={(e) => handlePinChange(e.target.value)}
                                        className="pl-9 text-center text-2xl tracking-widest"
                                        maxLength={4}
                                    />
                                </div>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        İptal
                    </Button>
                    {viewMode === "sitter" && (
                        <Button
                            onClick={handleVerify}
                            disabled={enteredPin.length !== 4 || isLoading}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Doğrula & {mode === "start" ? "Başlat" : "Bitir"}
                        </Button>
                    )}
                    {viewMode === "parent" && (
                        <Button onClick={onClose}>
                            Tamam
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
