---
name: real-estate-listing-writer
description: Emlak ilanı yazım aracı. Property description, features listing, agent bio ve call to action ile satılık/kiralık gayrimenkul ilanları üretir.
triggers:
  - "emlak ilanı yaz"
  - "gayrimenkul açıklama"
  - "listing yazımı"
  - "property description"
  - "satılık daire ilanı"
  - "kiralık ev açıklaması"
auto_load_when:
  - real_estate
  - property_marketing
  - content_creation
  - sales_copywriting
agent: content-ops
tools:
  - template_generator
  - markdown_writer
  - seo_optimizer
---

# Real Estate Listing Writer — Emlak İlanı Yazıcı

Gayrimenkul satışında ilan metni, kapıyı açan ilk anahtardır. Bu skill; ilgi çekici, SEO dostu ve ikna edici emlak ilanları üretir.

---

## Pattern: Property Description (Mülk Açıklaması)

```
Property Description Structure
├── Headline (Başlık)
│   ├── Location-based hook
│   │   └── "[İlçe / Mahalle] Merkezinde, [Özellik]"
│   ├── Emotional trigger
│   │   └── "Hayalinizdeki ev tam burada"
│   └── Key differentiator
│       └── "Sadece 1 adet — kaçırmayın"
│
├── Opening Hook (Açılış Kancası)
│   ├── Sensory language
│   │   └── "Sabah kahvenizi balkonunuzda yudumlarken..."
│   ├── Lifestyle promise
│   │   └── "Bu evde yaşamak, her gün tatil gibi hissedeceksiniz"
│   └── Problem-to-solution
│       └── "Kalabalık şehirde sakinlik arayanlar için ideal"
│
├── Property Overview (Genel Bakış)
│   ├── Basic specs
│   │   ├── m² (brüt/net ayrımı)
│   │   ├── Oda sayısı (3+1, 2+1 vb.)
│   │   ├── Bina yaşı / yeni bina
│   │   └── Kat / bodrum / çatı
│   │
│   ├── Key features (bullet format)
│   │   ├── ✓ Geniş balkon / teras
│   │   ├── ✓ Deniz manzarası
│   │   ├── ✓ Yenilenmiş mutfak
│   │   └── ✓ Güneşlenme yönü
│   │
│   └── Condition statement
│       └── "Yeni boyalı, hemen oturuma uygun"
│
├── Room-by-Room Description (Oda Bazlı)
│   ├── Living room / Salon
│   │   └── "35 m² açık mutfaklı salon, parkeler"
│   ├── Bedrooms / Yatak odaları
│   │   └── "3 geniş yatak odası, ana yatak odasında ebeveyn banyosu"
│   ├── Kitchen / Mutfak
│   │   └── "L-şeklinde modern mutfak, granit tezgah"
│   ├── Bathrooms / Banyo
│   │   └── "2 banyo + ayrı tuvalet, ebeveyn banyosu jakuzili"
│   └── Outdoor / Dış alan
│       └── "50 m² kapalı balkon, 30 m² açık teras"
│
├── Building & Complex (Bina & Site)
│   ├── Building features
│   │   ├── Bina yaşı / renovation durumu
│   │   ├── Kat sayısı / asansör durumu
│   │   ├── Isınma tipi (doğalgaz, merkezi, klima)
│   │   └── Yönetim / aidat bilgisi
│   │
│   ├── Complex amenities
│   │   ├── Güvenlik (7/24 görevli)
│   │   ├── Otopark (kapalı/açık, kaç araçlık)
│   │   ├── Sosyal alanlar (havuz, spor salonu, çocuk parkı)
│   │   └── Ortak alanlar (bahçe, teras)
│   │
│   └── Monthly costs
│       └── "Aidat: 1.500 TL — Doğalgaz: 800 TL"
│
├── Location Advantages (Konum Avantajları)
│   ├── Transportation
│   │   └── "Metro'ya 3 dk yürüme mesafesinde"
│   ├── Education
│   │   └── "İlkokul ve lise aynı sokakta"
│   ├── Shopping / Daily needs
│   │   └── "Migros, eczane, pazar 5 dakika"
│   └── Recreation
│       └── "Park ve sahil yürüme mesafesinde"
│
├── Why This Property (Fark Yarat)
│   ├── Competitive advantages
│   │   └── "Bölgedeki en uygun fiyatlı 4+1"
│   ├── Investment potential
│   │   └── "Kiracıya verildiğinde aylık X TL getiri"
│   └── Urgency / scarcity
│       └── "Geçen hafta 3 gösterim aldı — ciddi alıcılar bekliyor"
│
└── Call to Action (Harekete Çağırma)
    └── "Hemen arayın / randevu alın / daha fazla foto için mesaj atın"
```

---

## Pattern: Features Listing (Özellik Listesi)

```
Features Listing — Categorized
├── Interior Features (İç Mekan)
│   ├── Rooms
│   │   ├── Oda sayısı
│   │   ├── Salon büyüklüğü
│   │   ├── Tavan yüksekliği
│   │   └── Balkon / teras sayısı
│   │
│   ├── Flooring & Finishing
│   │   ├── Zemin kaplama (parke, mermer, seramik)
│   │   ├── Duvar kaplaması
│   │   ├── Tavan (gizli ışık, spot)
│   │   └── Pencere tipi (PVC, ahşap, çift cam)
│   │
│   ├── Kitchen
│   │   ├── Ankastre ürünler
│   │   ├── Tezgah malzemesi
│   │   ├── Dolap tipi
│   │   └── Beyaz eşya dahil mi?
│   │
│   └── Bathroom
│       ├── Sayı
│       ├── Duşakabin / jakuzi
│       ├── Gömme rezervuar
│       └── Şofben / kombi
│
├── Exterior Features (Dış Mekan)
│   ├── Building
│   │   ├── Kat sayısı
│   │   ├── Asansör
│   │   ├── Bina yaşı
│   │   └── Cephesi (mantolama, boya)
│   │
│   ├── Parking
│   │   ├── Otopark
│   │   ├── Açık / kapalı
│   │   └── Kaç araçlık
│   │
│   └── Outdoor
│       ├── Bahçe
│       ├── Teras / çatı
│       └── Manzara
│
├── Technical Features (Teknik)
│   ├── Heating (Isınma)
│   │   ├── Doğalgaz kombi
│   │   ├── Merkezi sistem
│   │   ├── Klima
│   │   └── Yerden ısıtma
│   │
│   ├── Electrical
│   │   ├── Akıllı ev sistemi
│   │   ├── Güneş paneli
│   │   └── Jeneratör / UPS
│   │
│   └── Security (Güvenlik)
│       ├── 7/24 güvenlik
│       ├── Kamera sistemi
│       ├── Yangın alarmı
│       └── Çelik kapı
│
└── Building Amenities (Site İçi)
    ├── Havuz
    ├── Spor salonu
    ├── Sauna / hamam
    ├── Çocuk oyun alanı
    └── Toplantı salonu
```

---

## Pattern: Agent Bio (Emlak Danışmanı Tanıtımı)

```
Agent Bio Template
├── Professional Identity
│   ├── Name & Title
│   │   └── "[İsim], Senior Emlak Danışmanı"
│   ├── License / Certification
│   │   └── "SPK Lisanslı Gayrimenkul Danışmanı"
│   └── Specialization
│       └── "Levent ve çevresinde uzmanlaşmış"
│
├── Experience & Track Record
│   ├── Years in business
│   │   └── "12 yıllık sektör deneyimi"
│   ├── Transaction volume
│   │   └── "250+ başarılı satış"
│   └── Market share
│       └── "Levent bölgesinde en çok işlem yapan ilk 5 danışman"
│
├── Approach / Philosophy
│   ├── Client-first philosophy
│   │   └── "Müşteri memnuniyeti her şeyin önünde"
│   ├── Process explanation
│   │   └── "Size özel strateji ile en doğru fiyatı buluyorum"
│   └── Communication style
│       └── "7/24 ulaşılabilir, şeffaf iletişim"
│
├── Personal Touch
│   ├── Why real estate
│   │   └── "Gayrimenkulü sadece satmıyorum, geleceğinizi şekillendiriyorum"
│   ├── Hobbies / interests (optional)
│   │   └── "Boş zamanlarımda mimari blog okumayı seviyorum"
│   └── Language skills
│       └── "Türkçe, İngilizce — expatriates welcome"
│
└── Contact Information
    ├── Phone / WhatsApp
    ├── Email
    ├── Instagram / LinkedIn
    └── Office address
```

---

## Key Patterns

| İlan Türü | Odak | Başlık Örneği |
|---|---|---|
| **Satılık Daire** | Yaşam tarzı + lokasyon | "Levent'in kalbinde, deniz manzaralı 3+1" |
| **Satılık Villa** | Lüks + özellik | "Özel havuzlu, 500 m² bahçeli yalı" |
| **Kiralık Daire** | Değer + lokasyon | "Metroya 2 dk, klimalı, eşyalı" |
| **Arsa** | Potansiyel + konum | "İmarlı, yola cepheli, 1.200 m²" |
| **Ticari** | Getiri + potansiyel | "Kiracılyken satılık, yıllık %8 getiri" |
| **Yeni Proje** | Gelecek + güven | "2026'da teslim, denize sıfır rezidans" |

---

## Anti-Patterns

```
❌ "Güzel, bakımlı, dikkat çekici" — boş sıfatlar
   → Somut özellik ver: "40 m² güney cepheli balkon"

❌ Boyutları karıştırma — brüt/net
   → Her zaman brüt ve net'i ayrı belirt

❌ Gerçek olmayan iddialar — "deniz manzarası" (yoksa)
   → Sadece doğru olanı yaz, abartma

❌ Kötü haberleri gizleme — "biraz trafik sesi olabilir"
   → Kötü özellikleri yumuşak ama dürüst ifade et

❌ Çok uzun açıklama — 500 kelime üstü
   → İdeal: 150–250 kelime arası

❌ Sadece fiyat odaklı başlık — "Satılık daire 5 milyon TL"
   → Fark yaratan özelliği öne çıkar

✅ "Hayatınızın evi", "Fırsat", "Sadece bir kez" — duygusal dil
✅ İlk 3 satır en güçlü bilgiyi içersin
✅ Fotoğraf kalitesi = ilan kalitesi algısı
✅ Lokasyon detayı (metro, okul, hastane) mutlaka olsun
✅ Fiyat + emlak vergisi + aidat = toplam maliyeti ver
✅ "Hemen arayın" + WhatsApp + randevu linki
```

---

## Quick Reference

| Element | Kural | Örnek |
|---|---|---|
| **Başlık** | Max 60 karakter, lokasyon + özellik | "Beşiktaş'ta deniz manzaralı 3+1" |
| **İlk cümle** | Duygusal veya spesifik | "Sabah kahvenizde İstanbul'u izleyin" |
| **m²** | Net kullanın, brüt'ü ayrı belirtin | "145 m² net, 175 m² brüt" |
| **Fiyat** | Net fiyat, site içi görünür yerde | "15.000.000 TL (KDV dahil)" |
| **Oda/ salon** | Türkçe format, 3+1, 2+1 | "4+1, 2 salon, 3 banyo" |
| **Konum** | Cadde + mahalle + ilçe | "Çengelköy, Kalamış Caddesi üzeri" |
| **Ulaşım** | Yürüme dakikası ver | "Kadıköy Metro'ya 4 dk yürüme" |
| **Yapı yaşı** | Bina + renovation durumu | "2020 yapımı, yenilenmiş" |
| **Isınma** | Tipi + maliyet tahmini | "Doğalgaz kombi, aylık ~1.200 TL" |
| **CTA** | İletişim + aciliyet | "Randevu için hemen arayın: 0532..." |
