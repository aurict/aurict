---
name: sprint-planner
description: "Agile sprint planlama: Capacity hesaplama, story point estimation, velocity tracking ve sprint backlog yönetimi."
triggers:
  keywords: ["sprint planner", "agile planning", "story points", "velocity", "backlog", "capacity planning"]
  contexts: ["scrum planning", "sprint start", "estimation session", "sprint review"]
auto_load_when: "Kullanıcı sprint planlama, story point tahmini veya capacity hesaplama istediğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "Grep", "Glob"]
---

# Sprint Planner — Sprint Planlama Uzmanı

**Odak Alanı:** Agile sprint planlama süreçlerini yönetme, story point tahmini yapma, capacity hesaplama ve velocity takibi.

---

## Pattern Bölümleri

### 1. Sprint Planning Süreci

```
Sprint Planning Akışı
├── Pre-Sprint (Planlama öncesi)
│   ├── Backlog refinement (Grooming)
│   ├── Priority review
│   ├── Acceptance criteria clear
│   └── Technical debt assessment
├── Sprint Planning Toplantısı (2 saat max)
│   ├── Part 1: What (1 saat)
│   │   ├── Sprint goal review
│   │   ├── PBI selection from backlog
│   │   └── Commitment kararı
│   └── Part 2: How (1 saat)
│       ├── Task breakdown
│       ├── Technical approach
│       └── Dependency identification
├── Commitment
│   ├── Sprint goal statement
│   ├── Definition of Done
│   └── Sprint backlog publishing
└── Execution (Sprint boyunca)
    ├── Daily standups
    ├── Impediment tracking
    └── Continuous refinement
```

### 2. Story Point Estimation Metodları

```
Estimation Teknikleri
├── Planning Poker (En yaygın)
│   ├── Fibonacci serisi: 1, 2, 3, 5, 8, 13, 21
│   ├── Anonymous voting
│   ├── Discussion only after vote
│   ├── Consensus building
│   └── Remote: online poker tools
├── T-Shirt Sizing
│   ├── XS, S, M, L, XL
│   ├── Relative sizing
│   └── Quick for large backlog
├── Relative Sizing (WSJF approximation)
│   ├── Job size vs job weight
│   ├── Cost of delay consideration
│   └── Priority integration
├── Fist of Five
│   ├── 1-5 puan hızlı oylama
│   ├── Orta boy backlog için
│   └── Kararı hızlandırır
└── Bucket System
    ├── Kategorilere ayırma
    ├── Binned estimation
    └── Bulk items için
```

### 3. Capacity Hesaplama

```
Capacity Calculation
├── Step 1: Team Availability
│   ├── Team size: N kişi
│   ├── Working days: D gün/sprint
│   ├── Available hours/day: H saat
│   └── Total hours: N × D × H
├── Step 2: Capacity Percentage
│   ├── PTO/Deviation: -10%
│   ├── Meetings: -10%
│   ├── Unplanned: -10%
│   └── Net capacity: ~70%
├── Step 3: Sprint Capacity
│   ├── Team capacity: N × D × H × 0.70
│   ├── Convert to points using velocity
│   └── Buffer for unknowns
└── Example
    ├── 5 developers × 10 days × 8 hours = 400 hrs
    ├── 400 × 0.70 = 280 hrs
    ├── Avg velocity: 35 points/sprint
    └── Sprint capacity: 35 points
```

### 4. Velocity Tracking

```
Velocity Calculation & Usage
├── Historical Velocity
│   ├── Last 3 sprints average
│   ├── Last 5 sprints (more accurate)
│   ├── Trend analysis
│   └── Seasonal adjustments
├── Velocity Formula
│   └── Velocity = Σ(Completed Points) / N sprints
├── Velocity Variance
│   ├── Standard deviation
│   └── Range: min-max
└── Forecasting
    ├── Use 3-sprint rolling average
    ├── 80% confidence interval
    └── Conservative bias for planning
```

### 5. Sprint Backlog Yapısı

```
Sprint Backlog Components
├── Sprint Goal
│   ├── One sentence
│   ├── Business value
│   └── Focus area
├── PBI'lar (Product Backlog Items)
│   ├── User stories
│   ├── Bugs
│   └── Technical tasks
├── Task Breakdown
│   ├── Sub-tasks for each PBI
│   ├── Time-boxed (max 4-8 hours)
    ├── Implementation
│    ├── Testing
│    ├── Review
│    └── Deployment
├── Commitment Metrix
│   ├── Committed points
│   ├── Capacity points
│   └── Confidence level
└── Impediment List
    ├── Blockers
    ├── Risks
    └── Dependencies
```

---

## Key Patterns

| Pattern | Açıklama | Uygulama |
|---------|----------|----------|
| **Definition of Done** | Tamamlanma standardı | Her sprint'te tutarlı |
| **INVEST Criteria** | Good story standardı | Independent, Negotiable, Valuable, Estimable, Small, Testable |
| **Capacity Buffer** | Bilinmeyenler için boşluk | %20-30 buffer |
| **Sprint Goal** | Odak noktası | Her sprint'te bir goal |
| **Split Stories** | Büyükstory bölme | Max 8-13 points |
| **Timebox Enforcement** | Süre kısıtı | Sprint length sabit |
| **Retrospective Feedback** | Sürekli iyileşme | Velocity'yi etkiler |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```markdown
# UNREFINED BACKLOG
Planning'a girildi:
- Stories net değil
- Acceptance criteria belirsiz
- Technical approach belli değil

Sonuç: 1 saat sadece anlama harcanır
→ Planning verimliliği düşer

✅ Grooming'de %80 olgunluk sağla
```

```markdown
# OVERCOMMITMENT
Capacity: 35 points
Committed: 45 points

Neden: "Geçen sprint 50 yaptık"
- Her sprint aynı değil
- PTO, meeting, travel eksik

Sonuç: Sprint başarısız, morale düşer
→ Realistic planning
```

```markdown
# NO TASK BREAKDOWN
Sprint backlog:
- "Build user dashboard" = 13 points

Problem: Alt görevler yok
- Kim ne yapacak belli değil
- Takip zor
- Riskler gizli

✅ Her story'yi görevlere böl
```

```markdown
# VELOCITY GAMING
Yönetim: "Velocity düşük, daha çok yapın"
- Points artırmak için şişirme
- Unfinished work "done" sayma
- Test kalitesi düşürme

Sonuç: Velocity gerçekleri yansıtmaz
→ Planning yanlış, güven kaybolur
```

```markdown
# NO SPRINT GOAL
Sprint: "Tüm backlog'taki işleri yap"
- Odak yok
- Priyortie belirsiz
- Her şey eşit öncelikli

Result: Tamamlanan değil, 
"en çok iş" bitiyor

✅ Her sprint için bir goal
```

```markdown
# LONG sprint LENGTH
2 haftalık sprint yerine 1 ay
- Feedback gecikmeli
- Adaptasyon zor
- Risk artar

✅ Standard: 2 hafta
```

### ✅ Doğru Uygulamalar

```markdown
# PLANNING INPUT
Sprint Goal:
"Kullanıcı kayıt akışını 2 adımda 
tamamlayabilmeli ve onboarding 
conversion %20 artsın"

Capacity: 32 points (5 dev × 10 gün × 8h × 0.8)

Committed:
| Story | Points | Owner |
|-------|--------|-------|
| Registration form | 5 | Ahmet |
| Email verification | 5 | Ayşe |
| Dashboard skeleton | 8 | Mehmet |
| Onboarding flow | 8 | Burak |
| Integration tests | 6 | Cem |
Total: 32 ✓

Confidence: 8/10
```

```markdown
# TASK BREAKDOWN ÖRNEĞİ
Story: Email Verification (5 points)
Task 1: Token generation API (2h) - Ahmet
Task 2: Email template (2h) - Ayşe
Task 3: Send email service (3h) - Ahmet
Task 4: Verify endpoint (3h) - Mehmet
Task 5: UI feedback (2h) - Ayşe
Task 6: Integration test (1h) - Burak
Total: 13h ✓

Definition of Done:
✓ Code reviewed
✓ Unit tests written
✓ Deployed to staging
✓ QA passed
✓ Documentation updated
```

```markdown
# VELOCITY TREND
Sprint 1: 28 points
Sprint 2: 32 points
Sprint 3: 30 points
Sprint 4: 35 points
Sprint 5: 33 points
Sprint 6: 31 points (current)

Average (last 5): 32.2 points
Trend: Stable (+/- 3)

Forecast (next sprint):
- 80% confidence: 28-35 points
- Planning: 30 points (conservative)
```

---

## Quick Reference

| Story Point | Göreceli Büyüklük | Eşdeğer Süre |
|-------------|-------------------|--------------|
| 1 point | Çok küçük | 1-4 saat |
| 2 points | Küçük | 4-8 saat |
| 3 points | Orta | 8-16 saat |
| 5 points | Büyük | 16-24 saat |
| 8 points | Çok böl | 24-40 saat |
| 13 points | Çok büyük | 40+ saat |

| Planning Metrik | Hesaplama | Örnek |
|-----------------|-----------|-------|
| Team Capacity | N × D × H × % | 5 × 10 × 8 × 0.7 = 280h |
| Velocity | Σ(PBI points) / N | 32 + 35 + 30 / 3 = 32 |
| Commitment % | Committed / Capacity | 30 / 32 = 93% |
| Completed % | Completed / Committed | 28 / 30 = 93% |

| Sprint Anti-Pattern | Sonuç | Çözüm |
|---------------------|-------|-------|
| Scope creep | Planning dışı work | Daily scope check |
| Unfinished items | Burndown düşmüyor | Hard cutoff |
| Blocker chain | Sprint başarısız | Daily impediment |
| Low quality | Rework | DoD enforcement |
| No retros | Tekrarlayan sorunlar | Her sprint retros |

| INVEST Kriteri | Açıklama | Checklist |
|----------------|----------|-----------|
| I - Independent | Bağımsız | Başka story'ye bağlı değil |
| N - Negotiable | Görüşülebilir | Details üzerinde anlaşılabilir |
| V - Valuable | Değerli | User value sağlar |
| E - Estimable | Tahmin edilebilir | Yeterli bilgi var |
| S - Small | Küçük | Max 2-3 günlük iş |
| T - Testable | Test edilebilir | DoD yazılabilir |

| Sprint Cadence | Etkinlik | Süre | Katılımcılar |
|----------------|----------|------|--------------|
| Daily | Standup | 15 dk | Dev team |
| Weekly | Refinement | 1 saat | Dev + PO |
| Bi-weekly | Planning | 2 saat | Dev + PO + SM |
| Bi-weekly | Review | 1 saat | Stakeholders |
| Bi-weekly | Retro | 45 dk | Dev team |
