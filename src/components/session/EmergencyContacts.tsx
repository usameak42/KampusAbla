/**
 * Emergency Contacts Component - Quick access to emergency contacts
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Phone,
    User,
    Star,
    AlertTriangle,
} from "lucide-react";
import type { EmergencyContact } from "@/types/session";

interface EmergencyContactsProps {
    contacts: EmergencyContact[];
    onCall: (phone: string) => void;
}

export function EmergencyContacts({ contacts, onCall }: EmergencyContactsProps) {
    // Emergency services
    const emergencyServices = [
        { name: "Acil Yardım", phone: "112", color: "bg-red-500" },
        { name: "Polis", phone: "155", color: "bg-blue-500" },
        { name: "Sağlık", phone: "112", color: "bg-green-500" },
    ];

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Acil Durumda
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Parent Contacts */}
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Ebeveyn İletişim</p>
                    {contacts.map((contact, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                        >
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium flex items-center gap-1">
                                        {contact.name}
                                        {contact.isPrimary && (
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{contact.relation}</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => onCall(contact.phone)}
                            >
                                <Phone className="h-3 w-3" />
                                Ara
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Emergency Services */}
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Acil Hizmetler</p>
                    <div className="grid grid-cols-3 gap-2">
                        {emergencyServices.map((service) => (
                            <Button
                                key={service.phone}
                                variant="outline"
                                className="h-auto py-2 flex-col gap-1"
                                onClick={() => onCall(service.phone)}
                            >
                                <div className={`w-6 h-6 rounded-full ${service.color} flex items-center justify-center`}>
                                    <Phone className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-xs">{service.name}</span>
                                <span className="text-xs font-bold">{service.phone}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
