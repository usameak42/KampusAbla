/**
 * Secrets Management Utility
 * 
 * Provides secure access to environment variables and secrets
 * with validation and type safety.
 */

interface SecretConfig {
    name: string;
    required: boolean;
    description: string;
}

// List of all required secrets for the application
const SECRET_CONFIGS: SecretConfig[] = [
    {
        name: 'SUPABASE_URL',
        required: true,
        description: 'Supabase project URL'
    },
    {
        name: 'SUPABASE_ANON_KEY',
        required: true,
        description: 'Supabase anonymous/public key'
    },
    {
        name: 'SUPABASE_SERVICE_ROLE_KEY',
        required: true,
        description: 'Supabase service role key (server-side)'
    },
    {
        name: 'IYZICO_API_KEY',
        required: true,
        description: 'iyzico payment API key'
    },
    {
        name: 'IYZICO_SECRET_KEY',
        required: true,
        description: 'iyzico payment secret key'
    },
    {
        name: 'IYZICO_BASE_URL',
        required: false,
        description: 'iyzico API base URL (defaults to sandbox)'
    },
    {
        name: 'FIREBASE_SERVICE_ACCOUNT',
        required: true,
        description: 'Firebase service account JSON for push notifications'
    },
    {
        name: 'GOOGLE_MAPS_API_KEY',
        required: true,
        description: 'Google Maps API key for location services'
    },
    {
        name: 'JWT_SECRET',
        required: true,
        description: 'JWT token signing secret'
    },
    {
        name: 'JWT_REFRESH_SECRET',
        required: true,
        description: 'JWT refresh token secret'
    },
    {
        name: 'SENTRY_DSN',
        required: false,
        description: 'Sentry error tracking DSN'
    },
    {
        name: 'ENVIRONMENT',
        required: false,
        description: 'Application environment (development/staging/production)'
    },
    {
        name: 'CORS_ALLOWED_ORIGINS',
        required: false,
        description: 'Comma-separated list of allowed CORS origins'
    }
];

/**
 * Secret validation error class
 */
export class SecretValidationError extends Error {
    constructor(missingSecrets: string[]) {
        const message = `Missing required environment variables:\n${missingSecrets.map(s => `- ${s}`).join('\n')}`;
        super(message);
        this.name = 'SecretValidationError';
    }
}

/**
 * Secrets manager class for secure access to environment variables
 */
export class SecretsManager {
    private static secrets: Map<string, string> = new Map();
    private static validated = false;

    /**
     * Validate all required secrets are present
     * @throws SecretValidationError if required secrets are missing
     */
    static validateSecrets(): void {
        if (this.validated) return;

        const missing: string[] = [];

        for (const config of SECRET_CONFIGS) {
            if (config.required && !this.getSecret(config.name)) {
                missing.push(config.name);
            }
        }

        if (missing.length > 0) {
            throw new SecretValidationError(missing);
        }

        this.validated = true;
        // Secrets validated successfully — no logging here to avoid circular dependency with logger
    }

    /**
     * Get a secret value from environment or cache
     * @param key - The secret key name
     * @returns The secret value
     */
    static getSecret(key: string): string | undefined {
        // Check cache first
        if (this.secrets.has(key)) {
            return this.secrets.get(key);
        }

        // Get from environment
        const value = this.getFromEnvironment(key);

        // Cache the value
        if (value !== undefined) {
            this.secrets.set(key, value);
        }

        return value;
    }

    /**
     * Get a required secret or throw error
     * @param key - The secret key name
     * @returns The secret value
     * @throws Error if secret is not found
     */
    static getRequiredSecret(key: string): string {
        const value = this.getSecret(key);
        if (value === undefined) {
            throw new Error(`Required secret '${key}' is not set`);
        }
        return value;
    }

    /**
     * Get secret with type safety
     * @param key - The secret key name
     * @returns The secret value as type T
     */
    static getTypedSecret<T extends string | number | boolean>(key: string, type: 'string' | 'number' | 'boolean'): T | undefined {
        const value = this.getSecret(key);
        if (value === undefined) return undefined;

        switch (type) {
            case 'number': {
                const num = Number(value);
                return isNaN(num) ? undefined : (num as T);
            }
            case 'boolean':
                return (value.toLowerCase() === 'true' || value === '1') as T;
            default:
                return value as T;
        }
    }

    /**
     * Get all secrets for debugging (masked)
     * @returns Object with masked secret values
     */
    static getAllSecretsMasked(): Record<string, string> {
        const result: Record<string, string> = {};

        for (const config of SECRET_CONFIGS) {
            const value = this.getSecret(config.name);
            if (value) {
                // Mask sensitive values
                if (config.name.toLowerCase().includes('key') || config.name.toLowerCase().includes('secret')) {
                    result[config.name] = this.maskValue(value);
                } else {
                    result[config.name] = value;
                }
            } else {
                result[config.name] = '[NOT SET]';
            }
        }

        return result;
    }

    /**
     * Clear the secrets cache
     */
    static clearCache(): void {
        this.secrets.clear();
        this.validated = false;
    }

    /**
     * Get secret from environment with fallbacks
     */
    private static getFromEnvironment(key: string): string | undefined {
        // Try process.env first (for server-side)
        if (typeof process !== 'undefined' && process.env[key]) {
            return process.env[key];
        }

        // Try import.meta.env (for client-side with Vite)
        if (typeof import.meta !== 'undefined' && import.meta.env[key]) {
            return import.meta.env[key];
        }

        return undefined;
    }

    /**
     * Mask a sensitive value for logging
     */
    private static maskValue(value: string): string {
        if (value.length <= 8) {
            return '*'.repeat(value.length);
        }
        return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
    }

    /**
     * Check if running in development
     */
    static isDevelopment(): boolean {
        return this.getTypedSecret('ENVIRONMENT', 'string') === 'development';
    }

    /**
     * Check if running in production
     */
    static isProduction(): boolean {
        return this.getTypedSecret('ENVIRONMENT', 'string') === 'production';
    }

    /**
     * Get Supabase configuration
     */
    static getSupabaseConfig() {
        return {
            url: this.getRequiredSecret('SUPABASE_URL'),
            anonKey: this.getRequiredSecret('SUPABASE_ANON_KEY'),
            serviceRoleKey: this.getRequiredSecret('SUPABASE_SERVICE_ROLE_KEY'),
        };
    }

    /**
     * Get payment configuration
     */
    static getPaymentConfig() {
        return {
            iyizicoApiKey: this.getRequiredSecret('IYZICO_API_KEY'),
            iyizicoSecretKey: this.getRequiredSecret('IYZICO_SECRET_KEY'),
            iyizicoBaseUrl: this.getSecret('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com',
        };
    }

    /**
     * Get notification configuration
     */
    static getNotificationConfig() {
        return {
            firebaseServiceAccount: this.getRequiredSecret('FIREBASE_SERVICE_ACCOUNT'),
        };
    }

    /**
     * Get maps configuration
     */
    static getMapsConfig() {
        return {
            googleMapsApiKey: this.getRequiredSecret('GOOGLE_MAPS_API_KEY'),
        };
    }

    /**
     * Get JWT configuration
     */
    static getJWTConfig() {
        return {
            secret: this.getRequiredSecret('JWT_SECRET'),
            refreshSecret: this.getRequiredSecret('JWT_REFRESH_SECRET'),
        };
    }

    /**
     * Get monitoring configuration
     */
    static getMonitoringConfig() {
        return {
            sentryDsn: this.getSecret('SENTRY_DSN'),
        };
    }
}

// Export singleton instance for backward compatibility
export default SecretsManager;

// Validate secrets on import in production
if (SecretsManager.isProduction()) {
    try {
        SecretsManager.validateSecrets();
    } catch (error) {
        console.error('❌ Secrets validation failed:', error);
        if (error instanceof SecretValidationError) {
            // In production, fail fast
            throw error;
        }
    }
}
