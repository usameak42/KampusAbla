

# KampusAbla — Build Error Fix & Production Recovery Plan

## Current State

The build has **24 Edge Function TypeScript errors** and **10 frontend TypeScript errors**. These must be fixed before any feature work can proceed.

---

## Build Errors — Categorized

### Category 1: Missing Imports in Frontend Components

**ParentStep1.tsx (line 276)** — Uses `<Info>` icon but doesn't import it from lucide-react.
- **Fix:** Add `Info` to the lucide-react import on line 13.

**SitterStep1.tsx (line 281)** — Uses `<PhoneInput>` but doesn't import it.
- **Fix:** Add `import { PhoneInput } from "@/components/ui/phone-input"` to imports.

**SitterStep1.tsx (line 284)** — Parameter `e` has implicit `any` type.
- **Fix:** Type the `onChange` callback parameter as `React.ChangeEvent<HTMLInputElement>`.

### Category 2: Implicit `any` Types in Dashboard/Admin Queries

**ParentDashboard.tsx** (lines 111, 129) — Destructured `sittersData` and `childrenData` have implicit `any[]` types.
**SitterDashboard.tsx** (lines 162, 180, 240, 258) — Same pattern for `parentsData` and `childrenData`.
**VerificationQueue.tsx** (line 73) — `sittersData` has implicit `any[]` type.

- **Fix for all:** Add explicit type annotations to the destructured variables, e.g.:
  ```typescript
  const { data: sittersData }: { data: { id: string; full_name: string }[] | null } = ...
  ```
  Or cast inline: `as { id: string; full_name: string }[]`

### Category 3: Edge Function — `setMinutes` Extra Argument

**rate-limit.ts (line 97)** — `setMinutes(roundedMinutes, 0, 0, 0)` passes 4 args but `Date.setMinutes` accepts max 3 (minutes, seconds, milliseconds). The 4th arg (extra `0`) is invalid.
- **Fix:** Change to `windowStart.setMinutes(roundedMinutes, 0, 0)` (3 args).

### Category 4: Edge Function — `error` is `unknown` Type (8 occurrences)

All `catch (error)` blocks access `error.message` without narrowing the type. Affected files:
- `create-sub-merchant/index.ts` (line 112)
- `delete-account/index.ts` (line 137)
- `export-user-data/index.ts` (line 240)
- `health-check/index.ts` (line 43)
- `process-payment/index.ts` (line 182)
- `process-refund/index.ts` (line 147)
- `iyzico-webhook/index.ts` (lines 232, 238)

- **Fix for all:** Change `catch (error)` to `catch (error: unknown)` and use `(error instanceof Error ? error.message : 'Unknown error')` or cast `(error as Error).message`.

### Category 5: Edge Function — `string | null` Not Assignable to `string | undefined`

The `createCorsResponse` function's 4th parameter is typed as `requestOrigin?: string` (optional = `string | undefined`), but callers pass `origin` which is `string | null` from `request.headers.get('origin')`. Affected files:
- `delete-account/index.ts` (lines 77, 100, 129, 138)
- `iyzico-webhook/index.ts` (lines 146, 165, 220, 241)
- `process-payment/index.ts` (lines 100, 177, 183)

- **Fix:** Update `createCorsResponse` in `_shared/cors.ts` to accept `requestOrigin?: string | null` instead of `requestOrigin?: string`. This is the single-point fix that resolves all 11 occurrences.

### Category 6: Edge Function — `async` Missing on `verifyWebhookSignature`

**iyzico-webhook/index.ts (line 18)** — Function uses `await` but is not declared `async`.
- **Fix:** Change `function verifyWebhookSignature(` to `async function verifyWebhookSignature(` and update return type to `Promise<boolean>`.

### Category 7: Edge Function — `getRateLimitHeaders` Type Mismatch

**process-payment/index.ts (line 91)** — `RATE_LIMITS.BOOKING_CREATE` is `{ action, maxRequests, windowMinutes }` but `getRateLimitHeaders` expects `RateLimitConfig` which also requires `identifier`. 
- **Fix:** Pass a full config object: `getRateLimitHeaders(rateLimitResult, { identifier: user.id, ...RATE_LIMITS.BOOKING_CREATE })`.

### Category 8: Edge Function — Non-existent Property Access

**weekly-analytics-report/index.ts (line 92)** — `safety.incident_rate_per_1000` accessed on `{}` type.
- **Fix:** Type `safety` as `Record<string, any>` or use `(safety as any).incident_rate_per_1000`.

---

## Implementation Phases

### [ ] Phase 1 — Fix All Build Errors (13 files, ~30 changes)

**Objective:** Get the build passing with zero TypeScript errors.

| # | Task | Files |
|---|------|-------|
| 1 | Add `Info` to lucide-react import | `src/components/registration/parent/ParentStep1.tsx` |
| 2 | Add `PhoneInput` import + type `e` param | `src/components/registration/sitter/SitterStep1.tsx` |
| 3 | Add type annotations to destructured query results | `src/pages/dashboard/ParentDashboard.tsx`, `src/pages/dashboard/SitterDashboard.tsx`, `src/pages/admin/VerificationQueue.tsx` |
| 4 | Fix `setMinutes` call (remove extra arg) | `supabase/functions/_shared/rate-limit.ts` |
| 5 | Accept `null` in `createCorsResponse` origin param | `supabase/functions/_shared/cors.ts` |
| 6 | Add `async` to `verifyWebhookSignature` | `supabase/functions/iyzico-webhook/index.ts` |
| 7 | Fix `error.message` access (type narrowing) | 6 edge function files |
| 8 | Fix `getRateLimitHeaders` call with full config | `supabase/functions/process-payment/index.ts` |
| 9 | Fix `safety` type in weekly report | `supabase/functions/weekly-analytics-report/index.ts` |

**Expected outcome:** `npm run build` passes, edge functions deploy without type errors.

**Safety constraints:**
- No schema changes
- No logic changes — only type fixes and missing imports
- All existing tests must continue to pass

