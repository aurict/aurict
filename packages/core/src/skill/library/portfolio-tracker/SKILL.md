---
name: portfolio-tracker
description: "Hisse senedi ve kripto portföy takibi. Piyasa analizi. Teknik analiz (trend, destek-direnç). Portföy çeşitlendirme. Risk/yatırım profili."
triggers:
  keywords: ["portföy takibi", "hisse senedi", "yatırım", "borsa", "portfolio", "stock tracker", "investment", "crypto portfolio"]
auto_load_when: "Kullanıcı portföy takibi, hisse senedi analizi veya yatırım portföyü yönetimi taleplerinde bulunduğunda"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch", "Grep"]
---

# Portföy Takipçisi (Portfolio Tracker)

**Odak Alanı:** Hisse senedi ve kripto portföy takibi, piyasa analizi, teknik analiz, portföy çeşitlendirme.

---

## Pattern 1: Portföy Temel Analizi

### Veri Toplama ve Analiz Yapısı
```
Portföy Analiz Süreci
    │
    ├── Varlık Sınıfı Analizi
    │   ├── Hisse Senetleri
    │   │   ├── Performans (1Y, 3Y, 5Y)
    │   │   ├── F/K Oranı
    │   │   ├── PD/DD Oranı
    │   │   └── Temettü verimi
    │   │
    │   ├── Tahviller
    │   │   ├── Vade
    │   │   ├── Faiz oranı
    │   │   └── Kredi notu
    │   │
    │   ├── Kripto Paralar
    │   │   ├── Piyasa değeri
    │   │   ├── Hacim
    │   │   └── Likidite
    │   │
    │   └── Nakit/Alternatif
    │       ├── Mevduat
    │       ├── Altın
    │       └── Gayrimenkul
    │
    ├── Performans Metrikleri
    │   ├── Toplam getiri
    │   ├── Yıllıklandırılmış getiri (CAGR)
    │   ├── Volatilite (Standart sapma)
    │   ├── Sharpe oranı
    │   └── Maksimum çekilme (Drawdown)
    │
    └── Risk Analizi
        ├── Beta (Piyasa duyarlılığı)
        ├── Value at Risk (VaR)
        ├── Beta çeşitlendirme
        └── Korelasyon analizi
```

### Adım Adım Uygulama
1. **Varlıkları listele:** Tüm yatırımları kategorize et
2. **Güncel değerleri al:** Piyasa fiyatlarını çek
3. **Performansı hesapla:** Getiri, kayıp, volatilite
4. **Ağırlıkları belirle:** Yüzdelik dağılım
5. **Risk metriklerini hesapla:** Beta, VaR, Sharpe

---

## Pattern 2: Teknik Analiz

### Grafik Analiz Araçları
```
Teknik Analiz Katmanları
    │
    ├── Trend Analizi
    │   ├── Yükseliş trendi (Higher highs)
    │   ├── Düşüş trendi (Lower lows)
    │   └── Sideways ( Konsolidasyon)
    │
    ├── Destek ve Direnç
    │   ├── Statik destek/direnç
    │   ├── Dinamik (moving average)
    │   ├── Fibonacci retracement
    │   └── Pivot noktaları
    │
    ├── Formasyonlar
    │   ├── Bayrak (Flag)
    │   ├── Üçgen (Triangle)
    │   ├── Çift tepe/çift dip
    │   ├── Omuz baş omuz
    │   └── Kupa kulp
    │
    └── Hacim Analizi
        ├── Yükselişte hacim artışı
        ├── Düşüşte hacim azalması
        └── Hacim patlaması (Breakout)
```

### İndikatör Kategorileri
- **Trend İndikatörleri:** Moving Average, MACD, ADX
- **Momentum İndikatörleri:** RSI, Stochastic, CCI
- **Volatilite İndikatörleri:** Bollinger Bands, ATR
- **Hacim İndikatörleri:** OBV, VWAP, MFI

---

## Pattern 3: Portföy Çeşitlendirme

### Dağıtım Stratejileri
```
Portföy Dağıtım Modelleri
    │
    ├── Geleneksel Modeller
    │   ├── 60/40 (Hisse/Tahvil)
    │   ├── 80/20 (Agresif)
    │   ├── 40/60 (Muhafazakar)
    │   └── 50/25/25 (Üçlü dağılım)
    │
    ├── Risk Bazlı Modeller
    │   ├── Risk parity
    │   ├── Minimum variance
    │   └── Maximum Sharpe
    │
    ├── Varlık Sınıfı Dağılımı
    │   ├── Gelişmiş piyasalar (%40)
    │   ├── Yükselen piyasalar (%20)
    │   ├── Tahviller (%25)
    │   ├── Alternatif (%10)
    │   └── Nakit (%5)
    │
    └── Coğrafi Dağılım
        ├── Amerika (%35-45)
        ├── Avrupa (%20-30)
        ├── Asya (%15-25)
        └── Diğer (%5-10)
```

### Korelasyon Matrisi
- Düşük korelasyonlu varlıklar seç
- Aynı sektördeki varlıklardan kaçın
- Mevsimsel etkileri dengele

---

## Pattern 4: Yatırım Profili Belirleme

### Risk Toleransı Analizi
```
Yatırım Profili Türleri
    │
    ├── Muhafazakar
    │   ├── Risk toleransı: Düşük
    │   ├── Yatırım ufku: Kısa (1-3 yıl)
    │   ├── Dağılım: %70 tahvil, %30 hisse
    │   └── Örnek: Emeklilik fonu
    │
    ├── Dengeli
    │   ├── Risk toleransı: Orta
    │   ├── Yatırım ufku: Orta (3-7 yıl)
    │   ├── Dağılım: %50 hisse, %50 tahvil
    │   └── Örnek: Bireysel emeklilik
    │
    ├── Büyüme
    │   ├── Risk toleransı: Yüksek
    │   ├── Yatırım ufku: Uzun (7-15 yıl)
    │   ├── Dağılım: %80 hisse, %20 tahvil
    │   └── Örnek: Genç yatırımcı
    │
    └── Agresif
        ├── Risk toleransı: Çok yüksek
        ├── Yatırım ufku: Çok uzun (15+ yıl)
        ├── Dağılım: %100 hisse/kripto
        └── Örnek: Risk sermayesi
```

---

## Key Patterns

| Pattern | Açıklama | Kullanım Alanı |
|---------|----------|----------------|
| Temel Analiz | Şirket/piyasa verileri | Uzun vadeli yatırım |
| Teknik Analiz | Grafik/formasyon | Kısa-orta vadeli |
| Portföy Dağıtım | Varlık çeşitlendirme | Risk yönetimi |
| Risk Profili | Yatırımcı davranışı | Strateji belirleme |
| Performans | Getiri metrikleri | Değerlendirme |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```javascript
// Yanlış: Tek hisseye yatırım
const portfolio = { "THYAO": 10000 }; // Tüm sermaye tek hisse

// Yanlış: Duyguya göre işlem
if (fiyat < 50) sat(); // Fiyat düşüşü = panik satış

// Yanlış: Giriş/çıkış zamanlaması
const islem = Math.random() > 0.5 ? "al" : "sat"; // Rastgele

// Yanlış: Performans karşılaştırması
const karşılaştırma = portfoyGetiri / hisseGetiri; // Farklı dönem
```

### ✅ Doğru Uygulamalar

```javascript
// Doğru: Çeşitlendirilmiş portföy
const portfolio = {
  hisse: { "THYAO": 2000, "GARAN": 3000, "EREGL": 2000 },
  tahvil: 2000,
  kripto: 500,
  nakit: 500
};

// Doğru: Teknik analiz ile karar
function alimSinyali(hisse) {
  const rsi = hesaplaRSI(hisse);
  const trend = belirleTrend(hisse.fiyatlar);
  return rsi < 30 && trend === "yuksek";
}

// Doğru: Risk-adjusted return
function sharpeHesapla(getiri, risksizOran, standartSapma) {
  return (getiri - risksizOran) / standartSapma;
}

// Doğru: Dönemsel rebalancing
if (Date.now() - sonRebalance > 365 * 24 * 60 * 60 * 1000) {
  rebalance(portfoy, hedefAgirliklar);
}
```

---

## Quick Reference

| Metrik | Açıklama | İdeal Değer |
|--------|----------|-------------|
| Sharpe Oranı | Risk-adjusted getiri | > 1.0 |
| Beta | Piyasa duyarlılığı | 0.8-1.2 |
| Alpha | Piyasa üstü getiri | > 0 |
| F/K | Fiyat/Kazanç oranı | Sektör ortalaması |
| PD/DD | Piyasa değeri/Defter değeri | < 3 |
| Temettü | Kar payı verimi | > 2% |
| CAGR | Yıllık bileşik getiri | Piyasa üstü |
| Volatilite | Getiri standart sapması | < 20% |
| Max Drawdown | En yüksek kayıp | < 20% |
| VaR (95%) | 1 günlük maks kayıp | < 2% |
| Correlation | Varlıklar arası ilişki | < 0.5 |

| İndikatör | Tip | Sinyal |
|-----------|-----|--------|
| RSI (14) | Momentum | <30 al, >70 sat |
| MACD | Trend | Sinyal kesişimi |
| MA (50/200) | Trend | Altüst kesişim |
| Bollinger | Volatilite | Band dışı hareket |
| ADX | Trend gücü | >25 güçlü trend |
