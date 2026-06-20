---
name: flashcard-maker
description: "Anki/Quizlet kartları, spaced repetition, card tipleri ve deck organizasyonu."
triggers:
  keywords: ["flashcard", "anki", "quizlet", "spaced repetition", "flash card", "bilgi kartı", "tekrar"]
auto_load_when: "User asks to create flashcards, generate Anki/Quizlet decks, or optimize spaced repetition study"
agent: content-ops
tools: ["Read", "Write", "Bash"]
---

# Flashcard Maker — Spaced Repetition Kart Üretimi

**Focus:** Anki ve Quizlet uyumlu flashcard deck'leri üretimi, spaced repetition algoritması optimizasyonu, farklı kart tiplerinin tasarımı ve etkili öğrenme stratejileri.

## 1. Kart Tipi Kategorileri

```
A. Basic (Temel) Kart
   Front: [Terim/Kavram]
   Back:  [Tanım/Açıklama]

   Kullanım: Terminoloji, tanımlar, basit bilgi
   Örnek:
     Front: Mitochondria
     Back:  The powerhouse of the cell; organelle that produces ATP
```

```
B. Reversed (Ters) Kart
   Aynı bilgi iki yönde:
   Kart 1: Term → Definition
   Kart 2: Definition → Term

   Kullanım: Çift yönlü hatırlama gerektiren bilgi
```

```
C. Cloze Deletion (Boşluk) Kart
   Front: [Cümle ___ boşluklu]
   Back:  [Boşluğun cevabı]

   Kullanım: Cümle kalıpları, formüller, dilbilgisi
   Örnek:
     Front: Photosynthesis converts ___ into chemical energy.
     Back:  Light / sunlight / radiant energy
```

```
D. Image Occlusion (Görsel Engelleme) Kart
   Front: [Diyagram + belirli bölgeler maskelenmiş]
   Back:  [Maskelenmiş bölgeler görünür]

   Kullanım: Anatomi, diyagramlar, haritalar
```

```
E. Audio Kart
   Front: [Sorunun kendisi veya ipucu]
   Back:  [ аудио veya metin cevabı]

   Kullanım: Dil öğrenimi, telaffuz, dinleme
```

```
F. Rich Media Kart
   Front: [Metin + Görsel + ipucu]
   Back:  [Açıklama + ek kaynaklar]

   Kullanım: Karmaşık kavramlar, görsel öğrenenler
```

## 2. Spaced Repetition Algoritması

```
A. SM-2 Algoritması (Anki Temeli)
   ├─ EF (Ease Factor): Başlangıç 2.5, her adımda güncellenir
   │  → Yanlış cevap: EF = EF - 0.2
   │  → Doğru cevap: EF = EF + 0.15 - (0.15 + 0.15*(5-q))
   │
   ├─ Interval (Aralık) Hesaplama
   │  → n=1: 1 gün
   │  → n=2: 6 gün
   │  → n>2: prev_interval × EF
   │
   └─ Quality Rating (q)
      ├─ 0: Tamamen unuttum ( Again)
      ├─ 1: Yanlış hatırladım (Hard)
      ├─ 2: Zor hatırladım (Good)
      ├─ 3: Kolay hatırladım (Easy) → interval × 1.3
      └─ 4: Çok kolay → interval × 1.3 × EF
```

```
B. FSSS (Fazlasıyla Basitleştirilmiş Spaced System)
   ├─ Her gün = Yeni kartlar + Bekleyen tekrar
   ├─ 20 yeni kart/sesion limiti (öğrenme yükünü kontrol)
   ├─ "Again" = 1 dakika bekle → tekrar
   └─ "Good" = Hesaplanan aralık
```

## 3. Etkili Kart Tasarım İlkeleri

```
A. Minimalizm Kuralı
   ├─ Tek kart = Tek bilgi noktası
   ├─ Başlık kısa tut (ideal <20 kelime)
   ├─ Görsel > Metin (mümkün olduğunda)
   └─ Tanım = Formül + Örnek değilse sadeleştir
```

```
B. Bağlam Sağlama
   ├─ "Cloze" kullanırken bağlam cümlesi ekle
   │  → ✗ "ATP is ___"
   │  → ✓ "During cellular respiration, ATP is produced by ___"
   │
   └─ Kartın hangi deck'te olduğunu hatırlatıcı ipucu
```

```
C. Active Recall Zorlama
   ├─ Soru formatında sor (question-first)
   │  → ✗ "Mitochondria: The powerhouse of the cell"
   │  → ✓ "Which organelle produces ATP?"
   │
   └─ Cevabı mümkün olduğunca tam ver
```

## 4. Deck Organizasyonu

```
A. Hiyerarşik Yapı
   Root Deck (Ana)
   ├─ Subject: Biology
   │  ├─ Chapter 1: Cell Biology
   │  │  ├─ Organelles
   │  │  └─ Cell Division
   │  └─ Chapter 2: Genetics
   │     ├─ DNA Structure
   │     └─ Mendelian Genetics
   └─ Language: Spanish
      ├─ Vocabulary: Greetings
      └─ Grammar: Ser vs Estar
```

```
B. Tagging Sistemi
   Etiket Format: [subject]:[topic]:[subtopic]:[difficulty]
   Örnekler:
     bio:cell:mitochondria:A1
     lang:spanish:vocabulary:food:A2
     hist:ww2:battles:B1
```

```
C. Deck İçerik Dağılımı (Optimal)
   ├─ %60 Basic cards (tanımlar, terimler)
   ├─ %20 Cloze cards (cümle kullanımı)
   ├─ %15 Image Occlusion (diyagramlar)
   └─ %5  Custom/Rich (karmaşık kavramlar)
```

## 5. Anki ve Quizlet Format Çıktıları

```
A. Anki Import Format (TSV)
   fields:
     front \t back \t tags \t

   format: tab-separated, one card per line
   encoding: UTF-8
   extension: .txt or .tsv
```

```
B. Quizlet Format
   ├─ Set name, description
   ├─ Term-Definition pairs
   └─ Export: CSV, JSON, or direct link
```

```
C. Python Script Template (Anki Batch Import)
   def create_anki_deck(cards: list[dict], output: str):
       """
       cards: [{"front": "...", "back": "...", "tags": [...]}, ...]
       """
       output_lines = []
       for card in cards:
           line = f"{card['front']}\t{card['back']}\t"
           line += " ".join(card.get('tags', []))
           output_lines.append(line)

       with open(output, 'w', encoding='utf-8') as f:
           f.write("\n".join(output_lines))
```

## Key Patterns

| Kart Tipi | Anki Tipi | Quizlet Modu | Hafıza Gücü |
|-----------|-----------|-------------|-------------|
| Basic | Basic | Flashcards | ★★★ |
| Cloze | Cloze | Learn | ★★★★ |
| Reversed | Basic (×2) | Learn | ★★★★★ |
| Image Occlusion | Image Occlusion | Flashcards | ★★★★★ |
| Audio | Basic + audio | Learn | ★★★★ |

## Anti-Patterns

```
❌ Uzun kartlar: Bir kartta birden fazla bilgi
   → Parçalara ayır; her kart tek bilgi noktası

❌ Copy-paste textbook metinleri
   → Kendi kelimelerinle yeniden yaz; active recall zorla

❌ Pasif tanıma kartları (çok okuma)
   → Her kart question-first olmalı; geri çağırma zorunlu

❌ Çok fazla yeni kart tek seferde (20+)
   → Günlük limit koy; yığılmaya izin verme

❌ Aynı bilgiyi birden fazla deck'e dağıtmak
   → Tek kaynak, birden çok tag ile eriş
```

## Quick Reference

| SM-2 Kalite | Anki Butonu | Interval Etkisi | Tekrar |
|-------------|-------------|-----------------|--------|
| 0 | Again | 1 min → tekrar | Zorunlu |
| 1 | Hard | interval × 1.2 | Gerekli |
| 2 | Good | interval × EF | Normal |
| 3 | Easy | interval × 1.3 | Hızlı ilerleme |

| Kart Tasarımı | Kural | Örnek |
|--------------|-------|-------|
| Uzunluk | front <20 kelime | "What does ATP stand for?" |
| Bağlam | Cloze'da şart | "During photosynthesis, CO2 is fixed into..." |
| Görsel | Mümkünse ekle | Anatomi kartlarına diagram |
| Örnek | Somut ekle | "Mitochondria: like a battery in a phone" |

| Spaced Repetition | Günlük Hedef | Interval |
|-------------------|-------------|----------|
| Yeni kart | 20/gun | Başlangıç 1 gün |
| Tekrar | 100-200/gun | EF × prev |
| Maksimum interval | 365 gün | Genel limit |

| Platform | Artıları | Eksileri |
|----------|---------|----------|
| Anki | Tam SM-2, ücretsiz, açık kaynak | UI karmaşık |
| Quizlet | Kullanımı kolay, sosyal | Basit algoritma |
| Mochi | Güzel UI, iyi algoritma | Yeni platform |
| Supermemo | En gelişmiş algoritma | Steep learning curve |
