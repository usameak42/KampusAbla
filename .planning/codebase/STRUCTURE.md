# Codebase Structure

**Analysis Date:** 2026-03-05

## Directory Layout

```
kampus-abla/
├── src/                          # Main source code
│   ├── app/                      # Next.js App Router (NOT PRESENT - using pages)
│   ├── components/               # Reusable React components
│   ├── contexts/                 # React context providers
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility functions and configurations
│   ├── pages/                    # Page components (React Router)
│   ├── services/                 # Service layer for integrations
│   ├── test/                     # Test setup and mocks
│   ├── types/                    # TypeScript type definitions
│   └── integrations/             # Third-party integrations
├── supabase/                     # Database and backend
│   ├── migrations/               # Database schema migrations
│   └── functions/                # Edge functions
├── public/                      # Static assets
├── docs/                        # Documentation
├── e2e/                         # End-to-end tests
└── .planning/codebase/          # Analysis documents
```

## Directory Purposes

### `src/` - Main Application Source Code
**Purpose:** All frontend application code and business logic
**Contains:** React components, hooks, utilities, types
**Key files:** `App.tsx`, `main.tsx`

### `src/pages/` - Page Components
**Purpose:** Route-based page components following React Router pattern
**Contains:** Top-level page components for each route
**Key files:**
- `dashboard/ParentDashboard.tsx` - Parent main dashboard
- `dashboard/SitterDashboard.tsx` - Sitter main dashboard
- `search/FindSitters.tsx` - Sitter search page
- `bookings/MyBookings.tsx` - Booking management
- `session/ActiveSession.tsx` - Live session tracking

### `src/components/` - UI Components
**Purpose:** Reusable React components organized by feature
**Contains:** Feature-specific, layout, and UI primitive components
**Subdirectories:**
- `ui/` - shadcn/ui primitive components
- `auth/` - Authentication components
- `booking/` - Booking-related components
- `chat/` - Messaging components
- `search/` - Search and filter components

### `src/hooks/` - Custom React Hooks
**Purpose:** Encapsulated business logic and state management
**Contains:** Custom hooks for specific features
**Key files:**
- `useAuthentication.ts` - Auth operations
- `useBookings.ts` - Booking CRUD operations
- `useSession.ts` - Session management
- `useChat.ts` - Messaging functionality
- `useSearchSitters.ts` - Search logic

### `src/services/` - Service Layer
**Purpose:** External service integrations and business logic
**Contains:** API service classes and integration logic
**Key files:**
- `payment.ts` - Payment gateway integration
- `notifications.ts` - Push notifications
- `locationTracking.ts` - GPS tracking

### `src/lib/` - Utilities and Configurations
**Purpose:** Shared utilities, configurations, and helpers
**Contains:** Helper functions, constants, configurations
**Key files:**
- `auth.ts` - Auth utilities
- `utils.ts` - General utilities
- `constants.ts` - Application constants
- `logger.ts` - Logging utilities

### `src/contexts/` - React Contexts
**Purpose:** Global state management
**Contains:** Context providers for global state
**Key files:**
- `AuthContext.tsx` - Authentication state
- `NotificationContext.tsx` - Notification state

### `src/types/` - TypeScript Types
**Purpose:** Type definitions and interfaces
**Contains:** TypeScript type definitions for features
**Key files:**
- `session.ts` - Session types
- `sitter.ts` - Sitter types
- `booking.ts` - Booking types

### `src/integrations/` - Third-Party Integrations
**Purpose:** Third-party service clients and configurations
**Contains:** External API integrations
**Key files:**
- `supabase/client.ts` - Supabase client setup
- `supabase/types.ts` - Supabase types

### `supabase/` - Backend Infrastructure
**Purpose:** Database schema and backend functions
**Contains:** SQL migrations, RLS policies, edge functions
**Key subdirectories:**
- `migrations/` - Database schema migrations
- `functions/` - Serverless edge functions

### `public/` - Static Assets
**Purpose:** Static files served by the application
**Contains:** Images, fonts, other static assets

## Key File Locations

### Entry Points
- `/mnt/d/Coding/KampusAbla/src/App.tsx` - Main application component with routing
- `/mnt/d/Coding/KampusAbla/src/main.tsx` - Application entry point

### Configuration
- `/mnt/d/Coding/KampusAbla/src/lib/env.ts` - Environment variable handling
- `/mnt/d/Coding/KampusAbla/supabase/config.toml` - Supabase configuration

### Database Schema
- `/mnt/d/Coding/KampusAbla/supabase/migrations/` - All database migration files

### Core Business Logic
- `/mnt/d/Coding/KampusAbla/src/hooks/useBookings.ts` - Booking management
- `/mnt/d/Coding/KampusAbla/src/hooks/useSession.ts` - Session tracking
- `/mnt/d/Coding/KampusAbla/src/services/payment.ts` - Payment processing

## Naming Conventions

### Files
- **Components:** PascalCase (e.g., `SitterCard.tsx`)
- **Pages:** Descriptive names (e.g., `FindSitters.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useBookings.ts`)
- **Services:** camelCase (e.g., `payment.ts`)
- **Types:** camelCase (e.g., `session.ts`)
- **Utilities:** camelCase (e.g., `utils.ts`)

### Directories
- **Feature-based:** Lowercase with hyphens (e.g., `find-sitters/`)
- **Type-based:** Lowercase (e.g., `hooks/`, `components/`)

### Functions and Variables
- **Functions:** camelCase (e.g., `calculatePlatformFee`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `PLATFORM_FEE_RATE`)
- **Interfaces:** PascalCase (e.g., `BookingInterface`)

## Where to Add New Code

### New Feature Implementation
1. **Page:** Add to `/mnt/d/Coding/KampusAbla/src/pages/[feature]/`
2. **Components:** Add to `/mnt/d/Coding/KampusAbla/src/components/[feature]/`
3. **Hooks:** Add to `/mnt/d/Coding/KampusAbla/src/hooks/use[Feature].ts`
4. **Types:** Add to `/mnt/d/Coding/KampusAbla/src/types/[feature].ts`
5. **Services:** Add to `/mnt/d/Coding/KampusAbla/src/services/[feature].ts`

### New Database Table
1. **Migration:** Add to `/mnt/d/Coding/KampusAbla/supabase/migrations/`
2. **Types:** Update `/mnt/d/Coding/KampusAbla/src/types/database.ts` (if exists)
3. **RLS Policies:** Add in migration file

### New API Integration
1. **Service:** Add to `/mnt/d/Coding/KampusAbla/src/services/[service].ts`
2. **Configuration:** Add to `/mnt/d/Coding/KampusAbla/src/lib/config.ts` (if needed)
3. **Types:** Add to `/mnt/d/Coding/KampusAbla/src/types/[integration].ts`

## Special Directories

### `.planning/codebase/`
- **Purpose:** Architecture and codebase analysis documents
- **Generated:** By GSD mapping commands
- **Maintained:** Automatically updated by analysis tools

### `supabase/`
- **Purpose:** Backend infrastructure as code
- **Generated:** Database migrations and configurations
- **Maintained:** Manual schema changes via migrations

### `e2e/`
- **Purpose:** End-to-end testing with Playwright
- **Contains:** E2E test scenarios
- **Maintained:** Test team for critical user flows

### `test-results/`
- **Purpose:** Test execution results
- **Generated:** By test runners
- **Maintained:** Automatically cleaned up

---

*Structure analysis: 2026-03-05*