

## Fix: Remove Static Firebase Import Causing WebSocket Crash

### Problem
`src/services/notifications.ts` line 2 statically imports `firebase/messaging`:
```ts
import { getToken, onMessage, MessagePayload } from "firebase/messaging";
```
This executes immediately on app load (because `NotificationContext` → `App.tsx` imports it). The `firebase/messaging` module internally tries to open a WebSocket, which fails in sandboxed iframes and crashes the entire app with "WebSocket not available".

The lazy dynamic import in `firebase.ts` is correct but irrelevant — the damage is already done by this static import in `notifications.ts`.

### Changes

**File: `src/services/notifications.ts`**

1. Remove the static import of `getToken`, `onMessage` from `"firebase/messaging"`
2. Keep only the `type` import for `Messaging` and `MessagePayload` (type-only imports are erased at compile time, so they never trigger module execution)
3. Dynamically import `getToken` and `onMessage` inside the methods that need them (`getToken()` method and `setupForegroundListener()` method)

```ts
// BEFORE (crashes):
import { getToken, onMessage, MessagePayload } from "firebase/messaging";

// AFTER (safe):
import type { Messaging, MessagePayload } from "firebase/messaging";
// getToken and onMessage will be dynamically imported where used
```

In the `getToken()` method:
```ts
const { getToken: fbGetToken } = await import("firebase/messaging");
const currentToken = await fbGetToken(msg, { vapidKey: this.vapidKey });
```

In the `setupForegroundListener()` method:
```ts
this.getMessagingInstance().then(async (msg) => {
    if (!msg || unsubscribed) return;
    const { onMessage: fbOnMessage } = await import("firebase/messaging");
    innerUnsub = fbOnMessage(msg, callback);
}).catch(() => { /* silently degrade */ });
```

No other files need changes. This is a 1-file fix.

