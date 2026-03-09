# KampusAbla - Usama's To-Do List

## Payment Integration (iyzico/Papara)
- [ ] **Sign up for iyzico or Papara merchant account**
  - You need: Business registration documents for Turkey
  - Get: API keys (production + sandbox)
  - Add keys to Lovable secrets when ready

- [ ] **Escrow Setup**
  - Already implemented in `process-payment` edge function
  - Needs: Your merchant account approval
  - Test with sandbox keys first

- [ ] **Sitter Payout Configuration**
  - Already implemented in `process-refund` edge function
  - Needs: Bank account verification for sitters
  - Configure payout schedule (weekly/monthly)

## GPS Tracking Implementation
- [ ] **Google Maps API Key**
  - Sign up at: https://console.cloud.google.com
  - Enable: Maps JavaScript API, Geolocation API
  - Get API key
  - Add to Lovable secrets as `GOOGLE_MAPS_API_KEY`

- [ ] **Test Real-Time Tracking**
  - Code is implemented in `useSessionTracking.ts`
  - Test with actual mobile devices
  - Verify location accuracy

## Background Check Integration
- [ ] **Research Turkish background check providers**
  - Options: e-Devlet integration OR third-party service
  - If using e-Devlet: Need government API approval
  - If using third-party: Get API keys

- [ ] **Implement Background Check API**
  - Currently: Manual document review only
  - Future: Automated verification via API

## Firebase Push Notifications
- [ ] **Firebase Project Setup**
  - Already configured (firebase config exists)
  - Verify: Project is active in Firebase Console
  - Check: Cloud Messaging is enabled

## KVKK Compliance
- [ ] **Legal Review**
  - Review KVKK policy text in legal pages
  - Consider: Hiring KVKK compliance consultant
  - Update consent forms if needed

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
