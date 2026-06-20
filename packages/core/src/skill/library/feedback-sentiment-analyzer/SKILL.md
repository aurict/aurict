---
name: feedback-sentiment-analyzer
description: "Yorum duygu analizi. Sentiment scoring. Trend identification. Actionable insights."
triggers:
  keywords: ["feedback sentiment analyzer", "duygu analizi", "sentiment analizi", "yorum analizi", "metin analizi"]
auto_load_when: "Kullanıcı müşteri yorumlarında/geribildirimlerde duygu analizi yapmayı, sentiment skorlaması oluşturmayı veya trendleri belirlemeyi talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "grep", "glob"]
---

# Feedback Sentiment Analyzer (Geri Bildirim Duygu Analisti)

**Odak Alanı:** Müşteri yorumları, geri bildirimler ve metinlerde duygu analizi yapma, sentiment skorlaması, trend belirleme ve aksiyonlanabilir içgörüler çıkarma.

---

## Pattern: Duygu Analizi Süreci

### Adım 1: Metin Kategorizasyonu
Analiz edilecek metin türlerini ve kaynaklarını belirle:
```
GERİ BİLDİRİM KAYNAKLARI:
YAPISAL KAYNAKLAR
├── Anket yanıtları (CSAT, NPS açık uçlu)
├── Destek ticket yorumları
├── App/Play Store yorumları
├── Sosyal medya mentionları
├── Forum/topuluk platformları
└── E-piya geri bildirimleri

METİN TÜRLERİ
├── Kısa yorum (1-2 cümle)
├── Detaylı review (paragraf)
├── Çoklu mesaj (sohbet geçmişi)
├── Destek ticket açıklaması
└── Social media mention
```

### Adım 2: Duygu Tespiti (Sentiment Detection)
Metnin genel duygu durumunu belirle:
```
DUYGU KATEGORİLERİ:
POZİTİF (+)
├── Mutlu/memnun ifadeler
├── "Harika!", "Çok memnunum", "Teşekkürler"
├── Beğeni ifadeleri
└── Öneri/ tavsiye belirtisi

NÖTR (0)
├── Bilgi talebi
├── Soru sorma
├── Yorum yok veya belirsiz
└── "Bilmiyorum" ifadeleri

NEGATİF (-)
├── Hayal kırıklığı
├── "Kötü", "Hayal kırıklığına uğradım"
├── Şikayet/eleştiri
└── Çözülemeyen sorunlar

KARMAŞIK (MIXED)
├── Hem olumlu hem olumsuz
├── "Ürün iyi ama hizmet kötü"
├── Bağlama göre değişen
└── Belirsiz duygu
```

### Adım 3: Aspect-Based Sentiment Analysis
Ürün/hizmet bileşenlerine göre duygu analizi:
```
ASPECT KATEGORİLERİ:
ÜRÜN ASPECTLERİ
├── Kullanım kolaylığı (usability)
├── Performans/hız
├── Özellik seti
├── Tasarım/UI
├── Fiyat/değer oranı
└── Güvenilirlik

HİZMET ASPECTLERİ
├── Destek kalitesi
├── Destek hızı (yanıt süresi)
├── Agent tutumu
├── Çözüm oranı
└── Profesyonellik

GENEL ASPECTLERİ
├── Kurumsal güvenilirlik
├── İletişim
├── Dokümantasyon
├── Innovation (yenilikçilik)
└── Değer önerisi
```

### Adım 4: Sentiment Scoring Model
Skor sistemi oluştur:
```
SCORING FRAMEWORK:
ÖLÇEK TÜRLERİ:

SEVİYE TABANLI (5-point)
────────────────────────
+2 = Çok Pozitif (Strong Positive)
+1 = Pozitif (Positive)
 0 = Nötr (Neutral)
-1 = Negatif (Negative)
-2 = Çok Negatif (Strong Negative)

YÜZDELİK (0-100)
────────────────────────
80-100 = Çok Pozitif
60-79  = Pozitif
40-59  = Nötr
20-39  = Negatif
0-19   = Çok Negatif

SKOR HESAPLAMA:
Genel Skor = (Pozitif puan × Ağırlık) + (Negatif puan × Ağırlık)

ÖRNEK YORUM ANALİZİ:
"Ürün güzel ama destek çok yavaş ve fiyat pahalı"

Aspect Breakdown:
├── Ürün kalitesi: +1 (Pozitif)
├── Destek hızı: -2 (Çok Negatif)
├── Fiyat: -1 (Negatif)
└── Genel: -0.3 (Hafif Negatif)

Sonuç: "Karmaşık" (Mixed Sentiment)
```

### Adım 5: Trend ve Pattern Identification
Zaman içinde değişimleri ve kalıpları tespit et:
```
TREND ANALİZİ:
ZAMAN SERİSİ ANALİZİ
├── Günlük/Haftalık/Aylık sentiment ortalaması
├── Trend yönü (artış/azalış/durağan)
├── Seasonality etkileri
└── Anomali tespiti

KONU TRENDLERİ
├── Hangi konularda duygu değişiyor?
├── Ürün güncellemesi sonrası tepkiler
├── Kampanya döneminde etkiler
└── Rakip hareketi etkileri

PATTERN KALIPLARI
┌────────────────────────────────────────────────┐
│ PATTERN: Destek Sonrası Negatif Artış           │
│─────────────────────────────────────────────────│
│ 1. Kullanıcı ticket açar                       │
│ 2. Negatif duygu yükselir                     │
│ 3. Çözüm sonrası duygu düzelir mi?            │
│ 4. FCR <-> CSAT korelasyonu                   │
│─────────────────────────────────────────────────│
│ İçgörü: "FCR yüksek ama CSAT düşük = problem!" │
└────────────────────────────────────────────────┘

CLUSTER ANALİZİ
├── Benzer şikayetleri gruplandırma
├── Konu bazlı sentiment ortalaması
└── "En çok şikayet edilen X konusu" tespiti
```

### Adım 6: Actionable Insights Çıkarma
Veriyi aksiyona dönüştür:
```
İÇGÖRÜ ÇEŞİTLERİ:
ÜRÜN İÇGÖRLERİ
├── "Kullanıcılar X özelliğini 'karmaşık' buluyor"
├── "Performans şikayetleri son hafta %30 arttı"
└── "Fiyat/değer algısı segment bazlı negatif"

HİZMET İÇGÖRLERİ
├── "Destek bekleme süresi >15dk → Negatif duygu artışı"
├── "Agent X'in ticket'larında CSAT diğerlerinden %15 düşük"
└── "Çözüm sonrası follow-up yapılmayanlarda NPS düşük"

OPERASYONEL İÇGÖRLER
├── "Hafta sonu response time %40 arttı → Personel artırımı"
├── "Email kanalında sentiment diğer kanallardan %20 düşük"
└── "Yeni özellik lansmanı sonrası volume %200 arttı"

AKSİYON MATRİSİ:
┌──────────────────────────────────────────────────────┐
│ Negatif Trend         │ Hemen        │ 1-2 Hafta     │
├──────────────────────┼──────────────┼───────────────┤
│ Destek kalitesi       │ Agent eğitimi│ Süreç revizyon│
│ Ürün performansı      │ Bug fix önceli│ Tech debt    │
│ Fiyat algısı          │ Değer iletişimi│ Promo planı  │
│ Dokümantasyon        │ KB güncelleme │ İçerik ekleme │
└──────────────────────┴──────────────┴───────────────┘
```

### Adım 7: Raporlama ve Monitoring
Analiz sonuçlarını raporla:
```
RAPOR ŞABLONU:
DUYGU ANALİZİ RAPORU
═══════════════════════════════════════
Dönem: [Başlangıç] - [Bitiş]
Toplam Geri Bildirim: [X]
───────────────────────────────────────────

GENEL DURUM
┌────────────────────────────────────────┐
│ Ortalama Sentiment Skoru: [X]/5        │
│ Pozitif: [X]%                          │
│ Nötr: [X]%                             │
│ Negatif: [X]%                          │
│ Trend: ↗️ Artış / ↘️ Azalış / → Sabit  │
└────────────────────────────────────────┘

EN ÇOK POZİTİF YORUMLAR
1. [Yorum 1]
2. [Yorum 2]

EN ÇOK NEGATİF YORUMLAR
1. [Yorum 1]
2. [Yorum 2]

ASPECT BAZLI ANALİZ
├── Kullanım kolaylığı: [Skor] [Trend]
├── Performans: [Skor] [Trend]
├── Destek kalitesi: [Skor] [Trend]
├── Fiyat/değer: [Skor] [Trend]
└── [Diğer...]

ANA İÇGÖRLER
1. [İçgörü 1]
2. [İçgörü 2]
3. [İçgörü 3]

ÖNERİLEN AKSİYONLAR
1. [Aksiyon 1] - [Sahip] - [Tarih]
2. [Aksiyon 2] - [Sahip] - [Tarih]
```

---

## Key Patterns (Ana Kalıplar)

| Pattern | Açıklama | Uygulama |
|---|---|---|
| **Aspect-Based Analysis** | Bileşen bazlı duygu | Spesifik iyileştirme alanları |
| **Longitudinal Tracking** | Zamanlı trend | Erken uyarı sistemi |
| **Multi-Source Aggregation** | Çoklu kaynak birleştirme | Kapsamlı görüntü |
| **Intent Classification** | Niyet sınıflandırma | Satış vs Şikayet ayrımı |
| **Action Priority Matrix** | İçgörü önceliklendirme | Impact × Effort matrix |

---

## Anti-Patterns (Kaçınılması Gerekenler)

### ❌ Yanlış Uygulamalar

```yaml
# Sadece genel sentiment
problem: "'Genel sentiment negatif' demek, detay yok"
result: "Hangi konuda sorun olduğu bilinmez"

# Sayısal ortalamaya güvenmek
problem: "1 çok pozitif + 1 çok negatif = 0 ortalama = nötr?"
result: "Gerçek dağılım gizlenir"

# Ironiyi yakalayamamak
problem: "'Harika, yine çöktü!' → Pozitif olarak işaretleniyor"
result: "Yanlış analiz, yanlış aksiyon"

# Geçmişe dönük sadece analiz
problem: "Geçen ayın verisiyle rapor, bugün için geç"
result: "Fırsat kaçırılır, sorun büyür"

# Negatif bias
problem: "Sadece negatif yorumlara odaklanmak"
result: "Güçlü yönler görülmez, motivasyon düşer"
```

### ✅ Doğru Uygulamalar

```yaml
# Aspect bazlı detay
approach: "Her konu/özellik için ayrı sentiment analizi"
result: "Spesifik sorunlar görünür"

# Dağılım analizi
approach: "Ortalama + median + dağılım grafiği"
result: "Gerçek tablo görünür"

# Bağlam-aware analiz
approach: "Cümlenin tam bağlamını değerlendirme"
result: "Ironi ve nüans yakalanır"

# Near-realtime monitoring
approach: "Günlük veya anlık sentiment dashboard"
result: "Hızlı müdahale"

# Dengelenmiş raporlama
approach: "Hem negatif (iyileştirme) hem pozitif (güçlü yönler)"
result: "Motivasyon + somut aksiyon"
```

---

## Quick Reference (Hızlı Başvuru)

| Sentiment Sınıfı | Skor (5 üzerinden) | Skor (0-100) | Örnek İfade |
|---|---|---|---|
| Çok Pozitif | +2 | 80-100 | "Harika, kesinlikle tavsiye ederim!" |
| Pozitif | +1 | 60-79 | "İyi ürün, memnunum" |
| Nötr | 0 | 40-59 | "Ürün hakkında yorum yapamıyorum" |
| Negatif | -1 | 20-39 | "Beklentilerimi karşılamadı" |
| Çok Negatif | -2 | 0-19 | "Berbat, para kaybı" |

| Aspect Kategorisi | Takip Edilecek Konular |
|---|---|
| Kullanım Kolaylığı | UI, navigasyon, learning curve |
| Performans | Hız, respons, uptime |
| Özellikler | Kapsamlılık, yararlılık |
| Fiyat | Değer algısı, rekabetçilik |
| Destek | Kalite, hız, çözüm oranı |
| Dokümantasyon | Açıklık, güncellik |

| Trend Durumu | Gösterge | Yorum |
|---|---|---|
| ↗️ Güçlü Artış | >+%20 | Önemli iyileşme veya sorun |
| ↗️ Hafif Artış | +%5-20 | İzlenmeli |
| → Sabit | -%5-+%5 | Stable durum |
| ↘️ Hafif Düşüş | -%5-20 | İzlenmeli |
| ↘️ Güçlü Düşüş | >-%20 | Acil müdahale gerekebilir |

| Kaynak | Veri Tipi | Analiz Zamanı |
|---|---|---|
| App Store | Yorum | Günlük toplama |
| Google Play | Yorum | Günlük toplama |
| Anket (CSAT/NPS) | Yapılandırılmış + açık uçlu | Toplanır toplanmaz |
| Destek Ticket | Yarı yapılandırılmış | Haftalık analiz |
| Sosyal Medya | Serbest metin | Gerçek zamanlı izleme |
| Forum | Uzun metin | Haftalık |

| İçgörü Öncelik | Impact | Effort | Örnek |
|---|---|---|---|
| Kritik | Yüksek | Düşük/Orta | Bug fix, hızlı kazanç |
| Yüksek | Yüksek | Yüksek | Büyük revizyon |
| Orta | Orta | Orta | İyileştirme projesi |
| Düşük | Düşük | Düşük | Nice-to-have |

| Metrik | Hesaplama | Hedef | Uyarı |
|---|---|---|---|
| Ortalama Sentiment | Tüm yorumların ortalaması | >0.5 (5 üzerinden) | <0 |
| Pozitif Oranı | Pozitif / Toplam × 100 | >%60 | <%40 |
| Negatif Oranı | Negatif / Toplam × 100 | <%20 | >%35 |
| Aspect Score | Her aspect için ortalama | >0 (nötr üstü) | <0 |
| Response Rate | Takip edilen yorumlara yanıt | >%50 | <%30 |

---

## Template: Günlük Sentiment Dashboard

```markdown
# Duygu Analizi Dashboard - [Tarih]

## 📊 Genel Görünüm
┌─────────────────────────────────────────────┐
│ Toplam Geri Bildirim: [X]                  │
│ Ortalama Sentiment: [X]/5 ([Pozitif]/[Nötr]/[Negatif]) │
│ Haftalık Trend: [↗️/→/↘️] %[X]              │
└─────────────────────────────────────────────┘

## 📈 Son 7 Gün Trend
| Tarih | Skor | Pozitif | Nötr | Negatif |
|---|---|---|---|---|
| [Gün] | [X] | [X]% | [X]% | [X]% |
| ... | ... | ... | ... | ... |

## 🎯 En Dikkat Çekici Yorumlar

### En Pozitif
> "[Yorum]" - [Kaynak] @ [Tarih]

### En Negatif
> "[Yorum]" - [Kaynak] @ [Tarih]

## ⚠️ Uyarılar / İçgörüler
| Konu | Bulgu | Aksiyon |
|---|---|---|
| [Aspect] | [Kısa bulgu] | [Önerilen aksiyon] |

## 🔔 Takip Gerektiren Konular
- [Takip maddesi 1]
- [Takip maddesi 2]

---
Son Güncelleme: [Tarih/Saat]
```

---

## Otomasyon Parametreleri

```typescript
interface SentimentAnalyzerConfig {
  sentimentScale: '5point' | '100point';    // Scoring ölçeği
  aspectCategories: string[];               // Takip edilecek aspect'ler
  thresholds: {
    positiveMin: number;                     // Pozitif eşiği
    negativeMax: number;                    // Negatif eşiği
    alertThreshold: number;                 // Alert tetikleme
  };
  sources: {
    [source: string]: {
      enabled: boolean;
      collectionFrequency: 'realtime' | 'hourly' | 'daily';
      sentimentOverride?: number;            // Manuel ağırlık
    };
  };
  analysisRules: {
    detectIrony: boolean;                   // İroni tespiti aktif mi
    detectSarcasm: boolean;                  // Alay tespiti aktif mi
    minConfidenceScore: number;             // Min güvenilirlik
    excludeNeutralThreshold: number;         // Nötr eşiği (0.1 = çok düşük)
  };
  alertingRules: {
    negativeSpike: {
      enabled: boolean;
      threshold: number;                    // % kaç artış alarm
      timeframeHours: number;
    };
    positiveDrop: {
      enabled: boolean;
      threshold: number;                    // % kaç düşüş alarm
      timeframeHours: number;
    };
  };
  reporting: {
    frequency: 'daily' | 'weekly' | 'monthly';
    includeAspects: boolean;
    includeExamples: boolean;
    includeTrends: boolean;
  };
}
```
