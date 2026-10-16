# TODO

## Durum (16 Ekim 2026)

**1.0.0 (build 3) + SubPurge Pro IAP App Store incelemesinde** — `WAITING_FOR_REVIEW`, gönderim 16 Ekim 2026.
Yayın türü: onaydan sonra otomatik (`AFTER_APPROVAL`).

- ASC app id `6822311775`, sürüm id `de7e24ee-8f33-4ea3-b251-b44515bb551a`
- Pro IAP id `6822325998` (`com.rakuappdigital.subpurge.pro`, non-consumable, Aile Paylaşımı açık)
- Review submission id `4f0ad16f-d018-44fb-9dd7-4ee121db5f5c`
- App Review iletişim: Doğuş Telatar, +905394832983, subpurgeapp@gmail.com (not: docs/app-store.md)
- App Privacy: "Data Not Collected" (kullanıcı doldurdu)
- 50 ekran görüntüsü işlendi; her dilin 5. görseli (`*-5-add`) ilk yüklemede ASSET_FAILED olmuştu, JPEG olarak yeniden yüklendi

## Sıradaki

- [ ] İnceleme sonucunu kontrol et (ASC API: `GET /v1/apps/6822311775/appStoreVersions`)
- [ ] **Red gelirse:** en olası sebep 5. ekran görüntüsündeki "Google Play" butonu (Guideline 2.3.10). Çözüm: `*-5-add` ekranlarını Google Play görünmeyecek şekilde yeniden çek (iPhone 1320×2868, iPad 2064×2752, 5 dil), sadece görselleri değiştir — yeni build gerekmez
- [ ] Onaydan sonra: canlı mağazada Pro satın alma + Geri Yükle'yi gerçek cihazda dene (ilk IAP, TestFlight'ta inceleme öncesi ürün yüklenmeyebilir)
- [ ] Küçük İşletme Programı: başvuru 16 Ekim 2026'da yapıldı (hesap geneli, tüm uygulamalar), onay e-postası bekleniyor — gelince bu maddeyi kapat
- [x] Ücretli Uygulamalar Sözleşmesi kabul edilmiş (SBP formunda teyit edildi)

## Güvenlik (kullanıcı)

- [ ] Eski `ghp_` GitHub token'ını iptal et
- [ ] Eski debate.py'deki OpenAI anahtarını iptal et

## Fikirler / sonra

- [ ] Öğrenme modu (henüz yok)
- [ ] CLAUDE.md "iPhone-only" diyor ama `TARGETED_DEVICE_FAMILY = "1,2"` (iPhone + iPad) — dokümanı düzelt

## Yapıldı (bu oturum)

- 6 aylık harcama grafiği farklı para birimlerini çevirmeden topluyordu → düzeltildi + test (commit 15d3d0a)
- Build 3 CLI ile yüklendi (Release manuel imza, profil "Subpurge App Store") ve sürüme bağlandı
- App Review iletişim bilgisi + inceleme notu API ile eklendi
- Ödeme kodu gözden geçirildi: StoreKit 2 doğrulama, `Transaction.updates`, iade/Ask to Buy, Geri Yükle — sorun yok. AdMob/ATT uygulamada yok.
