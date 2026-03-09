# Division of Responsibilities

## What I (AI) Can Implement
✅ = Already done | 🔨 = Can do now | ⏳ = Needs your input first

### Backend & Database
- ✅ All database tables and RLS policies
- ✅ Edge functions for payments, notifications, webhooks
- ✅ Admin verification queue (VerificationQueue.tsx)
- ✅ Booking system with transactions
- ✅ Review system with safety flags
- ✅ Session tracking with status transitions
- ✅ Real-time GPS tracking implementation (`useSessionTracking.ts`, `locationTracking.ts`)
- ✅ Notification system (in-app notifications with realtime)
- ✅ Search and filter optimizations (DB indexes, query memoization, page reset on filter change)

### Frontend Components
- ✅ All UI components (booking, reviews, chat, etc.)
- ✅ Admin dashboard and verification queue
- ✅ Parent and sitter dashboards
- ✅ Legal pages (KVKK, privacy, terms)
- ✅ Consent checkboxes in registration (Parent & Sitter)
- ✅ Child data consent in AddChildForm
- ✅ Location consent component
- ✅ Improve verification status display (step indicators, doc checklist, themed colors)
- 🔨 Add document preview in upload forms

### Authentication
- ✅ Email/password authentication
- ✅ Email verification
- ✅ Consent tracking in signup flow (kvkk_consents)
- ⏳ OTP implementation (needs SMS provider from you)

### User Rights (KVKK)
- ✅ Account deletion (`AccountDeletionModal.tsx` + `delete-account` edge function)
- ✅ Data export (`export-user-data` edge function)
- ✅ Profile editing (Settings pages)

### Session Management
- ✅ Session status machine (pending → on-way → arrived → in-progress → completed)
- ✅ Real-time session subscriptions
- ✅ Session status notifications
- ✅ Handover confirmation flow
- ✅ GPS location tracking during sessions

---

## What YOU Need to Provide

### Legal & Compliance (CRITICAL - Before Launch)
1. ⚠️ **KVKK Legal Documents**
   - Hire Turkish lawyer specialized in data protection
   - Get drafted: Privacy Notice, Consent Forms, Retention Policy
   - Cost: ₺5,000-15,000
   - Time: 1-2 weeks
   - **I will:** Update the legal pages with your final texts

2. ⚠️ **Business Registration**
   - Register company in Turkey
   - Get tax ID (Vergi Kimlik No)
   - Needed for: Payment gateway, VERBİS registration
   - **I will:** Help configure once you have credentials

### Payment Gateway (CRITICAL - Before Launch)
3. ⚠️ **iyzico or Papara Merchant Account**
   - Sign up: https://www.iyzico.com or https://www.papara.com
   - Required documents:
     - Business registration certificate
     - Tax ID
     - Bank account details
     - ID of business owner
   - Approval time: 3-5 business days
   - **I will:** Integrate API keys once you receive them

### Third-Party Services (CRITICAL - Before Launch)
4. ⚠️ **SMS Provider for OTP**
   - Options: Netgsm, iletimerkezi, or Twilio
   - Sign up: https://www.netgsm.com.tr (recommended for Turkey)
   - Cost: ~₺0.10 per SMS
   - Get: API key, sender name
   - **I will:** Integrate OTP system with your credentials

5. ⚠️ **Google Maps API Key**
   - Sign up: https://console.cloud.google.com
   - Enable: Maps JavaScript API, Geolocation API
   - Cost: Free tier covers ~28,000 map loads/month
   - Paid tier: $7 per 1,000 loads after free tier
   - **I will:** Configure maps and tracking features

### Firebase (For Push Notifications)
6. ⚠️ **Firebase Project Verification**
   - Check if your Firebase project is active
   - Go to: https://console.firebase.google.com
   - Enable: Cloud Messaging
   - Get: Server key (if not already configured)
   - **I will:** Set up push notification system

### Testing & Validation (Before Launch)
7. **Test User Accounts**
   - Create test accounts:
     - 2-3 parent accounts
     - 2-3 sitter accounts
     - 1 admin account
   - Use real university emails for sitter tests
   - **I will:** Provide test scenarios and verify functionality

8. **Real Document Samples**
   - Provide sample documents for testing:
     - Student ID card (sample)
     - Government ID (sample/redacted)
     - Background check PDF (sample)
   - **I will:** Test upload and verification flow

### Content & Copywriting (Before Launch)
9. **Platform Content**
   - Write: Welcome emails, notification messages
   - Translate: If you want Arabic support
   - Review: All Turkish text in the app
   - **I will:** Implement your final copy

10. **Support Email**
    - Set up: support@kampusabla.com
    - Set up: kvkk@kampusabla.com (for data protection)
    - **I will:** Update contact forms with your emails

### Post-MVP (Can Wait)
11. **e-Devlet Integration** (Optional)
    - For automated background checks
    - Requires: Government API access (hard to get)
    - Alternative: Keep manual review
    - **I will:** Implement if you get API access

12. **VERBİS Registration**
    - Required when you reach 1,000+ users
    - Register at: https://verbis.kvkk.gov.tr
    - **I will:** Provide documentation support

---

## Immediate Action Plan for YOU

### Week 1-2: Legal & Business Setup
- [ ] Hire KVKK lawyer → Get legal documents
- [ ] Register business (if not done)
- [ ] Apply for payment gateway merchant account

### Week 3: Service Setup
- [ ] Sign up for SMS provider (Netgsm)
- [ ] Create Google Maps API key
- [ ] Verify Firebase is active
- [ ] Set up support emails

### Week 4: Testing Preparation
- [ ] Create test user accounts
- [ ] Gather sample documents
- [ ] Review all Turkish text in app

### Week 5: Give Me Credentials
- [ ] Share payment gateway API keys (via Lovable secrets)
- [ ] Share SMS provider API key
- [ ] Share Google Maps API key
- [ ] Provide final legal texts

**After Week 5:**
→ I can complete all integrations
→ We can do end-to-end testing
→ Platform is ready for soft launch

---

## What I'll Do Once You Provide Above

### Immediate Implementation (1-2 days):
1. Integrate payment gateway with your API keys
2. Set up SMS OTP with your provider
3. Configure Google Maps for tracking
4. ~~Add consent checkboxes with your legal text~~ ✅ DONE
5. Update all email/SMS templates with your copy

### Testing Phase (3-5 days):
1. End-to-end parent journey
2. End-to-end sitter journey
3. Admin verification workflow
4. Payment flow (sandbox mode)
5. GPS tracking accuracy

### Polish & Deploy (2-3 days):
1. Fix any bugs found in testing
2. Performance optimization
3. Security audit
4. Production deployment
5. Monitoring setup

**Total timeline from "you give me credentials" to "ready for launch": 7-10 days**

---

## Summary Table

| What | Who | When | Status |
|------|-----|------|--------|
| Database & backend | Me (AI) | Done | ✅ |
| UI components | Me (AI) | Done | ✅ |
| Admin verification | Me (AI) | Done | ✅ |
| Consent checkboxes | Me (AI) | Done | ✅ |
| Account deletion & data export | Me (AI) | Done | ✅ |
| Session tracking & GPS | Me (AI) | Done | ✅ |
| Location consent component | Me (AI) | Done | ✅ |
| KVKK legal texts | YOU | Week 1-2 | ⏳ |
| Payment gateway signup | YOU | Week 1-2 | ⏳ |
| SMS provider signup | YOU | Week 3 | ⏳ |
| Google Maps API | YOU | Week 3 | ⏳ |
| Test accounts | YOU | Week 4 | ⏳ |
| API integration | Me (AI) | After you provide keys | 🔜 |
| End-to-end testing | Both | Week 6-7 | 🔜 |
| Production launch | Both | Week 8 | 🔜 |

**Bottom line:** 
- I've built ~85% of the functionality
- You need to provide the external services/credentials (~3-4 weeks)
- Then I can complete the remaining 15% (~1-2 weeks)
- Total to launch: ~6-8 weeks from now
