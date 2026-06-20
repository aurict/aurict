---
name: story-plot-generator
description: Hikaye iskeleti oluşturma aracı. Plot arc, character arc, conflict resolution ve scene sequencing ile profesyonel hikaye yapıları tasarlar.
triggers:
  - "hikaye yazmak istiyorum"
  - "plot oluştur"
  - "karakter gelişimi planla"
  - "scene sıralaması yap"
  - "story structure"
auto_load_when:
  - creative_writing
  - script_writing
  - novel_planning
  - game_narrative
agent: content-ops
tools:
  - markdown_writer
  - template_generator
---

# Story Plot Generator — Hikaye İskeleti Üretici

Hikaye yazımının temel taşı iskelet yapıdır. Bu skill, her türlü anlatı için tutarlı, dinamik ve duygusal olarak tatmin edici yapılar oluşturur.

---

## Pattern: Plot Arc Oluşturma (Yapısal)

Bir hikayenin omurgası plot arc'tır. Aşağıdaki ağaç yapısı, klasiik 5 perde yapısını ve varyasyonlarını kapsar:

```
Plot Arc
├── Act 1 — Setup (Karakter Tanıtımı)
│   ├── Ordinary World (Gündelik Dünya)
│   │   └── Karakterin mevcut durumu, kusuru, hedefi
│   ├── Call to Adventure (Macera Çağrısı)
│   │   └── Tetikleyici olay / sorun sunumu
│   └── Refusal of the Call (Davet Reddi)
│       └── Karakterin tereddütü, motivasyon eksikliği
│
├── Act 2 — Confrontation (Karşılaşma)
│   ├── Meeting the Mentor (Mentor ile Buluşma)
│   │   └── Rehber, bilgi, araç kazanımı
│   ├── Tests, Allies, Enemies (Denemeler)
│   │   ├── Düşmanlarla ilk karşılaşma
│   │   ├── Yeni müttefikler kazanma
│   │   └── İç çatışma başlangıcı
│   └── Approach to Inmost Cave (İç Mağaraya Yaklaşım)
│       └── Büyük karar öncesi hazırlık
│
├── Act 3 — Midpoint (Orta Nokta)
│   ├── Subplot Climax (Alt hikaye doruk noktası)
│   └── False Victory / False Defeat
│       └── Yanlış zafer veya yanlış yenilgi algısı
│
├── Act 4 — Crisis (Kriz)
│   ├── All Is Lost (Her Şey Kaybolur)
│   │   └── mentor ölümü, büyük yenilgi, ihanet
│   └── Swallow the Killer (Katili Yutma)
│       └── Karakterin karanlık anı, kalıcı değişim
│
└── Act 5 — Resolution (Çözüm)
    ├── Final Battle / Climax
    │   └── Düşmanla yüzleşme, ana çatışma çözümü
    ├── Reward (Ödül)
    │   └── Kazanılan şey, değişim, zafer
    └── Return with Elixir (Şifa ile Dönüş)
        └── Hikaye sonu, ders, yeni denge
```

---

## Pattern: Character Arc (Karakter Gelişim Yayı)

Karakter arc'ı protagonistin içsel dönüşümünü izler. Üç temel yay türü:

```
Character Arc
├── Positive Arc (İyileşme Yayı)
│   ├── Flaw (Kusur)
│   │   └── Karakterin kötü alışkanlığı / hatası
│   ├── Lie (Yalan / Yanlış İnanç)
│   │   └── Karakterin kendine/çevreye söylediği yalan
│   ├── Crisis (Kriz)
│   │   └── Yalanın çöküşü
│   └── Truth (Gerçek)
│       └── Yeni anlayış, kalıcı değişim
│
├── Negative Arc (Çöküş Yayı)
│   ├── Desire (Arzu)
│   │   └── Karakterin ulaşmak istediği hedef
│   ├── Corruption (Yozlaşma)
│   │   └── Güç uğruna değerlerden vazgeçme
│   ├── Descent (Düşüş)
│   │   └── Manipülasyon, ihanet, kayıp
│   └── Fall (Çöküş)
│       └── Trajik son, hedefe ulaşamama
│
└── Flat Arc (Düz Yayı)
    ├── Belief (İnanç)
    │   └── Karakterin savunduğu değer
    ├── Test (Sınama)
    │   └── İnancın sorgulanması
    └── Confirmation (Doğrulama)
        └── İnancın pekiştirilmesi, kanıtlanması
```

---

## Pattern: Conflict Resolution (Çatışma Çözümü)

```
Conflict Resolution
├── External Conflict (Dış Çatışma)
│   ├── Protagonist vs Antagonist
│   │   ├── Physical confrontation
│   │   ├── Ideological clash
│   │   └── Emotional showdown
│   └── Protagonist vs Environment
│       ├── Nature survival
│       └── Society / System
│
├── Internal Conflict (İç Çatışma)
│   ├── Duty vs Desire
│   │   └── Yapması gereken vs istediği
│   ├── Past vs Present
│   │   └── Geçmiş travma vs şimdiki hedef
│   └── Self-Doubt vs Self-Belief
│       └── İç eleştirmen vs potansiyel
│
└── Thematic Conflict (Tema Çatışması)
    └── Central thematic question
        └── "Özgürlük mü güvenlik mi?"
```

---

## Pattern: Scene Sequencing (Sahne Dizimi)

```
Scene Sequencing
├── Opening Hook (İlgi Açıcı)
│   └── İlk cümle / sahne: okuyucuyu yakala
│
├── Tension Escalation (Gerilim Yükselişi)
│   ├── Scene 1 → Minor conflict
│   ├── Scene 2 → Raised stakes
│   ├── Scene 3 → Personal cost
│   └── Scene N → Maximum tension
│
├── Pivot Point (Dönüm Noktası)
│   └── Ana karakterin perspektif değişikliği
│
├── Climax Sequence (Doruk Dizisi)
│   ├── Final confrontation setup
│   ├── Physical / emotional peak
│   └── Consequence revelation
│
└── Denouement (Çözüm)
    └── Loose ends + emotional resolution
```

---

## Key Patterns

| Pattern | Kullanım |
|---|---|
| **Three-Act Structure** | Kısa öyküler, film senaryoları, 30 dk'lık bölümler |
| **Hero's Journey** | Epik, macera, fantastik hikayeler |
| **Seven-Point Story** | Karmaşık, non-linear anlatılar |
| **Save the Cat** | Senaryo, TV bölümleri, pitch deck |
| **Kishōtenketsu** | Doğu anlatıları, slice-of-life, drama |
| **Fichtean Curve** | Gerilim / thriller türleri |
| **Dan Harmon's Story Circle** | Döngüsel, karakter odaklı hikayeler |

---

## Anti-Patterns

```
❌ Karakter motivasyonu olmayan olaylar zinciri
   Karakter "bomba patlıyor çünkü olması gerekiyor"
   → Her olayı karakterin arc'ına bağla

❌ Tek boyutlu antagonizma
   "Kötü adam kötü olduğu için kötü"
   → Antagonistin kendi mantıklı düny görüşü sun

❌ Plot hole — açıklanmayan olay
   "Karakter nasıl kurtuldu bilmiyoruz"
   → Her çözümü önceden tohumla

❌ Aşırı exposition dump
  Uzun paragraflarla bilgi yığma
   → Bilgiyi diyalog ve eyleme dağıt

✅ Her sahnede bir soru sor veya cevapla
   Okuyucuyu sürekli "sonra ne olacak" modunda tut

✅ Her sahne birden fazla iş yapsın
   Hem plot ilerlesin hem karakter gelişsin hem dünya inşa edilsin

✅ Değişim + Maliyet = İyi scene
   Karakter bir şey kazanırken bir şey kaybetmeli
```

---

## Quick Reference

| Element | Soru | Örnek |
|---|---|---|
| **Plot** | Ne oluyor? | Adam suç ortağını bulmak için geçmişe döner |
| **Character** | Kim anlatıyor? | Pişman bir emekli dedektif |
| **Conflict** | Ne engel? | Sistem kendisini korumaya çalışıyor |
| **Theme** | Mesaj ne? | Adalet evrensel mi yoksa göreceli mi? |
| **Setting** | Nerede/geçen ne zaman? | 1980'ler İstanbul, yıkılmakta olan apartman |
| **Tone** | Hissiyat ne? | Melankoli ama umutla harmanlanmış |
| **Pacing** | Tempo nasıl? | İlk 3'te yavaş, ortada hızlanan, sonra patlama |
| **POV** | Kimin gözünden? | Birinci tekil şahıs — güvenilmez anlatıcı |
| **Stakes** | Risk ne? | Sadece kendisi değil, tüm mahalle tehlikede |
| **Resolution** | Nasıl bitiyor? | Pyrrhic victory — kazanır ama çok kaybeder |
