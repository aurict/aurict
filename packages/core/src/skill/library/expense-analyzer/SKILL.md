---
name: expense-analyzer
description: "PDF banka dökümlerinden gider kategorize etme. Otomatik kalıp tanıma. Kategorizasyon kuralları. Gider trend analizi. Bütçe karşılaştırması."
triggers:
  keywords: ["gider analizi", "banka dökümü", "harcama kategorisi", "bütçe karşılaştırma", "expense", "bank statement", "spending analysis"]
auto_load_when: "Kullanıcı banka dökümü analizi, gider kategorize etme veya bütçe karşılaştırma taleplerinde bulunduğunda"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch", "Grep"]
---

# Gider Analizör (Expense Analyzer)

**Odak Alanı:** PDF banka dökümlerinden gider kategorize etme, otomatik kalıp tanıma, trend analiz.

---

## Pattern 1: Banka Dökümü Okuma ve Ayıklama

### Veri Çıkarma Süreci
```
Döküm İşleme Akışı
    │
    ├── Dosya Girişi
    │   ├── PDF formatı
    │   ├── CSV/Excel export
    │   └── Online banka verisi (API)
    │
    ├── OCR/Parse İşlemi
    │   ├── Metin tanıma (OCR)
    │   ├── Tablo yapısı çıkarma
    │   ├── Tarih/sayi/metin ayrıştırma
    │   └── Hata düzeltme
    │
    ├── Veri Temizleme
    │   ├── Tekrarlanan kayıtlar
    │   ├── Geçersiz karakterler
    │   ├── Tarih formatı standardizasyonu
    │   └── Para birimi normalizasyonu
    │
    └── Yapısal Veri
        ├── Tarih
        ├── Açıklama
        ├── Tutar (Borç/Alacak)
        └── Kategori (tahmini)
```

### Adım Adım Uygulama
1. **Dosyayı oku:** PDF, CSV veya API'den veri al
2. **Metni çıkar:** OCR ile görüntüden metin
3. **Alanları ayır:** Tarih, açıklama, tutar
4. **Verileri temizle:** Format standardize et
5. **İşleme hazırla:** Veritabanına aktar

---

## Pattern 2: Otomatik Kalıp Tanıma

### Kategorizasyon Kuralları
```
Kalıp Eşleştirme Sistemi
    │
    ├── Maaş/Gelir Kalıpları
    │   ├── "MAAŞ", "SALARY", "ÖDEME"
    │   ├── "HESABA AKTARIM"
    │   └── "ELEKTRONİK TRANSFER"
    │
    ├── Gıda/Harcama Kalıpları
    │   ├── "A101", "BİM", "MİGR", "ŞOK"
    │   ├── "Migros", "Carrefour"
    │   ├── "YEMEK", "RESTORAN"
    │   └── "GETİR", "Yemeksepeti"
    │
    ├── Ulaşım Kalıpları
    │   ├── "İETT", "İstanbulkart"
    │   ├── "TCDD", "Ulaştırma"
    │   ├── "Taksi", "Uber", "Bitaksi"
    │   └── "Akaryakıt", "BP", "Shell"
    │
    ├── Fatura/Abonelik Kalıpları
    │   ├── "Elektrik", "Su", "Doğalgaz"
    │   ├── "Turkcell", "Türk Telekom"
    │   ├── "Netflix", "Spotify"
    │   └── "D-Smart", "Digitürk"
    │
    └── Özel Kalıplar
        ├── Kredi kartı ödemeleri
        ├── Konut kirası
        ├── Sağlık harcamaları
        └── Eğitim harcamaları
```

### Makine Öğrenimi Modeli
- **Özellikler:** Açıklama metni, tutar aralığı, tarih, saat
- **Eğitim:** Kullanıcı onayları ile öğrenme
- **Sonuç:** Otomatik kategori önerisi

---

## Pattern 3: Gider Trend Analizi

### Zaman Serisi Analizi
```
Trend Analiz Dönemleri
    │
    ├── Haftalık Analiz
    │   ├── Gün bazlı harcama
    │   ├── Hafta içi vs sonu
    │   └── Dönemsel dalgalanmalar
    │
    ├── Aylık Analiz
    │   ├── Kategori bazlı toplam
    │   ├── Önceki ayla karşılaştırma
    │   ├── Aynı ay geçen yıl
    │   └── Yılbaşı / Bayram etkisi
    │
    ├── Yıllık Analiz
    │   ├── 12 aylık hareketli ortalama
    │   ├── Yıllık büyüme oranı
    │   ├── Enflasyon düzeltmesi
    │   └── En yüksek/düşük dönemler
    │
    └── Anormallik Tespiti
        ├── Ortalamanın üzerinde harcama
        ├── Beklenmeyen büyük kalemler
        ├── Tekrarlayan anormal ödemeler
        └── Kategori dışı kalemler
```

### Görselleştirme
- **Çizgi grafik:** Aylık trend
- **Pasta grafik:** Kategori dağılımı
- **Bar grafik:** Karşılaştırmalı analiz

---

## Pattern 4: Bütçe Karşılaştırması

### Bütçe Planlama ve Analiz
```
Bütçe Karşılaştırma Sistemi
    │
    ├── Bütçe Oluşturma
    │   ├── Kategori bazlı limit
    │   ├── Gelir-gider dengesi
    │   ├── Tasarruf hedefi
    │   └── Acil durum fonu
    │
    ├── Fiili Karşılaştırma
    │   ├── Plan vs Fiili
    │   ├── Sapma oranı (%)
    │   ├── Renk kodlaması (Yeşil/Sarı/Kırmızı)
    │   └── Kategori bazlı detay
    │
    ├── Raporlama
    │   ├── Aylık özet
    │   ├── Kategori bazlı detay
    │   ├── Trend açıklaması
    │   └── Öneriler
    │
    └── Uyarı Sistemi
        ├── Limit aşımı
        ├── Anormal harcama
        ├── Dönem sonu beklenti
        └── Kötüleşen trend
```

---

## Key Patterns

| Pattern | Açıklama | Kullanım Alanı |
|---------|----------|----------------|
| OCR/Parse | Görüntüden veri | PDF dökümler |
| Kalıp Tanıma | Otomatik kategori | Gider sınıflandırma |
| Trend Analiz | Zaman serisi | Gelişim takibi |
| Bütçe Karşılaştırma | Plan vs Fiili | Kontrol mekanizması |
| Anormallik Tespiti | Sapma belirleme | Uyarı sistemleri |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```javascript
// Yanlış: Manuel kategori atama (otomasyon yok)
const islem = {
  aciklama: "A101 Market",
  kategori: el ileAtama("GIDA") // Manuel, zaman alıcı
};

// Yanlış: Bütçe limiti yok
const harcama = toplamHarcanan; // Limit kontrolü yok

// Yanlış: Trend hesaplamada hata
const trend = (buAy / geçenAy) - 1; // Negatif sonuç kontrolü yok

// Yanlış: Kalıp eşleştirme parametresiz
const kategori = esleşKalip(açıklama); // Eşik değeri yok
```

### ✅ Doğru Uygulamalar

```javascript
// Doğru: Otomatik kalıp tanıma
const kurallar = [
  { kalip: /A101|BİM|MİGR/i, kategori: "GIDA" },
  { kalip: /Netflix|Spotify/i, kategori: "ABONELİK" },
  { kalip: /İETT|Metro/i, kategori: "ULAŞIM" },
  { kalip: /Elektrik|Su/i, kategori: "FATURA" }
];

function otomatikKategori(açıklama) {
  for (const kural of kurallar) {
    if (kural.kalip.test(açıklama)) return kural.kategori;
  }
  return "DİĞER";
}

// Doğru: Bütçe kontrolü ve uyarı
function kontrolBütçe(kategori, tutar, bütçe) {
  const kullanılan = harcamalar[kategori] || 0;
  const kalan = bütçe[kategori] - kullanılan;
  
  if (tutar > kalan) {
    return { uyarı: "Limit aşıldı", renk: "kırmızı" };
  } else if (kalan < bütçe[kategori] * 0.1) {
    return { uyarı: "Limit azalıyor", renk: "sarı" };
  }
  return { uyarı: "Normal", renk: "yeşil" };
}

// Doğru: Trend analizi
function analizTrend(veriler) {
  const n = veriler.length;
  const xOrtalama = (n - 1) / 2;
  const yOrtalama = veriler.reduce((a, b) => a + b) / n;
  
  let pay = 0, payda = 0;
  for (let i = 0; i < n; i++) {
    pay += (i - xOrtalama) * (veriler[i] - yOrtalama);
    payda += Math.pow(i - xOrtalama, 2);
  }
  
  const eğim = pay / payda;
  return { eğim, yön: eğim > 0 ? "yükseliş" : "düşüş" };
}
```

---

## Quick Reference

| Kategori | Örnek Kalıplar | Ortalama % |
|----------|----------------|------------|
| GIDA | A101, BİM, Migros, Restaurant | 20-30% |
| ULAŞIM | İstanbulkart, Taksi, Akaryakıt | 10-15% |
| FATURA | Elektrik, Su, İnternet | 8-12% |
| KONUT | Kira, Mortgage | 25-35% |
| ABONELİK | Netflix, Turkcell, D-Smart | 3-5% |
| SAĞLIK | Eczane, Hastane | 2-5% |
| EĞİTİM | Kurs, Kitap | 2-5% |
| GİYİM | Mağaza, Online alışveriş | 5-10% |
| EĞLENCE | Sinema, Konser | 3-5% |
| DİĞER | Belirsiz | 5-10% |

| Metrik | Açıklama | Eşik |
|--------|----------|------|
| Bütçe Sapması | Plan-Fiili farkı | >%10 risk |
| Tekrarlayan Harcama | Aynı kategori artışı | >%20 |
| Anormal Kalem | Ortalamanın üstü | >2x ortalama |
| Tasarruf Oranı | Gelir - Gider | >%10 sağlıklı |
