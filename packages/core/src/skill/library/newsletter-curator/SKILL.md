---
name: newsletter-curator
description: "Günlük haber tarama ve özet bülten. Haber seçim kriterleri. Özet yazım stili. Görsel seçimi. CTA yerleştirme. Tasarım şablonları."
triggers:
  keywords: ["bülten", "newsletter", "haber özeti", "email marketing", "mailchimp", "substack", "içerik bülteni", "haber tarama"]
  extensions: [".md", ".html"]
auto_load_when: "E-posta bülteni hazırlama, haber derleme veya içerik bülteni talep edildiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch"]
---

# Newsletter Curator — BÜLTEN YAZIM VE DÜZENLEME REHBERİ

**Odağ:** Günlük/haftalık haber bülteni hazırlamak için haber tarama, seçim ve özetleme süreçleri.

---

## 1. Newsletter Türleri

```
Bülten Formatları:
├── GÜNLÜK RUNDOWN:
│   ├── Her gün aynı saatte çıkar
│   ├── Kısa başlıklar, hızlı tarama
│   ├── 5-10 haber, her biri 2-3 cümle
│   └── "Günün X Haberleri" formatı
│
├── HAFTALIK DERİNLEMESİ:
│   ├── Haftada 1 kez (genellikle Cuma veya Pazartesi)
│   ├── 3-5 derin makale özeti
│   ├── 1500-3000 kelime toplam
│   └── Editoryal yorum eklenebilir
│
├── NİŞ TOPİK BÜLTENİ:
│   ├── Tek konu odaklı (örn: UX, kripto, fintech)
│   ├── Haftada 2-4 kez
│   ├── Uzman tonu ve derinlik
│   └── "X Dünyasında Bu Hafta"
│
└── ŞİRKET/CÜMLEYİ BÜLTENİ:
    ├── Şirket içi iletişim
    ├── Düşük frekans (2 haftada 1 veya ayda 1)
    ├── İç/dış ayrımı önemli
    └── Formal ton
```

---

## 2. Haber Seçim Kriterleri

```
Seçim Matrisi:
├── RELEVANS (İlgilik):
│   ├── Hedef kitleden en az %30 ilgili olmalı
│   ├── Sektörle doğrudan bağlantı
│   └── Okuyucunun işine yarayacak bilgi
│
├── TAZELİK (Güncellik):
│   ├── Son 24-48 saat içinde yayınlanmış
│   ├── "Bugün / Bu hafta / Bu ay" etiketi
│   └── Eski haberler için "hatırlatma" tonu
│
├── ETKİ/GÜÇ (Impact):
│   ├── Sektörü değiştirebilecek gelişmeler
│   ├── Büyük şirket/X duyuruları
│   └── Regülasyon/hukuki değişiklikler
│
├── ORİJİNALLİK (Uniqueness):
│   ├── Herkesin paylaştığı haber değil
│   ├── Farklı açıdan bakış
│   └── "Bunu ilk siz okuyacaksınız" hissi
│
└── KISALIK (Digestibility):
    ├── Hızlıca anlaşılabilir olmalı
    └── Teknik detay çokluğu okuyucuyu kaçırır
```

---

## 3. Haber Tarama Kaynakları

```
Kaynak Kategorileri:
├── ANA AKTÖRLER:
│   ├── Google News (sektör filtreli)
│   ├── Reuters, AP, Bloomberg
│   └── Sektöre özel: TechCrunch, VentureBeat, Forbes
│
├── SOSYAL MEDYA:
│   ├── Twitter/X trend konuları
│   ├── LinkedIn (profesyonel haberler)
│   ├── Reddit (discussion, haber)
│   └── Hacker News (tech odaklı)
│
├── NEWSLETTERLER:
│   ├── Rakiplerin bültenleri
│   ├── Curated newsletterler (Morning Brew vb.)
│   └── Sektör influencer bültenleri
│
└── VERİ TABANLARI:
    ├── Product Hunt (yeni ürünler)
    ├── AlternativeTo (rakip yenilikler)
    └── Google Alerts (marka/keyword alert)
```

---

## 4. Özet Yazım Stili

```
Özet Yapısı (kullanıma hazır format):
```
[ÖZET BAŞLIĞI — kısa, dikkat çekici]

[Tam URL veya kaynak]
[Tarih: Gün/Ay/Yıl]

[3-5 cümlelik özet]
• Ana fikir: [Ne oldu?]
• Neden önemli: [Etkisi ne?]
• İlginç detay: [Dikkat çekici bir veri/nokta]

[Link: Detay için tıkla →] veya [Okumak için kaynak adı →]
```

Örnek Uygulama:
```
Microsoft, LinkedIn'de Yapay Zeka Destekli CV Analizi Başlattı

LinkedIn News • 3 gün önce

Microsoft, LinkedIn platformuna entegre ettiği yapay zeka 
modeliyle kullanıcıların CV'lerini otomatik analiz edip 
iyileştirme önerileri sunuyor. Özellikle kariyer değişimi 
yapmak isteyenler için "CV Review AI" aracı ücretsiz 
sunulacak. İlk testlerde %40 daha fazla callback alındığı 
bildirildi.

→ LinkedIn Blog'unda detaylar
```
```

---

## 5. Görsel Seçimi

```
Görsel Seçim Kuralları:
├── UYUMLULUK:
│   ├── Her haber için temsilî görsel
│   ├── Konuyla doğrudan bağlantılı
│   └── Soyut değil somut görseller tercih
│
├── KALİTE:
│   ├── Min 600px genişlik (retina için 2x)
│   ├── JPEG/WebP format (performans)
│   └── Telif hakkı kontrollü (Unsplash, Pexels)
│
├── RENK PALETİ:
│   ├── Bülten tasarımıyla uyumlu
│   ├── Monokrom veya zıt renk
│   └── Koyu/açık mod uyumu
│
└── BOYUT VE YERLEŞİM:
    ├── Hero görsel: 1200x630px (og:image)
    ├── Inline görsel: max 600px genişlik
    └── Görsel + metin yan yana (responsive)
```

---

## 6. CTA Yerleştirme

```
CTA Stratejisi:
├── HER HABERDE CTA:
│   ├── "Devamını Oku →"
│   ├── "Detaylar İçin Tıkla"
│   └── Tek tıklama ile kaynağa ulaşım
│
├── GENEL CTA (bülten sonunda):
│   ├── "Bu bülteni beğendiyseniz..."
│   ├── "Bir arkadaşınıza yönlendirin"
│   ├── Sosyal medya takip çağrısı
│   └── "Bir arkadaşınıza iletin" — viral büyüme
│
└── CTA TASARIMI:
    ├── Buton: "solid color" arka plan
    ├── Metin linki: altı çizili, mavi/brand rengi
    ├── Mobilde min 44px tıklama alanı
    └── A/B test ile optimize et
```

---

## 7. Newsletter Tasarım Şablonları

```
Bülten Layout Bölümleri:
├── HEADER:
│   ├── Logo (sol üst veya orta)
│   ├── Bülten adı + konu
│   └── Çıkış tarihi ve sayı numarası
│
├── HOOK (bülten girişi):
│   ├── "Bu hafta X konusunda konuşacağız"
│   ├── Editoryal yorum veya kısa giriş
│   └── Haftalık tema belirle
│
├── İÇERİK (ana gövde):
│   ├── Haber blokları (grid veya liste)
│   ├── Her blok: başlık + özet + görsel + CTA
│   └── Kategori etiketleri (varsa)
│
├── DEĞER EKLEME:
│   ├── "Bu haftanın taktiği" / ipucu
│   ├── İstatistik veya veri infografik
│   └── İleri okuma önerileri
│
├── FOOTER:
│   ├── Unsubscribe linki (GDPR zorunlu!)
│   ├── İletişim bilgileri
│   ├── Sosyal medya ikonları
│   └── "Bu e-postayı aldıysanız..." açıklaması
│
└── MOBILE OPTIMIZASYON:
    ├── Tek kolonlu düzen
    ├── Min 14px font boyutu
    ├── Büyük CTA butonları
    └── Yatay scroll yok
```

---

## 8. Gönderim Stratejisi

```
Zamanlama Matrisi:
├── B2B (iş dünyası):
│   ├── Salı-Çarşamba-Perşembe
│   ├── 07:00-09:00 (işe başlamadan önce)
│   └── 17:00-19:00 (iş günü bitiminde)
│
├── B2C (tüketici):
│   ├── Hafta içi akşam 18:00-20:00
│   ├── Hafta sonu 09:00-11:00
│   └── Pazartesi sabah kaçınılmalı (kontrolsüz)
│
└── TEST STRATEJİSİ:
    ├── İlk 2 hafta farklı zamanlarda dene
    ├── Open rate + click rate ölç
    └── En iyi zamanı bul (genellikle 2-3 hafta sürer)
```

---

## Key Patterns

1. **Konsistans kritik** — Aynı gün, aynı saatte gönder; okuyucu alışkanlık edinir.
2. **5-7 haber ideal** — 10'dan fazla okunmaz, 3'ten az yetersiz.
3. **Her haberde net CTA** — Okuyucu ne yapacağını bilmeli.
4. **Kısa özetler + derin link** — "Okudum ama okumadım" formatı.
5. **Unsubscribe kolay erişilir olmalı** — GDPR yasal zorunluluk + güven.

---

## Anti-Patterns

```
❌ Her haberi olduğu gibi kopyalamak (copyright)
✅ Kendi cümlelerinle özetle, kaynağı belirt

❌ Sadece kendi içeriğini paylaşmak (spamy)
✅ Dış kaynak haberlerle denge kur

❌ Uzun paragraflar (bülten formatı uygun değil)
✅ Kısa özetler, madde işaretleri, bold anahtar noktalar

❌ Görsel kullanmamak
✅ Her önemli haber için bir görsel; dikkat çekicilik artar

❌ Mobilde test etmemek
✅ Bültenin %60+ okunması mobil cihazlardan olur
```

---

## Quick Reference

| Bülten Türü | Frekans | Kelime Sayısı | Ton |
|---|---|---|---|
| Günlük Rundown | Her gün | 500-800 | Bilgilendirici, kısa |
| Haftalık Derin | Haftada 1 | 1500-3000 | Editoryal, yorumlu |
| Niche/İkin | Haftada 2-4 | 800-1500 | Uzman, derin |
| Şirket İçi | 2 haftada 1/ayda 1 | 500-1000 | Formal, kurumsal |

| Görsel Türü | Kullanım | Format |
|---|---|---|
| Hero (kapak) | Bülten başında | 1200x630px |
| Inline | Her haber arasında | 600px max |
| İnfografik | Veri gösterimi | 1200px geniş |
| Thumbnail | Liste formatında | 150x150px |

| CTA Türü | Yerleşim | Etki |
|---|---|---|
| Read More | Her haber altında | Orta |
| Social Follow | Footer | Orta |
| Share/Forward | Bülten sonunda | Yüksek |
| Subscribe CTA | Hero altında | Çok yüksek |
| Unsubscribe | Footer | Zorunlu |
