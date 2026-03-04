/**
 * Maps standard payment provider error codes to Turkish user-facing messages.
 */

export type PaymentErrorCode =
    | 'INSUFFICIENT_FUNDS'
    | 'CARD_DECLINED'
    | '3D_FAILED'
    | 'EXPIRED_CARD'
    | 'INVALID_CARD'
    | 'SYSTEM_ERROR'
    | 'UNKNOWN';

export function getPaymentErrorMessage(code: PaymentErrorCode | string): string {
    switch (code) {
        case 'INSUFFICIENT_FUNDS':
            return 'Kartınızda yeterli bakiye bulunmamaktadır.';
        case 'CARD_DECLINED':
            return 'Kartınız banka tarafından reddedildi. Lütfen bankanızla iletişime geçin.';
        case '3D_FAILED':
            return '3D Secure doğrulaması başarısız oldu. Lütfen telefonunuza gelen şifreyi doğru girdiğinizden emin olun.';
        case 'EXPIRED_CARD':
            return 'Kartınızın son kullanma tarihi geçmiş. Lütfen geçerli bir kart kullanın.';
        case 'INVALID_CARD':
            return 'Kart numarası veya güvenlik kodu (CVC) hatalı.';
        case 'SYSTEM_ERROR':
            return 'Ödeme altyapısında geçici bir sorun oluştu. Lütfen biraz sonra tekrar deneyin.';
        case 'UNKNOWN':
        default:
            return 'Ödeme işlemi sırasında beklenmeyen bir hata oluştu.';
    }
}
