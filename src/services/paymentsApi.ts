/**
 * Payments API Service - Mock implementation
 */

export interface PaymentChargeRequest {
    bookingId: string;
    cardToken: string;
    amount: number;
    currency: string;
}

export interface PaymentChargeResult {
    success: boolean;
    transactionId?: string;
    error?: string;
    errorCode?: string;
}

/**
 * Process a payment charge (mock implementation)
 */
export async function processPaymentCharge(
    request: PaymentChargeRequest
): Promise<PaymentChargeResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock: 80% success rate
    const rand = Math.random();
    if (rand > 0.2) {
        return {
            success: true,
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };
    }

    // Simulate different error types based on random value
    let simulatedErrorCode = 'UNKNOWN';
    if (rand <= 0.05) simulatedErrorCode = 'INSUFFICIENT_FUNDS';
    else if (rand <= 0.10) simulatedErrorCode = 'CARD_DECLINED';
    else if (rand <= 0.15) simulatedErrorCode = '3D_FAILED';
    else simulatedErrorCode = 'SYSTEM_ERROR';

    return {
        success: false,
        error: "Ödeme başarısız",
        errorCode: simulatedErrorCode,
    };
}
