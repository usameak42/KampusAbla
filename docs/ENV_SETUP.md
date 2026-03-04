# Environment Variables Setup

## Overview

The project uses environment variables to configure different aspects of the application across different environments (development, staging, production).

## Files

- **`.env.example`** - Template file showing all available environment variables (committed to git)
- **`.env`** - Main environment file for local development (gitignored)
- **`.env.development`** - Development-specific configuration (gitignored)
- **`.env.staging`** - Staging environment configuration (gitignored)
- **`.env.production`** - Production environment configuration (gitignored)

## Setup Instructions

### For New Developers

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required values in `.env` with your local development credentials

3. For Supabase configuration, get credentials from the team or create a new Supabase project

### Environment Variables

#### Required (Development)
- `VITE_SUPABASE_PROJECT_ID` - Supabase project identifier
- `VITE_SUPABASE_URL` - Supabase API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anonymous/public key

#### Optional (for full platform features)
- `VITE_GOOGLE_MAPS_API_KEY` - For location/maps features
- `VITE_PAYMENT_API_KEY` - For payment processing (iyzico/Papara)
- `VITE_FCM_SERVER_KEY` - For push notifications
- Feature flags (`VITE_ENABLE_*`) - To enable/disable specific features

## Using Environment Variables

In your code, access environment variables using Vite's import.meta.env:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const appEnv = import.meta.env.VITE_APP_ENV;
```

**Important:** All client-side environment variables must be prefixed with `VITE_` to be exposed by Vite.

## Security Notes

- **NEVER** commit `.env`, `.env.development`, `.env.staging`, or `.env.production` files
- Only commit `.env.example` as a template
- Production secrets should be configured on the production server directly
- Service role keys and private API keys should NEVER be exposed to the client

## Environment-Specific Configuration

### Development
- Uses local/development Supabase project
- Feature flags disabled for unstable features
- Payment gateway in sandbox mode

### Staging
- Uses staging Supabase project
- All features enabled for testing
- Payment gateway in sandbox mode
- Similar to production but with test data

### Production
- Uses production Supabase project
- All features enabled
- Payment gateway in live mode
- Real user data
