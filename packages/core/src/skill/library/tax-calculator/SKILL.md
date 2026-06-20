---
name: tax-calculator
description: "Fatura üretimi, KDV ve vergi dilimi hesaplaması. Türkiye ve uluslararası vergi sistemleri. Gelir vergisi, KDV, STOPAJ. Vergi avantajları ve teşvikler."
triggers:
  keywords: ["vergi hesaplama", "KDV", "gelir vergisi", "stopaj", "fatura", "vergi avantajı", "tax calculator", "VAT", "income tax"]
auto_load_when: "Kullanıcı vergi hesaplama, fatura üretimi veya vergi analizi taleplerinde bulunduğunda"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch", "Grep"]
---

# Vergi Hesaplayıcı (Tax Calculator)

**Odak Alanı:** Fatura üretimi, KDV ve vergi dilimi hesaplaması, Türkiye ve uluslararası vergi sistemleri.

---

## Pattern 1: Türkiye Gelir Vergisi Hesaplama

### Akış Diyagramı
```
Giriş Verileri
    ├── Brüt Gelir (Yıllık)
    ├── Vergi Matrahı
    ├── SGK Matrahı
    └── Diğer Kesintiler
            │
            ▼
    Vergi Dilimi Belirleme
    ├── %15 (228.700 TL'ye kadar)
    ├── %20 (228.701 - 548.000 TL)
    ├── %27 (548.001 - 1.500.000 TL)
    ├── %35 (1.500.001 - 4.000.000 TL)
    └── %40 (4.000.001 TL üzeri)
            │
            ▼
    Hesaplama
    ├── Kademeli Vergi Hesabı
    ├── Asgari Geçim İndirimi
    └── Vergi Sonrası Net Gelir
```

### Adım Adım Uygulama
1. **Brüt geliri belirle:** Yıllık toplam geliri hesapla
2. **SGK matrahını çıkar:** SSK + işsizlik primini düş
3. **Vergi dilimini tespit et:** 2026 yılı vergi dilimlerini uygula
4. **Kademeli hesapla:** Her dilim için ayrı vergi hesapla
5. **Asgari geçim indirimini ekle:** Medeni durum, çocuk sayısına göre
6. **Net geliri bul:** Vergi - indirim + diğer kalemler

---

## Pattern 2: KDV Hesaplama

### KDV Oranları ve Uygulama
```
KDV Hesaplama Türleri
    │
    ├── Standart Oran (%20)
    │   ├── Genel mal ve hizmetler
    │   └── İmalat ve ticaret
    │
    ├── Düşük Oran (%10)
    │   ├── Gıda ürünleri
    │   ├── Tarımsal ürünler
    │   └── Konut kiralama (işyeri)
    │
    ├── Özel Oran (%8)
    │   ├── Temel gıda maddeleri
    │   └── Kitap ve gazete
    │
    └── Sıfır Oran (%0)
        ├── İhracat
        ├── Uluslararası taşımacılık
        └── Diplomatik muafiyetler
```

### Hesaplama Formülü
- **Dahil hesaplama:** Fiyat / 1.20 = KDV dahil fiyat
- **Hariç hesaplama:** Tutar × 1.20 = KDV dahil toplam
- **KDV matrahı:** Brüt tutar - indirimler

---

## Pattern 3: Stopaj Hesaplama

### Stopaj Türleri ve Oranları
```
Stopaj Uygulama Alanları
    │
    ├── Ücretlilerden (%15-20)
    │   ├── Normal ücret
    │   ├── İkinci iş geliri
    │   └── SGK kesintileri sonrası
    │
    ├── Serbest Meslek (%20)
    │   ├── Danışmanlık ücretleri
    │   ├── Avukatlık ücretleri
    │   └── Mimarlık mühendislik
    │
    ├── Kira Gelirleri (%20-25)
    │   ├── Konut Kira (%20)
    │   ├── İşyeri Kira (%25)
    │   └── Bilimum (GV)
    │
    └── Faiz ve Dividan (%15-25)
        ├── Banka faizi (%15)
        ├── Repo gelirleri (%15)
        └── Hisse senedi temettü (%25)
```

---

## Pattern 4: Vergi Avantajları ve Teşvikler

### Teşvik Türleri
```
Vergi Teşvik Kategorileri
    │
    ├── Yatırım Teşvikleri
    │   ├── Vergi indirimi (%50-80)
    │   ├── SGK prim desteği
    │   ├── KDV istisnası
    │   └── Gümrük vergisi muafiyeti
    │
    ├── Ar-Ge Teşvikleri
    │   ├── %100 vergi indirimi
    │   ├── SGK desteği
    │   ├── Damga vergisi muafiyeti
    │   └── Tech visa desteği
    │
    ├── İstihdam Teşvikleri
    │   ├── Genç istihdam (%5-10)
    │   ├── Engelli istihdamı
    │   ├── Kadın istihdamı
    │   └── Mevsimlik tarım
    │
    └── Bölgesel Teşvikler
        ├── 1. Bölge (En az)
        ├── 2. Bölge
        ├── 3. Bölge
        └── 4. Bölge (En fazla)
```

---

## Key Patterns

| Pattern | Açıklama | Kullanım Alanı |
|---------|----------|----------------|
| Gelir Vergisi | Kademeli vergi hesaplama | Çalışan, serbest meslek |
| KDV | Mal/hizmet bazlı oran | Fatura, fatura üretimi |
| Stopaj | Kaynakta kesinti | Ödeme, yatırım geliri |
| Teşvik | Vergi avantajı | Yatırım, istihdam |
| e-Defter | Digital kayıt | Mevzuat uyumu |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```javascript
// Yanlış: Tüm gelire tek oran uygulama
const vergi = gelir * 0.20; // Yanlış! Kademeli hesap gerekli

// Yanlış: KDV'yi yanlış hesaplama
const kdv = fiyat * 0.20; // Dahil fiyattan direkt hesap

// Yanlış: Asgari geçim indirimini atama
const net = brut - vergi; // AGİ eklenmedi

// Yanlış: Stopaj oranını sabitleme
const stopaj = tutar * 0.15; // Gelir türüne göre değişir
```

### ✅ Doğru Uygulamalar

```javascript
// Doğru: Kademeli gelir vergisi
function hesaplaVergi(gelir) {
  const dilimler = [
    { limit: 228700, oran: 0.15 },
    { limit: 548000, oran: 0.20 },
    { limit: 1500000, oran: 0.27 },
    { limit: 4000000, oran: 0.35 },
    { limit: Infinity, oran: 0.40 }
  ];
  
  let vergi = 0;
  let oncekiLimit = 0;
  
  for (const dilim of dilimler) {
    if (gelir > oncekiLimit) {
      const vergilenen = Math.min(gelir, dilim.limit) - oncekiLimit;
      vergi += vergilenen * dilim.oran;
      oncekiLimit = dilim.limit;
    }
  }
  return vergi;
}

// Doğru: KDV dahil fiyattan hesaplama
const kdvDahil = 1200;
const kdvMatrahi = kdvDahil / 1.20;
const kdv = kdvDahil - kdvMatrahi;

// Doğru: Asgari geçim indirimi ile net
const agi = hesaplaAGI(medeniDurum, cocukSayisi);
const net = brut - vergi + agi;
```

---

## Quick Reference

| Konu | Oran/Değer | Not |
|------|------------|-----|
| Gelir Vergisi (1. Dilim) | %15 | 228.700 TL'ye kadar |
| Gelir Vergisi (2. Dilim) | %20 | 228.701-548.000 TL |
| Gelir Vergisi (3. Dilim) | %27 | 548.001-1.500.000 TL |
| Gelir Vergisi (4. Dilim) | %35 | 1.500.001-4.000.000 TL |
| Gelir Vergisi (5. Dilim) | %40 | 4.000.001 TL üzeri |
| KDV (Standart) | %20 | Genel mal ve hizmet |
| KDV (Düşük) | %10 | Gıda, konut kiralama |
| KDV (Özel) | %8 | Temel gıda, kitap |
| KDV (Sıfır) | %0 | İhracat |
| Stopaj (Ücret) | %15-20 | Gelir türüne göre |
| Stopaj (Serbest Meslek) | %20 | Danışmanlık vb. |
| Stopaj (Kira-Konut) | %20 | Konut kiralama |
| Stopaj (Kira-İşyeri) | %25 | İşyeri kiralama |
| SGK İşçi Payı | %14 | Sakatlık durumuna göre |
| SGK İşveren Payı | %20.5 | İşyeri risk derecesine göre |
| AGİ (Bekâr) | 268.33 TL | 2026 |
| AGİ (Evli) | 357.78 TL | 2026 |
| AGİ (Çocuk başı) | +89.44 TL | Max 3 çocuk |
