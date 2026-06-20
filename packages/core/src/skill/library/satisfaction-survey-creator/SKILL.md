---
name: satisfaction-survey-creator
description: "NPS/CSAT anketleri. Question design. Response optimization. Analysis framework."
triggers:
  keywords: ["satisfaction survey creator", "memnuniyet anketi", "nps anketi", "csat", "müşteri memnuniyeti ölçümü"]
auto_load_when: "Kullanıcı NPS/CSAT anketleri oluşturmayı, soru tasarlamayı veya anket analizi yapmayı talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "grep", "glob"]
---

# Satisfaction Survey Creator (Memnuniyet Anketi Oluşturucu)

**Odak Alanı:** NPS (Net Promoter Score), CSAT (Customer Satisfaction Score) ve diğer memnuniyet anketlerinin tasarımı, soru optimizasyonu, yanıt oranı artırma ve analiz çerçevesi oluşturma.

---

## Pattern: Anket Oluşturma Süreci

### Adım 1: Hedef Belirleme
Anketin amacını ve ölçülecek metrikleri tanımla:
```
Anket Türleri ve Hedefleri:
NPS (Net Promoter Score)
├── Amac: Müşteri sadakatini ölçmek
├── Hedef: "Ürün/hizmeti birine önerme olasılığınız nedir?"
├── Skor: 0-10 arası
└── Hedef: +50 NPS

CSAT (Customer Satisfaction Score)
├── Amac: Spesifik etkileşimden memnuniyeti ölçmek
├── Hedef: "Bu deneyimden memnun kaldınız mı?"
├── Skor: 1-5 veya 😊😐😞
└── Hedef: >%85 memnun

CES (Customer Effort Score)
├── Amac: Görev tamamlama kolaylığını ölçmek
├── Hedef: "Bu işlemi ne kadar kolay/zor buldunuz?"
├── Skor: 1-7
└── Hedef: <3.0 CES

TAM (Total Addressable Market Feedback)
├── Amac: Genel deneyim ve beklenti ölçümü
├── Hedef: Kapsamlı deneyim analizi
└── Skor: Çoklu soru

AKADEMİK/ARAŞTIRMA
├── Amac: Derinlemesine içgörü toplama
├── Hedef: Açık uçlu detaylı yanıtlar
└── Skor: Tematik analiz
```

### Adım 2: Soru Tasarımı
Etkili ve yanıt verilebilir sorular oluştur:
```
Soru Türleri ve Kullanım:
TEKNİK SORULAR
├── Tekil seçim: "En çok hangi özelliği kullanıyorsunuz?"
├── Çoklu seçim: "Hangi kanallardan destek alıyorsunuz?"
├── Ölçek: "Deneyiminizi 1-10 arasında puanlayın"
└── Matris: "Her özelliği ayrı değerlendirin"

PSİKOLOJİK SORULAR
├── Açık uçlu: "Deneyiminizi nasıl geliştirebiliriz?"
├── Sıralama: "Önceliklerinizi sıralayın"
├── Karşılaştırmalı: "Geçen yıla göre nasıl?"
└── Senaryo: "Şu durumda ne yapardınız?"

DEMOGRAFİK SORULAR
├── Segmentasyon: "Hangi planda kullanıyorsunuz?"
├── Kullanım sıklığı: "Haftada kaç kez kullanıyorsunuz?"
└── Tenure: "Ne zamandan beri müşterisiniz?"
```

### Adım 3: Soru Sıralaması (Flow Optimization)
Yanıt oranını maksimize edecek sıralama yap:
```
Optimal Anket Akışı:
1. HOŞGELDİN
   → Kısa tanıtım (2-3 cümle)
   → Tahmini süre belirtme
   → Gizlilik güvencesi

2. GENEL MEMNUNİYET (NPS veya CSAT)
   → En önemli metrik en başta
   → Kolay cevap verilebilir
   → Genel izlenim sorusu

3. SPESİFİK KONULAR
   → Ürün/özellik değerlendirmesi
   → Destek deneyimi
   → Fiyat/değer algısı

4. AÇIK UÇLU DETAY (İsteğe bağlı)
   → "Neden bu puanı verdiniz?"
   → "Neyi geliştirmemizi istersiniz?"
   → En zor sorular sona

5. DEMOGRAFİK/DATABASE
   → Segmentasyon soruları
   → Gerekirse closure'da

6. KAPANIŞ
   → Teşekkür mesajı
   → Sonraki aksiyon (varsa)
   → İletişim bilgisi
```

### Adım 4: Yanıt Motivasyonu (Response Optimization)
Yanıt oranını artıracak stratejiler uygula:
```
Yanıt Oranı Artırma Teknikleri:
ZAMANLAMA
├── Anlık tetikleme (transaction sonrası)
├── 24-48 saat gecikme (deneyim taze)
└── Zamanlı seriler (periyodik genel anket)

UZUNLUK KONTROLÜ
├── 3 soru = %60-70 yanıt
├── 5 soru = %40-50 yanıt
├── 8+ soru = %20-30 yanıt
└── Maksimum 5 dakika hedefle

TEKNİK OPTİMİZASYON
├── Mobile-first tasarım
├── Progress bar gösterimi
├── One question per screen (mobil)
└── Auto-save (kaybolmayan yanıtlar)

TEŞVİK VE TEHDİT
├── Çekiliş/hediye (düşük değerli)
├── İlerleme göstergesi
├── Social proof ("2000+ müşteri katıldı")
└── Sonuç paylaşımı vaadi
```

### Adım 5: Analiz Çerçevesi
Toplanan verileri anlamlı metriklere dönüştür:
```
Analiz Metodolojisi:
NPS ANALİZİ
├── Detractors (0-6): %X
├── Passives (7-8): %Y
├── Promoters (9-10): %Z
├── NPS = %Promoters - %Detractors
└── Segment bazlı NPS karşılaştırması

CSAT ANALİZİ
├── Memnun (4-5): %X
├── Nötr (3): %Y
├── Memnun değil (1-2): %Z
├── CSAT = %Memnun (4-5)
└── Transaction bazlı CSAT

KORELASYON ANALİZİ
├── NPS ile hangi faktörler pozitif/negatif?
├── Hangi özellik usage artıyor?
├── Destek deneyimi churn'i etkiliyor mu?
└── Fiyat algısı memnuniyeti nasıl etkiliyor?

SEGMENTASYON
├── By plan/tier
├── By tenure (müşteri yaşı)
├── By usage level
├── By geography
└── By channel
```

### Adım 6:closed-Loop Entegrasyonu
Negatif feedback için aksiyon süreci kur:
```
Closed-Loop Süreci:
NEGATİF YANIT ALINDI
├── NPS ≤ 6 → Otomatik alert
├── CSAT ≤ 2 → Otomatik alert
└── Açık uçlu şikayet → Keyword trigger

ESKALASYON
├── <6 saat içinde ilk yanıt
├── 24 saat içinde müşteri ile iletişim
├── Issue resolution takibi
└── Sonuç loglama
```

---

## Key Patterns (Ana Kalıplar)

| Pattern | Açıklama | Uygulama |
|---|---|---|
| **Question Hierarchy** | Önce basit, sonra karmaşık | Drop-off önleme |
| **Micro-Survey** | 1-3 soruluk odaklı anket | Yanıt oranı artışı |
| **Touchpoint Triggering** | Spesifik etkileşim sonrası tetikleme | Relevance artışı |
| **Longitudinal Tracking** | Aynı sorularla zamanlı ölçüm | Trend analizi |
| **A/B Testing** | Soru/format A/B testi | Optimization |

---

## Anti-Patterns (Kaçınılması Gerekenler)

### ❌ Yanlış Uygulamalar

```yaml
# Çok uzun anket
problem: "20+ soruluk anket"
result: "%10 yanıt oranı, biased yanıtlar"

# Karmaşık jargons
problem: "'Customer effort score'u açıklamamak"
result: "Müşteri anlamaz, rastgele cevaplar"

# Leading questions
problem: "'Mükemmel hizmetimizi nasıl değerlendirdiniz?'"
result: "Pozitif bias, gerçekçi olmayan sonuçlar"

# Zamanlama hatası
problem: "Satış anında memnuniyet anketi"
result: "Satış baskısı altında gerçek dışı yanıtlar"

# Veri kullanmama
problem: "Anket yapıp sonuçları işlememek"
result: "Müşteri bunalmış hissetti, güven kaybı"
```

### ✅ Doğru Uygulamalar

```yaml
# Kısa ve odaklı anket
approach: "3-5 kritik soru, maks 5 dakika"
result: "%50+ yanıt oranı, kaliteli data"

# Sade dil
approach: "Günlük dil, açık talimatlar"
result: "Anlaşılır, doğru yanıtlar"

# Nötr sorular
approach: "'Deneyiminiz nasıldı?' formatı"
result: "Dürüst feedback"

# Doğru zamanlama
approach: "Transaction sonrası 24-48 saat bekle"
result: "Gerçekçi, olgunlaşmış değerlendirme"

# Aksiyon ile kapatma
approach: "Negatif yanıtlara 24 saat içinde yanıt"
result: "Müşteri dinlendiğini hisseder"
```

---

## Quick Reference (Hızlı Başvuru)

| Anket Türü | Soru Sayısı | Yanıt Süresi | Yanıt Oranı Hedefi | Frekans |
|---|---|---|---|---|
| NPS (tek soruluk) | 1 | <30 sn | >%40 | Ayda 1 |
| CSAT (etkileşim sonrası) | 1-3 | <1 dk | >%30 | Her transaction |
| CES | 1 | <30 sn | >%35 | Her transaction |
| Full experience survey | 5-8 | 3-5 dk | >%20 | Çeyreklik |
| In-depth research | 10-15 | 8-10 dk | >%10 | Yılda 1-2 |

| NPS Skoru | Değerlendirme | Eylem |
|---|---|---|
| 75-100 | Olağanüstü | Benchmark üstü, başarı analizi |
| 50-74 | Harika | Hedef üstü, paylaşım |
| 30-49 | İyi | Ortalamamn üstü, iyileştirme devam |
| 0-29 | Zayıf | Ortalamanın altı, acil aksiyon |
| <0 | Kötü | Negatif, kriz modu |

| Soru Formatı | Kullanım | Örnek |
|---|---|---|
| 0-10 NPS | Genel sadakat | "Ürünümüzü önerme olasılığınız?" |
| 1-5 CSAT | Transaction memnuniyeti | "Bu deneyimden memnun musunuz?" |
| 1-7 CES | Effort measurement | "Bu işlemi ne kadar kolay buldunuz?" |
| Açık uçlu | Detay toplama | "Deneyiminizi açıklar mısınız?" |
| Çoklu seçim | Segmentation | "Hangi özellikleri kullanıyorsunuz?" |
| Sıralama | Öncelik belirleme | "Önceliklerinizi sıralayın" |

| Negatif Yanıt Eşiği | Eskalasyon Süresi | Kanal |
|---|---|---|
| NPS ≤ 6 | <6 saat | E-piya → Call |
| CSAT ≤ 2 | <4 saat | E-piya öncelikli |
| CES ≥ 5 | <24 saat | E-piya |
| Açık uçlu şikayet | <24 saat | Manuel inceleme |

| Kanal | Yanıt Oranı | Kullanım |
|---|---|---|
| E-piya (sıcak) | %30-40 | Transaction sonrası |
| E-piya (soğuk) | %10-20 | Genel anket |
| In-app pop-up | %15-25 | Kullanım içi |
| SMS | %20-30 | Mobile-first |
| Telefon | %60-80 | B2B VIP |

| Metrik | Hedef | Uyarı |
|---|---|---|
| Yanıt Oranı | >%30 | <%20 |
| Tamamlama Oranı | >%70 | <%50 |
| NPS | >50 | <30 |
| CSAT | >%85 | <%75 |
| Açık Uçlu Yanıt Oranı | >%40 | <%20 |

---

## Otomasyon Parametreleri

```typescript
interface SatisfactionSurveyConfig {
  surveyType: 'nps' | 'csat' | 'ces' | 'custom' | 'comprehensive';
  questionCount: {
    min: number;
    max: number;
    targetMinutes: number;
  };
  triggerRules: {
    type: 'transaction' | 'timebased' | 'milestone' | 'manual';
    delayHours?: number;
    filters?: Record<string, unknown>;
  };
  targetingRules: {
    excludeSegments?: string[];
    includeSegments?: string[];
    minTenureDays?: number;
  };
  responseOptimizations: {
    showProgressBar: boolean;
    mobileOptimized: boolean;
    reminderEnabled: boolean;
    reminderDelayHours: number;
    reminderCount: number;
  };
  closedLoopRules: {
    enabled: boolean;
    npsThreshold: number;              // ≤6 tetikler
    csatThreshold: number;             // ≤2 tetikler
    slaResponseHours: number;
    slaResolutionHours: number;
  };
  analysisSettings: {
    segmentBy: string[];               // ['plan', 'tenure', 'region']
    reportFrequency: 'daily' | 'weekly' | 'monthly';
    exportFormats: ('csv' | 'pdf' | 'dashboard')[];
  };
}
```
