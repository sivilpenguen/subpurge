# Subpurge — App Store Connect bilgileri

## Uygulama kaydı (My Apps → + → New App)

| Alan | Değer |
|---|---|
| Platform | iOS |
| Name | Subpurge: Subscription Tracker *(EN birincil)* |
| Primary Language | English (U.S.) — Türkçe ek lokalizasyon |
| Bundle ID | com.rakuappdigital.subpurge |
| SKU | subpurge2026 |
| User Access | Full Access |

## Genel bilgiler

| Alan | Değer |
|---|---|
| Birincil kategori | Finance |
| İkincil kategori | Productivity |
| Yaş derecelendirmesi | 4+ (anketteki tüm sorulara "Hayır/None") |
| Fiyat | Ücretsiz + uygulama içi satın alma (SubPurge Pro, tek seferlik) |
| Copyright | 2026 Dogus Lutfu Telatar |
| Privacy Policy URL | https://github.com/sivilpenguen/subpurge/blob/main/PRIVACY_POLICY.md |
| Support URL | https://github.com/sivilpenguen/subpurge |
| İletişim e-postası | subpurgeapp@gmail.com |
| Şifreleme (Export Compliance) | Muaf — Info.plist'te `ITSAppUsesNonExemptEncryption = false` |
| Cihazlar | iPhone + iPad |
| Sürüm / Build | 1.0.0 (1) |

## Uygulama içi satın alma: SubPurge Pro

| Alan | Değer |
|---|---|
| Tür | Non-Consumable (tek seferlik) |
| Product ID | com.rakuappdigital.subpurge.pro |
| Reference Name | SubPurge Pro |
| Fiyat | Temel: **$4.99**. **Türkiye: ₺149,99 elle girilmeli** (girilmezse Apple TL fiyatını dolardan otomatik hesaplar) |
| Lansman | İlk hafta Türkiye ₺99,99 (ASC → Pricing → planlı fiyat değişikliği) |
| Aile Paylaşımı | Açık |
| Görünen ad / açıklama (EN) | SubPurge Pro — Unlimited subscriptions, backup and CSV export, and every future Pro feature. One payment, yours forever. |
| Görünen ad / açıklama (TR) | SubPurge Pro — Sınırsız abonelik, yedek ve CSV dışa aktarma, gelecekteki tüm Pro özellikleri. Tek ödeme, sonsuza kadar senin. |
| İnceleme ekran görüntüsü | `resources/appstore/` altındaki ödeme ekranı görüntüsü |

Ücretsiz sürüm 6 aktif abonelikle sınırlı; 7. eklenirken ya da dışa aktarmaya dokununca ödeme ekranı açılır. Satın alma RevenueCat üzerinden: RevenueCat'te uygulamayı oluştur, App Store public key'ini (`appl_…`) `src/platform/purchases.ts` içindeki `REVENUECAT_API_KEY`'e yaz. Anahtar boşken uygulama satın almayı "şu an kullanılamıyor" diye gösterir.

## App Privacy (gizlilik etiketi)

**Data Not Collected** seçilir. Uygulama hesap, analitik, reklam ya da sunucu kullanmıyor; sadece herkese açık fiyat dosyasını ve ECB döviz kurlarını indiriyor (kullanıcı verisi gönderilmez). Tracking: **No**.

## Lokalizasyon metinleri

### English (U.S.)

**Name (30):** Subpurge: Subscription Tracker
**Subtitle (30):** Spot unused subs, save money
**Promotional text (170):** See every subscription on one receipt. Catch the ones you don’t use, jump straight to the cancel page and find out how much you’ll save a year.
**Keywords (100 bytes):** subscriptions,bills,budget,reminder,cancel,renewal,expense,netflix,spotify,saving,money,manager

**Description:**

Netflix, Spotify, iCloud, ChatGPT, the gym… Subscriptions add up quietly. Subpurge puts all of them on one receipt so you can see exactly what you pay — and cut what you don’t use.

ONE RECEIPT FOR EVERYTHING
• Your monthly total, with the yearly and daily equivalent
• The next payment and how many days are left
• Weekly, monthly and yearly plans, fixed-term or auto-renewing

PURGE MODE
• Subscriptions you haven’t used in a while are flagged automatically
• Price increases are detected from up-to-date plan prices
• Set a review date and write down why you’re paying — Purge Mode brings it back when it’s time
• See how much you’d save a year if you cut them all

CANCEL IN ONE TAP
• Jump straight to the account or cancel page of popular services

REMINDERS THAT MATTER
• A reminder 4 days before every renewal or end date
• A nudge when you haven’t used a subscription for 7 days

YOUR DATA STAYS ON YOUR DEVICE
• No account, no ads, no tracking
• Back up as JSON or export to CSV whenever you want (Pro)

FREE AND PRO
• Track up to 6 active subscriptions for free
• SubPurge Pro is a one-time purchase: unlimited subscriptions and every future Pro feature. No subscription — we won’t sell you one.

Also: 25+ ready-made services with current plans, 21 currencies with automatic conversion, light and dark themes, iPhone and iPad, in English, Turkish, Spanish, German and French.

### Türkçe

**Name (30):** Subpurge: Abonelik Takibi
**Subtitle (30):** Gereksiz abonelikleri yakala
**Promotional text (170):** Her ay nereye ne ödediğini tek fişte gör. Kullanmadığın aboneliği yakala, tek dokunuşla iptal sayfasına git, yılda ne kadar kurtaracağını hemen öğren.
**Keywords (100 bayt):** fatura,ödeme,hatırlatıcı,bütçe,iptal,tasarruf,harcama,netflix,spotify,dijital,üyelik,yenileme

**Açıklama:**

Netflix, Spotify, iCloud, ChatGPT, spor salonu… Abonelikler sessizce birikir. Subpurge hepsini tek bir fişte toplar; ne ödediğini net görür, kullanmadığını kesersin.

TEK FİŞTE HER ŞEY
• Aylık toplamın, yıllık ve günlük karşılığıyla
• Sıradaki ödeme ve kalan gün sayısı
• Haftalık, aylık, yıllık; otomatik yenilenen ya da sabit süreli planlar

PURGE MODE
• Bir süredir kullanmadığın abonelikler otomatik işaretlenir
• Güncel plan fiyatlarıyla zamlar yakalanır
• Gözden geçirme tarihi koy, neden ödediğini not et; zamanı gelince Purge Mode hatırlatır
• Hepsini kesersen yılda ne kadar kurtaracağını gör

TEK DOKUNUŞLA İPTAL
• Popüler servislerin hesap ya da iptal sayfasına doğrudan git

İŞE YARAYAN HATIRLATMALAR
• Her yenileme ya da bitiş tarihinden 4 gün önce bildirim
• 7 gündür kullanmadığın abonelik için dürtme

VERİLERİN CİHAZINDA KALIR
• Hesap yok, reklam yok, takip yok
• İstediğin zaman JSON yedeği al ya da CSV'ye aktar (Pro)

ÜCRETSİZ VE PRO
• 6 aktif aboneliğe kadar ücretsiz
• SubPurge Pro tek seferlik satın alma: sınırsız abonelik ve gelecekteki tüm Pro özellikleri. Abonelik yok; sana abonelik satmıyoruz.

Ayrıca: güncel planlarıyla 25'ten fazla hazır servis, otomatik kur çevirisiyle 21 para birimi, açık ve koyu tema, iPhone ve iPad desteği; Türkçe, İngilizce, İspanyolca, Almanca ve Fransızca.

## App Review notları (Notes)

```
No login is required. On first launch, tap "Try with demo data" on the last onboarding page to load sample subscriptions. Settings → "Send test notification" schedules two local notifications 5 and 10 seconds later. All data is stored locally; the app only downloads public price data and ECB exchange rates. The free version allows 6 active subscriptions; adding a 7th shows the SubPurge Pro paywall (one-time, non-consumable, with Restore Purchases).
```

Sign-in required: **No**. İletişim: ad-soyad, telefon, subpurgeapp@gmail.com.

## Ekran görüntüleri

`resources/appstore/` altında Playwright ile üretilmiş ham ekranlar:

- iPhone 6.9" — 1320 × 2868 (`iphone-*.png`) — ASC bu boyuttan küçük iPhone'ları otomatik ölçekler
- iPad 13" — 2064 × 2752 (`ipad-*.png`)

Her biri EN ve TR. Pazarlama çerçevesi (başlık + cihaz) sonradan eklenebilir.

## Yükleme (CLI)

Kayıt açıldıktan sonra: App Store dağıtım profili (`Subpurge App Store`) API ile oluşturulur, Release yapılandırması manuel imzalamaya alınır, ardından `xcodebuild archive` → `-exportArchive` → `xcrun altool --upload-app` (Team JF86RYY9ZS, ASC API key LDP3USJRXA).
