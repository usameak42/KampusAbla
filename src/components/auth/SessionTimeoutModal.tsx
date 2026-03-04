import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

export function SessionTimeoutModal() {
    const { showWarning, warningType, keepSessionAlive, logout } = useSessionTimeout();

    if (!showWarning) return null;

    const warningMessage = warningType === 'inactivity'
        ? 'Hareketsizlik nedeniyle oturumunuz 2 dakika içinde sonlandırılacaktır.'
        : 'Güvenliğiniz için oturum süreniz 2 dakika içinde dolacaktır.';

    return (
        <AlertDialog open={showWarning} onOpenChange={(open) => {
            if (!open) keepSessionAlive();
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Oturum Süresi Doluyor</AlertDialogTitle>
                    <AlertDialogDescription>
                        {warningMessage}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel onClick={logout} className="mt-0 sm:mt-0">
                        Çıkış Yap
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={keepSessionAlive}>
                        Oturumu Açık Tut
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
