---
name: recipe-generator
description: Yemek tarifi oluşturma, malzeme listesi çıkarma, besin değerleri hesaplama, diyet kısıtlamalarını yönetme ve öğün planlaması yapma becerisi.
triggers:
  - "Tarif ver"
  - "Nasıl pişirilir"
  - "Menü planla"
  - "X malzemesiyle ne yapabilirim"
  - "Kalori hesapla"
  - "Vegan/vejetaryen tarif"
auto_load_when:
  - Yemek, pişirme, tarif, malzeme kelimeleri
  - Diyet, beslenme, kalori, vegan, glütensiz
  - Öğün, kahvaltı, öğle, akşam yemeği
agent: docs-agent
tools:
  - unit-converter
  - nutrition-calculator
  - shopping-list-generator
---

# Recipe Generator — Yemek Tarif Uzmanı

Tarif oluşturma skill'i, kullanıcılara lezzetli, besleyici ve bütçe-dostu yemekler tasarlamada rehberlik eder. Diyet kısıtlamalarını ve besin değerlerini göz önünde bulundurur.

## Temel Pattern: Tarif Oluşturma Süreci

### 1. Gereksinim Analizi

```
TARİF İSTEĞİ
├── Mutfak Türü:
│   ├── Türk, İtalyan, Japon, Meksika, Hint...
│   ├── Füzyon veya hibrit tercih
│   └── Yerel/otantik tercih
│
├── Besin Kısıtlamaları:
│   ├── Vejetaryen / Vegan
│   ├── Glütensiz / Laktozsuz
│   ├── Düşük sodyum / şeker
│   ├── Keto / Paleo / Dukan
│   └── Alerjenler (fıstık, deniz ürünü, vs.)
│
├── Bütçe & Süre:
│   ├── Bütçe aralığı (kişi başı)
│   ├── Hazırlık süresi (prep time)
│   ├── Pişirme süresi (cook time)
│   └── Toplam süre limiti
│
└── Beceri Seviyesi:
    ├── Başlangıç (basit, az adım)
    ├── Orta (teknik gerektiren)
    └── İleri (profesyonel teknikler)
```

### 2. Malzeme Organizasyonu

```
MALZEME LİSTESİ (4 kişilik)
├── Ana Malzemeler (protein/karbonhidrat)
│   ├── [Malzeme 1] — [Miktar] — [Not]
│   └── [Malzeme 2] — [Miktar] — [Not]
│
├── Sebzeler / Garnitür
│   ├── [Sebze 1] — [Miktar]
│   └── [Sebze 2] — [Miktar]
│
├── Soslar / Baharatlar
│   ├── [Sos 1] — [Miktar]
│   ├── [Baharat karışımı] — [Ölçü]
│   └── Tuz, karabiber — [Damak tadına göre]
│
└── Özel Malzemeler (varsa)
    ├── [Jelatinsiz yaprağı / özel sos / vs.]
    └── [Alternatif önerisi]
```

### 3. Pişirme Adımları (SFE Formatı)

```
PİŞİRME PROSEDÜRÜ
├── AŞAMA 1: Hazırlık (Prep)
│   ├── [Malzeme] hazırlanır → [boyut/şekil]
│   ├── [Malzeme] doğranır → [ebat]
│   └── Tüm malzemeler tartılır/ölçülür
│
├── AŞAMA 2: Ana Pişirme
│   ├── [Isı kaynağı] [derece] dereceye getirilir
│   ├── [Tavaya malzeme] eklenir → [süre]
│   ├── [Çevirme/döndürme] — [nasıl]
│   └── [Sos ekleme] — [ne zaman]
│
├── AŞAMA 3: Montaj
│   ├── [Tabağa dizme] — [sıralama]
│   ├── [Sos gezdirme] — [miktar]
│   └── [Garnitür ekleme] — [süslü bitkiler]
│
└── SERVİS
    ├── [Sıcak/soğuk] servis edilir
    ├── [Yanında sunulur] — [neden]
    └── [Saklama önerisi]
```

### 4. Besin Değerleri Hesaplama

```
BESİN DEĞERİ ANALİZİ (1 porsiyon için)
├── Makro Besinler
│   ├── Kalori: [X] kcal
│   ├── Protein: [X]g
│   ├── Karbonhidrat: [X]g
│   │   ├── Şeker: [X]g
│   │   └── Lif: [X]g
│   ├── Yağ: [X]g
│   │   ├── Doymuş: [X]g
│   │   └── Trans: [X]g (varsa)
│   └── Kolesterol: [X]mg
│
├── Mikro Besinler (Öne Çıkanlar)
│   ├── A Vitamini: [%DV]
│   ├── C Vitamini: [%DV]
│   ├── Demir: [%DV]
│   ├── Kalsiyum: [%DV]
│   └── Lif: [%DV]
│
└── Diyet Etiketi
    ├── ✅ Düşük sodyum
    ├── ✅ Yüksek protein
    ├── ⚠️ Orta şeker içeriği
    └── ❌ Glütensiz değil
```

## Key Patterns

### Pattern 1: Ingredient Substitution Engine
- Alerjenlere alternatifler sun
- Bütçe değişimleri öner
- Mevsimsel değişimler

### Pattern 2: Batch Cooking & Meal Prep
- Haftalık yemek planlaması
- Porsiyonlama stratejileri
- Saklama ve tazelik

### Pattern 3: Flavor Profile Matching
- Ekşi, tatlı, acı, tuzlu dengesi
- Umami potansiyeli
- Baharat sıcaklık skalası

### Pattern 4: Portion Scaling
- Kişi sayısına göre ölçekleme
- Yarım/tam porsiyon hesabı
- Artan malzeme kullanımı

## Anti-Patterns

```
❌ Belirsiz ölçüler kullanmak
   // "Biraz tuz, biraz yağ, bir kaşık..."
   → Gram/ml olarak net ölçüler ver

❌ Diyet kısıtlamalarını göz ardı etmek
   // "Glütensiz tarif" derken un kullanmak
   → Tüm malzemeleri kısıtlamaya göre kontrol et

❌ Pişirme sürelerini atlama
   // "Pişirene kadar beklet"
   → Dakika/derece olarak spesifik süre ver

❌cross-contamination dikkat etmemek
   // "Vegan" diye hayvansal ürün eklemek
   → Her adımda diet uyumluluğunu doğrula

❌ Besin değerlerini yanlış hesaplamak
   // Tüm yağı hesaba katmamak
   → Her malzemenin tam miktarını hesapla

✅ Malzeme listesi başında, tarif sonunda tekrar et
✅ Her adımda "neden" açıkla (teknik)
✅ Görsel ipuçları ver (renk, kıvam)
✅ Yanlışlıkla yapılabilecek hataları uyar
```

## Quick Reference

| Parametre | Değer | Not |
|---|---|---|
| **Ölçü Sistemi** | Metrik (g, ml) + Amerikan (cup, tbsp) | Her ikisini de ver |
| **Porsiyon Standart** | 1 kişi = 200-300g yemek | Kişi başı hesapla |
| **Pişirme Sıcaklığı** | Fırın: 180-200°C, Tava: ortalama | Tarif'e göre |
| **Dinlendirme Süresi** | Et: 5-10dk, Hamur: 15-30dk | Türüne göre |
| **Saklama Süresi** | Buzdolabı: 3-4 gün, Dondurucu: 3 ay | Gıda türüne göre |
| **Protein İhtiyacı** | Günlük 0.8-1.5g/kg | Aktiviteye göre |
| **Karbonhidrat** | Günlük 225-325g | Diyet tipine göre |
| **Yağ İhtiyacı** | Günlük 44-78g (2000kcal diet) | Dengeli dağılım |
| **Baharat Oranı** | Başlangıç: 1/2, Ayarla: Damak tadına | Her seferinde tad |
| **Tuz** | Maksimum 5g/gün | Düşük sodyum hedefle |

---

*Recipe Generator v1.0 — Afiyet olsun!*
