/**
 * Session Status Types and State Machine
 */

export type SessionStatus =
    | "pending"      // Waiting to start
    | "on-way"       // Sitter is on the way
    | "arrived"      // Sitter arrived at location
    | "in-progress"  // Session actively running
    | "completed"    // Session ended normally
    | "cancelled";   // Session was cancelled

export interface SessionState {
    status: SessionStatus;
    timestamp: Date;
    location?: {
        lat: number;
        lng: number;
    };
    note?: string;
}

export interface Session {
    id: string;
    bookingId: string;
    // Parent
    parentId: string;
    parentName: string;
    parentPhone: string;
    // Sitter
    sitterId: string;
    sitterName: string;
    sitterPhone: string;
    // Children
    childrenNames: string[];
    childrenAges: number[];
    // Times
    scheduledStart: Date;
    scheduledEnd: Date;
    actualStart?: Date;
    actualEnd?: Date;
    // Location
    address: string;
    district: string;
    emergencyContacts: EmergencyContact[];
    // Status
    currentStatus: SessionStatus;
    statusHistory: SessionState[];
    // Notes
    parentNotes?: string;
    sitterNotes?: string;
    // Handover
    handoverPin: string; // 4-digit code
    handoverStartConfirmedAt?: Date;
    handoverEndConfirmedAt?: Date;
}

export interface EmergencyContact {
    name: string;
    relation: string;
    phone: string;
    isPrimary: boolean;
}

// Status transition rules
export const STATUS_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
    "pending": ["on-way", "cancelled"],
    "on-way": ["arrived", "cancelled"],
    "arrived": ["in-progress", "cancelled"],
    "in-progress": ["completed"],
    "completed": [],
    "cancelled": [],
};

// Status display info
export const STATUS_INFO: Record<SessionStatus, { label: string; emoji: string; color: string }> = {
    "pending": { label: "Bekliyor", emoji: "⏳", color: "text-gray-500" },
    "on-way": { label: "Yolda", emoji: "🚗", color: "text-blue-500" },
    "arrived": { label: "Varış", emoji: "📍", color: "text-orange-500" },
    "in-progress": { label: "Devam Ediyor", emoji: "👶", color: "text-green-500" },
    "completed": { label: "Tamamlandı", emoji: "✅", color: "text-gray-400" },
    "cancelled": { label: "İptal", emoji: "❌", color: "text-red-500" },
};

// Check if transition is valid
export function canTransitionTo(currentStatus: SessionStatus, targetStatus: SessionStatus): boolean {
    return STATUS_TRANSITIONS[currentStatus].includes(targetStatus);
}

// Get next possible statuses
export function getNextStatuses(currentStatus: SessionStatus): SessionStatus[] {
    return STATUS_TRANSITIONS[currentStatus];
}
