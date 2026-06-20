---
name: budget-planner
description: "Şirket/birey bütçe planlama. Gelir-gider kategorileri. Tasarruf hedefleri. Acil durum fonu. Borç yönetimi. Bütçe varyans analizi."
triggers:
  keywords: ["bütçe planlama", "bütçe oluşturma", "bütçe yönetimi", "budget planning", "budget", "tasarruf hedefi", "acıl durum fonu"]
auto_load_when: "Kullanıcı şirket veya bireysel bütçe planlama, tasarruf hedefleri veya bütçe analizi taleplerinde bulunduğunda"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch", "Grep"]
---

# Bütçe Planlayıcı (Budget Planner)

**Odak Alanı:** Şirket ve bireysel bütçe planlama, gelir-gider kategorileri, tasruf hedefleri, borç yönetimi.

---

## Pattern 1: Bütçe Yapısı Oluşturma

### Gelir ve Gider Kategorileri
```
Bütçe Kategorileri (Bireysel)
    │
    ├── Gelir Kategorileri
    │   ├── Ücret Gelirleri
    │   │   ├── Maaş (net)
    │   │   ├── Bonus/Prim
    │   │   └── Yan gelir
    │   │
    │   ├── Yatırım Gelirleri
    │   │   ├── Faiz geliri
    │   │   ├── Temettü
    │   │   ├── Kira geliri
    │   │   └── Sermaye kazancı
    │   │
    │   └── Diğer Gelirler
    │       ├── Hibe/ yardım
    │       ├── Emekli maaşı
    │       └── Miras/hediye
    │
    └── Gider Kategorileri
        ├── Zorunlu Giderler
        │   ├── Konut (kira/ipotek)
        │   ├── Faturalar (elektrik, su, doğalgaz)
        │   ├── İnternet/telefon
        │   ├── Sigorta (sağlık, araç)
        │   └── Vergi/SSK
        │
        ├── Yaşam Giderleri
        │   ├── Gıda
        │   ├── Ulaşım
        │   ├── Giyim
        │   ├── Sağlık
        │   └── Eğitim
        │
        ├── İsteğe Bağlı Giderler
        │   ├── Eğlence
        │   ├── Hobi
        │   ├── Abonelikler
        │   └── Seyahat
        │
        └── Tasarruf ve Yatırım
            ├── Acil durum fonu
            ├── Emeklilik yatırımı
            ├── Borç ödemesi
            └── Finansal hedefler
```

### Şirket Bütçe Yapısı
```
Bütçe Kategorileri (Şirket)
    │
    ├── Gelir Bütçesi
    │   ├── Satış geliri
    │   ├── Diğer gelirler
    │   └── Gelir toplam
    │
    ├── Gider Bütçesi
    │   ├── Satınalma maliyeti
    │   ├── Personel giderleri
    │   ├── Kira ve ütility
    │   ├── Pazarlama/reklam
    │   ├── AR-GE
    │   ├── Genel yönetim gideri
    │   └── Amortisman
    │
    ├── Yatırım Bütçesi
    │   ├── Sabit kıymet yatırımı
    │   ├── Teknoloji yatırımı
    │   ├── İşletme sermayesi
    │   └── AR-GE yatırımı
    │
    └── Finansman Bütçesi
        ├── Kredi geri ödemeleri
        ├── Faiz ödemeleri
        ├── Temettü ödemesi
        └── Nakit yönetimi
```

---

## Pattern 2: Tasarruf Hedefleri ve Acil Durum Fonu

### Finansal Hedef Belirleme
```
Tasarruf Hedefleri Sistemi
    │
    ├── Kısa Vadeli (0-1 yıl)
    │   ├── Acil durum fonu (3-6 ay)
    │   ├── Tatil fonu
    │   ├── Elektronik alım
    │   └── Beklenmedik harcamalar
    │
    ├── Orta Vadeli (1-5 yıl)
    │   ├── Araba alımı
    │   ├── Ev depozitosu
    │   ├── Eğitim fonu
    │   ├── Düğün/hayır
    │   └── Tadilat
    │
    ├── Uzun Vadeli (5+ yıl)
    │   ├── Ev satın alma
    │   ├── Emeklilik fonu
    │   ├── Çocuk eğitim fonu
    │   └── Finansal özgürlük
    │
    └── Hedef Önceliklendirme
        ├── Öncelik sırası
        ├── Zamanlama
        ├── Miktar hedefi
        ├── Aylık tasarruf gereksinimi
        └── Mevcut birikim
```

### Acil Durum Fonu Hesaplama
```
Acil Durum Fonu = Aylık Gider x Hedef Ay

Hesaplama:
- Minimum: 3 aylık gider
- Tavsiye: 6 aylık gider
- İdeal: 12 aylık gider (uzun vadeli)

Formül:
acilFon = (gıda + konut + ulaşım + faturalar + diğer) x hedefAy
```

---

## Pattern 3: Borç Yönetimi

### Borç Ödeme Stratejileri
```
Borç Yönetim Yaklaşımları
    │
    ├── Borç Önceliklendirme
    │   ├── Yüksek faizli önce (Avalanche)
    │   ├── Düşük bakiye önce (Snowball)
    │   ├── Karma yöntem
    │   └── Faiz oranı karşılaştırması
    │
    ├── Borç Ödeme Yöntemleri
    │   ├── Minimum ödeme
    │   ├── Standart ödeme
    │   ├── Ek ödeme
    │   └── Bir defada ödeme
    │
    ├── Kredi Yapılandırma
    │   ├── Transfer (düşük faiz)
    │   ├── Konsolidasyon
    │   ├── Kredi ile kredi ödeme
    │   └── Yeniden yapılandırma
    │
    └── Borç Önleme
        ├── Bütçe ile kontrol
        ├── Acil fon kullanımı
        ├── Kredi kartı limiti
        └── Harca-öde denge
```

### Ödeme Stratejileri
```javascript
// Avalanche Yöntemi (Yüksek faiz önce)
function avalanche(borçlar) {
  const sıralı = borçlar.sort((a, b) => b.faiz - a.faiz);
  let ekÖdeme = 500;
  
  for (const b of sıralı) {
    if (b === sıralı[0]) {
      b.ödeme += ekÖdeme;
    }
  }
  return sıralı;
}

// Snowball Yöntemi (Düşük bakiye önce)
function snowball(borçlar) {
  const sıralı = borçlar.sort((a, b) => a.bakiye - b.bakiye);
  let ekÖdeme = 500;
  
  for (const b of sıralı) {
    if (b === sıralı[0]) {
      b.ödeme += ekÖdeme;
    }
  }
  return sıralı;
}
```

---

## Pattern 4: Bütçe Varyans Analizi

### Plan vs Fiili Karşılaştırma
```
Varyans Analiz Süreci
    │
    ├── Veri Toplama
    │   ├── Planlanan bütçe
    │   ├── Fiili harcama
    │   ├── Sapma hesaplama
    │   └── Neden analizi
    │
    ├── Varyans Hesaplama
    │   ├── Mutlak fark = Fiili - Plan
    │   ├── Yüzde fark = (Mutlak / Plan) * 100
    │   ├── Sapma yönü (olumlu/olumsuz)
    │   └── Kritik eşik kontrolü
    │
    ├── Raporlama
    │   ├── Tablo formatında
    │   ├── Renk kodlaması
    │   ├── Trend açıklaması
    │   └── Öneriler
    │
    └── Düzeltici Eylem
        ├── Sapma nedeni
        ├── Alternatif çözüm
        ├── Bütçe revizyonu
        └── Önümüzdeki dönem
```

### Varyans Kodlaması
```
Renk Sistemi:
- Yeşil: Sapma < %5 (Normal)
- Sarı: Sapma %5-15 (Dikkat)
- Kırmızı: Sapma > %15 (Kritik)

Olumlu/Olumsuz (Gelir):
- Olumlu: Fiili > Plan (+)
- Olumlu: Fiili < Plan (-)

Olumlu/Olumsuz (Gider):
- Olumlu: Fiili < Plan (-)
- Olumlu: Fiili > Plan (+)
```

---

## Pattern 5: Bütçe Planlama Süreci

### Aşamalı Planlama
```
Bütçe Hazırlama Aşamaları
    │
    ├── 1. Değerlendirme
    │   ├── Mevcut durum analizi
    │   ├── Geçmiş veriler
    │   ├── Hedefler belirleme
    │   └── Kısıtları tespit
    │
    ├── 2. Planlama
    │   ├── Gelir projeksiyonu
    │   ├── Gider tahmini
    │   ├── Tasarruf hedefleri
    │   └── Kategori dağılımı
    │
    ├── 3. Uygulama
    │   ├── Aylık bütçe oluşturma
    │   ├── Harcama takibi
    │   ├── Düzenli kayıt
    │   └── Otomatik biriktirme
    │
    ├── 4. İzleme
    │   ├── Haftalık kontrol
    │   ├── Kategori bazlı takip
    │   ├── Sapma analizi
    │   └── Raporlama
    │
    └── 5. Değerlendirme
        ├── Aylık özet
        ├── Hedef karşılaştırması
        ├── Öğrenilen dersler
        └── Sonraki dönem iyileştirme
```

---

## Key Patterns

| Pattern | Açıklama | Kullanım Alanı |
|---------|----------|----------------|
| Kategori Planı | Gelir/gider sınıflandırma | Bütçe oluşturma |
| Tasarruf Hedefi | Finansal hedefler | Birikim |
| Acil Fon | Beklenmedik gider | Risk yönetimi |
| Borç Yönetimi | Ödeme stratejisi | Kredi kontrolü |
| Varyans Analizi | Plan/fiili karşılaştırma | Performans |
| Takip Sistemi | İzleme ve raporlama | Kontrol |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```javascript
// Yanlış: Bütçe yok
const bütçe = {}; // Plansız harcama

// Yanlış: Gerçekçi olmayan hedef
const hedef = gelir * 1.5; // Gelirden fazla tasarruf

// Yanlış: Acil fon ihmal
const acilFon = 0; // Riskli durum

// Yanlış: Gider kategorisi yok
const gider = toplam; // Takip edilemiyor

// Yanlış: Düzensiz takip
const takip = "bazen"; // Tutarsız
```

### ✅ Doğru Uygulamalar

```javascript
// Doğru: Kapsamlı bütçe
function oluşturBütçe(gelir) {
  return {
    zorunlu: gelir * 0.50,
    yaşam: gelir * 0.20,
    isteğeBağlı: gelir * 0.10,
    tasarruf: gelir * 0.15,
    borçÖdeme: gelir * 0.05
  };
}

// Doğru: Acil fon hedefi
function hesaplaAcilFon(giderler) {
  const aylıkGider = giderler.toplam;
  return {
    minimum: aylıkGider * 3,
    tavsiye: aylıkGider * 6,
    ideal: aylıkGider * 12
  };
}

// Doğru: Varyans analizi
function varyans(plan, fiili) {
  const mutlak = fiili - plan;
  const yüzde = (mutlak / plan) * 100;
  const renk = Math.abs(yüzde) < 5 ? "yeşil" :
               Math.abs(yüzde) < 15 ? "sarı" : "kırmızı";
  
  return { mutlak, yüzde, renk, kritik: Math.abs(yüzde) > 15 };
}

// Doğru: Tasarruf hedefi zamanlama
function tasarrufHesapla(hedef, mevcut, vadeAy) {
  const kalan = hedef - mevcut;
  const aylık = kalan / vadeAy;
  return { hedef, kalan, aylık, gerçekçi: aylık <= gelir * 0.2 };
}
```

---

## Quick Reference

| Kategori | Bireysel % | Şirket % |
|----------|------------|----------|
| Zorunlu Gider | 40-50% | - |
| Yaşam | 15-25% | - |
| İsteğe Bağlı | 10-15% | - |
| Tasarruf | 10-20% | - |
| Personel | - | 30-40% |
| Satınalma | - | 25-35% |
| Pazarlama | - | 5-15% |
| AR-GE | - | 3-10% |

| Acil Fon | Miktar | Kullanım |
|----------|--------|----------|
| Minimum | 3 ay gider | Beklenmedik |
| Tavsiye | 6 ay gider | Güvenli |
| İdeal | 12 ay gider | Tam koruma |

| Varyans Renk | Sapma | Eylem |
|--------------|-------|-------|
| Yeşil | < %5 | Normal |
| Sarı | %5-15 | Dikkat |
| Kırmızı | > %15 | Müdahale |

| Tasarruf Hedefi | Vade | Örnek |
|-----------------|------|-------|
| Kısa | 0-1 yıl | Tatil, elektronik |
| Orta | 1-5 yıl | Araba, ev deposu |
| Uzun | 5+ yıl | Emeklilik, ev |
