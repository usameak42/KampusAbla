# Third-Party Services Integration Guide

## Overview

This document outlines the third-party services integrated with the KampusAbla platform and provides setup instructions for each.

## Currently Integrated Services

### ✅ Supabase (Backend-as-a-Service)

**Services Provided:**
- Authentication (email, phone, OAuth)
- PostgreSQL Database
- Cloud Storage (file uploads)
- Real-time subscriptions
- RESTful API

**Configuration:**
- Client: `src/integrations/supabase/client.ts`
- Types: `src/integrations/supabase/types.ts`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

**Authentication Features:**
- Email/password authentication
- Phone number (OTP) authentication
- OAuth providers (Google, Facebook, etc.)
- Session persistence (localStorage)
- Auto token refresh

**Storage Features:**
- File upload/download
- Public and private buckets
- Image transformations
- CDN delivery

**Real-time Features:**
- Database change subscriptions
- Presence (online/offline status)
- Broadcast messaging

---

## Services To Be Integrated

### 🔜 Payment Gateway (iyzico or Papara)

**Purpose:** Process payments between parents and sitters with 10% platform fee

**Required For:**
- Booking payments
- Sitter payouts
- Subscription billing
- Refund processing

**Integration Points:**
```typescript
// src/services/payment.ts
export interface PaymentService {
  processPayment(amount: number, currency: string): Promise<PaymentResult>;
  createSubMerchant(sitterData: SitterData): Promise<MerchantId>;
  requestPayout(sitterId: string, amount: number): Promise<PayoutResult>;
  processRefund(transactionId: string, amount: number): Promise<RefundResult>;
}
```

**Environment Variables Needed:**
```bash
VITE_PAYMENT_API_KEY=your-api-key
VITE_PAYMENT_SECRET_KEY=your-secret-key
VITE_PAYMENT_SANDBOX=true  # false in production
```

**Documentation:**
- iyzico: https://dev.iyzipay.com
- Papara: https://merchant.papara.com/developers

---

### 🔜 Push Notifications (Firebase Cloud Messaging)

**Purpose:** Send real-time notifications for booking updates, messages, session status

**Required For:**
- Booking request notifications
- Message notifications
- Session status updates
- Review reminders

**Integration Points:**
```typescript
// src/services/notifications.ts
export interface NotificationService {
  requestPermission(): Promise<boolean>;
  subscribeToTopic(topic: string): Promise<void>;
  sendNotification(userId: string, notification: Notification): Promise<void>;
}
```

**Environment Variables Needed:**
```bash
VITE_FCM_SERVER_KEY=your-server-key
VITE_FCM_VAPID_KEY=your-vapid-key
```

**Setup Steps:**
1. Create Firebase project at https://console.firebase.google.com
2. Enable Cloud Messaging
3. Generate VAPID keys for web push
4. Add firebase-messaging-sw.js to public folder
5. Request notification permissions from users

---

### 🔜 Geolocation (Google Maps API)

**Purpose:** Location selection, live tracking, distance calculations

**Required For:**
- Sitter area selection
- Parent address input
- Live session tracking (GPS)
- Distance-based search filters
- Route visualization

**Integration Points:**
```typescript
// src/services/maps.ts
export interface MapsService {
  geocodeAddress(address: string): Promise<Coordinates>;
  reverseGeocode(lat: number, lng: number): Promise<Address>;
  calculateDistance(origin: Coordinates, destination: Coordinates): Promise<number>;
  getDirections(origin: Coordinates, destination: Coordinates): Promise<Route>;
}
```

**Environment Variables Needed:**
```bash
VITE_GOOGLE_MAPS_API_KEY=your-api-key
```

**Setup Steps:**
1. Create project at https://console.cloud.google.com
2. Enable these APIs:
   - Maps JavaScript API
   - Geocoding API
   - Distance Matrix API
   - Directions API
3. Create API key with restrictions:
   - HTTP referrers: `kampusabla.com/*`, `localhost:*`
4. Enable billing (required for production)

**KVKK Compliance:**
- Obtain explicit consent before collecting location data
- Display privacy notice about location tracking
- Allow users to disable location sharing
- Auto-delete location data after 7 days (configurable)

---

## Integration Priority

Based on the implementation plan phases:

1. **Phase 3-4:** Authentication (✅ Complete via Supabase)
2. **Phase 5-7:** Maps API (for search and booking)
3. **Phase 9:** Maps API + Live Location (for session tracking)
4. **Phase 12:** Payment Gateway (for transactions)
5. **Phase 14:** Push Notifications (for alerts)

## Testing

Each service integration should include:
- Unit tests for service wrapper functions
- Integration tests with sandbox/test APIs
- Error handling for API failures
- Retry logic for network issues
- Rate limiting compliance

## Security Best Practices

- Store API keys in environment variables (never in code)
- Use different keys for dev/staging/production
- Implement server-side API calls for sensitive operations
- Validate all API responses
- Log API errors for monitoring
- Implement rate limiting to prevent abuse

## Cost Monitoring

- Track API usage against quotas
- Set up billing alerts
- Optimize API calls (caching, batching)
- Review usage monthly
- Consider alternative providers if costs escalate

## Support Contacts

- **Supabase:** support@supabase.io
- **iyzico:** entegrasyon@iyzico.com
- **Papara:** info@papara.com
- **Google Maps:** https://console.cloud.google.com/support
- **Firebase:** https://firebase.google.com/support
