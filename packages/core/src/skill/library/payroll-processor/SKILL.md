---
name: payroll-processor
description: "Maaş bordrosu, vergiler ve kesintiler. Brüt/net hesaplama. SGK, işsizlik, gelir vergisi kesintileri. Asgari geçim indirimi. İşe giriş/çıkış hesaplamaları."
triggers:
  keywords: ["maaş bordrosu", "bordro hesaplama", "payroll", "SGK kesintisi", "gelir vergisi", "asgari geçim indirimi", "brüt net hesaplama"]
auto_load_when: "Kullanıcı maaş bordrosu, payroll hesaplama veya çalışan maliyet analizi taleplerinde bulunduğunda"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch", "Grep"]
---

# Bordro İşlemcisi (Payroll Processor)

**Odak Alanı:** Maaş bordrosu, brüt/net hesaplama, SGK ve vergi kesintileri.

---

## Pattern 1: Brüt - Net Maaş Hesaplama

### Maaş Yapısı ve Hesaplama Akışı
```
Maaş Hesaplama Süreci
    │
    ├── Brüt Maaş Bileşenleri
    │   ├── Temel ücret
    │   ├── Yemek yardımı
    │   ├── Ulaşım yardımı
    │   ├── Performans primi
    │   ├── Ikramiye (aylık/puantaj)
    │   └── Diğer kalemler
    │
    ├── SGK Kesintileri (İşçi Payı)
    │   ├── SGK (Sakatlık: %9-12)
    │   ├── İşsizlik sigortası (%1)
    │   └── Damga vergisi (%0.6)
    │
    ├── Gelir Vergisi
    │   ├── Matrah (SGK kesintileri sonrası)
    │   ├── Vergi dilimi uygulaması
    │   ├── Asgari geçim indirimi (AGİ)
    │   └── Gelir vergisi kesintisi
    │
    └── Net Maaş
        ├── Brüt - SGK - Gelir Vergisi + AGİ
        └── Kesintiler sonrası elde edilen
```

### Adım Adım Hesaplama
1. **Brüt maaşı belirle:** Tüm gelir kalemlerini topla
2. **SGK matrahını hesapla:** Brüt - istisna kalemler
3. **SGK işçi payını hesapla:** %9 + %1 işsizlik
4. **Vergi matrahını bul:** SGK sonrası tutar
5. **Gelir vergisini hesapla:** Kademeli oranlar
6. **AGİ'yi ekle:** Medeni durum/çocuk sayısı
7. **Net maaşı bul:** Tüm kesintileri çıkar

---

## Pattern 2: SGK Kesintileri

### SGK Hesaplama Detayları
```
SGK Yapısı
    │
    ├── İşçi Payı (%9 + %1)
    │   ├── SGK primi: %9 (sakatlık durumuna göre değişir)
    │   │   ├── Sakatlık oranı %0-40: %9
    │   │   ├── Sakatlık oranı %40-80: %6
    │   │   └── Sakatlık oranı %80+: %4.5
    │   │
    │   └── İşsizlik sigortası: %1
    │
    ├── İşveren Payı (%20.5)
    │   ├── SGK primi: %15.5 (iş yeri riskine göre)
    │   │   ├── 1. risk sınıfı (en az): %1
    │   │   ├── 2. risk sınıfı: %2
    │   │   └── ...
    │   │   └── 32. risk sınıfı (en fazla): %6.5
    │   │
    │   ├── İşsizlik: %2
    │   └── İş yeri riski primi: %0-5
    │
    ├── SGK Matrahı
    │   ├── Brüt ücret
    │   ├── Yemek + ulaşım (sınırlı)
    │   ├── Performans primi
    │   └── İkramiye (sınırlı)
    │
    └── Tavan ve Taban
        ├── Tavan: 2026 yılı günlük asgari ücret x 30
        └── Taban: Asgari ücret
```

### SGK İstisnaları
- **Yemek yardımı:** Aylık max 34.01 TL (2026)
- **Ulaşım yardımı:** Aylık max 34.01 TL (2026)
- **Çocuk zammı:** Sadece SGK matrahında

---

## Pattern 3: Gelir Vergisi ve AGİ

### Vergi Hesaplama ve Asgari Geçim İndirimi
```
Gelir Vergisi Sistemi
    │
    ├── Vergi Matrahı
    │   ├── Brüt maaş
    │   ├── - SGK işçi payı
    │   ├── - SGK istisnaları
    │   └── = Matrah
    │
    ├── Vergi Dilimleri (2026)
    │   ├── 1. Dilim: 0 - 228.700 TL → %15
    │   ├── 2. Dilim: 228.701 - 548.000 TL → %20
    │   ├── 3. Dilim: 548.001 - 1.500.000 TL → %27
    │   ├── 4. Dilim: 1.500.001 - 4.000.000 TL → %35
    │   └── 5. Dilim: 4.000.001+ TL → %40
    │
    ├── Asgari Geçim İndirimi (AGİ)
    │   ├── Bekâr: 268.33 TL/ay
    │   ├── Evli (eş çalışmıyor): 402.50 TL/ay
    │   ├── Evli (eş çalışıyor): 268.33 TL/ay
    │   ├── + 1 çocuk: +89.44 TL
    │   ├── + 2 çocuk: +178.88 TL
    │   └── + 3 çocuk: +268.33 TL (max)
    │
    └── Damga Vergisi
        └── Brüt x %0.6
```

### AGİ Hesaplama Formülü
```
AGİ = Asgari Ücret x AGİ Oranı

AGİ Oranı:
- Bekâr: %50
- Evli (eş çalışmıyor): %75
- Evli (eş çalışıyor): %50
- 1. çocuk: +%7.5
- 2. çocuk: +%7.5
- 3. çocuk: +%5
```

---

## Pattern 4: İşe Giriş ve Çıkış Hesaplamaları

### Çalışma Süresi ve Kıdem Tazminatı
```
İşe Giriş/Çıkış Hesaplamaları
    │
    ├── İşe Giriş
    │   ├── SGK kaydı (7 gün içinde)
    │   ├── İşe başlama belgesi
    │   ├── Deneme süresi takibi
    │   └── Asgari ücret hesabı (gün bazlı)
    │
    ├── Çalışma Süresi Hesabı
    │   ├── Tam çalışma günü
    │   ├── Yarım gün / eksik gün
    │   ├── Yıllık izin günleri
    │   ├── İzinli günler
    │   └── Hastalık günleri
    │
    ├── Kıdem Tazminatı
    │   ├── Çalışılan her yıl = 30 günlük ücret
    │   ├── Tavan: En son brüt maaş x 30
    │   ├── İhbar süresi (kıdem tazminatı değil)
    │   └── Fesih türüne göre hak ediş
    │
    ├── İhbar Süreleri
    │   ├── 0-6 ay çalışma: 2 hafta
    │   ├── 6 ay-1.5 yıl: 4 hafta
    │   ├── 1.5-3 yıl: 6 hafta
    │   ├── 3 yıl+: 8 hafta
    │
    └── Çıkış İşlemleri
        ├── İşten ayrılış bildirgeleri
        ├── Çıkış kodu (isten çıkış/kendi isteği)
        ├── Kıdem tazminatı (hak ediş)
        ├── İhbar tazminatı (ihlal durumunda)
        ├── Kullanılmayan izinler
        └── SGK çıkış işlemi
```

### Gün Hesaplama Örneği
- **Asgari ücret günlük:** 2026 için ~866.70 TL/gün
- **Çalışma günü:** Ayda 30 gün (bazlı)
- **Eksik gün:** Kesinti = (Brüt / 30) x Eksik gün

---

## Key Patterns

| Pattern | Açıklama | Kullanım Alanı |
|---------|----------|----------------|
| Brüt/Net | Maaş hesaplama | Bordro hazırlama |
| SGK | Prim kesintileri | İşçi/işveren maliyeti |
| Gelir Vergisi | Kademeli hesap | Vergi kesintisi |
| AGİ | Asgari geçim indirimi | Net maaş |
| Kıdem | Çalışma süresi | İş çıkış |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```javascript
// Yanlış: SGK oranını sabitleme
const sgkPayı = brüt * 0.10; // %9 değişir, sabit değil

// Yanlış: AGİ'yi atlama
const net = brüt - sgk - vergi; // AGİ eklenmedi

// Yanlış: Vergi dilimi tek oran
const vergi = matrah * 0.20; // Kademeli hesap gerekli

// Yanlış: Tavan/taban kontrolü yok
const sgk = brüt * 0.09; // Tavan üstü matrah düzeltilmeli

// Yanlış: Yarım çalışma günü ihmal
const maaş = brüt; // Eksik gün kesintisi yapılmadı
```

### ✅ Doğru Uygulamalar

```javascript
// Doğru: Kademeli gelir vergisi
function hesaplaVergi(matrah) {
  const dilimler = [
    { üst: 228700, oran: 0.15 },
    { üst: 548000, oran: 0.20 },
    { üst: 1500000, oran: 0.27 },
    { üst: 4000000, oran: 0.35 },
    { üst: Infinity, oran: 0.40 }
  ];
  
  let vergi = 0, onceki = 0;
  for (const d of dilimler) {
    if (matrah > onceki) {
      const kısım = Math.min(matrah, d.üst) - onceki;
      vergi += kısım * d.oran;
      onceki = d.üst;
    }
  }
  return vergi / 12; // Aylık
}

// Doğru: SGK hesaplama (tavan dahil)
function hesaplaSGK(brüt, tavan, sakatlıkOranı) {
  const matrah = Math.min(brüt, tavan);
  const sgkOranı = sakatlıkOranı >= 80 ? 0.045 :
                   sakatlıkOranı >= 40 ? 0.06 : 0.09;
  return matrah * (sgkOranı + 0.01); // SGK + işsizlik
}

// Doğru: AGİ hesaplama
function hesaplaAGI(medeniDurum, cocukSayisi, asgariÜcret) {
  let oran = medeniDurum === "evli" ? 0.75 : 0.50;
  if (medeniDurum === "evli" && eşÇalışıyor) oran = 0.50;
  oran += Math.min(cocukSayisi, 3) * 0.075;
  return asgariÜcret * oran;
}

// Doğru: Net maaş hesabı
function hesaplaNet(brüt) {
  const tavan = 150000; // 2026
  const sgk = hesaplaSGK(Math.min(brüt, tavan), tavan, 0);
  const matrah = brüt - sgk;
  const vergi = hesaplaVergi(matrah * 12) / 12;
  const agi = hesaplaAGI("bekar", 0, 42504);
  return brüt - sgk - vergi + agi;
}
```

---

## Quick Reference

| Kalem | Oran | Not |
|-------|------|-----|
| SGK İşçi | %9 | Sakatlık durumuna göre değişir |
| İşsizlik (İşçi) | %1 | |
| Gelir Vergisi | %15-40 | Kademeli |
| Damga Vergisi | %0.6 | Brüt üzerinden |
| SGK İşveren | %15.5-20.5 | İş yeri riskine göre |
| İşsizlik (İşveren) | %2 | |

| AGİ (2026) | Aylık |
|------------|-------|
| Bekâr | 268.33 TL |
| Evli (eş çalışmıyor) | 402.50 TL |
| Evli (eş çalışıyor) | 268.33 TL |
| +1 çocuk | +89.44 TL |
| +2 çocuk | +178.88 TL |
| +3 çocuk | +268.33 TL (max) |

| İhbar Süresi | Kıdem |
|--------------|-------|
| 0-6 ay | 2 hafta |
| 6 ay-1.5 yıl | 4 hafta |
| 1.5-3 yıl | 6 hafta |
| 3 yıl+ | 8 hafta |
