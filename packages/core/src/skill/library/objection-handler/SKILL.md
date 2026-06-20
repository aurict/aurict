---
name: objection-handler
description: "Müşteri itirazları. Fiyat, zamanlama, güven itirazları. Script oluşturma ve roleplay."
triggers:
  keywords: ["objection handling", "itiraz yönetimi", "sales objection", "price objection", "negotiation", "customer concerns"]
auto_load_when: "Kullanıcı müşteri itirazları, fiyat müzakere, red karşıları veya rol yapma talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Grep", "Glob"]
---

# Objection Handler (İtiraz Yönetim Uzmanı)

**Odak Alanı:** Satış sürecinde karşılaşılan itirazları anlamak, categorize etmek ve etkili şekilde yanıtlamak için script ve strateji geliştirmek.

---

## Pattern 1: İtiraz Kategorileri ve Analizi

### 1.1 Temel İtiraz Türleri

```
Primary Objection Categories:
├── Price Objections (En yaygın - %35)
│   ├── "Too expensive"
│   ├── "Need cheaper option"
│   ├── "Budget is limited"
│   ├── "Need to compare pricing"
│   └── "Can't justify the cost"
│
├── Timing Objections (En yaygın - %25)
│   ├── "Not the right time"
│   ├── "Too busy right now"
│   ├── "Need to wait for Q3/Q4"
│   ├── "Waiting for new fiscal year"
│   └── "Going through changes"
│
├── Trust/Security Objections (En yaygın - %20)
│   ├── "Never heard of you"
│   ├── "Need to check references"
│   ├── "Not sure about reliability"
│   ├── "Concerned about support"
│   └── "Security concerns"
│
├── Need/Relevance Objections (En yaygın - %15)
│   ├── "Don't need this"
│   ├── "Already have a solution"
│   ├── "Not a priority right now"
│   └── "Doesn't apply to us"
│
└── Authority Objections (%5)
    ├── "Need to check with boss"
    ├── "Not my decision"
    └── "Need committee approval"
```

### 1.2 İtiraz Analiz Ağacı

```
Objection Root Cause Tree:
├── Surface Objection: "Price too high"
│   ├── Hidden: Can't afford
│   ├── Hidden: Don't see value
│   ├── Hidden: Not priority
│   ├── Hidden: Competitor cheaper
│   └── Hidden: Need justification
│
├── True Objection: "No budget"
│   ├── Real: Truly no budget
│   ├── Real: Budget elsewhere allocated
│   ├── Masked: Need approval
│   └── Masked: Not convinced value
│
└── False Objection: "Need to think about it"
    ├── Masked: Not ready to decide
    ├── Masked: Need more info
    ├── Masked: Want to check competitor
    └── Masked: Need internal buy-in
```

---

## Pattern 2: Price İtirazı Yönetimi

### 2.1 Değer Çerçeveleme (Value Framing)

```
Price Justification Framework:
├── Value-Based Response
│   ├── "Let's calculate the ROI..."
│   ├── "Based on your stated goals..."
│   └── "This solves [specific problem]"
│
├── Cost of Inaction
│   ├── "What does waiting cost you?"
│   ├── "Current problem costs $X/year"
│   └── "Every month without solution..."
│
└── Comparison Framework
    ├── "Compared to doing nothing..."
    ├── "Competitor total cost of ownership..."
    └── "Industry benchmark for this problem..."
```

### 2.2 Price Objection Scripts

```
Script 1 - Value Redirect:
" понимаю. Before we discuss budget, let me ask: What would it mean for you if you solved [problem] this quarter? [Get answer]. Based on that, the $X price represents [X% of that value]. Does that perspective help?"

Script 2 - Investment vs Cost:
"Think of this not as an expense but an investment. Here's what I mean: [Company X similar situation] invested $X and got [specific result]. The question isn't can you afford it—it's can you afford not to?"

Script 3 - Payment Options:
"I hear you. Let me share options: [Option 1: Annual - full discount], [Option 2: Quarterly - mid-tier], [Option 3: Pilot - low entry]. Which works best for your cash flow?"
```

---

## Pattern 3: Timing İtirazı Yönetimi

### 3.1 Timing Objection Handling

```
Timeline Objection Scripts:
Script 1 - Urgency Creation:
"[Prospect Name], you mentioned Q4 is better. Quick question: What's the cost of waiting? [Let them answer]. Based on what you've shared, you're losing $X/month. A 3-month delay means $X in lost opportunity. Can you afford that?"

Script 2 - Near-term Benefits:
"Мне кажется, вы правы насчёт времени, но хочу уточнить: if we started a pilot today, what could you achieve by end of [current quarter]? [Get specific]. That's a 6-month advantage."

Script 3 - External Events:
"What changes in Q3/Q4 that makes timing better? [Listen]. И если я правильно понял, [repeat their reason]. Maybe we can address some of these concerns now, so you're ready when that time comes?"
```

### 3.2 Timeline Qualification Questions

```
Timing Discovery Questions:
├── Trigger questions
│   ├── "What changes when the new fiscal year starts?"
│   ├── "What needs to happen for this to become a priority?"
│   └── "What's the cost of the problem during the wait?"
│
├── Qualification questions
│   ├── "Is this decision budgeted for this year?"
│   ├── "Who else needs to be involved in the timing decision?"
│   └── "What would accelerate the timeline?"
│
└── Commitment questions
    ├── "If we could demonstrate quick wins, would you move up the timeline?"
    └── "What would need to happen in the next 30 days to proceed?"
```

---

## Pattern 4: Trust/Security İtirazı Yönetimi

### 4.1 Trust Building Framework

```
Trust Objection Response Strategy:
├── Reference Strategy
│   ├── "May I connect you with [similar company]?"
│   ├── "Let me share how [similar role] handled this..."
│   └── "Would a call with [reference] help?"
│
├── Credibility Evidence
│   ├── "Here's our security certification..."
│   ├── "Here's our SOC2 compliance..."
│   └── "Here's our customer success stories..."
│
└── Risk Reduction
    ├── "We offer a 30-day money-back guarantee"
    ├── "We can do a pilot with no commitment"
    └── "We have 24/7 support with <1hr response"
```

### 4.2 Security Concern Scripts

```
Script 1 - Data Security:
"SECURITY concern is valid. Let me share what we do: [specific certifications], [encryption details], [data residency options]. Want me to send our detailed security whitepaper?"

Script 2 - Company Reputation:
"I understand you haven't heard of us. We're [X] years old, [Y] customers, [Z] revenue. Here's our trajectory: [growth metrics]. Let me also connect you with [similar reference]."

Script 3 - Support Guarantee:
"Concern about support is common. Our SLA: [specific]. Our average response: [time]. Reference from [similar company]: [quote]. Satisfied?"
```

---

## Pattern 5: Roleplay ve Script Geliştirme

### 5.1 Framework Genel Yapısı

```
Objection Handling Framework (LAER):
├── Listen
│   ├── Active listening
│   ├── Don't interrupt
│   ├── Take notes
│   └── Acknowledge concern
│
├── Acknowledge
│   ├── Validate their concern
│   ├── Show empathy
│   ├── Don't be defensive
│   └── "I understand why that's important..."
│
├── Explore
│   ├── Ask clarifying questions
│   ├── Find the real objection
│   ├── Dig deeper
│   └── "Can you tell me more about...?"
│
└── Respond
    ├── Address the real concern
    ├── Provide evidence
    ├── Offer alternatives
    └── Confirm resolution
```

### 5.2 Complete Objection Script Library

```
Universal Response Template:
STEP 1 - Acknowledge
"И понимаю, что это важный момент для вас."

STEP 2 - Probe
"Позвольте мне уточнить: когда вы говорите [itiraz], что именно вас беспокоит?"

STEP 3 - Address
"[Specific response based on objection type]"

STEP 4 - Confirm
"Это ответ на ваш вопрос? Есть что-то ещё, что нужно прояснить?"

STEP 5 - Next
"Какой следующий шаг имеет смысл?"
```

---

## Pattern 6: Itiraz Önleme (Proaktif Yaklaşım)

### 6.1 Pre-emptive Objection Handling

```
Prevention Strategies:
├── During Discovery
│   ├── Bring up potential concerns early
│   ├── Address objections before they arise
│   ├── Set proper expectations
│   └── Establish value early
│
├── In Proposal
│   ├── Anticipate common objections
│   ├── Include objection responses in proposal
│   ├── Provide comparison data
│   └── Include social proof
│
└── In Presentation
    ├── Acknowledge competitor mentions
    ├── Address pricing questions upfront
    ├── Include case studies relevant to their concerns
    └── Leave time for objections
```

---

## Key Patterns (Özet)

| Pattern | Odak | Uygulama |
|---------|------|----------|
| Kategorizasyon | İtiraz türü | Price, timing, trust, need |
| LAER Framework | Yanıt stratejisi | Listen-Acknowledge-Explore-Respond |
| Değer Çerçeveleme | Price handling | ROI, cost of inaction |
| Güven İnşası | Trust concerns | References, security, support |
| Önleme | Proaktif | Discovery'de ele alma |

---

## Anti-Patterns

### ❌ Yasaklı Yaklaşımlar

```yaml
Response errors:
  - Arguing with customer
  - Taking objections personally
  - Defensive responses
  - Ignoring the concern
  
Process errors:
  - Not listening fully
  - Jumping to solutions
  - Using memorized scripts (no adaptation)
  - Not following up
```

### ✅ Doğru Yaklaşımlar

```yaml
Best practices:
  - Acknowledge first, respond second
  - Ask clarifying questions
  - Find the real objection
  - Provide specific evidence
  
Skills:
  - Empathy and patience
  - Adaptability
  - Objection discovery
  - Value articulation
```

---

## Quick Reference

| İtiraz Türü | Sıklık | Yanıt Stratejisi |
|-------------|--------|------------------|
| "Too expensive" | %35 | Value framing + ROI |
| "Not right time" | %25 | Urgency + cost of delay |
| "Need references" | %15 | Connect to similar companies |
| "Have solution" | %15 | Differentiation + gaps |
| "Need approval" | %10 | Engage decision maker |

| Framework | Kullanım | Adımlar |
|-----------|----------|---------|
| LAER | Tüm itirazlar | Listen-Acknowledge-Explore-Respond |
| Feel-Felt-Found | Empati | Feel... Felt... Found... |
| Explain-Paraphrase | Anlama | Explain + Confirm |
| Shell | Alternatif | If not X, then Y |

| Metric | İyi | Kötü |
|--------|-----|------|
| Objection resolution rate | >70% | <40% |
| Second meeting rate after objection | >50% | <20% |
| Average handling time | <5 min | >10 min |
