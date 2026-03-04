/**
 * Create Need Post Component - Form for parents to post their childcare needs
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Users,
    BookOpen,
    Car,
    Banknote,
    X,
    Plus,
    Loader2
} from "lucide-react";
import { format, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Child {
    id: string;
    name: string;
    age: number;
}

interface CreateNeedPostProps {
    children: Child[];
    onSubmit: (data: NeedPostFormData) => Promise<void>;
    onCancel: () => void;
}

export interface NeedPostFormData {
    title: string;
    description: string;
    needDate: Date;
    startTime: string;
    durationHours: number;
    selectedChildrenIds: string[];
    languageGoal: string;
    homeworkHelp: boolean;

    address: string;
    district: string;
    hourlyRateOffered: number;
}

const DISTRICTS = [
    "Beşiktaş",
    "Kadıköy",
    "Şişli",
    "Bakırköy",
    "Üsküdar",
    "Sarıyer",
    "Ataşehir",
    "Maltepe",
    "Beyoğlu",
    "Fatih",
];

const LANGUAGES = [
    "İngilizce",
    "Almanca",
    "Fransızca",
    "İspanyolca",
    "İtalyanca",
    "Rusça",
    "Arapça",
    "Japonca",
];

const TIME_SLOTS = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

const INITIAL_FORM_DATA: NeedPostFormData = {
    title: "",
    description: "",
    needDate: addDays(new Date(), 1),
    startTime: "14:00",
    durationHours: 3,
    selectedChildrenIds: [],
    languageGoal: "",
    homeworkHelp: false,
    address: "",
    district: "",
    hourlyRateOffered: 100,
};

export function CreateNeedPost({ children, onSubmit, onCancel }: CreateNeedPostProps) {
    const [formData, setFormData] = useState<NeedPostFormData>(INITIAL_FORM_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof NeedPostFormData, string>>>({});

    const updateField = <K extends keyof NeedPostFormData>(
        field: K,
        value: NeedPostFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const toggleChild = (childId: string) => {
        const newIds = formData.selectedChildrenIds.includes(childId)
            ? formData.selectedChildrenIds.filter(id => id !== childId)
            : [...formData.selectedChildrenIds, childId];
        updateField("selectedChildrenIds", newIds);
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof NeedPostFormData, string>> = {};

        if (!formData.title.trim()) {
            newErrors.title = "Başlık gerekli";
        }
        if (!formData.needDate) {
            newErrors.needDate = "Tarih seçin";
        }
        if (!formData.startTime) {
            newErrors.startTime = "Başlangıç saati seçin";
        }
        if (formData.selectedChildrenIds.length === 0) {
            newErrors.selectedChildrenIds = "En az bir çocuk seçin";
        }
        if (!formData.district) {
            newErrors.district = "İlçe seçin";
        }
        if (formData.durationHours < 2 || formData.durationHours > 8) {
            newErrors.durationHours = "Süre 2-8 saat arası olmalı";
        }
        if (formData.hourlyRateOffered < 50 || formData.hourlyRateOffered > 300) {
            newErrors.hourlyRateOffered = "Ücret ₺50-300 arası olmalı";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error("Failed to create need post:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalAmount = formData.hourlyRateOffered * formData.durationHours;
    const selectedChildren = children.filter(c =>
        formData.selectedChildrenIds.includes(c.id)
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        İhtiyaç İlanı Oluştur
                    </CardTitle>
                    <CardDescription>
                        Bakıcı ihtiyacınızı detaylı bir şekilde açıklayın
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">İlan Başlığı *</Label>
                        <Input
                            id="title"
                            placeholder="Örn: 2 çocuğum için öğleden sonra bakıcı arıyorum"
                            value={formData.title}
                            onChange={(e) => updateField("title", e.target.value)}
                            className={errors.title ? "border-red-500" : ""}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500">{errors.title}</p>
                        )}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Date Picker */}
                        <div className="space-y-2">
                            <Label>Tarih *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.needDate && "text-muted-foreground",
                                            errors.needDate && "border-red-500"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.needDate ? (
                                            format(formData.needDate, "d MMMM yyyy", { locale: tr })
                                        ) : (
                                            "Tarih seçin"
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.needDate}
                                        onSelect={(date) => date && updateField("needDate", date)}
                                        disabled={(date) => date < new Date()}
                                        locale={tr}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Start Time */}
                        <div className="space-y-2">
                            <Label>Başlangıç Saati *</Label>
                            <Select
                                value={formData.startTime}
                                onValueChange={(value) => updateField("startTime", value)}
                            >
                                <SelectTrigger className={errors.startTime ? "border-red-500" : ""}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Saat seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_SLOTS.map((time) => (
                                        <SelectItem key={time} value={time}>
                                            {time}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                            <Label>Süre: {formData.durationHours} saat</Label>
                            <Slider
                                value={[formData.durationHours]}
                                onValueChange={([value]) => updateField("durationHours", value)}
                                min={2}
                                max={8}
                                step={0.5}
                                className="py-4"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>2 saat</span>
                                <span>8 saat</span>
                            </div>
                        </div>
                    </div>

                    {/* Children Selection */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Çocuklar *
                        </Label>
                        {children.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Henüz çocuk profili eklenmemiş. Lütfen önce çocuk ekleyin.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {children.map((child) => (
                                    <Badge
                                        key={child.id}
                                        variant={formData.selectedChildrenIds.includes(child.id) ? "default" : "outline"}
                                        className="cursor-pointer py-2 px-3 text-sm"
                                        onClick={() => toggleChild(child.id)}
                                    >
                                        {child.name} ({child.age} yaş)
                                        {formData.selectedChildrenIds.includes(child.id) && (
                                            <X className="ml-1 h-3 w-3" />
                                        )}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {errors.selectedChildrenIds && (
                            <p className="text-sm text-red-500">{errors.selectedChildrenIds}</p>
                        )}
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                İlçe *
                            </Label>
                            <Select
                                value={formData.district}
                                onValueChange={(value) => updateField("district", value)}
                            >
                                <SelectTrigger className={errors.district ? "border-red-500" : ""}>
                                    <SelectValue placeholder="İlçe seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DISTRICTS.map((district) => (
                                        <SelectItem key={district} value={district}>
                                            {district}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Adres (Opsiyonel)</Label>
                            <Input
                                placeholder="Detaylı adres"
                                value={formData.address}
                                onChange={(e) => updateField("address", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Rate */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            Saatlik Ücret: ₺{formData.hourlyRateOffered}
                        </Label>
                        <Slider
                            value={[formData.hourlyRateOffered]}
                            onValueChange={([value]) => updateField("hourlyRateOffered", value)}
                            min={50}
                            max={300}
                            step={10}
                            className="py-4"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>₺50</span>
                            <span>₺300</span>
                        </div>
                        <div className="p-3 bg-primary/5 rounded-lg text-center">
                            <span className="text-sm text-muted-foreground">Toplam Ödeme: </span>
                            <span className="font-bold text-lg text-primary">₺{totalAmount}</span>
                            <span className="text-sm text-muted-foreground"> ({formData.durationHours} saat)</span>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-primary" />
                                <BookOpen className="h-4 w-4 text-primary" />
                                <div>
                                    <Label htmlFor="homework" className="cursor-pointer">Ödev Yardımı</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Bakıcı ödevlere yardımcı olsun
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="homework"
                                checked={formData.homeworkHelp}
                                onCheckedChange={(checked) => updateField("homeworkHelp", checked)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Dil Hedefi (Opsiyonel)</Label>
                            <Select
                                value={formData.languageGoal}
                                onValueChange={(value) => updateField("languageGoal", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Dil pratiği istiyorsanız seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Yok</SelectItem>
                                    {LANGUAGES.map((lang) => (
                                        <SelectItem key={lang} value={lang}>
                                            {lang}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
                        <Textarea
                            id="description"
                            placeholder="Bakıcıdan beklentilerinizi, çocuklarınızın özel ihtiyaçlarını veya diğer detayları yazın..."
                            value={formData.description}
                            onChange={(e) => updateField("description", e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* Summary */}
                    {selectedChildren.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg space-y-2">
                            <h4 className="font-semibold">Özet</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>📅 {formData.needDate && format(formData.needDate, "d MMMM", { locale: tr })}</div>
                                <div>🕐 {formData.startTime} ({formData.durationHours} saat)</div>
                                <div>👶 {selectedChildren.map(c => c.name).join(", ")}</div>
                                <div>💰 ₺{formData.hourlyRateOffered}/saat (Toplam: ₺{totalAmount})</div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    İptal
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[140px]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Yayınlanıyor...
                        </>
                    ) : (
                        "İlanı Yayınla"
                    )}
                </Button>
            </div>
        </form>
    );
}
