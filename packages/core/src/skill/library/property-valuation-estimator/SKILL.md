---
name: property-valuation-estimator
description: Gayrimenkul değerleme aracı. Comparable analysis, income approach, cost approach ve market approach ile profesyonel değerleme raporları hazırlar.
triggers:
  - "gayrimenkul değerleme"
  - "emlak fiyat analizi"
  - "değerleme raporu"
  - "property valuation"
  - "konut fiyat endeksi"
  - "piyasa analizi"
auto_load_when:
  - real_estate
  - investment_analysis
  - financial_consulting
  - appraisal_services
agent: content-ops
tools:
  - markdown_writer
  - template_generator
  - calculator
---

# Property Valuation Estimator — Gayrimenkul Değerleme Tahmincisi

Gayrimenkul değerlemesi, piyasa verileri, gelir potansiyeli ve maliyet faktörlerini birleştiren sistematik bir analiz sürecidir. Bu skill, üç ana değerleme yaklaşımını kullanarak profesyonel raporlar üretir.

---

## Pattern: Comparable Market Analysis (CMA) — Karşılaştırmalı Piyasa Analizi

```
Comparable Market Analysis (CMA)
├── Step 1: Define Search Parameters
│   ├── Geographic radius
│   │   └── Aynı mahalle / 1 km, aynı ilçe / 5 km
│   ├── Property type
│   │   └── Aynı yapı tipi (daire, villa, ticari)
│   ├── Size range
│   │   └── Hedef m² ± %15
│   ├── Bedroom / room count
│   │   └── Benzer oda sayısı
│   └── Time frame
│       └── Son 6–12 ayın satışları
│
├── Step 2: Select Comparable Properties
│   ├── Ideal comparables: 5–10 adet
│   │   ├── 3 "sold" (satılmış)
│   │   ├── 3 "active" (satılık)
│   │   └── 2–4 "pending" (satış aşamasında)
│   │
│   └── Comparison matrix
│       ├── Address / reference
│       ├── Sale price / listing price
│       ├── Size (m²)
│       ├── Price per m²
│       ├── Bedrooms / bathrooms
│       ├── Year built / condition
│       ├── Lot size (arsa)
│       ├── garage / parking
│       └── Days on market
│
├── Step 3: Adjustments (Düzeltmeler)
│   ├── Positive adjustments (+)
│   │   ├── Daha yeni bina
│   │   ├── Ekstra oda / banyo
│   │   ├── Yenilenmiş mutfak / banyo
│   │   ├── Daha büyük balkon / teras
│   │   ├── Manzara avantajı
│   │   └── Daha iyi lokasyon
│   │
│   ├── Negative adjustments (-)
│   │   ├── Daha eski bina
│   │   ├── Bakımsız / yenilemeye ihtiyaç
│   │   ├── Düşük kat / gürültülü cephe
│   │   ├── Az m² / küçük oda
│   │   └── Otoparksız / az otopark
│   │
│   └── Adjustment magnitude
│       └── Her düzeltme için TL değeri hesapla
│           └── Örnek: Her m² = +5.000 TL, her oda = +50.000 TL
│
└── Step 4: Value Conclusion
    ├── Adjusted price range
    │   └── En düşük – en yüksek
    ├── Weighted average
    │   └── Ağırlıklı ortalama (en yakın comp'lara daha çok ağırlık)
    ├── Market conditions adjustment
    │   └── Hot market (+5–10%) vs cold market (-5–10%)
    └── Estimated Value
        └── "Piyasa değeri: X – Y TL aralığında"
```

---

## Pattern: Income Approach (Gelir Yaklaşımı)

Ticari ve yatırım amaçlı gayrimenkullerde kullanılır.

```
Income Approach
├── Step 1: Potential Gross Income (PGI)
│   ├── Annual rental income
│   │   └── Aylık kira × 12
│   ├── Other income
│   │   ├── Otopark geliri
│   │   ├── Depolama geliri
│   │   └── Laundry / vending
│   └── Gross Potential Income
│       └── Tüm gelir kaynakları toplamı
│
├── Step 2: Effective Gross Income (EGI)
│   ├── Less: Vacancy rate
│   │   └── Beklenen boşluk süresi (%3–10)
│   ├── Less: Collection loss
│   │   └── Tahsil edilemeyen kira (%1–3)
│   └── Effective Gross Income
│       └── PGI × (1 - vacancy rate - collection loss)
│
├── Step 3: Operating Expenses (İşletme Giderleri)
│   ├── Fixed expenses
│   │   ├── Grundbesitzsteuer (emlak vergisi)
│   │   ├── Sigorta
│   │   └── Yönetim ücreti (aidat)
│   │
│   ├── Variable expenses
│   │   ├── Bakım / onarım
│   │   ├── Kapıcı / temizlik
│   │   ├── Elektrik / su (ortak alanlar)
│   │   └── Hukuki giderler
│   │
│   ├── Reserves
│   │   └── Büyük onarım fonu (capex)
│   │
│   └── Total Operating Expenses
│       └── EGI'nin %25–45'i (mülk tipine göre)
│
├── Step 4: Net Operating Income (NOI)
│   ├── NOI = EGI - Operating Expenses
│   └── Mülkün borç servisi hariç net geliri
│
├── Step 5: Capitalization Rate (Cap Rate)
│   ├── Cap Rate = NOI / Property Value
│   ├── Cap Rate formülü: r = NOI / V
│   ├── Property Value formülü: V = NOI / r
│   └── Bölge cap rate ortalaması kullanılır
│       └── Türkiye'de genelde %5–9
│
└── Step 6: Value Calculation
    ├── Direct capitalization
    │   └── V = NOI / Cap Rate
    ├── Example
    │   ├── NOI: 180.000 TL / yıl
    │   ├── Cap Rate: 7%
    │   └── Değer = 180.000 / 0,07 = 2.571.428 TL
    └── Gross Rent Multiplier (GRM)
        └── GRM = Satış Fiyatı / Yıllık Kira → Türkiye'de 10–15 yıl
```

---

## Pattern: Cost Approach (Maliyet Yaklaşımı)

Yeni veya az kullanılmış mülkler için uygundur.

```
Cost Approach
├── Step 1: Land Value (Arsa Değeri)
│   ├── Direct comparison (karşılaştırmalı arsa satışları)
│   ├── Land residual technique
│   │   ├── Tahmini bina değeri hesapla
│   │   ├── Toplam değerden bina değerini çıkar
│   │   └── Kalan = arsa değeri
│   └── Plot area × unit land value
│       └── Arsa m² × birim arsa değeri
│
├── Step 2: Replacement / Reproduction Cost
│   ├── Replacement cost
│   │   └── Aynı faydayı sağlayan yeni bir bina inşa etme maliyeti
│   │
│   ├── Unit-in-place method
│   │   ├── Her yapı elemanının maliyeti
│   │   │   ├── Temel
│   │   │   ├── Taşıyıcı duvarlar
│   │   │   ├── Döşeme / çatı
│   │   │   ├── Tesisat
│   │   │   └── İç mekan kaplama
│   │   └── Her biri × birim maliyet
│   │
│   ├── Quantity survey estimate
│   │   └── Detaylı malzeme + işçilik hesabı
│   │
│   └── Quick estimate
│       └── m² × ortalama inşaat maliyeti (TL/m²)
│           └── İstanbul 2026: Düz daire ~25.000 TL/m²
│               Lüks / villalar: ~40.000–60.000 TL/m²
│
├── Step 3: Accrued Depreciation (Birikmiş Amortisman)
│   ├── Physical depreciation
│   │   ├── Curable (düzeltilebilir)
│   │   │   └── Boya, küçük onarımlar
│   │   └── Incurable (düzeltilemez)
│   │       └── Yapısal hasarlar, yaşlanma
│   │
│   ├── Functional obsolescence (İşlevsel eskime)
│   │   ├── Curable
│   │   │   └── Eksiklikler (dolap yok, küvet var)
│   │   └── Incurable
│   │       └── Tasarım hataları, plan aksaklıkları
│   │
│   └── External obsolescence (Dışsal eskime)
│       └── Çevresel faktörler (gürültü, kirlilik, ekonomik)
│
├── Step 4: Depreciation Calculation
│   ├── Age-life method
│   │   ├── Effective age (efektif yaş)
│   │   ├── Total economic life (toplam ekonomik ömür)
│   │   └── Depreciation = (Effective Age / Total Life) × RC
│   │
│   └── Breakdown method
│       └── Her tür amortisman ayrı hesaplanır
│
└── Step 5: Final Value
    ├── Value = Land Value + (RC - Depreciation)
    └── Example:
        ├── Arsa: 2.000.000 TL
        ├── Yeniden inşa maliyeti: 3.500.000 TL
        ├── Amortisman: -700.000 TL
        └── Değer = 2.000.000 + (3.500.000 - 700.000) = 4.800.000 TL
```

---

## Pattern: Market Approach (Piyasa Yaklaşımı — Makro Analiz)

```
Market Approach — Macro Level
├── Step 1: Market Analysis
│   ├── Supply analysis
│   │   ├── Active listings (mevcut arz)
│   │   ├── New construction pipeline (yeni proje sayısı)
│   │   └── Months of supply (stok analizi)
│   │
│   ├── Demand analysis
│   │   ├── Population growth
│   │   ├── Employment trends
│   │   ├── Mortgage rates
│   │   └── Buyer sentiment
│   │
│   └── Absorption rate
│       └── Satış hızı (aylık absorbe edilen m²)
│           └── Düşük absorption = alıcı piyasası
│
├── Step 2: Price Trends
│   ├── Historical price indices
│   │   └── Son 5–10 yılın fiyat seyri
│   ├── Year-over-year change
│   │   └── Geçen yıla göre % değişim
│   ├── Price per m² trends
│   │   └── m² başına fiyat eğilimi
│   └── Seasonality
│       └── İlkbahar / sonbahar doruk mı?
│
├── Step 3: Location Scoring
│   ├── Walk Score / Transit Score
│   ├── School district quality
│   ├── Crime rate
│   ├── Employment accessibility
│   ├── Amenity proximity
│   └── Future development plans
│
└── Step 4: Final Value Synthesis
    ├── Weight the three approaches
    │   ├── CMA weight: 50%
    │   ├── Income approach: 30% (yatırım mülkleri)
    │   └── Cost approach: 20% (yeni binalar)
    └── Weighted average = Final Opinion of Value
```

---

## Key Patterns

| Yöntem | En İyi Kullanım | Zayıf Yön |
|---|---|---|
| **CMA** | Konut, aktif piyasa | Tarihsel veri gerekir, subjektif düzeltmeler |
| **Income** | Yatırım, ticari, kiralık | Kira tahmini zor, boşluk riski |
| **Cost** | Yeni binalar, sigorta, az gelişmiş piyasa | Arsa değeri zor hesaplanabilir, amortisman tahmini zor |
| **Hybrid** | Karma kullanım, farklı veri varsa | En güvenilir sonuç |

---

## Anti-Patterns

```
❌ Sadece bir yöntem kullanma — tek kaynak yanıltıcı olabilir
   → En az 2 yöntemi paralel uygula, çapraz kontrol et

❌ Çok uzak mesafedeki satışları karşılaştırma yapma
   → Aynı mahalle veya max 1 km fark olmalı

❌ Amortismanı göz ardı etme
   → 20 yıllık bina = önemli düzeltme gerekebilir

❌ Kira değerini gerçekçi bulmama
   → En az 3 karşılaştırmalı kira araştırması yap

❌ Makro faktörleri yoksayma — sadece mikro analiz
   → Faiz oranları, enflasyon, bölgesel büyüme etkilerini değerlendir

❌ Duygusal değer katma — "ama ben çok seviyorum bu evi"
   → Değerleme = veri, duygu karıştırmadan hesapla

✅ Tüm verileri kaynağıyla birlikte belgelendir
✅ Düzeltmelerin gerekçesini açıkça yaz
✅ Raporu bağımsız bir gözle tekrar oku
```

---

## Quick Reference

| Yöntem | Formül | Değişken |
|---|---|---|
| **CMA — Birim m² değeri** | Satış Fiyatı / Brüt m² | Karşılaştırma m²'si |
| **CMA — Düzeltme** | Comp Fiyatı +/(-) Düzeltme | Her özellik farkı için TL |
| **Cap Rate** | NOI / Değer (×100) | Türkiye: %5–9 |
| **NOI** | EGI - İşletme Giderleri | Vergi ve borç hariç |
| **GRM** | Satış Fiyatı / Yıllık Kira | Türkiye: 10–15 yıl |
| **Değer (Income)** | NOI / Cap Rate | Basit sermayeleme |
| **Amortisman (yaş-ömür)** | (Efektif Yaş / Toplam Ömür) × Maliyet | Yıllık orantı |
| **Arsa değeri** | Arsa m² × Birim arsa fiyatı | Karşılaştırma yoluyla |
| **Inşaat maliyeti** | m² × Birim maliyet (TL/m²) | 2026 İstanbul: ~25.000 TL/m² |
| **Değer aralığı** | Min düzeltilmiş – maks düzeltilmiş | ±%10 marj ile sun |
