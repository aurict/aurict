---
name: support-metrics-analyzer
description: "SLA metrikleri. First response time. Resolution time. CSAT tracking."
triggers:
  keywords: ["support metrics analyzer", "destek metrikleri", "SLA analizi", "performans ölçümü", "destek KPI"]
auto_load_when: "Kullanıcı destek performans metriklerini analiz etmeyi, SLA uyum oranlarını değerlendirmeyi veya rapor oluşturmayı talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "grep", "glob"]
---

# Support Metrics Analyzer (Destek Metrikleri Analisti)

**Odak Alanı:** SLA metrikleri analizi, ilk yanıt süresi, çözüm süresi ve CSAT takibi. Destek performansını ölçme, raporlama ve iyileştirme önerileri.

---

## Pattern: Destek Metrikleri Analiz Süreci

### Adım 1: Temel Metrikleri Tanımlama
Analiz edilecek SLA ve KPI metriklerini belirle:
```
METRİK KATEGORİLERİ:
HIZ METRİKLERİ (Speed Metrics)
├── First Response Time (FRT) - İlk Yanıt Süresi
│   ├── Tanım: Müşteri ilk mesajından ilk yanıta kadar geçen süre
│   ├── Hesaplama: Ortalama / Median / Yüzdelik (p95)
│   └── SLA Hedefi: Genellikle <4 saat veya <24 saat
│
├── First Contact Resolution (FCR) - İlk Temas Çözümü
│   ├── Tanım: Tek sohbette/email'de çözülen ticket oranı
│   ├── Hesaplama: Çözülen / Toplam × 100
│   └── Hedef: >%70
│
├── Average Handle Time (AHT) - Ortalama İşlem Süresi
│   ├── Tanım: Ticket başına harcanan toplam süre
│   ├── Hesaplama: Toplam süre / Ticket sayısı
│   └── Hedef: Ticket tipine göre değişir
│
└── Resolution Time - Çözüm Süresi
    ├── Tanım: Ticket açılışından kapanışa kadar geçen süre
    ├── Hesaplama: Ortalama / Median / Yüzdelik (p95)
    └── SLA Hedefi: Ticket önceliğine göre (P1 <4s, P4 <72s)

KALİTE METRİKLERİ (Quality Metrics)
├── Customer Satisfaction (CSAT) - Müşteri Memnuniyeti
│   ├── Tanım: Müşteri memnuniyet skorları
│   ├── Hesaplama: Memnun (4-5) / Toplam × 100
│   └── Hedef: >%85
│
├── Customer Effort Score (CES) - Müşteri Efor Skoru
│   ├── Tanım: Müşterinin sorun çözmek için harcadığı efor
│   ├── Hesaplama: Ortalama CES skoru
│   └── Hedef: <3.0 (7 üzerinden)
│
├── Net Promoter Score (NPS) - Net Tavsiye Skoru
│   ├── Tanım: Müşteri sadakatini ölçer
│   ├── Hesaplama: %Promoters - %Detractors
│   └── Hedef: >50
│
└── Quality Score - Kalite Skoru
    ├── Tanım: Yanıt kalitesi (iç değerlendirme)
    └── Hesaplama: Puanlama kriterleri ortalaması

hacim METRİKLERİ (Volume Metrics)
├── Ticket Volume - Ticket Hacmi
│   ├── Toplam ticket sayısı
│   ├── Trend (haftalık/aylık değişim)
│   └── Kanal bazlı dağılım
│
├── Ticket by Category - Kategori Dağılımı
│   ├── Sorun tipi bazlı
│   └── Ürün/özellik bazlı
│
└── Agent Productivity - Ajan Verimliliği
    ├── Tickets per agent
    ├── Resolution rate per agent
    └── Handle time per agent
```

### Adım 2: Veri Toplama ve Hesaplama
Metrikleri hesaplamak için verileri topla:
```
VERİ TOPLAMA KAYNAKLARI:
Ticket Sistemi
├── Oluşturulma zamanı (created_at)
├── İlk yanıt zamanı (first_response_at)
├── Çözüm zamanı (resolved_at)
├── Kapatılma zamanı (closed_at)
├── Öncelik (priority)
├── Kategori (category)
├── Atanan ajan (assigned_to)
└── Kanal (channel: email/chat/phone)

Anket Sistemi
├── CSAT yanıtları
├── NPS yanıtları
├── CES yanıtları
└── Açık uçlu yorumlar

İnsan Kaynakları
├── Agent çalışma saati
├── Devamsızlık
├── Training süreleri
└── Mola süreleri
```

### Adım 3: SLA Uyum Analizi
SLA hedeflerine uyum oranını hesapla:
```
SLA HESAPLAMA FORMÜLLERİ:
TAMAMLAMA ORANI
─────────────────────────────────────────
SLA Tamamlanma Oranı = 
  (Süresinde tamamlanan / Toplam) × 100

ÖRNEK:
Toplam ticket: 100
Süresinde tamamlanan: 92
SLA Uyum Oranı: %92 ✅ (Hedef: >%90)

İLK YANIT SÜRESİ HESAPLAMASI
─────────────────────────────────────────
FRT (saat) = first_response_at - created_at

ÖRNEK:
Ticket #1: 2 saat (✅ SLA: <4s)
Ticket #2: 6 saat (❌ SLA: <4s)
Ticket #3: 1 saat (✅ SLA: <4s)
Average FRT: 3 saat

YÜZDEKLİK HESAPLAMA (p95)
─────────────────────────────────────────
p95 = %95'inin tamamladığı süre

ÖRNEK:
100 ticket süreleri sıralanır
p95 = 95. ticket'ın süresi
Bu, "müşterilerin %95'i X sürede yanıt aldı" demek
```

### Adım 4: Trend ve Anomali Analizi
Zaman içinde değişimleri ve anormallikleri tespit et:
```
TREND ANALİZİ:
HAFTALIK TREND
├── Geçen hafta vs bu hafta değişim
├── % değişim hesaplaması
└── Seasonality kontrolü (hafta içi/sonu)

AYLIK TREND
├── Aynı ay geçen yıl ile karşılaştırma
├── Quarter-over-quarter
└── Yıl yıl trend

ANOMALİ TESPİTİ
├── Standart sapma analizi
├── Z-score hesaplama (>2 veya <-2 anomaly)
├── Ani değişiklikler
└── Pattern break (kalıp kırılması)

ÖRNEK ANOMALİ:
Normal FRT: 3 saat ± 30 dakika
Bugün FRT: 8 saat → Anomaly!
┌─────────────────────────────────────┐
│ ⚠️ ANOMALİ TESPİT EDİLDİ            │
│ Metric: First Response Time         │
│ Expected: 3 saat                   │
│ Actual: 8 saat (+166%)             │
│ Possible cause: Sistem kesintisi    │
│ Action: Kök neden araştırması       │
└─────────────────────────────────────┘
```

### Adım 5: Segmentasyon Analizi
Metrikleri segmentlere göre ayrıştır:
```
SEGMENTASYON BOYUTLARI:
KANALA GÖRE
├── Email: FRT, CSAT
├── Live Chat: FRT, AHT
├── Phone: FRT, CSAT
└── Social: FRT, CSAT

ÖNCELİĞE GÖRE
├── P1 (Kritik): FRT <1s, Resolution <4s
├── P2 (Yüksek): FRT <4s, Resolution <24s
├── P3 (Orta): FRT <24s, Resolution <72s
└── P4 (Düşük): FRT <48s, Resolution <120s

ÜRÜN/HİZMETE GÖRE
├── Ürün A performansı
├── Ürün B performansı
└── Entegrasyon sorunları

AGENTA/Ajana GÖRE
├── Performans karşılaştırması
├── Training ihtiyaçları
└── Workload dağılımı
```

### Adım 6: Raporlama ve İyileştirme
Buluları raporla ve aksiyon öner:
```
RAPOR YAPISI:
YÖNETİCİ ÖZETİ (Executive Summary)
├── Bu dönemin özeti (1 paragraf)
├── Ana metrikler (hedefe göre durum)
├── Öne çıkan sorunlar
└── Kritik aksiyonlar

DETAY METRİKLERİ
├── SLA Uyum Oranı (grafik)
├── FRT Trend (grafik)
├── Çözüm Süresi Dağılımı
├── CSAT/NPS skorları
└── Hacim trendleri

DEEP DIVE
├── Sorunlu alanlar (hangi segmentler?)
├── Anomaliler ve sebepleri
├── Agent performans dağılımı
└── Mevsimsel etkiler

AKSİYON ÖNERİLERİ
├── Kısa vadeli (hemen): [Aksiyon 1, 2, 3]
├── Orta vadeli (1-4 hafta): [Aksiyon]
└── Uzun vadeli (1-3 ay): [Aksiyon]
```

---

## Key Patterns (Ana Kalıplar)

| Pattern | Açıklama | Uygulama |
|---|---|---|
| **SLA Benchmarking** | SLA hedeflerine göre karşılaştırma | Gap analizi |
| **Trend Correlation** | Metrikler arası korelasyon | Kök neden tespiti |
| **Percentile Reporting** | p50, p90, p95 kullanımı | Service level ölçümü |
| **Leading Indicators** | Öncü metrikler ile tahmin | Proaktif aksiyon |
| **Goal Decomposition** | Hedefleri alt hedeflere ayırma | Agent/team hedefleri |

---

## Anti-Patterns (Kaçınılması Gerekenler)

### ❌ Yanlış Uygulamalar

```yaml
# Sadece ortalama kullanmak
problem: "Ortalama FRT hesaplamak, outlier'ları görmemek"
result: "Gerçek müşteri deneyimi gizlenir, %5'lik tail görülmez"

# SLA hedeflerini realiteyle karşılaştırmamak
problem: "Gerçekçi olmayan hedefler koymak"
result: "Ekip motivasyon kaybı, sürekli başarısızlık"

# Sadece negatife odaklanmak
problem: "Sadece düşük performansı raporlamak"
result: "Başarılar görülmez, motivasyon düşer"

# Geç veri ile raporlamak
problem: "1 hafta önceki verilerle rapor"
result: "Geç müdahale, sorun büyümüş"

# Metrik çeşitliliği eksikliği
problem: "Sadece FRT'ye bakmak"
result: "Bütünsel görüntü yok, diğer sorunlar gizli kalır"
```

### ✅ Doğru Uygulamalar

```yaml
# Percentile ile tam resim
approach: "p50, p90, p95 kullanarak tam dağılımı görme"
result: "Tail performans da görünür"

# Realistik hedefler
approach: "Tarihsel veri + iyileştirme potansiyeli ile hedef belirleme"
result: "Ulaşılabilir, motive edici hedefler"

# Dengedeli raporlama
approach: "Hem iyileştirmeler hem sorunlar"
result: "Motivasyon korunur, sorunlar görülür"

# Near-realtime raporlama
approach: "Günlük veya gerçek zamanlı dashboard"
result: "Hızlı müdahale"

# Çok boyutlu analiz
approach: "FRT + CSAT + hacim + kalite kombinasyonu"
result: "Bütünsel performans görünürlüğü"
```

---

## Quick Reference (Hızlı Başvuru)

| SLA Metriği | Tanım | Hesaplama | Hedef |
|---|---|---|---|
| First Response Time (FRT) | İlk yanıta kadar süre | Ortalama/Median/P95 | <4s (kritik), <24s (normal) |
| First Contact Resolution (FCR) | İlk temas çözüm oranı | Çözülen/Toplam × 100 | >%70 |
| Average Handle Time (AHT) | Ticket başına süre | Toplam süre/Ticket | Ticket tipine göre değişir |
| Resolution Time | Ticket ömrü | Resolved - Created | <24s (P2), <72s (P3) |
| CSAT Score | Müşteri memnuniyeti | Memnun/Toplam × 100 | >%85 |
| NPS Score | Net Tavsiye Skoru | %Prom - %Detr | >50 |
| CES Score | Müşteri efor skoru | Ortalama (1-7) | <3.0 |

| Öncelik | FRT SLA | Resolution SLA | Eskalasyon |
|---|---|---|---|
| P1 (Kritik) | <1 saat | <4 saat | Derhal |
| P2 (Yüksek) | <4 saat | <24 saat | <2 saat |
| P3 (Orta) | <24 saat | <72 saat | <8 saat |
| P4 (Düşük) | <48 saat | <120 saat | <24 saat |

| Kanal | FRT Hedefi | AHT Hedefi | CSAT Hedefi |
|---|---|---|---|
| Email | <4 saat | <20 dk | >%85 |
| Live Chat | <30 sn | <10 dk | >%90 |
| Phone | Anında | <8 dk | >%90 |
| Social | <1 saat | <15 dk | >%85 |

| Zaman Periyodu | Analiz Türü | Kullanım |
|---|---|---|
| Gerçek zamanlı | Dashboard monitoring | Anlık takip |
| Günlük | SLA compliance | Operasyonel yönetim |
| Haftalık | Trend analizi | Haftalık review |
| Aylık | Kapsamlı rapor | Yönetim raporu |
| Çeyreklik | Stratejik planlama | Hedef belirleme |

| Anomali Türü | Eşik | Aksiyon |
|---|---|---|
| FRT spike | >%50 artış | Sistem/ekip kontrolü |
| CSAT drop | >%10 düşüş | Kalite incelemesi |
| Volume surge | >%30 artış | Kapasite kontrolü |
| Resolution slowdown | >%25 artış | Kök neden analizi |

| Rapor Bölümü | İçerik | Hedef Kitle |
|---|---|---|
| Executive Summary | Özet + kilit metrikler | Üst yönetim |
| SLA Dashboard | Tüm metrikler | Destek yönetimi |
| Agent Performance | Bireysel metrikler | Team lead/Manager |
| Trend Analysis | Zamanlı değişimler | Analitik ekip |
| Action Items | İyileştirme önerileri | Herkes |

| Metrik | Hedef | Uyarı Eşiği | Acil Eşiği |
|---|---|---|---|
| SLA Uyum | >%90 | <%85 | <%80 |
| FRT (P1) | <1 saat | >2 saat | >4 saat |
| FRT (P3) | <24 saat | >36 saat | >48 saat |
| CSAT | >%85 | <%75 | <%65 |
| FCR | >%70 | <%60 | <%50 |

---

## Dashboard Template

```markdown
# Destek Performans Dashboard - [Dönem]

## 📊 Özet Durum
| Metrik | Bu Hafta | Geçen Hafta | Hedef | Durum |
|---|---|---|---|---|
| SLA Uyum | %92 | %89 | >%90 | ✅ |
| FRT (Ortalama) | 2.3s | 3.1s | <4s | ✅ |
| CSAT | %88 | %85 | >%85 | ✅ |
| FCR | %72 | %68 | >%70 | ✅ |

## 📈 Trend Grafikleri
[FRT Trend - Son 4 hafta]
[CSAT Trend - Son 4 hafta]
[Volume Trend - Son 4 hafta]

## ⚠️ Dikkat Gerektiren Alanlar
| Alan | Metrik | Sorun | Önerilen Aksiyon |
|---|---|---|---|
| Email kanalı | FRT | Artış eğilimi | Ekip yükü dağılımı |
| P2 ticketlar | Resolution | SLA ihlali | Prioritization review |

## 🎯 Bu Hafta Aksiyonları
1. [Aksiyon 1]
2. [Aksiyon 2]
3. [Aksiyon 3]

---
Rapor Tarihi: [Tarih]
Sonraki Rapor: [Tarih]
```

---

## Otomasyon Parametreleri

```typescript
interface SupportMetricsConfig {
  slaDefinitions: {
    [priority: string]: {
      firstResponseMinutes: number;
      resolutionMinutes: number;
    };
  };
  calculationRules: {
    averageType: 'mean' | 'median';
    percentiles: number[];             // [50, 90, 95]
    excludeOutliers: boolean;
    outlierThresholdStdDev: number;     // Standart sapma çarpanı
  };
  alertThresholds: {
    slaCompliancePercent: number;       // SLA uyum alarmı
    frtIncreasePercent: number;         // FRT artış alarmı
    csatDropPercent: number;             // CSAT düşüş alarmı
    volumeIncreasePercent: number;       // Hacim artış alarmı
  };
  reportingSettings: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    includeAgentPerformance: boolean;
    includeTrendAnalysis: boolean;
  };
  segmentationDimensions: {
    byChannel: boolean;
    byPriority: boolean;
    byProduct: boolean;
    byAgent: boolean;
    byTimeOfDay: boolean;
  };
}
```
