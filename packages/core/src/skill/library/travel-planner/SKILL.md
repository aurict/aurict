---
name: travel-planner
description: Seyahat programı oluşturma, bütçe planlama, uçuş/otel karşılaştırma, itinerary şablonu ve yerel ipuçları sunma becerisi.
triggers:
  - "Tatil planı yapmak istiyorum"
  - "En uygun uçuşu bul"
  - "X şehrinde 3 gün ne yapabilirim"
  - "Seyahat bütçesi hesapla"
  - "Itinerary oluştur"
auto_load_when:
  - Kullanıcı seyahat, tatil, gezi kelimelerini kullanır
  - Uçuş, otel, konaklama talepleri
  - Şehir rehberi veya turistik bilgi istekleri
agent: content-ops
tools:
  - web-search
  - currency-converter
  - timezone-calculator
---

# Travel Planner — Seyahat Planlama Uzmanı

Seyahat planlama skill'i, kullanıcıların unutulmaz seyahat deneyimleri tasarlamalarına yardımcı olur. Bütçe optimizasyonundan yerel ipuçlarına kadar tüm seyahat bileşenlerini entegre eder.

## Temel Pattern: Seyahat Planı Oluşturma

### 1. Keşif ve Tercih Toplama

```
GİRİŞ
├── Varlık:
│   ├── Harcama limiti (bütçe)
│   ├── Tarih aralığı
│   ├── Kişi sayısı
│   ├── Ulaşım tercihi (uçak/tren/otobüs)
│   └── Konaklama tercihi (otel/hostel/Airbnb)
│
├── Kısıtlamalar:
│   ├── Engelli erişimi gereksinimleri
│   ├── Diyet kısıtlamaları
│   ├── Vize gereksinimleri
│   └── Sağlık koşulları
│
└── Tercihler:
    ├── Aktivite türleri (kültür/macera/relax)
    ├── Yemek tercihleri
    └── Fitness/aktivite seviyesi
```

### 2. Bütçe Dağılımı (50/30/20 Kuralı)

```
TOPLAM BÜTÇE
├── Ulaşım (30-40%)
│   ├── Uçuş/transferler
│   ├── Günlük ulaşım (toplu taşıma/taksi)
│   └── Araç kiralama (gerekiyorsa)
│
├── Konaklama (30-40%)
│   ├── Otel/hostel ücreti × gece sayısı
│   └── Temizlik ücretleri
│
├── Aktiviteler (15-25%)
│   ├── Tur ücretleri
│   ├── Müze/ören yeri girişleri
│   └── Özel deneyimler
│
└── Yemek & Diğer (15-20%)
    ├── Günlük yemek bütçesi
    ├── Alışveriş
    └── Beklenmedik harcamalar (buffer)
```

### 3. Günlük Itinerary Yapısı

```
GÜN X — [Tarih]
├── SABAH (09:00-12:00)
│   ├── [Aktivite 1] — [Süre: X saat]
│   │   ├── Adres: [...]
│   │   ├── Giriş ücreti: [...]
│   │   └── İpucu: [...]
│   └── [Aktivite 2] — [Süre: X saat]
│
├── ÖĞLE (12:00-14:00)
│   ├── Yemek önerisi: [Restoran adı]
│   │   ├── Mutfak türü: [...]
│   │   ├── Ortalama hesap: [...]
│   │   └── Rezervasyon gerekli mi? [...]
│   └── Alternatif: [...]
│
├── İKİNDİ (14:00-18:00)
│   └── [Aktivite 3/4]
│
└── AKŞAM (18:00+)
    ├── Akşam yemeği
    └── Gece aktivitesi (varsa)
```

### 4. Uçuş/otel Karşılaştırma Kriterleri

```
KARŞILAŞTIRMA MATRİSİ
├── Fiyat (önem: ★★★★★)
│   ├── Tek yön / gidiş-dönüş
│   ├── Bagaj hakkı dahil mi?
│   └── Gizli ücretler var mı?
│
├── Süre (önem: ★★★★☆)
│   ├── Direkt / aktarmalı
│   ├── Bekleme süresi
│   └── Zaman dilimi değişikliği
│
├── Konum (önem: ★★★★☆)
│   ├── Havalimanı merkeze uzaklığı
│   └── Transfer seçenekleri
│
├── Değerlendirme (önem: ★★★☆☆)
│   ├── Puan (1-10 veya yıldız)
│   ├── Son yorumlar
│   └── Temizlik/servis
│
└── Esneklik (önem: ★★★☆☆)
    ├── İptal koşulları
    └── Değişiklik ücreti
```

## Key Patterns

### Pattern 1: Multi-City Rota Optimizasyonu
- En kısa toplam mesafeyi hesapla
- Gece konaklaması gereken şehirleri belirle
- Bağlantı sürelerini optimize et

### Pattern 2: Peak/Off-Peak Zamanlama
- Turist sezonu dışında seyahat et
- Hafta içi uçuşları tercih et
- Erken rezervasyon avantajlarını kullan

### Pattern 3: Yöresel Deneyim Entegrasyonu
- Yerel rehberlik hizmetleri
- Ev yemekleri deneyimleri
- Gizli mücevherler (off-the-beaten-path)

### Pattern 4: Acil Durum Planı
- Sağlık sigortası detayları
- Acil durum numaraları
- Konsolosluk bilgileri
- Yedek konaklama seçenekleri

## Anti-Patterns

```
❌ Tüm bütçeyi tek bir kategoriye ayırmak
   // "Sadece uçuşları ayırdım, yemek için param yok"
   → Her kategori için alt limit belirle

❌ Günlük programı saatine kadar planlamak
   // "09:00 kahvaltı, 09:30 çıkış, 10:00 müze..."
   → Esnek bloklar oluştur, 30dk buffer ekle

❌ Sadece popüler turistik yerleri planlamak
   // "Sadece Eiffel Kulesi ve Louvre"
   → Yerel mahalleleri ve gizli noktaları dahil et

❌ Yerel ulaşım maliyetini hesaplamamak
   // "Havalimanından otele taksi pahalıymış"
   → Önceden ulaşım seçeneklerini araştır

❌ Vize/passaport süresini kontrol etmemek
   // "Pasaportum 2 ay sonra bitiyor"
   → Minimum 6 ay geçerlilik kuralını uygula

✅ Her gün için 2-3 ana aktivite + buffer
✅ Toplam bütçenin %10'unu yedek olarak ayır
✅ Yerel sim kart/WiFi planını önceden hall et
✅ Önemli belgelerin kopyalarını sakla
```

## Quick Reference

| Parametre | Değer | Not |
|---|---|---|
| **Bütçe Dağılımı** | Ulaşım %30, Konaklama %35, Aktiviteler %20, Yemek %15 | Gerektiğinde ayarla |
| **Günlük Aktivite** | 2-3 ana aktivite | Yoğunluk tercihine göre |
| **Buffer Süresi** | Aktiviteler arası 30-60dk | Transferler için |
| **Yedek Bütçe** | Toplamın %10'u | Beklenmedik harcamalar |
| **Rezervasyon Önceliği** | 1. Uçak, 2. Otel, 3. Aktiviteler | Erken rezervasyon |
| **Uçuş Seçimi** | Direkt > Aktarmalı (2hr < bekleme < 4hr) | Zaman dengesi |
| **Otele Yaklaşım** | Merkeze yakın + değerlendirme 8+ | Ulaşım zamanı |
| **Bagaj Stratejisi** | Kabin bagajı mümkünse | Ek ücret yok |
| **Yemek Bütçesi** | €15-25 (ortalama), €40+ (özel) | Şehre göre değişir |
| **Vize Geçerliliği** | Minimum 6 ay | Giriş tarihinden itibaren |

---

*Travel Planner v1.0 — Bon voyage!*
