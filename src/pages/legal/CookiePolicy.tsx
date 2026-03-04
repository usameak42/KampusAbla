/**
 * CookiePolicy - Cookie Policy Page
 */

import { LegalLayout } from "./LegalLayout";

export default function CookiePolicy() {
    return (
        <LegalLayout title="Çerez Politikası" lastUpdated="1 Ocak 2024">
            <h2>1. Çerezler Hakkında</h2>
            <p>
                Bu Çerez Politikası, KampusAbla platformunun ("Platform") çerez ve
                benzeri teknolojileri nasıl kullandığını açıklamaktadır.
            </p>
            <p>
                Çerezler, web siteleri veya uygulamalar tarafından cihazınıza yerleştirilen
                küçük metin dosyalarıdır. Bu dosyalar, tercihlerinizi hatırlamamıza ve
                deneyiminizi kişiselleştirmemize yardımcı olur.
            </p>

            <h2>2. Kullandığımız Çerez Türleri</h2>

            <h3>2.1 Zorunlu Çerezler</h3>
            <p>
                Bu çerezler Platform'un çalışması için gereklidir ve kapatılamazlar.
                Genellikle gizlilik tercihlerinizi ayarlama, oturum açma veya form
                doldurma gibi hizmet taleplerinize yanıt olarak ayarlanırlar.
            </p>
            <ul>
                <li><strong>session_id:</strong> Oturum yönetimi (oturum çerezi)</li>
                <li><strong>csrf_token:</strong> Güvenlik (oturum çerezi)</li>
                <li><strong>auth_token:</strong> Kimlik doğrulama (kalıcı, 30 gün)</li>
            </ul>

            <h3>2.2 İşlevsel Çerezler</h3>
            <p>
                Bu çerezler Platform'un gelişmiş işlevsellik ve kişiselleştirme
                sağlamasını mümkün kılar. Tarafımızca veya sayfalarımıza hizmet ekleyen
                üçüncü taraf sağlayıcılar tarafından ayarlanabilir.
            </p>
            <ul>
                <li><strong>language:</strong> Dil tercihi (kalıcı, 1 yıl)</li>
                <li><strong>theme:</strong> Tema tercihi (kalıcı, 1 yıl)</li>
                <li><strong>notification_prefs:</strong> Bildirim ayarları (kalıcı, 1 yıl)</li>
            </ul>

            <h3>2.3 Analitik Çerezler</h3>
            <p>
                Bu çerezler, Platform'un nasıl kullanıldığını anlamamıza yardımcı olur.
                Tüm bilgiler anonimleştirilir ve bireysel kullanıcıları tanımlamak
                için kullanılmaz.
            </p>
            <ul>
                <li><strong>_ga:</strong> Google Analytics (kalıcı, 2 yıl)</li>
                <li><strong>_gid:</strong> Google Analytics (kalıcı, 24 saat)</li>
            </ul>

            <h3>2.4 Pazarlama Çerezleri</h3>
            <p>
                Bu çerezler, size ilgi alanlarınıza göre reklamlar göstermek için
                kullanılır. Açık rızanız olmadan bu çerezler ayarlanmaz.
            </p>
            <ul>
                <li><strong>_fbp:</strong> Facebook Pixel (kalıcı, 90 gün)</li>
            </ul>

            <h2>3. Üçüncü Taraf Çerezleri</h2>
            <p>Platform'da aşağıdaki üçüncü taraf hizmetlerini kullanıyoruz:</p>
            <ul>
                <li>
                    <strong>Google Analytics:</strong> Site kullanım istatistikleri
                </li>
                <li>
                    <strong>Facebook Pixel:</strong> Pazarlama ve yeniden hedefleme
                    (rızanızla)
                </li>
                <li>
                    <strong>iyzico:</strong> Ödeme işleme
                </li>
            </ul>

            <h2>4. Çerez Tercihlerinizi Yönetme</h2>

            <h3>4.1 Platform Ayarları</h3>
            <p>
                Ayarlar &gt; Gizlilik &gt; Çerez Tercihleri bölümünden çerez tercihlerinizi
                yönetebilirsiniz. Zorunlu çerezler dışındaki tüm çerez türlerini
                etkinleştirebilir veya devre dışı bırakabilirsiniz.
            </p>

            <h3>4.2 Tarayıcı Ayarları</h3>
            <p>
                Çoğu web tarayıcısı, çerezleri kontrol etmenize olanak tanır.
                Tarayıcınızın ayarlar menüsünden:
            </p>
            <ul>
                <li>Çerezleri görüntüleyebilir ve silebilirsiniz</li>
                <li>Tüm çerezleri engelleyebilirsiniz</li>
                <li>Belirli sitelerin çerezlerini engelleyebilirsiniz</li>
                <li>Çerez ayarlandığında bildirim alabilirsiniz</li>
            </ul>

            <h3>4.3 Mobil Cihazlar</h3>
            <p>
                Mobil cihazınızın işletim sistemi ayarlarından reklam izlemeyi
                sınırlayabilir veya tanıtıcı kimliğinizi sıfırlayabilirsiniz.
            </p>

            <h2>5. Çerezleri Devre Dışı Bırakmanın Etkileri</h2>
            <p>
                Çerezleri devre dışı bırakmak Platform'un bazı özelliklerinin düzgün
                çalışmamasına neden olabilir:
            </p>
            <ul>
                <li>Oturum açık kalmaz, her ziyarette giriş yapmanız gerekir</li>
                <li>Tercihleriniz kaydedilmez</li>
                <li>Bazı özellikler kullanılamayabilir</li>
            </ul>

            <h2>6. Do Not Track (DNT)</h2>
            <p>
                Bazı tarayıcılar "Do Not Track" sinyali gönderir. Şu anda bu
                sinyallere standart bir yanıt bulunmamaktadır, ancak çerez
                tercihlerinizi Platform ayarlarından yönetebilirsiniz.
            </p>

            <h2>7. Politika Güncellemeleri</h2>
            <p>
                Bu Çerez Politikasını zaman zaman güncelleyebiliriz. Önemli
                değişiklikler Platform üzerinden duyurulacaktır.
            </p>

            <h2>8. İletişim</h2>
            <p>
                Çerezler hakkında sorularınız için privacy@kampusabla.com adresinden
                bizimle iletişime geçebilirsiniz.
            </p>
        </LegalLayout>
    );
}
