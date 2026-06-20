---
name: lesson-planner
description: "Ders planı oluşturma, Bloom taksonomisi, öğrenme çıktıları ve değerlendirme yöntemleri."
triggers:
  keywords: ["lesson plan", "ders planı", "bloom taksonomisi", "öğrenme çıktıları", "learning objectives", "değerlendirme"]
auto_load_when: "User requests a lesson plan, learning objectives, or instructional design for K-12 or higher education"
agent: content-ops
tools: ["Read", "Write", "Bash"]
---

# Lesson Planner — Ders Planı ve Öğretim Tasarımı

**Focus:** K-12 ve yükseköğretim için standartlara uygun ders planları, Bloom taksonomisi ile öğrenme çıktıları, öğretim stratejileri ve çoklu değerlendirme yöntemleri.

## 1. Bloom Taksonomisi (Revised)

```
A. Bilişsel Alan Taksonomisi

   6. CREATE      → Yeni ürün tasarlama, özgün çözüm üretme
   5. EVALUATE    → Argüman değerlendirme, kanıt kullanımı
   4. ANALYZE     → Parçalara ayırma, ilişki kurma, karşılaştırma
   3. APPLY       → Problem çözme, kural uygulama, prosedür
   2. UNDERSTAND  → Açıklama, sınıflandırma, özetleme
   1. REMEMBER    → Tanıma, hatırlama, listeleme
```

```
B. Her Seviye İçin Eylem Fiilleri

   CREATE  → tasarla, formüle, üret, inşa et, yarat, geliştir
   EVALUATE → değerlendir, yargıla, karar ver, eleştir, savun
   ANALYZE  → analiz et, karşılaştır, ayrıştır, incele, araştır
   APPLY    → uygula, çöz, kullan, gerçekleştir, göster
   UNDERSTAND → açıkla, özetle, yorumla, sınıfla, dönüştür
   REMEMBER → tanı, hatırla, listele, tanımla, bilgi ver
```

## 2. Öğrenme Çıktıları (Learning Outcomes)

```
A. Öğrenme Çıktısı Formülü
   [Özne] + [Fiil (Bloom)] + [Nesne] + [Bağlam]

   ✓ Öğrenci, fotosentezin süreç adımlarını doğru sıralayabilecek.
   ✓ Öğrenci, iki değişkenli denklemleri çözmek için etkin strateji seçebilecek.
   ✗ Öğrenci fotosentez konusunu bilecek. (Belirsiz fiil)
   ✗ Öğrenci öğrenecek. (Nesne yok)
```

```
B. Öğrenme Çıktısı Kategorileri
   ├─ Bilissel (Cognitive)      → Düşünme becerileri
   ├─ Duygusal (Affective)       → Tutum, değer, ilgi
   └─ Psikomotor (Psychomotor)  → Fiziksel beceriler
```

## 3. Ders Planı Yapısı (Standard Template)

```
┌─────────────────────────────────────────────────────────┐
│ DERS PLANI TEMPLATE                                     │
├─────────────────────────────────────────────────────────┤
│ Ders Adı: ...                        Tarih: ...         │
│ Sınıf/Düzey: ...                     Süre: ... dk       │
│ Önceki Bilgi: ...                    Materyaller: ...   │
├─────────────────────────────────────────────────────────┤
│ A. ÖĞRENME ÇIKTILARI                                     │
│    1. ... (Bloom: ...)                                  │
│    2. ... (Bloom: ...)                                  │
├─────────────────────────────────────────────────────────┤
│ B. DERS AKIŞI                                          │
│    ├─ Giriş (5 dk)                                      │
│    │  ├─ Dikkat çekme: ...                              │
│    │  └─ Motivasyon: ...                                 │
│    ├─ Geliştirme (30 dk)                                │
│    │  ├─ Etkinlik 1: ... (5 dk)                         │
│    │  ├─ Etkinlik 2: ... (10 dk)                        │
│    │  └─ Etkinlik 3: ... (15 dk)                        │
│    └─ Kapanış (5 dk)                                    │
│       └─ Sentez sorusu: ...                             │
├─────────────────────────────────────────────────────────┤
│ C. DEĞERLENDİRME                                        │
│    ├─ Biçimlendirici: ...                               │
│    ├─ Düzey belirleyici: ...                            │
│    └─ Özetleyici: ...                                   │
├─────────────────────────────────────────────────────────┤
│ D. FARKLILAŞTIRMA                                       │
│    ├─ Düşük başlayan: ...                               │
│    ├─ Orta düzey: ...                                   │
│    └─ İleri düzey: ...                                 │
└─────────────────────────────────────────────────────────┘
```

## 4. Öğretim Stratejileri

```
A. Aktif Öğrenme Teknikleri
   ├─ Think-Pair-Share     → Bireysel düşün → Eşleş → Paylaş
   ├─ Jigsaw              → Uzman gruplar → Öğretme grupları
   ├─ Problem-Based Learning → Gerçek problem → Çözüm araştırma
   ├─ Case Study          → Vaka analizi → Tartışma
   ├─ Debates             → Argüman geliştirme → Savunma
   └─ Inquiry-Based       → Soru ile yönlendirme → Keşif
```

```
B. Materyal Seçimi
   ├─ Görsel → Infografik, video, şema
   ├─ İşitsel → Podcast, müzik, ses kaydı
   ├─ Kinestetik → Simülasyon, maket, rol yapma
   └─ Dijital → Simülasyon, etkileşimli tahta, VR
```

## 5. Değerlendirme Yöntemleri

```
A. Biçimlendirici Değerlendirme (Formative)
   ├─ Kavramsal sorular → Anında geri bildirim
   ├─ Miniquiz → 3-5 soru, hızlı kontrol
   ├─ Exit ticket → Dersten çıkış bileti
   ├─ Gözlem → Öğrenci performans izleme
   └─ Öz değerlendirme → Yansıtıcı günlük
```

```
B. Düzey Belirleyici (Summative)
   ├─ Performans görevi → Gerçek yaşam uygulaması
   ├─ Proje → Uzun süreli, süreç odaklı
   ├─ Sınav → Klasik/soru bankası
   └─ Portfolyo → Derlem toplama
```

## Key Patterns

| Taksonomi Düzeyi | Örnek Fiil | Değerlendirme Türü |
|------------------|------------|---------------------|
| Remember | listele, tanımla | Kısa sınav, eşleştirme |
| Understand | özetle, açıkla | Açık uçlu soru |
| Apply | uygula, çöz | Problem seti |
| Analyze | ayrıştır, karşılaştır | Vaka analizi |
| Evaluate | değerlendir, yargıla | Essay, münazara |
| Create | tasarla, üret | Proje, tasarım |

## Anti-Patterns

```
❌ Belirsiz fiiller kullanmak: "öğrenecek", "bilecek", "hissedecek"
   → Bunlar Bloom'da tanımlanmamış; somut fiiller kullan

❌ Tek düzeyli öğrenme çıktıları
   → Her derste en az 2 farklı Bloom düzeyi hedefle

❌ Sadece bilgi aktarımına dayalı ders akışı
   → Pasif dinleme < %20 olmalı; aktif strateji > %60

❌ Değerlendirme olmadan dersi bitirmek
   → Her dersin sonunda biçimlendirici değerlendirme zorunlu

❌ Farklılaştırmayı atlamak
   → Aynı içerik farklı süreç ve çıktılarla sunulmalı
```

## Quick Reference

| Bölüm | İçerik | Süre (45 dk ders) |
|-------|--------|---------------------|
| Giriş | Dikkat çekme, motivasyon, hedef | 5-7 dk |
| Geliştirme | Ana etkinlikler, modelleme | 30-33 dk |
| Kapanış | Sentez, geri bildirim | 5-7 dk |
| Değerlendirme | Biçimlendirici kontrol | 5 dk |

| Bloom Düzeyi | Alt Düzey | Üst Düzey |
|--------------|-----------|-----------|
| Remember | alt düzey | üst düzey |
| Understand | alt düzey | - |
| Apply | - | üst düzey |
| Analyze | - | üst düzey |
| Evaluate | - | üst düzey |
| Create | - | üst düzey |

| Değerlendirme | Zamanlama | Amaç |
|----------------|-----------|------|
| Biçimlendirici | Ders içi | Anlık düzeltme |
| Düzey belirleyici | Ders sonu | Kalıcı not |
| Tanılayıcı | Ders öncesi | Ön bilgi tespiti |
| Öz değerlendirme | Ders içi | Öz farkındalık |
