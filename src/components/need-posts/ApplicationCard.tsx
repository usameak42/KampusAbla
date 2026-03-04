/**
 * Application Card Component - Displays a single application from a sitter
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
    Star,
    GraduationCap,
    Languages,
    Clock,
    Banknote,
    CheckCircle,
    XCircle,
    MessageSquare,
    Shield,
    Award
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export interface Application {
    id: string;
    needPostId: string;
    sitterId: string;
    sitterName: string;
    sitterPhoto?: string;
    sitterUniversity: string;
    sitterDepartment: string;
    sitterYear: number;
    sitterRating: number;
    sitterReviewCount: number;
    sitterCompletedSessions: number;
    sitterLanguages: string[];
    // sitterBadgeLevel removed for KA-020
    isVerified: boolean;
    message: string;
    proposedRate?: number;
    originalRate: number;
    status: "pending" | "accepted" | "rejected";
    createdAt: Date;
}

interface ApplicationCardProps {
    application: Application;
    onAccept: (applicationId: string) => void;
    onReject: (applicationId: string) => void;
    onViewProfile: (sitterId: string) => void;
    onMessage: (sitterId: string) => void;
    isProcessing?: boolean;
}

export function ApplicationCard({
    application,
    onAccept,
    onReject,
    onViewProfile,
    onMessage,
    isProcessing = false,
}: ApplicationCardProps) {
    const isPending = application.status === "pending";
    const isAccepted = application.status === "accepted";
    const isRejected = application.status === "rejected";

    // Rate comparison
    const hasProposedRate = application.proposedRate !== undefined;
    const isLowerRate = hasProposedRate && application.proposedRate! < application.originalRate;
    const isHigherRate = hasProposedRate && application.proposedRate! > application.originalRate;

    return (
        <Card className={`transition-all ${isAccepted ? "border-green-500 bg-green-50/50" :
            isRejected ? "opacity-60" :
                "hover:shadow-md"
            }`}>
            <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-14 w-14 cursor-pointer" onClick={() => onViewProfile(application.sitterId)}>
                        <AvatarImage src={application.sitterPhoto} alt={application.sitterName} />
                        <AvatarFallback className="text-lg">
                            {application.sitterName.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3
                                className="font-semibold text-lg cursor-pointer hover:text-primary"
                                onClick={() => onViewProfile(application.sitterId)}
                            >
                                {application.sitterName}
                            </h3>

                            {application.isVerified && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Doğrulanmış
                                </Badge>
                            )}
                            {isAccepted && (
                                <Badge className="bg-green-500 text-white">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Kabul Edildi
                                </Badge>
                            )}
                            {isRejected && (
                                <Badge variant="secondary">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reddedildi
                                </Badge>
                            )}
                        </div>

                        {/* University Info */}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <GraduationCap className="h-4 w-4" />
                            <span>{application.sitterUniversity}</span>
                            <span className="text-gray-300">•</span>
                            <span>{application.sitterDepartment}, {application.sitterYear}. sınıf</span>
                        </div>

                        {/* Rating & Sessions */}
                        <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{application.sitterRating.toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground">
                                    ({application.sitterReviewCount} değerlendirme)
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Shield className="h-4 w-4" />
                                <span>{application.sitterCompletedSessions} seans</span>
                            </div>
                        </div>

                        {/* Languages */}
                        <div className="flex items-center gap-1 mt-2">
                            <Languages className="h-4 w-4 text-muted-foreground" />
                            <div className="flex gap-1 flex-wrap">
                                {application.sitterLanguages.map((lang) => (
                                    <Badge key={lang} variant="outline" className="text-xs">
                                        {lang}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Message */}
                <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm italic">"{application.message}"</p>
                </div>

                {/* Rate Info */}
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-primary" />
                        <span className="text-sm">
                            {hasProposedRate ? "Önerilen Ücret:" : "Ücret:"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasProposedRate ? (
                            <>
                                <span className={`font-bold text-lg ${isLowerRate ? "text-amber-600" :
                                    isHigherRate ? "text-green-600" :
                                        "text-primary"
                                    }`}>
                                    ₺{application.proposedRate}/saat
                                </span>
                                <span className="text-sm text-muted-foreground line-through">
                                    ₺{application.originalRate}
                                </span>
                                {isLowerRate && (
                                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                                        -%{Math.round((1 - application.proposedRate! / application.originalRate) * 100)}
                                    </Badge>
                                )}
                            </>
                        ) : (
                            <span className="font-bold text-lg text-primary">
                                ₺{application.originalRate}/saat
                            </span>
                        )}
                    </div>
                </div>

                {/* Applied time */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                        {formatDistanceToNow(application.createdAt, { addSuffix: true, locale: tr })} başvurdu
                    </span>
                </div>
            </CardContent>

            <CardFooter className="pt-0 gap-2">
                {isPending && (
                    <>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onMessage(application.sitterId)}
                            disabled={isProcessing}
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Mesaj
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => onReject(application.id)}
                            disabled={isProcessing}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reddet
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => onAccept(application.id)}
                            disabled={isProcessing}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Kabul Et
                        </Button>
                    </>
                )}

                {isAccepted && (
                    <Button className="w-full" onClick={() => onMessage(application.sitterId)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Mesaj Gönder
                    </Button>
                )}

                {isRejected && (
                    <p className="text-sm text-muted-foreground text-center w-full">
                        Bu başvuru reddedildi
                    </p>
                )}
            </CardFooter>
        </Card>
    );
}
