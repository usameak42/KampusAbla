

# Fix: White/Blank Pages

## Problem
The app calls `validateEnv()` in `main.tsx` before rendering. This function requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to be set. Since no Supabase project is connected, these are undefined, causing the validation to throw an error and crash the app — resulting in a blank white page on every route.

Additionally, the Supabase client (`src/integrations/supabase/client.ts`) is created with `undefined` values, which also causes errors when any component tries to use auth.

## Solution

1. **Make env validation non-fatal in development** — Change `validateEnv()` to log a warning instead of throwing when Supabase vars are missing in non-production mode.

2. **Add fallback values in Supabase client** — Provide placeholder URL/key so `createClient` doesn't crash (it will fail gracefully on actual API calls instead of on initialization).

3. **Handle AuthContext gracefully** — When Supabase isn't configured, set `loading` to `false` and `user` to `null` immediately so the landing page renders.

## Files to Change

- **`src/lib/env.ts`** — Warn instead of throw for missing Supabase vars in dev
- **`src/integrations/supabase/client.ts`** — Add fallback placeholder values
- **`src/contexts/AuthContext.tsx`** — Gracefully handle Supabase connection failure

