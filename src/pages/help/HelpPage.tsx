/**
 * HelpPage - Main Help Center Page
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    HelpCircle,
    Search,
    MessageCircle,
    Mail,
    Phone,
    Shield,
    CreditCard,
    Calendar,
    User,
    ChevronDown,
    ExternalLink,
    Send,
    Loader2,
    CheckCircle,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
    FAQ_DATA,
    FAQ_CATEGORY_LABELS,
    searchFAQ,
    getFAQByCategory,
} from "@/types/help";
import type { FAQCategory, FAQItem } from "@/types/help";
import { useSupport } from "@/hooks/useSupport";

const CATEGORY_ICONS: Record<FAQCategory, React.ReactNode> = {
    general: <HelpCircle className="h-4 w-4" />,
    booking: <Calendar className="h-4 w-4" />,
    payment: <CreditCard className="h-4 w-4" />,
    safety: <Shield className="h-4 w-4" />,
    account: <User className="h-4 w-4" />,
    sitter: <Users className="h-4 w-4" />,
};

export default function HelpPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<FAQCategory | "all">("all");
    const [showContactForm, setShowContactForm] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    // Contact form state
    const [contactSubject, setContactSubject] = useState("");
    const [contactCategory, setContactCategory] = useState<FAQCategory>("general");
    const [contactMessage, setContactMessage] = useState("");

    const { createTicket, isSubmitting } = useSupport({ userId: "user-1" });

    // Filter FAQ based on search and category
    const filteredFAQ = useMemo(() => {
        let results: FAQItem[] = [];

        if (searchQuery.trim()) {
            results = searchFAQ(searchQuery);
        } else if (selectedCategory === "all") {
            results = FAQ_DATA;
        } else {
            results = getFAQByCategory(selectedCategory);
        }

        return results;
    }, [searchQuery, selectedCategory]);

    // Group FAQ by category for display
    const groupedFAQ = useMemo(() => {
        const groups: Record<FAQCategory, FAQItem[]> = {
            general: [],
            booking: [],
            payment: [],
            safety: [],
            account: [],
            sitter: [],
        };

        filteredFAQ.forEach((faq) => {
            groups[faq.category].push(faq);
        });

        return groups;
    }, [filteredFAQ]);

    const handleSubmitContact = async () => {
        if (!contactSubject.trim() || !contactMessage.trim()) return;

        try {
            await createTicket({
                subject: contactSubject,
                category: contactCategory,
                message: contactMessage,
            });
            setShowContactForm(false);
            setShowSuccessDialog(true);
            setContactSubject("");
            setContactMessage("");
        } catch (err) {
            // Error handled by hook
        }
    };

    const categories = Object.keys(FAQ_CATEGORY_LABELS) as FAQCategory[];

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
            <div className="container max-w-4xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-blue-500" />
                            Yardım Merkezi
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Sorularınızı yanıtlıyoruz
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Soru ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Tabs defaultValue="faq" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="faq">Sık Sorulan Sorular</TabsTrigger>
                        <TabsTrigger value="contact">İletişim</TabsTrigger>
                    </TabsList>

                    {/* FAQ Tab */}
                    <TabsContent value="faq" className="space-y-4">
                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <Button
                                variant={selectedCategory === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory("all")}
                            >
                                Tümü
                            </Button>
                            {categories.map((cat) => (
                                <Button
                                    key={cat}
                                    variant={selectedCategory === cat ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedCategory(cat)}
                                    className="flex-shrink-0"
                                >
                                    {CATEGORY_ICONS[cat]}
                                    <span className="ml-1.5">{FAQ_CATEGORY_LABELS[cat]}</span>
                                </Button>
                            ))}
                        </div>

                        {/* FAQ Accordion */}
                        {filteredFAQ.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center">
                                    <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        Aramanızla eşleşen sonuç bulunamadı.
                                    </p>
                                    <Button
                                        variant="link"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedCategory("all");
                                        }}
                                    >
                                        Filtreleri Temizle
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : selectedCategory === "all" && !searchQuery ? (
                            // Grouped by category
                            categories.map((cat) => {
                                const items = groupedFAQ[cat];
                                if (items.length === 0) return null;

                                return (
                                    <Card key={cat}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {CATEGORY_ICONS[cat]}
                                                {FAQ_CATEGORY_LABELS[cat]}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Accordion type="single" collapsible>
                                                {items.map((faq) => (
                                                    <AccordionItem key={faq.id} value={faq.id}>
                                                        <AccordionTrigger className="text-left text-sm">
                                                            {faq.question}
                                                        </AccordionTrigger>
                                                        <AccordionContent className="text-sm text-muted-foreground">
                                                            {faq.answer}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            // Flat list for search/filter
                            <Card>
                                <CardContent className="pt-4">
                                    <Accordion type="single" collapsible>
                                        {filteredFAQ.map((faq) => (
                                            <AccordionItem key={faq.id} value={faq.id}>
                                                <AccordionTrigger className="text-left text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {FAQ_CATEGORY_LABELS[faq.category]}
                                                        </Badge>
                                                        {faq.question}
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="text-sm text-muted-foreground">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Contact Tab */}
                    <TabsContent value="contact" className="space-y-4">
                        {/* Quick Contact Options */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setShowContactForm(true)}
                            >
                                <CardContent className="flex items-center gap-4 py-6">
                                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <Mail className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">E-posta Desteği</h3>
                                        <p className="text-sm text-muted-foreground">
                                            24 saat içinde yanıt
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <CardContent className="flex items-center gap-4 py-6">
                                    <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                                        <MessageCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Canlı Destek</h3>
                                        <p className="text-sm text-muted-foreground">
                                            09:00 - 18:00 (Haftaiçi)
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => window.location.href = "tel:08501234567"}
                            >
                                <CardContent className="flex items-center gap-4 py-6">
                                    <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                        <Phone className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Telefon</h3>
                                        <p className="text-sm text-muted-foreground">
                                            0850 123 45 67
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => navigate("/safety")}
                            >
                                <CardContent className="flex items-center gap-4 py-6">
                                    <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                                        <Shield className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Güvenlik Merkezi</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Acil durumlar için
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Form */}
                        {showContactForm && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Destek Talebi Oluştur</CardTitle>
                                    <CardDescription>
                                        Sorunuzu detaylı bir şekilde açıklayın.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Konu</Label>
                                        <Input
                                            value={contactSubject}
                                            onChange={(e) => setContactSubject(e.target.value)}
                                            placeholder="Konu başlığı"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kategori</Label>
                                        <Select
                                            value={contactCategory}
                                            onValueChange={(v) => setContactCategory(v as FAQCategory)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {FAQ_CATEGORY_LABELS[cat]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mesajınız</Label>
                                        <Textarea
                                            value={contactMessage}
                                            onChange={(e) => setContactMessage(e.target.value)}
                                            placeholder="Sorununuzu detaylı bir şekilde açıklayın..."
                                            rows={5}
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowContactForm(false)}
                                        >
                                            İptal
                                        </Button>
                                        <Button
                                            onClick={handleSubmitContact}
                                            disabled={
                                                isSubmitting ||
                                                !contactSubject.trim() ||
                                                !contactMessage.trim()
                                            }
                                        >
                                            {isSubmitting && (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            )}
                                            <Send className="h-4 w-4 mr-2" />
                                            Gönder
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Quick Links */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base">Hızlı Bağlantılar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2 md:grid-cols-3">
                            <Button
                                variant="ghost"
                                className="justify-start"
                                onClick={() => navigate("/terms")}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Kullanım Koşulları
                            </Button>
                            <Button
                                variant="ghost"
                                className="justify-start"
                                onClick={() => navigate("/privacy")}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Gizlilik Politikası
                            </Button>
                            <Button
                                variant="ghost"
                                className="justify-start"
                                onClick={() => navigate("/kvkk")}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                KVKK
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent>
                    <div className="flex flex-col items-center text-center py-6">
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="mb-2">Talebiniz Alındı!</DialogTitle>
                        <DialogDescription>
                            Destek ekibimiz en kısa sürede sizinle iletişime geçecektir.
                            Ortalama yanıt süremiz 24 saattir.
                        </DialogDescription>
                        <Button className="mt-6" onClick={() => setShowSuccessDialog(false)}>
                            Tamam
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
