---
name: nutrition-analyzer
description: Besin değeri hesaplama ve diyet analiz aracı. Makro dağılımı, kalori hesaplama, diet tracking ve recipe optimization ile kişiselleştirilmiş beslenme planları üretir.
triggers:
  - "besin değeri hesapla"
  - "kalori hesaplama"
  - "diyet planı"
  - "nutrition analysis"
  - "makro dağılımı"
  - "recipe optimization"
auto_load_when:
  - health_fitness
  - diet_planning
  - recipe_development
  - wellness_apps
agent: content-ops
tools:
  - markdown_writer
  - template_generator
  - calculator
---

# Nutrition Analyzer — Besin Değeri Analizcisı

Sağlıklı beslenme, bilim ve kişiselleştirmenin kesiştiği noktadır. Bu skill; gıda verileri, makro hesaplamaları ve diet optimizasyonunu birleştiren kapsamlı beslenme analizleri sunar.

---

## Pattern: Macronutrient Distribution (Makro Dağılımı)

```
Macronutrient Distribution
├── Step 1: Energy Requirement Calculation
│   ├── Basal Metabolic Rate (BMR) — Harris-Benedict
│   │   ├── Erkek: BMR = 88.362 + (13.397 × kg) + (4.799 × cm) - (5.677 × yaş)
│   │   └── Kadın: BMR = 447.593 + (9.247 × kg) + (3.098 × cm) - (4.330 × yaş)
│   │
│   ├── Activity Multiplier
│   │   ├── Sedanter: ×1.2
│   │   ├── Hafif aktif: ×1.375
│   │   ├── Orta aktif: ×1.55
│   │   ├── Çok aktif: ×1.725
│   │   └── Ekstra aktif: ×1.9
│   │
│   └── Total Daily Energy Expenditure (TDEE)
│       └── BMR × Activity Multiplier
│
├── Step 2: Goal-Based Calorie Adjustment
│   ├── Weight loss
│   │   └── TDEE - 500 kcal = günde ~0.5 kg kaybı
│   ├── Weight gain
│   │   └── TDEE + 300–500 kcal
│   ├── Maintenance
│   │   └── TDEE = günlük hedef
│   └── Body recomposition
│       └── TDEE ± 100 kcal + yüksek protein
│
├── Step 3: Macro Split (Makro Dağılımı)
│   ├── Standard Balanced
│   │   ├── Karbonhidrat: %45–55 → 4 kcal/g
│   │   ├── Protein: %15–25 → 4 kcal/g
│   │   └── Yağ: %20–35 → 9 kcal/g
│   │
│   ├── High Protein
│   │   ├── Protein: %30–40
│   │   ├── Karbonhidrat: %30–35
│   │   └── Yağ: %25–30
│   │
│   ├── Low Carb / Keto
│   │   ├── Karbonhidrat: %5–10 (20–50 g)
│   │   ├── Protein: %25–30
│   │   └── Yağ: %60–70
│   │
│   ├── Athletic / Performance
│   │   ├── Karbonhidrat: %50–60
│   │   ├── Protein: %20–25
│   │   └── Yağ: %20–25
│   │
│   └── Fat Loss
│       ├── Karbonhidrat: %30–40
│       ├── Protein: %35–40
│       └── Yağ: %25–30
│
└── Step 4: Gram Calculation
    ├── Protein (g) = (Hedef kalori × %protein) / 4
    ├── Carbs (g) = (Hedef kalori × %karbonhidrat) / 4
    └── Fat (g) = (Hedef kalori × %yağ) / 9
```

---

## Pattern: Calorie Calculation (Kalori Hesaplama)

```
Calorie Calculation Methods
├── Direct Calculation (Doğrudan)
│   ├── Atwater Factors (genel)
│   │   ├── Karbonhidrat: 4 kcal/g
│   │   ├── Protein: 4 kcal/g
│   │   ├── Yağ: 9 kcal/g
│   │   ├── Alkol: 7 kcal/g
│   │   └── Lif: 2 kcal/g (net karbonhidrat)
│   │
│   └── Example
│       ├── 100g tavuk göğsü: 165 kcal
│       │   ├── Protein: 31g × 4 = 124 kcal
│       │   ├── Yağ: 3.6g × 9 = 32.4 kcal
│       │   └── Toplam: 156.4 kcal (yuvarlatılmış 165)
│       └── 100g kahverengi pirinç: 112 kcal
│           ├── Karbonhidrat: 23.5g × 4 = 94 kcal
│           ├── Protein: 2.6g × 4 = 10.4 kcal
│           └── Yağ: 0.9g × 9 = 8.1 kcal
│
├── Meal-Based Calculation (Öğün Bazlı)
│   ├── Breakfast target: %25 günlük kalori
│   ├── Lunch target: %35 günlük kalori
│   ├── Snack target: %15 günlük kalori
│   └── Dinner target: %25 günlük kalori
│
├── Portion Adjustment
│   ├── Serving size: Besin etiketi porsiyonu
│   ├── Scaling factor: (Gerçek porsiyon / Etiket porsiyonu)
│   └── Adjusted calories: Etiket × Scaling factor
│
└── Label Reading
    ├── Serving per container
    ├── Calories per serving
    ├── Total fat / Saturated / Trans
    ├── Cholesterol / Sodium
    ├── Total carbohydrate / Fiber / Sugars
    ├── Protein
    └── % Daily Value (DV)
```

---

## Pattern: Diet Tracking (Diyet Takibi)

```
Diet Tracking System
├── Daily Log Structure
│   ├── Meal 1 — Breakfast
│   │   ├── Food item
│   │   ├── Portion size (g)
│   │   ├── Calories
│   │   ├── Protein / Carbs / Fat
│   │   └── Micronutrients (optional)
│   │
│   ├── Meal 2 — Lunch
│   │   ├── Food item
│   │   ├── Portion size (g)
│   │   ├── Calories
│   │   ├── Protein / Carbs / Fat
│   │   └── Micronutrients
│   │
│   ├── Meal 3 — Snack
│   │   └── (same structure)
│   │
│   └── Meal 4 — Dinner
│       └── (same structure)
│
├── Weekly Summary
│   ├── Total calories (7 gün)
│   ├── Daily average
│   ├── Protein average
│   ├── Carb average
│   ├── Fat average
│   ├── Fiber average
│   └── Goal adherence %
│
├── Nutrient Status Assessment
│   ├── Adequacy check
│   │   ├── Protein: yeterli mi? (< 0.8 g/kg = yetersiz)
│   │   ├── Fiber: 25–38 g/gün hedefi
│   │   ├── Su: 2–3 litre hedefi
│   │   └── Vitamin/mineral gaps
│   │
│   ├── Balance check
│   │   ├── Makro oranı hedefe uygun mu?
│   │   ├── Öğün dağılımı dengeli mi?
│   │   └── Hafta sonu aşırılığı var mı?
│   │
│   └── Pattern identification
│       ├── Hangi günler hedef dışı?
│       ├── Hangi öğünler atlanıyor?
│       └── Emotional eating tetikleyicileri?
│
└── Adjustment Recommendations
    ├── Calorie adjustment
    ├── Macro split adjustment
    ├── Meal timing adjustment
    └── Supplement suggestions
```

---

## Pattern: Recipe Optimization (Tarif Optimizasyonu)

```
Recipe Optimization
├── Step 1: Baseline Analysis
│   ├── Ingredient list
│   │   └── Her malzeme: g, kcal, P, C, F
│   │
│   ├── Total yield
│   │   └── Pişirmeden sonra toplam ağırlık (g)
│   │
│   ├── Per serving calculation
│   │   └── Toplam / porsiyon sayısı
│   │
│   └── Nutritional score
│       ├── Protein density?
│       ├── Fiber yeterli mi?
│       ├── Sodyum yüksek mi?
│       └── Added sugar var mı?
│
├── Step 2: Healthy Substitutions
│   ├── Protein swaps
│   │   ├── Kırmızı et → tavuk / balık / baklagil
│   │   ├── Tam yağlı peynir → az yağlı / lor
│   │   └── Krem peynir → Greek yogurt
│   │
│   ├── Carb swaps
│   │   ├── Beyaz ekmek → tam buğday
│   │   ├── Pirinç → kinoa / bulgur / karabuğday
│   │   └── Makarna → zoodles / edamame
│   │
│   ├── Fat swaps
│   │   ├── Tereyağı → avocado / zeytinyağı
│   │   ├── Krema → coconut milk / cashew cream
│   │   └── Mayonez → Greek yogurt + hardal
│   │
│   └── Sugar swaps
│       ├── Beyaz şeker → doğal tatlandırıcılar
│       ├── Mısır şurubu → bal / akçaağaç şurubu
│       └── Meyve püresi → tam meyve
│
├── Step 3: Macro Balancing
│   ├── High-protein version
│   │   └── +tavuk, +baklagil, +yumurta
│   ├── Lower-carb version
│   │   └── -pirinç, +sebze, +avocado
│   └── Higher-fiber version
│       └── +sebze, +kepekli tahıl, +chia
│
└── Step 4: Portion-Controlled Version
    ├── Reduce total recipe size
    ├── Increase protein density
    ├── Add zero-calorie volumetrics
    │   └── Salata, çorba, salatalık
    └── Pre-portion for meal prep
```

---

## Key Patterns

| Diyet Tipi | Karbonhidrat | Protein | Yağ | Hedef Kitle |
|---|---|---|---|---|
| **Standard** | %45–55 | %15–25 | %20–35 | Genel sağlık |
| **High Protein** | %30–35 | %30–40 | %25–30 | Kas kazanımı |
| **Keto / Low-Carb** | %5–10 | %25–30 | %60–70 | Kilo verme, metabolik sağlık |
| **Paleo** | %20–30 | %25–35 | %35–45 | Anti-inflamatuvar |
| **Mediterranean** | %40–45 | %15–20 | %35–40 | Kalp sağlığı |
| **Plant-Based** | %50–60 | %10–15 | %25–30 | Vegan / vejetaryen |
| **Athletic** | %50–60 | %20–25 | %20–25 | Performans |
| **Cutting** | %30–40 | %35–40 | %25–30 | Yağ yakımı |

---

## Anti-Patterns

```
❌ Sadece kalori sayma — besin değerini görmezden gelme
   → Kalori + makro + mikro birlikte takip et

❌ "Sıfır kalorili" ürünlere güvenme
   → Tatlandırıcıların uzun vadeli etkisi tartışmalı

❌ Aşırı düşük yağ alımı
   → Hormon üretimi ve vitamin absorpsiyonu için yağ şart

❌ Gece geç saatte yemek = kilo alma diye yanlış inanç
   → Toplam kalori önemli, saat değil (ancak gece aşırısı sorun)

❌ Lif hesaba katmama — sadece makro
   → Lif = tokluk, sindirim sağlığı, kan şekeri kontrolü

❌ Su tüketimini unutma
   → Günde minimum 2–3 litre hedefle

✅ Protein = en önemli makro (her öğünde 20–40g hedefle)
✅ Lif = günde minimum 25–38g hedefle
✅ İşlenmiş gıdadan kaçın (listedeki bileşen sayısına bak)
✅ Porsiyon kontrolü = en etkili kilo kontrol yöntemi
```

---

## Quick Reference

| Parametre | Hedef (Yetişkin) | Kaynak |
|---|---|---|
| **Kalori** | 2000–2500 (kadın/erkek ort.) | TDEE hesapla |
| **Protein** | 0.8–2.2 g/kg vücut ağırlığı | Aktiviteye göre |
| **Karbonhidrat** | 225–325 g/gün | Dengeli diyet |
| **Yağ** | 44–78 g/gün | Toplam kalorinin %20–35 |
| **Lif** | 25–38 g/gün | Çoğu yetişkinin altında |
| **Su** | 2–3 litre/gün | Aktivite + iklim |
| **Sodyum** | < 2300 mg/gün | İdeal: < 1500 mg |
| **Protein (min)** | 50 g/gün | Erkekler için 56 g |
| **Breakfast protein** | 20–30 g | Kas protein sentezi |
| **Post-workout carb** | 0.5–0.7 g/kg | Glikojen yenilenmesi |
