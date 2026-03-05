# Coding Conventions

**Analysis Date:** 2026-03-05

## Naming Patterns

**Files:**
- PascalCase for components: `Avatar.tsx`, `ProtectedRoute.tsx`
- camelCase for hooks: `use-mobile.tsx`, `useAuth.tsx`
- camelCase for services: `payment.ts`, `logger.ts`
- PascalCase for types: `PaymentConfig`, `AuthContextType`
- snake_case for files with multiple words: `file_name.ts`

**Functions:**
- camelCase for functions and methods: `processPayment`, `createSubscription`
- PascalCase for component functions: `Avatar`, `ProtectedRoute`
- Verb-first for async functions: `fetchData`, `handleSubmit`
- getter/setter pattern for state: `getUser`, `setUser`

**Variables:**
- camelCase for variables: `isMobile`, `userSession`
- PascalCase for constants and types: `MOBILE_BREAKPOINT`, `PaymentProvider`
- underscore prefix for private variables: `_privateVar`
- single letter for iterators: `i`, `j`, `k`

**Types:**
- PascalCase for interfaces and types: `PaymentResult`, `AuthContextType`
- Prefix types with `I` for interfaces: `IConfig` (not consistently used)
- Use `T` prefix for generic types: `TData`, `TError`
- Union types use `|` with proper spacing: `"parent" | "sitter" | "admin"`

## Code Style

**Formatting:**
- Tool: Prettier
- Key settings:
  - Semicolons: enabled
  - Trailing commas: es5
  - Single quotes: disabled
  - Print width: 120
  - Tab width: 2
  - Use tabs: false
  - Arrow parens: always
  - Bracket spacing: true
  - End of line: lf

**Linting:**
- Tool: ESLint with TypeScript support
- Key rules:
  - React hooks rules enabled
  - TypeScript unused vars: off
  - TypeScript explicit any: off
  - React refresh only export components: warn with constant export allowed
  - Browser globals configured

## Import Organization

**Order:**
1. External packages (3rd party)
2. Internal imports (relative)
3. Type imports

**Pattern:**
```typescript
// External packages
import React from "react";
import * as Sentry from "@sentry/react";
import { z } from "zod";

// Internal imports
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// Type imports (at bottom if only types)
import type { User, Session } from "@supabase/supabase-js";
```

**Path Aliases:**
- `@/` maps to `./src/`
- Used consistently across all imports

## Error Handling

**Patterns:**
```typescript
// Async operations with try/catch
async function processPayment(data: PaymentData) {
    try {
        const result = await paymentService.processPayment(data);
        if (!result.success) {
            throw new Error(result.error);
        }
        return result;
    } catch (error) {
        logger.error("Payment processing failed", { error });
        throw error; // Re-throw for UI handling
    }
}

// Error boundaries
<Sentry.ErrorBoundary
    fallback={GlobalErrorFallback}
    showDialog={false}
>
    {/* App content */}
</Sentry.ErrorBoundary>
```

**Error Logging:**
- Structured logging with context
- Sentry integration for error tracking
- Audit logs for security events
- User-friendly error messages in Turkish

## Logging

**Framework:** Custom logger with Sentry integration

**Patterns:**
```typescript
// Structured logging
logger.info("User logged in", {
    userId: user.id,
    action: "auth.login",
    ipAddress: req.ip
});

// Error logging
logger.error("Payment failed", {
    userId,
    action: "payment.process",
    error: error.message
});

// Debug logging in development
logger.debug("API response received", {
    responseTime,
    dataSize
});
```

**Log Levels:**
- debug: Development debugging
- info: User actions and important events
- warn: Non-critical issues
- error: Critical errors and exceptions

## Comments

**When to Comment:**
- Complex business logic
- External API integrations
- Security-sensitive operations
- Non-obvious data transformations
- TODO/FIXME items

**JSDoc/TSDoc:**
```typescript
/**
 * Process a payment for a booking
 * @param amount Amount in TRY
 * @param bookingId Unique booking identifier
 * @param sitterSubMerchantKey Sub-merchant key for payout
 * @returns Promise resolving to payment result
 * @throws Error if payment processing fails
 */
async function processPayment(
    amount: number,
    bookingId: string,
    sitterSubMerchantKey: string
): Promise<PaymentResult> {
    // Implementation
}
```

## Function Design

**Size:** Functions should be concise, ideally under 30 lines
- Break down large functions into smaller, focused functions
- Single responsibility per function
- Extract reusable logic into utilities

**Parameters:**
- Limit to 3-4 parameters maximum
- Use objects for multiple related parameters
- Optional parameters at the end
- Type all parameters explicitly

**Return Values:**
- Always return typed values
- Use union types for success/failure results
- Include descriptive error messages
- Return consistent types

## Module Design

**Exports:**
- Named exports for utilities and functions
- Default export for main components
- Barrel files for organized imports (`src/components/ui/index.ts`)

**Barrel Files:**
```typescript
// src/components/ui/index.ts
export { Avatar, AvatarImage, AvatarFallback } from "./avatar";
export { Button, ButtonProps } from "./button";
export { Input, InputProps } from "./input";
```

**Module Organization:**
- Group related functionality together
- Keep imports local to module
- Avoid circular dependencies
- Use dependency injection for services

---

*Convention analysis: 2026-03-05*