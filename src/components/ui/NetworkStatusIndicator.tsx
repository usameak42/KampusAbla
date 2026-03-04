import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function NetworkStatusIndicator() {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 z-50 sticky top-0 w-full shadow-md animate-in slide-in-from-top-2">
            <WifiOff className="h-4 w-4" />
            İnternet bağlantınız koptu. Bazı özellikler kullanılamayabilir ve değişiklikleriniz bağlantı sağlandığında eşitlenecektir.
        </div>
    );
}
