---
name: receipt-scanner
description: "Fiş/makbuz görüntülerinden veri ayıklama. OCR teknolojisi. Digitizer doğruluğu. Kategorizasyon. Düzenleme araçları."
triggers:
  keywords: ["fiş tarama", "makbuz okuma", "OCR", "belge tarama", "receipt scanner", "fatura okuma", "dijital makbuz"]
auto_load_when: "Kullanıcı fiş/makbuz görüntülerinden veri çıkarma, OCR veya dijital belge işleme taleplerinde bulunduğunda"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch", "Grep"]
---

# Fiş Tarayıcı (Receipt Scanner)

**Odak Alanı:** Fiş/makbuz görüntülerinden veri ayıklama, OCR teknolojisi, doğruluk, kategorizasyon.

---

## Pattern 1: OCR Teknolojisi ve Veri Çıkarma

### OCR Süreci
```
OCR İşleme Akışı
    │
    ├── Görüntü Ön İşleme
    │   ├── Boyutlandırma ve çözünürlük
    │   ├── Kontrast ayarlama
    │   ├── Eğrilik düzeltme (deskew)
    │   ├── Gürültü azaltma
    │   └── Keskinleştirme
    │
    ├── Metin Tanıma
    │   ├── Görüntü karakter tanıma
    │   ├── Dil desteği (Türkçe dahil)
    │   ├── El yazısı desteği
    │   └── Tablo/ form tanıma
    │
    ├── Yapısal Çıkarma
    │   ├── Tarih tanıma
    │   ├── Tutar tanıma
    │   ├── Firma adı tanıma
    │   ├── Vergi bilgileri
    │   └── Kalem listesi
    │
    └── Veri Doğrulama
        ├── Format kontrolü
        ├── Tutarlılık kontrolü
        ├── Eksik alan tamamlama
        └── Onay/ düzeltme
```

### OCR Kütüphaneleri ve Araçları
```
Popüler OCR Araçları
    │
    ├── Tesseract (Açık Kaynak)
    │   ├── Ücretsiz, açık kaynak
    │   ├── Türkçe dil desteği
    │   ├── CLI ve API
    │   └── Orta doğruluk (%80-90)
    │
    ├── Cloud OCR API'leri
    │   ├── Google Cloud Vision
    │   ├── AWS Textract
    │   ├── Azure Computer Vision
    │   └── Yüksek doğruluk (%95+)
    │
    ├── Özel OCR Çözümleri
    │   ├── ABBYY FineReader
    │   ├── Adobe Acrobat
    │   └── Veryfi (Fiş odaklı)
    │
    └── Mobil OCR
        ├── Google Lens
        ├── CamScanner
        └── Microsoft Lens
```

---

## Pattern 2: Digitizer Doğruluğu

### Doğruluk Metrikleri
```
OCR Performans Değerlendirmesi
    │
    ├── Doğruluk Türleri
    │   ├── Karakter doğruluğu (Accuracy)
    │   │   ├── Doğru karakter / Toplam karakter
    │   │   └── %90+ hedef
    │   │
    │   ├── Alan tanıma (Field)
    │   │   ├── Tarih, tutar, firma
    │   │   └── %85+ hedef
    │   │
    │   └── Kalem tanıma (Line Item)
    │       ├── Her satırı tanıma
    │       └── %80+ hedef
    │
    ├── Hata Türleri
    │   ├── Karakter yanlış okuma
    │   ├── Eksik karakter
    │   ├── Yanlış karakter (benzer)
    │   ├── Satır atlanması
    │   └── Alan karışıklığı
    │
    ├── Doğruluk Artırma
    │   ├── Yüksek çözünürlük (300 DPI+)
    │   ├── İyi aydınlatma
    │   ├── Düz yüzey
    │   └── Orijinal belge
    │
    └── Manuel Düzeltme
        ├── Kullanıcı onayı
        ├── Hızlı düzeltme arayüzü
        ├── Öğrenen sistem
        └── Batch düzeltme
```

### Doğruluk Hesaplama
```javascript
// OCR performans metrikleri
function ocrMetrikleri(gerçek, tahmin) {
  const toplamKarakter = gerçek.length;
  const doğruKarakter = karakterKarşılaştır(gerçek, tahmin);
  const doğruluk = (doğruKarakter / toplamKarakter) * 100;
  
  // Alan bazlı doğruluk
  const alanDoğruluk = {
    tarih: doğruAlan(gerçek.tarih, tahmin.tarih),
    tutar: doğruAlan(gerçek.tutar, tahmin.tutar),
    firma: doğruAlan(gerçek.firma, tahmin.firma)
  };
  
  return {
    karakterDoğruluk: doğruluk.toFixed(1) + "%",
    alanDoğruluk,
    hataOranı: (100 - doğruluk).toFixed(1) + "%"
  };
}
```

---

## Pattern 3: Kalıp Tanıma ve Kategorizasyon

### Fiş Kategorilendirme
```
Otomatik Kategorilendirme
    │
    ├── Gıda/Harcama
    │   ├── A101, BİM, Migros
    │   ├── Restaurant, café
    │   └── Market zincirleri
    │
    ├── Ulaşım
    │   ├── Akaryakıt (Shell, BP, Petlines)
    │   ├── Otobüs, metro (İstanbulkart)
    │   ├── Taksi, Uber
    │   └── Otopark
    │
    ├── Faturalar
    │   ├── Elektrik, su, doğalgaz
    │   ├── Telekomünikasyon
    │   └── Abonelikler
    │
    ├── Sağlık
    │   ├── Eczane
    │   ├── Hastane, laboratuvar
    │   └── Diş, göz
    │
    ├── Eğitim
    │   ├── Kitap, kırtasiye
    │   ├── Kurs, eğitim
    │   └── Okul ücretleri
    │
    └── Genel Gider
    │   ├── Kırtasiye
    │   ├── Hediye
    │   ├── Temizlik
    │   └── Diğer
```

### Kategorizasyon Motoru
```javascript
// Otomatik kategori atama
const kategoriKuralları = [
  { kalip: /A101|BİM|MİGR|ŞOK/i, kategori: "GIDA" },
  { kalip: /Shell|BP|Petlines|Akaryakıt/i, kategori: "ULAŞIM" },
  { kalip: /Elektrik|Su|Doğalgaz/i, kategori: "FATURA" },
  { kalip: /Eczane|Eczane/i, kategori: "SAĞLIK" },
  { kalip: /İstanbul Metro|İETT/i, kategori: "ULAŞIM" }
];

function kategoriBul(açıklama) {
  for (const kural of kategoriKuralları) {
    if (kural.kalip.test(açıklama)) return kural.kategori;
  }
  return "DİĞER";
}
```

---

## Pattern 4: Veri Yapısı ve Düzenleme

### Çıkarılan Veri Yapısı
```
Fiş Veri Modeli
    │
    ├── Temel Bilgiler
    │   ├── Fiş Numarası
    │   ├── Tarih (Düzenleme)
    │   ├── Saat
    │   ├── Firma Adı
    │   ├── Vergi Numarası
    │   └── Adres
    │
    ├── Mali Bilgiler
    │   ├── Ara Toplam
    │   ├── KDV Oranı ve Tutarı
    │   ├── Stopaj (varsa)
    │   ├── Toplam Tutar
    │   ├── Ödeme Şekli
    │   └── Para Birimi
    │
    ├── Kalem Listesi
    │   ├── Sıra No
    │   ├── Mal/Hizmet Adı
    │   ├── Miktar
    │   ├── Birim Fiyat
    │   ├── Toplam
    │   └── KDV
    │
    └── Ek Bilgiler
        ├── Kategori
        ├── Alt kategori
        ├── Not/Açıklama
        └── Resim yolu
```

### Düzenleme Araçları
```
Kullanıcı Düzenleme Özellikleri
    │
    ├── Alan Düzeltme
    │   ├── Tarih formatı düzeltme
    │   ├── Tutar ondalık ayarlama
    │   ├── Firma adı otomatik tamamlama
    │   └── Eksik alan ekleme
    │
    ├── Kalem Yönetimi
    │   ├── Satır ekleme/silme
    │   ├── Mal adı düzenleme
    │   ├── Tutar düzeltme
    │   └── KDV ayarlama
    │
    ├── Toplu İşlemler
    │   ├── Batch import
    │   ├── Çoklu düzenleme
    │   ├── Bulk kategori değiştirme
    │   └── Export/import
    │
    └── Veri Doğrulama
        ├── Otomatik toplam kontrolü
        ├── KDV hesaplama doğrulama
        ├── Tarih sıralama kontrolü
        └── Duplicate kontrolü
```

---

## Pattern 5: Dosya Formatları ve Entegrasyon

### Desteklenen Formatlar
```
Giriş Formatları
    │
    ├── Görüntü Formatları
    │   ├── JPEG (en yaygın)
    │   ├── PNG (şeffaf destek)
    │   ├── TIFF (yüksek kalite)
    │   ├── PDF (tarama)
    │   └── HEIC (iOS)
    │
    ├── Çıkış Formatları
    │   ├── JSON (API için)
    │   ├── CSV (Excel için)
    │   ├── XML (Muhasebe)
    │   ├── PDF (Arşivleme)
    │   └── Excel (Raporlama)
    │
    └── Entegrasyon
        ├── Muhasebe yazılımı
        ├── Excel/Google Sheets
        ├── ERP sistemleri
        └── Mobil uygulamalar
```

---

## Key Patterns

| Pattern | Açıklama | Kullanım Alanı |
|---------|----------|----------------|
| OCR | Optik karakter tanıma | Görüntüden metin |
| Ön İşleme | Görüntü iyileştirme | Doğruluk artırma |
| Kalıp Tanıma | Otomatik kategori | Sınıflandırma |
| Veri Modeli | Standart yapı | Kayıt formatı |
| Doğrulama | Hata tespiti | Kalite kontrol |
| Entegrasyon | Dış sistem bağlantı | İş akışı |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```javascript
// Yanlış: Düşük çözünürlük
const görüntü = "50 DPI"; // Okunamaz

// Yanlış: Ön işleme yok
const metin = ocr(görüntü); // Düşük doğruluk

// Yanlış: Manuel kontrol yok
const veri = otomatikTamamlandı(); // Hata olasılığı yüksek

// Yanlış: Kategorizasyon yok
const kayıt = { ...veri }; // Kategori yok

// Yanlış: Yedekleme yok
const veri = kaydedildi(); // Veri kaybı riski
```

### ✅ Doğru Uygulamalar

```javascript
// Doğru: Görüntü ön işleme
function önİşle(görüntü) {
  const boyut = yenidenBoyut(görüntü, 1200, 1600);
  const keskin = keskinleştir(boyut);
  const kontrast = adaptifKontrast(keskin);
  return kontrast;
}

// Doğru: OCR işleme
function işleFiş(görüntü) {
  const hazırlanmış = önİşle(görüntü);
  const metin = tesseractOcr(hazırlanmış, "tur");
  const yapı = parseFiş(metin);
  const doğrulanmış = doğrula(yapı);
  return doğrulanmış;
}

// Doğru: Veri doğrulama
function doğrula(fiş) {
  const toplamKontrol = Math.abs(
    fiş.kalemler.reduce((t, k) => t + k.toplam, 0) - fiş.araToplam
  ) < 0.01;
  
  const kdvKontrol = Math.abs(
    fiş.araToplam * fiş.kdvOranı - fiş.kdvTutar
  ) < 0.01;
  
  return {
    geçerli: toplamKontrol && kdvKontrol,
    hatalar: toplamKontrol ? [] : ["Toplam hatası"]
  };
}

// Doğru: Çıkış formatı
function exportCSV(fişler) {
  const satırlar = fişler.map(f => ({
    tarih: f.tarih,
    firma: f.firma,
    kategori: f.kategori,
    tutar: f.toplam,
    kdv: f.kdvTutar
  }));
  return csvExport(satırlar);
}
```

---

## Quick Reference

| Aşama | Araç | Doğruluk |
|-------|------|----------|
| Ön İşleme | OpenCV | Kritik |
| OCR | Tesseract | %80-90 |
| Cloud OCR | Google/AWS | %95+ |
| Doğrulama | Manuel | %100 |
| Kategori | ML/Pattern | %85+ |

| Görüntü Gereksinimi | Değer |
|---------------------|-------|
| Minimum DPI | 200-300 |
| Renk modu | Gri veya Renkli |
| Boyut | Max 10MB |
| Format | JPEG, PNG, PDF |
| Eğrilik | < 5 derece |
| Aydınlatma | Homojen |

| Veri Alanı | Zorunlu | Format |
|------------|---------|--------|
| Tarih | Evet | GG.AA.YYYY |
| Tutar | Evet | Ondalıklı |
| Firma | Evet | Metin |
| KDV | Hayır | % |
| Kalemler | Hayır | Liste |
| Kategori | Hayır | Enum |
