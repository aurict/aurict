---
name: syllabus-designer
description: "Ders müfredatı tasarımı, haftalık plan, okuma listesi ve assessment takvimi."
triggers:
  keywords: ["syllabus", "müfredat", "ders programı", "course design", "weekly plan", "okuma listesi", "assessment"]
auto_load_when: "User asks to design a course syllabus, create a weekly schedule, or build an assessment calendar"
agent: content-ops
tools: ["Read", "Write", "Bash"]
---

# Syllabus Designer — Müfredat ve Ders Programı Tasarımı

**Focus:** Yükseköğretim ve K-12 için standartlara uygun ders müfredatı, haftalık içerik planı, okuma listesi, assessment takvimi ve öğrenme çıktıları matrisinin oluşturulması.

## 1. Müfredat Tasarım Çerçevesi (Backward Design)

```
A. Üç Aşamalı Tasarım Modeli (Wiggins & McTighe)
   ├─ Stage 1: Desired Results
   │  ├─ Öğrenme çıktıları (Course-level outcomes)
   │  └─ Essential questions (Ana sorular)
   │
   ├─ Stage 2: Evidence
   │  ├─ Performance tasks (Performans görevleri)
   │  └─ Assessment criteria (Değerlendirme kriterleri)
   │
   └─ Stage 3: Learning Plan
      ├─ Haftalık içerik ve etkinlikler
      ├─ Okuma ve kaynaklar
      └─ Öğretim stratejileri
```

```
B. Öğrenme Çıktıları Hiyerarşisi
   Course Outcomes (Genel) → Module Outcomes (Modül) → Weekly Objectives (Haftalık)
   ├─ 3-5 genel çıktı      ├─ 2-3 modül çıktısı    ├─ 1-2 haftalık hedef
   └─ Program çıktılarına  └─ Course outcome'lar     └─ Modül çıktılarına
      hizalanır                altında               bağlı
```

## 2. Standart Müfredat Template'i

```
┌─────────────────────────────────────────────────────────────────────┐
│ KURS BİLGİLERİ                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Ders Kodu: ...            Dönem: ...                                │
│ Ders Adı: ...             Kredi: ...                               │
│ Toplam Süre: ... saat     Ön koşul: ...                            │
│ E-posta: ...              Web: ...                                 │
├─────────────────────────────────────────────────────────────────────┤
│ ÖĞRETİM ÜYESİ İLETİŞİM                                             │
│ İsim: ...              Ofis: ...   Saat: ...                       │
│ E-posta: ...            Telefon: ...                                │
├─────────────────────────────────────────────────────────────────────┤
│ DERS AÇIKLAMASI                                                       │
│ [2-3 paragraf: dersin amacı, kapsamı, neden önemli]                 │
├─────────────────────────────────────────────────────────────────────┤
│ ÖĞRENME ÇIKTILARI (Course-Level Outcomes - CLOs)                     │
│   CLO1: ...                                                          │
│   CLO2: ...                                                          │
│   CLO3: ...                                                          │
├─────────────────────────────────────────────────────────────────────┤
│ ÖN KOŞUL BİLGİLERİ                                                   │
│ Öğrencinin bu dersi almadan önce bilmesi gereken konular             │
├─────────────────────────────────────────────────────────────────────┤
│ DEĞERLENDİRME POLİTİKASI                                             │
│   ├─ Katılım/Attendance:    %...                                    │
│   ├─ Ara sınav (Midterm):  %...                                    │
│   ├─ Final:                %...                                    │
│   ├─ Proje/Ödev:           %...                                    │
│   └─ Laboratuvar/Pratik:   %...                                    │
├─────────────────────────────────────────────────────────────────────┤
│ OKUMA LİSTESİ                                                        │
│   ├─ Ana kaynak: [Ders kitabı]                                       │
│   └─ Yardımcı kaynaklar: [Haftalık listesi aşağıda]                  │
├─────────────────────────────────────────────────────────────────────┤
│ POLİTİKALAR                                                           │
│   ├─ Geçerlilik sınırı: ...                                          │
│   ├─ Akademik dürüstlük: ...                                        │
│   ├─ İletişim beklentileri: ...                                     │
│   └─ Erişilebilirlik: ...                                            │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Haftalık Plan Yapısı

```
┌─────────────────────────────────────────────────────────────────────┐
│ HAFTA [N] — [BAŞLIK]                                              │
│ Tarih Aralığı: [GG/AA/YYYY - GG/AA/YYYY]                          │
├─────────────────────────────────────────────────────────────────────┤
│ HAFTALIK HEDEFLER                                                   │
│   □ [Hedef 1] (CLO ile ilişki)                                     │
│   □ [Hedef 2] (CLO ile ilişki)                                     │
├─────────────────────────────────────────────────────────────────────┤
│ İÇERİK                                                            │
│   Konu başlıkları:                                                  │
│     • [Konu 1]                                                     │
│     • [Konu 2]                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ OKUMA (ÖNCEKİ HAFTA HAZIRLIK)                                      │
│   Required:                                                        │
│     • [Sayfa aralığı veya URL]                                      │
│   Recommended:                                                      │
│     • [Ek kaynak]                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ ETKİNLİKLER                                                         │
│   ├─ Ders içi: [Sunum, tartışma, laboratuvar]                       │
│   ├─ Ders dışı: [Ödev, group project]                              │
│   └─ Online: [Forum tartışması, video]                             │
├─────────────────────────────────────────────────────────────────────┤
│ DEĞERLENDİRME                                                       │
│   □ Quiz (Tarih: ...) → Konular: ...                               │
│   □ Ödev (Son tarih: ...)                                          │
└─────────────────────────────────────────────────────────────────────┘
```

## 4. Assessment Takvimi ve Ölçüm Matrisi

```
A. CLO-Assessment Matrisi (Öğrenme Çıktısı-Ölçüm Eşleştirmesi)
   ┌────────────────────────────────────────────────────────────────┐
   │           │ CLO1 │ CLO2 │ CLO3 │ CLO4 │ CLO5 │               │
   │           │      │      │      │      │      │               │
   ├───────────┼──────┼──────┼──────┼──────┼──────┼───────────────┤
   │ Quiz 1    │  ●  │  ○  │  ○  │  ○  │  ○  │               │
   │ Quiz 2    │  ○  │  ●  │  ●  │  ○  │  ○  │               │
   │ Midterm   │  ●  │  ●  │  ○  │  ●  │  ○  │               │
   │ Project   │  ○  │  ○  │  ●  │  ●  │  ●  │               │
   │ Final     │  ●  │  ●  │  ●  │  ●  │  ●  │               │
   └───────────┴──────┴──────┴──────┴──────┴──────┴───────────────┘
   ● = Doğrudan ölçüm   ○ = Dolaylı ölçüm
```

```
B. Değerlendirme Türleri Dağılımı
   ├─ Tanılayıcı (Diagnostic) → Ders öncesi ön bilgi tespiti
   ├─ Biçimlendirici (Formative) → Ders içi, gelişim odaklı
   ├─ Düzey belirleyici (Summative) → Ders sonu, not odaklı
   └─ Authentic → Gerçek yaşam uygulaması
```

## 5. Okuma Listesi Organizasyonu

```
A. Zorunlu (Required) Kaynaklar
   ├─ Ana ders kitabı (her haftaya atanmış bölümler)
   ├─ Orijinal makaleler (seminal works)
   └─ Sektörel raporlar veya standartlar
```

```
B. Önerilen (Recommended) Kaynaklar
   ├─ Alternatif ders kitapları
   ├─ Podcast ve video serileri
   ├─ Blog yazıları ve uygulama örnekleri
   └─ Open Educational Resources (OER)
```

```
C. Haftalık Okuma Atama Formatı
   Week 3: [Konu Başlığı]
   Required:
     • Smith, J. (2023). Chapter 4: [Başlık]. In *Book Title*. Publisher.
     • Johnson, A. (2022). Article title. *Journal*, 12(3), 45-67.
   Recommended:
     • Khan Academy Video: [URL]
     • Case Study: [URL]
   Reflection Prompt:
     • [Öğrencinin okumadan önce düşünmesi gereken soru]
```

## Key Patterns

| Öğrenme Çıktısı | Bloom Seviyesi | Assessment Türü | Ağırlık |
|-----------------|---------------|-----------------|---------|
| Bilgi ve anlama | Remember, Understand | Quiz, kısa sınav | %15 |
| Uygulama | Apply | Problem set, lab | %25 |
| Analiz | Analyze | Vaka analizi, rapor | %20 |
| Sentez/Değerlendirme | Create, Evaluate | Proje, final | %30 |
| Profesyonel beceri | Various | Sunum, katılım | %10 |

## Anti-Patterns

```
❌ Her haftaya eşit ağırlık vermek
   → Temel konular daha fazla değerlendirme ağırlığı almalı

❌ Okuma listesi vermeden ders anlatmak
   → Öğrenci hazırlıksız gelir; önceki hafta ataması şart

❌ Sadece final ile değerlendirmek
   → CLO'lar yetersiz ölçülür; ara sınav + proje + quiz kombinasyonu

❌ CLO'ları tanımlamadan haftalık plan yazmak
   → Her hafta bir CLO'ya bağlı olmalı; backwards design şart

❌ Assessment takvimini dönem başında açıklamamak
   → Öğrenci planlamasını yapamaz; ilk hafta tüm tarihler paylaşılmalı
```

## Quick Reference

| Müfredat Bölümü | İçerik | Uzunluk |
|-----------------|--------|----------|
| Ders Açıklaması | Amaç, kapsam, önem | 2-3 paragraf |
| Öğrenme Çıktıları | 3-5 CLO | Numaralı liste |
| Değerlendirme | Tür, ağırlık, tarih | Tablo formatı |
| Okuma Listesi | Haftalık atama | Referans formatı |
| Politikalar | Kurallar, beklentiler | Maddeli liste |

| Değerlendirme | Türü | CLO Ölçümü | Ağırlık |
|---------------|------|-----------|---------|
| Quiz x3 | Biçimlendirici | Çoklu | %15 |
| Ara Sınav | Düzey belirleyici | 1-2 CLO | %20 |
| Proje | Authentic | 2-3 CLO | %25 |
| Final | Düzey belirleyici | Tüm CLO | %30 |
| Katılım | Biçimlendirici | Genel | %10 |

| Haftalık Plan | Bölüm | Süre (Toplam 50 dk) |
|--------------|-------|---------------------|
| İçerik sunumu | Lecture | 20 dk |
| Tartışma/etkinlik | Active | 20 dk |
| Kapanış/sentez | Wrap | 10 dk |
