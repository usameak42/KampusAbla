/**
 * Session Timer Component - Displays elapsed/remaining time
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Play, Pause } from "lucide-react";
import { differenceInSeconds, format } from "date-fns";

interface SessionTimerProps {
    startTime: Date;
    scheduledEnd: Date;
    isActive: boolean;
}

export function SessionTimer({ startTime, scheduledEnd, isActive }: SessionTimerProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!isActive) return;

        // Calculate initial elapsed time
        setElapsed(differenceInSeconds(new Date(), startTime));

        const interval = setInterval(() => {
            setElapsed(differenceInSeconds(new Date(), startTime));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, isActive]);

    // Format time
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    // Calculate remaining time
    const remainingSeconds = differenceInSeconds(scheduledEnd, new Date());
    const remainingMinutes = Math.max(0, Math.floor(remainingSeconds / 60));
    const isOvertime = remainingSeconds < 0;

    return (
        <Card className={`${isActive ? "border-green-500" : ""}`}>
            <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                    {/* Elapsed Time */}
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isActive ? "bg-green-100" : "bg-gray-100"}`}>
                            {isActive ? (
                                <Play className="h-4 w-4 text-green-600" />
                            ) : (
                                <Pause className="h-4 w-4 text-gray-500" />
                            )}
                        </div>
                        <div>
                            <p className="text-2xl font-mono font-bold">{formattedTime}</p>
                            <p className="text-xs text-muted-foreground">Geçen Süre</p>
                        </div>
                    </div>

                    {/* Remaining Time */}
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                            <Clock className={`h-4 w-4 ${isOvertime ? "text-red-500" : "text-muted-foreground"}`} />
                            <span className={`text-lg font-medium ${isOvertime ? "text-red-500" : ""}`}>
                                {isOvertime ? `+${Math.abs(remainingMinutes)}` : remainingMinutes} dk
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isOvertime ? "Süre aşımı" : "Kalan süre"}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Başlangıç: {format(startTime, "HH:mm")}</span>
                        <span>Bitiş: {format(scheduledEnd, "HH:mm")}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${isOvertime ? "bg-red-500" : "bg-green-500"}`}
                            style={{
                                width: `${Math.min(100, (elapsed / differenceInSeconds(scheduledEnd, startTime)) * 100)}%`
                            }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
