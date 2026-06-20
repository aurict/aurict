---
name: gift-recommender
description: Hediye önerileri sunma, bütçe bazlı seçim yapma, yaş/ilgi alanına göre filtreleme ve özel günler için kişiselleştirme becerisi.
triggers:
  - "Hediye önerisi"
  - "Ne hediye alsam"
  - "Doğum günü hediyesi"
  - "Evlilik yıldönümü"
  - "Yılbaşı/annesi/günbatımı hediyesi"
auto_load_when:
  - Hediye, doğum günü, yıl dönümü
  - Armağan, jest, sürpriz
  - Alışveriş, alınabilir, verilebilir
agent: docs-agent
tools:
  - price-compare
  - wishlist-finder
  - occasion-identifier
---

# Gift Recommender — Hediye Danışmanı

Hediye önerme skill'i, her bütçeye ve alıcıya uygun, anlamlı ve unutulmaz hediyeler önerir. Psikolojik bağlam ve unboxing deneyimini de göz önünde bulundurur.

## Temel Pattern: Hediye Seçim Algoritması

### 1. Alıcı Profil Analizi

```
ALICI TANIMA MATRİSİ
├── Demografik Bilgiler:
│   ├── Yaş grubu (çocuk/genç/Yetişkin/yaşlı)
│   ├── Cinsiyet (kendini nasıl tanımlıyor)
│   ├── İlişki (aile/arkadaş/iş/romantik)
│   └── Kültürel arka plan
│
├── İlgi Alanları:
│   ├── Hobiler (spor, sanat, teknoloji, doğa)
│   ├── Tutkular ( koleksiyon, yemek, seyahat)
│   ├── Değerler (çevre, toplum, gelenek)
│   └── Takip ettiği içerikler
│
├── Yaşam Tarzı:
│   ├── Evcil hayvan sahibi mi?
│   ├── Aktif mi sedanter mi?
│   ├── Ev aşçısı mı dışarı yiyen mi?
│   └── Teknoloji kullanım seviyesi
│
└── Önceki Hediyeler:
    ├── Ne tür hediyeler aldı?
    ├── Nelerden hoşlandı/hoşlanmadı?
    └── Sürpriz mi yoksa istek mi?
```

### 2. Bütçe Kategorileri

```
BÜTÇE SKALASI
├── MİCRO (₺50-150)
│   ├── Anlamlı notlar/mektuplar
│   ├── El yapımı ürünler
│   ├── Kitap, çikolata, mum
│   ├── Bitki/küçük saksı
│   └── Fotoğraf albümü
│
├── ENTRY (₺150-500)
│   ├── Giyim aksesuarları
│   ├── Orta kalite kulaklık
│   ├── Deneyim kuponu
│   ├── Özel baskı ürünler
│   └── Kaliteli yemek seti
│
├── PREMIUM (₺500-2000)
│   ├── Teknoloji aksesuarları
│   ├── Kaliteli deri ürünler
│   ├── Altın/küçük mücevher
│   ├── Yakut/özel deneyim
│   └── Designer ürünler
│
├── LUXURY (₺2000+)
│   ├── Saat, mücevher
│   ├── Elektronik cihazlar
│   ├── Sanat eserleri
│   ├── Özel tasarım ürünler
│   └── Unutulmaz deneyimler
│
└── PRENSİP:
    ├── Bütçeyi aşma, yaratıcılığı artır
    └── Düşünce > Fiyat (genellikle)
```

### 3. Özel Günler Kataloğu

```
ÖZEL GÜN TAKVİMİ
├── YILBAŞI (1 Ocak)
│   ├── Sıcak tutan hediyeler (atkı, eldiven)
│   ├── Aile fotoğrafı çerçevesi
│   └── Yeni yıl planlama defteri
│
├── SEVGİLİLER GÜNÜ (14 Şubat)
│   ├── Romantik deneyimler
│   ├── Kişiselleştirilmiş mücevher
│   └── El yazısı mektup + çiçek
│
├── ANNELER GÜNÜ
│   ├── Deneyim hediyeleri (spa, brunch)
│   ├── El yapımı / kişisel
│   └── Hatıra eşyaları
│
├── DOĞUM GÜNÜ
│   ├── Hobilerine yönelik
│   ├── Sürpriz party + hediye
│   └── "Dilek" temalı hediyeler
│
├── EVLİLİK YILDÖNÜMÜ
│   ├── Her yıl için sembolik: Kağıt, pamuk...
│   ├── Romantik kaçamağ
│   └── Anı albümü
│
└── MEZUNİYET
    ├── Kariyer odaklı
    ├── Sembolik (diploma çerçevesi)
    └── Macera deneyimi
```

### 4. Unboxing Deneyimi Tasarımı

```
UNBOXING EXPERIENCE FLOW
├── PAKETLEME KATMANLARI:
│   ├── Dış: Gift box / branded bag
│   ├── Orta: Tissue paper / silk wrap
│   └── İç: Foam / confetti / dried flowers
│
├── EKLEMEYE DEĞER:
│   ├── El yazısı not kartı
│   ├── Küçük "teaser" item
│   ├── Kişiye özel şerit/rozet
│   └── Sürpriz element (gizli bölme)
│
├── AÇILIŞ SIRASI:
│   ├── 1. Adım: Dış ambalaj açılışı
│   ├── 2. Adım: İç sürpriz görünür
│   ├── 3. Adım: Ana hediye ortaya çıkar
│   └── 4. Adım: Not/sertifika (varsa)
│
└── FOTOĞRAF MOMENTI:
    ├── Kutlama anı için hazırlık
    ├── İyi ışık + dekorasyon
    └── Hediyeyle birlikte poz
```

## Key Patterns

### Pattern 1: Needs-Based Gifting
- Alıcının gerçekten ihtiyacı olan
- "Wishlist" takibi
- Eksikliği fark etme

### Pattern 2: Experience Over Objects
- Hatıra olarak kalıcı
- Birlikte vakit geçirme
- Yeni keşifler

### Pattern 3: Personalized Touch
- İsme/baş harfe özel
- Fotoğraf kişiselleştirme
- El yazısı not

### Pattern 4: Cultural Sensitivity
- Dini bayramlar
- Kültürel gelenekler
- Yas/geçmiş dönemler

## Anti-Patterns

```
❌ Herkese aynı hediyeyi almak
   // "Bir kalem herkese yeter"
   → Her kişiyi bireysel düşün

❌ Bütçeyi aşmak
   // "Kartım batsın, neemiş"
   → Harcama limiti belirle ve tut

❌ "Hediye kartı verelim" özensizliği
   // "Para en iyisi" (çoğu zaman)
   → Fiziksel > Nakit (genellikle)

❌ Alıcının zevkini bilmeden almak
   // "Bence güzel olur" mantığı
   → Araştır, sor, gözlemle

❌ Ambalajı düşünmemek
   // "Poşet yeter, kimin umurunda"
   → Unboxing deneyimi yarata

✅ Hediye listesini önceden sor
✅ Kilitli kalmış bir ürün düşün
✅ El yapımı dokunuşlar ekle
✅ Saklama kolaylığını düşün
✅ Hediyenin "hikayesini" planla
```

## Quick Reference

| Parametre | Değer | Not |
|---|---|---|
| **Bütçe Kuralı** | Aylık gelirin %1-2 | Özel günler |
| **Kişiselleştirme** | +₺20-50 ek maliyet | Değer katar |
| **Paketleme** | %10-15 bütçe | İlk izlenim önemli |
| **Zamanlama** | 1 hafta önce hazır | Sonra sürpriz kalmaz |
| **Sürpriz Faktörü** | Yüksek beklenti > Sıradan | Beklenti yönetimi |
| **Kargo/Güvenli** | Kayıtlı gönderim | Kırılabilir için |
| **Fiziksel Tercih** | Görünür/sergilenebilir | Nostaljik |
| **Deneyim Tercih** | 25-45 yaş arası | Daha çok tercih |
| **İade Kolaylığı** | Fiş/garanti sakla | Pratiklik |
| **Gizlilik** | Alıcıdan habersiz | Fatura ayrı gönder |

---

*Gift Recommender v1.0 — Düşünceli hediyeler, kalıcı izler!*
