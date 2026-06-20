---
name: employee-engagement-analyzer
description: "Çalışan anket analizi, NPS/eNPS hesaplama, çıkarımlar, öneriler, trend takibi ve action plan üretme"
triggers:
  keywords: ["employee engagement", "anket analizi", "nps", "enps", "çalışan bağlılığı", "trend analizi"]
auto_load_when: "Kullanıcı çalışan anket sonuçları analizi, NPS hesaplama veya engagement raporu ister"
agent: content-ops
tools: ["Read", "Write", "grep", "glob"]
---

# Employee Engagement Analyzer (Çalışan Bağlılığı Analizcisi)

**Odak Alanı:** Çalışan anket analizi, NPS/eNPS hesaplama, çıkarımlar, öneriler, trend takibi ve action plan üretme

## 1. Pattern: Ank türleri ve Analiz Yöntemi

```
anket_türleri
├── nps_survey
│   ├── "Bu şirkette çalışmayı başkasına önerir misiniz?"
│   ├── 0-10 ölçeği
│   ├── Detractor (0-6)
│   ├── Passive (7-8)
│   └── Promoter (9-10)
│   └── Hesaplama: %Promoter - %Detractor
├── engagement_survey
│   ├── Çalışma koşulları memnuniyeti
│   ├── Yönetim güveni
│   ├── Ekip ilişkileri
│   ├── Büyüme fırsatları
│   ├── İş-yaşam dengesi
│   └── 5'li Likert ölçeği
├── pulse_survey
│   ├── Kısa + hızlı
│   ├── Haftalık veya aylık
│   ├── 3-5 soru
│   └── Real-time feedback
├── exit_interview
    ├── Ayrılık nedenleri
    ├── Şirket feedback'i
    ├── Gelişim önerileri
    └── Çıkış anketi
└── 360_feedback
    ├── Yönetici değerlendirmesi
    ├── Akran değerlendirmesi
    ├── Alt-empat değerlendirmesi
    └── Self değerlendirmesi
```

## 2. Pattern: NPS/eNPS Hesaplama

```
nps_hesaplama
├── temel_formül
│   ├── eNPS = %Promoter - %Detractor
│   ├── Örnek: %40 Promoter - %20 Detractor = +20 eNPS
│   └── Aralık: -100 ile +100
├── segmentasyon
│   ├── Departman bazlı eNPS
│   ├── Tenure bazlı eNPS (0-1 yıl, 1-3 yıl, 3+ yıl)
│   ├── Lokasyon bazlı eNPS
│   ├── Rol bazlı eNPS (İcra vs Yönetim)
│   └── Yaş grubu bazlı eNPS
├── yorumlama
│   ├── +70 to +100 = World Class
│   ├── +50 to +69 = Excellent
│   ├── +30 to +49 = Good
│   ├── 0 to +29 = OK
│   ├── -1 to -29 = Needs Improvement
│   └── -30 to -100 = Critical
└── zaman_trendi
    ├── Çeyreklik karşılaştırma
    ├── Yıllık trend
    ├── Sektör benchmark karşılaştırması
    └── Hedef takibi
```

## 3. Pattern: Çıkarım ve Öneri Üretimi

```
çıkarım_üretimi
├── veri_segmentasyonu
│   ├── Pozitif yanıtlar (4-5)
│   │   ├── Güçlü yönler
│   │   ├── Fırsatlar
│   │   └── Öncelikli koruma
│   ├── Nötr yanıtlar (3)
│   │   ├── Potansiyel iyileştirme
│   │   ├── Dikkat noktaları
│   │   └── Araştırılması gereken
│   └── Negatif yanıtlar (1-2)
│       ├── Kritik sorunlar
│       ├── Acil çözümler
│       └── Risk faktörleri
├── kök_neden_analizi
│   ├── Pareto analizi (%80/%20 kuralı)
│   ├── Altında yatan temalar
│   ├── Korelasyon testleri
│   ├── Açık uçlu yorum analizi
│   └── Sentiment scoring
└── öneri_üretimi
    ├── Önceliklendirme (Impact x Effort)
    ├── Kısa vadeli (0-3 ay)
    │   ├── Hızlı kazanımlar
    │   ├─�� İletişim iyileştirmeleri
    │   └── Süreç düzeltmeleri
    ├── Orta vadeli (3-6 ay)
    │   ├── Eğitim programları
    │   ├── Politika değişiklikleri
    │   └── Yapısal iyileştirmeler
    └── Uzun vadeli (6-12 ay)
        ├── Stratejik girişimler
        ├── Kültür dönüşümü
        └── Sistem değişiklikleri
```

## 4. Pattern: Trend Takibi

```
trend_takibi
├── zaman_serisi_analiz
│   ├── Çeyrek çeyrek eNPS
│   ├── Aylık engagement skoru
│   ├── Haftalık pulse oranı
│   └── Yıllık karşılaştırma
├── segment_trendi
│   ├── Departman bazlı trende göre sıralama
│   ├── En çok düşüş yaşayan alanlar
│   ├── En çok artış yaşayan alanlar
│   └── Anormallik tespiti
├── korelasyon_analizi
│   ├── Engagement vs Performans
│   ├── Engagement vs Devam
│   ├── Engagement vs Memnuniyet
│   └── Engagement vs Prodüktivite
└── benchmark_karşılaştırması
    ├── Sektör ortalaması
    ├── Şirket büyüklüğüne göre
    ├── Coğrafi karşılaştırma
    └── Global benchmark
```

## 5. Pattern: Action Plan Üretimi

```
action_plan
├── sorun_tanımı
│   ├── Spesifik sorun
│   ├── Etkilenen çalışan sayısı
│   ├── Etki seviyesi
│   └── Aciliyet derecesi
├── çözüm_tasarımı
│   ├── Kısa vadeli çözüm (<1 ay)
│   ├── Orta vadeli çözüm (1-3 ay)
│   ├── Uzun vadeli çözüm (3-12 ay)
│   └── Kaynak gereksinimi
├── uygulama_planı
│   ├── Sorumlu atama
│   ├── Zaman çizelgesi
│   ├── BAŞARI ölçütleri
│   └── İletişim stratejisi
└── takip_mekanizması
    ├── Haftalık check-in
    ├── 30 gün sonuç ölçümü
    ├── Pulse survey doğrulama
    └── Çeyreklik kapanış
```

---

## Quick Reference

| Metrik | Hesaplama | Yorumlama |
|--------|----------|----------|
| eNPS | %Promoter - %Detractor | +50 üstü mükemmel, -30 altı kritik |
| Engagement Score | Ortalama Likert (1-5) | 4.0+ yüksek, 3.0- düşük |
| Response Rate | Yanıt / Toplam × 100 | %70+ iyi, %50- düşük |
| Avg Tenure | Ortalama çalışma süresi | Sektör benchmark karşılaştırması |

| Skor Aralığı | Düzey | Aksiyon |
|-------------|-------|---------|
| +70-100 | World Class | Best practice paylaşımı |
| +50-69 | Excellent | Celebrate + sürdür |
| +30-49 | Good | Spot improvement |
| +0-29 | Fair | Dikkatli izleme |
| -30-0 | Needs Work | Action plan gerekli |
| -100- -30 | Critical | Acil müdahale şart |

| Sorun Alanı | Örnek Çözüm | Timeline |
|-------------|-------------|----------|
| Liderlik | Yönetici coaching | 3-6 ay |
| Büyüme | Gelişim programı | 6-12 ay |
| İş-Yaşam | Esnek çalışma | 1-3 ay |
| Kompansasyon | Pazar araştırması | 3-6 ay |
| Kültür | Events + iletişim | 1-3 ay |
