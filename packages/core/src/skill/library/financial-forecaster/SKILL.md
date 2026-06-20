---
name: financial-forecaster
description: "Gelecekteki gelir/gider tahmini. Trend ekstrapolasyonu. Mevsimsel düzeltmeler. Senaryo analizi (iyimser/kötümser). Cash flow projection."
triggers:
  keywords: ["finansal tahmin", "gelir gider projeksiyonu", "cash flow", "mali tahmin", "financial forecast", "cash flow projection", "budget forecasting"]
auto_load_when: "Kullanıcı finansal tahmin, cash flow projeksiyonu veya bütçe öngörüsü taleplerinde bulunduğunda"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch", "Grep"]
---

# Finansal Tahmin Uzmanı (Financial Forecaster)

**Odak Alanı:** Gelecek gelir/gider tahmini, trend ekstrapolasyonu, senaryo analizi, cash flow projeksiyonu.

---

## Pattern 1: Veri Toplama ve Hazırlık

### Geçmiş Veri Analizi
```
Veri Hazırlama Süreci
    │
    ├── Veri Kaynakları
    │   ├── Geçmiş gelir tabanı
    │   ├── Geçmiş gider kayıtları
    │   ├── Mevsimsel veriler
    │   ├── Ekonomik göstergeler
    │   └── Sektör raporları
    │
    ├── Veri Temizleme
    │   ├── Eksik veri tamamlama
    │   ├── Aykırı değer tespiti
    │   ├── Trend bozucuları ayıkla
    │   └── Nominal -> Reel çevrim (enflasyon)
    │
    ├── Veri Normalizasyonu
    │   ├── Aylık standart
    │   ├── Para birimi birleştirme
    │   ├── Kategori standardizasyonu
    │   └── Karşılaştırılabilir ölçek
    │
    └── Analiz Dönemi
        ├── Minimum 12 ay veri
        ├── Mevsimsel etki için 24+ ay
        ├── Trend için 36+ ay ideal
        └── Güncel veri dahil edilmeli
```

### Veri Yapısı
```javascript
const veriYapısı = {
  dönem: "2025-01",
  gelirler: {
    satışGeliri: 150000,
    diğerGelir: 5000,
    toplam: 155000
  },
  giderler: {
    satınalma: 80000,
    personel: 40000,
    operasyonel: 15000,
    toplam: 135000
  },
  nakit: 20000,
  nakitAkışı: 20000 // gelir - gider
};
```

---

## Pattern 2: Trend Ekstrapolasyonu

### Tahmin Metodları
```
Tahmin Yöntemleri
    │
    ├── Basit Yöntemler
    │   ├── Ortalama (aritmetik ortalama)
    │   ├── Hareketli ortalama (3-6-12 ay)
    │   └── Üstel düzeltme (EMA)
    │
    ├── İleri Yöntemler
    │   ├── Doğrusal regresyon
    │   ├── Polinom regresyon
    │   ├── Logaritmik trend
    │   └── Zaman serisi (ARIMA)
    │
    ├── Büyüme Modelleri
    │   ├── Sabit büyüme oranı
    │   ├── Azalan büyüme (doygunluk)
    │   ├── Sigmoid (S-eğrisi)
    │   └── Mevsimsel bileşenler
    │
    └── Düzeltmeler
        ├── Enflasyon etkisi
        ├── Kur değişimi
        ├── Sektörel faktörler
        └── Tek seferlik kalemler
```

### Hareketli Ortalama Hesaplama
```
MA(n) = (D1 + D2 + ... + Dn) / n

Örnek (3 aylık MA):
- Ocak: 100
- Şubat: 110
- Mart: 105
- Nisan: 115

MA(Mart) = (100+110+105)/3 = 105
MA(Nisan) = (110+105+115)/3 = 110
```

### Doğrusal Regresyon Formülü
```
y = mx + b

m = Σ(x-x̄)(y-ȳ) / Σ(x-x̄)²
b = ȳ - m x̄

x = dönem (1, 2, 3...)
y = değer (gelir/gider)
```

---

## Pattern 3: Mevsimsel Düzeltmeler

### Mevsimsellik Analizi
```
Mevsimsel Etki Türleri
    │
    ├── Aylık Mevsimsellik
    │   ├── Yıl sonu (Aralık - yüksek)
    │   ├── Kış (Ocak-Şubat - düşük)
    │   ├── Yaz (Haziran-Ağustos - orta)
    │   └── Son çeyrek (Yüksek)
    │
    ├── Trend + Mevsimsellik
    │   ├── De-trend (trend çıkar)
    │   ├── Mevsimsel faktör hesapla
    │   ├── Tekrar trend ekle
    │   └── Düzeltilmiş tahmin
    │
    ├── Mevsimsel Faktör Hesabı
    │   ├── Her ay için ortalama
    │   ├── Yıllık ortalamaya oranla
    │   ├── Faktör = Ay ort. / Yıl ort.
    │   └── Örn: Aralık = 1.3, Ocak = 0.7
    │
    └── Çoklu Mevsimsellik
        ├── Haftalık (iş günü vs hafta sonu)
        ├── Aylık (maaş günleri)
        └── Yıllık (bayram, tatil)
```

### Mevsimsel Düzeltme Formülü
```
Düzeltilmiş = Ham Tahmin / Mevsimsel Faktör

Örnek:
- Ham tahmin (Ocak): 100000
- Ocak mevsimsel faktör: 0.8
- Düzeltilmiş: 100000 / 0.8 = 125000

(Nakit düşük çıkmasın diye düzeltme)
```

---

## Pattern 4: Senaryo Analizi

### Çoklu Senaryo Modelleme
```
Senaryo Türleri
    │
    ├── Temel Senaryo (Baz)
    │   ├── Normal büyüme
    │   ├── Mevcut politika devam
    │   └── Enflasyon hedefi dahil
    │
    ├── İyimser Senaryo
    │   ├── Yüksek büyüme (+20%)
    │   ├── Fiyat artışı
    │   ├── Yeni müşteri/müşteri
    │   └── Maliyet kontrolü
    │
    ├── Kötümser Senaryo
    │   ├── Düşük büyüme (-20%)
    │   ├── Gelir kaybı
    │   ├── Maliyet artışı
    │   └── Pazar kaybı
    │
    └── Stres Senaryosu
        ├── Ekonomik kriz
        ├── Kredi sıkılaşması
        ├── Müşteri iflası
        └── Tedarik zinciri kesintisi
```

### Senaryo Oluşturma
```javascript
function senaryoAnalizi(veri, büyümeOranı) {
  const senaryolar = {
    temel: { büyüme: 0.10, maliyet: 0.08, risk: 0.05 },
    iyimser: { büyüme: 0.20, maliyet: 0.05, risk: 0.03 },
    kötümser: { büyüme: 0.02, maliyet: 0.12, risk: 0.10 },
    stres: { büyüme: -0.15, maliyet: 0.15, risk: 0.20 }
  };
  
  const s = senaryolar[büyümeOranı];
  return {
    gelir: veri.sonGelir * (1 + s.büyüme),
    gider: veri.sonGider * (1 + s.maliyet),
    nakit: veri.sonGelir * (1 + s.büyüme) - veri.sonGider * (1 + s.maliyet),
    risk: s.risk
  };
}
```

---

## Pattern 5: Cash Flow Projeksiyonu

### Nakit Akış Tahmini
```
Cash Flow Yapısı
    │
    ├── Dönem Başı Nakit
    │
    ├── Nakit Girişleri
    │   ├── Tahsil edilen alacaklar
    │   ├── Satış gelirleri
    │   ├── Diğer gelirler
    │   └── Kredi/tahvil
    │
    ├── Nakit Çıkışları
    │   ├── Tedarikçi ödemeleri
    │   ├── Maaş/gider ödemeleri
    │   ├── Vergi/SSK ödemeleri
    │   ├── Yatırım harcamaları
    │   └── Taksit/borç ödemeleri
    │
    ├── Dönem Sonu Nakit
    │   ├── Nakit giriş - çıkış
    │   ├── + Dönem başı nakit
    │   └── = Nakit ihtiyacı
    │
    └── Kritik Noktalar
        ├── Nakit minimum (işletme sermayesi)
        ├── Nakit maximum (fazla)
        ├── Nakit açığı (finansman ihtiyacı)
        └── Kredi limiti kullanımı
```

---

## Key Patterns

| Pattern | Açıklama | Kullanım Alanı |
|---------|----------|----------------|
| Trend Analizi | Geçmiş veriden gelecek | Satış/gider tahmini |
| Mevsimsel Düzeltme | Dönemsel etki | Doğru tahmin |
| Senaryo Analizi | Çoklu gelecek | Risk planlaması |
| Cash Flow | Nakit projeksiyonu | Likidite yönetimi |
| Regresyon | İstatistiksel trend | Hassas tahmin |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```javascript
// Yanlış: Sabit büyüme varsayımı
const tahmin = geçenYıl * 1.10; // Her yıl %10 - gerçekçi değil

// Yanlış: Mevsimsel ihmal
const ocekTahmin = 100000; // Mevsimsel düzeltme yok

// Yanlış: Enflasyonsuz hesaplama
const reelDeğer = nominalDeğer; // Değer kaybı yok sayıldı

// Yanlış: Tek senaryo
const sonuç = tahmin(); // Sadece tek olasılık

// Yanlış: Tarihsel veri eksik
const tahmin = 100 * 1.1; // Sadece tek dönem var
```

### ✅ Doğru Uygulamalar

```javascript
// Doğru: Hareketli ortalama ile tahmin
function maTahmin(veriler, periyot, ileri) {
  const sonPeriyot = veriler.slice(-periyot);
  const ortalama = sonPeriyot.reduce((a, b) => a + b) / periyot;
  return ortalama;
}

// Doğru: Mevsimsel düzeltme
function mevsimselTahmin(veriler, hedefAy) {
  const mevsimsel Faktörler = {
    1: 0.7, 2: 0.7, 3: 0.9, 4: 1.0,
    5: 1.0, 6: 1.1, 7: 1.2, 8: 1.1,
    9: 1.0, 10: 1.0, 11: 1.1, 12: 1.3
  };
  
  const trend = doğrusalRegresyon(veriler);
  const hamTahmin = trend(hedefAy);
  return hamTahmin / mevsimselFaktörler[hedefAy];
}

// Doğru: Çoklu senaryo
function cashFlowSenaryolar(veriler, aylar) {
  const senaryolar = [];
  
  for (const senaryo of ["temel", "iyimser", "kötümser"]) {
    let nakit = veriler.nakit;
    for (let i = 0; i < aylar; i++) {
      nakit = nakit + gelirSenaryo(nakit, senaryo) - giderSenaryo(nakit, senaryo);
      senaryolar.push({ ay: i + 1, senaryo, nakit });
    }
  }
  return senaryolar;
}

// Doğru: Regresyon trend
function doğrinalRegresyon(veriler) {
  const n = veriler.length;
  const xOrtalama = (n - 1) / 2;
  const yOrtalama = veriler.reduce((a, b) => a + b) / n;
  
  let pay = 0, payda = 0;
  for (let i = 0; i < n; i++) {
    pay += (i - xOrtalama) * (veriler[i] - yOrtalama);
    payda += Math.pow(i - xOrtalama, 2);
  }
  
  const eğim = pay / payda;
  const kesim = yOrtalama - eğim * xOrtalama;
  
  return (x) => eğim * x + kesim;
}
```

---

## Quick Reference

| Metod | Avantaj | Dezavantaj |
|-------|---------|------------|
| Basit Ortalama | Kolay | Kısa vadeli yanıltıcı |
| Hareketli Ortalama | Düzleme | Gecikme |
| Regresyon | Trend | Dış değerler |
| ARIMA | Mevsimsel | Karmaşık |
| Senaryo | Risk analizi | Çok fazla belirsizlik |

| Mevsimsel Faktör | Değer | Not |
|-------------------|-------|-----|
| Ocak-Şubat | 0.7 | Düşük sezon |
| Mart-Nisan | 0.9-1.0 | Normal |
| Mayıs-Haziran | 1.0-1.1 | Güçlenme |
| Temmuz-Ağustos | 1.1-1.2 | Yaz sezonu |
| Eylül-Ekim | 1.0 | Normal |
| Kasım-Aralık | 1.1-1.3 | Yıl sonu |

| Senaryo | Büyüme | Risk |
|---------|--------|------|
| Temel | +10% | %5 |
| İyimser | +20% | %3 |
| Kötümser | +2% | %10 |
| Stres | -15% | %20 |
