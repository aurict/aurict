---
name: training-module-creator
description: "Eğitim dokümanı oluşturma, öğrenme hedefleri, MOD modeli, test hazırlama ve öğrenme yönetimi"
triggers:
  keywords: ["training module creator", "eğitim modülü", "öğrenme hedefleri", "MOD model", "test hazırlama"]
auto_load_when: "Kullanıcı eğitim dokümanı, öğrenme modülü veya test sorusu ister"
agent: content-ops
tools: ["Read", "Write", "grep", "glob"]
---

# Training Module Creator (Eğitim Modülü Oluşturucu)

**Odak Alanı:** Eğitim dokümanı oluşturma, öğrenme hedefleri, MOD modeli, test hazırlama ve öğrenme yönetimi

## 1. Pattern: Öğrenme Hedefleri Tanımlama

```
öğrenme_hedefleri
├── bloom_taksonomisi
│   ├── Remember (Hatırlama)
│   │   ├── Listele, tanımla, tekrarla
│   │   └── "Bu sonra..."
│   ├── Understand (Anlama)
│   │   ├── Açıkla, özetle, yorumla
│   │   └── "Bunu şöyle açıklar..."
│   ├── Apply (Uygulama)
│   │   ├── Çalıştır, uygula, çözümle
│   │   └── "Bunu kullanarak..."
│   ├── Analyze (Analiz)
│   │   ├── Karşılaştır, analiz et, ayrıştır
│   │   └── "Bunu şunlarla karşılaştır..."
│   ├── Evaluate (Değerlendirme)
│   │   ├── Değerlendir, karar ver, seçim yap
│   │   └── "Bu karşılaştırmada..."
│   └── Create (Yaratma)
│       ├── Tasarla, geliştir, oluştur
│       └── "Bu yeni sistemde..."
├── hedef_yazım_kuralları
│   ├── Ölçülebilir olmalı
│   ├── Zamanında tamamlanmalı
│   ├── Ulaşılabilir olmalı
│   └── Önkoşul tanımlı
└── örnek_hedefler
    ├── "Katılımcılar 5 adımdan oluşan süreci
    │    bağımsız olarak tamamlayabilir"
    ├── "Katılımcılar x tool kullanarak
    │    y report hazırlayabilir"
    └── "Katılımcılar y hatasını
         3 dakika içinde tespit edebilir"
```

## 2. Pattern: MOD Modeli (Mekansal, Objektif, Dilsel)

```
mod_modeli
├── Mekansal (Spatial) - Nerede?
│   ├── Fiziksel konum
│   │   ├── Online platform
│   │   ├── Ofis/ sınıf
│   │   └── Field/ saha
│   ├── Görsel düzen
│   │   ├── Slide düzeni
│   │   ├── Sayfa düzeni
│   │   └── Gezinme
│   └── Erişilebilirlik
│       ├── Görsel erişilebilirlik
│       └── Mobil uyumluluk
├── Objektif (Objective) - Ne?
│   ├── Öğrenme hedefi
│   ├── Kritik bilgi
│   ├── Kluc noktalar
│   └── Çıktı tanımı
└── Dilsel (Linguistic) - Nasıl?
    ├── Hedef kitle dili
    ├── Terminoloji
    ├── Ton ve üslup
    └── Açıklama düzeyi
```

## 3. Pattern: Eğitim İçerik Yapısı

```
eğitim_içerik
├── modül_yapısı
│   ├── Giriş (Introduction)
│   │   ├── Modül hedefi
│   │   ├── Ön koşullar
│   │   ├── Süre tahmini
│   │   └── Genel bakış
│   ├── Ana İçerik (Core Content)
│   │   ├── Teorik temel
│   │   │   ├── Kavramlar
│   │   │   ├── Prensipler
│   │   │   └── Çerçeve
│   │   ├── Pratik uygulama
│   │   │   ├── Adım adım süreç
│   │   │   ├── Örnek olaylar
│   │   │   └── Alıştırmalar
│   │   ├── Senaryolar
│   │   │   ├── Vaka çalışmaları
│   │   │   ├─��� Simülasyonlar
│   │   │   └── Roll-play
│   ├── Özet (Summary)
│   │   ├── Anahtar noktalar
│   │   ├── Sıkça yapılan hatalar
│   │   └── İleri okuma
│   └── Değerlendirme
│       ├── Bilgi testi
│       ├── Beceri testi
│       └── Uygulama görevi
├── format_seçenekleri
│   ├── Video + slids
│   ├── PDF + alıştırmalar
│   ├── İnteraktif (LMS)
│   └── Workshop formatı
└── erişilebilirlik
    ├── WCAG uyumu
    ├── Alt yazı
    ├── Transkript
    └── Multi-language
```

## 4. Pattern: Test Hazırlama

```
test_hazırlama
├── test_türleri
│   ├── Bilgi testi (Knowledge test)
│   │   ├── Multiple choice
│   │   ├── True/False
│   │   └── Matching
│   ├── Beceri testi (Skill test)
│   │   ├── Simülasyon
│   │   ├── Laboratuvar
│   │   ├── Case completion
│   ├── Tutum testi (Attitude)
│   │   ├── Likert scale
│   │   ├── Ranking
│   └── Uygulama (Application)
│       ├── Proje tabanlı
│       ├── Sunum
│       └── Portfolio
├── soru_yazım_kuralları
│   ├── Clear stem (Net kök)
│   ├── Single best answer
│   ├── Distractor plausibility
│   ├── No clue words
│   └── Appropriate difficulty
├── zorluk_dağılımı
│   ├── Easy (%20)
│   ├── Medium (%60)
│   └── Hard (%20)
├── başarı_kriterleri
│   ├── Minimum geçme notu
│   ├── Pass/Fail
│   ├── Sınıf geçme
│   └── Sertifikasyon
└── test_analizi
    ├── Item analysis
    ├── Discrimination index
    └── Difficulty index
```

## 5. Pattern: Öğrenme Yönetimi

```
öğrenme_yönetimi
├── öncesi (Pre-learning)
│   ├── Ön değerlendirme
│   ├── Beklentileri belirleme
│   └── Ön koşul kontrolü
├── süresi (During)
│   ├── Etkileşim noktaları
│   ├── Soru-cevap oturumları
│   ├── Tartışma yönetimi
│   ├── Not alma
│   └── Pekiştirme
└── sonrası (Post-learning)
    ├── Değerlendirme
    ├── Geri bildirim toplama
    ├── Sertifikasyon
    ├── Uygulama takibi
    └── Follow-up eğitimi
```

---

## Quick Reference

| Bloom Seviyesi | Örnek Fiil | Test Türü |
|---------------|-----------|----------|
| Remember | Listele, tanımla | MCQ, True/False |
| Understand | Açıkla, özetle | Açık uçlu |
| Apply | Uygula, çalıştır | Simulation |
| Analyze | Karşılaştır, analiz et | Case analysis |
| Evaluate | Değerlendir, karar ver | Portfolio |
| Create | Tasarla, geliştir | Proje |

| MOD Bileşeni | Soru |
|--------------|------|
| Mekansal | Nerede sunulacak? |
| Objektif | Ne öğrenecek? |
| Dilsel | Nasıl anlatılacak? |

| Test Türü | Oran | Amaç |
|-----------|------|------|
| Bilgi | %30 | Kavram anlama |
| Beceri | %50 | Uygulama |
| Tutum | %20 | Davranış değişikliği |
