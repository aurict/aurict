---
name: customer-profile-builder
description: "ICP oluşturma. Firmographic data, psychographic analysis ve persona cards."
triggers:
  keywords: ["ICP", "ideal customer profile", "persona", "buyer persona", "customer segmentation", "firmographic"]
auto_load_when: "Kullanıcı ideal müşteri profili, ICP, persona kartları veya müşteri segmentasyonu talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Grep", "Glob"]
---

# Customer Profile Builder (Müşteri Profil Uzmanı)

**Odak Alanı:** Ideal Customer Profile (ICP) oluşturmak, firmographic ve psychographic analiz yapmak ve detaylı persona kartları hazırlamak.

---

## Pattern 1: Firmographic Data Analysis

### 1.1 Temel Firmographic Özellikler

```
Core Firmographic Dimensions:
├── Company Size
│   ├── Employee count
│   ├── Revenue range
│   ├── Number of locations
│   └── Growth rate
│
├── Industry
│   ├── Primary industry (NAICS/SIC)
│   ├── Sub-industry
│   ├── Market segment
│   └── Industry trends
│
├── Geography
│   ├── Headquarters location
│   ├── Operating regions
│   ├── Language preference
│   └── Time zone
│
├── Technology
│   ├── Current tech stack
│   ├── IT budget size
│   ├── Tech maturity level
│   └── Digital transformation stage
│
└── Business Model
    ├── B2B, B2C, B2B2C
    ├── Revenue model
    ├── Customer type
    └── Sales model
```

### 1.2 Firmographic Scoring Matrix

```
ICP Fit Scoring:
├── Company Size Score (/25)
│   ├── Ideal: 50-500 employees → 25
│   ├── Acceptable: 20-50, 500-1000 → 15
│   └── Outside: <20, >5000 → 5
│
├── Industry Score (/20)
│   ├── Target industry: 20
│   ├── Adjacent: 10
│   └── Non-target: 0
│
├── Revenue Score (/20)
│   ├── $1M-50M: 20
│   ├── $50M-200M: 15
│   └── Other: 5
│
├── Technology Fit (/20)
│   ├── Compatible: 20
│   ├── Partial: 10
│   └── Incompatible: 0
│
└── Geography Score (/15)
    ├── Same region: 15
    └── Other: 5
```

### 1.3 Data Sources

```
Firmographic Data Collection:
├── First-party data
│   ├── CRM data analysis
│   ├── Customer interviews
│   └── Sales team insights
│
├── Third-party data
│   ├── ZoomInfo
│   ├── LinkedIn Sales Navigator
│   ├── Clearbit
│   └── D&B
│
└── Research sources
    ├── Industry reports
    ├── Company websites
    └── News/press releases
```

---

## Pattern 2: Psychographic Analysis

### 2.1 Psychographic Dimensions

```
Psychographic Categories:
├── Goals & Motivations
│   ├── Primary business goals
│   ├── Personal career goals
│   ├── Key priorities
│   └── Success metrics
│
├── Challenges & Pain Points
│   ├── Industry challenges
│   ├── Role-specific challenges
│   ├── Daily frustrations
│   └── Strategic problems
│
├── Values & Beliefs
│   ├── Business philosophy
│   ├── Risk tolerance
│   ├── Innovation orientation
│   └── Quality expectations
│
├── Decision Making Style
│   ├── Risk appetite
│   ├── Timeline preference
│   ├── Information needs
│   └── Approval process
│
└── Communication Preferences
    ├── Preferred channels
    ├── Content formats
    └── Engagement style
```

### 2.2 Psychographic Research Methods

```
Research Techniques:
├── Qualitative
│   ├── Customer interviews (1:1)
│   ├── Sales team debriefs
│   ├── Support ticket analysis
│   └── Social listening
│
├── Quantitative
│   ├── Survey data
│   ├── Behavioral data
│   ├── NPS/CSAT analysis
│   └── Website analytics
│
└── Observational
    ├── Sales call recordings
    ├── Demo observations
    ├── On-site visits
    └── Community forums
```

---

## Pattern 3: ICP Framework Yapısı

### 3.1 ICP Document Template

```
ICP Document Structure:
├── Section 1: Overview
│   ├── ICP name
│   ├── Version
│   ├── Target market
│   └── Quick summary
│
├── Section 2: Firmographic Profile
│   ├── Company size
│   ├── Industry
│   ├── Revenue
│   ├── Geography
│   ├── Technology
│   └── Business model
│
├── Section 3: Psychographic Profile
│   ├── Goals and motivations
│   ├── Challenges and pain points
│   ├── Values and beliefs
│   └── Decision making
│
├── Section 4: Buying Behavior
│   ├── Purchase process
│   ├── Decision makers
│   ├── Timeline
│   ├── Budget
│   └── Evaluation criteria
│
├── Section 5: Engagement Model
│   ├── Preferred channels
│   ├── Content preferences
│   ├── Key messages
│   └── Sales approach
│
└── Section 6: Red Flags
    ├── Warning signs
    ├── Bad fit indicators
    └── Disqualification criteria
```

### 3.2 ICP Statement Template

```
ICP Statement Format:
"Our ideal customer is a [company type] in the [industry] industry,
with [company size] employees and $[revenue] in annual revenue,
located in [geography]. They are currently facing [key problem]
and their primary goal is to [goal]. They make purchasing decisions
based on [criteria] and have a [timeline] sales cycle. They value
[values] and prefer [communication style]."

Example:
"Our ideal customer is a mid-market B2B SaaS company in the
technology industry, with 50-200 employees and $5-50M in annual
revenue, headquartered in North America. They are currently
facing challenges with sales scaling and team management,
and their primary goal is to increase revenue by 30% in the
next 12 months. They make purchasing decisions based on ROI
and implementation speed, and have a 60-90 day sales cycle.
They value efficiency and data-driven decision-making."
```

---

## Pattern 4: Persona Cards

### 4.1 Persona Card Template

```
Persona Card Structure:
├── Basic Information
│   ├── Name
│   ├── Role
│   ├── Company type
│   └── Industry
│
├── Demographics
│   ├── Age range
│   ├── Experience level
│   ├── Education
│   └── Location
│
├── Goals & Motivations
│   ├── Primary goal 1
│   ├── Primary goal 2
│   ├── Primary goal 3
│   └── Success metrics
│
├── Challenges & Pain Points
│   ├── Primary challenge 1
│   ├── Primary challenge 2
│   ├── Primary challenge 3
│   └── Frustration factors
│
├── Decision Making
│   ├── Decision authority
│   ├── Key stakeholders
│   ├── Information sources
│   └── Evaluation criteria
│
├── Communication Style
│   ├── Preferred channel
│   ├── Content preferences
│   ├── Response patterns
│   └── Language/tone
│
├── Objections & Concerns
│   ├── Common objections
│   ├── Primary concerns
│   └── Risk factors
│
└── How to Reach Them
    ├── Key touchpoints
    ├── Value proposition
    └── Engagement strategy
```

### 4.2 Persona Examples

```
Example: "Decision Maker" Persona
├── Name: "Strategic Sarah"
├── Role: VP of Sales / CRO
├── Company: Mid-market B2B SaaS
├── Size: 50-200 employees
├── Revenue: $10-50M ARR
│
├── Goals
│   ├── Scale revenue 30% YoY
│   ├── Improve sales efficiency
│   ├── Build repeatable process
│   └── Reduce churn
│
├── Challenges
│   ├── Hitting quarterly targets
│   ├── Hiring top talent
│   ├── Tool consolidation
│   └── Sales-marketing alignment
│
├── Pain Points
│   ├── "Spreadsheet fatigue"
│   ├── "No visibility into pipeline"
│   ├── "Reps wasting time on admin"
│   └── "Forecast is always wrong"
│
├── Decision Style
│   ├── ROI-driven
│   ├── Competitive (likes wins)
│   ├── Hands-on but delegator
│   └── Wants peer validation
│
├── How to Reach
│   ├── LinkedIn outreach
│   ├── Peer referrals
│   ├── Industry conferences
│   └── Thought leadership content
│
└── Objections
    ├── "Too expensive"
    ├── "Need to prove ROI"
    └── "My team won't use it"
```

---

## Pattern 5: ICP Validation ve Iterate

### 5.1 ICP Validation Methods

```
Validation Framework:
├── Data-Driven Validation
│   ├── Analyze existing customers
│   ├── Calculate customer lifetime value
│   ├── Identify best-fit segment
│   └── Compare to target ICP
│
├── Sales Feedback Loop
│   ├── Interview sales team
│   ├── Review win/loss analysis
│   ├── Get rep input on ideal profile
│   └── Identify pattern in deals
│
├── Customer Feedback
│   ├── Survey happy customers
│   ├── Interview at-risk customers
│   ├── Analyze churn reasons
│   └── Gather NPS feedback
│
└── Market Validation
    ├── Test in market
    ├── Measure response rates
    ├── Track conversion by segment
    └── Adjust based on results
```

### 5.2 ICP Iteration Process

```
Iteration Framework:
├── Quarterly Review
│   ├── Update firmographic data
│   ├── Add new psychographic insights
│   ├── Refine based on learnings
│   └── Document changes
│
├── Continuous Improvement
│   ├── Track ICP performance
│   ├── Monitor conversion rates
│   ├── Update based on market shifts
│   └── Document best practices
│
└── Version Control
    ├── Version number ICP documents
    ├── Track significant changes
    ├── Maintain history
    └── Update stakeholders
```

---

## Key Patterns (Özet)

| Pattern | Odak | Uygulama |
|---------|------|----------|
| Firmographic | Şirket verileri | Size, industry, revenue, tech |
| Psychographic | Müşteri zihni | Goals, challenges, values |
| ICP Statement | Özet | Format template |
| Persona Cards | Detay | Card structure with examples |
| Validation | Doğrulama | Data + feedback loops |

---

## Anti-Patterns

### ❌ Yasaklı Yaklaşımlar

```yaml
Creation errors:
  - Too broad ICP (everyone is a target)
  - Too narrow (not enough market)
  - No data backing assumptions
  - Outdated information

Content errors:
  - Vague descriptions
  - No quantified criteria
  - Missing validation
  - No stakeholder input
```

### ✅ Doğru Yaklaşımlar

```yaml
Best practices:
  - Data-backed criteria
  - Regular updates (quarterly)
  - Multiple data sources
  - Sales + marketing alignment
  
Validation:
  - Customer data analysis
  - Sales team input
  - Market testing
  - Continuous iteration
```

---

## Quick Reference

| Category | Data Points | Sources |
|----------|-------------|---------|
| Firmographic | Size, revenue, industry, tech | CRM, data providers |
| Psychographic | Goals, challenges, values | Interviews, surveys |
| Behavioral | Activities, engagement | Analytics, CRM |
| Needs | Problems, priorities | Customer research |

| ICP Element | Description | Example |
|-------------|------------|---------|
| Company Size | Employee count | 50-500 |
| Industry | NAICS code | Software/SaaS |
| Revenue | Annual revenue | $5-50M |
| Geography | Operating region | North America |
| Technology | Tech stack | Salesforce, HubSpot |

| Persona | Role | Priority |
|---------|------|----------|
| Decision Maker | C-Level, VP | Primary target |
| Influencer | Director, Manager | Secondary target |
| User | IC, Specialist | Nurture |

| Validation | Frequency | Method |
|------------|-----------|--------|
| Full review | Quarterly | Data + feedback |
| Quick update | Monthly | Sales input |
| Major revision | Annual | Complete refresh |
