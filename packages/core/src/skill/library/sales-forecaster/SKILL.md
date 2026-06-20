---
name: sales-forecaster
description: "Satış tahmini. Pipeline analysis, weighted forecast, scenario planning ve trend adjustment."
triggers:
  keywords: ["sales forecast", "satış tahmini", "pipeline analysis", "revenue forecasting", "quota attainment"]
auto_load_when: "Kullanıcı satış tahmini, pipeline analizi, weighted forecast veya revenue planning talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Grep", "Glob"]
---

# Sales Forecaster (Satış Tahmin Uzmanı)

**Odak Alanı:** Satış pipeline analizi yapmak, weighted forecasting uygulamak, senaryo planlaması oluşturmak ve trendleri değerlendirmek.

---

## Pattern 1: Pipeline Analysis Framework

### 1.1 Pipeline Metrics

```
Pipeline Health Metrics:
├── Pipeline Coverage
│   ├── Formula: Pipeline Value / Quota
│   ├── Healthy range: 3-4x quota
│   ├── Warning signs: <3x coverage
│   └── Action: Ramp pipeline or adjust quota
│
├── Pipeline Velocity
│   ├── Time in stage analysis
│   ├── Average cycle time
│   ├── Stage conversion rates
│   └── Bottleneck identification
│
├── Pipeline Quality
│   ├── Qualified vs unqualified
│   ├── Weighted value vs nominal
│   ├── Recent vs stale deals
│   └── Champion presence
│
└── Deal Distribution
    ├── Deal size distribution
    ├── Stage distribution
    ├── Rep performance variance
    └── Seasonal patterns
```

### 1.2 Pipeline Analysis Tree

```
Pipeline Health Assessment:
├── Stage-by-Stage Analysis
│   ├── Stage 1: Lead to Qualification
│   │   ├── Conversion rate: target >40%
│   │   ├── Avg time: <7 days
│   │   └── Quality: Clear criteria met
│   │
│   ├── Stage 2: Qualification to Proposal
│   │   ├── Conversion rate: target >60%
│   │   ├── Avg time: <14 days
│   │   └── Quality: Budget confirmed
│   │
│   ├── Stage 3: Proposal to Negotiation
│   │   ├── Conversion rate: target >50%
│   │   ├── Avg time: <21 days
│   │   └── Quality: Proposal sent
│   │
│   └── Stage 4: Negotiation to Close
│       ├── Conversion rate: target >70%
│       ├── Avg time: <14 days
│       └── Quality: Verbal commitment
│
├── Risk Assessment
│   ├── Stale deals (>30 days no activity)
│   ├── Large deals without champion
│   ├── Deals stuck in same stage
│   └── Competitor involvement
│
└── Opportunity Scoring
    ├── Deal score calculation
    ├── Weighted pipeline value
    └── Forecast confidence
```

### 1.3 Pipeline Categorization

```
Deal Categorization:
├── Strong (90-100% close probability)
│   ├── Verbal commitment received
│   ├── Contract drafted
│   ├── Budget approved
│   └── No major obstacles
│
├── Likely (60-89% close probability)
│   ├── Clear need identified
│   ├── Decision maker engaged
│   ├── Budget allocated
│   └── Timeline confirmed
│
├── Possible (30-59% close probability)
│   ├── Interest demonstrated
│   ├── Multiple stakeholders
│   ├── Budget potential
│   └── Timeline potential
│
└── Weak (<30% close probability)
    ├── Early stage
    ├── No decision maker
    ├── No budget identified
    └── Timeline unclear
```

---

## Pattern 2: Weighted Forecast Model

### 2.1 Weighted Pipeline Calculation

```
Weighted Pipeline Formula:
Weighted Value = Σ (Deal Value × Probability)

Example Calculation:
├── Deal A: $50,000 × 90% = $45,000
├── Deal B: $30,000 × 60% = $18,000
├── Deal C: $80,000 × 40% = $32,000
├── Deal D: $25,000 × 20% = $5,000
├── Deal E: $100,000 × 10% = $10,000
│
└── Total Weighted: $110,000
```

### 2.2 Stage-Based Probability

```
Standard Probability by Stage:
├── Prospecting (New): 10%
├── Qualification: 20%
├── Needs Analysis: 30%
├── Proposal: 50%
├── Negotiation: 75%
├── Closed Won: 100%
└── Closed Lost: 0%

Custom Probability Adjustments:
├── High Confidence Deals (+10-20%)
│   ├── Champion in place
│   ├── Budget approved
│   └── Competitive win likely
│
├── Low Confidence Deals (-10-20%)
│   ├── No champion
│   ├── Budget uncertain
│   └── Competitor favorite
│
└── Stale Deals (reduce by stage)
    ├── 30+ days no activity: -10%
    ├── 60+ days no activity: -20%
    └── 90+ days no activity: -30%
```

### 2.3 Confidence Levels

```
Forecast Confidence Scoring:
├── High Confidence (Score 8-10)
│   ├── >80% weighted probability
│   ├── Decision maker engaged
│   ├── Timeline confirmed
│   └── Budget approved
│
├── Medium Confidence (Score 5-7)
│   ├── 50-80% weighted probability
│   ├── Multiple stakeholders engaged
│   ├── Budget likely
│   └── Timeline reasonable
│
└── Low Confidence (Score 1-4)
    ├── <50% weighted probability
    ├── Early in process
    ├── No budget confirmed
    └── Timeline unclear
```

---

## Pattern 3: Scenario Planning

### 3.1 Scenario Tree

```
Forecast Scenarios:
├── Best Case Scenario
│   ├── All "Strong" deals close
│   ├── 80% of "Likely" deals close
│   ├── 50% of "Possible" deals close
│   └── Weather: Strong pipeline, good economy
│
├── Expected Case Scenario
│   ├── All "Strong" deals close
│   ├── 60% of "Likely" deals close
│   ├── 30% of "Possible" deals close
│   └── Weather: Normal pipeline, stable economy
│
├── Conservative Case Scenario
│   ├── All "Strong" deals close
│   ├── 40% of "Likely" deals close
│   ├── 10% of "Possible" deals close
│   └── Weather: Pipeline challenges, uncertain economy
│
└── Worst Case Scenario
    ├── 80% of "Strong" deals close
    ├── 20% of "Likely" deals close
    └── No "Possible" deals close
```

### 3.2 Scenario Selection Framework

```
Choosing Scenario:
├── Based on Historical Accuracy
│   ├── Track actual vs forecast
│   ├── Calculate variance by scenario
│   ├── Adjust based on accuracy
│   └── Document patterns
│
├── Based on Current Pipeline
│   ├── Pipeline coverage ratio
│   ├── Weighted pipeline vs quota
│   ├── Deal quality assessment
│   └── Risk factors
│
├── Based on Market Conditions
│   ├── Economic outlook
│   ├── Industry trends
│   ├── Competitive landscape
│   └── Seasonal factors
│
└── Based on Rep Performance
    ├── Individual track record
    ├── Forecast accuracy by rep
    ├── Historical conversion rates
    └── Pipeline quality by rep
```

---

## Pattern 4: Trend Adjustment

### 4.1 Trend Analysis

```
Trend Indicators:
├── Year-over-Year (YoY)
│   ├── Compare to same period last year
│   ├── Adjust for seasonality
│   └── Calculate growth rate
│
├── Month-over-Month (MoM)
│   ├── Track month-to-month changes
│   ├── Identify patterns
│   └── Adjust for anomalies
│
├── Quarter-over-Quarter (QoQ)
│   ├── Quarterly performance
│   ├── Quarter-end patterns
│   └── Quarter projection
│
└── Rolling Average
    ├── 3-month rolling average
    ├── 6-month rolling average
    ├── 12-month rolling average
    └── Trend direction
```

### 4.2 Adjustment Factors

```
Seasonal Adjustments:
├── Q1 Adjustments
│   ├── January: Slow (post-holiday)
│   ├── February: Building
│   ├── March: Strong (quarter-end)
│
├── Q2 Adjustments
│   ├── April: Moderate
│   ├── May: Building
│   ├── June: Strong (quarter-end)
│
├── Q3 Adjustments
│   ├── July: Slow (summer)
│   ├── August: Building
│   ├── September: Strong (quarter-end)
│
└── Q4 Adjustments
    ├── October: Strong
    ├── November: Very strong
    └── December: Last push

Trend Adjustment Formula:
Adjusted Forecast = Base Forecast × (1 + Trend Factor) × (1 + Seasonality)
```

### 4.3 Anomaly Detection

```
Anomaly Types:
├── Positive Anomalies
│   ├── Unexpected large deals
│   ├── Unusual win rate spike
│   ├── Accelerated timeline
│   └── Competitor displacement
│
├── Negative Anomalies
│   ├── Unexpected losses
│   ├── Extended sales cycles
│   ├── Budget freezes
│   └── Competitor wins
│
└── Handling Anomalies
    ├── Identify root cause
    ├── Decide to include/exclude
    ├── Document in forecast
    └── Adjust confidence level
```

---

## Pattern 5: Forecast Reporting

### 5.1 Dashboard Metrics

```
Forecast Dashboard:
├── Pipeline Metrics
│   ├── Total pipeline value
│   ├── Weighted pipeline value
│   ├── Pipeline coverage
│   └── Pipeline velocity
│
├── Forecast Metrics
│   ├── Best case
│   ├── Expected case
│   ├── Conservative case
│   ├── Commit (guaranteed)
│   └── Best estimate
│
├── Performance Metrics
│   ├── Quota attainment
│   ├── Attainment vs forecast
│   ├── Win rate
│   └── Average deal size
│
└── Risk Metrics
    ├── At-risk deals
    ├── Stale deals
    ├── Deal slippage
    └── Conversion by stage
```

### 5.2 Forecasting Best Practices

```
Forecast Cadence:
├── Weekly
│   ├── Rep-level deal review
│   ├── Pipeline health check
│   └── Updated probabilities
│
├── Monthly
│   ├── Forecast review meeting
│   ├── Trend analysis
│   └── Adjustments
│
├── Quarterly
│   ├── Full forecast refresh
│   ├── Scenario planning
│   ├── Quota setting input
│   └── Executive review
│
└── Annual
    ├── Strategic planning
    ├── Market-based adjustments
    └── Multi-year projections
```

---

## Key Patterns (Özet)

| Pattern | Odak | Uygulama |
|---------|------|----------|
| Pipeline Analysis | Health metrics | Coverage, velocity, quality |
| Weighted Forecast | Probability | Deal scoring, stage weights |
| Senaryo Planlama | Best/expected/conservative | Multiple outcomes |
| Trend Adjustment | Time-based | YoY, MoQ, seasonality |
| Raporlama | Dashboard | Weekly + monthly + quarterly |

---

## Anti-Patterns

### ❌ Yasaklı Yaklaşımlar

```yaml
Forecast errors:
  - Pipeline-only forecasting
  - No confidence levels
  - Ignoring historical accuracy
  - No scenario planning
  
Process errors:
  - Infrequent updates
  - No rep accountability
  - Disconnected from reality
  - Not adjusting for anomalies
```

### ✅ Doğru Yaklaşımlar

```yaml
Best practices:
  - Weighted pipeline methodology
  - Multiple scenarios
  - Confidence levels
  - Regular updates
  
Validation:
  - Track actual vs forecast
  - Analyze variance
  - Adjust methodology
  - Document assumptions
```

---

## Quick Reference

| Stage | Probability | Weighted |
|-------|-------------|----------|
| Prospecting | 10% | Deal × 0.10 |
| Qualification | 20% | Deal × 0.20 |
| Proposal | 50% | Deal × 0.50 |
| Negotiation | 75% | Deal × 0.75 |
| Closed Won | 100% | Full value |

| Metric | Target | Warning |
|--------|--------|---------|
| Pipeline coverage | 3-4x quota | <3x |
| Win rate | >30% | <20% |
| Forecast accuracy | >85% | <70% |
| Avg sales cycle | Industry avg | >20% vs avg |

| Scenario | Use When | Adjustment |
|----------|----------|------------|
| Best case | Strong pipeline | +20-30% |
| Expected | Normal | Base |
| Conservative | Weak pipeline | -20-30% |
| Worst case | Crisis | -40%+ |

| Frequency | Task | Owner |
|-----------|------|-------|
| Weekly | Deal review | Rep/Manager |
| Monthly | Forecast review | Sales Lead |
| Quarterly | Full refresh | Sales Ops |
| Annual | Strategic | VP Sales |
