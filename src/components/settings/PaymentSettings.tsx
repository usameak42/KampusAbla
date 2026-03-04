/**
 * PaymentSettings - Payout and sub-merchant registration settings for sitters
 */

import { useState } from "react";
import { CreditCard, Building2, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SettingsSection, SettingsItem } from "./SettingsSection";
import type { PaymentSettings, SubMerchantRegistration, CardInput, SavedCard } from "@/types/settings";
import { normalizeIban, formatIbanForDisplay, detectCardBrand } from "@/lib/payment";

interface PaymentSettingsProps {
    payment?: PaymentSettings;
    onRegisterSubMerchant: (data: SubMerchantRegistration) => Promise<void>;
    onAddSavedCard: (data: CardInput) => Promise<void>;
    onRemoveSavedCard: (cardId: string) => Promise<void>;
    onSetDefaultCard: (cardId: string) => Promise<void>;
    isSaving: boolean;
    error?: string | null;
}

const STATUS_LABELS: Record<NonNullable<PaymentSettings["subMerchantStatus"]>, string> = {
    pending: "İnceleniyor",
    verified: "Onaylandı",
    rejected: "Reddedildi",
};

export function PaymentSettings({
    payment,
    onRegisterSubMerchant,
    onAddSavedCard,
    onRemoveSavedCard,
    onSetDefaultCard,
    isSaving,
    error,
}: PaymentSettingsProps) {
    const [showRegistration, setShowRegistration] = useState(false);
    const [legalName, setLegalName] = useState("");
    const [identityNumber, setIdentityNumber] = useState("");
    const [iban, setIban] = useState("");
    const [taxNumber, setTaxNumber] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [showCardDialog, setShowCardDialog] = useState(false);
    const [cardholderName, setCardholderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiryMonth, setExpiryMonth] = useState("");
    const [expiryYear, setExpiryYear] = useState("");
    const [cvc, setCvc] = useState("");
    const [brand, setBrand] = useState("Visa");

    const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const normalized = normalizeIban(e.target.value);
        const formatted = formatIbanForDisplay(normalized);
        setIban(formatted);
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        const formatted = value.match(/.{1,4}/g)?.join(" ") || value;

        if (value.length <= 16) {
            setCardNumber(formatted);
            setBrand(detectCardBrand(value));
        }
    };

    const handleRegister = async () => {
        await onRegisterSubMerchant({
            legalName,
            identityNumber,
            iban: iban.replace(/\s/g, ""), // Send raw IBAN
            taxNumber: taxNumber || undefined,
            contactPhone: contactPhone || undefined,
        });
        setShowRegistration(false);
        setLegalName("");
        setIdentityNumber("");
        setIban("");
        setTaxNumber("");
        setContactPhone("");
    };

    const handleAddCard = async () => {
        await onAddSavedCard({
            cardholderName,
            cardNumber: cardNumber.replace(/\s/g, ""),
            expiryMonth,
            expiryYear,
            cvc,
            brand,
        });
        setShowCardDialog(false);
        setCardholderName("");
        setCardNumber("");
        setExpiryMonth("");
        setExpiryYear("");
        setCvc("");
        setBrand("Visa"); // Reset default
    };

    const savedCards = payment?.savedCards ?? [];

    const statusLabel = payment?.subMerchantStatus
        ? STATUS_LABELS[payment.subMerchantStatus]
        : "Kayıt bekleniyor";

    return (
        <>
            <SettingsSection
                title="Ödeme ve Payout Ayarları"
                description="Alt üye işyeri kaydınızı tamamlayarak ödeme alabilirsiniz."
            >
                <div className="space-y-3">
                    <SettingsItem
                        icon={<Building2 className="h-4 w-4" />}
                        label="Alt Üye İşyeri Durumu"
                        description={
                            payment?.subMerchantId
                                ? `${statusLabel} • ID: ${payment.subMerchantId}`
                                : "Kayıt yapılmadı"
                        }
                        action={
                            <Button
                                size="sm"
                                variant={payment?.subMerchantId ? "outline" : "default"}
                                onClick={() => setShowRegistration(true)}
                            >
                                {payment?.subMerchantId ? "Bilgileri Güncelle" : "Kayıt Ol"}
                            </Button>
                        }
                    />

                    <SettingsItem
                        icon={<CreditCard className="h-4 w-4" />}
                        label="Ödeme Yöntemi"
                        description={
                            payment?.payoutMethod === "papara" ? "Papara" : "Banka Transferi"
                        }
                    />
                </div>
                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Hata</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </SettingsSection>

            <SettingsSection
                title="Kayıtlı Kartlar"
                description="Hızlı ödeme için kartlarınızı saklayın."
            >
                <div className="space-y-3">
                    {savedCards.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Henüz kayıtlı kart bulunmuyor.
                        </p>
                    ) : (
                        savedCards.map((card: SavedCard) => (
                            <div
                                key={card.id}
                                className="flex items-center justify-between gap-3 p-3 border rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {card.brand} •••• {card.last4}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {card.cardholderName} • {card.expiryMonth}/{card.expiryYear}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {card.isDefault ? (
                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Varsayılan
                                        </span>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onSetDefaultCard(card.id)}
                                        >
                                            Varsayılan Yap
                                        </Button>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => onRemoveSavedCard(card.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => setShowCardDialog(true)}
                >
                    Kart Ekle
                </Button>
            </SettingsSection>

            <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Alt Üye İşyeri Kaydı</DialogTitle>
                        <DialogDescription>
                            Ödeme alabilmek için kimlik ve banka bilgilerinizi paylaşmanız gerekir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Ad Soyad</Label>
                            <Input
                                value={legalName}
                                onChange={(event) => setLegalName(event.target.value)}
                                placeholder="Ayşe Demir"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Kimlik Numarası</Label>
                            <Input
                                value={identityNumber}
                                onChange={(event) => setIdentityNumber(event.target.value)}
                                placeholder="T.C. Kimlik No"
                                maxLength={11}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>IBAN</Label>
                            <Input
                                value={iban}
                                onChange={handleIbanChange}
                                placeholder="TR00 0000 0000 0000 0000 0000 00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Vergi Numarası</Label>
                            <Input
                                value={taxNumber}
                                onChange={(event) => setTaxNumber(event.target.value)}
                                placeholder="Vergi No"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>İletişim Telefonu (Opsiyonel)</Label>
                            <Input
                                value={contactPhone}
                                onChange={(event) => {
                                    const val = event.target.value.replace(/[^0-9+ ]/g, "");
                                    setContactPhone(val);
                                }}
                                placeholder="+90 5XX XXX XXXX"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRegistration(false)}>
                            İptal
                        </Button>
                        <Button
                            onClick={handleRegister}
                            disabled={isSaving || !legalName || !identityNumber || !iban || !taxNumber}
                        >
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Kaydı Gönder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kart Ekle</DialogTitle>
                        <DialogDescription>
                            Kart bilgilerinizi güvenli şekilde kaydedin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Kart Üzerindeki İsim</Label>
                            <Input
                                value={cardholderName}
                                onChange={(event) => setCardholderName(event.target.value)}
                                placeholder="Ayşe Demir"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Kart Numarası</Label>
                            <Input
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                placeholder="0000 0000 0000 0000"
                                maxLength={19}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label>Ay</Label>
                                <Input
                                    value={expiryMonth}
                                    onChange={(event) => setExpiryMonth(event.target.value)}
                                    placeholder="AA"
                                    maxLength={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Yıl</Label>
                                <Input
                                    value={expiryYear}
                                    onChange={(event) => setExpiryYear(event.target.value)}
                                    placeholder="YYYY"
                                    maxLength={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CVC</Label>
                                <Input
                                    value={cvc}
                                    onChange={(event) => setCvc(event.target.value)}
                                    placeholder="123"
                                    maxLength={4}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Kart Tipi</Label>
                            <Input
                                value={brand}
                                readOnly
                                disabled
                                className="bg-muted"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCardDialog(false)}>
                            İptal
                        </Button>
                        <Button
                            onClick={handleAddCard}
                            disabled={
                                isSaving ||
                                !cardholderName ||
                                !cardNumber ||
                                !expiryMonth ||
                                !expiryYear ||
                                !cvc
                            }
                        >
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
