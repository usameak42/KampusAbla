# KampusAbla — MVP1 Audit & MVP2 Roadmap

**Generated:** 2026-03-05  
**Auditor:** Copilot Staff Engineer  
**Sources:** `.planning/codebase/` directory (ARCHITECTURE, STACK, CONVENTIONS, STRUCTURE, CONCERNS, INTEGRATIONS, TESTING) cross-referenced against the live codebase.

---

## MVP1 Status Overview (Plan vs. Reality)

### Completed & Confirmed ✅

- [x] **Phase 1 — Project Foundation:** Vite + React 18 + TypeScript, ESLint, Prettier, env files, Git workflows — all in place.
- [x] **Phase 2 — Database Schema:** 40+ Supabase migrations covering all planned tables: `users`, `parents`, `sitters`, `children`, `bookings`, `sessions`, `session_locations`, `conversations`, `messages`, `reviews`, `transactions`, `payouts`, `refunds`, `subscriptions`, `reports`, `kvkk_consents`, `audit_logs`, and more.
- [x] **Phase 3 — Authentication:** Supabase Auth with email + phone dual-verification (KA-010). `AuthContext`, `ProtectedRoute`, session timeout modal, JWT refresh — fully implemented.
- [x] **Phase 3.4 — Child Profile Management:** `useChildren.ts` with real Supabase CRUD, `AddChildForm.tsx`, `PickupDetailsForm.tsx`, `ChildrenPage.tsx` — complete.
- [x] **Phase 4 — Sitter Verification System:** Full document upload, 4-step verification, admin queue, badge system (Silver/Gold) — all implemented.
- [x] **Phase 5 — Core Pages & Navigation:** All dashboards, landing, nav, footer, role-based routing — complete.
- [x] **Phase 6 — Search & Discovery:** `useSearchSitters` with real Supabase geo-radius queries, 6 sort algorithms, advanced filter drawer, map + list toggle, `useFavorites` with localStorage persistence — complete.
- [x] **Phase 7 — Booking System:** `BookingModal`, `DateTimePicker`, `NeedPostCard`, `CreateNeedPost`, `ApplicationModal`, `useNeedPosts` (real Supabase), `useBookings` (real Supabase infinite query), `BookingCalendar` — complete.
- [x] **Phase 8 — Session Flow:** `session.ts` state machine, `SessionStatusControls`, `SessionTimer`, `EmergencyContacts`, `useSession` (real Supabase + Realtime subscription) — complete.
- [x] **Phase 9 — Location & Safety:** `useLocation` GPS hook, `locationTrackingService`, `LiveMap`, `LocationConsent` (KVKK), `ReportIncident`, `SafetyCenter` — complete.
- [x] **Phase 10 — In-App Chat:** `useChat`, `useConversations` (real Supabase Realtime), `MessageBubble`, `ChatInput`, `ConversationList`, `ChatRoom`, phone/email blocking — complete.
- [x] **Phase 12 — Payment System:** `PaymentService` class with iyzico Edge Function integration, sub-merchant creation, card tokenization, saved cards, `process-payment`, `process-refund`, `iyzico-webhook` Edge Functions — complete.
- [x] **Phase 13 — Subscription System:** Subscription types, `useSubscription`, `PlanCard`, `CurrentPlan`, `BillingHistory`, `SubscriptionPage`, `create-subscription-checkout` / `cancel-subscription` Edge Functions — UI + backend complete.
- [x] **Phase 14 — Push Notifications:** Firebase Cloud Messaging, `NotificationService`, FCM token management (`user_fcm_tokens` table), `send-push-notification` Edge Function, `NotificationContext` — complete.
- [x] **Phase 15 — Settings:** `SettingsPage`, `AccountSettings`, `SecuritySettings`, `NotificationSettings`, `PrivacySettings` — UI complete.
- [x] **Phase 16 — Legal & Compliance:** KVKK, Terms of Service, Privacy Policy, Cookie Policy, Disputes system — complete.
- [x] **Phase 17 — Admin Dashboard:** User management, verification queue, content moderation, analytics dashboard — complete.
- [x] **Phase 18 — Testing:** Unit tests for `auth`, `booking`, `cancellation`, `payment`, `review` libs; service tests for `payment` and `notifications`; hook tests; E2E Playwright specs for auth, parent/sitter journeys, payment, session tracking — complete.
- [x] **Phase 19 — Performance:** Code splitting (React.lazy across 40+ routes), React Query caching (5min staleTime/30min gcTime), image lazy loading, Supabase PgBouncer connection pooling — complete.
- [x] **Phase 20 — CI/CD:** GitHub Actions `ci.yml`, `deploy.yml`, `e2e-tests.yml`, `secret-scan.yml`, Sentry error monitoring — complete.
- [x] **Phase 21 — Post-Launch Epics (J–O):** Name immutability (KA-090), Silent Hours UI fix (KA-100), subscription messaging (KA-110/111), disputes system (KA-120/121/122), IBAN/card validation (KA-130/131/132), phone input (KA-140) — all complete.

---

### Incomplete / Partially Implemented ⚠️

- [ ] **ParentDashboard stats — hardcoded mock data** (`src/pages/dashboard/ParentDashboard.tsx:19`) — `stats.childrenCount`, `stats.activeBookings`, `upcomingBookings[]`, and `recommendedSitters[]` are all static arrays with `// TODO: Fetch real data from Supabase`.
- [ ] **SitterDashboard stats — hardcoded mock data** (`src/pages/dashboard/SitterDashboard.tsx:58`) — `stats.sessionsThisMonth`, `stats.totalEarnings`, `upcomingSessions[]` are static mock data.
- [ ] **SitterProfile page — fully mocked** (`src/pages/profile/SitterProfile.tsx:22`) — entire sitter object is hardcoded; `// TODO: Fetch from Supabase using ID from URL params` is present. (Note: a separate `src/pages/sitter/SitterProfilePage.tsx` exists with real data; `SitterProfile.tsx` appears to be an older stub.)
- [ ] **Notifications page — fully mocked** (`src/pages/notifications/Notifications.tsx:21`) — full notifications array is static. The newer `NotificationsPage.tsx` uses `useNotifications` hook with real Supabase; `Notifications.tsx` appears to be an orphaned duplicate.
- [ ] **ChildrenSelector in BookingModal — mock children list** (`src/components/booking/ChildrenSelector.tsx:35`) — `mockChildren[]` is hardcoded; does not call `useChildren` to get the authenticated parent's real children.
- [ ] **useSettings — fully mocked** (`src/hooks/useSettings.ts`) — `MOCK_SETTINGS` is used for all profile, notification, and privacy state. No Supabase reads or writes are wired up for settings persistence.
- [ ] **useReviews — submitReview is mocked** (`src/hooks/useReviews.ts:205`) — submission uses `setTimeout` with a fake `// TODO: Supabase mutation`; review data is not persisted.
- [ ] **ViewApplications — navigation TODOs** (`src/pages/need-posts/ViewApplications.tsx:90,98`) — `handleViewProfile` and `handleMessage` display toasts saying "coming soon" instead of navigating to the real sitter profile or chat routes.
- [ ] **Phase 19.1 PWA Service Worker** — not implemented. Guide exists (`pwa_implementation_guide.md`) but `vite-plugin-pwa` has not been added. Estimated effort: 6.5 hours.
- [ ] **Phase 19.2 Rate Limiting on Edge Functions** — only client-side debouncing exists. The `rate_limiting_guide.md` doc is created but Edge Function middleware has not been applied.
- [ ] **Phase 20.4 Domain & DNS** — domain not yet purchased or configured.
- [ ] **Phase 20.4 Firebase production config for E2E** — E2E tests use `e2e/setup/firebase-mock.ts`; real Firebase config needed for production notification testing.
- [ ] **Phase 20.4 Load testing** — k6 setup guide provided but not executed.
- [ ] **Phase 20.4 Backup restore procedure** — Supabase automatic backups exist but restore runbook is not documented.

---

## Architecture & Stack Alignment

### Alignment: Confirmed ✅

- [x] Vite 5 + React 18 + TypeScript — matches `STACK.md`
- [x] React Router 6 (client-side routing, `pages/` directory) — matches `ARCHITECTURE.md`
- [x] Supabase (PostgreSQL + Auth + Storage + Realtime) — confirmed integration
- [x] `@tanstack/react-query` for server-state — confirmed, with `PersistQueryClientProvider` + IndexedDB persister
- [x] Custom hooks in `src/hooks/` encapsulating business logic — confirmed
- [x] Service layer in `src/services/` for external integrations — confirmed
- [x] `src/lib/` for utilities, constants, and helpers — confirmed
- [x] `src/contexts/` for `AuthContext` + `NotificationContext` — confirmed
- [x] `src/integrations/supabase/` for Supabase client and types — confirmed
- [x] Sentry error boundary wrapping the full app — confirmed in `App.tsx`
- [x] Supabase Edge Functions for serverless backend — 15 Edge Functions deployed
- [x] Zod schemas in `src/schemas/` + custom error map — confirmed

### Alignment Fixes Needed

- [ ] **Replace `window.location.href` with React Router `useNavigate()`** — Six components use hard navigation instead of SPA routing, causing full page reloads and losing React Query cache: `UserMenu.tsx` (profile/settings links), `ParentStep1.tsx`, `ParentStep3.tsx`, `SitterStep1.tsx`, `SitterStep5.tsx`, `GlobalErrorFallback.tsx` (home link).
- [ ] **Delete orphaned stub files** — `src/pages/profile/SitterProfile.tsx` and `src/pages/notifications/Notifications.tsx` appear to be superseded by `SitterProfilePage.tsx` and `NotificationsPage.tsx` respectively. Keeping stubs creates confusion and risks wrong routes being served.
- [ ] **Verify App.tsx routes point to the correct pages** — Audit `App.tsx` route definitions to confirm that `/sitter/:id` resolves to `SitterProfilePage` (with real data) and `/notifications` resolves to `NotificationsPage`, not the mocked stubs.
- [ ] **Centralize IndexedDB usage** — `App.tsx:34` creates a raw IndexedDB persister inline. Per `CONCERNS.md`, this needs a proper abstraction layer with cleanup logic to prevent memory leaks. Extract to `src/lib/persister.ts`.
- [ ] **Enforce strict TypeScript** — `tsconfig.app.json` has `strict: false` (confirmed in `STACK.md`: "TypeScript strict mode disabled"). Enable strict mode progressively; start with `noImplicitAny`.
- [ ] **Fix duplicate local Database interface in `utils/subscriptions.ts`** — The file redefines a local `Database` interface with `any` types (lines 13–21) instead of importing from `src/integrations/supabase/types.ts`. This means DB type changes will not propagate to this utility. Replace with the canonical generated types (import `type { Database } from '@/integrations/supabase/types'`).

---

## Code Quality & Debt

### Critical (Production-Blocking) Issues

- [ ] **Connect `ChildrenSelector.tsx` to real data** — The component inside `BookingModal` shows hardcoded mock children. It must import and call `useChildren(userId)` to display the authenticated parent's real children before a booking can be genuinely submitted.
- [ ] **Connect `useSettings` to Supabase** — Implement real reads/writes for user profile info, notification preferences, privacy settings, and quiet-hours data using the `user_settings` Supabase table (migration `20260217_user_settings.sql` exists). The current mock means all settings changes are lost on page refresh.
- [ ] **Implement `submitReview` in `useReviews`** — Replace the `setTimeout` mock with a real `supabase.from('reviews').insert(...)` call to persist reviews. The `reviews` table, RLS policies, and the `review_unlocking` migration are already in place.
- [ ] **Replace mock data in `ParentDashboard.tsx`** — Fetch real `stats.childrenCount`, `activeBookings`, and `upcomingBookings` from Supabase using `useChildren`, `useBookings`, or dedicated queries.
- [ ] **Replace mock data in `SitterDashboard.tsx`** — Fetch real session count, earnings, and upcoming sessions from Supabase (`useEarnings`, `useBookings` hooks already exist).
- [ ] **Fix `ViewApplications.tsx` navigation TODOs** — Replace toast stubs with real `navigate(`/sitter/${sitterId}`)` and `navigate(`/messages/${conversationId}`)` calls.

### Type Safety Debt

- [ ] **Replace `any` in `src/lib/auth.ts`** — All 6 exported functions (`getUserRole`, `isUserAdmin`, `isUserSitter`, `isUserParent`, `isUserVerified`, `isSitterApproved`) use `user: any`. Replace with the Supabase `User` type from `@supabase/supabase-js`.
- [ ] **Replace `any` in `src/utils/subscriptions.ts`** — Lines 13, 15, 16, 21 use `any` for `Insert`, `Update`, and table definitions. Import proper types from `src/integrations/supabase/types.ts`.
- [ ] **Remove `any` casts in `useBookings.ts:24`** — `transformBooking(b: any)` should use a typed Supabase response shape. Define an interface for the raw DB row.
- [ ] **Enable `noImplicitAny` in tsconfig** — Add `"noImplicitAny": true` to `tsconfig.app.json` to prevent new `any` from creeping in.

### Security Debt

- [ ] **Restrict demo admin mode** — `src/lib/auth.ts:17`: `isDemoAdmin` reads from `localStorage`. This must be guarded with `import.meta.env.DEV` only (it already is), but also audit that no production build path can set `ka_demo_admin`. Add a comment warning about this.
- [ ] **Remove raw `console.*` calls from production service files** — `src/services/notifications.ts` has 10 `console.warn/error` calls and `src/lib/env.ts` has 4. Replace with the structured `logger` from `src/lib/logger.ts`. The `installProductionConsoleGuards()` function silences `console.log/info/debug` in production but leaves `console.warn/error` exposed.
- [ ] **Add security headers to Vercel config** — `vercel.json` exists but does not define `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, or `Content-Security-Policy` headers. These were flagged in the vulnerability assessment (`vulnerability_assessment.md`).
- [ ] **Implement client-side card tokenization** — Identified in `data_encryption_test.md` as a critical gap. Raw card data must not flow through the app; use iyzico's JS SDK to tokenize on the client before any network call. Load the iyzico JS SDK over HTTPS with Subresource Integrity (SRI) attributes (`integrity="sha384-..."`) to prevent supply-chain / MITM attacks that could compromise the tokenization step.
- [ ] **Encrypt child medical data at rest** — `data_encryption_test.md` flagged that allergy and medical notes in `children` table need column-level encryption per KVKK Article 12. Implement via a Supabase `pgcrypto` migration or application-layer encryption.

### Performance Debt

- [ ] **Split large component files** — `src/components/children/AddChildForm.tsx` (512 lines) and `src/components/need-posts/CreateNeedPost.tsx` (465 lines) exceed the 30-line function guideline and should be split into sub-components and custom hooks.
- [ ] **Optimize SELECT * queries in hooks** — `database_optimization_report.md` identified 9 hooks using `SELECT *`. Replace with explicit column lists to reduce data transfer.
- [ ] **Add 4 composite database indexes** — Per `database_optimization_report.md`, add composite indexes on `(sitter_id, booking_date)`, `(parent_id, status)`, `(session_id, timestamp)`, and `(need_post_id, status)` for 40% search improvement.
- [ ] **Add materialized views for analytics dashboards** — Current analytics queries run on live tables; materialized views would give a 95% dashboard load improvement.

### Testing Coverage Gaps

- [ ] **Add component test for `ChildrenSelector.tsx`** — This is a critical booking path; test that real children load and can be selected.
- [ ] **Add integration test for `useSettings` (once Supabase is wired up)** — Test read/write of all settings sections.
- [ ] **Add unit test for `submitReview` in `useReviews`** — Test the happy path and validation failure paths after mock is replaced with real mutation.
- [ ] **Fix 3 failing E2E payment tests** — `e2e/payment.spec.ts` has 2/5 passing. The failing tests have mock data configuration issues with saved-cards scenarios. Fix the test fixtures to match real Supabase seeded data.
- [ ] **Add E2E coverage for the complete booking flow** — `e2e/parent-journey.spec.ts` exists but the booking-creation sub-flow is marked `[/]` (partial) in the plan. Complete it end-to-end with a real Supabase test project.
- [ ] **Achieve test coverage targets per `TESTING.md`** — Services: 90%+, Components: 80%+, Utils: 95%+, Critical paths: 100%. Run `npm test -- --coverage` to generate a baseline report.

---

## Addressing Concerns & MVP2 Roadmap

### Documented Concerns from CONCERNS.md

- [ ] **Mock Data → Real API (Final sweep)** — Run a final `grep -r "TODO.*Supabase\|TODO.*API\|mock\|MOCK" src/` audit. The remaining six instances listed in the "Incomplete" section above are the known ones. Fix all before MVP1 launch.
- [ ] **Supabase types.ts file size** — At 1760 lines, this file is large but below the 2206-line concern threshold from the audit date. Keep monitoring; split by domain (auth, bookings, sessions, payments) when it hits 2500+ lines.
- [ ] **Route guards audit** — `ViewApplications.tsx` navigation TODOs could allow unauthenticated sidebar access. Verify every sensitive route is wrapped in `<ProtectedRoute>` in `App.tsx`.
- [ ] **Structured error handling standardization** — Several hooks use inconsistent error patterns. Standardize all hooks to use a `{ data, error, isLoading }` return shape consistent with React Query patterns.

### MVP2 Feature Roadmap

#### [ ] Phase A: Data Completeness (Prerequisite for MVP2 Launch)
- [ ] A.1 — Replace all remaining mock data (dashboards, reviews, settings, ChildrenSelector)
- [ ] A.2 — Wire real navigation in ViewApplications (profile + chat)
- [ ] A.3 — Implement client-side card tokenization (PCI DSS blocker)
- [ ] A.4 — Encrypt child medical data columns (KVKK Article 12 blocker)

#### [ ] Phase B: PWA & Offline Support
- [ ] B.1 — Add `vite-plugin-pwa` to project
- [ ] B.2 — Create `public/manifest.json` with app icons, theme color
- [ ] B.3 — Implement service worker with cache-first strategy for static assets
- [ ] B.4 — Implement network-first strategy for API calls
- [ ] B.5 — Build offline fallback page
- [ ] B.6 — Add "Install App" prompt component

#### [ ] Phase C: Infrastructure Hardening
- [ ] C.1 — Purchase and configure domain + DNS
- [ ] C.2 — Set security headers in `vercel.json` (X-Frame-Options, HSTS, CSP)
- [ ] C.3 — Apply rate limiting middleware to all Edge Functions (`rate_limiting_guide.md`)
- [ ] C.4 — Configure Firebase for production (replace E2E mock)
- [ ] C.5 — Execute k6 load tests (500 concurrent users baseline)
- [ ] C.6 — Document backup restore procedure and test a restore to staging

#### [ ] Phase D: Advanced Search & Discovery
- [ ] D.1 — Add gender preference filter (per PRD §6.2 Advanced filters)
- [ ] D.2 — Add university department/major filter
- [ ] D.3 — Add "International school experience" filter
- [ ] D.4 — Add age-band experience filter (7–10, 11–13, 14–16)
- [ ] D.5 — Add "Hazırlık/Prep class" toggle filter
- [ ] D.6 — Implement saved search preferences per user

#### [ ] Phase E: Language Immersion Feature Set
- [ ] E.1 — Add language-goal tagging to sessions (Turkish/English/Arabic practice)
- [ ] E.2 — Create session "language log" for parent to see what was practiced
- [ ] E.3 — Build sitter "language specialization" badge (native speaker, CEFR level)
- [ ] E.4 — Enable parents to specify language goals in booking request

#### [ ] Phase F: Enhanced Reviews & Trust
- [ ] F.1 — Complete `submitReview` Supabase integration
- [ ] F.2 — Implement two-sided review unlock (both parties must submit before either sees)
- [ ] F.3 — Build "Verified Session" badge on reviews (confirms session actually happened)
- [ ] F.4 — Add platform-level response to reviews for sitters
- [ ] F.5 — Surface weighted trust score on sitter public profile

#### [ ] Phase G: Mobile App (React Native / Expo)
- [ ] G.1 — Scaffold Expo app with TypeScript
- [ ] G.2 — Reuse service layer hooks (supabase client is browser-agnostic)
- [ ] G.3 — Implement native push notifications (Expo Notifications + FCM)
- [ ] G.4 — Implement native GPS tracking (Expo Location)
- [ ] G.5 — Submit to App Store + Google Play (TestFlight first)

#### [ ] Phase H: Analytics & Business Intelligence
- [ ] H.1 — Implement materialized views for admin analytics (95% faster)
- [ ] H.2 — Build `weekly-analytics-report` Edge Function scheduling (cron)
- [ ] H.3 — Add funnel tracking: Registration → Verification → First Booking → Retention
- [ ] H.4 — Sitter supply/demand heat map by district
- [ ] H.5 — Revenue leakage detection (off-platform contact attempts via chat)

#### [ ] Phase I: Multi-City Expansion
- [ ] I.1 — Parameterize city/district in search and sitter areas
- [ ] I.2 — Add Kadıköy pilot configuration
- [ ] I.3 — Create city-level admin roles and dashboards
- [ ] I.4 — Localize school database for new districts

#### [ ] Phase J: e-Devlet Integration (Background Check Automation)
- [ ] J.1 — Research formal e-Devlet integration protocol (kamu.turkiye.gov.tr)
- [ ] J.2 — **Establish KVKK lawful basis and obtain explicit consent before implementation** — Criminal records are "special category personal data" under KVKK Article 6; processing requires explicit written consent (Article 10) and a documented Data Processing Record. Prepare these legal documents before any technical integration.
- [ ] J.3 — Implement automated criminal record verification via e-Devlet API (only after legal authorization from J.2 is confirmed)
- [ ] J.4 — Remove manual document upload step for criminal records once automated
- [ ] J.5 — Add "e-Devlet Verified" super-badge tier

---

## Immediate Next Steps

> Prioritized by impact on MVP1 production launch. Complete all items in **Priority 1** before soft launch.

### Priority 1 — Launch Blockers (Do These First)

- [ ] **1.1 — Fix `ChildrenSelector.tsx`**: Replace `mockChildren` array with `const { children } = useChildren(userId)` and map real data. This is a critical path for the core booking flow.
- [ ] **1.2 — Wire `useSettings` to Supabase**: Implement `fetchSettings()` to read from the `user_settings` table and `updateSettings()` to write back. Use `useQuery`/`useMutation` from React Query for consistency with other hooks.
- [ ] **1.3 — Implement `submitReview` mutation**: Replace the `setTimeout` stub in `useReviews.ts:205` with `supabase.from('reviews').insert(reviewPayload)`. The DB table and RLS policies are ready.
- [ ] **1.4 — Replace `ParentDashboard` mock stats**: Use `useBookings({ userId, viewMode: 'parent' })` (already exists) to populate `activeBookings`. Use `useChildren(userId)` for `childrenCount`. Add a `useQuery` for the top 3 upcoming bookings.
- [ ] **1.5 — Replace `SitterDashboard` mock stats**: Use `useEarnings(userId)` (hook exists) for `totalEarnings` and `sessionsThisMonth`. Query upcoming confirmed bookings with `useBookings`.
- [ ] **1.6 — Fix `ViewApplications.tsx` navigation**: Replace `handleViewProfile` toast with `navigate(`/sitter/${sitterId}`)` and `handleMessage` with `navigate(`/messages`, { state: { sitterId } })`.

### Priority 2 — Security & Type Safety

- [ ] **2.1 — Add Supabase `User` type to `auth.ts`**: Import `type { User } from '@supabase/supabase-js'` and replace all 6 `user: any` parameters.
- [ ] **2.2 — Replace raw `console.*` in `notifications.ts`**: Replace 10 `console.warn/error` calls with `logger.warn(...)` / `logger.error(...)`.
- [ ] **2.3 — Add security headers to `vercel.json`**: Add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy` header with appropriate `script-src`, `connect-src`, `img-src`, and `frame-ancestors` directives (CSP is the primary XSS defence flagged in the vulnerability assessment).
- [ ] **2.4 — Audit and delete orphaned page stubs**: Confirm routes in `App.tsx` point to `SitterProfilePage` and `NotificationsPage`. Then delete `src/pages/profile/SitterProfile.tsx` and `src/pages/notifications/Notifications.tsx` to prevent confusion.
- [ ] **2.5 — Replace `window.location.href` with `navigate()`**: Fix `UserMenu.tsx` (2 links), `ParentStep1.tsx`, `ParentStep3.tsx`, `SitterStep1.tsx`, `SitterStep5.tsx`, and the `GlobalErrorFallback.tsx` home link.

### Priority 3 — Performance Wins (Pre-Launch Polish)

- [ ] **3.1 — Extract `persister` to `src/lib/persister.ts`**: Move the IndexedDB `createIDBPersister` inline function out of `App.tsx` into its own module with cleanup handling.
- [ ] **3.2 — Split `AddChildForm.tsx`**: Break the 512-line component into `<ChildBasicInfo />`, `<ChildPickupDetails />`, `<ChildAllergiesNotes />` sub-components.
- [ ] **3.3 — Add composite DB indexes via migration**: Create `supabase/migrations/YYYYMMDD_performance_indexes.sql` with the 4 composite indexes from `database_optimization_report.md`.

### Priority 4 — Test Coverage

- [ ] **4.1 — Fix 3 failing E2E payment tests**: Update `e2e/payment.spec.ts` test fixtures for saved-card scenarios to match real DB seed data.
- [ ] **4.2 — Complete E2E booking flow**: Add the full parent booking-creation sub-flow to `e2e/parent-journey.spec.ts`.
- [ ] **4.3 — Add `useSettings` integration test**: Once Supabase is wired (from 1.2), add a test to `src/hooks/__tests__/useSettings.test.ts` covering fetch + update.
- [ ] **4.4 — Run coverage report baseline**: Execute `npm test -- --coverage` and document current coverage percentages as a baseline before MVP2 begins.

### Priority 5 — MVP2 Kickoff

- [ ] **5.1 — Purchase domain and configure DNS** (Action required by project owner)
- [ ] **5.2 — Configure Firebase production credentials** and remove `e2e/setup/firebase-mock.ts`
- [ ] **5.3 — Execute k6 load test** against staging environment
- [ ] **5.4 — Begin PWA implementation** following `pwa_implementation_guide.md`
- [ ] **5.5 — Apply rate limiting to Edge Functions** following `rate_limiting_guide.md`
- [ ] **5.6 — Kick off Phase D (Advanced Search)** — highest user value for MVP2

---

*Audit generated by Copilot Agent · 2026-03-05 · KampusAbla MVP1 → MVP2 transition*
