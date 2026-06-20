---
name: cold-email-writer
description: "Soğuk e-posta yazımı. Hook oluşturma, kişiselleştirme, follow-up sequence ve deliverability optimizasyonu."
triggers:
  keywords: ["cold email", "soğuk e-posta", "cold email writer", "outreach", "spam avoidance", "e-posta açılma oranı"]
auto_load_when: "Kullanıcı soğuk e-posta kampanyası, outreach stratejisi veya e-posta şablonu talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Grep", "Glob"]
---

# Cold Email Writer (Soğuk E-Posta Uzmanı)

**Odak Alanı:** Yüksek dönüşüm oranlı B2B soğuk e-postalar tasarlamak, kişiselleştirme stratejileri geliştirmek ve deliverability'yi maksimize etmek.

---

## Pattern 1: Hook Oluşturma Stratejisi

### 1.1 Attention Hook Türleri

```
Problem Hook (En Etkili)
├── Format: "[Specific Problem] hakkında [X] yıl içinde [Y] kez denediniz mi?"
├── Örnek: "Satış ekibinizdeki churn rate'i son 6 ayda %15 arttı mı?"
└── Kullanım: CTA'ya yakın, ilk paragrafta

Curiosity Hook
├── Format: "[Sektör]-de [X] şirketin yaptığı bir hata..."
├── Örnek: "B2B SaaS şirketlerinin %73'ünün yaptığı bir pricing hatası..."
└── Kullanım: Açılış cümlesi olarak

Social Proof Hook
├── Format: "[Company X], [Result] elde etti..."
├── Örnek: "Rivali XYZ, 3 ayda 2M$ ek gelir elde etti"
└── Kullanım: Case study destekli

Data Hook
├── Format: "[X]% [Y] artışı [Z] sektöründe..."
├── Örnek: "%40 daha fazla demo talebi, doğru timing ile"
└── Kullanım: İstatistik odaklı prospectler için
```

### 1.2 Hook Kalıp Ağacı

```
Hook Seçim Algoritması
├── Prospect Profili
│   ├── C-Level → Problem + Authority trigger
│   ├── VP/Director → Data + ROI trigger  
│   ├── Manager → Efficiency + Quick win trigger
│   └── IC → Process + Tool trigger
├── Industry Vertical
│   ├── Tech/SaaS → Velocity + Scale trigger
│   ├── Finance → Compliance + Risk trigger
│   ├── Healthcare → Patient outcome trigger
│   └── Retail → Customer experience trigger
└── Company Stage
    ├── Startup (<50) → Growth + Speed trigger
    ├── Mid-market (50-500) → Scale + Process trigger
    └── Enterprise (500+) → Risk + Compliance trigger
```

---

## Pattern 2: Personalization Katmanları

### 2.1 Surface Level Personalization (Minimal)

```
Minimum gereksinimler:
├── First name + Company name
├── LinkedIn profile'dan 1 ortak bağlantı
├── Son blog post veya press release referansı
└── Aktif olarak kullandıkları tool/technology
```

### 2.2 Deep Personalization (Yüksek Etki)

```
Medium Personalization
├── Son 90 gündeki LinkedIn paylaşımından specific reference
├── Recent funding/expansion news bağlantısı
├── Şirket konferansındaki konuşmacı referansı
└── Podcast veya webcast katılımı

Deep Personalization
├── İçerik üretimi (blog, newsletter) pattern analizi
├── Review sites (G2, Capterra) feedback analizi
├── Competitor kullanıcı deneyimi insight
├── LinkedIn company's employee post engagement
└── Industry event'te sordukları soru analizi
```

### 2.3 Personalization Matrix

```
Hedef: 50+ prospect → 50 unique opener

Personalization Katmanı
├── Level 1 (Tüm maillerde): Name + Company ✓
├── Level 2 (Batch 1-10): Industry news ✓
├── Level 3 (Batch 11-25): Company-specific ✓
├── Level 4 (Batch 26-40): Role-specific ✓
└── Level 5 (Batch 41-50): Account-based ✓

Zaman Investasyonu
├── Level 1: 30 saniye/prospect
├── Level 2: 2 dakika/prospect
├── Level 3: 5 dakika/prospect
├── Level 4: 8 dakika/prospect
└── Level 5: 15+ dakika/prospect
```

---

## Pattern 3: Follow-Up Sequence Tasarımı

### 3.1 Optimal Sequence Yapısı

```
5-Step Follow-Up Framework
├── Step 1 (Day 0): Initial email - Value hook
├── Step 2 (Day 3): Social proof + Case study
├── Step 3 (Day 7): Question-based follow-up
├── Step 4 (Day 14): Alternative angle (tool/angle shift)
└── Step 5 (Day 21): Break-up email (last attempt)

Total sequence süresi: 21 gün
Optimal opening rate: %40-50 by step 3
```

### 3.2 Follow-Up Triggers

```
Condition-based triggers:
├── Opens > 0 → Day 3 social proof
├── Clicks CTA → Day 2 booking push
├── No open → Day 4 subject line change
├── Reply "not interested" → Day 5 soft offer
└── No reply → Day 21 break-up + LinkedIn connect
```

---

## Pattern 4: Deliverability Optimizasyonu

### 4.1 Technical Checklist

```
Email Infrastructure
├── Dedicated IP (min 100k reputation)
├── SPF, DKIM, DMARC configured
├── Domain age > 90 gün
├── Volume ramp-up schedule
└── Warm-up protocol (50 → 500/day over 30 days)

Content Signals
├── Subject line: 30-50 karakter, no ALL CAPS
├── Preheader: 40-80 karakter, personalization
├── Body: 100-200 kelime (mobile-first)
├── Link: max 2 link, same domain
└── CTA: tek, spesifik, above fold
```

### 4.2 Spam Trigger Avoidance

```
RED FLAGS (Avoid):
├── ❌ "Free", "Guarantee", "No obligation"
├── ❌ Excessive punctuation (!!!, ???)
├── ❌ All caps subject lines
├── ❌ "Limited time" urgency
├── ❌ "As seen in" fake social proof
└── ❌ excessive emojis

GREEN SIGNALS:
├── ✓ Specific industry terminology
├── ✓ Problem-focused messaging
├── ✓ No direct asks in first email
├── ✓ Soft CTA (reply vs book meeting)
└── ✓ Professional formatting
```

---

## Pattern 5: A/B Testing Framework

### 5.1 Test Kategorileri

```
High-Impact Tests
├── Subject Lines (priority: #1)
│   ├── Question vs Statement
│   ├── Personalized vs Generic
│   └── Length variation (short/medium/long)
├── Send Time
│   ├── Day of week (Tue-Thu optimal)
│   └── Time of day (7-9am, 11am-1pm local)
├── Preview Text
│   └── CTA vs Value prop
└── Email Length
    ├── Short (50 words) vs Medium (150 words)
    └── Bullet points vs Paragraph
```

---

## Key Patterns (Özet)

| Pattern | Odak | Etki |
|---------|------|------|
| Hook Oluşturma | İlk 7 kelime | %80 okunma oranı belirler |
| Personalization | Relevance score | %35 açılma artışı |
| Follow-Up | Timing + Value | %45 yanıt oranı artışı |
| Deliverability | Technical setup | %30 inbox rate |
| A/B Testing | Continuous optimization | %20 conversion improvement |

---

## Anti-Patterns

### ❌ Yasaklı Kalıplar

```yaml
Generic opener:
  - "I hope this email finds you well"
  - "I wanted to reach out"
  
Spam triggers:
  - "Make $X in Y days"
  - "Limited time offer"
  - "100% guarantee"

Personalization fails:
  - Wrong company name
  - Outdated information (>3 ay)
  - Misspelled prospect name
```

### ✅ Doğru Yaklaşımlar

```yaml
Problem-focused:
  - "Son [X] ayda [Y] konusunda [Z] yaptınız mı?"

Specific + Relevant:
  - "[Company]'ın [Recent Event] hakkındaki stratejisi..."

Value-first:
  - "3 rakibinizin kullandığı [Method]..."
  - "[Industry]'da [X] trendi hakkında..."
```

---

## Quick Reference

| Kanal | Metrik | Hedef |
|-------|--------|-------|
| Open Rate | %30-40 | Industry avg üstü |
| Click Rate | %3-5 | CTA'ya tıklama |
| Reply Rate | %8-15 | Meeting booking |
| Unsubscribe | <%0.5 | Spam complain |
| Spam Trap | %0 | Zero tolerance |

| Element | Optimal | Max |
|---------|---------|-----|
| Subject | 30-50 char | 60 char |
| Preheader | 40-80 char | 100 char |
| Email body | 100-200 words | 350 words |
| Links | 1-2 | 3 |
| CTA per email | 1 | 2 |

| Timing | Day | Time (Local) |
|--------|-----|--------------|
| Best send | Tuesday-Thursday | 7-9am, 11am-1pm |
| Avoid | Monday, Friday | After 5pm |
| Follow-up | Day 3, 7, 14 | Same as initial |
