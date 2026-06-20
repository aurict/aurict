---
name: language-tutor
description: "Dil pratiği, gramer açıklamaları, conversation senaryoları ve pronunciation rehberi."
triggers:
  keywords: ["language tutor", "dil pratiği", "gramer", "conversation", "pronunciation", "language learning", "türkçe öğretimi"]
auto_load_when: "User asks for language practice, grammar explanation, conversation scenarios, or pronunciation guide"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch"]
---

# Language Tutor — Dil Öğrenimi ve Pratiği

**Focus:** Yabancı dil öğrenimi için kapsamlı grammer açıklamaları, konuşma senaryoları, telaffuz rehberleri, alıştırma setleri ve öğrenci seviyesine uyarlanmış içerik üretimi.

## 1. Seviye Tespiti ve İçerik Uyarlama

```
A. CEFR Seviye Çerçevesi
   ├─ A1: Başlangıç     → Günlük ihtiyaçlar, basit cümleler
   ├─ A2: Temel         → Rutine konuşmalar, kısa metinler
   ├─ B1: Orta           → Ana konularda net iletişim
   ├─ B2: İleri Orta    → Karmaşık konularda akıcı iletişim
   ├─ C1: İleri          → Profesyonel düzeyde hakimiyet
   └─ C2: Üstün          → Native düzeyinde anlama/üretim
```

```
B. Seviye Belirleyici Sorular
   ├─ A1-A2: "Ne zaman kahve içiyorsun?" / "Evet/Hayır soruları"
   ├─ B1-B2: "Neden bu tercihi yaptın?" / "Argüman sunma"
   └─ C1-C2: "Bu görüşünün avantaj ve dezavantajları?" / "Debate"
```

## 2. Grammar Explanation Framework

```
A. Grammar Sunum Formatı
   1. Kullanım Bağlamı → Ne zaman ve nerede kullanılır?
   2. Yapı Formülü     → Pozitif/Negatif/Soru formları
   3. Zaman Çizelgesi  → Temporal kullanım tablosu
   4. Örnek Cümleler   → Her form için 2-3 örnek
   5. Yaygın Hatalar   → Yanlış vs doğru karşılaştırması
   6. Alıştırmalar     → Kontrol + Üretim
```

```
B. Yapı Açıklama Şablonu
   ┌──────────────────────────────────────────────────────────┐
   │ GRAMER NOKTASI: [İngilizce Adı]                          │
   │ Hedef Seviye: [A1/B1/C1]                                │
   ├──────────────────────────────────────────────────────────┤
   │ 📌 NE ZAMAN KULLANILIR?                                  │
   │ [Kullanım senaryosu ve bağlam]                          │
   ├──────────────────────────────────────────────────────────┤
   │ 📐 KALIP/YAPI                                           │
   │   Pozitif:   [Subject + Verb + Object]                   │
   │   Negatif:   [Subject + do/does + not + Verb]           │
   │   Soru:      [Do/Does + Subject + Verb?]                │
   ├──────────────────────────────────────────────────────────┤
   │ ✅ DOĞRU ÖRNEKLER                                       │
   │   1. [Örnek 1]                                          │
   │   2. [Örnek 2]                                          │
   ├──────────────────────────────────────────────────────────┤
   │ ❌ YANLIŞ ÖRNEKLER                                      │
   │   1. [Hatalı] → [Düzeltilmiş]                           │
   │   2. [Hatalı] → [Düzeltilmiş]                          │
   └──────────────────────────────────────────────────────────┘
```

## 3. Conversation Scenarios (Konuşma Senaryoları)

```
A. Senaryo Mimarisi
   ├─ Setting (Bağlam)     → Nerede, kimler arasında
   ├─ Goal (Hedef)         → Öğrencinin iletişim amacı
   ├─ Functions (Fonksiyon)→ Selamlaşma, rica, şikayet, etc.
   ├─ Useful Phrases       → Kalıp ifadeler
   └─ Follow-up Questions  → Derinleştirici sorular
```

```
B. Konuşma Düzeyleri
   Level 1 (A1): Tekrarlama + Basit cevap
   Level 2 (A2): Seçim soruları + Kısa yanıt
   Level 3 (B1): Açık uçlu + Görüş ifadesi
   Level 4 (B2+): Argüman + Tartışma + Yaratıcı yanıt
```

```
C. Örnek Senaryo: Restaurant Reservation (B1)
   ┌──────────────────────────────────────────────────────────┐
   │ SETTING: Telefonla restoran rezervasyonu                  │
   │ GOAL: Masal rezerve etmek                                 │
   ├──────────────────────────────────────────────────────────┤
   │ 🎬 ROLE-PLAY                                             │
   │                                                          │
   │ A: "Good evening, La Trattoria, how can I help?"         │
   │ B: "I'd like to make a reservation, please."              │
   │ A: "Of course. For how many people?"                     │
   │ B: "For four people, for Friday evening at 8pm."          │
   │ A: "May I have your name?"                               │
   │ B: "Yes, it's Martinez."                                 │
   ├──────────────────────────────────────────────────────────┤
   │ 💬 USEFUL PHRASES                                        │
   │ ├─ "I'd like to make a reservation..."                   │
   │ ├─ "For how many people?"                               │
   │ ├─ "At what time?"                                      │
   │ ├─ "May I have your name?"                              │
   │ └─ "A table for ... please"                              │
   ├──────────────────────────────────────────────────────────┤
   │ ❓ FOLLOW-UP QUESTIONS                                  │
   │ ├─ What if the restaurant is fully booked?              │
   │ ├─ How do you ask about the dress code?                  │
   │ └─ How do you modify or cancel a reservation?           │
   └──────────────────────────────────────────────────────────┘
```

## 4. Pronunciation Guide

```
A. Fonetik Elementler
   ├─ Vowel Sounds (Ünlüler)    → [i:], [ɪ], [e], [æ], [ɑ:]
   ├─ Consonant Sounds (Ünsüzler)→ [θ], [ð], [ʃ], [ʒ], [ŋ]
   ├─ Diphthongs (İkili ünlüler) → [eɪ], [aɪ], [ɔɪ], [aʊ], [əʊ]
   └─ Stress Patterns (Vurgu)   → Word stress, sentence stress
```

```
B. Telaffuz Egzersizleri
   ├─ Minimal Pairs → ship/sheep, bet/beet, light/like
   ├─ Shadowing    → Aynı anda аудио'yu takip etme
   ├─ Recording    → Kendi sesini kaydet ve karşılaştır
   └─ Rhythm Practice → İngilizce'nin musicality'si
```

## 5. Alıştırma Türleri

```
A. Input Alıştırmaları (Receiving)
   ├─ Multiple Choice Grammar
   ├─ Error Correction
   ├─ Fill in the blanks
   └─ Transformation exercises

B. Output Alıştırmaları (Producing)
   ├─ Sentence building
   ├─ Guided writing
   ├─ Free writing / Dialogue creation
   └─ Translation (L1 → L2)
```

## Key Patterns

| CEFR | Kelime | Konuşma Sürekliliği | Grammar Odak |
|------|--------|---------------------|-------------|
| A1 | ~1000 | Kısa cümleler | Present simple |
| A2 | ~2000 | Basit rutinler | Past, future |
| B1 | ~4000 | Standart konuşma | Conditionals |
| B2 | ~6000 | Karmaşık tartışma | Subjunctive |
| C1 | ~10000 | Akıcı profesyonel | Idiomatic |
| C2 | ~20000 | Native benzeri | Nüanslar |

## Anti-Patterns

```
❌ Gramer kuralını verip pratik yapmadan bırakmak
   → Her kural en az 5 alıştırma ile pekiştirilmeli

❌ Tüm seviyeye aynı içeriği sunmak
   → CEFR uyarlaması şart; seviye yanlış anlaşılırsa motivasyon düşer

❌ Çeviri temelli öğretim (L1 → L2)
   → Hedef dilde düşünmeyi teşvik et; çeviri destekleyici olmalı

❌ Monoton tekrar alıştırmaları
   → Input + Output + Interaction kombinasyonu

❌ Telaffuzu sadece yazılı açıklamak
   → IPA sembolleri + аудио link + görsel ağız pozisyonu
```

## Quick Reference

| Konuşma Becerisi | A1-A2 | B1-B2 | C1-C2 |
|-----------------|-------|-------|-------|
| Selamlaşma | Kalıp cümleler | Kişisel güncelleme | Sosyal/politik |
| Rica etme | "Can you...?" | "I was wondering..." | Nüanslı rica |
| Görüş ifadesi | "I think..." | "I believe..." | "From my perspective..." |
| Tartışma | Fikir belirtme | Destekleme/çürütme | Çoklu bakış |
| Ikna etme | Basit argüman | Kanıt sunma | Retorik strateji |

| Alıştırma Türü | Amaç | Örnek |
|----------------|------|-------|
| Controlled practice | Yapıyı internalize | Boşluk doldurma |
| Semi-controlled | Hafif yaratıcılık | Cümle dönüştürme |
| Free practice | Özgür üretim | Role-play |
| Input practice | Dinleme/okuma | Shadowing |

| Pronunciation | Zorluk | Teknik |
|---------------|--------|--------|
| [θ] vs [ð] | Yüksek | Dil diş arası |
| [l] vs [r] | Yüksek | Japon, Çin öğrenciler |
| Word stress | Orta | İkili hece vurgusu |
| Intonation | Yüksek | Soru/tanımlama tonu |
