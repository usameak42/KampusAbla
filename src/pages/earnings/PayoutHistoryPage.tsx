import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEarnings, Payout } from "@/hooks/useEarnings";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    Download,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { formatPrice } from "@/types/subscription";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function PayoutHistoryPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        payouts,
        isLoading,
    } = useEarnings(user?.id || "");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const filteredPayouts = payouts.filter(payout => {
        const matchesSearch = payout.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payout.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === "all" || payout.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: Payout["status"]) => {
        switch (status) {
            case "processed":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Tamamlandı</Badge>;
            case "pending":
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Bekliyor</Badge>;
            case "failed":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Hata</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout>
            <div className="flex flex-col gap-6 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Ödeme Geçmişi</h1>
                            <p className="text-muted-foreground text-sm">
                                Tüm geçmiş ödeme taleplerinizi ve durumlarını inceleyin.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Dışa Aktar
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="İşlem ID veya ödeme yöntemi ara..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Tüm Durumlar</option>
                                    <option value="processed">Tamamlandı</option>
                                    <option value="pending">Bekliyor</option>
                                    <option value="failed">Hata</option>
                                </select>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>İşlem ID</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Tutar</TableHead>
                                    <TableHead>Yöntem</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlem Tarihi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Yükleniyor...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPayouts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            Kayıt bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayouts.map((payout) => (
                                        <TableRow key={payout.id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {payout.id.substring(0, 13)}...
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(payout.createdAt), "d MMMM yyyy", { locale: tr })}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {formatPrice(payout.amount)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {payout.paymentMethod || "Banka Hesabı"}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(payout.status)}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {payout.processedAt ?
                                                    format(new Date(payout.processedAt), "d MMM yyyy", { locale: tr }) :
                                                    "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination (Mock) */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Toplam <strong>{filteredPayouts.length}</strong> işlem gösteriliyor
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" disabled>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-primary text-primary">
                            1
                        </Button>
                        <Button variant="outline" size="icon" disabled>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
