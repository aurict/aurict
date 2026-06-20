---
name: seo-keyword-researcher
description: "Yüksek hacim, düşük rekabet anahtar kelimeler. Long-tail keywords. Keyword mapping. SERP analizi. Content gap analysis. Keyword funnel."
triggers:
  keywords: ["seo", "anahtar kelime", "keyword research", "arama hacmi", "serp", "sıralama", "google", "sitemaps"]
  extensions: [".md", ".csv", ".xlsx"]
auto_load_when: "SEO optimizasyonu, içerik stratejisi veya anahtar kelime araştırması talep edildiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch"]
---

# SEO Keyword Researcher — ANAHTAR KELİME ARAŞTIRMA REHBERİ

**Odağ:** Yüksek arama hacmi, düşük rekabet anahtar kelimeler tespit etmek ve içerik stratejisine entegre etmek.

---

## 1. Keyword Research Süreci

```
Adım Adım Keyword Research:
├── Adım 1: Seed Keywords (Tohum Kelimeler)
│   ├── Temel ürün/hizmet kategori isimleri
│   ├── "ne iş yapıyorsunuz?" sorusundan çıkan kelimeler
│   └── Rakip analizi: Onların hedeflediği kelimeler
│
├── Adım 2: Keyword Discovery (Keşif)
│   ├── Google Autocomplete (arama kutusuna yaz)
│   ├── "People Also Ask" ve "Related Searches"
│   ├── Keyword Planner ve alternatifleri
│   └── AnswerThePublic, AlsoAsked
│
├── Adım 3: Kelime Gruplama (Clustering)
│   ├── Aynı niyete sahip kelimeleri grupla
│   ├── "en iyi X" ve "X karşılaştırma" aynı niyet
│   └── Her cluster için bir landing page
│
├── Adım 4: Metrik Toplama
│   ├── Arama hacmi (Volume)
│   ├── Rekabet zorluğu (KD - Keyword Difficulty)
│   ├── Trend (sezonluk, yükselen, düşen)
│   └── CPC (maliyet tıklama - reklam veri)
│
└── Adım 5: Fırsat Analizi
    ├── Hangi kelimelerde sıralama şansı var?
    ├── Düşük rekabet + yüksek hacim = ideal hedef
    └── Long-tail优先 (düşük hacim ama yüksek dönüşüm)
```

---

## 2. Anahtar Kelime Türleri

```
Intent (Niyet) Bazlı Sınıflandırma:
├── INFORMATIONAL (Bilgi arayan):
│   ├── Soru formunda sorular
│   ├── "nasıl", "neden", "ne", "hangi"
│   ├── Arama hacmi yüksek, rekabet düşük olabilir
│   └── Dönüşüm: Düşük (top of funnel)
│
├── NAVIGATIONAL (Marka arayan):
│   ├── Belirli marka/site adı
│   ├── "X resmi sitesi", "X giriş"
│   └── Genellikle brand sahipleri için
│
├── COMMERCIAL (Karşılaştırma):
│   ├── "X karşılaştırması", "en iyi X"
│   ├── "X mi yoksa Y mi"
│   └── Orta huni (middle of funnel)
│
└── TRANSACTIONAL (Satın alma niyeti):
    ├── "X satın al", "X fiyat", "X indirim"
    ├── "X kiralama", "X teklif al"
    └── Alt huni (bottom of funnel)
```

---

## 3. Long-Tail Keyword Stratejisi

```
Long-Tail Tanımı:
├── 3-5 kelimeden oluşan spesifik aramalar
├── "spor ayakkabı" → "erkek beyaz spor ayakkabı Nike 42 numara"
├── Toplam arama hacminin %70'i long-tail
└── Dönüşüm oranı 3-5x daha yüksek

Long-Tail Bulma Yöntemleri:
├── Google Autocomplete:
│   └── "nasıl [konu]..." yazarak türevler
├── AnswerThePublic:
│   ├── Soru bazlı long-tail
│   └── "nasıl", "neden", "ne zaman" soruları
├── Google Search Console:
│   ├── Hangi kelimelerde tıklama var ama sıralama yok
│   └── "Position 4-10" arası fırsatlar
└── Forum ve Reddit:
    ├── "X kullanıcıları ne soruyor?"
    └── Quora, Reddit search
```

---

## 4. Keyword Mapping (Eşleştirme)

```
Mapping Mantığı:
├── Her anahtar kelime grubu = 1 sayfa
├── Her sayfa = 1 H1 başlık = 1 ana keyword
├── İkincil anahtar kelimeler (LSI) = H2-H6 başlıklar
└── Site mimarisi: Homepage → Category → Subcategory → Page

Mapping Şablonu:
KELİME GRUBU | ANA KELİME | İKİNCİL KELİMELER | SAYFA
─────────────|───────────|────────────────────|───────
Spor ayakkabı | "spor ayakkabı modelleri" | "spor ayakkabı türleri", "spor ayakkabı nasıl seçilir" | /spor-ayakkabi
Beyaz spor ayakkabı | "beyaz spor ayakkabı" | "beyaz spor ayakkabı erkek", "beyaz yürüyüş ayakkabısı" | /beyaz-spor-ayakkabi
Nike | "Nike spor ayakkabı" | "Nike erkek ayakkabı", "Nike yürüyüş ayakkabısı" | /nike-spor-ayakkabi

Eşleştirme Kuralları:
├── Aynı intent'te birden fazla kelime = tek sayfa
├── Farklı intent = ayrı sayfalar
├── Yazarak ulaşılabilir kelimeler öncelikli
└── Her sayfada maks 1 H1
```

---

## 5. SERP Analizi

```
SERP Sonuçları Okuma:
├── Öncelikli Sonuçlar (Position 1-3):
│   ├── Kimler var? (Brand logoları tanıyan rakipler)
│   ├── Content türü: Blog mu, ürün mü, video mu?
│   ├── Word count: Kaç kelime?
│   └── Backlink profili: Güçlü mü zayıf mı?
│
├── "People Also Ask" Analizi:
│   ├── Hangi sorular soruluyor?
│   ├── Bu sorulara cevap veren içerik var mı?
│   └── Featured snippet kapma fırsatı
│
├── Görsel Sonuçlar:
│   ├── "Images" sekmesinde kimler var?
│   ├── Görsel optimizasyonu fırsatı
│   └── Alt text kontrolü
│
└── Video Sonuçları:
    ├── YouTube videoları mı var?
    ├── Video içerik fırsatı
    └── Video schema işaretleme
```

---

## 6. Content Gap Analysis

```
Content Gap = Rakipte olan ama sizde olmayan içerik

Analiz Yöntemi:
├── Rakip Listesi Belirle:
│   ├── Google'da hedef kelimede sıralanan ilk 10 site
│   ├── Hangi markalar tanıdık?
│   └── Sadece direkt rakipler değil, bilgi sitelerini de dahil et
│
├── Rakip İçerik Tarama:
│   ├── Semrush/Ahrefs ile rakiplerin sayfaları
│   ├── Organic keywords (hangi kelimelerde sıralanıyorlar)
│   └── Traffic tahmini
│
├── Boşluk Tespiti:
│   ├── Sizde olmayan kelimeleri listele
│   ├── Hacim + rekabet hesapla
│   ├── "Sadece rakipte var" kelimeler = fırsat
│   └── "İkisi de yok" = pazar boşluğu
│
└── Fırsat Önceliklendirme:
    ├── High volume + Low competition = Hemen hedefle
    ├── High volume + Medium competition = Uzun vadeli hedef
    └── Low volume + Low competition = Hemen sıralan, az trafik
```

---

## 7. Keyword Funnel (Huni)

```
Funnel Aşamaları:
├── TOP OF FUNNEL (ToFu) — Farkındalık:
│   ├── Bilgi arayan geniş kelimeler
│   ├── "X nedir?", "X nasıl yapılır?"
│   ├── Geniş kitle, düşük dönüşüm
│   └── İçerik: Blog post, infografik, video
│
├── MIDDLE OF FUNNEL (MoFu) — Değerlendirme:
│   ├── Karşılaştırma ve değerlendirme kelimeleri
│   ├── "X mi Y mi?", "en iyi X", "X özellikleri"
│   ├── Orta kitle, orta dönüşüm
│   └── İçerik: Karşılaştırma sayfası, rehber, ebook
│
└── BOTTOM OF FUNNEL (BoFu) — Satın Alma:
    ├── Satın alma niyetli kelimeler
    ├── "X satın al", "X fiyat", "X indirim", "X teklif"
    ├── Dar kitle, yüksek dönüşüm
    └── İçerik: Ürün sayfası, landing page
```

---

## 8. Araç ve Veri Kaynakları

```
Ana Araçlar:
├── Google Araçları:
│   ├── Keyword Planner (Google Ads)
│   ├── Google Trends
│   └── Search Console
│
├── Üçüncü Taraf Araçları:
│   ├── Semrush — Komple SEO suite
│   ├── Ahrefs — Backlink + keyword
│   ├── Ubersuggest — Uygun fiyatlı alternatif
│   ├── AnswerThePublic — Soru keşfi
│   └── AlsoAsked — Soru analizi
│
└── Ücretsiz Alternatifler:
    ├── Google Autocomplete
    ├── "Related Searches"
    ├── Google Trends
    └── Keyword Surfer (Chrome eklentisi)
```

---

## Key Patterns

1. **Intent önce gelir** — Hacim yüksek olsa bile yanlış intent = düşük dönüşüm.
2. **Long-tail öncelikli başla** — Düşük rekabetle başla, otorite kazanınca daha zor kelimelere geç.
3. **Rakip analizi şart** — Sıralama istediğiniz kelimede kimler var, ne yapıyorlar?
4. **Funnel mantığı** — ToFu ile başla, MoFu ile besle, BoFu ile dönüştür.
5. **Güncel tut** — Keyword trendleri değişir; her 3 ayda gözden geçir.

---

## Anti-Patterns

```
❌ Sadece yüksek hacimli kelimelere odaklanmak
✅ Long-tail + düşük rekabet kombinasyonlarını hedefle

❌ Bir sayfaya birden fazla ana kelime koymak (keyword cannibalization)
✅ Her kelime grubu = ayrı sayfa

❌ Rekabet yüksek kelimelerle doğrudan savaşmak
✅ Pazar boşluklarını bul ve önce oraya yerleş

❌ Sadece bilgi kelimeleri hedeflemek (dönüşüm yok)
✅ Funnel boyunca denge kur: ToFu + MoFu + BoFu

❌ Anahtar kelime doldurma (keyword stuffing)
✅ Doğal, okunabilir içerik yaz; kelime yeterince geçsin
```

---

## Quick Reference

| Kelime Türü | Örnek | Intent | Dönüşüm |
|---|---|---|---|
| Short-tail | "spor ayakkabı" | Bilgi/navigasyon | Düşük |
| Long-tail | "erkek beyaz spor ayakkabı Nike 42" | Transactional | Yüksek |
| Informational | "spor ayakkabı nasıl seçilir" | Bilgi | Düşük |
| Commercial | "en iyi spor ayakkabı markaları" | Karşılaştırma | Orta |
| Transactional | "Nike erkek spor ayakkabı satın al" | Satın alma | Çok yüksek |

| SERP Öğesi | Kapmak İçin | Zorluk |
|---|---|---|
| Featured Snippet | 40-50 kelime net cevap | Orta |
| People Also Ask | Soruları cevapla | Düşük |
| Local Pack | Google Business optimize | Orta |
| Image Pack | Görsel SEO + Alt text | Düşük |
| Video (YouTube) | Video optimize et | Orta |

| Araç | Kullanım | Maliyet |
|---|---|---|
| Google Keyword Planner | Hacim + rekabet | Ücretsiz |
| Google Trends | Trend analizi | Ücretsiz |
| Semrush | Komple analiz | Ücretli |
| Ahrefs | Backlink + keyword | Ücretli |
| Ubersuggest | Alternatif | Freemium |
| AnswerThePublic | Soru keşfi | Freemium |
