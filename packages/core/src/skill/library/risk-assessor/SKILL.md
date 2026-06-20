---
name: risk-assessor
description: "Yatırım risk derecelendirme. Risk metrikleri (Sharpe, VaR). Risk toleransı belirleme. Çeşitlendirme analizi. Stres testleri."
triggers:
  keywords: ["risk değerlendirme", "yatırım riski", "risk analizi", "risk assessor", "VaR", "Sharpe oranı", "risk metrikleri"]
auto_load_when: "Kullanıcı yatırım risk analizi, risk metrikleri veya portföy risk değerlendirmesi taleplerinde bulunduğunda"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch", "Grep"]
---

# Risk Değerlendirici (Risk Assessor)

**Odak Alanı:** Yatırım risk derecelendirme, risk metrikleri, çeşitlendirme analizi, stres testleri.

---

## Pattern 1: Risk Metrikleri ve Hesaplama

### Temel Risk Ölçütleri
```
Risk Metrikleri Kategorileri
    │
    ├── Volatilite Ölçütleri
    │   ├── Standart Sapma
    │   │   ├── Getiri dağılımı
    │   │   ├── σ (sigma)
    │   │   ├── Düşük = istikrarlı
    │   │   └── Yüksek = volatil
    │   │
    │   ├── Beta (β)
    │   │   ├── Piyasa duyarlılığı
    │   │   ├── β = 1: Piyasa ile eş
    │   │   ├── β > 1: Piyasa üstü risk
    │   │   └── β < 1: Piyasa altı risk
    │   │
    │   └── Alpha (α)
    │       ├── Piyasa üstü getiri
    │       ├── α > 0: Üstün performans
    │       └── α < 0: Piyasa altı
    │
    ├── Risk-Adjusted Metrikler
    │   ├── Sharpe Oranı
    │   │   ├── (Getiri - Risksiz Oran) / Std Sapma
    │   │   ├── > 1.0: İyi
    │   │   ├── > 2.0: Çok iyi
    │   │   └── < 0: Yetersiz
    │   │
    │   ├── Sortino Oranı
    │   │   ├── Sadece aşağı yönlü risk
    │   │   ├── Düşüş volatilitesi
    │   │   └── Daha hassas
    │   │
    │   └── Treynor Oranı
    │       ├── Beta ile normalize
    │       ├── Portföy yöneticisi değerlendirmesi
    │       └── α / β
    │
    └── Maximum Drawdown
        ├── En yüksek zirve-dip farkı
        ├── Maksimum kayıp
        ├── Toparlanma süresi
        └── Risk iştahı göstergesi
```

### Formüller ve Hesaplama
```javascript
// Standart Sapma
function standartSapma(getiriler) {
  const ortalama = getiriler.reduce((a, b) => a + b) / getiriler.length;
  const varyans = getiriler.reduce((t, g) => t + Math.pow(g - ortalama, 2), 0) / getiriler.length;
  return Math.sqrt(varyans);
}

// Sharpe Oranı
function sharpeOranı(getiriler, risksizOran = 0.15) {
  const ortalamaGetiri = getiriler.reduce((a, b) => a + b) / getiriler.length;
  const std = standartSapma(getiriler);
  return (ortalamaGetiri - risksizOran) / std;
}

// Value at Risk (VaR) - Parametrik
function varParametrik(getiriler, güven = 0.95) {
  const std = standartSapma(getiriler);
  const ortalama = getiriler.reduce((a, b) => a + b) / getiriler.length;
  const z = 1.65; // %95 güven
  return ortalama - (z * std);
}
```

---

## Pattern 2: Risk Toleransı Belirleme

### Yatırımcı Profil Analizi
```
Risk Toleransı Ölçümü
    │
    ├── Psikolojik Risk
    │   ├── Kayıp toleransı
    │   ├── Stres seviyesi
    │   ├── Panik satış eğilimi
    │   └── Uzun vadeli düşünme
    │
    ├── Finansal Risk
    │   ├── Gelir istikrarı
    │   ├── Acil durum fonu
    │   ├── Borç seviyesi
    │   └── Yatırılabilir süre
    │
    ├── Zaman Ufku
    │   ├── Kısa vade (0-2 yıl)
    │   │   └── Düşük risk
    │   ├── Orta vade (2-7 yıl)
    │   │   └── Orta risk
    │   ├── Uzun vade (7-15 yıl)
    │   │   └── Yüksek risk
    │   └── Çok uzun (15+ yıl)
    │       └── Çok yüksek risk
    │
    └── Piyasa Bilgisi
        ├── Deneyim seviyesi
        ├── Bilgi düzeyi
        ├── Karar verme stili
        └── Strateji türü
```

### Risk Profil Türleri
```
Muhafazakar (Conservative)
- Amacı: Sermaye koruma
- Risk: Düşük
- Portföy: %80-90 tahvil, %10-20 hisse
- Zaman ufku: Kısa-orta

Dengeli (Balanced)
- Amacı: Büyüme + koruma
- Risk: Orta
- Portföy: %50 hisse, %40 tahvil, %10 alternatif
- Zaman ufku: Orta

Büyüme (Growth)
- Amacı: Uzun vadeli büyüme
- Risk: Yüksek
- Portföy: %70-80 hisse, %20-30 tahvil
- Zaman ufku: Uzun

Agresif (Aggressive)
- Maksimum büyüme
- Çok yüksek risk
- %90-100 hisse/kripto
- Çok uzun zaman ufku
```

---

## Pattern 3: Portföy Çeşitlendirme Analizi

### Dağıtım ve Korelasyon
```
Çeşitlendirme İlkeleri
    │
    ├── Varlık Sınıfı Dağılımı
    │   ├── Hisse senetleri
    │   ├── Tahviller
    │   ├── Gayrimenkul
    │   ├── Emtia
    │   ├── Kripto
    │   └── Nakit
    │
    ├── Sektörel Dağılım
    │   ├── Teknoloji
    │   ├── Finans
    │   ├── Sağlık
    │   ├── Enerji
    │   ├── Tüketim
    │   └── Sanayi
    │
    ├── Coğrafi Dağılım
    │   ├── Gelişmiş piyasalar
    │   ├── Yükselen piyasalar
    │   ├── Bölgesel ağırlık
    │   └── Kur riski
    │
    └── Korelasyon Matrisi
        ├── Düşük korelasyon = iyi
        ├── Yüksek korelasyon = riskli
        ├── Negatif = mükemmel
        └── Hedef: < 0.5 ortalama
```

### Optimal Dağıtım
```javascript
// Minimum Varyans Portföyü
function minVaryans(varlıkGetiriler, kovaryansMatris) {
  const n = varlıkGetiriler.length;
  // Matris hesaplamaları
  // Ağırlık optimizasyonu
  // Min variance ağırlıkları
  return ağırlıklar;
}

// Risk Parity
function riskParity(varlıkGetiriler, stdSapmalar) {
  const toplamRisk = stdSapmalar.reduce((a, b) => a + 1/b, 0);
  const ağırlıklar = stdSapmalar.map(s => (1/s) / toplamRisk);
  return ağırlıklar;
}
```

---

## Pattern 4: Stres Testleri

### Senaryo Bazlı Analiz
```
Stres Test Türleri
    │
    ├── Tarihsel Senaryolar
    │   ├── 2008 Finansal Kriz
    │   ├── 2020 Covid Çöküşü
    │   ├── 2022 Fed sıkılaşması
    │   └── 2018 kur krizi
    │
    ├── Varsayımsal Senaryolar
    │   ├── %30 borsa düşüşü
    │   ├── %20 kur değer kaybı
    │   ├── %50 faiz artışı
    │   └── Enflasyon %30+
    │
    ├── Portföy Bazlı
    │   ├── Tek varlık kaybı
    │   ├── Sektör çöküşü
    │   ├── Likidite krizi
    │   └── Faiz/vade riski
    │
    └── Özel Durumlar
        ├── Savaş/jeopolitik
        ├── Doğal afet
        ├── Düzenleyici değişiklik
        └── Teknolojik kesinti
```

### Stres Testi Hesaplama
```javascript
// Portföy stres testi
function stresTesti(portföy, senaryo) {
  let toplamDeğer = 0;
  
  for (const varlık of portföy) {
    const etki = senaryo[varlık.tür] || 0;
    const yeniDeğer = varlık.değer * (1 + etki);
    toplamDeğer += yeniDeğer;
  }
  
  const kayıp = portföy.toplam - toplamDeğer;
  const kayıpOranı = (kayıp / portföy.toplam) * 100;
  
  return { toplamDeğer, kayıp, kayıpOranı, kritik: kayıpOranı > 20 };
}

// Senaryo örneği
const senaryo = {
  hisse: -0.30,
  tahvil: -0.10,
  kripto: -0.50,
  gayrimenkul: -0.20,
  nakit: 0
};
```

---

## Key Patterns

| Pattern | Açıklama | Kullanım Alanı |
|---------|----------|----------------|
| Sharpe Oranı | Risk-adjusted getiri | Performans değerlendirme |
| VaR | Maksimum beklenen kayıp | Risk ölçümü |
| Beta | Piyasa duyarlılığı | Sistemik risk |
| Drawdown | Maksimum kayıp | Risk toleransı |
| Korelasyon | Varlık ilişkisi | Çeşitlendirme |
| Stres Testi | Senaryo analizi | Aşırı durum |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```javascript
// Yanlış: Tek varlık portföyü
const portföy = { hisse: "BİST" }; // Çeşitlendirme yok

// Yanlış: Yüksek kaldıraç
const pozisyon = sermaye * 10; // 10x kaldıraç = çok riskli

// Yanlış: VaR yok sayma
const risk = pozisyon.değer * 0.5; // VaR hesaplanmadı

// Yanlış: Geçmiş performans
const gelecek = geçmişGetiri; // gelecek garanti değil

// Yanlış: Stres testi yok
const yatırım = 100000; // Senaryo düşünülmedi
```

### ✅ Doğru Uygulamalar

```javascript
// Doğru: Kapsamlı risk analizi
function riskAnalizi(portföy) {
  const sharpe = sharpeOranı(portföy.getiriler);
  const var95 = varParametrik(portföy.getiriler, 0.95);
  const drawdown = maxDrawdown(portföy.değerler);
  const betas = portföy.varlıklar.map(v => beta(v.getiri));
  
  return {
    sharpe: sharpe.toFixed(2),
    var: (var95 * 100).toFixed(2) + "%",
    maxDrawdown: (drawdown * 100).toFixed(2) + "%",
    ortalamaBeta: (betas.reduce((a,b) => a+b) / betas.length).toFixed(2),
    riskSeviye: sharpe > 1 ? "düşük" : sharpe > 0 ? "orta" : "yüksek"
  };
}

// Doğru: Çeşitlendirilmiş portföy
function optimizePortföy(varlıklar) {
  // Korelasyon matrisine göre
  // Düşük korelasyonlu seç
  // Optimal ağırlık hesapla
  // Max drawdown sınırla
  return optimalAğırlıklar;
}

// Doğru: Stres testi entegrasyonu
function portföyStresTesti(portföy, senaryolar) {
  const sonuçlar = [];
  for (const senaryo of senaryolar) {
    sonuçlar.push({
      senaryo: senaryo.ad,
      kayıp: stresTesti(portföy, senaryo.değerler).kayıpOranı
    });
  }
  return sonuçlar;
}

// Doğru: Risk toleransına göre portföy
function riskToleransıPortföy(profil) {
  const dağılımlar = {
    muhafazakar: { hisse: 0.2, tahvil: 0.7, nakit: 0.1 },
    dengeli: { hisse: 0.5, tahvil: 0.4, nakit: 0.1 },
    büyüme: { hisse: 0.8, tahvil: 0.2, nakit: 0.0 },
    agresif: { hisse: 1.0, tahvil: 0.0, nakit: 0.0 }
  };
  return dağılımlar[profil];
}
```

---

## Quick Reference

| Metrik | İyi | Kötü | Not |
|--------|-----|------|-----|
| Sharpe | > 1.0 | < 0 | Risk-adjusted |
| Beta | 0.8-1.2 | > 1.5 | Piyasa ilişkisi |
| Alpha | > 0 | < 0 | Ek getiri |
| VaR %95 | < 2% | > 5% | Günlük max kayıp |
| Drawdown | < 15% | > 30% | Max kayıp |

| Risk Profil | Dağılım | Zaman Ufku |
|-------------|---------|------------|
| Muhafazakar | %20 hisse, %80 tahvil | 1-3 yıl |
| Dengeli | %50 hisse, %50 tahvil | 3-7 yıl |
| Büyüme | %80 hisse, %20 tahvil | 7-15 yıl |
| Agresif | %100 hisse | 15+ yıl |

| Stres Test | Etki | Olasılık |
|------------|------|----------|
| Borsa %30 düşüş | -25% | Düşük |
| Faiz %2 artış | -10% | Orta |
| Kur %40 değer kaybı | -15% | Düşük |
| Enflasyon %25 | -8% | Orta |

| Çeşitlendirme | Öneri |
|---------------|-------|
| Varlık sınıfı | Min 4 farklı |
| Sektör | Max %30 bir sektör |
| Coğrafya | En az 2 farklı |
| Korelasyon | Ortalama < 0.5 |
