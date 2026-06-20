---
name: crypto-analyzer
description: "Kripto para trendleri ve grafik analizi. Teknik indikatörler (RSI, MACD, Bollinger). On-chain metrikler. Fear/Greed index. Arbitrage fırsatları."
triggers:
  keywords: ["kripto analiz", "crypto analiz", "teknik analiz", "trading", "RSI", "MACD", "bitcoin analiz", "altcoin"]
auto_load_when: "Kullanıcı kripto para analizi, teknik analiz veya trading stratejisi taleplerinde bulunduğunda"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch", "Grep"]
---

# Kripto Analist (Crypto Analyzer)

**Odak Alanı:** Kripto para trendleri, teknik analiz, on-chain metrikler, arbitraj fırsatları.

---

## Pattern 1: Teknik İndikatörler

### Temel İndikatörler ve Kullanımı
```
Teknik Analiz Araçları
    │
    ├── RSI (Relative Strength Index)
    │   ├── 14 periyot standart
    │   ├── Formül: 100 - (100 / (1 + RS))
    │   ├── RS = Ortalama kazanç / Ortalama kayıp
    │   ├── >70 aşırı alım (sat sinyali)
    │   ├── <30 aşırı satın (al sinyali)
    │   └── Divergans (fiyat vs RSI)
    │
    ├── MACD (Moving Average Convergence Divergence)
    │   ├── 12/26/9 standart periyotlar
    │   ├── MACD Line = EMA(12) - EMA(26)
    │   ├── Signal Line = EMA(9) of MACD
    │   ├── Histogram = MACD - Signal
    │   ├── Sinyal kesişimi (al/sat)
    │   └── Sıfır çizgisi geçişi
    │
    ├── Bollinger Bands
    │   ├── 20 periyot, 2 standart sapma
    │   ├── Üst bant = MA + 2σ
    │   ├── Alt bant = MA - 2σ
    │   ├── Sıkışma = düşük volatilite
    │   ├── Kırılma = yüksek hareket
    │   └── Bant dışı = aşırı durum
    │
    └── Moving Averages
        ├── SMA (Basit)
        ├── EMA (Üstel - daha hassas)
        ├── MA(50) (Orta vade)
        ├── MA(200) (Uzun vade)
        └── Altın ölüm kesişimi
```

### İndikatör Hesaplama Kodu
```javascript
// RSI Hesaplama
function hesapRSI(fiyatlar, periyot = 14) {
  let kazançlar = [], kayıplar = [];
  for (let i = 1; i < fiyatlar.length; i++) {
    const değişim = fiyatlar[i] - fiyatlar[i - 1];
    if (değişim > 0) kazançlar.push(değişim);
    else kayıplar.push(Math.abs(değişim));
  }
  
  const ortalamaKazanç = kazançlar.reduce((a, b) => a + b) / periyot;
  const ortalamaKayıp = kayıplar.reduce((a, b) => a + b) / periyot;
  const rs = ortalamaKazanç / (ortalamaKayıp || 1);
  return 100 - (100 / (1 + rs));
}

// MACD Hesaplama
function hesapMACD(fiyatlar) {
  const ema12 = calculateEMA(fiyatlar, 12);
  const ema26 = calculateEMA(fiyatlar, 26);
  const macdLine = ema12 - ema26;
  const signalLine = calculateEMA([macdLine], 9);
  return { macdLine, signalLine, histogram: macdLine - signalLine };
}
```

---

## Pattern 2: On-Chain Metrikler

### Blockchain Veri Analizi
```
On-Chain Göstergeler
    │
    ├── İşlem Metrikleri
    │   ├── Active Addresses ( aktif adres)
    │   ├── Transaction Count (işlem sayısı)
    │   ├── Transaction Volume (toplam değer)
    │   ├── Gas Fee (işlem ücreti)
    │   └── UTXO Age Distribution
    │
    ├── Yatırımcı Davranışı
    │   ├── Exchange Flow (borsa giriş/çıkış)
    │   ├── HODL Wave (uzun vadeli tutma)
    │   ├── Realized Cap (gerçekleşen değer)
    │   ├── MVRV Ratio (piyasa/gerçek değer)
    │   └── NVT Ratio (ağ değeri/işlem)
    │
    ├── Madenci Metrikleri
    │   ├── Hash Rate (işlem gücü)
    │   ├── Difficulty (zorluk)
    │   ├── Miner Revenue (gelir)
    │   └── Miner Location (coğrafya)
    │
    └── Türev Metrikleri
        ├── Funding Rate (funding)
        ├── Open Interest (açık pozisyon)
        ├── Liquidations (tasfiyeler)
        └── Basis (vadeli prim)
```

### Kritik On-Chain Oranları
```
MVRV (Market Value to Realized Value):
- < 1: Piyasa dibi (ucuz)
- 1-2: Normal aralık
- > 3: Piyasa tepesi (pahalı)
- < 0.5: Aşırı ucuz (dip işareti)

Stock-to-Flow (S2F):
- BTC halving etkisi
- Düşük S2F = yüksek enflasyon
- Yüksek S2F = düşük enflasyon
```

---

## Pattern 3: Fear/Greed Index

### Piyasa Duygu Analizi
```
Fear/Greed Index Bileşenleri
    │
    ├── Volatilite (%25)
    │   ├── VIX/Volatilite ölçümü
    │   ├── Ani düşüş = Fear
    │   └── Stabilite = Greed
    │
    ├── Piyasa Momentum (%25)
    │   ├── Yükseliş/düşüş momentumu
    │   ├── Hacim artışı
    │   └── Fiyat aralığı
    │
    ├── Sosyal Medya (%15)
    │   ├── Trend konuşmalar
    │   ├── Duygu analizi
    │   └── Mention sayısı
    │
    ├── Anketler (%15)
    │   ├── Yatırımcı beklentileri
    │   └── Piyasa duygu ölçümü
    │
    └── Dominans (%20)
        ├── BTC Dominans
        ├── Altcoin para girişi
        └── Risk iştahı
```

### Duygu Okuma Stratejisi
```
0-25: Aşırı Korku (Fear)
    - Fiyat düşük
    - Satış baskısı
    - Korku satışı
    - Alım fırsatı (contrarian)

25-50: Korku
    - Belirsizlik
    - Dikkatli davranış
    - Pozisyon bekleme

50-75: Açgözlülük
    - Yükseliş devam ediyor
    - FOMO başlıyor
    - Temkinli alım

75-100: Aşırı Açgözlülük (Greed)
    - Fiyat yüksek
    - Aşırı alım
    - FOMO zirve
    - Satış zamanı (contrarian)
```

---

## Pattern 4: Arbitraj Fırsatları

### Piyasa Arbitraj Stratejileri
```
Arbitraj Türleri
    │
    ├── Borsa Arbitrajı
    │   ├── Borsa A'dan al → B'de sat
    │   ├── Fiyat farkı = kar
    │   ├── Hızlı işlem gerekli
    │   ├── Working capital önemli
    │   └── Risk: Transfer süresi, slippage
    │
    ├── Triangular Arbitraj
    │   ├── BTC → ETH → USDT → BTC
    │   ├── Üçlü piyasa farkı
    │   ├── Karmaşık ama yüksek getiri
    │   └── Algoritmik işlem zorunlu
    │
    ├── Spot-Futures Arbitraj
    │   ├── Spot al → Futures sat
    │   ├── Funding karı + prime
    │   ├── Düşük risk
    │   ├── Yüksek sermaye gereksinimi
    │
    └── Cross-Chain Arbitraj
        ├── Bridge ile zincirler arası
        ├── Likidite farkları
        ├── Teknoloji riski
        └── Gelişmiş strateji
```

### Arbitraj Hesaplama
```javascript
function arbitrajHesapla(borsa1Fiyat, borsa2Fiyat, miktar, transferÜcreti) {
  const alım = borsa1Fiyat * miktar;
  const satım = borsa2Fiyat * miktar;
  const kar = satım - alım - transferÜcreti;
  const karOranı = (kar / alım) * 100;
  
  return {
    alımBorsası: borsa1Fiyat,
    satımBorsası: borsa2Fiyat,
    fark: borsa2Fiyat - borsa1Fiyat,
    kar,
    karOranı,
    karlı: kar > 0
  };
}
```

---

## Pattern 5: Grafik Formasyonları

### Teknik Formasyon Analizi
```
Klasik Formasyonlar
    │
    ├── Devam Formasyonları
    │   ├── Bayrak (Flag)
    │   │   ├── Yükseliş bayrağı: yukarı yönlü
    │   │   ├── Düşüş bayrağı: aşağı yönlü
    │   │   └── Hedef: Bayrak direği uzunluğu
    │   │
    │   ├── Üçgen (Triangle)
    │   │   ├── Yükselen üçgen (bullish)
    │   │   ├── Alçalan üçgen (bearish)
    │   │   └── Simetrik üçgen (nötr)
    │   │
    │   └── Kupa Kulp (Cup and Handle)
    │       ├── Yuvarlak dip
    │       └── Kulp = kısa düzeltme
    │
    ├── Dönüş Formasyonları
    │   ├── Çift Tepe (Double Top)
    │   │   ├── İki zirve = satış sinyali
    │   │   └── Destek kırılımı onay
    │   │
    │   ├── Çift Dip (Double Bottom)
    │   │   ├── İki dip = alım sinyali
    │   │   └── Direnç kırılımı onay
    │   │
    │   └── Omuz Baş Omuz (Head and Shoulders)
    │       ├── Ters OBO = yükseliş
    │       └── Boyun çizgisi kırılımı
    │
    └── Kritik Seviyeler
        ├── Destek (düşüşte tutar)
        ├── Direnç (yükselişte blocker)
        ├── Pivot noktaları
        └── Fibonacci seviyeleri (%23.6, %38.2, %61.8)
```

---

## Key Patterns

| Pattern | Açıklama | Kullanım Alanı |
|---------|----------|----------------|
| RSI | Momentum | Al/sat sinyali |
| MACD | Trend | Kesişim sinyali |
| Bollinger | Volatilite | Kırılma/bant dışı |
| On-Chain | Blockchain veri | Uzun vadeli değer |
| Fear/Greed | Duygu | Piyasa tepesi/dibi |
| Arbitraj | Fiyat farkı | Risk-free kar |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```javascript
// Yanlış: Tek indikatöre güvenme
if (rsi > 70) sat(); // Her zaman çalışmaz

// Yanlış: Gecikmiş sinyal
const sinyal = macdKesişim(eskiVeriler); // Güncel değil

// Yanlış: Yüksek kaldıraç
const pozisyon = 100 * 10; // 10x kaldıraç = %10 kayıp = liq

// Yanlış: Arbitraj fırsatı kaçırma
const fark = borsaA - borsaB; // Her zaman arbitraj değil

// Yanlış: Stop-loss yok
const al = fiyat; // Risk kontrolü yok
```

### ✅ Doğru Uygulamalar

```javascript
// Doğru: Çoklu indikatör onayı
function alımSinyali(fiyatlar) {
  const rsi = hesapRSI(fiyatlar);
  const macd = hesapMACD(fiyatlar);
  const bb = hesapBollinger(fiyatlar);
  
  return rsi < 30 && 
         macd.histogram > 0 && 
         fiyatlar[fiyatlar.length - 1] < bb.alt;
}

// Doğru: Pozisyon boyutlandırma
function pozisyonBoyutu(bakiye, risk, stopLoss) {
  const riskTutarı = bakiye * (risk / 100);
  const lot = riskTutarı / stopLoss;
  return Math.min(lot, bakiye * 0.1); // Max %10
}

// Doğru: Stop-loss ile risk yönetimi
function stopLossHesapla(giriş, yön) {
  const volatilite = hesapATR(fiyatlar, 14);
  const sl = yön === "long" ? 
    giriş - (volatilite * 2) : 
    giriş + (volatilite * 2);
  return sl;
}

// Doğru: On-chain değerleme
function piyasaDeğeri(coin) {
  const mvrv = coin.piyasaDeğeri / coin.gerçekleşenDeğer;
  return {
    ucuz: mvrv < 1,
    normal: mvrv 1-2,
    pahalı: mvrv > 3
  };
}
```

---

## Quick Reference

| İndikatör | Değer | Sinyal |
|-----------|-------|--------|
| RSI | >70 | Aşırı alım (sat) |
| RSI | <30 | Aşırı sat (al) |
| MACD | Histogram + | Yükseliş |
| MACD | Histogram - | Düşüş |
| BB Üst | Fiyat = | Aşırı alım |
| BB Alt | Fiyat = | Aşırı sat |

| On-Chain | Değer | Anlam |
|----------|-------|-------|
| MVRV < 1 | Dip | Ucuz |
| MVRV > 3 | Tepe | Pahalı |
| Exchange Outflow | Yüksek | Birikme |
| Hash Rate | Yüksek | Güçlü ağ |
| Active Addr | Artış | Kullanım |

| Fear/Greed | Aralık | Piyasa |
|------------|--------|--------|
| 0-25 | Aşırı Korku | Dip |
| 25-50 | Korku | Belirsiz |
| 50-75 | Açgözlülük | Yükseliş |
| 75-100 | Aşırı Açgörlük | Tepe |
