# Agent Context - KampusAbla (CampusSister)

## Project Overview

**KampusAbla** is a verified student marketplace connecting university students with parents who need after-school pickup and edu-sitting services in Istanbul (Beşiktaş pilot).

**Core Value Proposition:** Verified university students (3rd year+) provide safe, trusted after-school pickup + language/homework support for children ages 7-16.

---

## Key Documents

- **PRD.md** - Complete Product Requirements Document with all feature specifications
- **implementation_plan.md** - Phased implementation roadmap with 200+ tasks
- **CLAUDE.md** - AI assistant instructions for working on this project

---

## Project Structure

```
verified-campus-buddy/
├── src/
│   ├── app/              # Next.js app directory (pages)
│   ├── components/       # Reusable React components
│   ├── lib/             # Utility functions, helpers
│   ├── services/        # API services, business logic
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # React context providers
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
├── prisma/              # Database schema and migrations
│   └── schema.prisma    # Prisma schema file
├── api/                 # Backend API routes
├── tests/               # Test files
├── docs/                # Additional documentation
└── config/              # Configuration files
```

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context + Zustand (for complex state)
- **Forms:** React Hook Form + Zod validation
- **UI Components:** shadcn/ui + custom components

### Backend
- **Runtime:** Node.js
- **API:** Next.js API routes
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth.js or custom JWT

### Third-Party Services
- **Payment:** iyzico or Papara (Turkish payment gateway)
- **Maps:** Google Maps API
- **Storage:** AWS S3 or Cloudinary
- **Push Notifications:** Firebase Cloud Messaging
- **Real-time:** Socket.io or Pusher
- **SMS/OTP:** Twilio or local Turkish provider

---

## Database Schema Summary

### Core Tables
- `users` - Base user authentication
- `parents` - Parent-specific data
- `sitters` - Sitter profiles (university students)
- `children` - Child profiles managed by parents
- `sitter_verifications` - Verification documents and status
- `schools` - School information and locations
- `bookings` - Booking requests and confirmations
- `sessions` - Active/completed session tracking
- `session_locations` - GPS tracking data
- `conversations` & `messages` - In-app chat
- `reviews` - Two-sided reviews
- `transactions` - Payment records
- `subscriptions` - Premium features

See **implementation_plan.md Phase 2** for complete schema details.

---

## Key Features & Constraints

### User Roles
1. **Parent** - Creates bookings, manages children
2. **Sitter** - Accepts bookings, provides services
3. **Admin** - Moderates, verifies, manages platform

### Critical Safety Features
- University email + student document verification
- Government ID + selfie + liveness check
- Criminal background check (e-Devlet document)
- Live GPS tracking during sessions
- In-app chat only (no phone number sharing)
- Incident reporting system
- KVKK compliance (Turkish data protection)

### Marketplace Flows
1. **Browse & Request** (default) - Parent searches sitters, sends booking request
2. **Post a Need** - Parent posts need, sitters apply

### Session Lifecycle
1. Booking Request → Sitter Accepts
2. Session Starts → "On my way" status
3. "Picked up" → Transit to meeting location
4. "Arrived" → Active session
5. "Session ended" → Parent confirms
6. Two-sided review unlock

### Payment & Pricing
- **Platform fee:** 10%
- **Pricing range:** 450-800 TL/hour (Beşiktaş pilot)
- **Cancellation policy:**
  - >12 hours: full refund
  - 12-2 hours: 50% charge
  - <2 hours: 100% charge

---

## Coding Conventions

### TypeScript
- Use strict mode
- Define interfaces for all data structures
- Use enums for status types (BookingStatus, SessionStatus, etc.)
- Avoid `any` type

### React Components
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for prop types

### Naming
- **Components:** PascalCase (e.g., `SitterCard`, `BookingList`)
- **Files:** kebab-case for components (e.g., `sitter-card.tsx`)
- **Functions:** camelCase (e.g., `calculatePlatformFee`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `PLATFORM_FEE_RATE`)
- **Database tables:** snake_case (e.g., `sitter_verifications`)

### File Organization
- Group by feature, not by type
- Co-locate related files (component + styles + tests)

Example:
```
features/
  sitter-search/
    components/
      SitterCard.tsx
      SitterList.tsx
      SearchFilters.tsx
    hooks/
      useSearchSitters.ts
    types/
      sitter.types.ts
    sitter-search.page.tsx
```

---

## API Design Principles

### RESTful Conventions
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Use plural nouns for resources (`/api/bookings`, not `/api/booking`)
- Use nested routes for relationships (`/api/sitters/:id/reviews`)

### Response Format
```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking not found"
  }
}
```

### Authentication
- Use JWT tokens in Authorization header
- Implement refresh token rotation
- Rate limit sensitive endpoints

---

## Security Considerations

### Data Protection
- Encrypt sensitive data at rest (ID documents, location history)
- Use HTTPS only
- Implement KVKK consent flows
- Child data requires parent/guardian consent
- Location data retention policy (7 days after session)

### Input Validation
- Validate all user inputs server-side
- Sanitize chat messages
- Block phone numbers/emails in chat
- Prevent XSS, CSRF, SQL injection

### File Uploads
- Validate file types (images only for IDs/selfies)
- Scan for malware
- Limit file sizes (max 5MB)
- Use signed URLs for private documents

---

## Testing Strategy

### Unit Tests
- Business logic functions
- Utility helpers
- Calculation functions (pricing, fees, refunds)

### Integration Tests
- API endpoints
- Database operations
- Third-party service integrations

### E2E Tests
- Critical user flows:
  - Registration (parent + sitter)
  - Verification submission
  - Search and booking
  - Session completion
  - Payment processing

---

## Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL=

# Authentication
JWT_SECRET=
JWT_REFRESH_SECRET=

# Payment Gateway
PAYMENT_API_KEY=
PAYMENT_SECRET_KEY=

# Maps
GOOGLE_MAPS_API_KEY=

# Storage
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Notifications
FCM_SERVER_KEY=

# Real-time
SOCKET_IO_URL=
```

---

## Common Tasks

### Add a New Page
1. Create page file in `src/app/[route]/page.tsx`
2. Add navigation link in appropriate layout
3. Update page connectivity map in docs

### Add a New Database Table
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name [migration_name]`
3. Generate Prisma client: `npx prisma generate`

### Add a New API Endpoint
1. Create route handler in `src/app/api/[route]/route.ts`
2. Add authentication middleware if needed
3. Implement request validation
4. Write unit tests

### Deploy Changes
1. Run tests: `npm test`
2. Build: `npm run build`
3. Push to repository
4. CI/CD pipeline handles deployment

---

## Troubleshooting

### Common Issues

**Database connection errors:**
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL is running
- Run migrations: `npx prisma migrate dev`

**Build errors:**
- Clear cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Type errors:**
- Regenerate Prisma client: `npx prisma generate`
- Check TypeScript version compatibility

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [KVKK Guidelines](https://kvkk.gov.tr)
- [iyzico API Docs](https://dev.iyzipay.com)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)

---

## Development Workflow

1. **Pick a task** from `implementation_plan.md`
2. **Create feature branch:** `git checkout -b feature/task-name`
3. **Implement** following coding conventions
4. **Write tests** for new functionality
5. **Run linter:** `npm run lint`
6. **Run tests:** `npm test`
7. **Commit** with clear message
8. **Push** and create pull request
9. **Code review** by team
10. **Merge** to main/develop branch

---

## Contact & Support

For questions or issues, refer to:
- Project manager: [Contact info]
- Tech lead: [Contact info]
- Documentation: This file + PRD.md + implementation_plan.md
