---
name: interior-design-ideator
description: İç mimari fikirler sunma, renk paleti oluşturma, mobilya yerleşimi planlama, stil önerileri yapma ve bütçe tahmini çıkarma becerisi.
triggers:
  - "Oturma odası dekorasyonu"
  - "Evim için renk önerisi"
  - "Mobilya düzeni nasıl olmalı"
  - "İç mimari fikir"
  - "Mutfak tasarımı"
auto_load_when:
  - İç mimari, dekorasyon, mobilya
  - Renk paleti, tasarım, stil
  - Ev, oda, mekan düzenleme
agent: docs-agent
tools:
  - color-palette-generator
  - furniture-layout-planner
  - style-matcher
---

# Interior Design Ideator — İç Mimari Tasarım Uzmanı

İç mimari fikir üretme skill'i, kullanıcıların yaşam alanlarını fonksiyonel ve estetik açıdan optimize etmelerine yardımcı olur. Stil, renk, ışık ve bütçe dengesini göz önünde bulundurur.

## Temel Pattern: İç Mimari Tasarım Süreci

### 1. Mekan Analizi

```
MEKAN DEĞERLENDİRME
├── FİZİKSEL ÖZELLİKLER:
│   ├── m² / boyutlar
│   ├── Tavan yüksekliği
│   ├── Pencereler (sayı, yön, boyut)
│   ├── Kapı konumu
│   └── Kötü plan (radiator, kolon, vs.)
│
├── IŞIK DURUMU:
│   ├── Doğal ışık seviyesi
│   ├── Kuzey/Güney/Ebat yönü
│   ├── Gölgelik ihtiyacı
│   └── Yapay aydınlatma potansiyeli
│
├── KULLANIM AMAÇLARI:
│   ├── Birincil fonksiyon (oturma/yatma/çalışma)
│   ├── İkincil fonksiyonlar
│   ├── Kaç kişi kullanacak?
│   └── Evcil hayvan/çocuk var mı?
│
└── MEVCUT DURUM:
    ├── Mevcut mobilya (kullanılacak/kalacak)
    ├── Kısıtlamalar (kira/borç)
    └── Taşıma/zaman limiti
```

### 2. Stil Kategorileri ve Karakteristikleri

```
STİL MATRİSİ
├── MODERN/MİNİMALİST:
│   ├── Renk: Nötr + tek vurgu
│   ├── Form: Düz hatlar, basit geometri
│   ├── Malzeme: Cam, metal, düz ahşap
│   ├── Örnek: Eames, IKEA modern
│   └── ⚠️ Sıcaklık eksikliği riski
│
├── SCANDİNAVİYAN:
│   ├── Renk: Pasteller, açık ahşap
│   ├── Form: Fonksiyonel, yumuşak köşeler
│   ├── Malzeme: Huş, oak, keten, yün
│   ├── Örnek: Muuto, Normann Copenhagen
│   └── ✓ Huzurlu, davetkar
│
├── ENDÜSTRİYEL:
│   ├── Renk: Gri, siyah, pas kahve
│   ├── Form: Ham, brutal, vintage
│   ├── Malzeme: Beton, tuğla, metal
│   ├── Örnek: Loft apartmanlar
│   └── ⚠️ Karanlık his riski
│
├── BOHO/BOHEM:
│   ├── Renk: Earth tones, canlı desenler
│   ├── Form: Eklektik, katmanlı
│   ├── Malzeme: Doğal fiber, kilim, bitki
│   ├── Örnek: Marakes tarzı
│   └── ✓ Rahat, özgür
│
├── KLASİK/GELENEKSEL:
│   ├── Renk: Koyu ahşap, altın, krem
│   ├── Form: Simetrik, süslü detaylar
│   ├── Malzeme: Cila ahşap, kadife
│   ├── Örnek: Klasik Avrupa
│   └── ⚠️ Gösterişli olabilir
│
└── JAPON/MİNİMALİZM:
    ├── Renk: Siyah, beyaz, ahşap
    ├── Form: Asimetrik, nefes alan
    ├── Malzeme: Bambu, hasır, kağıt
    ├── Örnek: Wabi-sabi
    └── ✓ Huzur, sadelik
```

### 3. Renk Paleti Oluşturma

```
RENK SİSTEMİ (60-30-10 Kuralı)
├── HÂKİM RENK (60%):
│   ├── Duvarlar, zemin, büyük mobilyalar
│   ├── Nötr ton: Beyaz, gri, bej, krem
│   └── Örnek: SW 7005 Pure White
│
├── DESTEKLEYİCİ RENK (30%):
│   ├── Orta boy mobilyalar, perdeler
│   ├── Orta ton: Mavi, yeşil, toprak
│   └── Örnek: SW 0052 Abstain
│
├── VURGU RENGİ (10%):
│   ├── Yastıklar, sanat, aksesuar
│   ├── Canlı/koyu ton: Sarı, kırmızı, turuncu
│   └── Örnek: SW 6904 Galloom
│
└── SICIOK SOĞUK DENGE:
    ├── Sıcak tonlar (güney): Sarı, turuncu
    ├── Soğuk tonlar (kuzey): Mavi, yeşil, mor
    └── Nötr denge: Gri, bej, krem
```

### 4. Mobilya Yerleşim Prensipleri

```
YERLEŞİM KURALLARI
├── OTURMA GRUBU:
│   ├── Konuşma için: Sofa karşılıklı, 90° L
│   ├── TV için: Sofa karşısında TV, koltuklar yan
│   ├── Açık plan: Rug ile alan bölme
│   └── Mesafe: Sofa-koltuk arası 45-60cm
│
├── YÜRÜME YOLU:
│   ├── Ana yol: 80-90cm genişlik minimum
│   ├── Sofa önü: 40-50cm (oturma mesafesi)
│   ├── Yemek masası: Her kişi için 60cm
│   └── Mutfak tezgâhı: 90cm çalışma alanı
│
├── DUVARDAKİ MOBİLYA:
│   ├── Yatak başı: Yatağın 2/3 genişliğinde
│   ├── Kitaplık: Göz hizasına kadar
│   ├── TV: Göz hizasında (oturma pozisyonu)
│   └── Sanat: Orta nokta göz hizasında
│
└── FONKSİYONEL BÖLGELER:
    ├── Çalışma köşesi: Pencere yanı, güzel ışık
    ├── Okuma köşesi: Rahat koltuk + lamba
    ├── Yemek: Gün ışığı veya özel aydınlatma
    └── Depolama: Gizli, erişilebilir
```

### 5. Bütçe Dağılımı

```
BÜTÇE PLANI
├── BÜYÜK PARÇALAR (40-50%):
│   ├── Sofa/kanepe
│   ├── Yatak/şilte
│   ├── Yemek masası
│   └── Dolap/depo birimi
│
├── ORTA PARÇALAR (20-30%):
│   ├── Koltuklar
│   ├── Sehpalar
│   ├── Aydınlatma armatürleri
│   └── Halı (büyük)
│
├── DEKORASYON (15-20%):
│   ├── Sanat/eser
│   ├── Yastıklar/örütüler
│   ├── Bitkiler
│   └── Aksesuarlar
│
├── DUVAR & ZEMİN (10-15%):
│   ├── Boya/tapet
│   ├── Perde/žaluzi
│   └── Halı (küçük)
│
└── BUFFER (%10):
    ├── Beklenmedik masraflar
    └── Aksesuar eklemeleri
```

## Key Patterns

### Pattern 1: Function-First Design
- Estetikten önce fonksiyon
- "Bu eşya ne işe yarayacak?"
- Alan kullanım optimizasyonu

### Pattern 2: Scale & Proportion
- Mobilya-oğa orantısı
- Yüksek tavan → büyük mobilya
- Düşük tavan → alçak mobilyalar

### Pattern 3: Layered Lighting
- Ambient + Task + Accent
- Dimmer kullanımı
- Katmanlı ışık = derinlik

### Pattern 4: Texture Mixing
- Malzeme çeşitliliği
- Görsel ilgi yaratma
- Sıcaklık hissi

## Anti-Patterns

```
❌ Her şeyi aynı anda değiştirmek
   // "Tüm evi sıfırdan yapalım"
   → Evre evre ilerle

❌ Trend takıntısı
   // "Bu yılın rengi bu, şart"
   → Zamansız seçimler + küçük trend detayları

❌ Işıklandırmayı sona bırakmak
   // "Işık mı önemli, mobilya önemli"
   → Işık mekanı yaratır

❌ Bütçesiz başlamak
   // "Bakarsın olur"
   → Bütçe belirle, öncelik sırala

❌ Ölçü almadan mobilya almak
   // "Beğendim aldım, sığmıyormuş"
   → Her zaman önce ölç

✅ Mood board oluştur (renk/doku/koleksiyon)
✅ Mobilya yerleşimini kâğıt üstünde planla
✅ Parça parça satın al, bütünü gör
✅ Mevcut parçaları yeniden değerlendir
✅ Işık günün farklı saatlerinde kontrol et
```

## Quick Reference

| Parametre | Değer | Not |
|---|---|---|
| **Renk Dağılımı** | 60% nötr, 30% destek, 10% vurgu | 60-30-10 kuralı |
| **Yürüme Yolu** | Minimum 80cm | Konforlu geçiş |
| **Oturma Mesafesi** | 45-60cm (masa-sofa) | Sohbet için |
| **TV Mesafesi** | Ekran inç × 2.5 = cm | Görüş mesafesi |
| **Yatak Boyutu** | Tek: 90×200, Çift: 160×200 | Standart |
| **Halı Altı Boşluk** | 30-45cm (tüm ayaklar sığmalı) | Sosyal alan |
| **Aydınlatma Yüksekliği** | Sehpa: 40-50cm, Zemin: 150cm | Göz seviyesi |
| **Bütçe Önceliği** | 1. Konfor (şilte), 2. Aydınlatma | Önem sırası |
| **Depolama** | Her oda için görünür + gizli | Düzen |
| **Kişisel Dokunuş** | %20 kişisel + %80 temel | Denge |

---

*Interior Design Ideator v1.0 — Alanınızı hikayeye dönüştürün!*
