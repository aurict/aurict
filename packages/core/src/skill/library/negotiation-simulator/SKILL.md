---
name: negotiation-simulator
description: "Müşteri rol yapma. Price negotiation, value selling, walk-away triggers ve BATNA."
triggers:
  keywords: ["negotiation simulator", "müzakere", "price negotiation", "roleplay", "BATNA", "walk-away"]
auto_load_when: "Kullanıcı müzakare simülasyonu, fiyat müzakeresi, rol yapma veya müzakere stratejisi talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Grep", "Glob"]
---

# Negotiation Simulator (Müzakere Uzmanı)

**Odak Alanı:** Satış müzakerelerini simüle etmek, fiyat müzakeresi stratejileri geliştirmek ve walk-away noktalarını belirlemek.

---

## Pattern 1: Fiyat Müzakere Stratejileri

### 1.1 Değer Odaklı Müzakere

```
Value Selling Framework:
├── Before Price Discussion
│   ├── Establish value clearly
│   ├── Quantify ROI
│   ├── Create urgency
│   └── Get commitment on value
│
├── When Price Comes Up
│   ├── Never discount without reason
│   ├── Trade value for price
│   ├── Always get something in return
│   └── Never be the first to give a number
│
└── After Initial Objection
    ├── Ask clarifying questions
    ├── Reframe value
    ├── Offer alternatives
    └── Create packaging options
```

### 1.2 Fiyat Müzakere Scripts

```
Script 1 - Value Anchoring:
"Let me share how [similar customer] calculated ROI: They saw [X% improvement] in [metric], which equals [dollar value] annually. With our price of $[X], that represents [X]% ROI. Does that framework make sense for your situation?"

Script 2 - Trade Value for Discount:
"I can certainly look at pricing options. To do that, I need to understand what you're trading. If we reduce price, what would you give up? [Features, timeline, support level, payment terms]. That way we find the right balance."

Script 3 - Price Objection Response:
"Before we discuss pricing specifics, help me understand: when you say [too expensive], are you comparing to [competitor], to your budget, or to expected ROI? Because I've found when we calculate actual value, the conversation changes."
```

### 1.3 Pricing Strategy Framework

```
Negotiation Tactics by Scenario:
├── Competitor Situation
│   ├── "They offer X, we offer Y. Here's the difference..."
│   ├── "Our [specific] is worth $X more than [competitor]..."
│   └── "Our pricing reflects [specific value]. What matters most to you?"
│
├── Budget Situation
│   ├── "Let's look at phased approach..."
│   ├── "What if we prioritized [critical features] first?"
│   └── "There's a [lower tier] option that fits..."
│
└── No Authority
    ├── "What's the process to get budget approved?"
    ├── "What information would help get approval?"
    └── "Can we present to the decision maker together?"
```

---

## Pattern 2: Value Selling Müzakere

### 2.1 Değer Çerçeveleme Teknikleri

```
Value Framework Tree:
├── Quantified Value
│   ├── Time saved × hourly rate
│   ├── Error reduction × cost per error
│   ├── Revenue increase × % attribution
│   └── Cost reduction × actual amount
│
├── Strategic Value
│   ├── Competitive advantage
│   ├── Risk reduction
│   ├── Customer satisfaction impact
│   └── Employee satisfaction
│
└── Emotional Value
    ├── Peace of mind
    ├── Reduced stress
    ├── Pride in work
    └── Career advancement
```

### 2.2 Value Selling Scripts

```
Script 1 - Cost of Inaction:
"What does it cost you to wait? You mentioned [problem] is costing [X]/month. A 3-month delay means [3X] in losses. Our price represents [X% of that]. The real question is: can you afford to wait?"

Script 2 - Value reframing:
"Instead of viewing this as [price], think of it as [investment]. [Similar company] invested [X] and got [Y] in return. The ratio is [Z:1]. What if we could demonstrate similar results for you?"

Script 3 - Feature Trade:
"I can offer a discount if we adjust scope. Option A: Full price, all features. Option B: [X]% discount, [removed feature]. Option C: [Y]% discount, [reduced support]. Which trade-off works for you?"
```

---

## Pattern 3: BATNA (En İyi Alternatif)

### 3.1 BATNA Kavramı ve Uygulama

```
Understanding BATNA:
├── What is BATNA?
│   ├── Best Alternative To Negotiated Agreement
│   ├── Your walk-away option
│   └── Your leverage in negotiation
│
├── How to Identify
│   ├── What are their alternatives?
│   ├── What happens if no deal?
│   ├── What's their timeline pressure?
│   └── What's their urgency?
│
└── How to Use
    ├── Never reveal your BATNA first
    ├── Understand their BATNA
    ├── Find zone of possible agreement
    └── Know your walk-away point
```

### 3.2 BATNA Discovery Questions

```
Questions to Identify Client BATNA:
├── Direct questions
│   ├── "What happens if we don't reach a deal?"
│   ├── "What's your timeline to solve this?"
│   ├── "What alternatives are you considering?"
│   └── "What would make this not worth pursuing?"
│
├── Contextual questions
│   ├── "Have you looked at [competitor]?"
│   ├── "What's your current solution costing you?"
│   ├── "When does your current contract end?"
│   └── "What other priorities are competing for budget?"
│
└── Pressure questions
│   ├── "How urgent is solving this problem?"
│   ├── "What would change if you had 6 more months?"
│   ├── "What's the cost of doing nothing?"
│   └── "What's driving the timeline?"
```

### 3.3 BATNA Response Strategy

```
Your BATNA Strength:
├── Strong BATNA
│   ├── "I understand you have options. Our unique value is..."
│   ├── "While [competitor] is an option, here's what makes us different..."
│   └── "The risk of [other option] is..."
│
├── Weak BATNA
│   ├── Focus on relationship value
│   ├── Highlight long-term benefits
│   ├── Offer flexibility on terms
│   └── Find non-price concessions
│
└── No BATNA
    ├── "We've found the best results come from..."
    ├── "Our customers say the biggest value is..."
    └── "Let me show you what success looks like..."
```

---

## Pattern 4: Walk-Away Noktaları

### 4.1 Walk-Away Triggerleri

```
Walk-Away Conditions:
├── Price Walk-Aways
│   ├── Below minimum viable price
│   ├── No room for profitable delivery
│   ├── Unreasonable timeline pressure
│   └── Competitor pricing below cost
│
├── Terms Walk-Aways
│   ├── Unlimited liability clauses
│   ├── Non-negotiable cancellation
│   ├── Payment terms >90 days
│   └── Personal guarantees
│
├── Scope Walk-Aways
│   ├── Out of scope requirements
│   ├── Unclear specifications
│   ├── Unlimited revisions
│   └── Feature creep without budget
│
└── Relationship Walk-Aways
    ├── Bad faith negotiation
    ├── Misaligned values
    ├── Unrealistic expectations
    └── Toxic client behavior
```

### 4.2 Walk-Away Communication

```
How to Signal Walk-Away:
├── Soft Signal
│   ├── "This is getting outside our typical range..."
│   ├── "I'm not sure we can make this work at that price..."
│   └── "That's a significant departure from our standard..."
│
├── Hard Signal
│   ├── "I appreciate the opportunity, but I don't think we're a fit..."
│   ├── "I can't agree to those terms. Here's what I can offer..."
│   └── "Let me think about this and get back to you..."
│
└── Deal Close
    ├── "Here's my final offer. Take it or leave it."
    ├── "This is the best I can do. What's your response?"
    └── "We need to move on. Can you confirm by [time]?"
```

### 4.3 Counter-Walk-Away Strategy

```
Preventing Walk-Away:
├── When Client Signals
│   ├── Ask for clarification: "What specifically..."
│   ├── Understand root cause: "Help me understand..."
│   ├── Offer alternatives: "What if we tried..."
│   ├── Create new value: "In addition, we could..."
│
└── Recovery Techniques
    ├── Ask for one more chance
    ├── Bring in new person/perspective
    ├── Add new elements to the deal
    ├── Suggest formal review process
```

---

## Pattern 5: Rol Yapma Senaryoları

### 5.1 Temel Senaryo Tipleri

```
Scenario Library:
├── Price Negotiation
│   ├── Target: 20% discount
│   ├── Client: "Your price is too high"
│   ├── Leverage: Competitor quote
│   └── Variables: Payment terms, features
│
├── Competitor Close
│   ├── Target: Meet with competitor
│   ├── Client: "Going with [competitor]"
│   ├── Leverage: Signed deal imminent
│   └── Variables: Timeline, differentiator
│
├── Budget Approval
│   ├── Target: Get budget approved
│   ├── Client: "Need to get approval"
│   ├── Leverage: Key stakeholder
│   └── Variables: Presentation, materials
│
├── Scope Change
│   ├── Target: Maintain scope
│   ├── Client: "Add more features"
│   ├── Leverage: Timeline locked
│   └── Variables: Pricing adjustment
│
└── Timeline Pressure
│   ├── Target: Extended timeline
│   ├── Client: "Need it now"
│   ├── Leverage: Resource constraints
│   └── Variables: Rush fees, trade-offs
```

### 5.2 Simülasyon Protokolü

```
Roleplay Process:
├── Phase 1: Setup
│   ├── Define scenario parameters
│   ├── Assign roles (you play rep)
│   ├── Establish client profile
│   └── Set success criteria
│
├── Phase 2: Execute
│   ├── Run negotiation
│   ├── Play customer objections
│   ├── Push back on discounts
│   └── Test walk-away limits
│
├── Phase 3: Debrief
│   ├── What worked?
│   ├── What didn't work?
│   ├── Better approaches?
│   └── Key learnings
│
└── Phase 4: Strategy
    ├── Adjust approach
    ├── Prepare counter-arguments
    ├── Plan next steps
    └── Set boundaries
```

---

## Key Patterns (Özet)

| Pattern | Odak | Uygulama |
|---------|------|----------|
| Fiyat Müzakeresi | Price negotiation | Value anchoring, trade value |
| Değer Satışı | Value selling | ROI, cost of inaction |
| BATNA | Walk-away alternative | Discovery, strategy |
| Walk-Away | Exit points | Triggers, communication |
| Rol Yapma | Simulation | Senaryolar, debrief |

---

## Anti-Patterns

### ❌ Yasaklı Yaklaşımlar

```yaml
Negotiation errors:
  - Discounting without reason
  - Revealing BATNA too early
  - Accepting first offer
  - Being too eager
  
Communication errors:
  - Being confrontational
  - Taking objections personally
  - Not listening to concerns
  - No follow-through
```

### ✅ Doğru Yaklaşımlar

```yaml
Best practices:
  - Never discount first
  - Always get value in return
  - Know your walk-away
  - Create urgency
  
Skills:
  - Active listening
  - Patience
  - Value articulation
  - Creative problem solving
```

---

## Quick Reference

| Scenario | Target | Strategy |
|----------|--------|----------|
| Price objection | Maintain price | Reframe value |
| Competitor close | Differentiate | Highlight gaps |
| Budget approval | Get approval | Create presentation |
| Scope creep | Control scope | Trade-off approach |
| Timeline pressure | Extend or add cost | Rush premium |

| Technique | Use When | Example |
|-----------|----------|---------|
| Anchoring | Early | "Industry average is X, we're Y" |
| Trade-off | Discount request | "If I reduce, you give..." |
| Silence | After offer | Wait for response |
| BATNA | Leverage | "Your alternative is..." |
| Walk-away | Dead end | "I can't go lower" |

| Metric | Target | Walk-Away |
|--------|--------|-----------|
| Discount | <15% | >25% |
| Timeline | Realistic | Unreasonable |
| Payment | <60 days | >90 days |
| Scope | Defined | Undefined |
