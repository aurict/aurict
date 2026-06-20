---
name: email-sequence-builder
description: "Satış hunisi e-postaları. Welcome serileri. Abandoned cart. Re-engagement. Personalization. Timing stratejileri."
triggers:
  keywords: ["email sequence", "drip campaign", "e-posta serisi", "welcome email", "abandoned cart", "satış hunisi", "email automation", "re-engagement"]
  extensions: [".md", ".html", ".csv"]
auto_load_when: "E-posta otomasyonu, drip campaign veya satış hunisi e-postası talep edildiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch"]
---

# Email Sequence Builder — E-POSTA SERİSİ OLUŞTURMA REHBERİ

**Odağ:** Satış hunisinin her aşaması için etkili e-posta serileri tasarlamak ve otomasyon stratejileri geliştirmek.

---

## 1. Email Sequence Türleri

```
Huni Aşamalarına Göre Seriler:
├── TOP OF FUNNEL (Farkındalık):
│   ├── Welcome series (yeni abone)
│   ├── Free content drip (ebook, webinar)
│   └── Awareness nurture
│   └── Hedef: İlgilenme, takipçi haline getirme
│
├── MIDDLE OF FUNNEL (Değerlendirme):
│   ├── Onboarding sequence (ürün tanıtımı)
│   ├── Case study series
│   ├── Comparison guide
│   └── Hedef: Güven inşası, ihtiyaç tespiti
│
├── BOTTOM OF FUNNEL (Satın Alma):
│   ├── Demo request follow-up
│   ├── Free trial conversion
│   ├── Abandoned cart (terk edilmiş sepet)
│   └── Hedef: Dönüşüm, ilk satın alma
│
└── POST-PURCHASE (Müşteri Olunca):
    ├── Onboarding (ilk 7-30 gün)
    ├── Upsell/cross-sell series
    ├── Re-engagement (yeniden aktive)
    └── Hedef: Müşteri sadakati, tekrar satın alma
```

---

## 2. Welcome Series (Hoşgeldin Serisi)

```
Welcome Email Framework:
├── EMAIL 1: HOOK (0. gün, hemen):
│   ├── Konu: "Hoş geldiniz + beklenmedik hediye"
│   ├── İçerik: Tanıtım, hızlı değer sunumu
│   ├── CTA: İlk içeriğe eriş
│   └── Ton: Heyecanlı, samimi
│
├── EMAIL 2: DEĞER (2-3. gün):
│   ├── Konu: "En popüler içeriklerimiz"
│   ├── İçerik: En iyi 3 içerik önerisi
│   ├── CTA: İçerik tüketimi
│   └── Ton: Bilgilendirici, faydalı
│
├── EMAIL 3: SOSYAL KANIT (5-7. gün):
│   ├── Konu: "X kişi zaten bunu yaptı"
│   ├── İçerik: Müşteri başarı hikayesi
│   ├── CTA: Benzer sonuca ulaşmak için
│   └── Ton: Sosyal, güven verici
│
└── EMAIL 4: CTA (10-14. gün):
    ├── Konu: "Sırada ne var?"
    ├── İçerik: Sonraki adım önerisi
    ├── CTA: Demo, satın alma veya consultation
    └── Ton: Çözüm odaklı
```

---

## 3. Abandoned Cart ( Terk Edilmiş Sepet) Serisi

```
Abandoned Cart Trigger Logic:
├── TRIGGER: Sepete ürün eklenip 1 saat içinde satın alma yapılmaması
├── KOŞUL: E-posta bildirimi açık müşteri
└── GÖNDERİM: Otomatik

Abandoned Cart Email Flow:
├── EMAIL 1: HATIRLATMA (1 saat sonra):
│   ├── Konu: "Sepetini unuttun galiba? 😊"
│   ├── İçerik: Sepetteki ürün hatırlatması
│   ├── CTA: "Sepetime Dön"
│   ├── Ton: Samimi, hafif mizah
│   └── Bonus: Kargo ücretsizliği veya küçük indirim
│
├── EMAIL 2: SOSYAL KANIT (24 saat sonra):
│   ├── Konu: "X kişi bu hafta bu ürünü aldı"
│   ├── İçerik: "Stokta sadece X kaldı" scarcity
│   ├── CTA: "Hemen tamamla"
│   └── Ton: Aciliyet yaratan, sosyal
│
└── EMAIL 3: SON ŞANS (72 saat sonra):
    ├── Konu: "Son bir hatırlatma..."
    ├── İçerik: Düşünülmesi gereken sorular + fayda tekrarı
    ├── CTA: "Bir sorun mu var? Yardımcı olalım"
    ├── Ton: Empatik, çözüm odaklı
    └── Bonus: "Bir şeyler ters gittiyse..." kişiselleştirme
```

---

## 4. Re-engagement Serisi (Yeniden Aktive)

```
Re-engagement Trigger:
├── TRIGGER: 30-60-90 gün arası aktif olmayan müşteri
├── KOŞUL: Daha önce satın alma yapmış olmalı
└── AMAÇ: Tekrar satın alma veya tekrar etkileşim

Re-engagement Email Flow:
├── EMAIL 1: NOSTALJİ (Day 30):
│   ├── Konu: "Sana özel bir şey hazırladık"
│   ├── İçerik: "En son buraya baktığında..." + güncellenmiş içerik
│   ├── CTA: "Tekrar Keşfet"
│   └── Ton: Kişisel, nostaljik
│
├── EMAIL 2: GÜNCELLEME (Day 60):
│   ├── Konu: "X zamandır burada çok şey değişti"
│   ├── İçerik: Yeni özellikler, ürünler
│   ├── CTA: "Yeniliklere Göz At"
│   └── Ton: Heyecanlı, haber verici
│
├── EMAIL 3: SON ÇAĞRI (Day 90):
│   ├── Konu: "Sizi özledik..."
│   ├── İçerik: Özel indirim veya hediye teklifi
│   ├── CTA: "Geri Dön"
│   └── Ton: Duygusal, cömert
│
└── EMAIL 4: MİSALİNDE BİLDİRİM (Day 90+):
    ├── Konu: "Son bir hatırlatma"
    ├── İçerik: "Bu e-posta serisini sonlandırıyoruz" bilgisi
    ├── Aksiyon: Listeden çıkarma seçeneği
    └── Ton: Resmi, açık
```

---

## 5. Personalization Stratejileri

```
Personalization Katmanları:
├── TEMEL KİŞİSELLEŞTİRME:
│   ├── {{first_name}} — adla hitap
│   ├── {{company_name}} — şirket adı
│   └── {{location}} — şehir/ülke
│
├── DAVRANIŞA DAYALI:
│   ├── "Son görüntülediğiniz ürünler"
│   ├── "Satın aldığınız ürün kategorisi"
│   ├── "Sayfamızda X dakika geçirdiniz"
│   └── "İndirdiğiniz ebook"
│
├── DEMOGRAFİK:
│   ├── Yaş/gruplama bazlı içerik
│   ├── Sektör bazlı mesajlar
│   ├── B2B vs B2C farklılaştırması
│   └── Cinsiyet bazlı görsel seçimi
│
└── SEGMENTASYONA DAYALI:
    ├── Satın alma geçmişi
    ├── Engagement seviyesi
    ├── Müşteri yaşı (yeni vs mevcut)
    └── Fiyat duyarlılığı segmenti
```

---

## 6. Timing ve Frekans Stratejileri

```
Gönderim Zamanlaması:
├── GÜN İÇİ OPTİMUM:
│   ├── B2B: Salı-Çarşamba-Perşembe
│   ├── B2C: Hafta içi akşam 18:00-20:00
│   ├── Weekend: Cuma-Cumartesi akşam (bazı segmentler)
│   └── Kaçınılacak: Pazartesi sabah (kontrolsüz)
│
├── SAAT BAZLI:
│   ├── İlk email: 10:00-12:00 (açılma oranı yüksek)
│   ├── Follow-up: 24-48 saat sonra
│   ├── Abandoned cart: 1 saat sonra (hemen)
│   └── Re-engagement: sabah 08:00-09:00
│
└── SERİ FREKANSLARI:
    ├── Welcome: 4 email / 2 hafta
    ├── Onboarding: 6 email / 30 gün
    ├── Abandoned cart: 3 email / 72 saat
    ├── Re-engagement: 4 email / 60-90 gün
    └── Upsell: 2-3 email / satın alma sonrası 2 hafta
```

---

## 7. Email Sequence Tasarım Prensipleri

```
Sequence Tasarım Kuralları:
├── HOOK MANTIĞI:
│   ├── Her email tek başına değerli olmalı
│   ├── "Bu emaili okumasanız bile kaybedeceğiniz bir şey var"
│   └── Seriyi atlamaya gerek yok — her email ayrı kapanış yapabilmeli
│
├── KİLİT ALMA ZİNCİRİ:
│   ├── Email 1: Hook → içeriği tüket
│   ├── Email 2: İçeriği hatırlat → devam ettir
│   ├── Email 3: "X yapmak ister misiniz?" → bir sonraki adım
│   └── Email N: CTA tekrarı → dönüşüm
│
├── GÖNDERİM LOGIĞI:
│   ├── İlk email: 0. gün / hemen
│   ├── 2. email: 2-3 gün sonra
│   ├── 3. email: 7 gün sonra
│   └── Son email: 14-21 gün sonra
│
└── BAĞIMSIZLIK KURALI:
    ├── Her email kendi başına anlamlı olmalı
    ├── "Serinin 2. emaili" havası olmamalı
    ├── Aboneliği iptal etmeden seri devam etmeli
    └── Sequence dışında gönderilen kampanyalarla çakışmamalı
```

---

## 8. A/B Test ve Optimizasyon

```
Test Edilecek Öğeler:
├── KONU SATIRI (Subject Line):
│   ├── Uzun vs kısa
│   ├── Kişiselleştirilmiş vs genel
│   ├── Soru vs ifade
│   ├── Sayı içeren vs içermeyen
│   └── Emoji vs emojisiz
│
├── GÖNDERİM ZAMANI:
│   ├── Sabah (08:00-10:00) vs öğleden sonra (14:00-16:00)
│   ├── Hafta içi vs hafta sonu
│   └── Aynı gün farklı saat dilimleri
│
├── CTA:
│   ├── Buton rengi
│   ├── CTA metni ("Satın Al" vs "Hemen Başla")
│   ├── CTA konumu (üst vs alt)
│   └── Tek CTA vs çoklu CTA
│
└── İÇERİK FORMATI:
    ├── Görsel ağırlıklı vs metin ağırlıklı
    ├── Kısa vs uzun
    ├── Video embed vs video link
    └── İnteraktif içerik vs statik
```

---

## Key Patterns

1. **Trigger bazlı olmalı** — Zamana dayalı değil, davranışa dayalı tetikleme.
2. **Her email tek başına yeterli olmalı** — Seriyi atlayan da değer almalı.
3. **Personalization > generic mesaj** — Ad + geçmiş davranış + segmentasyon kullan.
4. **Frekans kontrolü şart** — Çok fazla email = abonelik iptali.
5. **Test et, ölç, optimize et** — Open rate, click rate, conversion rate takip.

---

## Anti-Patterns

```
❌ Haftada 10 email göndermek
✅ Haftada max 2-3 email; değer başına bir email

❌ "Sizi 3 gündür görmedik" gibi suçlayıcı ton
✅ "Bu arada yeni bir şey var..." gibi samimi yaklaşım

❌ Tüm sequence'i bir günde göndermek
✅ Doğal aralıklarla; 2-7 gün arası optimum

❌ Personalization yerine sadece "Merhaba" demek
✅ Gerçek değer katma: "Son görüntülediğiniz X ürününe benzerler..."

❌ Abonelik iptal linkini gizlemek
✅ Her email'de açıkça göster; güven inşası için şart
```

---

## Quick Reference

| Email Türü | Trigger | Zamanlama | Email Sayısı |
|---|---|---|---|
| Welcome | Yeni abone | 0-14 gün | 4-6 email |
| Abandoned Cart | Sepete ekleme + satın alma yok | 1-72 saat | 3 email |
| Onboarding | İlk satın alma | 0-30 gün | 6-8 email |
| Re-engagement | 30-90 gün inaktivite | 30-90 gün | 3-4 email |
| Upsell/Cross-sell | Satın alma | 7-30 gün sonra | 2-3 email |
| Win-back | 6+ ay inaktivite | 180+ gün | 2-3 email |

| Personalization | Etki | Uygulama |
|---|---|---|
| Ad ile hitap | +10-15% open | {{first_name}} |
| Son görüntülenen | +20-30% click | Davranış verisi |
| Satın alma geçmişi | +25-40% conversion | Segment bazlı |
| Sektör/şirket | +15-25% relevance | B2B segmentasyon |

| Metrik | Hedef Aralık | Aksiyon |
|---|---|---|
| Open rate | %20-35 | Düşükse konu satırını test et |
| Click rate | %2-5 | Düşükse CTA'ları optimize et |
| Unsubscribe rate | <%0.5 | Düşükse frekansı azalt |
| Conversion rate | %1-3 | Düşükse landing page'i test et |
