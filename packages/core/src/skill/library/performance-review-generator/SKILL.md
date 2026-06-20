---
name: performance-review-generator
description: "Performans değerlendirme yazımı, SMART hedefleri, 360 feedback, yetkinlik matrisleri ve gelişim planı oluşturma"
triggers:
  keywords: ["performance review generator", "performans değerlendirme", "smart hedefleri", "360 feedback", "yetkinlik matrisi"]
auto_load_when: "Kullanıcı performans değerlendirmesi, hedef belirleme veya 360 feedback raporu ister"
agent: content-ops
tools: ["Read", "Write", "grep", "glob"]
---

# Performance Review Generator (Performans Değerlendirme Oluşturucu)

**Odak Alanı:** Performans değerlendirme yazımı, SMART hedefleri, 360 feedback, yetkinlik matrisleri ve gelişim planı üretme

## 1. Pattern: Performans Değerlendirme Yapısı

```
performans_değerlendirme
├── dönem_bilgileri
│   ├── Değerlendirme dönemi
│   ├── Çalışan bilgileri
│   ├── Pozisyon ve departman
│   ├── Reviewer bilgileri
│   └── Değerlendirme tarihi
├── genel_değerlendirme
│   ├── Overall rating (1-5)
│   ├── Özet değerlendirme
│   ├── Güçlü yönler
│   └── Gelişim alanları
├── hedef_değerlendirmesi
│   ├── Önceki dönem hedefleri
│   ├── Tamamlanma oranı
│   ├── Ölçülebilir sonuçlar
│   └── Başarı yorumu
├── yetkinlik_değerlendirmesi
│   ├── Teknik yetkinlikler
│   ├── Liderlik yetkinlikleri
│   ├── İletişim yetkinlikleri
│   └── Problem çözme
├── gelişim_önerileri
│   ├── Kısa vadeli (0-3 ay)
│   ├── Orta vadeli (3-6 ay)
│   └── Uzun vadeli (6-12 ay)
└── Sonraki Dönem Hedefleri
    ├── SMART hedefleri (3-5 adet)
    ├── KPI tanımları
    └── Gelişim alanları
```

## 2. Pattern: SMART Hedef Tanımlama

```
smart_hedefleri
├── specific (Spesifik)
│   ├── Ne yapılacak? (Ne)
│   ├── Kim yapacak? (Kim)
│   ├── Neden önemli? (Neden)
│   └── Hedef kitle kim? (Kime)
├── measurable (Ölçülebilir)
│   ├── Metrik ne?
│   ├── Hedefe nasıl ulaşılır?
│   ├── Başarı kriteri ne?
│   └── Veri kaynağı nerede?
├── achievable (Ulaşılabilir)
│   ├── Kaynaklar yeterli mi?
│   ├── Zaman uygun mu?
│   ├── Engeller neler?
│   └── Realistic mi?
├── relevant (İlgili)
│   - Şirket hedefleriyle uyumlu mu?
│   - Departman hedeflerine katkı var mı?
│   - Çalışan kariyerine uygun mu?
│   - Stratejik öncelik ne?
└── time-bound (Zamana Bağlı)
    ├── Başlangıç tarihi
    ├── Ara milestone'lar
    ├── Bitiş tarihi
    └── Deadline net mi?
```

## 3. Pattern: 360 Feedback Yapısı

```
360_feedback
├── self_değerlendirme
│   ├── Kendini değerlendirme
│   ├── Güçlü yönler
│   ├── Gelişim alanları
│   └── Hedefler
├── yönetici_değerlendirmesi
│   ├── Performans genel değerlendirmesi
│   ├── Yetkinlik değerlendirmesi
│   ├── Liderlik değerlendirmesi
│   └── Öneriler
├── akran_değerlendirmesi
│   ├── İşbirliği kalitesi
│   ├── İletişim
│   ├── Takım çalışması
│   ├── Katkı ve destek
├── ast_değerlendirmesi (varsa)
│   ├── Liderlik stili
│   ├── Geri bildirim kalitesi
│   ├── Yönlendirme
│   ├── Erişilebilirlik
└── tüm_360_birleştirme
    ├── Consensus alanları
    ├── Farklı Alanlar
    ├── Trend analizi
    └── Gelişim öncelikleri
```

## 4. Pattern: Yetkinlik Matrisi

```
yetkinlik_matrisi
├── yetkinlik_kategorileri
│   ├── Teknik Yetkinlikler
│   │   ├── Role özgü bilgi
│   │   ├── Araç kullanımı
│   │   └── Süreç bilgisi
│   ├── Liderlik Yetkinlikleri
│   │   ├── Ekip yönetimi
│   │   ├── Karar verme
│   │   └── Stratejik düşünce
│   ├── İletişim Yetkinlikleri
│   │   ├── Yazılı iletişim
│   │   ├── Sözlü iletişim
│   │   └── Sunum becerileri
│   └── Kişisel Yetkinlikler
│       ├── Problem çözme
│       ├── Adaptasyon
│       └── Öz-motivasyon
├── seviye_tanımları
│   ├── Level 1 - Beginner
│   ├── Level 2 - Intermediate
│   ├── Level 3 - Advanced
│   ├── Level 4 - Expert
│   └── Level 5 - Master
└── değerlendirme_kriterleri
    ├── Her yetkinlik için davranış örnekleri
    ├── Somut kanıtlar
    ├── Rating guidelines
    └── Calibration kuralları
```

## 5. Pattern: Gelişim Planı Oluşturma

```
gelişim_planı
├── gap_analizi
│   ├── Mevcut durum (Current state)
│   ├── Hedef durum (Target state)
│   ├── Gap tanımlama
│   └── Prioritization
├── eylem_planı
│   ├── Formal eğitimler
│   │   ├── Kurs/Sertifika
│   │   ├── Workshop
│   │   └── Konferans
│   ├── Informal learning
│   │   ├── Mentoring
│   │   ├── Job shadowing
│   │   └── Internal rotation
│   ├── Uygulama
│       ├── Real project
│       ├── Stretch assignment
│       └── Special project
└── takip_mekanizması
    ├── Monthly check-in
    ├── Mid-point review
    ├── End of year review
    └── Success metrics
```

---

## Quick Reference

| Rating | Tanım | Yüzde |
|--------|------|-------|
| 5 - Exceptional | Sürekli beklentileri aşar | %10 |
| 4 - Exceeds | Beklentileri sürekli karşılar | %20 |
| 3 - Meets | Beklentileri karşılar | %50 |
| 2 - Needs Improvement | Bazı alanlarda gelişim gerekli | %15 |
| 1 - Unsatisfactory | Beklentileri karşılamıyor | %5 |

| SMART Eleman | Soru | Örnek |
|-------------|------|-------|
| Specific | Ne? | "CRM raporlaması oluştur" |
| Measurable | Ne kadar? | "%20 artış" |
| Achievable | Mümkün mü? | Evet, kaynak var |
| Relevant | Neden önemli? | Müşteri memnuniyeti |
| Time-bound | Ne zaman? | Q2'ye kadar |

| Yetkinlik | Level 1 | Level 3 | Level 5 |
|----------|---------|---------|---------|---------|
| Problem solving | Sorun bildirir | Analiz eder | Sistem yapar |
| Communication | Bilgi paylaşır | Etkili sunar | İkna eder |
| Leadership | Talimat alır | Ekip yönetir | Strategi belirler |
