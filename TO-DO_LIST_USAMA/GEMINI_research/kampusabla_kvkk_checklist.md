# KampusAbla - KVKK Uyum ve Hukuki Altyapı Kontrol Listesi (2026)

## 1. Hazırlanması Gereken Hukuki Belgeler

Platformunuz sıradan bir e-ticaret sitesi değildir; özel nitelikli kişisel veri işleyen yüksek riskli bir platformdur. Aşağıdaki metinler şirket avukatınız tarafından platforma özel olarak yazılmalıdır:

* **[ ] Genel Aydınlatma Metni:** Web sitesi ziyaretçileri ve potansiyel kullanıcılar için standart bilgilendirme.
* **[ ] Ebeveyn Aydınlatma Metni:** Çocukların isim, yaş ve özellikle "alerji" gibi sağlık verilerinin (özel nitelikli kişisel veri), ayrıca ödeme bilgilerinin nasıl işleneceğini detaylandıran metin.
* **[ ] Bakıcı (Sitter) Aydınlatma Metni:** Kimlik doğrulama, GPS lokasyon takibi ve adli sicil belgelerinin toplanma ve işlenme amaçlarını açıklayan özel metin.
* **[ ] Açık Rıza Beyanları:** Aydınlatma metinlerinden tamamen ayrı, özgür iradeyle işaretlenecek (önceden seçili olmayan) onay kutucukları (checkbox) şeklinde olmalıdır.
* **[ ] Kişisel Veri Saklama ve İmha Politikası:** Kurum içi veri yaşam döngüsünü belirleyen zorunlu belge.
* **[ ] Çerez (Cookie) Politikası:** İnternet sitesinde kullanılan takip teknolojileri için bilgilendirme ve onay metni.

## 2. İzin/Rıza (Consent) Türleri ve Toplanma Zamanları

Kişisel veri işleme şartları gereği, "Aydınlatma" (bilgilendirme) yükümlülüğü her zaman "Açık Rıza" (onay) alınmadan *önce* yerine getirilmelidir.

* **[ ] OTP/SMS Doğrulama Öncesi Aydınlatma:** KVKK Kurulunun yeni ilke kararı gereği; hesap açma sırasında SMS doğrulama kodu (OTP) gönderilmesi bir veri işleme faaliyetidir ve OTP gönderilmeden hemen önce kullanıcıya Aydınlatma Metni sunulmalıdır.
* **[ ] Adli Sicil Kaydı ve Sağlık Verisi İçin Özel Açık Rıza:** Ebeveynlerden çocukların alerji/sağlık bilgileri için, bakıcılardan ise adli sicil kaydı için mutlaka "Özel Nitelikli Kişisel Veri Açık Rızası" alınmalıdır. Açık rıza ve hizmet şartları (Kullanıcı Sözleşmesi) tek bir onay kutusuna birleştirilemez.
* **[ ] GPS / Lokasyon Verisi Onayı:** Bakıcılardan randevu esnasında GPS verisinin işleneceğine dair oturum açma veya randevu başlatma aşamasında anlık onay alınmalıdır.

## 3. VERBİS Kayıt Yükümlülükleri (2026 Güncel Sınırları)

* **[ ] Mali Bilanço / Çalışan Eşiği Tespiti:** 2026 yılı itibarıyla, yıllık çalışan sayınız 50'den fazlaysa veya yıllık mali bilanço toplamınız 100 Milyon TL'yi aşıyorsa VERBİS'e kayıt olmanız zorunludur.
* **[ ] Yurt Dışı Şirket İstisnası:** Eğer şirketinizin yasal merkezi Türkiye dışında bir ülkedeyse, çalışan sayısı veya bilançonuz ne olursa olsun, Türkiye'deki ebeveyn ve bakıcıların verilerini işlediğiniz için veri işlemeye başladığınız tarihten itibaren 30 gün içinde VERBİS'e kayıt olmanız ve "Veri Sorumlusu Temsilcisi" atamanız zorunludur.

## 4. Yurt Dışına Veri Aktarım Kuralları (AWS, Google Cloud, Twilio vb.)

Sunucularınızın Türkiye dışında olması, doğrudan "yurt dışına veri aktarımı" anlamına gelir ve 2026 güncel KVKK kurallarına tabidir. Artık "açık rıza" ile veri aktarımı ana kural olmaktan çıkmıştır.

* **[ ] Yeterlilik Kararı Kontrolü:** Sunucunuz KVKK Kurulu tarafından "güvenli" ilan edilen ülkelerden birindeyse ek bir işleme gerek yoktur.
* **[ ] Standart Sözleşmelerin (SCC) İmzalanması:** Sunucunuzun bulunduğu ülke güvenli listede değilse, bulut sağlayıcınızla (örn. AWS) Kurul'un yayımladığı değiştirilemez "Standart Sözleşmeleri" (Veri Sorumlusundan Veri İşleyene) imzalamanız gerekmektedir.
* **[ ] 5 İş Günü Bildirim Kuralı:** İmzalanan standart sözleşmeler, en geç 5 iş günü içerisinde KVKK'ya bildirilmelidir. Bu sürenin kaçırılması ciddi para cezası sebebidir.

## 5. Veri Saklama ve İmha Süreçleri

* **[ ] Veri Envanterinin Çıkarılması:** Şirketinizde hangi verilerin nerede ve ne kadar süreyle saklanacağını belirleyen "Veri Envanteri" oluşturulmalıdır.
* **[ ] Saklama Süreleri:** 5651 sayılı yasa gereği log (trafik) kayıtları 2 yıl, Vergi Usul Kanunu gereği finansal kayıtlar ve fatura detayları 5 yıl saklanmalıdır.
* **[ ] Periyodik İmha Döngüsü:** Saklama süresi dolan veya kullanıcının silinmesini talep ettiği veriler (örneğin eski adli sicil kayıtları), Kişisel Veri Saklama ve İmha Politikasına uygun olarak en geç 6 ayda bir dijital ortamdan kriptografik olarak silinmeli veya anonim hale getirilmelidir.

## 6. Veri Koruma Görevlisi (DPO) Gereksinimleri

* **[ ] İrtibat Kişisi Ataması:** Türk Hukukunda Avrupa'daki GDPR'a birebir benzeyen katı bir "Data Protection Officer (DPO)" zorunluluğu bulunmamaktadır. Ancak, VERBİS sistemine kayıt olma zorunluluğunuz doğduğunda, şirket içinden Türkiye Cumhuriyeti vatandaşı bir "İrtibat Kişisi" atamanız zorunludur.

## 7. 2026 Yılı İdari Para Cezaları ve Risk Tablosu

Ceza tutarları 2026 yılı için yeniden değerleme oranlarına göre artırılmıştır. Risk haritanız şöyledir:

* **[ ] Veri Güvenliği Yükümlülüklerinin İhlali:** TCKN, IBAN, Sağlık Verisi sızıntılarında uygulanacak ceza aralığı: 256.357 TL - 17.092.242 TL.
* **[ ] VERBİS'e Kayıt Yükümlülüğüne Aykırılık:** 341.809 TL - 17.092.242 TL.
* **[ ] Kurul Kararlarının Yerine Getirilmemesi:** 427.263 TL - 17.092.242 TL.
* **[ ] Standart Sözleşmelerin 5 Gün İçinde Kurula Bildirilmemesi:** Yurt dışı sunucu aktarım formunu zamanında teslim etmemenin cezası: 90.308 TL - 1.806.177 TL.

## 8. Lansman Öncesi Önceliklendirilmiş Eylem Planı

**Kırmızı Alarm (Lansmandan Önce Kesinlikle Bitmesi Gerekenler):**

* [ ] Avukat tarafından Ebeveyn ve Bakıcı aydınlatma metinlerinin ve Kullanıcı Sözleşmesinin yazılması.
* [ ] Frontend arayüzünde check-box'ların (Aydınlatma ve Açık Rıza için) birbirine bağlanmadan (unbundled) ayrı ayrı onaylanacak şekilde tasarlanması.
* [ ] Çocuk alerji verisi ve bakıcı adli sicil kaydı (Özel Nitelikli Veri) için uygulamanın veritabanı seviyesinde şifreleme (encryption) standartlarının oluşturulması.
* [ ] Sunucular yurt dışındaysa Standart Sözleşmelerin (SCC) imzalanıp Kurul'a 5 iş günü içinde bildirilmesi.
* [ ] OTP SMS servis sağlayıcısından önce, kullanıcının aydınlatma metnini gördüğünden emin olunması.

**Sarı Alarm (Lansmandan Sonraki İlk 3-6 Ay İçinde Yapılabilecekler):**

* [ ] Şirket çalışan sınırını veya mali bilançoyu aşıyorsa VERBİS kaydının tamamlanması.
* [ ] Detaylı Veri Saklama ve İmha Politikasının şirket içi el kitabı olarak yayımlanması.
* [ ] Otomatik veri imha (anonimleştirme) cron job'larının (yazılımsal rutinlerin) sunucuya entegre edilmesi.