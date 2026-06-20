---
name: study-guide-creator
description: "Özet çalışma kılavuzu, chapter-by-chapter özet, flashcard formatı ve quick reference sheet."
triggers:
  keywords: ["study guide", "özet", "çalışma kılavuzu", "textbook summary", "chapter summary", "not çıkarma"]
auto_load_when: "User asks to create a study guide, summarize a chapter, or generate review materials from source text"
agent: content-ops
tools: ["Read", "Write", "Bash"]
---

# Study Guide Creator — Çalışma Kılavuzu ve Özet Üretimi

**Focus:** Ders kitabı, makale veya kaynak metinlerden yapılandırılmış çalışma kılavuzları, bölüm özetleri, flashcard setleri ve hızlı referans materyalleri üretimi.

## 1. Çalışma Kılavuzu Türleri

```
A. Chapter-by-Chapter Summary Guide
   ├─ Her bölümün ana fikri tek cümlede
   ├─ Temel kavramlar listesi
   ├─ Önemli terimler ve tanımları
   ├─ Bilgi soruları (recall seviyesi)
   └─ Uygulama soruları (apply seviyesi)
```

```
B. Concept Map Study Guide
   ├─ Merkezi kavram → çevresinde alt kavramlar
   ├─ Kavramlar arası ilişkiler (ok + etiket)
   ├─ Hiyerarşik düzen (genel → spesifik)
   └─ Renk kodlaması (kategori bazlı)
```

```
C. Comparative Study Guide
   ├─ İki veya daha fazla konsept/yaklaşım
   ├─ Benzerlikler sütunu
   ├─ Farklılıklar sütunu
   └─ Karşılaştırmalı sorular
```

```
D. Quick Reference Sheet (Cheat Sheet)
   ├─ Tek sayfa formatı (A4/Boyut)
   ├─ Formüller, tanımlar, formlar
   ├─ Renkli vurgu (kritik bilgiler)
   └─ Hafıza ipuçları ve mnemonikler
```

## 2. Chapter Summary Şablonu

```
┌────────────────────────────────────────────────────────────────┐
│ BÖLÜM [N]: [BAŞLIK]                                            │
├────────────────────────────────────────────────────────────────┤
│ 📌 BÖLÜM ÖZETİ (1-3 paragraf)                                  │
│ Bu bölümde [ana tema] ele alınıyor. [Temel argüman]...          │
├────────────────────────────────────────────────────────────────┤
│ 🔑 TEMEL KAVRAMLAR                                              │
│   1. [Kavram 1] — [1 cümlelik açıklama]                        │
│   2. [Kavram 2] — [1 cümlelik açıklama]                        │
│   3. [Kavram 3] — [1 cümlelik açıklama]                        │
├────────────────────────────────────────────────────────────────┤
│ 📝 ÖNEMLİ TERİMLER VE TANIMLARI                                │
│   ├─ Terim 1: [Tanım]                                          │
│   ├─ Terim 2: [Tanım]                                          │
│   └─ Terim 3: [Tanım]                                          │
├────────────────────────────────────────────────────────────────┤
│ ❓ BİLGİ SORULARI                                               │
│   □ [Recall seviyesinde 5-7 soru]                              │
├────────────────────────────────────────────────────────────────┤
│ 🔧 UYGULAMA SORULARI                                            │
│   □ [Apply/Analysis seviyesinde 3-5 problem/senaryo]          │
├────────────────────────────────────────────────────────────────┤
│ 💡 ANAHTAR ÇIKARIMLAR                                          │
│   • [En önemli 3-5 nokta, numaralı liste]                      │
└────────────────────────────────────────────────────────────────┘
```

## 3. Bilgi Düzeylerine Göre Soru Katmanları

```
A. Recall (Hatırlama) — Düşük Bilişsel Yük
   ├─ "Tanımını yapınız."
   ├─ "Listeleyiniz."
   ├─ "Kim/Nerede/Ne zaman?"
   └─ "Hangisi...?"
```

```
B. Understand (Anlama) — Orta Bilişsel Yük
   ├─ "Farkı açıklayınız."
   ├─ "Örnek veriniz."
   ├─ "Özetleyiniz."
   └─ "Neden önemli?"
```

```
C. Apply (Uygulama) — Yüksek Bilişsel Yük
   ├─ "Bu ilkeyi şu senaryoya uygulayınız."
   ├─ "Bir örnek oluşturunuz."
   ├─ "Nasıl çözersiniz?"
   └─ "Tahlil ediniz."
```

```
D. Evaluate (Değerlendirme) — En Yüksek Bilişsel Yük
   ├─ "Tartışınız."
   ├─ "Değerlendiriniz."
   ├─ "Eleştiriniz."
   └─ "Öneriniz."
```

## 4. Flashcard Entegrasyonu

```
A. Otomatik Flashcard Çıkarımı
   ├─ Terim → Tanım çiftleri (Basic)
   ├─ Kavram → Açıklama + Örnek (Rich)
   ├─ Soru → Cevap (Reversed)
   └─ Karşılaştırma → Eşleştirme kartı
```

```
B. Çıkarım Formatı (Anki/Quizlet uyumlu)
   Card 1 (Basic):
     Front: [Terim/Kavram]
     Back:  [Tanım + 1 örnek]

   Card 2 (Cloze/Deletion):
     Front: [Cümle ___ boşluklu]
     Back:  [Boşluğun cevabı]

   Card 3 (Image Occlusion):
     Front: [Diyagram + masked bölgeler]
     Back:  [Açık diyagram]
```

## 5. Memory ve Mnemonik Entegrasyonu

```
A. Mnemonik Stratejiler
   ├─ Acronym        → İlk harflerden kelime: VAKIL (Vücut, Ağız, Kıl)
   ├─ Acrostic       → İlk harflerden cümle: "Her Canlı Faydalı İstanbul"
   ├─ Story Method    → Bilgiyi hikayeye bağlama
   ├─ Method of Loci  → Bilgiyi tanıdık mekana yerleştirme
   └─ Chunking        → Uzun bilgiyi gruplara ayırma
```

```
B. Active Recall Entegrasyonu
   ├─ Soru-yanıt kartları → Test et
   ├─ Boşluk doldurma     → Hatırlama pratiği
   ├─ Sebeb-sonuç zinciri  → İlişki kurma
   └─ Mini quiz           → Düzenli kendini test
```

## Key Patterns

| Format | Kullanım | Uzunluk | Platform |
|--------|----------|---------|----------|
| Chapter Summary | Ders çalışma | 1-2 sayfa/bölüm | PDF/Notion |
| Cheat Sheet | Sınav öncesi hızlı tekrar | 1 sayfa | A4/PNG |
| Concept Map | Görsel öğrenenler | Değişken | Miro/Draw.io |
| Flashcard Set | Spaced repetition | 20-50 kart | Anki/Quizlet |
| Comparative Table | Karşılaştırma | 1 sayfa | PDF/Excel |

## Anti-Patterns

```
❌ Tüm metni tekrar yazmak (copy-paste özet)
   → Kendi kelimelerinle ifade et; analiz et

❌ Sadece recall seviyesinde soru sormak
   → En az %30 üst düzey (apply/evaluate) soru ekle

❌ Çok fazla bilgi sıkıştırmak
   → Cheat sheet'te en kritik %20'ye odaklan

❌ Görsel hiyerarşi eksikliği
   → Başlık, alt başlık, işaret ve boşluk kullan

❌ Aktif tekrar içermeyen format
   → Her kılavuz en az 1 active recall bölümü içermeli
```

## Quick Reference

| Bölüm | İçerik | Satır/Başlık |
|-------|--------|--------------|
| Özet | Ana fikir paragrafı | 3-5 satır |
| Kavramlar | Tanımlar | 5-10 madde |
| Terimler | Sözlük | 10-20 madde |
| Sorular | Recall + Apply | 10-20 soru |
| Çıkarımlar | Ana noktalar | 5 madde |

| Bilgi Seviyesi | Bloom | Soru Sayısı Oranı |
|-----------------|-------|--------------------|
| Hatırlama | Remember | %30 |
| Anlama | Understand | %25 |
| Uygulama | Apply | %25 |
| Analiz+ | Analyze/Eval | %20 |

| Platform | Format Desteği | Sync |
|----------|---------------|------|
| Anki | Basic, Cloze, Image Occlusion | Cloud |
| Quizlet | Learn, Flashcards, Scatter | Cloud |
| Notion | Tüm formatlar | Local/Cloud |
| Miro | Concept Map | Cloud |
| Obsidian | MD, Canvas | Local |
