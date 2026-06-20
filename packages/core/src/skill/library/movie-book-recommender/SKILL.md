---
name: movie-book-recommender
description: Film ve kitap önerileri sunma, tür analizi yapma, benzerlik algoritması kullanma ve kişiselleştirilmiş öneriler geliştirme becerisi.
triggers:
  - "Film öner"
  - "Kitap tavsiyesi"
  - "Benzer filmler"
  - "En iyi ... filmleri"
  - "Okumalısın dediğim kitaplar"
auto_load_when:
  - Film, dizi, sinema, Netflix, vizyon
  - Kitap, roman, okuma, yazar
  - Öneri, tavsiye, beğeni, beğenmediğim
agent: docs-agent
tools:
  - imdb-search
  - goodreads-lookup
  - streaming-checker
---

# Movie & Book Recommender — Medya Öneri Uzmanı

Medya öneri skill'i, kullanıcıların zevklerine ve ruh hallerine göre film/kitap önerir. Tür analizi, benzerlik eşleştirme ve kişisel tercih korelasyonu kullanır.

## Temel Pattern: Öneri Motoru

### 1. Kullanıcı Tercih Matrisi

```
TERCİH ANALİZİ
├── Tür Tercihleri (权重):
│   ├── 🎬 Film: Drama / Komedi / Sci-Fi / Korku / Romantik...
│   ├── 📚 Kitap: Klasik / Fantastik / Gerilim / Tarih...
│   └── Derece: 1-10 (ne kadar sevdi)
│
├── Mekan Tercihleri:
│   ├── Film: Sinema / Ev / Işıklandırma
│   ├── Kitap: Fiziksel / E-kitap / Sesli
│   └── Zaman: Gündüz / Gece / Yolda
│
├── İçerik Hassasiyetleri:
│   ├── Şiddet toleransı (düşük/orta/yüksek)
│   ├── Romantik içerik (gizli/açık/yok)
│   ├── Dil/ küfür (offensive mi?)
│   └── Klişe toleransı
│
├── Bağlamsal Faktörler:
│   ├── Mevcut ruh hali (neşeli/melit/gerilim)
│   ├── Aranan: Eğitim / Kaçış / Duygusal
│   └── Zaman: Kısa/uzun süreli içerik
│
└── Geçmiş Beğeniler:
    ├── Favori 3 film/kitap
    ├── Beğenmediği türler
    └── Tekrar izleme/okuma isteği
```

### 2. Benzerlik Algoritması

```
ÖNERİ EŞLEŞTİRME
├── KRİTER AĞIRLIKLARI:
│   ├── Yönetmen/Yazar (25%) — Aynı stil
│   ├── Aktör/Karakter (20%) — Favori oyuncular
│   ├── Tür (20%) — Kategori eşleşmesi
│   ├── Tema/Motif (15%) — Duygusal içerik
│   ├── Dönem/Periyot (10%) — Zaman kodu
│   └── Değerlendirme (10%) — Puan korelasyonu
│
├── ALGORİTMA AKIŞI:
│   ├── 1. Kullanıcı profiline göre seed belirle
│   ├── 2. Seed içeriğin metadata'sını çıkar
│   ├── 3. Metadata'yı ağırlıklarla puanla
│   ├── 4. En yüksek skorlu önerileri filtrele
│   └── 5. Çeşitlilik sağla (farklı türler)
│
└───┬── ÖRNEK:
    │   Beğendi: The Shawshank Redemption
    ├── + Yönetmen: Frank Darabont → öner: The Green Mile
    ├── + Tür: Drama → öner: The Pursuit of Happyness
    ├── + Aktör: Tim Robbins → öner: Mystic River
    └── + Tema: Umudun zaferi → öner: The Green Mile
```

### 3. Tür Bazlı Derinlemesine Analiz

```
TÜR MATRİSİ (Örnek: Gerilim)
├── KLASİK GERİLİM:
│   ├── Psycho (1960)
│   ├── Rear Window (1954)
│   ├── Vertigo (1958)
│   └── 12 Angry Men (1957)
│
├── PSİKOLOJİK GERİLİM:
│   ├── Se7en (1995)
│   ├── Shutter Island (2010)
│   ├── Gone Girl (2014)
│   └── Black Swan (2010)
│
├── SÜRÜCÜ GERİLİM:
│   ├── 127 Hours (2010)
│   ├── Buried (2010)
│   ├── Phone Booth (2002)
│   └── Misery (1990)
│
└── DÖKÜMANTAR GERİLİM:
    ├── Making a Murderer (2015)
    ├── The Jinx (2015)
    └── Wild Wild Country (2018)
```

### 4. Kişiselleştirilmiş Liste Türleri

```
ÖZEL LİSTELER
├── RUHSAL DURUMA GÖRE:
│   ├── Kendimi iyi hissediyorum → Comfy favorites
│   ├── Meliğim → Feel-good movies / comfort reads
│   ├── Enerjik hissediyorum → Action/Adventure
│   └── Düşünceliyim → Philosophical/Deep
│
├── ZAMANA GÖRE:
│   ├── 1 saat var → Kısa filmler / novella
│   ├── 2-3 saat var → Uzun filmler / roman
│   ├── Haftalık series → Binge-worthy diziler
│   └── Günlük okuma → Kısa öykü derlemeleri
│
├── SOSYAL DURUMA GÖRE:
│   ├── Yalnız izleyeceğim → Derin/düşündürücü
│   ├── Arkadaşlarla → Komedi/action/grup uygun
│   ├── Aileyle → Her yaşa uygun
│   └── İlk buluşma → Romantik/komedi
│
└── ÖĞRENME HEDEFİNE GÖRE:
    ├── Yabancı dil → Altyazılı/Original dil
    ├── Tarih → Biyografi/tarihi kurgu
    ├── Bilim → Popüler bilim belgeleri
    └── İş/kişisel gelişim → Business books
```

## Key Patterns

### Pattern 1: "If You Liked X, Try Y"
- Seed-based recommendation
- Progressive similarity
- Quality decay avoidance

### Pattern 2: Mood-Based Curation
- İnsan gibi düşün
- "Bunu sana önermemin nedeni..."
- Açıklayıcı ol

### Pattern 3: Hidden Gems Discovery
- Altın değerinde ama az bilinen
- Yeni yönetmen/yazarlar
- Bağımsız prodüksiyonlar

### Pattern 4: Anti-Rcommendation
- "Bu senden hoşlanmaz" dediklerini da ver
- Negatif filtreleme
- Neden beğenmeyebilir açıkla

## Anti-Patterns

```
❌ Sadece popüler olanları önermek
   // "En yüksek puanlı herkes izlemiş"
   → Hidden gems de ekle

❌ Neden önERDIĞINI açıklamamak
   // "Bu güzel, izle" (Neden?)
   → Açıklama her zaman ekle

❌ Beğenileri tek boyutlu görmek
   // "Korku filmi sevdi, hepsi aynı"
   → Alt türleri ayır

❌ Spoiler vermek
   // "Sonunda şöyle oluyor..."
   → Twist koruma

❌ Çok uzun liste vermek
   // "İşte 50 film önerim"
   → 5-7 arası tut, detaylandır

✅ Her önerinin nedenini açıkla
✅ İzleme/okuma sırası öner (seri ise)
✅ Benzer + farklı alternatifi ver
✅ Platform/bulunabilirlik belirt
✅ Tür içi "en iyiler" listesi yap
```

## Quick Reference

| Parametre | Değer | Not |
|---|---|---|
| **Liste Uzunluğu** | 5-7 öneri | Kalite > Miktar |
| **Detay Seviyesi** | Başlık + yönetmen/yazar + yıl | Minimum |
| **Spoiler Koruması** | Maksimum | Twist açıklanmaz |
| **Benzer Sayısı** | Film başı 3-5 benzer | Çeşitlilik |
| **Platform Bilgisi** | Netflix/Prime/ theatres | Güncel tut |
| **Puan Eşiği** | 7.0+ (IMDb) / 4.0+ (Goodreads) | Kalite garantisi |
| **Tür Dengesi** | Minimum 2 farklı tür | Alternatif sun |
| **Yeni İçerik** | Son 1-2 yıl + klasik | Denge |
| **Türkçe Seçenek** | Mevcutsa belirt | Erişilebilirlik |
| **Okuma Süresi** | Kitap için tahmini süre | Zaman planı |

---

*Movie & Book Recommender v1.0 — Doğru hikaye, doğru an!*
