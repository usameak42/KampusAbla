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
    };

    // Basic validation for all environments (Base dependencies)
    const parsed = envSchema.safeParse(envVars);

    if (!parsed.success) {
        console.warn('⚠️ Missing environment variables:', parsed.error.format());
        return;
    }

    // Note: Payment secret keys and FCM server key are stored in edge function secrets only
    // They should NEVER be exposed to the client bundle via VITE_ prefix

    // eslint-disable-next-line no-console
    console.info('✅ Environment configuration validated successfully.');
}
