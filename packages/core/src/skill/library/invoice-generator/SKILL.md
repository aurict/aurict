---
name: invoice-generator
description: "Profesyonel fatura tasarımı. Fatura elementleri (tarih, no, vergi bilgileri). e-Fatura formatları. Türkiye e-Defter mevzuatı. Para birimi ve çoklu dil desteği."
triggers:
  keywords: ["fatura oluştur", "fatura tasarımı", "e-fatura", "e-defter", "invoice generator", "fatura", "billing"]
auto_load_when: "Kullanıcı profesyonel fatura oluşturma, e-fatura formatı veya fatura tasarımı taleplerinde bulunduğunda"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch", "Grep"]
---

# Fatura Üreticisi (Invoice Generator)

**Odak Alanı:** Profesyonel fatura tasarımı, e-fatura formatları, Türkiye mevzuat uyumu.

---

## Pattern 1: Fatura Temel Elementleri

### Zorunlu Alanlar
```
Fatura Yapısı
    │
    ├── Fatura Bilgileri
    │   ├── Fatura Numarası (Zorunlu)
    │   │   ├── Format: Yılı/Sıra No
    │   │   ├── Örn: 2026-00001
    │   │   └── Benzersiz olmalı
    │   │
    │   ├── Fatura Tarihi (Zorunlu)
    │   │   ├── Düzenleme tarihi
    │   │   ├── Vade tarihi
    │   │   └── GG.AA.YYYY formatı
    │   │
    │   └── Fatura Türü
    │       ├── Satış faturası
    │       ├── Alış faturası
    │       ├── İade faturası
    │       └── Proforma
    │
    ├── Satıcı Bilgileri (Zorunlu)
    │   ├── Ticaret unvanı
    │   ├── Vergi kimlik numarası (VKN)
    │   ├── Vergi dairesi
    │   ├── Adres
    │   ├── Telefon
    │   └── E-posta
    │
    ├── Müşteri Bilgileri (Zorunlu)
    │   ├── Ad soyad/firma adı
    │   ├── TC Kimlik / VKN
    │   ├── Vergi dairesi
    │   ├── Adres
    │   └── E-posta
    │
    └── Mal/Hizmet Tablosu
        ├── Sıra no
        ├── Mal/hizmet tanımı
        ├── Miktar
        ├── Birim fiyat
        ├── Toplam (KDV hariç)
        ├── KDV oranı
        ├── KDV tutarı
        └── Genel toplam
```

### Adım Adım Fatura Oluşturma
1. **Fatura numarası oluştur:** Benzersiz, sıralı numara
2. **Tarihleri belirle:** Düzenleme ve vade tarihi
3. **Satıcı bilgileri:** Vergi dairesi ve VKN dahil
4. **Alıcı bilgileri:** Tüm vergi bilgileri
5. **Kalemleri ekle:** Mal/hizmet tablosu
6. **Toplamları hesapla:** Ara toplam, KDV, genel toplam

---

## Pattern 2: e-Fatura Formatları

### Türkiye e-Fatura Yapısı
```
e-Fatura Türleri
    │
    ├── e-Fatura (GİB)
    │   ├── Entegratör üzerinden
    │   ├── XML formatı
    │   ├── UBL-TR standardı
    │   └── Zorunlu alanlar
    │       ├── Invoice
    │       ├── Header
    │       ├── Party
    │       ├── Line
    │       └── TaxTotal
    │
    ├── e-Arşiv Fatura
    │   ├── Kağıt yerine dijital
    │   ├── 5000 TL üstü zorunlu
    │   ├── PDF formatı
    │   └── İmzalı ve arşivlenmiş
    │
    └── e-İrsaliye
        ├── Sevk irsaliyesi dijital
        ├── Mal taşıma belgesi
        ├── e-Fatura ile entegre
        └── Zorunlu işlemler
```

### XML Yapısı (UBL-TR)
```xml
<Invoice xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataTypeText:1"
         xmlns:cbc="urn:un:unece:uncefact:data:standard:CoreComponentTypeBlock:1"
         xmlns:cac="urn:un:unece:uncefact:data:standard:CoreComponentTypeAggregate:1">
  <cbc:ID>2026-00001</cbc:ID>
  <cbc:IssueDate>2026-01-15</cbc:IssueDate>
  <cac:AccountingSupplierParty>
    <cac:PartyName><cbc:Name>Şirket A.Ş.</cbc:Name></cac:PartyName>
    <cac:PartyTaxScheme>
      <cbc:CompanyID>1234567890</cbc:CompanyID>
    </cac:PartyTaxScheme>
  </cac:AccountingSupplierParty>
</Invoice>
```

---

## Pattern 3: e-Defter Mevzuatı

### Yasal Gereksinimler
```
e-Defter Yükümlülükleri
    │
    ├── Kimler Yükümlü
    │   ├── Şirket türüne göre
    │   ├── Cirolara göre (2026 güncelliği)
    │   ├── Sektörel zorunluluklar
    │   └── İsteğe bağlı başvuru
    │
    ├── Defter Tutma Zorunlulukları
    │   ├── Yevmiye defteri
    │   ├── Defteri kebir (büyük defter)
    │   ├── Bilanço hesapları
    │   └── Gelir tablosu
    │
    ├── Saklama Süreleri
    │   ├── 10 yıl (yasal defter)
    │   ├── 5 yıl (destekleyici belge)
    │   └── 3 yıl (fatura kopyaları)
    │
    └── İmza ve Onay
        ├── Elektronik imza
        ├── Zaman damgası
        ├── Onaylanmış e-Defter
        └── Yedekleme zorunluluğu
```

### Uyumluluk Kontrol Listesi
- **Vergi Kimlik Numarası:** 10 haneli, doğrulanmış
- **Vergi Dairesi:** Geçerli, aktif
- **Adres:** Tam adres, il/ilçe dahil
- **KDV Oranları:** %20, %10, %8, %0 doğru kullanımı
- **İndirimler:** KDV matrahından düşüm
- **Stopaj:** Gelir türüne göre doğru oran

---

## Pattern 4: Para Birimi ve Çoklu Dil

### Çok Para Birimi Desteği
```
Döviz İşlemleri
    │
    ├── Kur Bilgisi
    │   ├── TCMB güncel kurları
    │   ├── Serbest piyasa kuru
    │   ├── Kontrat tarihi kuru
    │   └── Fatura kesim tarihi kuru
    │
    ├── Çevrim İşlemleri
    │   ├── Döviz cinsinden tutar
    │   ├── TL karşılığı
    │   ├── Kur farkı hesabı
    │   └── KDV hesaplama (TL üzerinden)
    │
    └── Para Birimleri
        ├── TRY (Türk Lirası)
        ├── USD (Amerikan Doları)
        ├── EUR (Euro)
        ├── GBP (İngiliz Sterlini)
        └── Diğer (Kur desteği)
```

### Çoklu Dil Yapısı
- **Dil Seçenekleri:** Türkçe, İngilizce, Almanca, Arapça
- **Alan Çevirileri:** "Fatura No" → "Invoice No"
- **KDV Açıklamaları:** Dil bazlı oran metinleri
- **Yazı Tipi:** UTF-8, RTL desteği (Arapça)

---

## Key Patterns

| Pattern | Açıklama | Kullanım Alanı |
|---------|----------|----------------|
| Fatura Elementleri | Zorunlu alanlar | Standart fatura |
| e-Fatura | XML/UBL-TR formatı | GİB entegratör |
| e-Defter | Digital defter tutma | Mevzuat uyumu |
| Çoklu Para Birimi | Döviz kuru çevrimi | İhracat/ithalat |
| Çoklu Dil | Çeviri ve RTL | Uluslararası |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```javascript
// Yanlış: VKN olmadan fatura
const fatura = {
  müşteri: "Müşteri A.Ş.",
  // VKN eksik - yasal geçersiz
};

// Yanlış: KDV oranı hatalı
const faturaKalemi = {
  mal: "Gıda ürünü",
  tutar: 100,
  kdvOranı: 0.20 // %20 yerine %10 olmalı
};

// Yanlış: Fatura numarası tekrar
function yeniFaturaNo() {
  return "2026-00001"; // Sabit, tekrar eder
}

// Yanlış: Kur bilgisi olmadan döviz
const dövizFatura = {
  tutar: 1000,
  paraBirimi: "USD"
  // Kur bilgisi yok - çevrim hatası
};
```

### ✅ Doğru Uygulamalar

```javascript
// Doğru: Geçerli fatura yapısı
function oluşturFatura(satıcı, alıcı, kalemler) {
  const faturaNo = `2026-${String(sıraNo++).padStart(5, '0')}`;
  
  const araToplam = kalemler.reduce((t, k) => t + k.tutar, 0);
  const kdvToplam = kalemler.reduce((t, k) => t + (k.tutar * k.kdvOranı), 0);
  
  return {
    faturaNo,
    tarih: new Date().toISOString().split('T')[0],
    satıcı: {
      unvan: satıcı.unvan,
      vkn: satıcı.vkn,
      vd: satıcı.vergiDairesi,
      adres: satıcı.adres
    },
    alıcı: {
      unvan: alıcı.unvan,
      vkn: alıcı.vkn,
      vd: alıcı.vergiDairesi
    },
    kalemler,
    araToplam,
    kdvToplam,
    genelToplam: araToplam + kdvToplam
  };
}

// Doğru: e-Fatura XML oluşturma
function eFaturaXML(fatura) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <cbc:ID>${fatura.faturaNo}</cbc:ID>
  <cbc:IssueDate>${fatura.tarih}</cbc:IssueDate>
  <cac:AccountingSupplierParty>
    <cac:PartyName><cbc:Name>${fatura.satıcı.unvan}</cbc:Name></cac:PartyName>
  </cac:AccountingSupplierParty>
</Invoice>`;
}

// Doğru: Kur çevrimi ile döviz faturası
function dövizFatura(tutar, paraBirimi, kur) {
  const tlKarşılığı = tutar * kur;
  const kdv = tlKarşılığı * 0.20;
  return {
    tutar,
    paraBirimi,
    kur,
    tlKarşılığı,
    kdv,
    genelToplam: tlKarşılığı + kdv
  };
}
```

---

## Quick Reference

| Element | Zorunlu | Format |
|---------|---------|--------|
| Fatura No | Evet | YYYY-NNNNN |
| Tarih | Evet | GG.AA.YYYY |
| Satıcı Unvan | Evet | max 200 karakter |
| Satıcı VKN | Evet | 10 hane |
| Satıcı VD | Evet | İl/ad |
| Alıcı Unvan | Evet | max 200 karakter |
| Alıcı VKN | Evet | 10 hane (şirket) |
| Mal/Hizmet | Evet | Detaylı tanım |
| Tutar | Evet | Ondalıklı |
| KDV | Evet | %0, %8, %10, %20 |

| e-Fatura | Format | Not |
|----------|--------|-----|
| GİB Entegratör | XML/UBL-TR | Zorunlu |
| e-Arşiv | PDF | >5000 TL |
| e-İrsaliye | XML | İsteğe bağlı |
| Saklama | 10 yıl | e-Defter |

| KDV Oranları | Kullanım |
|--------------|----------|
| %20 | Genel |
| %10 | Gıda, konut kiralama |
| %8 | Temel gıda, kitap |
| %0 | İhracat |
