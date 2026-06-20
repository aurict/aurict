---
name: knowledge-base-writer
description: "Bilgi tabanı makaleleri. Step-by-step guides. Troubleshooting. Search optimization."
triggers:
  keywords: ["knowledge base writer", "bilgi tabanı yazarı", "help center", "bilgi bankası", "yardım makalesi"]
auto_load_when: "Kullanıcı bilgi tabanı (knowledge base) makaleleri, adım adım kılavuzlar, sorun giderme dokümanları veya arama optimizasyonu talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "grep", "glob"]
---

# Knowledge Base Writer (Bilgi Tabanı Yazarı)

**Odak Alanı:** Bilgi tabanı makaleleri oluşturma, adım adım kılavuzlar yazma, sorun giderme dokümanları hazırlama ve arama motoru optimizasyonu (SEO).

---

## Pattern: Bilgi Tabanı Makalesi Oluşturma

### Adım 1: Konu Belirleme ve Planlama
Makalenin amacını ve kapsamını tanımla:
```
Makale Kategorileri:
NASIL YAPILIR (How-To)
├── Amac: Belirli bir görevi tamamlamayı öğretmek
├── Yapı: Hedef → Adımlar → Sonuç
└── Ton: Uygulamalı, direkt

BAŞLARKEN (Getting Started)
├── Amac: Yeni kullanıcıları hızlıca tanıştırmak
├── Yapı: Giriş → Temel adımlar → İleri kaynaklar
└── Ton: Teşvik edici, basit

SORUN GİDERME (Troubleshooting)
├── Amac: Bilinen hataları çözmek
├── Yapı: Belirti → Sebep → Çözüm
└── Ton: Analitik, çözüm odaklı

REFERANS (Reference)
├── Amac: Spesifik bilgi/veri paylaşımı
├── Yapı: Tanım → Detaylar → Örnekler
└── Ton: Bilgilendirici, net

KAVRAMLAR VE TEORİ
├── Amac: Özelliklerin/teknolojinin mantığını açıklamak
├── Yapı: Tanım → Nasıl çalışır → Kullanım senaryoları
└── Ton: Eğitici, detaylı

İPUÇLARI VE PÜF NOKTALARI
├── Amac: Verimlilik artırıcı bilgiler
├── Yapı: Kısa ipuçları → Açıklamalar → Örnekler
└── Ton: Pratik, enerjik
```

### Adım 2: Hedef Kitle Analizi
Kimin okuyacağını belirle:
```
Hedef Kitle Türleri:
YENİ KULLANICI
├── Teknik bilgi: Düşük-orta
├── Ürün bilgisi: Sıfır
├── Zaman: Az (hızlı sonuç ister)
└── Ton: Sempler, destekleyici

DENEYİMLİ KULLANICI
├── Teknik bilgi: Orta-yüksek
├── Ürün bilgisi: Temel var
├── Zaman: Orta (detay ister)
└── Ton: Etkili, hızlı

TEKNİK KULLANICI/GELİŞTİRİCİ
├── Teknik bilgi: Yüksek
├── Ürün bilgisi: Derinlemesine
├── Zaman: Bol (karışık konulara dalabilir)
└── Ton: Teknik, detaylı

YÖNETİCİ/STAKHOLDER
├── Teknik bilgi: Düşük
├── Ürün bilgisi: Stratejik
├── Zaman: Kısıtlı (özet ister)
└── Ton: İş değeri odaklı
```

### Adım 3: Yapı ve İçerik Planlaması
Makale iskeletini oluştur:
```
Makale Şablonu:
BAŞLIK
→ Açık, anahtar kelime içeren
→ "nasıl yapılır" formatında
→ Kısa ve öz (50-60 karakter ideal)

META AÇIKLAMA
→ 155 karakter özet
→ Anahtar kelime dahil
→ Tıklanma odaklı

GİRİŞ PARAGRAF
→ 2-3 cümle
→ Okuyucuyu "bu sana yardımcı olacak" ile ikna et
→ Kısa özet (ne öğreneceksin)

ÖN KOŞULLAR (opsiyonel)
→ [Gereksinimler listesi]
→ "Başlamadan önce şunlara ihtiyacınız var:"

ANA İÇERİK
→ H2/H3 başlıkları ile bölümlendirilmiş
→ Her bölüm: 1-2 paragraf + görsel veya adımlar

ADIM ADIM TALİMATLAR (gerektiğinde)
→ Numara listesi
→ Her adım: Tek eylem
→ Ekran görüntüleri veya GIF

İPUÇLARI VE UYARILAR
→ 💡 İpucu kutusu
→ ⚠️ Uyarı kutusu
→ ℹ️ Bilgi kutusu

SSS / İLGİLİ SORULAR (opsiyonel)
→ "Sıkça sorulan sorular" bölümü
→ İlgili sorular ve kısa cevaplar

SONUÇ
→ Kısa özet
→ Sonraki adımlar
→ "Daha fazla yardım için" CTA
```

### Adım 4: Adım Adım Kılavuz Yazımı
Takip edilmesi kolay talimatlar yaz:
```
Adım Yazım Kuralları:
YAPI
├── Her adım tek bir eylem içerir
├──mantığını anlatan kısa bir cümle
├── Uygulama talimatı (komut, tıklama, vs.)
└── Beklenen sonuç (gerekirse)

FORMAT STANDARTLARI
→ "1.", "2.", "3." numaralı liste
→ Komutlar: bold veya code block içinde
→ Görseller: Her adımda bir ekran görüntüsü
→ Alternatif: "Ya da... [alternatif adım]"

DIL VE TON
├── Emir kipi kullan: "Tıklayın", "Seçin", "Girin"
├── Kısa ve net cümleler
├── Jargon yok veya açık açıklamasıyla
├── Aktif ses: "Sistemi açın" (not "Sistem açılmalı")
```

### Adım 5: Sorun Giderme Dokümantasyonu
Etkili troubleshooting makaleleri yaz:
```
Sorun Giderme Yapısı:
PROBLEM TANIMI
→ Başlık: "Sorun: [Belirti]"
→ Kim etkileniyor? (opsiyonel)
→ Hangi durumlarda oluşuyor?

BELİRTİLER
→ "Şu hataları görüyorsunuz:"
→ Hata mesajları (quote block)
→ Ekran görüntüleri

SEBEPLER VE ÇÖZÜMLER
→ Her sebep ayrı bir bölüm
→ "Çözüm 1:", "Çözüm 2:" formatı
→ Adım adım çözüm talimatları
→ Çözüm sonrası doğrulama adımı

ŞEMATIK:
┌─────────────────────────────────────┐
│ PROBLEM: [Belirti kısa tanım]       │
├─────────────────────────────────────┤
│ Olası Sebepler:                      │
│ ├─ Sebep A → Çözüm A                │
│ ├─ Sebep B → Çözüm B                │
│ └─ Sebep C → Çözüm C                │
├─────────────────────────────────────┤
│ Deneme Sırası Önerisi:               │
│ 1. En yaygın çözümden başlayın      │
│ 2. Her çözümden sonra test edin     │
│ 3. İşe yaramazsa sonrakine geçin    │
└─────────────────────────────────────┘
```

### Adım 6: Arama Optimizasyonu (SEO)
Makaleyi bulunabilir hale getir:
```
SEO Bileşenleri:
ANAHTAR KELİME STRATEJİSİ
├── 1 ana anahtar kelime (başlıkta)
├── 2-3 yan anahtar kelime (alt başlıklarda)
├── Doğal kullanım (spam yok)
└── Sıralama hedeflenen kelimeler

YAPISAL OPTİMİZASYON
├── H1: Ana başlık (ana anahtar kelime)
├── H2: Bölüm başlıkları (yan anahtar kelimeler)
├── H3: Alt bölümler
├── Bold anahtar kelimeler
└── İç linkler (ilgili makalelere)

TEKNİK SEO
├── URL: /konu-konusunda-rehber
├── Meta title: 55-60 karakter
├── Meta description: 155 karakter
├── Alt text (görseller): Açıklayıcı
├── Schema markup: Article, FAQ
└── Okunabilirlik: Flesch-Kincaid kolaylık

YAYGIN SEO HATALARI:
❌ Anahtar kelime doldurma (keyword stuffing)
❌ Çok uzun paragraflar (maks 3-4 cümle)
❌ Görsel kullanmama veya gereksiz ağır görseller
❌ İç link yok
❌ Eski/güncel olmayan bilgiler
```

---

## Key Patterns (Ana Kalıplar)

| Pattern | Açıklama | Uygulama |
|---|---|---|
| **Task-Based Structure** | Görev odaklı organizasyon | Kolay navigasyon |
| **Visual Stepping** | Görsel adım adım gösterim | Anlama kolaylığı |
| **Chunking** | Bilgiyi küçük parçalara bölme | Cognitive load azaltma |
| **Progressive Disclosure** | Temel → Detay → İleri | Farklı seviyeler |
| **Cross-Linking** | İlgili içeriklere bağlantı | Keşif kolaylığı |

---

## Anti-Patterns (Kaçınılması Gerekenler)

### ❌ Yanlış Uygulamalar

```yaml
# Teknik jargons bırakma
problem: "'Middleware configuration'ı açıklamadan yazmak"
result: "Yeni kullanıcı anlamaz, ticket artışı"

# Eksik adımlar
problem: "'Ayarları yapın' deyip detay vermemek"
result: "Kullanıcı takılır, hayal kırıklığı"

# Eski ekran görüntüleri
problem: "2020'de alınmış screenshot kullanmak"
result: "Kullanıcı şaşırır, güven kaybı"

# Mantıksız organizasyon
problem: "Tüm konuları tek uzun makalede toplamak"
result: "Okunmaz, bulunamaz"

# Okunabilir olmayan format
problem: "Ağır paragraflar, liste yok, heading yok"
result: "Göz yorucu, takip zor"
```

### ✅ Doğru Uygulamalar

```yaml
# Adım adım net talimatlar
approach: "Her adım ayrı numaralı, tek eylem, screenshot ile"
result: "Kolay takip, az hata"

# Hedef kitleye uygun dil
approach: "'Yeni kullanıcı' makalesinde jargonsu anlatım"
result: "Herkes anlar"

# Düzenli güncelleme
approach: "Her 3 ayda bir makale gözden geçirme"
result: "Güncel, doğru bilgi"

# Mantıksal gruplama
approach: "Konu bazlı kategoriler, alt bölümler"
result: "Kolay bulunur, kolay okunur"

# Görsel destek
approach: "Kritik adımlarda screenshot/GIF"
result: "Anlama artar, hata azalır"
```

---

## Quick Reference (Hızlı Başvuru)

| Makale Türü | Ideal Uzunluk | Görsel Sayısı | Hedef Kitle |
|---|---|---|---|
| Nasıl yapılır | 300-600 kelime | 3-8 | Genel |
| Başlarken | 500-800 kelime | 5-10 | Yeni kullanıcı |
| Sorun giderme | 400-700 kelime | 2-6 | Etkilenen kullanıcı |
| Referans | 200-500 kelime | 0-3 | Deneyimli kullanıcı |
| Kavram | 500-1000 kelime | 1-5 | Teknik kullanıcı |
| İpucu | 100-300 kelime | 1-3 | Verimlilik arayan |

| Makale Bölümü | Cümle/Paragraf | Max Uzunluk |
|---|---|---|
| Giriş | 2-3 paragraf | 100 kelime |
| Bölüm (H2) | 2-4 paragraf | 200 kelime |
| Alt bölüm (H3) | 1-2 paragraf | 100 kelime |
| Adım talimatı | 1-2 cümle | 30 kelime |
| Sonuç | 1-2 paragraf | 80 kelime |

| Görsel Türü | Kullanım | Boyut Önerisi |
|---|---|---|
| Screenshot (UI) | Adım gösterimi | 800x500px |
| GIF (animasyon) | Çok adımlı süreç | <3 saniye, <2MB |
| Diyagram | Mimari/açıklama | 600x400px |
| İkon | Uyarı/İpucu kutusu | 32x32px |
| Fotoğraf | İnsan/cihaz | 400x300px |

| Başlık Formatları | Kullanım |
|---|---|
| "Nasıl Yapılır: [Konu]" | How-to makaleleri |
| "[Konu] Sorun Giderme" | Troubleshooting |
| "[Konu] Başlangıç Rehberi" | Getting started |
| "[Özellik] Kullanımı" | Feature guides |
| "[API/Metod] Referansı" | Reference docs |

| SEO Elementi | Karakter Limit | İçerik |
|---|---|---|
| H1 (Ana başlık) | 60 | Ana anahtar kelime |
| Meta title | 55-60 | Konu + "Rehber/Guide" |
| Meta description | 150-155 | Fayda + anahtar kelime |
| URL slug | 50-70 | Kısa, tire ile |
| H2 alt başlık | 70 | Yan anahtar kelime |

| Kutu Türleri | Kullanım Senaryosu |
|---|---|
| 💡 İpucu | Verimlilik artırıcı bilgi |
| ⚠️ Uyarı | Dikkat gerektiren durum |
| ❌ Hata | Bilinen hatalar |
| ℹ️ Not | Ek bilgi |
| 🎯 Sonuç | Nihai hedef/durum |

| Metrik | Hedef | Uyarı |
|---|---|---|
| Okunma süresi | 2-5 dakika | <1 dk veya >10 dk |
| Tamamlama oranı | >%60 | <%40 |
| Arama sonucu tıklanma | >%30 | <%20 |
| Geri bildirim olumlu | >%80 | <%60 |
| Güncellik (ay) | <3 ay | >6 ay |

---

## Template: Standart Makale Yapısı

```markdown
---
title: "[Makale Başlığı]"
description: "[155 karakter özet - meta description için]"
category: "[Kategori]"
author: "[Yazar]"
lastUpdated: "[Tarih]"
readingTime: "[X] dakika"
---

# [H1 - Ana Başlık]

[Makale konusunun kısa tanımı - 2-3 cümle]

## [H2 - Bölüm 1]

[İçerik]

### [H3 - Alt bölüm]

[İçerik]

## [H2 - Bölüm 2]

[İçerik]

> 💡 **İpucu:** [İlgili ipucu içeriği]

## [H2 - Bölüm 3]

[İçerik]

> ⚠️ **Uyarı:** [Dikkat gerektiren önemli bilgi]

## Sıkça Sorulan Sorular

### [Soru 1]
[Cevap]

### [Soru 2]
[Cevap]

## Sonraki Adımlar

- [Sonraki makale/link]
- [Sonraki makale/link]

---

**Hâlâ sorun yaşıyor musunuz?** [Destek ekibimize ulaşın](/support)
```

---

## Otomasyon Parametreleri

```typescript
interface KnowledgeBaseWriterConfig {
  articleTypes: ('howto' | 'getting-started' | 'troubleshooting' | 'reference' | 'concept' | 'tips')[];
  structureRules: {
    minWordCount: number;
    maxWordCount: number;
    requireVisuals: boolean;
    minVisualCount: number;
    requireSEO: boolean;
    requireMetaDescription: boolean;
  };
  seoRules: {
    primaryKeywordRequired: boolean;
    keywordDensity: { min: number; max: number };
    requireInternalLinks: boolean;
    minInternalLinks: number;
    slugFormat: string;                 // /konu-konusu
  };
  contentQuality: {
    readabilityLevel: 'beginner' | 'intermediate' | 'advanced';
    tone: 'formal' | 'friendly' | 'technical';
    sentenceMaxLength: number;
    paragraphMaxLines: number;
  };
  maintenance: {
    reviewFrequencyDays: number;
    autoArchiveAfterDays: number;
    trackViews: boolean;
  };
  templates: {
    [type: string]: {
      structure: string[];
      exampleTitle: string;
    };
  };
}
```
