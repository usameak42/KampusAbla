import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/types/subscription";
import { toast } from "sonner";
import { Zap, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PayoutRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableBalance: number;
    isPriorityEligible?: boolean;
    onRequest: (amount: number) => Promise<void>;
}

export function PayoutRequestModal({
    open,
    onOpenChange,
    availableBalance,
    isPriorityEligible = false,
    onRequest,
}: PayoutRequestModalProps) {
    const [amount, setAmount] = useState(availableBalance.toString());
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);

        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error("Lütfen geçerli bir tutar girin");
            return;
        }

        if (numAmount > availableBalance) {
            toast.error("Bakiye yetersiz");
            return;
        }

        if (numAmount < 20) {
            toast.error("Minimum çekim tutarı ₺20'dir");
            return;
        }

        setIsLoading(true);
        try {
            await onRequest(numAmount);
            toast.success("Ödeme talebiniz başarıyla oluşturuldu");
            onOpenChange(false);
        } catch (error) {
            console.error("Payout request error:", error);
            toast.error("Ödeme talebi oluşturulamadı");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Ödeme Talebi Oluştur</DialogTitle>
                        <DialogDescription>
                            Kazancınızı banka hesabınıza çekmek için bir talep oluşturun.
                            Ödemeler genellikle 1-3 iş günü içinde gerçekleştirilir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="balance" className="text-xs text-muted-foreground">
                                    Kullanılabilir Bakiye
                                </Label>
                                <div className="text-lg font-bold">{formatPrice(availableBalance)}</div>
                            </div>

                            {isPriorityEligible && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none flex gap-1 cursor-help">
                                                <Zap className="h-3 w-3 fill-current" />
                                                Ekspres Ödeme
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-[200px] text-xs">
                                                Premium üye olduğunuz için ödeme talebiniz öncelikli olarak işleme alınacaktır.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Çekilecek Tutar</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="20"
                                max={availableBalance}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Minimum ₺20.00 çekebilirsiniz.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            İptal
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "İşleniyor..." : "Talep Gönder"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
