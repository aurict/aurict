---
name: lead-scorer
description: "Lead puanlama sistemi. Behavioral scoring, fit scoring, priority sıralama ve model tuning."
triggers:
  keywords: ["lead scoring", "lead puanlama", "BANT", "MQL", "SQL", "lead qualification", "prioritization"]
auto_load_when: "Kullanıcı lead qualification, MQL/SDR süreç optimizasyonu veya puanlama modeli talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Grep", "Glob"]
---

# Lead Scorer (Lead Puanlama Uzmanı)

**Odak Alanı:** Lead qualification için puanlama sistemleri tasarlamak, behavioral ve fit scoring modelleri oluşturmak ve priority sıralama algoritmaları geliştirmek.

---

## Pattern 1: Behavioral Scoring Modeli

### 1.1 Web Behavior Scoring

```
Scoring Framework (Weight-based)
├── Page Visit Scoring
│   ├── Homepage: +1
│   ├── Pricing page: +3
│   ├── Case studies: +2
│   ├── Demo request: +5
│   └── Blog content: +1
├── Content Engagement
│   ├── PDF download: +2
│   ├── Video watch (>50%): +3
│   ├── Webinar attendance: +4
│   └── Newsletter signup: +1
├── Email Engagement
│   ├── Email open: +1
│   ├── Link click: +2
│   ├── Reply: +5
│   └── Attachment open: +2
└── Form Submissions
    ├── Contact form: +5
    ├── Free trial: +8
    └── Quote request: +10
```

### 1.2 Engagement Scoring Matrix

```
Lead Scoring Categories:
├── Awareness (Score 0-15)
│   ├── First visit
│   ├── Blog read
│   └── Social media engagement
├── Consideration (Score 16-40)
│   ├── Multiple page visits
│   ├── Demo video watch
│   └── Pricing page view
├── Intent (Score 41-70)
│   ├── Multiple downloads
│   ├── Case study read
│   └── Free trial started
└── Decision (Score 71+)
    ├── Demo request
    ├── Pricing inquiry
    └── Sales contact
```

### 1.3 Behavioral Data Points

```
B2B SaaS Specific:
├── Product usage signals
│   ├── Login frequency
│   ├── Feature adoption depth
│   ├── Active users count
│   └── In-app behavior
├── Account signals
│   ├── Company size
│   ├── Industry vertical
│   ├── Job title relevance
│   └── Geographic location
└── Intent signals
    ├── Competitor comparison
    ├── Implementation timeline
    ├── Budget authority
    └── Decision maker status
```

---

## Pattern 2: Fit Scoring Modeli

### 2.1 Firmographic Fit Scoring

```
ICP Criteria Weights:
├── Company Size (Total Score: 20)
│   ├── Ideal: 50-500 employees → +20
│   ├── Acceptable: 20-50, 500-1000 → +10
│   └── Outside: <20, >5000 → +0
├── Industry (Total Score: 15)
│   ├── Target industry → +15
│   ├── Adjacent industry → +8
│   └── Non-target → +0
├── Revenue (Total Score: 15)
│   ├── $1M-50M → +15
│   ├── $50M-200M → +10
│   └── <$1M, >$200M → +0
├── Technology Stack (Total Score: 10)
│   ├── Current customer tech → +10
│   ├── Compatible tech → +5
│   └── No fit → +0
└── Geographic (Total Score: 5)
    ├── In-region → +5
    └── Out-of-region → +0
```

### 2.2 Psychographic Scoring

```
Buyer Persona Fit:
├── Role-based (Score 0-20)
│   ├── Champion: +10
│   ├── User: +5
│   ├── Influencer: +8
│   ├── Decision maker: +20
│   └── No role identified: +0
├── Budget authority (Score 0-15)
│   ├── Has budget: +15
│   ├── Can request budget: +8
│   └── No budget control: +0
├── Timeline (Score 0-10)
│   ├── 0-3 months: +10
│   ├── 3-6 months: +5
│   └── 6+ months: +2
└── Initiative fit (Score 0-10)
    ├── Active initiative: +10
    ├── Future initiative: +5
    └── No initiative: +0
```

### 2.3 Combined Score Formula

```
Total Lead Score = Behavioral Score × Weight + Fit Score × Weight

Standard Weights:
├── Behavioral Score: 40%
├── Fit Score: 40%
└── Engagement Score: 20%

Score Thresholds:
├── Hot Lead (80-100): Immediate follow-up
├── Warm Lead (60-79): Nurture campaign
├── Cool Lead (40-59): Content nurture
└── Cold Lead (0-39): Long-term nurture
```

---

## Pattern 3: Priority Sıralama Sistemi

### 3.1 Urgency-Weighted Priority

```
Priority Matrix:
├── High Priority (Score 90+)
│   ├── Decision maker + High budget + Active now
│   ├── Demo requested + Fit score high
│   └── Hot behavioral signals + Low sales cycle
├── Medium Priority (Score 70-89)
│   ├── Influencer + Medium budget
│   ├── Consideration stage + Good fit
│   └── Multiple touchpoints + Medium intent
├── Low Priority (Score 50-69)
│   ├── Early stage + Good fit
│   ├── Low engagement + High fit
│   └── New lead + No fit assessment yet
└── Nurture (Score <50)
    ├── No fit identified
    ├── Low engagement
    └── Early in buying journey
```

### 3.2 Lead Routing Logic

```
Routing Rules:
├── Score-based routing
│   ├── Score >90 → A-team (senior reps)
│   ├── Score 70-89 → B-team (standard reps)
│   ├── Score 50-69 → Inside sales
│   └── Score <50 → SDR outbound queue
├── Geography-based
│   ├── Region match → Local team
│   └── Out of region → HQ or partner
├── Industry specialization
│   ├── Vertical match → Vertical specialist
│   └── General → Generalist team
└── Account-based
    ├── Target account → Named account team
    └── Non-target → General bucket
```

---

## Pattern 4: Model Tuning ve Optimizasyon

### 4.1 Scoring Calibration

```
Calibration Process:
├── Data collection
│   ├── 6+ months historical data
│   ├── Won/lost deal outcomes
│   └── Lead source tracking
├── Baseline metrics
│   ├── Conversion rates by score
│   ├── Time-to-close by segment
│   └── Deal size by score range
├── Model validation
│   ├── A/B test scoring model
│   ├── Identify false positives
│   └── Identify false negatives
└── Continuous improvement
    ├── Monthly score review
    ├── Quarterly model update
    └── Annual framework overhaul
```

### 4.2 KPI Tracking

```
Scoring Model KPIs:
├── Prediction accuracy
│   ├── Precision: % of hot leads that convert
│   ├── Recall: % of actual converters identified
│   └── F1 score: Balance metric
├── Business impact
│   ├── Conversion rate improvement
│   ├── Sales cycle reduction
│   └── Revenue per lead
└── Operational metrics
    ├── Lead response time
    ├── Outreach efficiency
    └── Rep satisfaction
```

---

## Pattern 5: BANT ve MEDDIC Frameworks

### 5.1 BANT Qualification

```
Traditional BANT:
├── Budget
│   ├── Question: "What is your budget for this?"
│   ├── Score: Yes = 20, Maybe = 10, No = 0
├── Authority
│   ├── Question: "Who will make the final decision?"
│   ├── Score: Decision maker = 20, Influencer = 10, User = 5
├── Need
│   ├── Question: "What problem are you solving?"
│   ├── Score: Clear need = 20, Vague = 10, None = 0
└── Timeline
    ├── Question: "When do you want to implement?"
    ├── Score: <3 months = 20, 3-6 months = 10, >6 months = 5

BANT Scoring Total: /80 points
```

### 5.2 MEDDIC Qualification

```
Advanced Framework:
├── Metrics
│   ├── "What metrics will determine success?"
│   └── Quantified success criteria
├── Economic Buyer
│   ├── "Who controls the budget?"
│   └── Decision maker identification
├── Decision Criteria
│   ├── "What are your evaluation criteria?"
│   └── Technical + business requirements
├── Decision Process
│   ├── "How will you make this decision?"
│   └── Timeline + stakeholders
├──Identify Pain
│   ├── "What is the cost of the problem?"
│   └── Urgency quantification
├── Champion
│   ├── "Who is advocating for this?"
│   └── Internal sponsor strength
└── Score: Each category = 10 points → /60 total
```

---

## Key Patterns (Özet)

| Pattern | Odak | Uygulama |
|---------|------|----------|
| Behavioral Scoring | Digital signals | Page visits, email, content |
| Fit Scoring | ICP alignment | Firmographic + psychographic |
| Priority Sorting | Urgency + fit | Matrix-based routing |
| Model Tuning | Accuracy | Monthly calibration |
| Frameworks | Qualification | BANT, MEDDIC, GPCT |

---

## Anti-Patterns

### ❌ Yasaklı Yaklaşımlar

```yaml
Scoring errors:
  - Fixed weights (never adjust)
  - No lead source tracking
  - Ignoring intent signals
  - No model validation
  
Operational errors:
  - Manual scoring (not automated)
  - No response SLA
  - Rep bypass scoring
  - Stale data (>30 days)
```

### ✅ Doğru Yaklaşımlar

```yaml
Best practices:
  - Weighted scoring model
  - Automated data collection
  - Regular model calibration
  - Clear score thresholds
  
Validation:
  - A/B testing
  - Conversion tracking
  - Feedback loop with sales
  - Quarterly review
```

---

## Quick Reference

| Score Range | Segment | Action | SLA |
|-------------|---------|--------|-----|
| 90-100 | Hot | Immediate call | <15 min |
| 70-89 | Warm | Personal outreach | <1 hour |
| 50-69 | Cool | Email nurture | <24 hour |
| 0-49 | Cold | Automated nurture | >24 hour |

| Weight Category | Default | Adjust for |
|-----------------|---------|------------|
| Behavioral | 40% | Long sales cycle |
| Fit | 40% | Product-led growth |
| Engagement | 20% | High-volume inbound |

| Framework | Best for | Questions |
|-----------|----------|-----------|
| BANT | SMB | 4 |
| MEDDIC | Enterprise | 6 |
| GPCT | SaaS | 6 |

| Metric | Target | Warning |
|--------|--------|----------|
| Precision | >70% | <50% |
| Recall | >80% | <60% |
| Lead-to-Opportunity | >25% | <15% |
