

## Build Error Fix

### Problem
In `src/hooks/useSession.ts` line 161, the code uses `'on_way'` (with underscore) but `SessionStatus` type defines it as `'on-way'` (with hyphen).

### Fix Required
**File:** `src/hooks/useSession.ts` (line 161)

Change:
```typescript
const statusLabels: Partial<Record<SessionStatus, string>> = {
    on_way: "Bakıcı yola çıktı",        // ❌ Wrong: underscore
    arrived: "Bakıcı evinize ulaştı",
    picked_up: "Çocuk teslim alındı",   // ❌ Wrong: not a valid status
    in_progress: "Seans başladı",       // ❌ Wrong: underscore
    completed: "Seans tamamlandı",
};
```

To:
```typescript
const statusLabels: Partial<Record<SessionStatus, string>> = {
    "on-way": "Bakıcı yola çıktı",      // ✅ Correct: hyphen
    "arrived": "Bakıcı evinize ulaştı",
    "in-progress": "Seans başladı",     // ✅ Correct: hyphen
    "completed": "Seans tamamlandı",
};
```

### Valid SessionStatus Values
From `src/types/session.ts`:
- `"pending"` | `"on-way"` | `"arrived"` | `"in-progress"` | `"completed"` | `"cancelled"`

Note: `"picked_up"` doesn't exist in the type and should be removed.

