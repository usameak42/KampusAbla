/**
 * Sitter Profile Types
 */

export interface SitterProfile {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    photo?: string;
    bio: string;
    age: number;
    gender: "female" | "male" | "other";
    university: string;
    department: string;
    yearOfStudy: number;
    hourlyRate: number;
    experienceYears: number;
    languages: string[];
    skills: string[];
    certificates: string[];
    verificationStatus: "pending" | "verified" | "rejected";
    // verificationBadge removed for KA-020 (Single Verified status)
    isVerified: boolean;
    rating: number;
    reviewCount: number;
    completedSessions: number;
    responseRate: number;
    responseTime: string;
    memberSince: Date;
    lastActive: Date;
    isOnline: boolean;
    isPremium: boolean;
    latitude: number;
    longitude: number;
}

export interface SitterAvailability {
    sitterId: string;
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:mm
    endTime: string; // HH:mm
}

// Mock Sitter Data
export const MOCK_SITTERS: SitterProfile[] = [
    {
        id: "sitter-1",
        userId: "user-2",
        firstName: "Elif",
        lastName: "Yıldız",
        photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        bio: "Pedagoji bölümü son sınıf öğrencisiyim. 3 yıldır çocuk bakımı yapıyorum. Yaratıcı aktiviteler, sanat ve müzik konusunda deneyimliyim. Çocuklarla iletişim kurma konusunda çok başarılıyım.",
        age: 22,
        gender: "female",
        university: "Boğaziçi Üniversitesi",
        department: "Psikoloji",
        yearOfStudy: 4,
        hourlyRate: 120,
        experienceYears: 3,
        languages: ["Türkçe", "İngilizce"],
        skills: ["Sanat Aktiviteleri", "Müzik", "Oyun Tasarımı", "İlk Yardım"],
        certificates: ["İlk Yardım Sertifikası", "Çocuk Gelişimi Kursu"],
        verificationStatus: "verified",
        isVerified: true,
        rating: 4.9,
        reviewCount: 47,
        completedSessions: 89,
        responseRate: 98,
        responseTime: "5 dakika",
        memberSince: new Date("2022-09-01"),
        lastActive: new Date(),
        isOnline: true,
        isPremium: true,
        latitude: 41.0422,
        longitude: 29.0073,
    },
    {
        id: "sitter-2",
        userId: "user-3",
        firstName: "Zeynep",
        lastName: "Kaya",
        photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
        bio: "İlköğretim matematik öğretmenliği okuyorum. Ev ödevi yardımı ve eğitici aktiviteler konusunda uzmanım. Çocukların öğrenme sürecini eğlenceli hale getirmeyi seviyorum.",
        age: 21,
        gender: "female",
        university: "İstanbul Üniversitesi",
        department: "İlköğretim Matematik Öğretmenliği",
        yearOfStudy: 3,
        hourlyRate: 100,
        experienceYears: 2,
        languages: ["Türkçe"],
        skills: ["Ev Ödevi Yardımı", "Matematik", "Fen Bilimleri", "Okuma"],
        certificates: ["İlk Yardım Sertifikası"],
        verificationStatus: "verified",
        isVerified: true,
        rating: 4.7,
        reviewCount: 28,
        completedSessions: 45,
        responseRate: 95,
        responseTime: "15 dakika",
        memberSince: new Date("2023-02-15"),
        lastActive: new Date(Date.now() - 1000 * 60 * 30),
        isOnline: false,
        isPremium: false,
        latitude: 41.045,
        longitude: 29.002,
    },
    {
        id: "sitter-3",
        userId: "user-4",
        firstName: "Ayşe",
        lastName: "Demir",
        photo: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200",
        bio: "Hemşirelik bölümü öğrencisiyim. Özellikle bebek bakımı konusunda deneyimliyim. Sağlık konularında güvenle hareket ederim.",
        age: 23,
        gender: "female",
        university: "Marmara Üniversitesi",
        department: "Hemşirelik",
        yearOfStudy: 4,
        hourlyRate: 130,
        experienceYears: 4,
        languages: ["Türkçe", "İngilizce", "Almanca"],
        skills: ["Bebek Bakımı", "Sağlık Takibi", "İlk Yardım", "Beslenme"],
        certificates: ["İlk Yardım Sertifikası", "Bebek Bakımı Sertifikası", "CPR Sertifikası"],
        verificationStatus: "verified",
        isVerified: true,
        rating: 4.95,
        reviewCount: 63,
        completedSessions: 120,
        responseRate: 100,
        responseTime: "2 dakika",
        memberSince: new Date("2021-11-01"),
        lastActive: new Date(),
        isOnline: true,
        isPremium: true,
        latitude: 41.048,
        longitude: 29.012,
    },
    {
        id: "sitter-4",
        userId: "user-5",
        firstName: "Merve",
        lastName: "Özkan",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
        bio: "Okul öncesi eğitimi öğrencisiyim. Yaratıcı oyunlar, hikaye anlatımı ve sanat aktiviteleri konusunda deneyimliyim.",
        age: 20,
        gender: "female",
        university: "Ankara Üniversitesi",
        department: "Okul Öncesi Eğitimi",
        yearOfStudy: 2,
        hourlyRate: 90,
        experienceYears: 1,
        languages: ["Türkçe"],
        skills: ["Oyun", "Hikaye Anlatımı", "El Sanatları", "Müzik"],
        certificates: [],
        verificationStatus: "verified",
        isVerified: true,
        rating: 4.5,
        reviewCount: 12,
        completedSessions: 18,
        responseRate: 90,
        responseTime: "30 dakika",
        memberSince: new Date("2023-09-01"),
        lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isOnline: false,
        isPremium: false,
        latitude: 41.04,
        longitude: 29.005,
    },
];

// Get sitter by ID
export function getSitterById(id: string): SitterProfile | undefined {
    return MOCK_SITTERS.find((s) => s.id === id);
}

// Get sitter display name
export function getSitterDisplayName(sitter: SitterProfile): string {
    return `${sitter.firstName} ${sitter.lastName.charAt(0)}.`;
}

// Format badge
export function getBadgeInfo(badge?: string): { label: string; color: string } | null {
    switch (badge) {
        case "silver":
            return { label: "Doğrulanmış", color: "bg-gray-100 text-gray-700" };
        case "gold":
            return { label: "Güvenilir", color: "bg-amber-100 text-amber-700" };
        case "platinum":
            return { label: "Elite", color: "bg-purple-100 text-purple-700" };
        default:
            return null;
    }
}
