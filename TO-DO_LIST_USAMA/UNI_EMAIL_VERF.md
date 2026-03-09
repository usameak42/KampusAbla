# University Email Verification Guide

## What You Need:

### 1. **Email Validation Rules**
Already implemented in the code:
```typescript
// Accepted domains:
- *.edu (international universities)
- *.edu.tr (Turkish universities)
```

### 2. **Email Sending Service**
You need to choose ONE of these options:

#### Option A: Use Lovable Email (Recommended for MVP)
- **Setup**: Already configured in Lovable Cloud
- **Cost**: Included in Lovable plan
- **Limitation**: Default lovable.app sender domain
- **Action**: No setup needed, works out of the box

#### Option B: Custom Email Domain (Professional)
- **Setup**: Add your domain (e.g., verify@kampusabla.com)
- **Cost**: Domain + email service
- **Benefit**: Professional branding
- **Steps**:
  1. Own a domain (kampusabla.com)
  2. Configure DNS records (SPF, DKIM)
  3. Add to Lovable Cloud → Email settings

### 3. **Verification Flow** (Already Implemented)

**How it works:**
1. Sitter enters university email during registration
2. System sends verification link to that email
3. Sitter clicks link to verify ownership
4. Email is marked as verified in database

**Database tracking:**
- Table: `sitter_verifications`
- Column: `university_email`
- Status: `verification_status` = 'pending' | 'verified' | 'rejected'

### 4. **What Happens After Verification**

The sitter can only proceed to document upload AFTER email verification.

**Current implementation:**
- Email verification = automatic (via Supabase Auth)
- Document verification = manual (admin reviews in VerificationQueue)

### 5. **Edge Cases to Handle**

#### If student graduates:
- Email might be deactivated
- Solution: Allow email update with re-verification
- Require: Student certificate as proof

#### If email bounces:
- Mark verification as failed
- Notify sitter to check email address
- Allow re-submission

#### If using personal email:
- Reject immediately
- Show error: "Must use university email ending in .edu or .edu.tr"

### 6. **Security Considerations**

**Already implemented:**
- Email domain validation (regex check)
- One verification per sitter
- Unique constraint on university_email

**To consider:**
- Rate limiting on verification emails (prevent spam)
- Expiry time on verification links (24-48 hours)
- Detect disposable email services

### 7. **Testing Checklist**

- [ ] Test with valid .edu.tr email
- [ ] Test with invalid personal email (@gmail.com) - should reject
- [ ] Test verification link expiry
- [ ] Test re-sending verification email
- [ ] Test multiple sitters from same university

### 8. **What YOU Need to Provide**

**For MVP (using Lovable Email):**
- ✅ Nothing - already set up

**For Production (custom domain):**
- [ ] Domain name (kampusabla.com)
- [ ] Email service choice (Lovable Email vs external)
- [ ] Email templates text (optional customization)

### 9. **Future Enhancements**

- [ ] Integrate with university registrar APIs (auto-verify)
- [ ] Support for international university domains
- [ ] Bulk verification for same university
- [ ] Email domain whitelist (pre-approved universities)

## Implementation Status:
✅ Email validation logic  
✅ Database schema  
✅ Verification status tracking  
⏳ Custom email domain (optional)  
⏳ Rate limiting (recommended)
