---
name: workflow-optimizer
description: "İş akışı optimizasyonu: Otomasyon fırsatları, RPA uygunluğu, KPI iyileştirme ve süreç verimliliği."
triggers:
  keywords: ["workflow optimization", "process automation", "RPA", "efficiency", "otomasyon", "verimlilik"]
  contexts: ["workflow improvement", "automation opportunity", "efficiency gains", "process digitization"]
auto_load_when: "Kullanıcı iş akışı optimizasyonu, otomasyon fırsatları veya RPA uygunluk analizi istediğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "Grep", "Glob"]
---

# Workflow Optimizer — İş Akışı Optimizasyon Uzmanı

**Odak Alanı:** İş akışlarını analiz etme, otomasyon fırsatlarını belirleme, RPA uygunluğunu değerlendirme ve KPI iyileştirmesi.

---

## Pattern Bölümleri

### 1. Workflow Analysis Framework

```
Workflow Analysis Steps
├── Step 1: Process Mapping
│   ├── Current state documentation
│   ├── Swimlane diagrams
│   ├── Touch points identification
│   └── System interactions
├── Step 2: Time Analysis
│   ├── Activity timing
│   ├── Wait times
│   ├── Bottlenecks
│   └── Total cycle time
├── Step 3: Cost Analysis
│   ├── Labor cost per activity
│   ├── System costs
│   ├── Error/rework costs
│   └── Total process cost
├── Step 4: Value Analysis
│   ├── Value-added activities
│   ├── Non-value-added activities
│   └── Waste identification (Muda)
├── Step 5: Improvement Opportunities
│   ├── Automation potential
│   ├── Simplification
│   ├── Integration
│   └── Elimination
└── Step 6: Implementation
    ├── Prioritization
    ├── Pilot
    ├── Rollout
    └── Monitoring
```

### 2. Automation Opportunity Matrix

```
Automation Assessment Matrix
├── Rule-Based (Yüksek uygunluk)
│   ├── If-then-else logic
│   ├── Structured data input
│   ├── Repetitive tasks
│   ├── No judgment required
│   └── Example: Data entry, approval routing
├── Process-Based (Orta-yüksek)
│   ├── Multi-step workflows
│   ├── System integration
│   ├── Decision points
│   ├── Exception handling
│   └── Example: Onboarding, invoicing
├── AI-Enhanced (Gelişmiş)
│   ├── Unstructured data
│   ├── Pattern recognition
│   ├── Prediction/classification
│   └── Human-in-the-loop
│   └── Example: Document classification, chatbots
└── Not Suitable for Automation
    ├── Complex judgment
    ├── Creative work
    ├── Strategic decisions
    └── Relationship building
```

### 3. RPA (Robotic Process Automation) Uygunluk

```
RPA Suitability Criteria
├── HIGH Suitability (>80%)
│   ├── High volume (>100/month)
│   ├── Rule-based decisions
│   ├── Digital inputs
│   ├── Standardized format
│   └── 24/7 operation potential
│   └── Examples: Data entry, report generation
├── MEDIUM Suitability (50-80%)
│   ├── Medium volume (20-100/month)
│   ├── Some exceptions
│   ├── Minor human judgment
│   └── Multiple systems
│   └── Examples: Exception handling, verification
├── LOW Suitability (<50%)
│   ├── Low volume (<20/month)
│   ├── Complex decisions
│   ├── Unstructured data
│   └── High variability
│   └── Examples: Strategic planning, negotiations
└── NOT Suitable
    ├── Physical tasks
    ├── Complex problem solving
    ├── Emotional intelligence required
    └── Novel situations
```

### 4. Waste Categories (Lean)

```
7 Wastes (Muda)
├── 1. Waiting (Bekleme)
│   ├── Idle time between steps
│   ├── Waiting for approvals
│   └── System response delays
├── 2. Motion (Hareket)
│   ├── Unnecessary movement
│   ├── Multiple system logins
│   └── Duplicate data entry
├── 3. Defects (Hatalar)
│   ├── Rework
│   ├── Returns
│   ├── Incorrect data
│   └── Quality issues
├── 4. Overprocessing (Aşırı işleme)
│   ├── Unnecessary steps
│   ├── Over-detailed work
│   └── Extra reports nobody reads
├── 5. Overproduction (Aşırı üretim)
│   ├── Early processing
│   ├── Extra copies
│   └── Unnecessary notifications
├── 6. Inventory (Stok)
│   ├── Excess documents
│   ├── Unused materials
│   └── Backlog beyond need
└── 7. Transport (Taşıma)
    ├── Unnecessary transfers
    └── Multiple handoffs
```

### 5. KPI Framework for Optimization

```
Workflow Performance Metrics
├── Efficiency Metrics
│   ├── Cycle time: Top to bottom
│   ├── Processing time: Active work
│   ├── Wait time: Idle time
│   ├── Throughput: Units/time
│   └── Utilization: Capacity usage
├── Quality Metrics
│   ├── Error rate: Mistakes/total
│   ├── Rework rate: Redone work
│   ├── Customer complaints: Issues reported
│   ├── First-time pass: No rework needed
│   └── Accuracy: Correct/total
├── Cost Metrics
│   ├── Cost per transaction
│   ├── Labor cost: Time × rate
│   ├── System cost: Per transaction
│   ├── Error cost: Rework + fixing
│   └── Total cost of ownership
├── Customer Metrics
│   ├── Delivery time promised vs actual
│   ├── Response time
│   ├── Customer satisfaction (CSAT)
│   ├── Net Promoter Score (NPS)
│   └── Resolution time (FCR)
└── Improvement Metrics
    ├── Time saved: Before vs after
    ├── Cost saved: Annual impact
    ├── Error reduction: % decrease
    ├── FTE impact: People redeployed
    └── ROI: Return on investment
```

---

## Key Patterns

| Pattern | Açıklama | Uygulama |
|---------|----------|----------|
| **Value Stream Mapping** | End-to-end süreç haritası | Waste tespiti |
| **5 Whys Analysis** | Kök neden bulma | Problem solving |
| **Pareto Analysis** | %80 etki %20 neden | Prioritization |
| **Quick Wins** | Düşük çabayla yüksek etki | Momentum building |
| **Pilot First** | Küçük ölçekte test | Risk reduction |
| **Measure Before/After** | Önce-sonra karşılaştırma | ROI kanıtlama |
| **Continuous Monitoring** | Sürekli takip | Sustainability |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```markdown
# AUTOMATE BAD PROCESS
Mevcut kötü süreci otomasyona aldık
- Problem: Hızlı ama hâlâ kötü
- Hata daha hızlı çoğalır
- Kalıcı haline gelir

✅ Önce process'i düzelt, sonra otomasyon
```

```markdown
# OVER-AUTOMATION
"Her şeyi otomatik yapalım"
- Unnecessary complexity
- Maintenance maliyeti artar
- Flexibility azalır
- ROI negative

✅ Value-to-effort ratio hesapla
```

```markdown
# IGNORE EXCEPTIONS
Sadece "happy path" otomasyon
- %80'i çalışır, %20'i fails
- Exception'lar manual kalır
- Tam entegrasyon yok

✅ Exception handling planla
```

```markdown
# NO MEASUREMENT
"Nasılsa iyileşir" mantığı
- Improvement tracked edilmiyor
- ROI belli değil
- Başarı kanıtlanamaz
- Support azalır

✅ Baseline ölç, sonra optimize et
```

```markdown
# TOOL-LED SOLUTION
"Bunu alalım, nerede kullanacağız?"
- Problem analiz edilmedi
- Her problem çivi gibi
- Yüksek maliyet, düşük değer

✅ Problem-first approach
```

```markdown
# FORGET THE HUMANS
Sadece process'e odaklanıldı
- Change management unutuldu
- User adoption zor
- Eğitim eksik

✅ People + Process + Technology
```

### ✅ Doğru Uygulamalar

```markdown
# WORKFLOW IMPROVEMENT EXAMPLE
Current State: Invoice Processing
├── Steps: 7
├── Cycle time: 5 days
├── Manual touch points: 5
├── Error rate: 8%
└── Cost: $12/transaction

Analysis:
- Step 1: Email received (manual)
- Step 2: Data entry to ERP (manual)
- Step 3: Verification (manual)
- Step 4: Approval routing (manual)
- Step 5: Payment (automatic)
- Step 6: Confirmation (manual)
- Step 7: Archive (manual)

Improvement:
- OCR for data extraction (automation)
- Auto-routing based on amount (automation)
- Auto-archive (automation)
- Exception handling (manual only)

After:
- Steps: 3
- Cycle time: 1 day
- Manual touch: 1
- Error rate: 1%
- Cost: $3/transaction

ROI: 75% cost reduction
Payback: 4 months
```

```markdown
# RPA OPPORTUNITY SCORING
Process Assessment:

| Process | Vol/mo | Rule-base | Digital | Exception | Score | Fit |
|---------|--------|-----------|---------|-----------|-------|-----|
| Data Entry | 500 | 90% | 100% | 10% | 94% | 🟢 High |
| Report Gen | 200 | 80% | 100% | 20% | 86% | 🟢 High |
| Approval | 100 | 70% | 90% | 40% | 72% | 🟡 Med |
| Onboarding | 30 | 60% | 80% | 50% | 56% | 🟡 Med |
| Negotiation | 10 | 20% | 50% | 80% | 22% | 🔴 Low |

Recommendation:
- Phase 1: Data Entry + Report Gen (RPA)
- Phase 2: Approval (partial automation)
- Phase 3: Onboarding (hybrid)
- Negotiation: Do not automate
```

```markdown
# KPI IMPROVEMENT TRACKING
Before/After Comparison:

| KPI | Before | After | Change |
|-----|--------|-------|--------|
| Cycle Time | 5 days | 2 days | -60% |
| Processing/hr | 10 | 25 | +150% |
| Error Rate | 8% | 2% | -75% |
| Cost/unit | $12 | $4 | -67% |
| Staff hours/wk | 40h | 16h | -60% |

Annual Impact:
- Labor saved: 1,248 hours
- Error reduction: 360 errors prevented
- Cost savings: $24,000/year
- ROI: 250%
- Payback: 3 months

Validation:
- Baseline measured for 3 months
- Post-implementation 3 months
- Statistical significance: p<0.01
```

```markdown
# PRIORITIZATION MATRIX
                       Impact
                  Low       High
              ┌──────────┬──────────┐
        High  │  QUICK   │  STRATEGIC│
   Effort     │  WINS    │  IMPROVE  │
              ├──────────┼──────────┤
        Low   │  FILLER  │  EFFORT   │
              │          │  SHAPING  │
              └──────────┴──────────┘

Action Priority:
1. Quick Wins: "Do now" (High impact, low effort)
2. Strategic: "Plan" (High impact, high effort)
3. Effort Shaping: "Schedule" (Low impact, high effort)
4. Filler: "Later" (Low impact, low effort)

Example:
- Email automation → Quick Win (1 week, high impact)
- ERP integration → Strategic (6 months, critical)
- Template standardization → Filler (when time)
```

---

## Quick Reference

| Otomasyon Türü | Uygun Süreçler | Örnek |
|----------------|----------------|-------|
| Simple RPA | Rule-based, repetitive | Data entry, copy-paste |
| Attended RPA | Human in loop | Approval, verification |
| Unattended RPA | End-to-end automated | Processing, reporting |
| API Integration | System-to-system | Data sync, triggers |
| AI/ML | Complex decisions | Classification, prediction |

| Waste Türü | Tanım | Çözüm |
|-----------|-------|-------|
| Waiting | Idle time | Buffer reduction |
| Motion | Unnecessary movement | Workspace optimization |
| Defects | Errors | Quality controls |
| Over-processing | Unnecessary steps | Process simplification |
| Overproduction | Too early/much | Demand matching |
| Inventory | Excess stock | Lean inventory |
| Transport | Unnecessary moves | Handoff reduction |

| Automation Tools | Kullanım | Complexity |
|-----------------|----------|------------|
| Zapier/Make | Simple workflows | Low |
| Power Automate | Microsoft ecosystem | Medium |
| UiPath/Automation Anywhere | Enterprise RPA | High |
| Custom scripts | Specific needs | Variable |
| API integrations | System-native | Medium-High |

| Improvement ROI | Hesaplama | Örnek |
|-----------------|-----------|-------|
| Time saved | hrs × rate × frequency | 10h/wk × $50 × 52 = $26K/yr |
| Error reduction | errors × cost × reduction | 100 × $100 × 50% = $5K/yr |
| Labor redeployment | FTE impact | 0.5 FTE freed = $30K/yr |
| Total annual savings | Sum all | $61K/yr |
| Implementation cost | One-time | $15K |
| Payback period | Cost / Monthly savings | 3 months |
