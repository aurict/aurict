---
name: social-media-manager
description: "Twitter flood ve LinkedIn post üretme. Thread oluşturma. Hashtag stratejileri. Engagement artırma. Posting schedule. Platform algoritması."
triggers:
  keywords: ["sosyal medya", "tweet", "linkedin", "thread", "hashtag", "instagram", "twitter", "post", "içerik üretimi"]
  extensions: [".md", ".txt"]
auto_load_when: "Sosyal medya içeriği, post, tweet, thread veya içerik takvimi talep edildiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch"]
---

# Social Media Manager — SOSYAL MEDYA İÇERİK STRATEJİSİ

**Odağ:** Twitter/X, LinkedIn, Instagram için etkili içerik üretimi ve engagement stratejileri.

---

## 1. Twitter/X Flood Formatı

```
Flood = Tek konuda ardışık tweet zinciri (5-20 tweet)

Yapı:
├── Tweet 1 (Hook):
│   ├── Soru veya iddia ile aç
│   ├── "X hakkında bilmeniz gereken [sayı] şey"
│   └── Takipçiyi "hemen" tıklatacak merak
│
├── Tweet 2-[N-1] (Ana İçerik):
│   ├── Her tweet: 1 ana fikir
│   ├── 200-280 karakter sınırı
│   ├── Emoji kullanımı (3-5 adet, aşırı değil)
│   └── Sıralı numara: "2/" "3/" gibi
│
├── Tweet N-1 (Engagement Sorusu):
│   └── "Siz hangisini deneyeceksiniz? Yorumda belirtin."
│
└── Tweet N (CTA + Thread Linki):
    ├── "Bu floodu kaydet →"
    └── Thread'e link
```

---

## 2. LinkedIn Post Yapısı

```
LinkedIn Post Bileşenleri:
├── Satır 1 (Hook - en kritik):
│   ├── İlk 150 karakter görünür
│   ├── Soru, iddia veya şok edici bir gerçek
│   └── "Yapmazsanız..." veya "X yaparken gördüm ki..."
│
├── Giriş (2-4 satır):
│   ├── Kısa hikaye veya bağlam
│   └── Neden yazdığını açıkla
│
├── Ana Gövde:
│   ├── Her paragraf 2-3 cümle
│   ├── Madde işaretleri kullan (kısa tut)
│   ├── Her madde tek fikir
│   └── Numaralı liste > bullet points
│
├── Kapanış:
│   ├── Soru sor (yorumu artırır)
│   ├── "Siz ne düşünüyorsunuz?" vb.
│   └── Takip et çağrısı
│
└── Hashtag'ler (en alta):
    └── Maks 3-5 hashtag
```

---

## 3. Thread Oluşturma Stratejisi

```
Thread Türleri:
├── BİLGİ THREAD:
│   ├── 5-15 tweet
│   ├── "X hakkında bilmeniz gereken her şey"
│   └── Kaynakça ile bitir
│
├── HİKAYE THREAD:
│   ├── 3-8 tweet
│   ├── "Size X'i nasıl başardığımı anlatayım"
│   └── Duygusal hook ile aç, sonuçla bitir
│
└── EĞİTİM THREAD:
    ├── 8-20 tweet
    ├── Adım adım rehber
    └── "Takip et" ile bitir

Thread Açılış Formatı:
├── Thread başlığı parantez içinde
├── İlk tweet'te kaç tweet olacağını belirt
├── "🧵 [Konu] — [Sayı] tweetlik thread"
└── Kısa özet: "Bugün X konuşacağız:"
```

---

## 4. Hashtag Stratejileri

```
Hashtag Hiyerarşisi:
├── Marka Hashtag'leri (sabit, az):
│   ├── #ŞirketAdı
│   ├── #MarkaSloganı
│   └── Maks 2 adet
│
├── Sektör Hashtag'leri (dinamik, 3-5):
│   ├── #Marketing
│   ├── #DigitalMarketing
│   └── Trend hashtag (güncel olaylar)
│
└── Mikro Hashtag'ler (niş, 2-3):
    ├── #B2BMarketing
    └── #SaaSMarketing

Platform Bazlı Hashtag Sayısı:
├── Twitter/X: 1-3 hashtag (fazlası spam gibi)
├── LinkedIn: 3-5 hashtag
├── Instagram: 8-15 hashtag
└── TikTok: 3-5 hashtag (ana konu etiketleri)
```

---

## 5. Engagement Artırma Teknikleri

```
Sosyal Etkileşim Stratejileri:
├── SORU SOR:
│   ├── Kapalı soru: "Beğendiniz mi?" (cevap: evet/hayır)
│   ├── Açık soru: "Siz nasıl yapıyorsunuz?"
│   └── Anket: "Hangi seçenek sizce doğru?"
│
├── POLLING:
│   ├── X'te anket aç (24 saat)
│   └── "Bugün X mi yoksa Y mi?" formatı
│
├── GÖRÜŞ BEYANI:
│   ├── Kontroverse yaklaşım (aşırıya kaçmadan)
│   ├── "Bu konuda farklı düşünüyorum" açılımı
│   └── "Siz ne diyorsunuz?" kapanışı
│
├── MEDYA EKLE:
│   ├── Her postta görsel (engagement +40%)
│   ├── Video > Carousel > Görsel > Sadece text
│   └── Infografik paylaşımı
│
└── ZAMANLAMA:
    ├── LinkedIn: Hafta içi 08:00-10:00 veya 17:00-19:00
    ├── Twitter: Hafta içi 12:00-14:00
    └── Instagram: Hafta içi 11:00-13:00
```

---

## 6. Posting Schedule (İçerik Takvimi)

```
İçerik Dağılımı (haftalık):
├── LinkedIn: 3-5 post/hafta
├── Twitter/X: Günde 3-10 tweet
├── Instagram: 3-7 post/hafta
└── TikTok: Günde 1-3 video

İçerik Kategorileri (10X10 kuralı):
├── %40 Eğitim: Thread, infografik, rehber
├── %30 İlham: Başarı hikayesi, motivasyon
├── %20 Etkileşim: Soru, anket, tartışma
└── %10 Tanıtım: Ürün/hizmet tanıtımı

Haftalık Takvim Örneği:
├── Pazartesi: Motivasyon/hikaye
├── Salı: Eğitim içeriği (thread)
├── Çarşamba: İstatistik/veri paylaşımı
├── Perşembe: Rakip/sektör gündemi
├── Cuma: Eğlenceli içerik/behind the scenes
└── Hafta sonu: Düşük yoğunluk (minimal posting)
```

---

## 7. Platform Algoritması Bilgisi

```
X/Twitter Algoritması:
├── Etkileşim hızı ilk 30 dakikada kritik
├── Takipçi etkileşimi >random etkileşim
├── Video içerik öncelikli
├── Thread'ler tek tek gösterilir
└── "Daha fazla göster" tıklanan içerik öne çıkar

LinkedIn Algoritması:
├── Profesyonel konuşma tonu
├── İlk saat engagement kritik
├── Yorum = beğeni >save >paylaşım
├── Uzun form içerik (1000+ kelime) ödüllendiriliyor
└── Erkenden yorum yapmak engagement artırır

Instagram Algoritması:
├── Saves ve Shares en değerli
├── Follows en yüksek ağırlık
├── Dwell time (bakış süresi) önemli
├── Reels = discovery'de öne çıkar
└── Comment engagement kritik
```

---

## 8. Platform Karşılaştırması

```
Twitter vs LinkedIn:
├── Twitter: Hızlı bilgi, gündem, haber
├── LinkedIn: Profesyonel derinlik, networking
└── Cross-posting: Aynı içeriği farklı tonla paylaş

İçerik Uyarlama Kuralları:
├── LinkedIn'e uzun thread → Twitter'da kısa flood
├── LinkedIn'e detaylı post → Twitter'da tek tweet + link
├── Instagram'a görsel → Twitter'a GIF veya statik görsel
└── TikTok videosu → YouTube Shorts + LinkedIn'e özet
```

---

## Key Patterns

1. **Hook ilk satırda olmalı** — İlk 150 karakter tüm farkı yaratır.
2. **Tek fikir kuralı** — Her tweet/post bir ana fikir.
3. **Soru engagement'ın anahtarı** — Yorumu 3 kat artırır.
4. **Görsel zorunlu** — Görsüz post %70 daha az görünür.
5. **Hashtag stratejisi** — Platform başına optimize edilmiş sayı.

---

## Anti-Patterns

```
❌ Her platforma aynı içeriği kopyalamak
✅ Her platformun tonuna ve formatına uyarla

❌ Aşırı hashtag (#15+ Twitter'da)
✅ Twitter: 1-3 | LinkedIn: 3-5 | Instagram: 8-15

❌ Sadece tanıtım postları
✅ 80% değer, 20% tanıtım kuralı

❌ Her gün aynı saatte postlamak
✅ Algoritma çeşitliliği sever; varyasyonlu zamanlama

❌ Thread'leri sık aralıklarla kesintiye uğratmak
✅ Thread'i tek seferde tamamla; kesinti = düşük engagement
```

---

## Quick Reference

| Platform | İçerik Tonu | Uzunluk | Görsel | Optimal Posting |
|---|---|---|---|---|
| Twitter/X | Hızlı, gündem, bilgi | 1-280 karakter | GIF, görsel | Hafta içi 12:00-14:00 |
| LinkedIn | Profesyonel, derin, analitik | 1300+ kelime | Infografik, video | Hafta içi 08:00-10:00 |
| Instagram | Görsel odaklı, estetik | Kısa + uzun caption | Yüksek kalite görsel | Hafta içi 11:00-13:00 |
| TikTok | Eğlendirici, samimi, hızlı | 15-60 saniye video | Video şart | Akşam 18:00-21:00 |

| Thread Türü | Kullanım | Uzunluk |
|---|---|---|
| Bilgi Thread | Eğitim, rehber | 5-15 tweet |
| Hikaye Thread | Kişisel deneyim | 3-8 tweet |
| Eğitim Thread | Adım adım öğretim | 8-20 tweet |

| Engagement Stratejisi | Etki | Platform |
|---|---|---|
| Soru sormak | +300% yorum | Tüm platformlar |
| Anket açmak | +200% etkileşim | Twitter/X |
| Görsel eklemek | +40% engagement | LinkedIn, IG |
| İlk yorumu kendin yap | +50% görünürlük | LinkedIn |
| Story'ye mention | +20% reach | Instagram |
