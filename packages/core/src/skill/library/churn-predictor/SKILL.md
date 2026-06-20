---
name: churn-predictor
description: "Churn prediction. Early warning signs. Risk segmentasyonu. Prevention tactics."
triggers:
  keywords: ["churn predictor", "müşteri kaybı tahmini", "churn analizi", "kayıp riski", "müşteri analizi"]
auto_load_when: "Kullanıcı müşteri kaybı (churn) tahmini, risk segmentasyonu veya önleme stratejileri oluşturmayı talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "grep", "glob"]
---

# Churn Predictor (Müşteri Kaybı Tahmincisi)

**Odak Alanı:** Müşteri davranış verilerinden churn riskini tahmin etme, erken uyarı işaretlerini tespit etme, risk segmentasyonu ve kayıp önleme taktikleri geliştirme.

---

## Pattern: Churn Tahmin ve Önleme Süreci

### Adım 1: Veri Toplama ve Feature Engineering
Churn tahmini için gerekli verileri derle:
```
Veri Kategorileri:
├── Demografik Veriler
│   ├── Müşteri yaşı/segmenti
│   ├── Şirket büyüklüğü (B2B)
│   ├── Sektör/kategori
│   └── Onboarding tarihi
├── Kullanım Verileri
│   ├── Giriş sıklığı
│   ├── Aktif özellik kullanımı
│   ├── Sessizlik dönemleri
│   └── Feature adoption hızı
├── Etkileşim Verileri
│   ├── Destek ticket sayısı
│   ├── Ticket sentiment skoru
│   ├── Şikayet oranı
│   └── Yanıt süresi
├── Finansal Veriler
│   ├── ARPU (Ortalama gelir)
│   ├── Ödeme geçmişi
│   ├── Plan değişiklikleri
│   └── İndirim alma sıklığı
└── Davranışsal Veriler
    ├── NPS puanı
    ├── Anket yanıtları
    ├── Feedback kalitesi
    └── Sosyal/dijital etkileşim
```

### Adım 2: Erken Uyarı İşaretlerini Belirleme
Churn öncesi görülen kalıpları tanımla:
```
Erken Uyarı Sinyalleri (Early Warning Signs):
Düşük Aktivasyon
├── Son 14 gün giriş yok
├── İlk hafta <3 özellik denenmiş
└── Onboarding adımları yarım kalmış

Azalan Kullanım (Usage Decline)
├── Kullanım >%30 düşüş (son 30 gün vs önceki 30)
├── Aktif kullanıcı sayısı azalıyor
├── Sık kullanılan özellikler bırakıldı
└── Session süresi kısaldı

Negatif Etkileşim
├── >2 destek ticket (son 30 gün)
├── Ticket'lar kızgın tonlu
├── Yanıt vermeme (>7 gün)
└── Şikayet konuşmaları artıyor

Finansal Uyarılar
├── İndirime rağmen yükseltme yok
├── Ödeme gecikmesi başladı
├── Fatura itirazları artıyor
└── Kullanım düşük ama ödeme normal (value gap)

Rekabetçi İz
├── Rakip aramaları tespit edildi
├── Demo talebi (rakip)
├── LinkedIn iş değişikliği (B2B)
└── Rakip pricing güncellemeleri
```

### Adım 3: Risk Skoru Hesaplama
Çok faktörlü risk skoru oluştur:
```
Risk Skoru Formülü:
Base Score = 0

# Aktivasyon Faktörleri
IF onboarding_completion < 50%      → +15 puan
IF first_week_logins < 3            → +10 puan

# Kullanım Faktörleri
IF usage_decline > 30%            → +20 puan
IF days_since_last_login > 14      → +15 puan
IF feature_adoption < 2            → +10 puan

# Etkileşim Faktörleri
IF ticket_count > 2                → +15 puan
IF ticket_sentiment < 0.3          → +20 puan
IF nps_score < 6                    → +10 puan

# Finansal Faktörler
IF payment_delays > 1              → +15 puan
IF value_gap > 60 gün               → +10 puan

# Önemlilik Çarpanları
IF VIP_customer                    → 1.5x multiplier
IF annual_contract                 → 0.7x multiplier
IF referral_source                 → 0.5x multiplier

Sonuç:
0-25: Düşük Risk (Yeşil)
26-50: Orta Risk (Sarı)
51-75: Yüksek Risk (Turuncu)
76-100: Kritik Risk (Kırmızı)
```

### Adım 4: Risk Segmentasyonu
Müşterileri anlamlı segmentlere ayır:
```
Segment Matrix (Risk × Değer):
                    │ Düşük Değer │ Orta Değer │ Yüksek Değer
────────────────────┼─────────────┼────────────┼────────────
Düşük Risk (Yeşil)  │ "İzle"      │ "Büyüt"    │ "Koruma"
Orta Risk (Sarı)    │ "Basit"     │ "Dikkat"   │ "Öncelikli"
Yüksek Risk (Turuncu)│ "Basit+"   │ "Efor"     │ "Acil"
Kritik Risk (Krmz)  │ "Basit++"  │ "Acil+"   │ "Savaş"
```

### Adım 5: Önleme Taktikleri Uygulama
Her segment için uygun aksiyon belirle:
```
Önleme Taktikleri:
DÜŞÜK RİSK + DÜŞÜK DEĞER ("İzle")
→ Otomatik e-posta serisi
→ Ürün güncellemeleri paylaşımı
→ Yılda 1-2 kez check-in

ORTA RİSK + ORTA DEĞER ("Dikkat")
→ Personalize edilmiş check-in
→ Yeni özellik tanıtımı
→ Başarı hikayesi paylaşımı

YÜKSEK RİSK + YÜKSEK DEĞER ("Öncelikli")
→ Account Manager ataması
→ Executive sponsor bağlantısı
→ Özel onboarding review
→ Custom training teklifi
→ Fiyat/plan esnekliği

KRİTİK RİSK + KRİTİK DEĞER ("Savaş")
→ Derhal phone call
→ Executive-to-executive call
→ Custom solution paketi
→ Renegotiation teklifi
→ Exit interview teklifi
→ 30-60 gün probation süresi
```

### Adım 6: Churn Önleme Kampanyası
Zamanlı ve kişiselleştirilmiş aksiyonlar başlat:
```
Kampanya Türleri:
HAFİF İYİLEŞTİRME (Mild Deterrence)
├── Educational content gönderimi
├── Success metrics raporu
├── Feature spotlight e-postları
└── 4-6 hafta süre

ORTA İYİLEŞTİRME (Medium Intervention)
├── Customer Success Manager outreach
├── 1-on-1 training teklifi
├── Ücretsiz consultanting saat
└── 2-4 hafta süre

AGRESİF İYİLEŞTİRME (Aggressive Rescue)
├── Executive outreach
├── Custom contract teklifi
├── Price freeze guarantee
├── Extended trial (rakip ürün)
└── Hemen başlangıç
```

---

## Key Patterns (Ana Kalıplar)

| Pattern | Açıklama | Uygulama |
|---|---|---|
| **Behavioral Tracking** | Davranış değişikliği izleme | Anormallik tespiti |
| **Predictive Scoring** | ML tabanlı skor tahmini | Feature-based model |
| **Segmentation-Based Action** | Segmente göre aksiyon | Matrix routing |
| **Time-Decay Weighting** | Zaman azaldıkça ağırlık artar | Recent behavior focus |
| **Intervention Triangulation** | Çoklu kanal kombinasyonu | E-posta + call + in-app |

---

## Anti-Patterns (Kaçınılması Gerekenler)

### ❌ Yanlış Uygulamalar

```yaml
# Sadece son ödemeye bakmak
problem: "Finansal veri tek gösterge"
result: "Value gap yakalanmaz, erken uyarı kaçırılır"

# Herkesi aynı kategoride görmek
problem: "Tüm 'orta risk' müşterilere aynı aksiyon"
result: "High-value müşteri kaybı, düşük değerli gereksiz efor"

# Reaktif yaklaşım
problem: "Churn olduktan sonra müdahale"
result: "Çok geç, müşteri geri dönmez"

# Aşırı agresif müdahale
problem: "Risk düşükken de CCM atamak"
result: "Maliyet artışı, müşteri bunaltma"

# Genel kampanya
problem: "Kişiselleştirme yok, herkese aynı mail"
result: "Düşük open rate, düşük etki"
```

### ✅ Doğru Uygulamalar

```yaml
# Çok boyutlu izleme
approach: "Kullanım + etkileşim + finans + davranış kombinasyonu"
result: "Holistik risk görünürlüğü"

# Değer × Risk matrisi
approach: "Müşteri değeri de hesaba katılarak aksiyon"
result: "Kaynak verimliliği + doğru öncelik"

# Proaktif müdahale
approach: "Risk >50 iken aksiyon başlat"
result: "Churn prevention daha etkili"

# Segment-difference aksiyonlar
approach: "Her segment için özel playbook"
result: "Personalized deneyim"

# Kişiselleştirilmiş iletişim
approach: "Müşterinin kullandığı özellikleri referans göster"
result: " Relevance artar, churn risk düşer"
```

---

## Quick Reference (Hızlı Başvuru)

| Erken Uyarı Sinyali | Eşik Değer | Risk Puanı |
|---|---|---|
| Son giriş (gün) | >14 gün | +15 |
| Kullanım düşüşü | >%30 | +20 |
| Ticket sayısı | >2/ay | +15 |
| Ticket sentiment | <0.3 | +20 |
| NPS | <6 | +10 |
| Onboarding tamamlanma | <%50 | +15 |
| Ödeme gecikmesi | >1 kez | +15 |
| Özellik kullanımı | <2 özellik | +10 |

| Segment | Risk Skoru | Değer | Aksiyon | Süre |
|---|---|---|---|---|
| Koruma | Düşük | Yüksek | Yıllık review + gift | 4-6 hafta |
| Öncelikli | Orta-Yüksek | Yüksek | CSM + exec call | 1-2 hafta |
| Savaş | Kritik | Yüksek | Rescue team + custom deal | Hemen |
| Basit | Orta-Yüksek | Düşük | Automated nurture | 6-8 hafta |

| Kampanya Türü | Hedef Segment | Kanal | Mesaj |
|---|---|---|---|
| Re-engagement | Tüm riskli | E-piya | "Sizi özledik" |
| Value reminder | Orta risk | E-piya + in-app | Kullanılmayan özellik vurgusu |
| Health score | Yüksek risk | E-piya | Müşteriye özel rapor |
| Executive outreach | Kritik + VIP | Phone + email | Custom solution |
| Win-back | Churned | Multi-channel | Neden gittikleri analiz |

| Churn Nedeni | Erken İşaret | Önleme Taktiği |
|---|---|---|
| Fiyat artışı | Değer gap şikayeti | ROI raporu paylaşımı |
| Rakip teklifi | Demo araştırması | Competitive analysis |
| Internal değişiklik | Yönetim değişikliği | Executive relationship |
| Kullanım zorluğu | Support ticket artışı | Training teklifi |
| Ürün uyumsuzluğu | Feature request düşüşü | Onboarding review |

| Metrik | Hedef | Uyarı |
|---|---|---|
| Churn Prediction Accuracy | >%85 | <%80 |
| Early Warning Detection | >%70 | <%60 |
| Prevention Success Rate | >%30 | <%20 |
| False Positive Rate | <%15 | >%20 |
| Intervention Response Rate | >%40 | <%30 |

---

## Otomasyon Parametreleri

```typescript
interface ChurnPredictorConfig {
  scoringWeights: {
    [feature: string]: number;        // Feature önem ağırlıkları
    timeDecayFactor: number;           // Zaman azalma faktörü
  };
  riskThresholds: {
    low: number;                        // 0-25
    medium: number;                     // 26-50
    high: number;                       // 51-75
    critical: number;                   // 76+
  };
  valueThresholds: {
    [segment: string]: number;          // Değer segmentasyonu
  };
  earlyWarningRules: {
    [signal: string]: {
      threshold: number;
      riskPoints: number;
      lookbackDays: number;
    };
  };
  interventionPlaybooks: {
    [segment: string]: {
      channels: string[];
      messageTemplate: string;
      escalationThreshold: number;
      slaHours: number;
    };
  };
  monitoringFrequency: 'daily' | 'weekly';
}
```
