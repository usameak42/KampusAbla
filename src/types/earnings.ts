/**
 * Earnings Types and Mock Data
 */

export interface EarningEntry {
    id: string;
    sessionId: string;
    parentName: string;
    childrenCount: number;
    date: Date;
    duration: number; // in hours
    hourlyRate: number;
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    status: "pending" | "processing" | "paid" | "failed";
    paidAt?: Date;
}

export interface PayoutRequest {
    id: string;
    amount: number;
    status: "pending" | "processing" | "completed" | "failed";
    requestedAt: Date;
    completedAt?: Date;
    bankAccount: string;
}

export interface EarningsSummary {
    totalEarnings: number;
    pendingAmount: number;
    availableBalance: number;
    thisMonthEarnings: number;
    lastMonthEarnings: number;
    totalSessions: number;
    averagePerSession: number;
}

// Mock earnings data
export const MOCK_EARNINGS: EarningEntry[] = [
    {
        id: "earn-1",
        sessionId: "sess-1",
        parentName: "Ayşe K.",
        childrenCount: 2,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        duration: 4,
        hourlyRate: 120,
        grossAmount: 480,
        platformFee: 48,
        netAmount: 432,
        status: "paid",
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
        id: "earn-2",
        sessionId: "sess-2",
        parentName: "Mehmet Y.",
        childrenCount: 1,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        duration: 3,
        hourlyRate: 120,
        grossAmount: 360,
        platformFee: 36,
        netAmount: 324,
        status: "paid",
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
    {
        id: "earn-3",
        sessionId: "sess-3",
        parentName: "Fatma D.",
        childrenCount: 1,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        duration: 5,
        hourlyRate: 120,
        grossAmount: 600,
        platformFee: 60,
        netAmount: 540,
        status: "paid",
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    },
    {
        id: "earn-4",
        sessionId: "sess-4",
        parentName: "Ali B.",
        childrenCount: 2,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24),
        duration: 3,
        hourlyRate: 120,
        grossAmount: 360,
        platformFee: 36,
        netAmount: 324,
        status: "pending",
    },
    {
        id: "earn-5",
        sessionId: "sess-5",
        parentName: "Zeynep S.",
        childrenCount: 1,
        date: new Date(),
        duration: 4,
        hourlyRate: 120,
        grossAmount: 480,
        platformFee: 48,
        netAmount: 432,
        status: "pending",
    },
];

// Mock payout requests
export const MOCK_PAYOUTS: PayoutRequest[] = [
    {
        id: "payout-1",
        amount: 1000,
        status: "completed",
        requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
        bankAccount: "TR** **** **** **** **** 4532",
    },
    {
        id: "payout-2",
        amount: 800,
        status: "completed",
        requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28),
        bankAccount: "TR** **** **** **** **** 4532",
    },
];

// Calculate summary
export function calculateEarningsSummary(earnings: EarningEntry[]): EarningsSummary {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const paidEarnings = earnings.filter((e) => e.status === "paid");
    const pendingEarnings = earnings.filter((e) => e.status === "pending");

    const thisMonthEarnings = paidEarnings
        .filter((e) => e.paidAt && e.paidAt >= thisMonthStart)
        .reduce((sum, e) => sum + e.netAmount, 0);

    const lastMonthEarnings = paidEarnings
        .filter((e) => e.paidAt && e.paidAt >= lastMonthStart && e.paidAt <= lastMonthEnd)
        .reduce((sum, e) => sum + e.netAmount, 0);

    const totalEarnings = paidEarnings.reduce((sum, e) => sum + e.netAmount, 0);
    const pendingAmount = pendingEarnings.reduce((sum, e) => sum + e.netAmount, 0);

    // Available balance (mock: pending amounts become available after 24h)
    const availableBalance = pendingEarnings
        .filter((e) => new Date(e.date).getTime() < Date.now() - 1000 * 60 * 60 * 24)
        .reduce((sum, e) => sum + e.netAmount, 0);

    return {
        totalEarnings,
        pendingAmount,
        availableBalance,
        thisMonthEarnings,
        lastMonthEarnings,
        totalSessions: earnings.length,
        averagePerSession: earnings.length > 0
            ? Math.round(totalEarnings / paidEarnings.length)
            : 0,
    };
}
