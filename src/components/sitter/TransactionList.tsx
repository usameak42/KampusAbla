import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { formatPrice } from "@/types/subscription";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/hooks/useEarnings";

interface TransactionListProps {
    transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
    if (transactions.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
                Henüz kazanç kaydı bulunmuyor.
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Hizmet</TableHead>
                        <TableHead>Toplam Tutar</TableHead>
                        <TableHead>Komisyon (%10)</TableHead>
                        <TableHead className="text-right">Kazancınız</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                                {format(new Date(transaction.createdAt), "d MMMM yyyy", { locale: tr })}
                            </TableCell>
                            <TableCell>
                                {transaction.booking ? (
                                    <div className="flex flex-col">
                                        <span>Bakıcılık Hizmeti</span>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(transaction.booking.booking_date), "dd.MM.yyyy")} - {transaction.booking.start_time}
                                        </span>
                                    </div>
                                ) : (
                                    "Özel Hizmet"
                                )}
                            </TableCell>
                            <TableCell>{formatPrice(transaction.amount)}</TableCell>
                            <TableCell className="text-destructive">
                                -{formatPrice(transaction.platformFee)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                                {formatPrice(transaction.sitterAmount)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
