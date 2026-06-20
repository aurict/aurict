---
name: culture-fit-assessor
description: "Kültür uyumluluk testi, değerler matrisi, davranışsal soru bankası ve sonuç yorumlama raporu"
triggers:
  keywords: ["culture fit assessor", "kültür uyumu", "değerler matrisi", "davranışsal test", "kültür değerlendirme"]
auto_load_when: "Kullanıcı kültür uyumluluk değerlendirmesi, kültür testi veya kültür matrisi ister"
agent: content-ops
tools: ["Read", "Write", "grep", "glob"]
---

# Culture Fit Assessor (Kültür Uyum Değerlendiricisi)

**Odak Alanı:** Kültür uyumluluk testi, değerler matrisi, davranışsal soru bankası ve sonuç yorumlama raporu

## 1. Pattern: Kültür Uyumluluk Testi

```
kültür_uyum_testi
├── değer_tespiti
│   ├── Şirket değerleri (top-down)
│   │   ├── Innovation
│   │   ├── Customer focus
│   │   ├── Integrity
│   │   ├── Teamwork
│   │   └── Excellence
│   ├── Departman değerleri
│   │   ├── Engineering values
│   │   ├── Sales values
│   │   └── Operations values
│   └── Pozisyon değerleri
│       ├── Role model values
│       └── Team values
├── boyutlar
│   ├── Çalışma stili
│   │   ├── Independent vs collaborative
│   │   ├── Structured vs flexible
│   │   ├── Fast-paced vs deliberate
│   │   └── Remote vs office
│   ├── İletişim stili
│   │   ├── Direct vs diplomatic
│   │   ├── Formal vs casual
│   │   ├── Async vs sync
│   │   └── Written vs verbal
│   ├── Karar stili
│   │   ├── Data-driven vs intuitive
│   │   ├── Consensus vs decisive
│   │   ├── Top-down vs empowered
│   │   └── Risk-taking vs risk-averse
│   └── Büyüme stili
│       ├── Learning orientation
│       ├── Feedback seeking
│       ├── Career ambition
│       └── Adaptability
├── test_formatı
│   ├── Online questionnaire (20-30 soru)
│   ├── Self-assessment
│   ├── Value ranking exercise
│   └── Situasyonel judgment test
└── sonuç
    ├── Overall fit score
    ├── Dimension scores
    ├── Strengths/risks
    └── Öneriler
```

## 2. Pattern: Değerler Matrisi

```
değerler_matrisi
├── şirket_değerleri (Company Values)
│   ├── Innovation (Yenilik)
│   │   ├── "Denemekten korkmuyoruz"
│   │   ├── "Başarısızlık öğrenme fırsatıdır"
│   │   └── "Yeni fikirler değer görülür"
│   ├── Customer Obsession (Müşteri Odaklılık)
│   │   ├── "Müşteri her şeydir"
│   │   ├── "Seslerini dinleriz"
│   │   └── "Çözüm odaklıyız"
│   ├── Integrity (Dürüstlük)
│   │   ├── "Doğru olanı yaparız"
│   │   ├── "Şeffaf iletişim"
│   │   └── "Söz verdiğimizi yaparız"
│   ├── Teamwork (Takım Çalışması)
│   │   ├── "Birlikte başarırız"
│   │   ├── "Farklı sesler değer görülür"
│   │   └── "Destekleyici ortam"
│   └── Excellence (Mükemmellik)
│       ├── "En iyi olmak için çabalıyoruz"
│       ├── "Detay önemlidir"
│       └── "Sürekli iyileşiyoruz"
├── birey_değerleri (Individual Values)
│   ├── Achievement orientation
│   ├── Autonomy preference
│   ├── Belonging need
│   ├── Growth seeking
│   └── Purpose driven
├── uyum_matrix
│   ├── High fit (>80%)
│   ├── Medium fit (50-80%)
│   └── Low fit (<50%)
└── risk_göstergeleri
    ├── Value misalignment
    ├── Work style conflict
    └── Communication gap
```

## 3. Pattern: Davranışsal Soru Bankası

```
soru_bankası
├── değer_soruları
│   ├── Innovation soruları
│   │   ├── "Yeni bir şey denediğiniz bir zamanı anlatın"
│   │   ├── "Başarısızlıktan ne öğrendiniz?"
│   │   └── "Riskli bir karar nasıl aldınız?"
│   ├── Teamwork soruları
│   │   ├── "Zor bir ekip üyesiyle nasıl çalıştınız?"
│   │   ├── "Bir çatışmayı nasıl çözdünüz?"
│   │   └── "Başarısızlık karşısında nasıl desteklendiniz?"
│   ├── Customer soruları
│   │   ├── "Müşteri beklentisini nasıl aştınız?"
│   │   ├── "Zor bir müşteriyle nasıl başa çıktınız?"
│   │   └── "Geri bildirime nasıl yanıt verdiniz?"
│   └── Integrity soruları
│       ├── "Etik bir ikilemle nasıl karşılaştınız?"
│       ├── "Yapmamanız gereken bir şey yapmanız istendiğinde?"
│       └── "Hata kime itiraf ettiniz?"
├── senaryo_soruları
│   ├── "Şu olsaydı ne yapardınız?"
│   ├── "Bu durumda öncelik ne olurdu?"
│   └── "Bu problemi nasıl çözerdiniz?"
└── star_entegre
    ├── Situation tanımı
    ├── Task açıklaması
    ├── Action detayı
    └── Result ölçümü
```

## 4. Pattern: Sonuç Yorumlama

```
sonuç_yorumlama
├── puanlama
│   ├── Overall culture fit (1-100)
│   ├── Değer uyumu (1-5)
│   ├── Çalışma stili (1-5)
│   ├── İletişim (1-5)
│   └── Büyüme potansiyeli (1-5)
├── yorum_kategorileri
│   ├── Strong fit (80-100)
│   │   ├── "Mükemmel kültür eşleşmesi"
│   │   ├── "Değerler tam uyumlu"
│   │   └── "İleri aşamaya davet"
│   ├── Moderate fit (50-79)
│   │   ├── "Potansiyel uyum"
│   │   ├── "Detaylı değerlendirme gerekli"
│   │   └── "Mülakatta kültür konuşulmalı"
│   └── Low fit (<50)
│       ├── "Kültür uyumsuzluğu riski"
│       ├── "Referans notu gerekli"
│       └── "Dikkatli değerlendirme şart"
├── risk_analizi
│   ├── Mismatch alanları
│   ├── Integrasyon riski
│   └── Retention riski
└── öneriler
    ├── Interview stratejisi
    ├── Onboarding yaklaşımı
    ├── Gelişim alanları
    └── Fit-building önerileri
```

---

## Quick Reference

| Boyut | Soru Örneği | Değerlendirme |
|-------|------------|------------|
| Innovation | "Yeni bir şey denediniz mi?" | Risk alma, öğrenme açlığı |
| Teamwork | "Ekiple zor bir proje?" | İşbirliği, iletişim |
| Customer | "Müşteri memnuniyeti?" | Odaklılık, çözüm |
| Integrity | "Etik ikilem?" | Değerler, duruş |

| Fit Skoru | Yorum | Aksiyon |
|----------|-------|--------|
| 80-100 | Mükemmel | Hızlı ilerleme |
| 60-79 | İyi | Detaylı mülakat |
| 40-59 | Orta | Dikkatli değerlendirme |
| 0-39 | Düşük | Alternatif bul |

| Değer | High Fit Davranışı | Low Fit Davranışı |
|-------|------------------|----------------|
| Innovation | Yeni fikirler önerir | Mevcut durumu korur |
| Customer | Her zaman müşteri öncelikli | Ürün/operasyon öncelikli |
| Teamwork | Birlikte çalışır | Bağımsız çalışır |
| Excellence | Detay odaklı | Hız odaklı |
