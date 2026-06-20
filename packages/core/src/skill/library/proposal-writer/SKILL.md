---
name: proposal-writer
description: "B2B teklif yazımı. Solution design, pricing table, terms ve case studies."
triggers:
  keywords: ["proposal", "teklif", "B2B proposal", "sales proposal", "quote", "RFP response"]
auto_load_when: "Kullanıcı B2B teklifi, satış teklifi, fiyat teklifi veya RFP yanıtı talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Grep", "Glob"]
---

# Proposal Writer (Teklif Uzmanı)

**Odak Alanı:** B2B satış teklifleri oluşturmak, çözüm tasarımı yapmak, fiyat tabloları hazırlamak ve iş koşulları belirlemek.

---

## Pattern 1: Proposal Yapısı ve Mimarisi

### 1.1 B2B Proposal Bölümleri

```
Standard Proposal Structure:
├── Cover Letter (1 page)
│   ├── Executive summary
│   ├── Key value proposition
│   ├── Why choose us
│   └── Call to action
│
├── Executive Summary (1-2 pages)
│   ├── Problem statement
│   ├── Proposed solution
│   ├── Key benefits
│   ├── Investment overview
│   └── Timeline
│
├── Problem Definition (1-2 pages)
│   ├── Current challenges
│   ├── Root cause analysis
│   ├── Impact quantification
│   └── Opportunity cost
│
├── Solution Design (3-5 pages)
│   ├── Approach methodology
│   ├── Scope of work
│   ├── Deliverables
│   ├── Implementation plan
│   └── Timeline/milestones
│
├── Pricing (1-3 pages)
│   ├── Investment summary
│   ├── Pricing tables
│   ├── Payment terms
│   ├── ROI calculation
│   └── Optional add-ons
│
├── Social Proof (1-2 pages)
│   ├── Case studies
│   ├── Customer testimonials
│   ├── Industry recognition
│   └── Company credentials
│
├── Terms & Conditions (1-2 pages)
│   ├── Service terms
│   ├── Payment schedule
│   ├── Warranties
│   └── Legal clauses
│
└── Appendix (As needed)
    ├── Technical specifications
    ├── Team bios
    ├── Additional data
    └── References
```

### 1.2 Proposal Türüne Göre Yapı

```
RFP Response (Detaylı):
├── Mandatory requirements compliance
├── Detailed technical response
├── Detailed pricing breakdown
├── Implementation timeline
├── Team qualifications
├── Past project references
└── Compliance certificates

Quick Proposal (Standart):
├── Problem-Solution summary
├── Key benefits
├── Basic pricing
├── Next steps
└── Timeline

Enterprise Proposal (Kapsamlı):
├── Multi-year pricing
├── Governance framework
├── Risk management
├── SLA definitions
├── Custom terms
└── Executive presentations
```

---

## Pattern 2: Solution Design (Çözüm Tasarımı)

### 2.1 Discovery'den Çözüme Mapping

```
Requirements Mapping:
├── Problem → Solution
│   ├── Challenge 1: "Slow process"
│   │   └── Solution: "Automation module"
│   ├── Challenge 2: "Data silos"
│   │   └── Solution: "Integration layer"
│   └── Challenge 3: "High costs"
│       └── Solution: "Optimization engine"
│
├── Goals → Outcomes
│   ├── Goal: "Increase revenue 20%"
│   │   └── Outcome: "Conversion optimization"
│   ├── Goal: "Reduce costs 15%"
│   │   └── Outcome: "Process automation"
│   └── Goal: "Improve NPS"
│       └── Outcome: "Customer portal"
│
└── Constraints → Trade-offs
    ├── Budget limit: Phased implementation
    ├── Timeline: Phased rollout
    └── Technical: API-first approach
```

### 2.2 Scope Definition Framework

```
In Scope:
├── Core features
│   ├── Feature 1: [Description]
│   ├── Feature 2: [Description]
│   └── Feature 3: [Description]
│
├── Deliverables
│   ├── Deliverable 1: [Description]
│   ├── Deliverable 2: [Description]
│   └── Deliverable 3: [Description]
│
└── Success criteria
    ├── Metric 1: [Target]
    ├── Metric 2: [Target]
    └── Metric 3: [Target]

Out of Scope (Explicit):
├── Excluded feature 1
├── Excluded feature 2
└── Additional services
```

### 2.3 Implementation Plan

```
Phase-Based Timeline:
├── Phase 1: Discovery (Weeks 1-2)
│   ├── Kickoff meeting
│   ├── Requirements finalization
│   ├── Technical assessment
│   └── Project plan approval
│
├── Phase 2: Design (Weeks 3-4)
│   ├── Solution architecture
│   ├── User experience design
│   ├── Integration design
│   └── Design approval
│
├── Phase 3: Build (Weeks 5-10)
│   ├── Development sprints
│   ├── Testing cycles
│   ├── Integration work
│   └── Internal review
│
├── Phase 4: Deploy (Weeks 11-12)
│   ├── UAT testing
│   ├── Training
│   ├── Go-live
│   └── Support kickoff
│
└── Phase 5: Optimize (Ongoing)
    ├── Performance monitoring
    ├── User feedback
    └── Iter improvements
```

---

## Pattern 3: Pricing Tables

### 3.1 Pricing Model Türleri

```
Pricing Models:
├── Per User/Month (SaaS)
│   ├── Basic: $X/user/month
│   ├── Pro: $Y/user/month
│   └── Enterprise: Custom
│
├── Flat Fee (Services)
│   ├── Project pricing
│   ├── Retainer pricing
│   └── Milestone-based
│
├── Usage-Based
│   ├── API calls
│   ├── Storage
│   └── Transactions
│
├── Tiered Pricing
│   ├── Tier 1: $X for Y users
│   ├── Tier 2: $Z for up to W users
│   └── Enterprise: Volume discounts
│
└── Hybrid
    ├── Base fee + usage
    ├── Annual + add-ons
    └── License + maintenance
```

### 3.2 Pricing Table Template

```
Proposed Investment:

┌─────────────────────────────────────────────────────────────────┐
│                        PRICING TIERS                           │
├─────────────────┬──────────────┬──────────────┬───────────────┤
│                 │    Basic     │     Pro      │   Enterprise  │
├─────────────────┼──────────────┼──────────────┼───────────────┤
│ Price           │  $X/mo       │  $Y/mo       │  Custom       │
│ Users           │  Up to 10    │  Up to 50    │  Unlimited    │
│ Features        │              │              │               │
│   - Feature A   │     ✓        │      ✓      │      ✓        │
│   - Feature B   │     ✗        │      ✓      │      ✓        │
│   - Feature C   │     ✗        │      ✗      │      ✓        │
│ Support         │  Email       │  Priority    │  Dedicated    │
│ SLA             │  24hr        │   4hr        │   1hr         │
└─────────────────┴──────────────┴──────────────┴───────────────┘

Investment Summary:
├── Year 1: $X
├── Year 2: $X (+3%)
├── Year 3: $X (+3%)
└── 3-Year Total: $XYZ

Optional Add-ons:
├── Additional Training: $X
├── Premium Support: $Y
├── Custom Development: $Z
└── Implementation: $W (waived for annual contract)
```

### 3.3 ROI Calculation

```
ROI Framework:
├── Current State (Baseline)
│   ├── Current cost: $X/month
│   ├── Current inefficiency cost: $Y/month
│   └── Total: $Z/month
│
├── Future State (With Solution)
│   ├── Solution cost: $A/month
│   ├── Projected savings: $B/month
│   └── New revenue opportunity: $C/month
│
└── ROI Calculation
    ├── Monthly benefit: $B + $C = $D
    ├── Monthly cost: $A
    ├── Net monthly: $D - $A = $E
    ├── Annual net: $E × 12 = $F
    ├── Investment: $X (Year 1)
    └── ROI: ($F / $X) × 100 = Y%
```

---

## Pattern 4: Case Studies ve Social Proof

### 4.1 Case Study Yapısı

```
Case Study Template:
├── Client Overview (anon or named)
│   ├── Industry
│   ├── Company size
│   └── Challenge area
│
├── The Challenge
│   ├── Specific problem
│   ├── Impact on business
│   └── Why it needed solving
│
├── The Solution
│   ├── Approach
│   ├── Implementation
│   └── Key features used
│
├── Results
│   ├── Before metrics
│   ├── After metrics
│   ├── Improvement %
│   └── Key outcomes
│
└── Testimonial
    ├── Quote
    ├── Name & Title
    └── Company
```

### 4.2 Relevant Case Study Selection

```
Selection Criteria:
├── Industry match
│   ├── Same vertical → Strong
│   ├── Adjacent vertical → Medium
│   └── Different → Use general
│
├── Company size match
│   ├── Similar size → Strong
│   ├── Larger → Good (aspiration)
│   └── Smaller → Less relevant
│
├── Challenge match
│   ├── Same problem → Strongest
│   ├── Similar problem → Good
│   └── Different → Good for diversity
│
└── Outcome match
    ├── Quantified results → Strongest
    ├── Qualitative → Good
    └── Just started → Weak
```

---

## Pattern 5: Terms & Conditions

### 5.1 Standard Terms

```
Commercial Terms:
├── Payment Terms
│   ├── Net 30 (standard)
│   ├── 50% upfront, 50% completion
│   ├── Monthly installments
│   └── Annual prepayment discount
│
├── Pricing Validity
│   ├── 30 days (standard)
│   ├── 60 days (for large deals)
│   └── Subject to change after
│
├── Contract Duration
│   ├── Annual (minimum)
│   ├── Multi-year options
│   └── Month-to-month (premium pricing)
│
└── Termination
    ├── 30 days notice
    ├── Early termination fee
    └── Data export on exit
```

### 5.2 SLA Terms

```
Service Level Agreement:
├── Availability
│   ├── Standard: 99.5%
│   ├── Premium: 99.9%
│   └── Enterprise: 99.99%
│
├── Support Response
│   ├── Email: 24 business hours
│   ├── Phone: 4 business hours
│   └── Critical: 1 hour
│
├── Credits
│   ├── <99.5%: 10% credit
│   ├── <99%: 25% credit
│   └── <95%: 50% credit
│
└── Exclusions
    ├── Planned maintenance
    ├── Force majeure
    └── Customer-caused issues
```

---

## Key Patterns (Özet)

| Pattern | Odak | Uygulama |
|---------|------|----------|
| Yapı | Proposal mimarisi | Bölümler + içerik |
| Çözüm | Solution design | Scope + timeline |
| Fiyat | Pricing tables | Model + ROI |
| Proof | Case studies | Relevant selection |
| Terms | T&C | Standard clauses |

---

## Anti-Patterns

### ❌ Yasaklı Yaklaşımlar

```yaml
Content errors:
  - Generic templates (no customization)
  - Missing executive summary
  - Vague value proposition
  - No quantified benefits
  
Pricing errors:
  - Hidden fees
  - Unclear terms
  - No ROI justification
  - Outdated pricing
  
Design errors:
  - Inconsistent formatting
  - Broken links
  - No clear CTA
  - Too long
```

### ✅ Doğru Yaklaşımlar

```yaml
Best practices:
  - Customize to prospect
  - Clear value proposition
  - Quantified outcomes
  - Professional design
  
Content:
  - Problem-solution fit
  - Relevant case studies
  - Transparent pricing
  - Clear next steps
```

---

## Quick Reference

| Section | Length | Focus |
|---------|--------|-------|
| Cover Letter | 1 page | Executive hook |
| Executive Summary | 1-2 pages | Value proposition |
| Problem | 1-2 pages | Pain points |
| Solution | 3-5 pages | Approach + deliverables |
| Pricing | 1-3 pages | Investment + ROI |
| Proof | 1-2 pages | Case studies |
| Terms | 1-2 pages | Standard conditions |
| Total | 10-20 pages | Comprehensive |

| Pricing Type | Use Case | Best For |
|--------------|----------|----------|
| Per user | SaaS | Scalable growth |
| Flat fee | Services | Predictable |
| Usage | API/Platform | Variable needs |
| Tiered | Most | Flexibility |
| Hybrid | Enterprise | Custom |

| Element | Standard | Best Practice |
|---------|----------|---------------|
| Valid period | 30 days | 45-60 days |
| Payment | Net 30 | 50/50 or annual |
| Support | Business hours | 24/7 for enterprise |
