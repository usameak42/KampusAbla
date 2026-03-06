

## Root Cause Analysis

There are **3 distinct problems** causing your published site to break:

### Problem 1: CSP Meta Tag (index.html line 10-11)
The Content-Security-Policy meta tag has multiple issues:
- `frame-ancestors` and `report-uri` are **ignored** in `<meta>` tags (only work via HTTP headers)
- `%VITE_SUPABASE_URL%` is never resolved — Vite uses `import.meta.env`, not `%VAR%` syntax in HTML
- `script-src 'self'` blocks Lovable's inline scripts → **white page**
- No `font-src` directive → fonts from `cdn.gpteng.co` are blocked

**Fix:** Replace the entire CSP meta tag with a corrected version:
- Remove `frame-ancestors` and `report-uri`
- Add `'unsafe-inline'` to `script-src`
- Add `font-src 'self' https://cdn.gpteng.co`
- Remove the unresolvable `%VITE_SUPABASE_URL%` reference

### Problem 2: `validateEnv()` throws in production (src/lib/env.ts lines 29-30, 44-47)
Two crash points:
1. Line 30: If `VITE_SUPABASE_URL` is missing → throws (this causes `supabaseUrl is required`)
2. Lines 44-47: Throws for missing optional keys like `VITE_PAYMENT_API_KEY`, `VITE_SENTRY_DSN`

**Fix:** Change both `throw` statements to `console.warn`. The app should degrade gracefully, not crash entirely.

### Problem 3: Supabase env vars not reaching the published build
The `"supabaseUrl is required"` error means `VITE_SUPABASE_URL` is `undefined` at runtime in the published build. The `.env` file exists but its values may not be getting bundled into the production build properly. This is likely a downstream effect of the CSP blocking scripts — once the inline script is blocked, the entire app module fails to load, and the Supabase client initialization crashes.

**Fix:** Problems 1 and 2 above should resolve this. The `.env` values are correct and Vite should bundle them. The CSP script block is preventing the app from even loading.

## Implementation Plan

### Step 1: Fix CSP meta tag in `index.html`
Replace line 10-11 with a corrected CSP that:
- Allows `'unsafe-inline'` in `script-src` (needed for Lovable preview and Vite)
- Adds `font-src 'self' https://cdn.gpteng.co`
- Removes unsupported `frame-ancestors` and `report-uri`
- Removes broken `%VITE_SUPABASE_URL%`

### Step 2: Fix `src/lib/env.ts` to warn instead of throw
- Line 30: Change `throw` to `console.warn` + `return`
- Lines 44-47: Change `throw` to `console.warn` (production optional keys)

Both changes ensure the app boots even when optional services aren't configured.

### Files changed
| File | Change |
|------|--------|
| `index.html` | Fix CSP meta tag |
| `src/lib/env.ts` | Replace throws with warnings |

