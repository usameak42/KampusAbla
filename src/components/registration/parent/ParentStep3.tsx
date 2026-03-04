/**
 * Parent Registration - Step 3: Completion
 * Welcome message and next steps
 */

import { Button } from "@/components/ui/button";
import { CheckCircle2, Baby, Search } from "lucide-react";
import { ParentFormData } from "@/pages/register/ParentRegistration";

interface ParentStep3Props {
    formData: Partial<ParentFormData>;
    onFinish: () => void;
}

export function ParentStep3({ formData, onFinish }: ParentStep3Props) {
    return (
        <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                    <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-2">
                    Hoş Geldiniz, {formData.fullName}!
                </h2>
                <p className="text-muted-foreground">
                    Kaydınız başarıyla tamamlandı. Artık güvenilir öğrenci bakıcılara ulaşabilirsiniz.
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left space-y-4">
                <h3 className="font-semibold text-blue-900">Bir Sonraki Adımlar:</h3>

                <div className="space-y-3">
                    <div className="flex gap-3">
                        <Baby className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">1. Çocuğunuzu ekleyin</p>
                            <p className="text-xs text-muted-foreground">
                                Bakıcılara daha iyi eşleşme için çocuğunuzun bilgilerini ekleyin
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Search className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">2. Bakıcı arayın</p>
                            <p className="text-xs text-muted-foreground">
                                Bölgenizdeki doğrulanmış öğrenci bakıcıları keşfedin
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
                <Button onClick={() => onFinish()} size="lg" className="w-full">
                    Platformu Keşfet
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.location.href = "/profile/children/add"}
                    size="lg"
                    className="w-full"
                >
                    <Baby className="mr-2 h-4 w-4" />
                    Hemen Çocuğumu Ekle
                </Button>
            </div>
        </div>
    );
}
