# Testing Patterns

**Analysis Date:** 2026-03-05

## Test Framework

**Runner:**
- Framework: Vitest
- Config: [`vitest.config.ts`](/mnt/d/Coding/KampusAbla/vitest.config.ts)
- Environment: jsdom
- Global test functions enabled

**Assertion Library:**
- Vitest built-in expect
- Testing-library/jest-dom for DOM assertions
- Custom matchers for business logic

**Run Commands:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e      # Playwright E2E tests
```

## Test File Organization

**Location:**
- Unit tests: `src/**/*.{test,spec}.{ts,tsx}`
- Integration tests: `src/**/*.{test,spec}.{ts,tsx}` (same pattern)
- Test setup: `src/test/setup.ts`
- Mocks: `src/test/mocks/`

**Naming:**
- Files: `[feature].test.ts` or `[feature].spec.ts`
- Describe blocks: Test group/component name
- Test names: Should what behavior is being tested

**Structure:**
```
src/
├── test/
│   ├── example.test.ts          # Example test
│   ├── mocks/
│   │   └── supabase.ts         # Supabase mocks
│   └── setup.ts                 # Test setup
├── services/
│   └── __tests__/
│       └── payment.test.ts      # Service tests
```

## Test Structure

**Suite Organization:**
```typescript
describe("PaymentService", () => {
    let service: PaymentService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new PaymentService();
    });

    describe("processPayment", () => {
        it("should handle success", async () => {
            // Arrange
            mockInvoke.mockResolvedValue({
                data: { success: true, paymentId: "txn_123" },
                error: null,
            });

            // Act
            const result = await service.processPayment(100, "booking_1", "sub_key_1", mockCardData, mockBuyer);

            // Assert
            expect(result.success).toBe(true);
            expect(result.transactionId).toBe("txn_123");
        });

        it("should handle failure", async () => {
            // Arrange
            mockInvoke.mockResolvedValue({
                data: null,
                error: { message: "Payment API error" },
            });

            // Act & Assert
            await expect(service.processPayment(100, "booking_1", "sub_key_1", mockCardData, mockBuyer))
                .rejects.toThrow("Payment API error");
        });
    });
});
```

**Patterns:**
- Arrange-Act-Assert (AAA) pattern
- beforeEach for setup and cleanup
- vi.clearAllMocks() for test isolation
- Descriptive test names that explain the behavior

## Mocking

**Framework:** Vitest built-in mocking

**Patterns:**
```typescript
// Import vi from vitest
import { vi } from "vitest";

// Mock external dependencies
vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        functions: {
            invoke: mockInvoke,
        },
    },
}));

// Mock functions
const mockInvoke = vi.fn();
vi.fn(setTimeout); // Mock timer functions

// Restore mocks after tests
afterEach(() => {
    vi.restoreAllMocks();
});
```

**What to Mock:**
- External API calls
- Database operations
- Third-party libraries
- Time-sensitive functions
- File system operations

**What NOT to Mock:**
- React components (use shallow rendering instead)
- Business logic (test it directly)
- Core browser APIs (unless testing browser-specific behavior)

## Fixtures and Factories

**Test Data:**
```typescript
// Mock data creation
const createMockPaymentData = () => ({
    amount: 100,
    bookingId: "booking_123",
    sitterSubMerchantKey: "sub_key_123",
    paymentCard: {
        cardHolderName: "Test User",
        cardNumber: "5528790000000008",
        expireMonth: "12",
        expireYear: "2030",
        cvc: "123",
    },
    buyer: {
        id: "user_123",
        name: "Test",
        surname: "User",
        email: "test@example.com",
        gsmNumber: "+905551112233",
        identityNumber: "11111111111",
        registrationAddress: "Istanbul",
        city: "Istanbul",
        country: "Turkey",
    }
});

const mockCardData = createMockPaymentData().paymentCard;
const mockBuyer = createMockPaymentData().buyer;
```

**Location:**
- Test-specific mock data in test files
- Shared utilities in `src/test/utils/`
- Factory functions in `src/test/factories/`

## Coverage

**Requirements:** Not strictly enforced, but code coverage is tracked

**View Coverage:**
```bash
npm test -- --coverage  # Generate coverage report
```

**Coverage Targets:**
- Services: 90%+
- Components: 80%+
- Utils: 95%+
- Critical paths: 100%

## Test Types

**Unit Tests:**
- Scope: Individual functions and services
- Focus: Business logic validation
- Mock: External dependencies
- Example: Payment service calculations

**Integration Tests:**
- Scope: Component interactions
- Focus: API endpoints and data flow
- Mock: Minimal (test real integrations where possible)
- Example: Auth context with Supabase

**E2E Tests:**
- Framework: Playwright
- Scope: User journeys
- Focus: End-to-end workflows
- Example: Complete booking flow from search to payment
- Config: [`playwright.config.ts`](/mnt/d/Coding/KampusAbla/playwright.config.ts)

## Common Patterns

**Async Testing:**
```typescript
// Async/Await pattern
it("should handle async operation", async () => {
    const result = await asyncFunction();
    expect(result).toBeDefined();
});

// Promise rejection testing
it("should throw error on invalid input", async () => {
    await expect(asyncFunction invalidInput)
        .rejects.toThrow("Invalid input");
});

// Timer-based testing
it("should update after delay", async () => {
    vi.useFakeTimers();
    await act(async () => {
        await component.update();
        vi.advanceTimersByTime(1000);
    });
    expect(component.state).toBe("updated");
    vi.useRealTimers();
});
```

**Error Testing:**
```typescript
// Error boundary testing
it("should render error boundary on error", () => {
    const { getByText } = render(
        <ErrorBoundary>
            <ComponentThatThrows />
        </ErrorBoundary>
    );
    expect(getByText("Something went wrong")).toBeInTheDocument();
});

// API error testing
it("should handle network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(apiCall()).rejects.toThrow("Network error");
});
```

**Component Testing:**
```typescript
// Render testing
it("renders with correct props", () => {
    const { getByText } = render(<Component prop="value" />);
    expect(getByText("Expected text")).toBeInTheDocument();
});

// Event handling
it("calls handler on click", () => {
    const mockHandler = vi.fn();
    const { getByRole } = render(<Button onClick={mockHandler}>Click</Button>);
    fireEvent.click(getByRole("button"));
    expect(mockHandler).toHaveBeenCalledTimes(1);
});

// State updates
it("updates state on input change", () => {
    const { getByRole } = render(<InputField />);
    const input = getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    expect(input.value).toBe("test");
});
```

---

*Testing analysis: 2026-03-05*