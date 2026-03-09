# TypeScript "any" Types Audit

## Files with `any` types that need review:

### 1. **src/pages/admin/VerificationQueue.tsx**
- Line 72: `sitterIds.map((v: any) => v.sitter_id)`
- Line 81: `(sittersData || []).forEach((s: any) => {...})`
- Line 85: `verifications.map((item: any) => ({...}))`
- **Action needed**: Add proper TypeScript interfaces for verification data

### 2. **src/components/auth/AdminRoute.tsx**
- Line 23: `.from("user_roles" as any)`
- **Action needed**: This is intentional (user_roles not in types.ts yet) - can stay

### 3. **src/hooks/useBookings.ts**
- Check for any implicit `any` types in booking data handling
- **Action needed**: Verify all booking interfaces are properly typed

### 4. **src/hooks/useReviews.ts**
- Check review data structures
- **Action needed**: Ensure review types match database schema

### 5. **src/hooks/useSearchSitters.ts**
- Check sitter search results typing
- **Action needed**: Verify filter types are not `any`

### 6. **src/services/payment.ts**
- Payment gateway responses might use `any`
- **Action needed**: Create interfaces for iyzico/Papara responses

### 7. **src/lib/firebase.ts**
- Firebase notification payloads might use `any`
- **Action needed**: Type the notification structure

## Priority Order:
1. **HIGH**: VerificationQueue.tsx - impacts admin security
2. **MEDIUM**: Payment service types - impacts financial accuracy
3. **MEDIUM**: Hooks data types - impacts UI reliability
4. **LOW**: Firebase types - impacts notifications only

## How to Fix:
```typescript
// ❌ BAD
const data = response.data as any;

// ✅ GOOD
interface VerificationData {
  id: string;
  sitter_id: string;
  university_email: string;
  // ... etc
}
const data = response.data as VerificationData[];
```

## Notes:
- Some `any` types are acceptable (external APIs with unknown shapes)
- Focus on internal data structures first
- Use strict TypeScript mode: `"strict": true` in tsconfig.json
