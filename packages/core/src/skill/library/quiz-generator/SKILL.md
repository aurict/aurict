---
name: quiz-generator
description: "Çoktan seçmeli soru oluşturma, difficulty seviyeleri, distractor yazımı ve rubric oluşturma."
triggers:
  keywords: ["quiz generator", "quiz", "soru bankası", "çoktan seçmeli", "distractor", "rubric", "test sorusu"]
auto_load_when: "User asks to generate quiz questions, create a test bank, or design assessment items"
agent: content-ops
tools: ["Read", "Write", "Bash"]
---

# Quiz Generator — Sınav Sorusu Üretimi ve Değerlendirme Tasarımı

**Focus:** Her seviyeye uygun çoktan seçmeli, açık uçlu ve performans soruları üretimi; cognitive demanding distractor yazımı; rubric geliştirme ve test istatistikleri.

## 1. Soru Türleri ve Yapısı

```
A. Çoktan Seçmeli (MCQ) — Temel Yapı
   ├─ Stem (Kök)         → Soru cümlesi, bağlam sağlar
   ├─ Key (Doğru Cevap)  → Teknik doğru cevap
   ├─ Distractors (Çeldiriciler) → 3-4 yanlış seçenek
   └─ options format     → A, B, C, D veya 1, 2, 3, 4
```

```
B. Açık Uçlu Soru (Free Response)
   ├─ Stem               → Açık uçlu soru cümlesi
   ├─ Expected Response  → Beklenen cevap modeli
   ├─ Rubric             → Puanlama anahtarı
   └─ Partial Credit    → Kısmi puan seçeneği
```

```
C. Performans Görevi (Performance Task)
   ├─ Task Description   → Gerçek yaşam problemi
   ├─ Constraints        → Sınırlamalar, kaynaklar
   ├─ Scoring Rubric     → Analitik rubric
   └─ Success Criteria   → Net çıktı tanımı
```

## 2. Cognitive Seviye ve Difficulty Katmanları (Bloom Tabanlı)

```
A. Dört Seviye Modeli
   ├─ Level 1: Recall
   │  → Factual bilgi, tek adımda hatırlama
   │  → "Hangi..." "Ne zaman..." "Tanımla..."
   │
   ├─ Level 2: Application
   │  → Bilgiyi yeni bağlamda kullanma
   │  → "Hesapla..." "Uygula..." "Örneklendir..."
   │
   ├─ Level 3: Analysis
   │  → Örüntü tanıma, ilişki kurma, ayrıştırma
   │  → "Karşılaştır..." "Neden..." "Araştır..."
   │
   └─ Level 4: Evaluation/Creation
      → Judgement, sentez, özgün üretim
      → "Değerlendir..." "Tasarla..." "Öner..."
```

```
B. Zorluk Derecesi (Item Difficulty)
   ├─ Kolay   → p > 0.70 (70%+ doğru cevap oranı)
   ├─ Orta    → p = 0.40-0.70
   ├─ Zor     → p = 0.20-0.40
   └─ Çok Zor → p < 0.20 (muhtemelen soru problemi)
```

## 3. Distractor (Çeldirici) Yazım Stratejileri

```
A. Distractor Yazım İlkeleri
   ├─ Hepsı aynı uzunlukta olmalı (visual balance)
   ├─ Gramatik olarak stem ile uyumlu olmalı
   ├─ Her biri inandırıcı bir yanlış inançtan kaynaklanmalı
   └─ Doğru cevap açıkça diğerlerinden ayrılmalı
```

```
B. Çeldirici Kategorileri
   ├─ Conceptually Related    → Aynı kavram kategorisinden
   │  → Fotosentez için: solunum, fermantasyon
   │
   ├─ Procedurally Similar   → Benzer hesaplama adımları
   │  → Karekök için: karesini alma, 2 ile çarpma
   │
   ├─ Common Misconception    → Yaygın yanlış anlama
   │  → "Karbon emilimi = Fotosentez" yanlış inancı
   │
   ├─ Vocabulary-Based        → Teknik terim karışıklığı
   │  → Mitokondri = Kloroplast karışıklığı
   │
   └─ Plausible but Wrong     → Mantıklı görünen yanlış
      → Yanlış bir hesaplama sonucu
```

```
C. Örnek Distractor Analizi
   Stem: "Mitoz bölünmede kromozom sayısı ne olur?"
   Key:  "Değişmez (2n → 2n)"
   D1:   "Yarıya iner (2n → n)" ← common misconception
   D2:   "İki katına çıkar (2n → 4n)" ← conceptually related
   D3:   "Dörtte birine düşer (2n → n/2)" ← procedurally similar
   D4:   "Rastgele değişir" ← implausible, too easy to eliminate
```

## 4. Rubric Oluşturma

```
A. Analitik Rubric (Detaylı Puanlama)
   ┌──────────────────────────────────────────────┐
   │ Kriter         │ 4 (Mükemmel) │ 3 │ 2 │ 1    │
   ├──────────────────────────────────────────────┤
   │ Argüman         │ [Detaylı    │    │    │ [Zayıf│
   │ Kalitesi        │ açıklama]   │    │    │ açıkl]│
   ├──────────────────────────────────────────────┤
   │ Kanıt Kullanımı │ [En az 3    │    │    │ [Yok] │
   │                 │ kaynak]     │    │    │       │
   └──────────────────────────────────────────────┘
```

```
B. Holistic Rubric (Genel Puanlama)
   ├─ 5: Üstün → Tüm kriterleri karşılıyor, ek derinlik var
   ├─ 4: Yeterli → Tüm kriterleri karşılıyor
   ├─ 3: Geliştirilmeli → Temel kriterleri karşılıyor, eksikler var
   ├─ 2: Yetersiz → Birkaç kriteri karşılıyor
   └─ 1: Kabul edilemez → Çok az veya hiç kriter karşılamıyor
```

## 5. Test İstatistikleri (Temel)

```
A. Madde Analizi Metrikleri
   ├─ Item Difficulty (p)   → Doğru cevap oranı (0-1)
   ├─ Point-Biserial (rpb)  → Madde-toplam korelasyonu (>0.20 iyi)
   └─ Response Frequency    → Her seçeneği işaretleyen %
```

```
B. İyi Soru Kontrol Listesi
   ├─ [ ] Tek kavram/madde mi test ediyor?
   ├─ [ ] Stem net ve tek yorumlanabilir mi?
   ├─ [ ] Seçenekler gramatik olarak tutarlı mı?
   ├─ [ ] Doğru cevap açıkça en iyi cevap mı?
   ├─ [ ] Çeldiriciler ayırt edici mi (en az %5 işaretlenme)?
   └─ [ ] Zorluk seviyesi hedeflenen öğrenci grubuna uygun mu?
```

## Key Patterns

| Cognitive Seviye | Bloom Karşılığı | Bloom Altı | Soru Başlatıcı |
|-------------------|-----------------|------------|----------------|
| Hatırlama | Remember | alt düzey | "Hangi...", "Tanımla" |
| Uygulama | Apply | alt düzey | "Hesapla", "Çöz" |
| Analiz | Analyze | üst düzey | "Neden", "Karşılaştır" |
| Değerlendirme | Evaluate | üst düzey | "Tartış", "Öner" |

## Anti-Patterns

```
❌ Stem'de soru tamamlanmadan seçenek sunmak
   → Tüm stem okunmadan cevap verilebilmeli

❌ "Hiçbiri doğru değil" veya "Hepsi doğru" seçenekleri
   → Genellikle test istatistiklerini bozar

❌ Tüm seçenekleri aynı uzunlukta olmaya zorlamak
   → Doğru cevap genellikle uzun olur; bu ipucu verir

❌ Negatif stem kullanmak ("Aşağıdakilerden hangisi DEĞİLDİR?")
   → Bu kolayca yanlış okunabilir; dikkatli kullan

❌ Tek bir çeldiriciye çok yüksek işaretlenme oranı
   → Bu çeldirici bir öğretim noktasını açığa çıkarıyor olabilir;
     soru yeniden yazılmalı
```

## Quick Reference

| Soru Tipi | Seçenek Sayısı | Cognitive Seviye | Puanlama |
|-----------|---------------|------------------|----------|
| Çoktan seçmeli | 4 (A-D) | Tüm seviyeler | Doğru/yanlış |
| Çok doğru | 4-5 ifade | Hatırlama-Ana | Tümünü işaretle |
| Eşleştirme | 8-10 madde | Hatırlama | Maddenin tamamı |
| Açık uçlu | Serbest | Tüm seviyeler | Rubric tabanlı |
| Essay | Serbest | Eval/Create | Rubric tabanlı |
| Performans | Belirlenmiş | Apply/Create | Analitik rubric |

| Madde Analizi | İdeal Aralık | Yorum |
|---------------|-------------|-------|
| p (difficulty) | 0.30-0.70 | Hedef aralık |
| rpb (discrimination) | >0.20 | Ayrıt edicilik iyi |
| Distractor popularity | >5% her biri | Çeldirici çalışıyor |
| Top option % | <40% | Cevap dağılımı iyi |
