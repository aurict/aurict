---
name: refund-processor
description: "İade prosedürü. Refund policy. Escalation path. Customer retention."
triggers:
  keywords: ["refund processor", "iade işlemci", "para iadesi", "ücret iadesi", "geri ödeme"]
auto_load_when: "Kullanıcı iade taleplerini işleme almayı, iade yanıtları oluşturmayı veya iade politikası dokümantasyonu hazırlamayı talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "grep", "glob"]
---

# Refund Processor (İade İşlemcisi)

**Odak Alanı:** İade taleplerinin otomatik işlenmesi, iade politikası kurallarının uygulanması, yükseltme (escalation) yollarının belirlenmesi ve müşteri retainasyon stratejileri.

---

## Pattern: İade Talep İşleme Süreci

### Adım 1: Talep Analizi
İade talebini değerlendir ve kategorize et:
```
İade Nedenleri:
├── Ürün/Service Hatası
│   ├── Ürün açıklamaya uymuyor
│   ├── Bozuk/Hasarlı ürün
│   └── Taahhüt edilen kalite yok
├── Yanlış Sipariş
│   ├── Yanlış ürün geldi
│   ├── Boyut/Model yanlışlığı
│   └── Tekrar sipariş hatası
├── Müşteri Pişmanlığı
│   ├── Beğenmedim
│   ├── İhtiyacım yok
│   └── Farklı ürün tercih ettim
├── Geçersiz/Tekrar Ödeme
│   ├── Çift ödeme yapılmış
│   ├── Yanlış tutar çekilmiş
│   └── Zaten iade edilmiş
└── Kötüye Kullanım
    ├── Sahte iade talebi
    └── Policy dışı kullanım
```

### Adım 2: Policy Kontrolü
İade koşullarını mevcut politikaya göre kontrol et:
```
Policy Kuralları Kontrol Listesi:
□ Satın alma tarihi mi (30/60/90 gün sınırı)?
□ Ürün durumu uygun mu?
□ Orijinal ambalaj var mı?
□ Ekstre/fatura kanıtı mevcut mu?
□ Daha önce iade yapıldı mı?
□ Loyalty programı etkileniyor mu?
□ Promosyon/kampanya kapsamında mı?
```

### Adım 3: Otomatik Karar
Kural setine göre karar ver:
```
Karar Matrisi:
Koşul                                      → Karar
─────────────────────────────────────────────────────────
30 gün içinde + orijinal paket + fatura    → ONAYLA (Otomatik)
31-60 gün + ürün açık değil + fatura       → ONAYLA (Manuel onay)
61-90 gün + özel durum + fatura            → KOŞULLU ONAY (Supervisor)
>90 gün                                     → REDDET (Policy dışı)
Hasarlı ürün + kanıt                       → ONAYLA (Ücretsiz)
Tekrar ödeme + kanıt                       → ONAYLA (Hemen)
```

### Adım 4: Retainasyon Değerlendirmesi
Müşteri kaybetme riskini değerlendir:
```
Retainasyon Risk Skoru:
├── Müşteri Değeri
│   ├── VIP/Premium müşteri (+20 puan)
│   ├── Tekrar eden müşteri (+15 puan)
│   └── Yeni müşteri (+5 puan)
├── Interaction Geçmişi
│   ├── Daha önce şikayet yok (+10 puan)
│   ├── 1-2 şikayet (+5 puan)
│   └── 3+ şikayet (-10 puan)
├── İade Nedeni
│   ├── Ürün hatası (+15 puan) [suçlu biziz]
│   ├── Müşteri pişmanlığı (-5 puan)
│   └── Yanlış sipariş (+10 puan) [suçlu biziz]
└── Toplam Skor:
    ├── >50: Retainasyon kampanyası + iade onayla
    ├── 30-50: Retainasyon teklifi + iade onayla
    └── <30: Standart iade süreci
```

### Adım 5: Yanıt Oluşturma
Uygun ton ve içerikle yanıt hazırla:
```
Yanıt Türleri:
OTOMATİK ONAY:
→ "Talebiniz onaylandı. 3-5 iş günü içinde hesabınıza para iadesi yapılacaktır."

KOŞULLU ONAY:
→ "Talebiniz inceleniyor. Ürün fotoğrafı göndermenizi rica ediyoruz."

REDDETME:
→ "Talebiniz maalesef iade politikamız kapsamı dışındadır. [Neden] [Alternatif çözüm]"

ESKALASYON:
→ "Talebiniz uzman ekibimize iletildi. 24 saat içinde size dönüş yapacağız."
```

### Adım 6: Retainasyon Aksiyonu (Gerekirse)
Retainasyon riski yüksekse ek aksiyon öner:
```
Retainasyon Araçları:
├── İndirim Kuponu (%10-20)
├── Ücretsiz Kargo
├── Sonraki Alışverişte İndirim
├── Loyalty Puan Hediyesi
├── Özel Destek Hattı
└── Ücretsiz Upgrade
```

### Adım 7: İşlem Tamamlama
İadeyi sistemde işleme al:
```
İade İşlem Adımları:
1. Refund ID oluştur
2. Finans sistemine bildir
3. Müşteriye onay e-postası gönder
4. Ürün/iade takip numarası ver
5. Retainasyon aksiyonlarını logla
6. İade nedenini analitik için etiketle
```

---

## Key Patterns (Ana Kalıplar)

| Pattern | Açıklama | Senaryo |
|---|---|---|
| **Rule-Based Decisioning** | Kural setine göre otomatik karar | Standart iade talepleri |
| **Risk-Based Routing** | Risk skoruna göre yönlendirme | Yüksek değerli müşteriler |
| **Retainasyon Layering** | Katmanlı retainasyon stratejileri | Farklı müşteri segmentleri |
| **Compensation Tiers** | Tazminat seviyeleri | Hata türüne göre |
| **Grace Period Handling** | Esnek süre yönetimi | Özel durumlar |

---

## Anti-Patterns (Kaçınılması Gerekenler)

### ❌ Yanlış Uygulamalar

```yaml
# Her reddetmeyi aynı tutmak
problem: "Tüm reddetmelerde aynı standart metin"
result: "Müşteri öfkelenir, sosyal medyaya yansır"

# Sadece red/onay, ara çözüm yok
problem: "Ya onayla ya reddet, başka seçenek yok"
result: "Potansiyel retainasyon fırsatları kaçırılır"

# Retainasyonu her durumda zorlamak
problem: "Reddetme durumunda bile kupon dayatması"
result: "Müşteri manipüle edilmiş hisseder"

# İade süresini uzatmak
problem: "Gereksiz belge talepleri ile geciktirmek"
result: "Müşteri kaybı + negatif review"

# Retainasyon maliyetini gizlemek
problem: "Kullanıcıya toplam maliyeti söylememek"
result: "Sonradan sürpriz, güven kaybı"
```

### ✅ Doğru Uygulamalar

```yaml
# Neden reddettiğini açıkça belirtme
approach: "Reddetme metninde policy madde numarası ver + alternatif sun"
result: "Müşteri anlar, ikili azalır"

# Ara çözümler sunma
approach: "Kısmi iade, kupon, değişim seçenekleri"
result: "Retainasyon oranı artar"

# Retainasyon teklifini opsiyonel yapma
approach: "'İade yerine 20% indirim alabilirsiniz - ister misiniz?'"
result: "Müşteri tercih eder,Positive deneyim"

# Hızlı süreç
approach: "Tüm belgelerhazırsa 24 saat içinde karar"
result: "Müşteri memnuniyeti artar"

# Şeffaf maliyet hesabı
approach: "İade tutarı, kesinti (varsa), net tutarı açıkça göster"
result: "Güvenilirlik artar"
```

---

## Quick Reference (Hızlı Başvuru)

| İade Nedeni | Otomatik Karar | Koşul | Retainasyon |
|---|---|---|---|
| Ürün hatası (bizim hatamız) | Onayla | Kanıt + süre içinde | Orta (+15 puan) |
| Yanlış sipariş (bizim hatamız) | Onayla | Kanıt + süre içinde | Düşük (+10 puan) |
| Müşteri pişmanlığı | Koşullu | 30 gün + orijinal paket | Yüksek (-5 puan) |
| Geç ödeme/çift ödeme | Onayla | Banka ekstreli kanıt | Düşük |
| Hasarlı ürün (kargo) | Onayla | Fotoğraf kanıtı | Orta |
| Kötüye kullanım | Reddet | Policy ihlali | Yok |

| Retainasyon Skoru | Aksiyon | İade Kararı |
|---|---|---|
| >70 (VIP) | Özel kupon + öncelikli işlem | Onayla + retention teklifi |
| 50-70 | İndirim teklifi | Onayla + retention sormadan |
| 30-50 | Değişim alternatifi | Koşullu onay |
| <30 | Standart süreç | Policy'ye göre |

| Tazminat Türü | Tutar | Koşul |
|---|---|---|
| Tam iade | %100 | Hata bizim |
| Kısmi iade | %50-75 | Paylaşımlı hata |
| Kupon + Kargo | Değer = iade | Müşteri pişmanlığı |
| Değişim | Eşit/değerli ürün | Uygun stok |
| Store credit | %110 değer | Tercih edilirse |

| SLA | Hedef | Maximum |
|---|---|---|
| Otomatik karar süresi | <1 saat | 4 saat |
| Manuel inceleme süresi | <24 saat | 48 saat |
| İade işleme (onay sonrası) | 3-5 iş günü | 7 iş günü |
| Müşteri yanıt süresi | <24 saat | 48 saat |

| Metrik | Hedef | Uyarı |
|---|---|---|
| Otomatik Karar Oranı | >%80 | <%70 |
| Retainasyon Oranı (teklif sonrası) | >%25 | <%15 |
| Müşteri Memnuniyeti (iade sonrası) | >%70 | <%60 |
| SLA Uyum Oranı | >%95 | <%90 |
| İade Fraud Oranı | <%2 | >%5 |

---

## Otomasyon Parametreleri

```typescript
interface RefundProcessorConfig {
  autoApprovalThreshold: number;        // Gün bazlı otomatik onay sınırı
  maxAutoRefundAmount: number;         // Otomatik onay maksimum tutarı
  retentionScoreThreshold: number;      // Retainasyon aksiyonu eşiği
  compensationTiers: {
    [reason: string]: {
      type: 'full' | 'partial' | 'coupon' | 'exchange';
      percentage?: number;
      conditions: string[];
    };
  };
  escalationRules: {
    minAmount: number;
    minCustomerTier: string;
    maxAttempts: number;
  };
  slaTargets: {
    autoDecisionMinutes: number;
    manualReviewHours: number;
    refundProcessingDays: number;
  };
}
```
