# External Integrations

**Analysis Date:** 2026-03-05

## APIs & External Services

**Database & Storage:**
- **Supabase** - Primary database and storage
  - Auth: JWT-based authentication
  - Database: PostgreSQL
  - Storage: File uploads (avatars, documents)
  - Edge Functions: Serverless backend
  - SDK: @supabase/supabase-js
  - Auth vars: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY

**Maps & Geolocation:**
- **Google Maps API**
  - Geocoding: Address to coordinates
  - Reverse geocoding: Coordinates to address
  - Directions: Route calculation
  - Distance: Haversine formula calculations
  - Browser SDK: @react-google-maps/api
  - API key: VITE_GOOGLE_MAPS_API_KEY

## Data Storage

**Databases:**
- **PostgreSQL** - Main database via Supabase
  - Connection: Managed by Supabase
  - Client: Prisma-like queries via Supabase JS client
  - Features: Row Level Security, Triggers

**File Storage:**
- **Supabase Storage** - Document and avatar storage
  - Buckets: avatars, documents
  - Uploads: Browser-side uploads
  - Access: Signed URLs with expiration

**Caching:**
- **None detected** - Client-side caching only

## Authentication & Identity

**Auth Provider:**
- **Supabase Auth**
  - Implementation: JWT tokens with refresh
  - Providers: Email/password, OAuth providers
  - Storage: Local persistence
  - Session Management: Auto-refresh enabled
  - Edge Functions: Auth enforcement

## Monitoring & Observability

**Error Tracking:**
- **Sentry**
  - SDK: @sentry/react
  - Implementation: React error boundary
  - Errors: JavaScript runtime errors

**Logs:**
- **Browser console** - Development logging
- **Supabase Edge Functions** - Server logging
- **Custom logger** - Application-specific logging

## CI/CD & Deployment

**Hosting:**
- **Supabase** - Database and Edge Functions
- **Vite** - Static asset optimization
- **Manual deployment** - Git-based workflow

**CI Pipeline:**
- **GitHub Actions** - Automated testing and deployment
- **Workflows:**
  - ci.yml - Continuous integration
  - e2e-tests.yml - End-to-end testing
  - deploy.yml - Deployment automation
  - secret-scan.yml - Security scanning

## Environment Configuration

**Required env vars:**
- VITE_SUPABASE_URL - Supabase project URL
- VITE_SUPABASE_PUBLISHABLE_KEY - Supabase public key
- VITE_GOOGLE_MAPS_API_KEY - Maps API key
- VITE_FIREBASE_API_KEY - Firebase configuration
- VITE_PAYMENT_PROVIDER - iyzico/papara
- VITE_PAYMENT_PUBLIC_KEY - Payment gateway API key
- VITE_APP_ENV - Environment (development/production)

**Secrets location:**
- .env files (not committed)
- Supabase dashboard (database credentials)
- Vercel/GitHub (secrets management)

## Webhooks & Callbacks

**Incoming:**
- **iyzico/Papara webhooks** - Payment notifications
  - Endpoint: /api/payment-webhook
  - Processing: Edge Functions
  - Integration: Payment service

- **Supabase webhooks** - Database events
  - Edge Functions: Event processing
  - Examples: New bookings, session updates

**Outgoing:**
- **FCM notifications** - Push notifications
  - Service: Firebase Cloud Messaging
  - Integration: Custom notification service
  - Events: Booking updates, session reminders

## Third-Party Services

**Payment Processing:**
- **iyzico or Papara** - Turkish payment gateways
  - Sandbox mode available
  - Sub-merchant management
  - Recurring subscriptions (IyziSub)
  - Edge Functions: Payment processing

**Real-time Features:**
- **Browser Geolocation API** - Live location tracking
- **WebSocket support** - Browser native
- **Firebase Cloud Messaging** - Push notifications

**File Processing:**
- **browser-image-compression** - Client-side image compression
  - Implementation: Avatar uploads
  - Optimization: Reduced upload size

---

*Integration audit: 2026-03-05*
```