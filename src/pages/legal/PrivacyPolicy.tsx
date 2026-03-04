/**
 * PrivacyPolicy - Privacy Policy Page
 */

import { LegalLayout } from "./LegalLayout";

export default function PrivacyPolicy() {
    return (
        <LegalLayout title="Gizlilik Politikası" lastUpdated="1 Ocak 2024">
            <h2>1. Giriş</h2>
            <p>
                KampusAbla olarak gizliliğinize önem veriyoruz. Bu Gizlilik Politikası,
                kişisel verilerinizi nasıl topladığımızı, kullandığımızı, paylaştığımızı
                ve koruduğumuzu açıklamaktadır.
            </p>

            <h2>2. Topladığımız Veriler</h2>

            <h3>2.1 Doğrudan Sağladığınız Veriler</h3>
            <ul>
                <li>
                    <strong>Hesap Bilgileri:</strong> Ad, soyad, e-posta adresi, telefon
                    numarası, profil fotoğrafı
                </li>
                <li>
                    <strong>Kimlik Doğrulama:</strong> Kimlik belgesi bilgileri, öğrenci
                    belgesi (bakıcılar için)
                </li>
                <li>
                    <strong>Çocuk Bilgileri:</strong> Çocukların adları, yaşları, alerji
                    bilgileri, özel ihtiyaçlar (ebeveynler için)
                </li>
                <li>
                    <strong>Ödeme Bilgileri:</strong> Kredi kartı bilgileri, IBAN numarası
                </li>
            </ul>

            <h3>2.2 Otomatik Toplanan Veriler</h3>
            <ul>
                <li>Cihaz bilgileri (model, işletim sistemi)</li>
                <li>IP adresi</li>
                <li>Konum verileri (izninizle)</li>
                <li>Uygulama kullanım istatistikleri</li>
                <li>Çerez verileri</li>
            </ul>

            <h2>3. Verilerin Kullanım Amaçları</h2>
            <p>Kişisel verilerinizi aşağıdaki amaçlarla kullanıyoruz:</p>
            <ul>
                <li>Hesabınızı oluşturmak ve yönetmek</li>
                <li>Platform hizmetlerini sunmak</li>
                <li>Kimlik doğrulama ve güvenlik kontrollerini yapmak</li>
                <li>Ödeme işlemlerini gerçekleştirmek</li>
                <li>Müşteri desteği sağlamak</li>
                <li>Platform'u geliştirmek ve kişiselleştirmek</li>
                <li>Yasal yükümlülüklerimizi yerine getirmek</li>
                <li>Dolandırıcılığı önlemek</li>
            </ul>

            <h2>4. Verilerin Paylaşımı</h2>

            <h3>4.1 Diğer Kullanıcılarla</h3>
            <p>
                Ebeveynler ve bakıcılar arasında hizmetin sağlanması için gerekli
                bilgiler paylaşılır (ad, profil fotoğrafı, iletişim bilgileri,
                değerlendirmeler).
            </p>

            <h3>4.2 Hizmet Sağlayıcılarla</h3>
            <p>
                Ödeme işlemleri, SMS gönderimi, e-posta servisleri gibi hizmetler için
                güvenilir üçüncü taraf sağlayıcılarla çalışıyoruz. Bu sağlayıcılar
                verilerinizi yalnızca hizmet sunumu için kullanır.
            </p>

            <h3>4.3 Yasal Gereklilikler</h3>
            <p>
                Yasal zorunluluklar, mahkeme kararları veya resmi makam talepleri
                doğrultusunda verilerinizi paylaşabiliriz.
            </p>

            <h2>5. Veri Güvenliği</h2>
            <p>Verilerinizi korumak için aşağıdaki önlemleri alıyoruz:</p>
            <ul>
                <li>SSL/TLS şifreleme</li>
                <li>Güvenli veri depolama</li>
                <li>Erişim kontrolü ve yetkilendirme</li>
                <li>Düzenli güvenlik denetimleri</li>
                <li>Çalışan eğitimi</li>
            </ul>

            <h2>6. Veri Saklama Süresi</h2>
            <p>
                Kişisel verilerinizi yalnızca gerekli olduğu sürece saklarız:
            </p>
            <ul>
                <li>Hesap bilgileri: Hesap aktif olduğu sürece + 2 yıl</li>
                <li>İşlem kayıtları: 10 yıl (yasal zorunluluk)</li>
                <li>Mesajlaşma geçmişi: 1 yıl</li>
                <li>Konum verileri: Seans bitiminde silinir</li>
            </ul>

            <h2>7. Haklarınız</h2>
            <p>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
            <ul>
                <li>Verilerinize erişim hakkı</li>
                <li>Düzeltme talep etme hakkı</li>
                <li>Silme talep etme hakkı</li>
                <li>İşlemenin kısıtlanmasını isteme hakkı</li>
                <li>Veri taşınabilirliği hakkı</li>
                <li>İtiraz hakkı</li>
            </ul>
            <p>
                Bu haklarınızı kullanmak için Ayarlar &gt; Gizlilik bölümünden veya
                legal@kampusabla.com adresinden bizimle iletişime geçebilirsiniz.
            </p>

            <h2>8. Çerezler</h2>
            <p>
                Platform, deneyiminizi iyileştirmek için çerezler kullanmaktadır.
                Çerez kullanımımız hakkında detaylı bilgi için Çerez Politikamızı
                inceleyebilirsiniz.
            </p>

            <h2>9. Çocukların Gizliliği</h2>
            <p>
                Platformumuz 18 yaş üstü kullanıcılara yöneliktir. 18 yaşından küçük
                bireylerin doğrudan kişisel verilerini toplamıyoruz. Ebeveynler
                tarafından sağlanan çocuk bilgileri özel koruma altındadır.
            </p>

            <h2>10. Politika Değişiklikleri</h2>
            <p>
                Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli
                değişiklikler e-posta veya uygulama içi bildirim yoluyla duyurulacaktır.
            </p>

            <h2>11. İletişim</h2>
            <p>
                Gizlilik ile ilgili sorularınız için:
            </p>
            <ul>
                <li>E-posta: privacy@kampusabla.com</li>
                <li>Veri Koruma Sorumlusu: dpo@kampusabla.com</li>
            </ul>
        </LegalLayout>
    );
}
