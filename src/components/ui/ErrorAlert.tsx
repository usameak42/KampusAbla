import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorAlertProps {
    title?: string;
    error: Error | string | unknown;
    onRetry?: () => void;
    className?: string;
}

export function ErrorAlert({
    title = "Bir hata oluştu",
    error,
    onRetry,
    className = ""
}: ErrorAlertProps) {
    // Extract error message safely
    const errorMessage =
        typeof error === 'string' ? error :
            error instanceof Error ? error.message :
                "İşlem sırasında beklenmeyen bir ağ hatası oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.";

    return (
        <Alert variant="destructive" className={`my-4 ${className}`}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-3">
                <p className="text-sm opacity-90">{errorMessage}</p>

                {onRetry && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="w-fit mt-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                        <RefreshCw className="mr-2 h-3.5 w-3.5" />
                        Tekrar Dene
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}
