# KampusAbla - Usama's To-Do List

## Payment Integration (iyzico/Papara)
- [ ] **Sign up for iyzico or Papara merchant account**
  - You need: Business registration documents for Turkey
  - Get: API keys (production + sandbox)
  - Add keys to Lovable secrets when ready

- [x] **Escrow Setup**
  - ✅ Already implemented in `process-payment` edge function
  - Needs: Your merchant account approval
  - Test with sandbox keys first

- [x] **Sitter Payout Configuration**
  - ✅ Already implemented in `process-refund` edge function
  - Needs: Bank account verification for sitters
  - Configure payout schedule (weekly/monthly)

## GPS Tracking Implementation
- [ ] **Google Maps API Key**
  - Sign up at: https://console.cloud.google.com
  - Enable: Maps JavaScript API, Geolocation API
  - Get API key
  - Add to Lovable secrets as `GOOGLE_MAPS_API_KEY`

- [x] **Test Real-Time Tracking**
  - ✅ Code is implemented in `useSessionTracking.ts`
  - ✅ Location tracking service implemented in `services/locationTracking.ts`
  - ✅ Session location DB table exists (`session_locations`)
  - Test with actual mobile devices (needs Google Maps API key)
  - Verify location accuracy

## Background Check Integration
- [ ] **Research Turkish background check providers**
  - Options: e-Devlet integration OR third-party service
  - If using e-Devlet: Need government API approval
  - If using third-party: Get API keys

- [x] **Implement Background Check Review System**
  - ✅ Manual document review implemented in `VerificationQueue.tsx`
  - ✅ Admin can approve/reject verifications
  - ✅ `sitter_verifications` table tracks `background_check_url`, `verification_status`
  - Future: Automated verification via API

## Firebase Push Notifications
- [ ] **Firebase Project Setup**
  - Already configured (firebase config exists)
  - Verify: Project is active in Firebase Console
  - Check: Cloud Messaging is enabled

## KVKK Compliance
- [x] **Database & Consent Tracking**
  - ✅ `kvkk_consents` table exists with consent types
  - ✅ Consent checkboxes added to Parent registration (`ParentStep1.tsx`)
  - ✅ Consent checkboxes added to Sitter registration (`SitterStep1.tsx`, `SitterStep5.tsx`)
  - ✅ Child data consent in `AddChildForm.tsx`
  - ✅ Location consent component (`LocationConsent.tsx`)
  - ✅ Legal pages exist: KVKK, Privacy Policy, Terms of Service

- [ ] **Legal Review**
  - Review KVKK policy text in legal pages
  - Consider: Hiring KVKK compliance consultant
  - Update consent forms if needed

## User Rights (KVKK)
- [x] **Account Deletion** - ✅ `AccountDeletionModal.tsx` implemented
- [x] **Data Export** - ✅ `export-user-data` edge function implemented
- [x] **Profile Editing** - ✅ Settings pages implemented

## Session Tracking
- [x] **Session Status Machine**
  - ✅ Status types defined in `src/types/session.ts`
  - ✅ Transitions: pending → on-way → arrived → in-progress → completed
  - ✅ `useSession` hook with real-time subscriptions
  - ✅ Session status notifications sent to other party
  - ✅ Build error fixed (status key mismatch corrected)

## Testing Checklist
- [ ] **End-to-End Parent Flow**
  - Sign up → Add child → Post need → Accept application → Complete session → Review
  
- [ ] **End-to-End Sitter Flow**
  - Sign up → Submit verification → Get approved → Apply to need → Complete session → Get paid

- [ ] **Admin Flow**
  - Review verifications → Approve/reject → Handle reports

## Production Deployment
- [ ] **Custom Domain Setup** (after testing)
- [ ] **Production API Keys** (payment, maps, firebase)
- [ ] **Database Backup Strategy**
- [ ] **Monitoring Setup** (error tracking)
