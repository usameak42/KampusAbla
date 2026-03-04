# Instructions for Claude (AI Assistant)

> **Context file for AI assistants working on the KampusAbla project**

---

## 📋 Project Context

You are working on **KampusAbla (CampusSister)**, a two-sided marketplace platform that connects verified university students with parents who need after-school pickup and educational sitting services in Istanbul, Turkey.

### Critical Documents to Review First
1. **PRD.md** - Complete product requirements and feature specifications
2. **implementation_plan.md** - 20-phase development roadmap with 200+ tasks
3. **agent.md** - Technical context, conventions, and architecture

---

## 🎯 Your Role

When assisting with this project, you should:

1. **Understand the domain** - This is a safety-critical childcare platform requiring KVKK compliance
2. **Follow the implementation plan** - Reference phases and tasks from implementation_plan.md
3. **Prioritize safety** - Verification, location tracking, and data protection are non-negotiable
4. **Write production-ready code** - Include error handling, validation, and TypeScript types
5. **Consider Turkish context** - Payment gateways (iyzico/Papara), KVKK compliance, e-Devlet integration

---

## 🔑 Key Domain Concepts

### User Types
- **Parent** - Creates bookings, manages children, tracks sessions
- **Sitter** - University student (3rd year+) providing pickup + edu-sitting services
- **Child** - Profile managed by parent (no login), age 7-16
- **Admin** - Platform moderator handling verification and disputes

### Core Flows
1. **Verification Flow** - Sitter submits university email, ID, background check documents
2. **Booking Flow** - Parent requests → Sitter accepts → Session happens → Reviews unlocked
3. **Session Flow** - On my way → Picked up → Arrived → Session ended → Parent confirms
4. **Payment Flow** - Escrow on booking → Release on completion → 10% platform fee

### Critical Safety Requirements
- All sitters MUST be verified (university + ID + background check)
- Live GPS tracking during all sessions
- In-app chat only (no phone number sharing)
- KVKK consent for location tracking and child data
- Parent/guardian consent required for all child data

---

## 💻 Technical Guidelines

### Tech Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Prisma ORM, PostgreSQL
- **Services:** iyzico/Papara (payments), Google Maps, Firebase (push), Socket.io (real-time)

### Code Style
```typescript
// ✅ GOOD - Type-safe, validated, error-handled
interface BookingRequest {
  parentId: string;
  sitterId: string;
  childId: string;
  date: Date;
  startTime: string;
  durationHours: number;
  pickupNeeded: boolean;
  meetingAddress: string;
  notes?: string;
}

async function createBooking(data: BookingRequest): Promise<Booking> {
  // Validate input
  const validation = BookingSchema.safeParse(data);
  if (!validation.success) {
    throw new ValidationError(validation.error);
  }

  // Check sitter is verified
  const sitter = await prisma.sitter.findUnique({
    where: { id: data.sitterId },
    select: { verificationStatus: true }
  });
  
  if (sitter?.verificationStatus !== 'VERIFIED') {
    throw new Error('Sitter must be verified');
  }

  // Create booking with transaction
  const booking = await prisma.booking.create({
    data: {
      ...data,
      status: 'PENDING'
    }
  });

  // Send notification
  await sendBookingNotification(booking);

  return booking;
}

// ❌ BAD - No types, no validation, no error handling
async function createBooking(data) {
  const booking = await prisma.booking.create({ data });
  return booking;
}
```

### Database Operations
- Always use Prisma for database operations
- Use transactions for multi-step operations
- Include proper error handling
- Validate data before DB operations

### API Endpoints
- Use RESTful conventions
- Return consistent response format
- Include authentication/authorization checks
- Validate all inputs server-side

---

## 🛡️ Security & Compliance

### KVKK (Turkish GDPR) Requirements
```typescript
// Always require KVKK consent before collecting location data
async function startLocationTracking(sessionId: string, userId: string) {
  // Check for location consent
  const consent = await prisma.kvkkConsent.findFirst({
    where: {
      userId,
      consentType: 'LOCATION_TRACKING',
      grantedAt: { not: null }
    }
  });

  if (!consent) {
    throw new Error('Location tracking consent required');
  }

  // Proceed with tracking...
}
```

### Child Data Protection
```typescript
// Child data requires parent/guardian consent
async function createChildProfile(parentId: string, childData: ChildData) {
  // Verify parent relationship
  const parent = await prisma.parent.findUnique({
    where: { id: parentId }
  });

  if (!parent) {
    throw new Error('Parent not found');
  }

  // Log consent for child data processing
  await prisma.kvkkConsent.create({
    data: {
      userId: parentId,
      consentType: 'CHILD_DATA_PROCESSING',
      ipAddress: req.ip,
      grantedAt: new Date()
    }
  });

  // Create child profile...
}
```

### Input Validation
```typescript
// Block phone numbers and emails in chat
function sanitizeChatMessage(content: string): string {
  const phonePattern = /(\+90|0)?[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  let sanitized = content.replace(phonePattern, '[BLOCKED]');
  sanitized = sanitized.replace(emailPattern, '[BLOCKED]');
  
  return sanitized;
}
```

---

## 📐 Common Patterns

### Page Structure
```typescript
// app/bookings/[id]/page.tsx
import { getBookingById } from '@/services/bookings';
import { BookingDetail } from '@/components/bookings';

interface PageProps {
  params: { id: string };
}

export default async function BookingPage({ params }: PageProps) {
  const booking = await getBookingById(params.id);
  
  if (!booking) {
    notFound();
  }

  return <BookingDetail booking={booking} />;
}
```

### API Route
```typescript
// app/api/bookings/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { acceptBooking } from '@/services/bookings';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process
    const booking = await acceptBooking(params.id, session.user.id);

    return NextResponse.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Service Layer
```typescript
// services/bookings.ts
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

export async function acceptBooking(bookingId: string, sitterId: string) {
  // Verify sitter owns this booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { sitter: true, parent: true }
  });

  if (!booking || booking.sitterId !== sitterId) {
    throw new Error('Booking not found or unauthorized');
  }

  if (booking.status !== 'PENDING') {
    throw new Error('Booking not in pending state');
  }

  // Update booking and create session
  const [updatedBooking, session] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' }
    }),
    prisma.session.create({
      data: {
        bookingId,
        status: 'CONFIRMED'
      }
    })
  ]);

  // Send notification to parent
  await sendNotification({
    userId: booking.parentId,
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed',
    message: `${booking.sitter.fullName} accepted your booking`
  });

  return updatedBooking;
}
```

---

## 🧭 When Implementing Features

### Step-by-Step Approach

1. **Check the implementation plan** - Find the relevant phase and task
2. **Review requirements** - Check PRD.md for feature specifications
3. **Design database changes** - Update Prisma schema if needed
4. **Implement backend first** - API routes, services, validation
5. **Create UI components** - Follow Tailwind/shadcn patterns
6. **Add error handling** - User-friendly messages, logging
7. **Write tests** - Unit tests for logic, integration for API
8. **Update documentation** - Comment complex logic

### Example: Implementing "Accept Booking" Feature

```typescript
// 1. Database (already defined in schema)
// sessions table exists with booking relationship

// 2. Service layer
// services/bookings.ts
export async function acceptBooking(bookingId: string, sitterId: string) {
  // Implementation above...
}

// 3. API route
// app/api/bookings/[id]/accept/route.ts
export async function POST(req, { params }) {
  // Implementation above...
}

// 4. Frontend hook
// hooks/useAcceptBooking.ts
export function useAcceptBooking() {
  const [loading, setLoading] = useState(false);
  
  const acceptBooking = async (bookingId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return data.data;
    } catch (error) {
      toast.error('Failed to accept booking');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return { acceptBooking, loading };
}

// 5. UI component
// components/bookings/BookingRequestCard.tsx
export function BookingRequestCard({ booking }: Props) {
  const { acceptBooking, loading } = useAcceptBooking();
  
  const handleAccept = async () => {
    try {
      await acceptBooking(booking.id);
      toast.success('Booking accepted!');
      router.push(`/sessions/${booking.id}`);
    } catch (error) {
      // Error handled in hook
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{booking.parent.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Booking details */}
      </CardContent>
      <CardFooter>
        <Button onClick={handleAccept} disabled={loading}>
          {loading ? 'Accepting...' : 'Accept Booking'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## ⚠️ Common Pitfalls to Avoid

### ❌ Don't Do This
```typescript
// Exposing sensitive data
export async function GET(req) {
  const users = await prisma.user.findMany(); // Returns ALL users with passwords!
  return NextResponse.json(users);
}

// No verification check
const booking = await prisma.booking.create({
  data: { sitterId } // Sitter might not be verified!
});

// Missing KVKK consent
await startLocationTracking(sessionId); // No consent check!

// Hardcoded values
const platformFee = booking.amount * 0.1; // What if fee changes?
```

### ✅ Do This Instead
```typescript
// Selective data exposure
export async function GET(req) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      role: true
      // No password, no sensitive data
    }
  });
  return NextResponse.json(users);
}

// Verification check
const sitter = await prisma.sitter.findUnique({
  where: { id: sitterId },
  select: { verificationStatus: true }
});

if (sitter?.verificationStatus !== 'VERIFIED') {
  throw new Error('Sitter must be verified');
}

// KVKK consent
const hasConsent = await checkLocationConsent(userId);
if (!hasConsent) {
  throw new Error('Location consent required');
}

// Configuration constants
import { PLATFORM_FEE_RATE } from '@/config/constants';
const platformFee = booking.amount * PLATFORM_FEE_RATE;
```

---

## 🗺️ Navigation & Page Connectivity

When implementing navigation, follow this structure:

**Parent Journey:**
Landing → Registration → Dashboard → Search Sitters → Sitter Profile → Booking Request → Active Session → Review

**Sitter Journey:**
Landing → Registration → Verification → Dashboard → Incoming Requests / Nearby Needs → Active Session → Review

See the **Page Connectivity Map** in implementation_plan.md for complete structure.

---

## 🧪 Testing Expectations

### What to Test
```typescript
// Unit test - Business logic
describe('calculateRefundAmount', () => {
  it('returns full refund if cancelled >12 hours before', () => {
    const booking = {
      amount: 1000,
      startTime: addHours(new Date(), 24)
    };
    expect(calculateRefundAmount(booking)).toBe(1000);
  });

  it('returns 50% if cancelled 2-12 hours before', () => {
    const booking = {
      amount: 1000,
      startTime: addHours(new Date(), 6)
    };
    expect(calculateRefundAmount(booking)).toBe(500);
  });
});

// Integration test - API endpoint
describe('POST /api/bookings', () => {
  it('creates booking with valid data', async () => {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBookingData)
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('PENDING');
  });
});
```

---

## 📝 Documentation Standards

When writing code, include:

```typescript
/**
 * Accepts a pending booking request and creates a session
 * 
 * @param bookingId - ID of the booking to accept
 * @param sitterId - ID of the sitter accepting the booking
 * @returns The updated booking with status CONFIRMED
 * @throws Error if booking not found, unauthorized, or not in PENDING state
 * 
 * Side effects:
 * - Creates a new session record
 * - Sends notification to parent
 * - Updates booking status to CONFIRMED
 */
export async function acceptBooking(
  bookingId: string,
  sitterId: string
): Promise<Booking> {
  // Implementation...
}
```

---

## 🚦 When to Ask for Clarification

Ask the user when you encounter:

1. **Ambiguous requirements** - Feature behavior not specified in PRD
2. **Design decisions** - Multiple valid approaches (e.g., optimistic UI updates)
3. **Third-party choices** - Which specific service to use (if not specified)
4. **Data migration concerns** - Changes affecting existing data
5. **Performance tradeoffs** - Real-time vs polling, caching strategies
6. **Security decisions** - Authentication flows, permission models

---

## 🎯 Success Criteria

Your implementation is successful when:

✅ Code follows TypeScript strict mode (no `any` types)  
✅ All inputs are validated (Zod schemas)  
✅ Errors are handled gracefully  
✅ Security checks are in place (auth, verification, KVKK)  
✅ Database operations use transactions where needed  
✅ Response formats are consistent  
✅ Code is well-commented for complex logic  
✅ Tests cover critical paths  

---

## 📚 Reference Priority

When implementing features, consult in this order:

1. **PRD.md** - Feature requirements and specifications
2. **implementation_plan.md** - Task checklist and phase structure
3. **agent.md** - Technical conventions and patterns
4. **This file (CLAUDE.md)** - Code examples and best practices
5. **Official docs** - Next.js, Prisma, etc.

---

## 🤖 Final Notes

- **Be proactive** - Suggest improvements aligned with the PRD
- **Think safety-first** - This is a childcare platform
- **Write production code** - Not prototypes
- **Ask questions** - Better to clarify than assume
- **Follow the plan** - Reference implementation_plan.md tasks
- **Turkish context matters** - KVKK, payment gateways, e-Devlet

**You're building a platform that keeps children safe. Code accordingly.** 🛡️
