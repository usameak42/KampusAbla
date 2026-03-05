# Architecture

**Analysis Date:** 2026-03-05

## Pattern Overview

**Overall:** Next.js Full-Stack Server-Side Rendering (SSR) with BFF (Backend for Frontend) Pattern

**Key Characteristics:**
- Next.js 14+ with App Router for modern React routing
- Supabase as backend-as-a-service (PostgreSQL + Auth + Storage + Realtime)
- TypeScript strict mode throughout for type safety
- Component-based UI with shadcn/ui design system
- Custom hooks for state management and business logic
- Service layer for API integration and business operations

## Layers

### 1. Presentation Layer (`src/`)
**Purpose:** UI components, pages, and user interface logic
**Location:** `/mnt/d/Coding/KampusAbla/src/`
**Contains:** React components, pages, layouts, UI primitives
**Depends on:** Context providers, custom hooks, types
**Used by:** Browser client

#### Sub-layers:
- **Pages (`src/pages/`)**: Route-based page components
  - Dashboard pages (parent/sitter views)
  - Feature pages (search, bookings, chat)
  - Admin pages (verification, analytics)
  - Legal pages (terms, privacy)

- **Components (`src/components/`)**: Reusable UI components
  - Feature-specific components (booking, search, chat)
  - Layout components (header, footer, navigation)
  - Form components with validation
  - UI primitives (shadcn/ui components)

- **Context Providers (`src/contexts/`)**: Global state management
  - `AuthContext`: User authentication state
  - `NotificationContext`: Global notifications

### 2. Business Logic Layer (`src/hooks/`, `src/services/`)
**Purpose:** Application-specific business logic and state management
**Location:** `/mnt/d/Coding/KampusAbla/src/hooks/`, `/mnt/d/Coding/KampusAbla/src/services/`
**Contains:** Custom React hooks, service classes, API integrations
**Depends on:** Database layer, third-party APIs
**Used by:** Presentation layer

#### Sub-layers:
- **Custom Hooks (`src/hooks/`)**: Encapsulated business logic
  - `useAuthentication`: Auth operations
  - `useBookings`: Booking CRUD operations
  - `useChat`: Messaging functionality
  - `useSession`: Session tracking and status management
  - `useSearchSitters`: Search and filtering logic

- **Services (`src/services/`)**: External service integrations
  - `payment.ts`: Payment gateway integration (iyzico/Papara)
  - `notifications.ts`: Push notification service
  - `locationTracking.ts`: GPS tracking service
  - `maps.ts`: Google Maps integration

### 3. Data Access Layer (`src/lib/`, `supabase/`)
**Purpose:** Database operations and data persistence
**Location:** `/mnt/d/Coding/KampusAbla/src/lib/`, `/mnt/d/Coding/KampusAbla/supabase/`
**Contains:** Database clients, data access functions, migrations
**Depends on:** PostgreSQL database
**Used by:** Business logic layer

#### Sub-layers:
- **Libraries (`src/lib/`)**: Utility functions and configuration
  - `auth.ts`: Authentication utilities
  - `booking.ts`: Booking business logic
  - `payment.ts`: Payment calculations
  - `utils.ts`: General utilities

- **Database (`supabase/`)**: Database schema and operations
  - Migrations: SQL schema definitions
  - RLS policies: Row-level security
  - Functions: Edge functions for serverless operations

### 4. Integration Layer (`src/integrations/`)
**Purpose:** Third-party service integrations
**Location:** `/mnt/d/Coding/KampusAbla/src/integrations/`
**Contains:** External API clients and configurations
**Depends on:** Third-party services
**Used by:** Business logic layer

#### Sub-layers:
- **Supabase Client**: Database and authentication client
- **Firebase**: Push notifications and analytics
- **Maps API**: Google Maps integration
- **Payment APIs**: iyzico/Papara integration

## Data Flow

### 1. User Authentication Flow
```
User Input → AuthContext → Supabase Auth → JWT Token → Protected Routes
```

### 2. Booking Flow
```
User Request → Component → Custom Hook → Service Layer → Supabase DB → UI Update
```

### 3. Session Tracking Flow
```
GPS Location → useLocation Hook → Service → Session Locations Table → Real-time Updates
```

### 4. Messaging Flow
```
User Message → Chat Component → useChat Hook → Supabase Realtime → Other User
```

## Key Abstractions

### 1. Session Management
**Purpose:** Track real-time session status and location
**Examples:** `/mnt/d/Coding/KampusAbla/src/types/session.ts`, `/mnt/d/Coding/KampusAbla/src/hooks/useSession.ts`
**Pattern:** State machine with controlled transitions

### 2. Authentication & Authorization
**Purpose:** User management and role-based access control
**Examples:** `/mnt/d/Coding/KampusAbla/src/contexts/AuthContext.tsx`, `/mnt/d/Coding/KampusAbla/src/lib/auth.ts`
**Pattern:** JWT-based with role checking

### 3. Booking System
**Purpose:** Marketplace booking and session management
**Examples:** `/mnt/d/Coding/KampusAbla/src/hooks/useBookings.ts`, `/mnt/d/Coding/KampusAbla/src/services/atomicBooking.ts`
**Pattern:** Event sourcing with status tracking

### 4. Payment Processing
**Purpose:** Handle transactions and platform fees
**Examples:** `/mnt/d/Coding/KampusAbla/src/services/payment.ts`, `/mnt/d/Coding/KampusAbla/src/lib/payment.ts`
**Pattern:** Strategy pattern for multiple providers

## Entry Points

### 1. Main Application
**Location:** `/mnt/d/Coding/KampusAbla/src/App.tsx`
**Triggers:** Application startup, routing
**Responsibilities:**
- Setup React Query for data fetching
- Configure authentication providers
- Route handling with lazy loading
- Error boundaries and global error handling

### 2. Authentication
**Location:** `/mnt/d/Coding/KampusAbla/src/contexts/AuthContext.tsx`
**Triggers:** User login, registration, session management
**Responsibilities:**
- Manage Supabase auth state
- Handle user sessions and tokens
- Provide auth methods to UI components

### 3. Dashboard Routes
**Location:** `/mnt/d/Coding/KampusAbla/src/pages/dashboard/`
**Triggers:** User after login
**Responsibilities:**
- Role-based dashboard rendering (parent/sitter)
- Display user-specific data and actions

### 4. API Routes
**Location:** `/mnt/d/Coding/KampusAbla/supabase/functions/`
**Triggers:** Client API calls
**Responsibilities:**
- Serverless backend operations
- Complex business logic execution
- Webhook handling

## Error Handling

**Strategy:** Layered error handling with graceful degradation

**Patterns:**
- Global error boundary for component crashes
- Try/catch in service layers with proper logging
- User-friendly error messages
- Fallback UI for failed operations
- Sentry integration for error tracking

## Cross-Cutting Concerns

**Logging:** Centralized logging with `src/lib/logger.ts`
**Validation:** Zod schemas with `src/schemas/validation.ts`
**Security:** Row-level security in database, JWT auth
**Performance:** React Query caching, code splitting
**Monitoring:** Sentry for errors, Firebase for analytics

---

*Architecture analysis: 2026-03-05*