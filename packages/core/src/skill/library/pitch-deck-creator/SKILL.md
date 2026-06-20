---
name: pitch-deck-creator
description: "Sunum şablonu oluşturma. Slide yapısı, story flow, data visualization ve deck metrics."
triggers:
  keywords: ["pitch deck", "sunum şablonu", "investor pitch", "startup pitch", "sales deck", "presentation builder"]
auto_load_when: "Kullanıcı pitch deck, yatırımcı sunumu, satış prezentasyonu veya slide yapısı talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Grep", "Glob"]
---

# Pitch Deck Creator (Sunum Uzmanı)

**Odak Alanı:** Yatırımcı ve satış pitchleri için etkili slide yapıları, hikaye akışı ve veri görselleştirme stratejileri tasarlamak.

---

## Pattern 1: Slide Yapısı Mimarisi

### 1.1 Startup Pitch Deck (Investor)

```
Standard 10-Slide Framework (Sequoia Style)
├── Slide 1: Problem
│   ├── Mevcut pain point'i tanımla
│   ├── Target customer segment
│   └── Problem severity (quantify)
├── Slide 2: Solution
│   ├── Ürün/Service tanımı
│   ├── Key value proposition
│   └── How it works (1-liner)
├── Slide 3: Why Now
│   ├── Market timing
│   ├── Technology shift
│   └── Regulatory change (varsa)
├── Slide 4: Market Size
│   ├── TAM (Total Addressable Market)
│   ├── SAM (Serviceable Addressable Market)
│   └── SOM (Serviceable Obtainable Market)
├── Slide 5: Business Model
│   ├── Revenue model
│   ├── Pricing tiers
│   └── Unit economics
├── Slide 6: Go-to-Market
│   ├── Customer acquisition channels
│   ├── Sales cycle
│   └── Expansion strategy
├── Slide 7: Competition
│   ├── Competitive landscape
│   ├── Key differentiators
│   └── Barriers to entry
├── Slide 8: Team
│   ├── Founders background
│   ├── Key hires (CTO, Sales, etc)
│   └── Advisory board
├── Slide 9: Financials
│   ├── Traction metrics
│   ├── Projections (3-5 years)
│   └── Key assumptions
└── Slide 10: Ask
    ├── Funding amount
    ├── Use of funds
    └── Expected runway
```

### 1.2 Sales Deck Yapısı

```
B2B Sales Deck (15-20 slides)
├── Section A: Introduction (3 slides)
│   ├── Company overview
│   ├── Why we exist
│   └── Value proposition summary
├── Section B: Problem Discovery (3 slides)
│   ├── Industry challenges
│   ├── Customer pain points
│   └── Cost of inaction
├── Section C: Solution (5 slides)
│   ├── Platform/Product overview
│   ├── Key features
│   ├── How it works
│   ├── Differentiators
│   └── Integration/security
├── Section D: Social Proof (3 slides)
│   ├── Case studies (1-2)
│   ├── Customer logos
│   └── Industry recognition
├── Section E: Proposal (3 slides)
│   ├── Investment options
│   ├── Timeline
│   └── Next steps
└── Section F: Appendix (as needed)
    ├── Technical specs
    ├── Team bios
    └── Detailed financials
```

---

## Pattern 2: Story Flow Mimarisi

### 2.1 The Pitch Narrative Arc

```
Story Structure (3-Act Model)
├── Act 1: The Hook (Slides 1-3)
│   ├── Problem presentation
│   ├── Emotional connection
│   └── Why now urgency
├── Act 2: The Journey (Slides 4-8)
│   ├── Solution reveal
│   ├── Market validation
│   ├── Business model
│   └── Traction proof
└── Act 3: The Call (Slides 9-10)
    ├── Team credibility
    ├── Financial ask
    └── Vision clarity
```

### 2.2 Story Flow Tree

```
Narrative Decision Tree
├── Opening Frame
│   ├── Problem-first → Emotional hook
│   └── Solution-first → Rational hook
├── Problem Framing
│   ├── Quantified pain → Data-backed
│   └── Anecdotal → Personal story
├── Solution Reveal
│   ├── Demo-based → Visual
│   └── Feature-focused → Technical
├── Validation
│   ├── Metrics-driven → Traction
│   └── Social proof → Authority
└── Closing
    ├── Ask-driven → Direct
    └── Vision-driven → Inspirational
```

---

## Pattern 3: Data Visualization Strategy

### 3.1 Chart Türleri ve Kullanım

```
Quantitative Data
├── Market Size → Donut chart (TAM/SAM/SOM)
├── Growth trajectory → Line chart (12-month)
├── Revenue model → Stacked bar (tiers)
├── Competitive position → Quadrant chart
├── Customer segments → Horizontal bar
└── Financial projections → Area chart

Qualitative Data
├── Problem severity → Icon scale
├── Feature comparison → Checkbox matrix
├── Timeline → Gantt chart
└── Team composition → Org chart
```

### 3.2 Data Viz Best Practices

```
Design Rules:
├── Max 5 data points per chart
├── Use consistent color palette (max 5 colors)
├── Label axes clearly
├── Include data source (bottom right)
├── Add "So what?" insight annotation
└── Use real numbers (no fake precision)

Wrong:
├── ❌ 3D charts
├── ❌ Pie charts with >5 slices
├── ❌ Cluttered axes
├── ❌ No legend
└── ❌ Decorative elements

Right:
├── ✓ Clean axis labels
├── ✓ Direct labeling or legend
├── ✓ Highlight key data point
├── ✓ Consistent spacing
└── ✓ White space balance
```

---

## Pattern 4: Deck Metrics Optimization

### 4.1 Slide-Level Metrics

```
Per Slide Performance Targets:
├── Load time: <1.5 seconds
├── Text density: <30 words
├── Visual elements: 1-2 key images
├── Data points: max 5
├── Reading time: <10 seconds
└── Key message: 1 takeaway
```

### 4.2 Deck-Level Metrics

```
File Specifications:
├── Total slides: 10-20 (investor), 15-25 (sales)
├── File size: <10MB (optimized images)
├── Total words: 500-800
├── Animation: minimal, purposeful
├── Fonts: 2 max (body + accent)
└── Aspect ratio: 16:9 (standard) or 4:3 (legacy)
```

---

## Pattern 5: Slide-by-Slide Framework

### 5.1 Title Slide

```
Elements:
├── Company logo (top left or center)
├── Tagline (one-liner value prop)
├── Presenter name + title
├── Date
└── Confidentiality notice (optional)

Design:
├── Clean background (solid or subtle gradient)
├── Logo contrast: ensure visibility
└── Typography: large, bold tagline
```

### 5.2 Problem Slide

```
Template Structure:
├── Headline: "[Industry] challenge"
├── Body text: 3-4 bullet points
├── Supporting visual: Icon or simple illustration
├── Data point: Quantified pain
└── Quote (optional): Industry expert or customer

Hook Techniques:
├── Start with a question
├── Use a provocative statistic
├── Show a real customer quote
└── Create urgency with market data
```

### 5.3 Solution Slide

```
Template Structure:
├── Product visual (screenshot or mockup)
├── Value proposition (headline)
├── Key benefits (3-4 bullets)
├── How it works (1-2 sentences)
└── Differentiation statement

Best Practices:
├── Show, don't tell
├── Use simple, clear visuals
├── Focus on outcomes, not features
└── Connect to problem solution directly
```

---

## Key Patterns (Özet)

| Pattern | Odak | Uygulama |
|---------|------|----------|
| Slide Structure | Information architecture | 10-slide investor, 15-25 sales |
| Story Flow | Narrative arc | 3-act model (Hook-Journey-Call) |
| Data Viz | Visual clarity | Max 5 data points per chart |
| Metrics | Deck performance | <10MB, <800 words, <20 slides |
| Design | Visual hierarchy | 1 key message per slide |

---

## Anti-Patterns

### ❌ Yasaklı Yaklaşımlar

```yaml
Content errors:
  - Too much text (wall of text)
  - Missing key sections
  - Outdated data
  - Unclear value proposition
  
Design errors:
  - Inconsistent fonts/colors
  - Low-res images
  - Cluttered layouts
  - Too many animations
  
Story errors:
  - No clear narrative
  - Jumping between topics
  - Missing problem-solution link
  - Weak closing
```

### ✅ Doğru Yaklaşımlar

```yaml
Content:
  - One key message per slide
  - Data with clear insights
  - Customer evidence
  - Clear call-to-action

Design:
  - White space utilization
  - Consistent visual system
  - High-quality graphics
  - Readable typography (24pt+)

Story:
  - Clear problem-solution fit
  - Logical flow
  - Compelling close
  - Rehearsed delivery
```

---

## Quick Reference

| Slide | İçerik | Metrik |
|-------|--------|--------|
| Problem | Pain point + size | 30 words max |
| Solution | Product + value | 1 clear image |
| Market | TAM/SAM/SOM | Visual hierarchy |
| Model | Revenue + pricing | Unit economics |
| Team | Credentials + gaps | Relevant only |
| Ask | Amount + use | Specific numbers |

| Element | Standard | Rule |
|---------|----------|------|
| Slides | 10-25 | 1 takeaway each |
| Words/slide | 25-40 | Split if >50 |
| Images | 1-2 per slide | High quality |
| Colors | 3-5 palette | Consistent |
| Fonts | 2 max | Readable 24pt+ |

| Timing | Purpose | Duration |
|--------|---------|----------|
| Total pitch | Investor meeting | 10-15 min |
| Presentation | Actual speak | 7-10 min |
| Q&A | Discussion | 10-20 min |
| Per slide | Average | 30-45 sec |
