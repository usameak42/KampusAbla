# 🌍 Environment Setup & Validation

KampusAbla requires proper environment variables for robust operation, divided between baseline frontend necessities and strictly enforced production dependencies.

## 1. Local Development (`.env.development`)
To run the app locally, copy `.env.example` to `.env.development` and fill in:
- `VITE_SUPABASE_URL`: Your Supabase instance URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon key.
- `VITE_GOOGLE_MAPS_API_KEY`: Google maps key for geocoding and location displays.

*Note: Payment, Sentry, and Firebase keys are optional in local development but the application may degrade gracefully (or mock logic).*

## 2. Production Deployment (`.env.production`)
For staging and production deployments on Vercel or any other CI/CD edge infrastructure, **all critical environment variables must be populated.**

The application includes an automated boot guard (`src/lib/env.ts`) that will **FAIL FAST** and refuse to render or initialize if the following production variables are missing:
- `VITE_PAYMENT_API_KEY`: Active Payment API key
- `VITE_PAYMENT_SECRET_KEY`: Active Payment Secret key
- `VITE_FCM_SERVER_KEY`: Firebase Cloud Messaging token for push notifications
- `VITE_SENTRY_DSN`: Sentry logging DSN

### Setting Secrets in Vercel
1. Go to your Project Settings > Environment Variables in Vercel.
2. Add the variables securely.
3. Trigger a fresh deployment ensuring the variables are built into the UI bundles.

## 3. Validation Logic
The `validateEnv()` function executes immediately on app boot within `src/main.tsx`. If it detects missing variables, it throws a runtime Exception preventing corrupted state operations.

## 4. Security
- Never prefix sensitive backend administrative secrets (like `SUPABASE_SERVICE_ROLE_KEY`) with `VITE_`.
- `VITE_` prefixed variables are exposed to the browser.
- Payment 'Secret' Keys (`VITE_PAYMENT_SECRET_KEY`) should ideally move to edge functions in a fully robust architecture, but currently checked on frontend boot to ensure the overall system possesses configuration. Ensure proper CORS limits are on the keys if possible.
