---
name: workout-planner
description: Fitness programı tasarlama, set/rep hesaplama, progressif overload uygulama, dinlenme günlerini planlama ve ilerleme takibi yapma becerisi.
triggers:
  - "Egzersiz programı yap"
  - "Fitness planı"
  - "Kas geliştirme programı"
  - "Kilo verme egzersizleri"
  - "Haftalık antrenman"
auto_load_when:
  - Spor, fitness, gym, antrenman, egzersiz
  - Set, rep, kilo, kas, protein
  - Kardiyo, HIIT, güç antrenmanı
agent: content-ops
tools:
  - bmi-calculator
  - calorie-calculator
  - one-rep-max-calculator
---

# Workout Planner — Fitness Program Uzmanı

Fitness programlama skill'i, kullanıcıların hedeflerine uygun, bilimsel temelli antrenman programları oluşturmasına yardımcı olur. Güvenli ve etkili ilerleme sağlar.

## Temel Pattern: Antrenman Programı Oluşturma

### 1. Hedef ve Değerlendirme

```
HEDEF ANALİZİ
├── Ana Hedef:
│   ├── 💪 Kas Kütlesi Artışı (Hypertrophy)
│   ├── 🔥 Yağ Yakımı (Fat Loss)
│   ├── 💪 Güç Kazanımı (Strength)
│   ├── 🏃 Dayanıklılık (Endurance)
│   └── ⚖️ Genel Fitness (Recomposition)
│
├── Mevcut Durum:
│   ├── Tecrübe seviyesi (Başlangıç/Orta/İleri)
│   ├── Antrenman geçmişi (hafta/ay)
│   ├── Sakatlık geçmişi
│   └── Kronik hastalıklar
│
├── Kısıtlamalar:
│   ├── Ekipman erişimi (ev/salon)
│   ├── Zaman kısıtı (günlük süre)
│   └── Beslenme durumu
│
└── Hedef Zaman Çizelgesi
    ├── Kısa vadeli (4-8 hafta)
    ├── Orta vadeli (3-6 ay)
    └── Uzun vadeli (6+ ay)
```

### 2. Bölgesel Antrenman Dağılımı

```
HAFTALIK PROGRAM (Push/Pull/Legs Split)
├── PAZARTESİ — Push (Göğüs/Omuz/Triceps)
│   ├── Bench Press — 4×8-12
│   ├── Overhead Press — 3×8-10
│   ├── Incline Dumbbell Press — 3×10-12
│   ├── Lateral Raise — 3×12-15
│   └── Tricep Pushdown — 3×12-15
│
├── SALI — Dinlenme veya Hafif Kardiyo
│   └── Aktif toparlanma (yürüyüş, yoga)
│
├── ÇARŞAMBA — Pull (Sırt/Biceps)
│   ├── Deadlift veya Lat Pulldown — 4×6-8
│   ├── Bent Over Row — 3×8-10
│   ├── Face Pull — 3×15
│   ├── Barbell Curl — 3×10-12
│   └── Hammer Curl — 3×12-15
│
├── PERŞEMBE — Legs (Bacak/Core)
│   ├── Squat — 4×6-8
│   ├── Romanian Deadlift — 3×8-10
│   ├── Leg Press — 3×10-12
│   ├── Leg Curl — 3×12-15
│   └── Calf Raise — 4×15-20
│
└── CUMA/CUMARTESİ — Upper/Lower (Alternatif)
    ├── Üst vücut egzersizleri
    └── Alt vücut egzersizleri
```

### 3. Set/Rep Hesaplama Matrisi

```
EGZERSİZ PARAMETRELERİ
├── HİPERTRÖFİ (Kas Büyümesi)
│   ├── Set: 3-4
│   ├── Rep: 8-12
│   ├── Dinlenme: 60-90 saniye
│   ├── Tempo: 2-0-2 (konstrik/eksantrik)
│   └── RIR (Rezerv İndex): 1-3
│
├── GÜÇ (Strength)
│   ├── Set: 4-6
│   ├── Rep: 1-5
│   ├── Dinlenme: 2-5 dakika
│   ├── Tempo: 2-0-2
│   └── RIR: 0-1 (maksimum)
│
├── DAYANIKLILIK (Endurance)
│   ├── Set: 2-3
│   ├── Rep: 12-20
│   ├── Dinlenme: 30-60 saniye
│   ├── Tempo: 2-0-1
│   └── RIR: 4-5
│
└── YAĞ YAKIMI (Fat Loss)
    ├── Set: 3-4
    ├── Rep: 10-15
    ├── Dinlenme: 45-60 saniye
    ├── Tempo: 1-0-1
    └── RIR: 2-3
```

### 4. Progressif Overload Stratejisi

```
İLERLEME PLANI (4 Haftalık Döngü)
├── HAFTA 1-2 (Base)
│   ├── Ağırlık: [Başlangıç]
│   ├── Set/Rep: [Hedef aralık alt sınırı]
│   └── Not: Form kontrolü
│
├── HAFTA 3 (Yükleme)
│   ├── Ağırlık: +%2.5-5
│   ├── Set/Rep: Aynı veya -1 rep
│   └── Not: Yeni ağırlığa adaptasyon
│
├── HAFTA 4 (Deload)
│   ├── Ağırlık: -%40-50
│   ├── Set/Rep: Aynı rep, daha az set
│   └── Not: Toparlanma haftası
│
└── DÖNGÜ SONU
    ├── Değerlendirme: Form, ağırlık, his
    ├── Yeni döngü: +%5-10 ağırlık
    └── Varyasyon: Egzersiz değişimi
```

## Key Patterns

### Pattern 1: Form Prioritization
- Ağırlıktan önce doğru form
- Hareket kalitesi > ağırlık
- Ayna/video ile kontrol

### Pattern 2: Deload Management
- 4-6 haftada bir deload
- Azami yorgunluğu önleme
- Uzun vadeli sürdürülebilirlik

### Pattern 3: Nutrition-Performance Alignment
- Hedefe göre kalori hesabı
- Makro dağılımı (protein öncelikli)
- Timing stratejileri

### Pattern 4: Recovery Integration
- Uyku optimizasyonu (7-9 saat)
- Mobilite çalışmaları
- Aktif dinlenme

## Anti-Patterns

```
❌ Her gün aynı kas grubunu çalışmak
   // "Göğsümü her gün çalışıyorum"
   → Kas büyümesi için 48-72 saat dinlenme gerek

❌ Ağırlığı çok hızlı artırmak
   // "Hepsini 100kg yapayım hemen"
   → Haftada max %2.5-5 artış

❌ Dinlenme günlerini atlamak
   // "Dinlenmeye gerek yok, çalışmaya devam"
   → Overtraining sendromu riski

❌ Esnetme yerine direkt ağırlık
   // "Isınma gereksiz, direkt başlayalım"
   → Sakatlık riski artar

❌ Sadece sevdiğin kas grubunu çalışmak
   // "Sadece göğüs ve biceps"
   → Kas dengesizliği ve duruş bozukluğu

✅ Her kas grubuna haftada 2× egzersiz
✅ Formu öğrenmeden ağırlık ekleme
✅ Haftalık toplam volume'u takip et
✅ Uyku ve beslenmeyi programa dahil et
✅ İlerlemeyi kaydet (günlük tut)
```

## Quick Reference

| Parametre | Değer | Not |
|---|---|---|
| **Dinlenme (Güç)** | 48-72 saat/ kas grubu | Recovery süresi |
| **Dinlenme (Seri içi)** | 60-120 saniye | Hedefe göre |
| **Protein İhtiyacı** | 1.6-2.2g/kg (kas kazanımı) | Kilo başına |
| **Su İhtiyacı** | 30-40ml/kg (egzersizli gün) | Terleme arttıkça |
| **Uyku Süresi** | 7-9 saat | Kas onarımı için |
| **Set Sayısı** | 10-20 (toplam/hafta/kas) | Tecrübeye göre |
| **Rep Aralığı** | 1-20 (hedeften bağımsız) | Yukarıdaki tabloya bak |
| **Warmup** | 5-10 dakika | Dinamik esneme |
| **Ağırlık Artışı** | Haftada %2.5-5 max | Kademeli yükleme |
| **Deload** | 4-6 haftada 1 | Haftada 1 kez uygula |

---

*Workout Planner v1.0 — Güç seninle olsun!*
