/**
 * Help & Support Types and FAQ Data
 */

export type FAQCategory =
    | "general"
    | "booking"
    | "payment"
    | "safety"
    | "account"
    | "sitter";

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: FAQCategory;
}

export interface SupportTicket {
    id: string;
    userId: string;
    subject: string;
    category: FAQCategory;
    message: string;
    status: "open" | "in_progress" | "resolved" | "closed";
    createdAt: Date;
    updatedAt: Date;
    responses?: TicketResponse[];
}

export interface TicketResponse {
    id: string;
    ticketId: string;
    message: string;
    isStaff: boolean;
    createdAt: Date;
}

// FAQ Category Labels
export const FAQ_CATEGORY_LABELS: Record<FAQCategory, string> = {
    general: "Genel",
    booking: "Rezervasyon",
    payment: "Ödeme",
    safety: "Güvenlik",
    account: "Hesap",
    sitter: "Bakıcılar İçin",
};

// FAQ Data
export const FAQ_DATA: FAQItem[] = [
    // General
    {
        id: "faq-1",
        category: "general",
        question: "KampusAbla nedir?",
        answer: "KampusAbla, ebeveynleri üniversite öğrencisi bakıcılarla buluşturan güvenli bir platformdur. Tüm bakıcılarımız kapsamlı doğrulama süreçlerinden geçer ve platform üzerinden güvenli ödeme yapılır.",
    },
    {
        id: "faq-2",
        category: "general",
        question: "Nasıl kayıt olabilirim?",
        answer: "Ana sayfadaki 'Kayıt Ol' butonuna tıklayarak ebeveyn veya bakıcı olarak kayıt olabilirsiniz. E-posta ve telefon doğrulaması yapmanız gerekmektedir.",
    },
    {
        id: "faq-3",
        category: "general",
        question: "Uygulama ücretli mi?",
        answer: "Temel özellikler ücretsizdir. Daha fazla rezervasyon ve özel özellikler için Premium planlarımızı inceleyebilirsiniz.",
    },

    // Booking
    {
        id: "faq-4",
        category: "booking",
        question: "Nasıl rezervasyon yapabilirim?",
        answer: "Bakıcı profilini ziyaret edip uygun saat aralıklarından birine tıklayarak rezervasyon talebi gönderebilirsiniz. Bakıcı onayladığında rezervasyonunuz kesinleşir.",
    },
    {
        id: "faq-5",
        category: "booking",
        question: "Rezervasyonumu nasıl iptal edebilirim?",
        answer: "Rezervasyonlarım sayfasından ilgili rezervasyonu seçip 'İptal Et' butonuna tıklayabilirsiniz. 24 saatten fazla önceden iptal ücretsizdir.",
    },
    {
        id: "faq-6",
        category: "booking",
        question: "Bakıcı gelmezse ne olur?",
        answer: "Bakıcının randevuya gelmemesi durumunda tam iade yapılır ve bakıcının hesabı incelemeye alınır. Bu durumu hemen bize bildirmenizi rica ederiz.",
    },

    // Payment
    {
        id: "faq-7",
        category: "payment",
        question: "Ödeme nasıl yapılır?",
        answer: "Tüm ödemeler platform üzerinden güvenli ödeme altyapısıyla yapılır. Kredi kartı veya banka kartı kullanabilirsiniz.",
    },
    {
        id: "faq-8",
        category: "payment",
        question: "Bakıcı ücretleri ne zaman ödenir?",
        answer: "Seans tamamlandıktan 24 saat sonra bakıcının belirttiği hesaba aktarılır. Premium bakıcılar için bu süre 12 saattir.",
    },
    {
        id: "faq-9",
        category: "payment",
        question: "İade politikanız nedir?",
        answer: "24 saatten fazla önceden iptal: tam iade. 24 saat içinde iptal: %50 kesinti. Bildirim yapmadan iptal: iade yapılmaz.",
    },

    // Safety
    {
        id: "faq-10",
        category: "safety",
        question: "Bakıcılar nasıl doğrulanıyor?",
        answer: "Tüm bakıcılar kimlik doğrulaması, öğrenci belgesi kontrolü ve sabıka kaydı sorgulamasından geçer. Ayrıca yüz yüze mülakat yapılmaktadır.",
    },
    {
        id: "faq-11",
        category: "safety",
        question: "Acil durumlarda ne yapmalıyım?",
        answer: "Uygulama içindeki SOS butonunu kullanabilir veya Güvenlik Merkezi'nden acil durum iletişim bilgilerine ulaşabilirsiniz. 112'yi aramayı unutmayın.",
    },
    {
        id: "faq-12",
        category: "safety",
        question: "Konum paylaşımı nasıl çalışır?",
        answer: "Seans sırasında bakıcının konumunu anlık olarak takip edebilirsiniz. Bu özellik isteğe bağlıdır ve Gizlilik Ayarları'ndan yönetilebilir.",
    },

    // Account
    {
        id: "faq-13",
        category: "account",
        question: "Şifremi unuttum, ne yapmalıyım?",
        answer: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısına tıklayın. E-posta adresinize şifre sıfırlama linki gönderilecektir.",
    },
    {
        id: "faq-14",
        category: "account",
        question: "Hesabımı nasıl silebilirim?",
        answer: "Ayarlar > Gizlilik > Hesabı Sil bölümünden hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.",
    },
    {
        id: "faq-15",
        category: "account",
        question: "E-posta adresimi nasıl değiştirebilirim?",
        answer: "Ayarlar > Hesap > E-posta bölümünden yeni e-posta adresinizi girebilirsiniz. Doğrulama e-postası gönderilecektir.",
    },

    // Sitter
    {
        id: "faq-16",
        category: "sitter",
        question: "Bakıcı olarak nasıl başlarım?",
        answer: "Bakıcı olarak kayıt olduktan sonra kimlik doğrulama ve öğrenci belgesi yüklemeniz gerekmektedir. Onay süreci 1-3 iş günü sürer.",
    },
    {
        id: "faq-17",
        category: "sitter",
        question: "Saatlik ücretimi nasıl belirlerim?",
        answer: "Profilinizde saatlik ücretinizi belirleyebilirsiniz. Önerilen aralık ₺80-150'dir. Deneyim ve değerlendirmelerinize göre artırabilirsiniz.",
    },
    {
        id: "faq-18",
        category: "sitter",
        question: "Daha fazla iş almak için ne yapmalıyım?",
        answer: "Profilinizi tamamen doldurun, profesyonel fotoğraflar ekleyin, müsaitlik takvimini güncel tutun ve olumlu değerlendirmeler almaya özen gösterin.",
    },
];

// Get FAQ by category
export function getFAQByCategory(category: FAQCategory): FAQItem[] {
    return FAQ_DATA.filter((faq) => faq.category === category);
}

// Search FAQ
export function searchFAQ(query: string): FAQItem[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    return FAQ_DATA.filter(
        (faq) =>
            faq.question.toLowerCase().includes(normalizedQuery) ||
            faq.answer.toLowerCase().includes(normalizedQuery)
    );
}
