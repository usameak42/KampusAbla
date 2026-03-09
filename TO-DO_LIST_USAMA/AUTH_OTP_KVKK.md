# Authentication, OTP & KVKK Requirements

## 1. OTP (One-Time Password) Phone Verification

### What is OTP?
A 6-digit code sent via SMS to verify phone number ownership.

### Current Status:
- ⚠️ **Partially implemented** but non-blocking
- UI exists in `VerifyPhone.tsx`
- Set to `requireDualVerification = false` (allows skip)

### What YOU Need:

#### Option A: Supabase SMS (Twilio)
**Setup:**
1. Sign up for Twilio: https://www.twilio.com
2. Get phone number for Turkey (+90)
3. Get API credentials:
   - Account SID
   - Auth Token
4. Add to Supabase Auth settings:
   - Dashboard → Authentication → Providers → Phone
   - Enable phone login
   - Add Twilio credentials

**Cost:**
- ~$0.05 per SMS in Turkey
- Budget: 1000 users = ~$50/month for verifications

#### Option B: Turkish SMS Provider
**Recommended for Turkey:**
- **Netgsm**: https://www.netgsm.com.tr
- **iletimerkezi**: https://www.iletimerkezi.com
- **Twilio** (also works in Turkey)

**Steps:**
1. Create account with provider
2. Get API key
3. Update `VerifyPhone.tsx` to use provider's API
4. Handle rate limiting (prevent SMS spam)

### Implementation Checklist:
- [ ] Choose SMS provider
- [ ] Get API credentials
- [ ] Add credentials to Lovable secrets
- [ ] Update `requireDualVerification = true` in code
- [ ] Test OTP flow end-to-end
- [ ] Add rate limiting (max 3 SMS per hour per number)
- [ ] Handle edge cases (wrong number, expired code)

### Security Notes:
- OTP codes should expire after 5-10 minutes
- Limit attempts to 3 per code
- Block phone numbers after 5 failed attempts
- Store hashed phone numbers only

---

## 2. KVKK (Turkish GDPR) Compliance

### What is KVKK?
**Kişisel Verilerin Korunması Kanunu** - Turkey's data protection law (like GDPR in EU)

### Current Status:
- ✅ Database tables exist: `kvkk_consents`
- ✅ Legal pages exist: `/legal/kvkk`
- ✅ Consent collection implemented (see below)

### What YOU Need:

#### A. Legal Documents (CRITICAL)
You MUST have these documents drafted by a lawyer:

1. **KVKK Aydınlatma Metni** (Privacy Notice)
   - Explains what data you collect
   - Why you collect it
   - Who has access
   - How long you keep it
   - User rights

2. **Açık Rıza Metni** (Explicit Consent)
   - For special category data:
     - Background checks (criminal records)
     - Location tracking (GPS data)
     - Child information (minor's data)
     - Health data (allergies, special needs)

3. **Veri Saklama ve İmha Politikası** (Data Retention Policy)
   - How long you keep data
   - When/how you delete it

**Where to add:** 
- Update `src/pages/legal/KVKKPage.tsx`
- Update `src/pages/legal/PrivacyPolicy.tsx`

#### B. Consent Collection Points

**When to ask for consent:**

1. **Registration** (all users):
   - [x] Platform usage (general data processing) ✅ Implemented in ParentStep1 & SitterStep1
   - [ ] Marketing communications (optional)
   - [x] Account creation ✅ Part of registration flow

2. **Parent Registration** (additional):
   - [x] Child data processing ✅ Implemented in `ParentStep1.tsx`
   - [x] Location tracking for sessions ✅ Implemented in `ParentStep1.tsx`
   - [x] Sharing child info with sitters ✅ Consent recorded in `kvkk_consents`

3. **Sitter Registration** (additional):
   - [x] Background check processing ✅ Implemented in `SitterStep5.tsx`
   - [x] Location tracking during sessions ✅ Implemented in `SitterStep1.tsx`
   - [x] Public profile display ✅ Part of sitter registration
   - [x] Identity document processing ✅ Implemented in `SitterStep5.tsx`

4. **Before Each Session**:
   - [x] Live GPS tracking consent ✅ `LocationConsent.tsx` component exists
   - [ ] Session recording consent

#### C. Implementation Needed

**Add consent checkboxes to:**
- [x] `src/pages/register/ParentRegistration.tsx` ✅ Done in ParentStep1
- [x] `src/pages/register/SitterRegistration.tsx` ✅ Done in SitterStep1 & SitterStep5
- [x] `src/components/location/LocationConsent.tsx` ✅ Already exists
- [x] `src/components/children/AddChildForm.tsx` ✅ Child data consent added

**Example:**
```typescript
const [consents, setConsents] = useState({
  dataProcessing: false,
  locationTracking: false,
  childDataProcessing: false,
  marketing: false
});

// On submit:
await supabase.from('kvkk_consents').insert({
  user_id: userId,
  consent_type: 'data_processing',
  granted: true,
  ip_address: userIP,
  granted_at: new Date()
});
```

#### D. User Rights Implementation

Users have the right to:
- **Access** their data (export)
- **Delete** their data (account deletion)
- **Rectify** their data (edit profile)
- **Object** to processing (opt-out)
- **Data portability** (download)

**Already implemented:**
- ✅ Account deletion: `AccountDeletionModal.tsx`
- ✅ Data export: `export-user-data` edge function
- ✅ Profile editing: Settings pages

**Needs testing:**
- [ ] Test account deletion flow
- [ ] Test data export
- [ ] Verify all data is actually deleted

#### E. Data Protection Officer (DPO)

**Legal requirement if:**
- You process data of 1,000+ people regularly
- You process sensitive data (children, health, location)

**What to do:**
- Hire or designate a DPO
- Register with KVKK Authority (VERBİS)
- Display DPO contact on website

**For MVP:**
- You can be your own DPO initially
- Add contact email: kvkk@kampusabla.com

---

## 3. Combined Authentication Flow

### Ideal User Journey:

**Parent Signup:**
1. Email + password → Supabase Auth ✅
2. Email verification → Click link in inbox ✅
3. Phone OTP → Enter 6-digit code ⏳ (needs SMS provider)
4. KVKK Consent → Check all required boxes ✅
5. Profile completion → Name, address, etc. ✅
6. ✅ Account active

**Sitter Signup:**
1. University email + password → Supabase Auth ✅
2. Email verification → Click link in inbox ✅
3. Phone OTP → Enter 6-digit code ⏳ (needs SMS provider)
4. KVKK Consent → Including background check consent ✅
5. Profile completion → University, year, etc. ✅
6. Document upload → ID, student card, background check ✅
7. ⏳ Pending admin verification ✅
8. Admin approves → ✅ Account active ✅

---

## What YOU Need to Provide

### Immediate (MVP):
- [ ] **Legal texts** - Hire lawyer to draft KVKK documents
- [ ] **DPO designation** - Assign yourself or hire
- [ ] **SMS provider** - Choose and sign up (Netgsm recommended)

### Can Wait (Post-MVP):
- [ ] VERBİS registration (required after 1000 users)
- [ ] Data protection impact assessment
- [ ] Third-party data processing agreements

---

## Cost Estimates

| Item | Cost | Frequency |
|------|------|-----------|
| Lawyer (KVKK drafting) | ₺5,000-15,000 | One-time |
| SMS provider (Netgsm) | ₺0.10/SMS | Per verification |
| DPO (if hiring) | ₺3,000-8,000/month | Monthly |
| VERBİS registration | ₺0 | One-time |

**MVP Budget:** ~₺10,000 one-time + ₺100/month SMS

---

## Implementation Priority

### Phase 1 (Before Launch):
1. Get legal documents drafted ⚠️ CRITICAL
2. ~~Add consent checkboxes to registration~~ ✅ DONE
3. Set up SMS provider for OTP
4. Test full authentication flow

### Phase 2 (Before 1000 users):
1. Register with VERBİS
2. ~~Implement data export functionality~~ ✅ DONE
3. Add data retention automation
4. Privacy policy review

### Phase 3 (Scaling):
1. Hire dedicated DPO
2. Automated compliance monitoring
3. Regular audits

---

## Summary

**What you need to DO:**
1. ⚠️ Hire lawyer for KVKK texts (CRITICAL - do this first)
2. Sign up for SMS provider (Netgsm/Twilio)
3. ~~Add consent checkboxes to registration forms~~ ✅ DONE
4. Test the full authentication flow

**What's already DONE:**
- Database schema for consents ✅
- Account deletion functionality ✅
- Legal page structure ✅
- Basic consent tracking ✅
- Consent checkboxes in Parent registration ✅
- Consent checkboxes in Sitter registration ✅
- Child data consent in AddChildForm ✅
- Location consent component ✅
- Data export edge function ✅

**Timeline:**
- Legal documents: 1-2 weeks (lawyer dependent)
- SMS setup: 1-2 days
- ~~Consent implementation: 3-5 days coding~~ ✅ DONE
- Testing: 1 week

**Total MVP time: ~2-3 weeks** (consent coding already done)
