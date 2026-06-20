---
name: language-translator
description: Çeviri yapma, idiom karşılıkları bulma, bağlamsal çeviri uygulama ve kültürel adaptasyon sağlama becerisi.
triggers:
  - "Çeviri yap"
  - "Türkçeye çevir"
  - "Idiom ne demek"
  - "Bu cümleyi ... diline çevir"
  - "Bağlamsal çeviri"
auto_load_when:
  - Çeviri, tercüme, translate
  - Dil, anlam, kelime, ifade
  - İdiom, deyim, atasözü
agent: docs-agent
tools:
  - dictionary-api
  - idiom-finder
  - cultural-adapter
---

# Language Translator — Çeviri ve Kültürel Adaptasyon Uzmanı

Çeviri skill'i, sadece kelime çevirisi değil, kültürel bağlamı da göz önünde bulunduran doğal ve akıcı çeviriler üretir. İdiom, deyim ve kültürel nüansları yönetir.

## Temel Pattern: Çeviri Süreci

### 1. Metin Analiz Katmanları

```
ÇEVIRI ANALİZİ
├── DİL KATMANI:
│   ├── Kaynak dil tespiti
│   ├── Hedef dil seçimi
│   └── Dil ailesi/alfabe uyumu
│
├── BAĞLAM KATMANI:
│   ├── Resmi/Gayri resmi ton
│   ├── Hedef kitle (teknik/genel/çocuk)
│   ├── Platform (web/sosyal medya/resmi)
│   └── Amaç (bilgilendirme/ikna/eğlendirme)
│
├── KÜLTÜREL KATMAN:
│   ├── İdiom/dedikotu var mı?
│   ├── Kültürel referanslar
│   ├── Mizah unsurları
│   └── Yasaklı/hassas içerik
│
└───┬── TEKNİK KATMAN:
    │   ├── Terminoloji tutarlılığı
    │   ├── Kısaltmalar
    │   └── Format korunması gerekenler
    └── HATA POTANSİYELİ:
        ├── Kelime oyunu içeren
        ├── Çok anlamlı terimler
        └── Kısaltma/numara içeren
```

### 2. Çeviri Stratejileri

```
ÇEVIRI YAKLAŞIMLARI
├── DIREKT ÇEVIRI (Word-for-word)
│   ├── Kullanım: Teknik metinler, talimatlar
│   ├── Örnek: "Click the button" → "Butona tıklayın"
│   └── Dikkat: Bağlam kaybı riski
│
├── ANLAMSAL ÇEVIRI (Sense-for-sense)
│   ├── Kullanım: Edebiyat, pazarlama
│   ├── Örnek: "It's raining cats and dogs"
│   │   → "Sapıtınca yağıyor" ( değil! )
│   │   → " Bardaktan boşanırcasına yağıyor" ✓
│   └── Dikkat: Yazarın tonunu koru
│
├── YERELLEŞTİRME (Localization)
│   ├── Kullanım: Web, uygulama, reklam
│   ├── Örnek: "Black Friday" → "İndirim günleri"
│   │   (Kara Cuma yerine yerel karşılık)
│   └── Dikkat: Kültürel adaptasyon gerekli
│
├── TRANSKREASYON:
│   ├── Kullanım: Özel isimler, markalar
│   ├── Örnek: "McDonald's" → "McDonald's" (korunur)
│   └── Dikkat: Telaffuz bazlı yerelleştirme
│
└── İDİOMATİK ÇEVIRI:
    ├── Kullanım: Günlük dil, konuşma
    ├── Örnek: "Break a leg" → "Kolay gelsin"
    └── Dikkat: Doğrudan çeviri yanıltıcı olabilir
```

### 3. İdiom Karşılıkları Veritabanı Formatı

```
İDİOM EŞLEŞTİRME
├── İNGİLİZCE → TÜRKÇE:
│   │
│   ├── "Piece of cake" → "Çocuk oyuncağı"
│   ├── "Break a leg" → "Kolay gelsin"
│   ├── "It's not my cup of tea" → "Benim tarzım değil"
│   ├── "Bite the bullet" → "Cesaretini toplamak"
│   ├── "Spill the beans" → "Sırrı ağzından kaçırmak"
│   ├── "Kill two birds with one stone" → "Bir taşla iki kuş vurmak"
│   ├── "The ball is in your court" → "Top sende"
│   ├── "Hit the nail on the head" → "Hedefi on iki vurmak"
│   ├── "Beat around the bush" → "Dolaylı konuşmak"
│   └── "A penny for your thoughts" → "Ne düşünüyorsun?"
│
├── TERS ÇEVİRİ (Türkçe → İngilizce):
│   │
│   ├── "Bir taşla iki kuş vurmak" → "Kill two birds with one stone"
│   ├── "Karaçalı dibine dikmek" → "To put someone in a tight spot"
│   ├── "Köprüyü geçene kadar ayıya benzemez" → "Don't count your chickens..."
│   └── "Taşı bin kişi gitsin, kuruşu bin kişi gelsin" → [Bağlama bağlı]
│
└── NOT:
    ├── Her idyomun tam karşılığı olmayabilir
    ├── Yakın eşleşme + açıklama ver
    └── Bağlamsal uygunluğu kontrol et
```

### 4. Kültürel Adaptasyon Katmanları

```
KÜLTÜREL ADAPTASYON MATRİSİ
├── DOĞUM/GELİŞİM:
│   ├── Yaş ifade biçimleri
│   │   ├── Türkiye: "Otuzuna yeni girdi"
│   │   └── Batı: "Turning 30"
│   ├── Tarih formatları
│   │   ├── Türkiye: 08.05.2026
│   │   └── ABD: 05/08/2026
│   └── Sayı formatları
│       ├── Türkiye: 1.234,56
│       └── ABD: 1,234.56
│
├── MUTFAK KÜLTÜRÜ:
│   ├── Ölçü birimleri (cup → bardak, gram)
│   ├── Yemek isimleri yerelleştirme
│   └── Diyet/gıda referansları
│
├── SOSYAL NORMİLER:
│   ├── Hitap biçimleri (sen/siz, formal/informal)
│   ├── Jestler ve beden dili
│   └── İletişim doğrudanlığı
│
├── DEĞERLER/DUYARLILIKLAR:
│   ├── Din referansları
│   ├── Siyasi ifadeler
│   ├── Cinsiyet rolleri
│   └── Tabu konular
│
└── PAZARLAMA/YAZIM:
    ├── Renklerin anlamları
    ├── Sayıların uğuru (4 = kötü, 8 = iyi)
    └── Marka/mekân isimleri
```

## Key Patterns

### Pattern 1: Dual-Format Output
- Hem orijinal hem hedef dil
- Alternatif çeviri seçenekleri
- Açıklayıcı notlar

### Pattern 2: Tone Preservation
- Resmi ton → Resmi çeviri
- Samimi ton → Samimi çeviri
- Teknik ton → Terminoloji koruma

### Pattern 3: Cultural Annotation
- Doğrudan çevrilemeyenler için dipnot
- Kültürel açıklama
- "Burada şaka var" uyarısı

### Pattern 4: Review Pipeline
- Çeviri → Geri çeviri kontrolü
- Native speaker review (mümkünse)
- Bağlam doğrulaması

## Anti-Patterns

```
❌ Kelime kelime çeviri
   // "I am very interesting" → "Ben çok ilginçim"
   → Anlamsal çeviri yap

❌ İdiomları literal çevirmek
   // "It's raining cats and dogs" → "Köpek ve kedi yağıyor"
   → Türkçe karşılığını bul

❌ Kültürel bağlamı görmezden gelmek
   // İngilizce bir şakanın Türkçesi komik olmayabilir
   → Adaptasyon yap

❌ Tek çeviri sunmak
   // "Sadece bu doğru" yaklaşımı
   → Alternatif seçenekler ver

❌ Otomatik çeviri kalitesini abartmak
   // "Google Translate yeter"
   → Bağlamsal inceleme gerekli

✅ Çeviri nedenini açıkla
✅ Hedef kitleye uygun ton seç
✅ Kısaltmaları açıkla (ilk geçişte)
✅ Özel isimleri koru veya transcribe et
✅ Rakam/tarih formatını hedef dile uyarla
```

## Quick Reference

| Parametre | Değer | Not |
|---|---|---|
| **Ton Seçimi** | Resmi/Samimi/Teorik | Bağlama göre |
| **İdiom Çevirisi** | Mevcutsa Türkçe karşılık | Yoksa açıkla |
| **Kişi zamiri** | Türkçe "sen/siz" uyumu | Resmiyet derecesine göre |
| **Cinsiyet** | Türkçe'de gender-neutral | Yeni dilde mümkünse |
| **Çoğul** | Türkçe çoğul -ler/-lar | Korunmalı |
| **Zaman** | Şimdiki/geçmiş/gelecek | Çekim korunmalı |
| **Kısaltmalar** | İlk geçişte açıkla | Sonra kısalt |
| **Özel İsimler** | Transliteration | Kaynak dile göre |
| **Ters Çeviri** | Kontrol için | Her 10 cümlede 1 |
| **Kalite** | Native düzeyinde akıcılık | Hedef |

---

*Language Translator v1.0 — Sözlerin sınır tanımasın!*
