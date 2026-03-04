/**
 * Payment Service Integration
 * Provider: iyzico or Papara (to be determined)
 * 
 * This service handles all payment processing for the platform including:
 * - Booking payments with 10% platform fee
 * - Sitter payouts
 * - Refund processing
 * - Sub-merchant management
 */

export type PaymentProvider = "iyzico" | "papara";

export interface PaymentConfig {
    provider: PaymentProvider;
    publicKey: string;
    sandboxMode: boolean;
    apiBaseUrl: string;
}

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    error?: string;
}

export interface RefundResult {
    success: boolean;
    refundId?: string;
    error?: string;
}

interface PaymentApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

interface PaymentTransactionPayload {
    transactionId?: string;
    id?: string;
}

interface RefundPayload {
    refundId?: string;
    id?: string;
}

interface SubMerchantPayload {
    subMerchantId?: string;
    id?: string;
}

export interface CardTokenizationResult {
    success: boolean;
    token?: string;
    error?: string;
}

export interface CardDetails {
    cardholderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvc: string;
}

export class PaymentService {
    private config: PaymentConfig;

    constructor() {
        this.config = {
            provider: (import.meta.env.VITE_PAYMENT_PROVIDER as PaymentProvider) || "iyzico",
            publicKey: import.meta.env.VITE_PAYMENT_PUBLIC_KEY || "",
            sandboxMode: import.meta.env.VITE_PAYMENT_SANDBOX === "true",
            apiBaseUrl: import.meta.env.VITE_PAYMENT_API_BASE_URL || "/api",
        };
    }

    private async post<T>(path: string, payload: Record<string, unknown>): Promise<PaymentApiResponse<T>> {
        const response = await fetch(`${this.config.apiBaseUrl}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Payment-Provider": this.config.provider,
                ...(this.config.publicKey ? { "X-Payment-Public-Key": this.config.publicKey } : {}),
            },
            body: JSON.stringify({
                ...payload,
                provider: this.config.provider,
                sandbox: this.config.sandboxMode,
            }),
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Payment API error (${response.status})`,
            };
        }

        return response.json() as Promise<PaymentApiResponse<T>>;
    }

    /**
     * Process a payment for a booking
     * @param amount Amount in TRY
     * @param currency Currency code (default: TRY)
     */
    async processPayment(
        amount: number,
        bookingId: string,
        sitterSubMerchantKey: string,
        paymentCard: {
            cardHolderName: string;
            cardNumber: string;
            expireMonth: string;
            expireYear: string;
            cvc: string;
        },
        buyer: {
            id: string;
            name: string;
            surname: string;
            email: string;
            gsmNumber: string;
            identityNumber: string;
            registrationAddress: string;
            city: string;
            country: string;
        }
    ): Promise<PaymentResult> {
        // Call Supabase Edge Function
        const { supabase } = await import('@/integrations/supabase/client');

        const { data, error } = await supabase.functions.invoke('process-payment', {
            body: {
                amount,
                bookingId,
                sitterSubMerchantKey,
                paymentCard,
                buyer,
            },
        });

        if (error) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                error: error.message || 'Ödeme işlemi başarısız oldu',
            };
        }

        if (!data.success) {
            return {
                success: false,
                error: data.error || 'Ödeme işlemi başarısız oldu',
            };
        }

        return {
            success: true,
            transactionId: data.paymentId,
        };
    }

    /**
     * Request a payout to a sitter
     * @param sitterId Sitter's user ID
     * @param amount Amount in TRY
     */
    async requestPayout(sitterId: string, amount: number, priority: boolean = false): Promise<PaymentResult> {
        // Validate minimum amount
        if (amount < 20) {
            return { success: false, error: "Minimum ödeme tutarı ₺20'dir." };
        }

        // Note: Payout Edge Function not yet implemented
        // For now, return simulation
        const delay = priority ? 400 : 1200;
        await new Promise((resolve) => setTimeout(resolve, delay));

        return {
            success: true,
            transactionId: `payout_${Math.random().toString(36).substring(7)}${priority ? '_fast' : ''}`,
        };
    }

    /**
     * Process a refund for a cancelled booking
     * @param transactionId Original transaction ID
     * @param amount Refund amount in TRY
     */
    async processRefund(transactionId: string, amount: number): Promise<RefundResult> {
        // Call Supabase Edge Function
        const { supabase } = await import('@/integrations/supabase/client');

        const { data, error } = await supabase.functions.invoke('process-refund', {
            body: {
                transactionId,
                amount,
            },
        });

        if (error) {
            return { success: false, error: error.message || 'İade işlemi başarısız oldu' };
        }

        if (!data.success) {
            return { success: false, error: data.error || 'İade işlemi başarısız oldu' };
        }

        return {
            success: true,
            refundId: data.refundId,
        };
    }

    /**
     * Create a sub-merchant account for a sitter (required for payouts)
     * @param sitterData Sitter's identity and banking information
     */
    async createSubMerchant(sitterData: Record<string, unknown>): Promise<string> {
        // Call Supabase Edge Function
        const { supabase } = await import('@/integrations/supabase/client');

        const { data, error } = await supabase.functions.invoke('create-sub-merchant', {
            body: { sitterData },
        });

        if (error) {
            throw new Error(error.message || "Alt üye hesap oluşturulamadı");
        }

        if (!data.success) {
            throw new Error(data.error || "Alt üye hesap oluşturulamadı");
        }

        const subMerchantKey = data.subMerchantKey;
        if (!subMerchantKey) {
            throw new Error("Ödeme sağlayıcısı alt üye anahtarı döndürmedi");
        }

        return subMerchantKey;
    }

    /**
     * Tokenize card information (simulation)
     * @param cardData Sensitive card details
     */
    async tokenizeCard(cardData: CardDetails): Promise<CardTokenizationResult> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock tokenization logic
        // In a real implementation, this would involve a client-side SDK call 
        // to the payment provider (e.g., iyzico.js or Papara SDK)
        if (cardData.cardNumber.length >= 15) {
            return {
                success: true,
                token: `tok_${Math.random().toString(36).substring(7)}`,
            };
        }

        return {
            success: false,
            error: "Geçersiz kart bilgileri",
        };
    }

    /**
     * Create a recurring subscription plan (IyziSub)
     * @param planId The internal plan ID
     * @param cardToken The tokenized card to charge
     * @param userEmail User's email for notification
     */
    async createSubscription(planId: string, cardToken: string, userEmail: string): Promise<PaymentResult> {
        // Simulation for development/demo
        if (this.config.sandboxMode || !this.config.publicKey) {
            await new Promise((resolve) => setTimeout(resolve, 1500));

            return {
                success: true,
                transactionId: `sub_${Math.random().toString(36).substring(7)}`,
            };
        }

        const result = await this.post<PaymentTransactionPayload>("/subscriptions/create", {
            planId,
            cardToken,
            email: userEmail
        });

        if (!result.success) {
            return { success: false, error: result.error || "Subscription creation failed" };
        }

        return {
            success: true,
            transactionId: result.data?.id,
        };
    }

    /**
     * Cancel an active subscription
     * @param subscriptionReferenceCode The unique subscription reference code from provider
     */
    async cancelSubscription(subscriptionReferenceCode: string): Promise<PaymentResult> {
        if (this.config.sandboxMode || !this.config.publicKey) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            return { success: true };
        }

        const result = await this.post<{ status: string }>("/subscriptions/cancel", {
            subscriptionReferenceCode
        });

        if (!result.success) {
            return { success: false, error: result.error || "Subscription cancellation failed" };
        }

        return { success: true };
    }
}

export const paymentService = new PaymentService();
