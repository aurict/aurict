---
name: ad-campaign-generator
description: "Google ve Facebook reklam metinleri. Hedef kitle segmentasyonu. Ad extension'lar. Budget optimizasyonu. A/B test önerileri. Landing page eşleştirme."
triggers:
  keywords: ["reklam kampanyası", "google ads", "facebook ads", "meta ads", "ppc", "reklam metni", "hedef kitle", "campaign", "ad copy"]
  extensions: [".md", ".csv", ".xlsx"]
auto_load_when: "Google Ads, Facebook Ads veya dijital reklam kampanyası oluşturma talep edildiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch"]
---

# Ad Campaign Generator — DİJİTAL REKLAM KAMPANYASI REHBERİ

**Odağ:** Google Ads ve Meta Ads (Facebook/Instagram) için etkili reklam metinleri, hedef kitle ve optimizasyon stratejileri.

---

## 1. Google Ads Yapısı

```
Google Ads Organizasyonu:
KAMPANYA (Campaign)
└── Reklam Grubu (Ad Group)
    ├── Anahtar Kelimeler (Keywords)
    └── Reklam Varyasyonları (Ad Copy)

Kampanya Türleri:
├── SEARCH (Arama):
│   ├── Metin reklamlar
│   ├── Anahtar kelimeye dayalı gösterim
│   └── Intent odaklı (satın alma niyeti)
│
├── DISPLAY (Görüntülü Reklam):
│   ├── Görsel banner reklamları
│   ├── Remarketing ve farkındalık
│   └── Geniş kitle, düşük intent
│
├── SHOPPING (Alışveriş):
│   ├── E-ticaret ürün feed'i
│   ├── Ürün görseli + fiyat
│   └── Yüksek dönüşüm
│
└── PERFORMANCE MAX:
    ├── Tüm kanallar (Search + Display + YouTube + Gmail)
    ├── AI destekli optimizasyon
    └── Conversion odaklı
```

---

## 2. Google Ads Reklam Metni (Ad Copy)

```
Responsive Search Ad Yapısı:
├── HEADLINES (Başlıklar — 15 adet gir, Google 3 tanesini gösterir):
│   ├── Maks 30 karakter
│   ├── Her başlık farklı değer önerisi sunmalı
│   ├── En az 1 tanesi ana kelime içermeli
│   └── Sayı, fiyat, vaat içermeli
│
└── DESCRIPTIONS (Açıklamalar — 4 adet gir, Google 2 tanesini gösterir):
    ├── Maks 90 karakter
    ├── CTA içermeli
    └── Unique selling point vurgulanmalı

Başlık Formülleri:
├── Sayısal: "X Yılında Y Kişiye Yardım Ettik"
├── Sonuç: "X Sonuç Almak İçin X Günde Başlayın"
├── Fiyat: "Sadece A'dan Başlayan Fiyatlarla"
├── Sosyal: "X+ Kişi Bu Yöntemi Tercih Etti"
├── Aciliyet: "Bu Hafta %X İndirim"
└── Soru: "Neden Hâlâ X Yapıyorsunuz?"
```

---

## 3. Meta Ads (Facebook/Instagram) Reklam Metni

```
Meta Ad Formatları:
├── SINGLE IMAGE:
│   ├── 1 görsel, 1 metin
│   ├── Görsel: 1080x1080px (kare) veya 1080x1920px (story)
│   └── Metin: 125 karakter ideal
│
├── CAROUSEL:
│   ├── 2-10 kart
│   ├── Her kart: görsel + başlık + açıklama + link
│   └── Ürün serisi, adım adım anlatım için ideal
│
├── COLLECTION:
│   ├── Ana görsel + 3 ürün görseli
│   ├── Mobilde hızlı alışveriş deneyimi
│   └── E-ticaret için ideal
│
└── REELS/VIDEO:
    ├── Kısa video (15-30 saniye)
    ├── İlk 1 saniye kritik (hook)
    └── Sound on + subtitles
```

---

## 4. Hedef Kitle Segmentasyonu

```
Meta Audience Layers:
├── CORE AUDIENCE (Temel Hedef Kitle):
│   ├── Demographics: Yaş, cinsiyet, lokasyon, dil
│   ├── Interests: "Fitness", "Healthy Living", "Yoga"
│   ├── Behaviors: "Online shoppers", "Mobile device users"
│   └── Connections: Sayfa takipçileri, uygulama kullanıcıları
│
├── CUSTOM AUDIENCES (Özel Hedef Kitle):
│   ├── Website visitors (Pixel data)
│   ├── Customer list (CRM verisi)
│   ├── App users
│   └── Engaged users (post/tweet etkileşim)
│
└── LOOKALIKE AUDIENCES (Benzer Kitle):
    ├── Mevcut müşterilere benzer kişiler
    ├── %1 = en benzer, en dar
    ├── %2-3 = daha geniş, daha az benzer
    └── Yeni müşteri kazanımı için ideal

Google Ads Audience Signals:
├── In-Market (Pazar Fırsatı): Aktif satın alma niyeti
├── Affinity (Yaklaşım): Belirli ilgi alanları
├── Demographic: Yaş, gelir, ebeveynlik durumu
└── Remarketing: Site ziyaretçileri
```

---

## 5. Ad Extension'lar (Google Ads)

```
Extension Türleri:
├── SITELINKS (Site Bağlantıları):
│   ├── Ek 2-6 başlık link
│   ├── "Hakkımızda", "Ürünler", "İletişim" gibi
│   └── CTR'yi %20-30 artırır
│
├── CALLout (Kısa Özellik):
│   ├── "Ücretsiz Kargo", "7/24 Destek"
│   ├── Maks 25 karakter, 4-6 adet
│   └── Özellik vurgulama
│
├── STRUCTURED SNIPPETS (Yapılandırılmış Parçacıklar):
│   ├── Kategori listesi
│   ├── "Hizmetler: X, Y, Z" formatı
│   └── 10 adete kadar başlık
│
├── CALL (Telefon):
│   ├── Tıklama ile doğrudan arama
│   ├── CTA odaklı kampanyalar için
│   └── "Hemen Ara" mesajıyla
│
└── LOCATION (Konum):
    ├── Google Business entegrasyonu
    ├── "Yol tarifi al" butonu
    └── Local businesses için şart
```

---

## 6. Budget Optimizasyonu

```
Bütçe Dağılım Stratejisi:
├── KAMPANYA DÜZEYİ:
│   ├── Search: CPC × hedef tıklama sayısı = günlük bütçe
│   ├── Display: CPM (1000 gösterim başına) × hedef gösterim
│   └── Shopping: Ortalama sipariş değeri × hedef sipariş
│
├── BÜTÇE ORANLARI:
│   ├── Search (yüksek intent): %50-60
│   ├── Shopping (e-ticaret): %25-35
│   ├── Display (remarketing): %10-15
│   └── Video/Discovery: %5-10
│
└── OPTİMİZASYON:
    ├── İlk 2 hafta: Fazla veri toplayana kadar dokunma
    ├── Haftalık: Düşük performans kampanyaları durdur/kıs
    ├── Günlük: En yüksek conversion kampanyasına yükle
    └── ROAS hedefi: Minimum eşik belirle (genellikle 3x-5x)
```

---

## 7. A/B Test Önerileri

```
Test Hiyerarşisi:
├── ÖNCELİK 1 (Yüksek Etki):
│   ├── Başlık varyasyonları (en büyük etki)
│   ├── Açıklama varyasyonları
│   └── Hedef kitle farklılıkları
│
├── ÖNCELİK 2 (Orta Etki):
│   ├── Görsel/fotoğraf değişimi
│   ├── CTA metni ("Satın Al" vs "Daha Fazla Bilgi")
│   └── Konum/yerleşim (feed içinde vs story)
│
└── ÖNCELİK 3 (Düşük Etki):
    ├── Renk değişiklikleri
    ├── Font değişiklikleri
    └── Küçük layout detayları

Test Süreci:
├── Adım 1: Sadece 1 değişken test et (isolation)
├── Adım 2: Minimum 100-200 tıklama veya 7 gün çalıştır
├── Adım 3: İstatistiksel anlamlılık kontrolü (min %95 güven)
├── Adım 4: Kazananı seç, kaybedeni durdur
└── Adım 5: Yeni test tasarla (continuous improvement)
```

---

## 8. Landing Page Eşleştirme

```
Ad-to-Landing Page Uyumu:
├── Anahtar Kelime → Sayfa:
│   ├── "Nike erkek spor ayakkabı" → Nike erkek ayakkabı sayfası
│   ├── "X hizmet fiyatları" → Fiyatlandırma sayfası
│   └── "X nasıl çalışır" → Açıklama/how-it-works sayfası
│
├── Mesaj Tutarlılığı:
│   ├── Reklam başlığı = Landing page H1
│   ├── Vurgulanan özellik = Sayfada ön planda
│   └── CTA tutarlılığı: "Satın Al" → "Satın Al" butonu
│
├── Kalite Skoru Etkileyen Faktörler:
│   ├── Expected CTR (tahmini tıklama oranı)
│   ├── Landing page experience
│   └── Ad relevance (reklam-anahtar kelime alakası)
│
└── Mobile Landing Page:
    ├── Hızlı yükleme (3 sn altı)
    ├── Above the fold'ta CTA
    ├── Minimal form alanları
    └── Clear next step
```

---

## Key Patterns

1. **Her kampanya = bir hedef** — Brand awareness ile conversion aynı kampanyada olmaz.
2. **Ad extension şart** — Her kampanyada en az 2-3 extension kullan.
3. **Remarketing öncelikli** — Yeni kitleye 5x pahalı, remarketing 3x daha iyi ROAS.
4. **Landing page uyumu** — Reklam ne vaat ediyorsa landing page aynı şeyi sunmalı.
5. **A/B test sürekli** — Tek seferlik test değil, iteration kültürü oluştur.

---

## Anti-Patterns

```
❌ Bir reklamda her şeyi söylemeye çalışmak
✅ Tek reklam = tek mesaj = net CTA

❌ Yanlış hedef kitle (çok geniş)
✅ Daraltılmış, spesifik hedef kitle daha iyi sonuç verir

❌ Bütçeyi birden fazla kampanyaya eşit dağıtmak
✅ Kazanan kampanyaya yatırım yap; zayıfları durdur

❌ Sadece search'e yatırım yapmak
✅ Display remarketing ile funnel'i destekle

❌ Landing page'i yok saymak
✅ Reklam bütçesinin en az %20'si landing page optimizasyonuna
```

---

## Quick Reference

| Platform | Reklam Türü | En İyi Kullanım |
|---|---|---|
| Google Search | Metin (RSA) | High-intent satın alma |
| Google Shopping | Ürün feed | E-ticaret |
| Google Display | Banner/Responsive | Remarketing, farkındalık |
| Meta (Facebook) | Image/Video/Carousel | Brand, engagement, conversion |
| Instagram | Story/Reels/Feed | Görsel odaklı ürünler |
| LinkedIn | Sponsored Content | B2B, profesyonel |

| Extension | Etki | Kullanım |
|---|---|---|
| Sitelinks | +20-30% CTR | Bilgi siteleri, e-ticaret |
| Callout | +5-10% CTR | Tüm kampanyalar |
| Structured Snippets | +5-10% CTR | Hizmet/e-ticaret |
| Call extension | +8-15% CTR | Local, service businesses |
| Location | +15-20% CTR | Local businesses |

| Hedef Kitle Türü | Performans | Kullanım |
|---|---|---|
| Core (interest-based) | Düşük-orta | Awareness |
| Custom (remarketing) | Çok yüksek | Conversion |
| Lookalike | Orta-yüksek | Yeni müşteri |
| In-market | Orta | Consideration |
