# Performance Monitoring

## Scope

This document defines the production performance monitoring baseline for:

1. Sentry performance tracing
2. Core Web Vitals
3. Slow query detection for React Query flows
4. Critical path spans (booking creation and payment processing)
5. Performance budgets
6. Sentry dashboard setup

## Instrumentation Implemented

1. Sentry browser tracing is enabled in `src/main.tsx`.
2. Web Vitals reporting is initialized on app startup in `src/main.tsx` via `initWebVitalsTracking()`.
3. Page load budget tracking is enabled per route in `src/App.tsx` via `trackPageLoad()`.
4. Slow query detection is enabled in `src/hooks/useBookings.ts`:
   - API call tracing: `trackApiCall("bookings.list", ...)`
   - Slow query reporting: `trackSlowQuery(...)`
5. Critical flow spans are enabled:
   - Booking creation: `src/services/atomicBooking.ts`
   - Payment processing: `src/services/atomicBooking.ts` and `src/pages/payments/PaymentCheckoutPage.tsx`

## Performance Budgets

Configured in `src/lib/performance.ts`:

1. `LCP < 2500ms`
2. `INP < 200ms`
3. `CLS < 0.1`
4. `FCP < 1800ms`
5. `TTFB < 800ms`
6. `API_RESPONSE_TIME < 500ms`
7. `PAGE_LOAD_TIME < 3000ms`

## Sentry Dashboard Setup

Create a Sentry dashboard in the project with widgets filtered to `environment:production`:

1. Web Vitals trends:
   - `measurement:CLS`
   - `measurement:LCP`
   - `measurement:INP`
2. API latency:
   - Span operation `op:http.client`
   - Filter on `span.description:api.bookings.list`
3. Critical flow durations:
   - `transaction.op:custom`
   - Filter by span names:
     - `booking_creation`
     - `payment_processing`
4. Alert rules:
   - Trigger when p95 page load exceeds 3000ms for 5 minutes
   - Trigger when p95 API span exceeds 500ms for 5 minutes

## Verification Checklist

1. Open the app in production mode and navigate across routes.
2. Confirm performance spans appear in Sentry Performance.
3. Confirm Web Vitals measurements are visible in Sentry.
4. Confirm warnings are created when budgets are exceeded.
