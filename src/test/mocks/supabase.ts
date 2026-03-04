import { vi } from "vitest";

// Mock that supports chaining as expected by useSearchSitters.test.tsx
export const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
    or: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    not: vi.fn(),
    eq: vi.fn(),
    contains: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
    },
    channel: vi.fn(() => ({
        on: vi.fn(() => ({ subscribe: vi.fn() })),
    })),
};

export const mockSupabaseClient = mockSupabase;
export const supabase = mockSupabase;
