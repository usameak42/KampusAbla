import { z } from 'zod';

const envSchema = z.object({
    VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
    VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "VITE_SUPABASE_PUBLISHABLE_KEY is required"),
    // Maps API key might be missing in some dev setups, but required for core functionality
    VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
});

export function validateEnv() {
    const envVars = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        VITE_PAYMENT_API_KEY: import.meta.env.VITE_PAYMENT_API_KEY,
        VITE_PAYMENT_SECRET_KEY: import.meta.env.VITE_PAYMENT_SECRET_KEY,
        VITE_FCM_SERVER_KEY: import.meta.env.VITE_FCM_SERVER_KEY,
        VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    };

    // 1. Basic validation for all environments (Base dependencies)
    const parsed = envSchema.safeParse(envVars);

    if (!parsed.success) {
        if (import.meta.env.DEV) {
            console.warn('⚠️ Missing environment variables (Supabase features disabled):', parsed.error.format());
            return;
        }
        console.error('❌ Invalid environment variables:', parsed.error.format());
        throw new Error('Invalid or missing essential environment variables. Check console for details.');
    }

    // 2. Strict validation for Production Readiness
    if (import.meta.env.PROD) {
        const prodRequiredKeys = [
            { key: 'VITE_PAYMENT_API_KEY', value: envVars.VITE_PAYMENT_API_KEY },
            { key: 'VITE_PAYMENT_SECRET_KEY', value: envVars.VITE_PAYMENT_SECRET_KEY },
            { key: 'VITE_FCM_SERVER_KEY', value: envVars.VITE_FCM_SERVER_KEY },
            { key: 'VITE_SENTRY_DSN', value: envVars.VITE_SENTRY_DSN },
        ];

        const missingProdKeys = prodRequiredKeys.filter(k => !k.value || k.value.trim() === '');

        if (missingProdKeys.length > 0) {
            const missingNames = missingProdKeys.map(k => k.key).join(', ');
            console.error(`❌ Missing critical production environment variables: ${missingNames}`);
            throw new Error(`Production Boot Failed: Missing required environment variables [${missingNames}]`);
        }
    }

    console.info('✅ Environment configuration validated successfully.');
}
