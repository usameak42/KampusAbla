# Background Check Document Review - Explained

## What is a Background Check?

A **background check** (Adli Sicil Kaydı in Turkish) is an official document from the government that shows if a person has any criminal record.

### Why it's critical for KampusAbla:
- You're dealing with **childcare** - parents need proof sitters are safe
- Legal protection for your platform
- Trust signal for parents

## How Background Checks Work in Turkey

### 1. **Where Sitters Get It**
Turkish citizens can obtain their background check ("Adli Sicil Belgesi") from:
- **e-Devlet** (government portal): https://www.turkiye.gov.tr
  - Digital download (PDF with QR code)
  - Free
  - Instant
- **In-person**: Courthouse or Nüfus Müdürlüğü
  - Takes 1-2 days
  - Small fee

### 2. **What the Document Contains**
- Full name and TC Kimlik No (National ID)
- Date of birth
- **Criminal record status**: "Temiz" (clean) or lists offenses
- **Issue date** and **validity** (typically 3-6 months)
- **QR code** for verification (e-Devlet documents)

### 3. **What Sitters Upload**
- **PDF file** of their Adli Sicil Belgesi
- Must be recent (less than 3 months old)
- Must show **clean record** ("Sabıka kaydı yoktur")

## Current Implementation in KampusAbla

### How it Works Now:
1. Sitter goes to **SitterVerification** page
2. Uploads background check PDF to `verification-documents` bucket
3. File stored at: `background_check_url` in `sitter_verifications` table
4. **Admin reviews** in **VerificationQueue** page
5. Admin clicks "Görüntüle" (View) to open PDF
6. Admin checks:
   - ✅ Document is legitimate (has government logo, QR code)
   - ✅ Name matches sitter's ID
   - ✅ Record is clean (no criminal history)
   - ✅ Document is recent (issued within 3 months)
7. Admin approves or rejects

### What Happens After Approval:
- `verification_status` = 'verified'
- `background_check_status` = 'approved'
- Sitter can now accept bookings

### What Happens After Rejection:
- `verification_status` = 'rejected'
- `background_check_status` = 'rejected'
- Sitter notified to re-upload valid document

## Manual vs Automated Review

### Current: Manual Review (✅ Implemented)
**Pros:**
- No API integration needed
- Human verification of authenticity
- Flexible (can spot fake documents)

**Cons:**
- Time-consuming for admins
- Scales poorly (100+ applications/day = problem)

### Future: Automated via e-Devlet API (🔮 Possible)
**How it would work:**
- Sitter enters TC Kimlik No
- System calls e-Devlet API
- API returns background check status
- Instant verification

**Challenges:**
- Requires **government API access** (hard to get)
- Privacy concerns (storing TC Kimlik)
- API may not be public for startups

**Recommendation:** Start with manual, consider automation if you reach 1000+ sitters

## Security & Privacy Considerations

### What You MUST Do:
1. **Encrypt storage**: Background check PDFs contain sensitive data
   - Already done: `verification-documents` bucket is private (RLS protected)
2. **Delete after verification**: Don't store indefinitely
   - Recommend: Delete PDF 30 days after approval
3. **Audit trail**: Log who approved what
   - Add to `data_access_logs` table

### KVKK Compliance:
- Background checks = "Özel Nitelikli Kişisel Veri" (Special Category Personal Data)
- Requires **explicit consent** from sitter
- Must have **legal basis** for processing (childcare safety = valid reason)
- Store only as long as needed

## Common Issues & Solutions

### Issue 1: Sitter uploads wrong document
**Solution:** 
- Show example image in upload form
- Add file type validation (PDF only)
- Check file size (< 5MB)

### Issue 2: Document is expired
**Solution:**
- Parse issue date from PDF (if possible)
- Auto-reject if > 3 months old
- Show clear error to sitter

### Issue 3: Document is fake
**Solution:**
- Train admins to spot fake documents
- Check for: Government logo, QR code, official formatting
- Cross-reference with sitter's government ID photo

### Issue 4: Admin workload too high
**Solution:**
- Hire verification specialists
- Batch review (review 10-20 at once)
- Use e-Devlet QR code scanner to verify authenticity

## What YOU Need to Implement

### For MVP (Current Manual System):
**Nothing additional needed** - already implemented in VerificationQueue.tsx

### For Better UX:
- [ ] Add example document image to SitterVerification page
- [x] Add file validation (PDF only, max 5MB) ✅ IMPLEMENTED
  - Strict `application/pdf` MIME type check on all PDF document types
  - File size validated against configurable `maxSize` prop (default 5MB)
  - Clear Turkish error messages for invalid formats
- [x] Show preview of uploaded PDF before submit ✅ IMPLEMENTED
  - Local PDF preview rendered via `URL.createObjectURL` in an iframe before upload
  - Staged file flow: select → preview → confirm → upload
  - File info (name, size) displayed alongside preview
  - Cancel button to discard and re-select
- [x] Auto-reject if document older than 90 days ✅ IMPLEMENTED
  - Document date input required for all PDF document types before upload
  - Client-side validation: documents older than 90 days are rejected
  - Upload button disabled until valid date is entered
  - Clear warning message with specific rejection reason

### For Scale (Future):
- [ ] Research e-Devlet API access
- [ ] Build QR code scanner (verify document authenticity)
- [ ] Automated expiry detection
- [ ] Document retention policy (auto-delete after 30 days)

## Testing Checklist

- [ ] Upload valid background check PDF
- [x] PDF-only validation rejects non-PDF files (e.g., .jpg, .docx) ✅
- [x] File size validation rejects files > 5MB ✅
- [x] Local PDF preview displays correctly before upload ✅
- [x] Document date field appears for PDF document types ✅
- [x] Documents older than 90 days are rejected with error message ✅
- [x] Cancel button discards staged file and resets form ✅
- [x] Successful upload clears staged state and shows uploaded preview ✅
- [ ] Admin can view PDF in verification queue
- [ ] Admin can approve verification
- [ ] Admin can reject with reason
- [ ] Sitter receives notification of approval/rejection
- [ ] Rejected sitter can re-upload new document

## Summary

**What is it?** 
Government document proving no criminal record

**Why needed?** 
Childcare safety + legal compliance

**Current implementation?** 
Manual PDF upload + admin review ✅ Working

**What you need to do?** 
Nothing for MVP - it's ready. Just train admins on what to look for.

**Future improvement?** 
Consider e-Devlet API integration when you scale.
