---
name: sales-script-generator
description: "Satış scripti oluşturma. Discovery, presentation, closing. Question sets ve objection responses."
triggers:
  keywords: ["sales script", "satış scripti", "discovery call", "demo script", "closing script", "sales conversation"]
auto_load_when: "Kullanıcı satış görüşme scriptleri, discovery soruları, demo akışı veya closing scriptleri talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Grep", "Glob"]
---

# Sales Script Generator (Satış Script Uzmanı)

**Odak Alanı:** Satış sürecinin her aşaması için etkili scriptler, soru setleri ve itiraz yanıtları oluşturmak.

---

## Pattern 1: Discovery Phase Scriptleri

### 1.1 Opening Script (Giriş)

```
Standard Opening:
"Hi [Name], this is [Your Name] from [Company]. How are you doing today?"

Response Handler:
├── Positive response → "Great! Quick question—did you have a chance to look at the email I sent?"
│   ├── Yes → "Perfect. I wanted to follow up to understand your priorities..."
│   └── No → "No worries. Let me give you a quick overview of why I reached out..."
├── Busy response → "I completely understand. Let me take just 2 minutes, then I'll get out of your hair."
└── Skeptical response → "I appreciate your skepticism. Let me be direct: I think [specific value] could help with [their specific challenge]."
```

### 1.2 Discovery Question Framework

```
SPIN Questions Model:
├── Situation Questions
│   ├── "Currently, how does your team handle [process]?"
│   ├── "What's your current tech stack for [function]?"
│   ├── "How big is your team handling [task]?"
│   └── "What's your current volume for [metric]?"
│
├── Problem Questions
│   ├── "What's the biggest challenge with [current process]?"
│   ├── "Where do you see the most friction?"
│   ├── "How much time does [task] take currently?"
│   └── "What's the cost of [problem] to your business?"
│
├── Implication Questions
│   ├── "How does that affect your team productivity?"
│   ├── "What happens when [problem] occurs?"
│   ├── "How much revenue does [issue] cost you?"
│   └── "What's the impact on customer experience?"
│
└── Need-Payoff Questions
    ├── "If you could solve [problem], what would that mean?"
    ├── "What would perfect [solution] look like?"
    ├── "What's the priority for solving this?"
    └── "What's the timeline for addressing this?"
```

### 1.3 Deep Discovery Questions

```
B2B SaaS Discovery Template:
├── Company Context
│   ├── "How did you find yourself in this role?"
│   ├── "What's your main focus for this quarter?"
│   └── "What's the biggest initiative right now?"
│
├── Current State
│   ├── "Walk me through how [process] works today"
│   ├── "What tools are you using for [function]?"
│   └── "What's working well? What's not?"
│
├── Pain Points
│   ├── "What's the most frustrating part of [process]?"
│   ├── "When did this become a problem?"
│   ├── "What's the cost of this problem?"
│   └── "What have you tried before?"
│
├── Decision Process
│   ├── "How do you typically evaluate new solutions?"
│   ├── "Who's involved in this decision?"
│   ├── "What's your timeline for making a decision?"
│   └── "What would need to happen to move forward?"
│
└── Value Definition
    ├── "What would success look like?"
    ├── "If you could achieve one thing, what would it be?"
    └── "What's the value of solving this?"
```

---

## Pattern 2: Presentation Scriptleri

### 2.1 Demo/Presentation Opening

```
Demo Opening Script:
"Hi [Name], thanks for making time today. Before we start—I'm curious: what's your main goal for our conversation today? [Listen]. Perfect. So I'll be showing you how we help [achieve that goal]. I'll pause along the way for questions. Sound good?"

Presentation Framework:
├── Hook (2 min)
│   ├── "Based on what you told me about [pain point]..."
│   ├── "Here's what I'm going to show you..."
│   └── "By the end, you'll know if [solution] makes sense..."
│
├── Solution Overview (3-5 min)
│   ├── Show key value proposition
│   ├── Visual product tour
│   └── Connect to their specific needs
│
├── Deep Dive (5-10 min)
│   ├── 2-3 key features (based on their priorities)
│   ├── Show, don't just tell
│   └── Pause for questions
│
├── Proof Points (3-5 min)
│   ├── Relevant case study
│   ├── Metrics from similar company
│   └── Customer quote
│
└── Close (2-3 min)
    ├── Summarize value
    ├── Next steps
    └── Ask for commitment
```

### 2.2 Feature Presentation Scripts

```
Feature Introduction Template:
"Here's [feature]. [Pause]. The reason this matters for you is [specific value based on discovery]. [Demo]. Here's how [customer name] used this to achieve [result]."

Value Proposition Framework:
├── Problem Reminder
│   ├── "You mentioned [problem] was costing you [amount]..."
│   ├── "You said [pain point] was taking [time]..."
│   └── "Your team was struggling with [issue]..."
│
├── Solution Connection
│   ├── "What I've built does [specific function]..."
│   ├── "This solves [exact problem] by [how]..."
│   └── "The key difference is [differentiation]..."
│
└── Proof
    ├── "Customer [name] saw [specific metric] improvement"
    ├── "In [timeframe], they achieved [result]"
    └── "ROI calculation showed [X]%"
```

---

## Pattern 3: Closing Scripts

### 3.1 Trial Close Techniques

```
Mid-Conversation Closes:
├── Agreement Close
│   ├── "That makes sense, right?"
│   ├── "Would you agree that...?"
│   └── "Does that solve the [problem]?"
│
├── Summary Close
│   ├── "So to recap, we've covered [X, Y, Z]..."
│   ├── "The key takeaways are [X and Y]..."
│   └── "Does that align with your priorities?"
│
└── Mini-Close
    ├── "How does that approach sound?"
    ├── "Does that address your concern?"
    └── "Is that the kind of result you're looking for?"
```

### 3.2 Direct Close Scripts

```
Trial Offer Close:
"Based on everything we've discussed, I think the best next step is to try [product/service] with [specific scope]. This gives you [specific benefit]. What do you think?"

Meeting Booking Close:
"I've enjoyed our conversation. I'd love to continue this with [specific format: demo/presentation/workshop]. What's your availability next week?"

Decision Close:
"We've covered a lot today. I think [solution] could really help with [their goal]. Are you ready to move forward, or is there anything else you need to make a decision?"
```

### 3.3 Handling "Need to Think" Close

```
Response Script:
"Completely understand. When you say 'need to think about it,' can you help me understand what specifically you're thinking through?"

Common answers and responses:
├── "Need to discuss with team"
│   └── "Who else is involved? Can we include them?"
├── "Need to compare options"
│   └── "What are you comparing against? Can I help with that?"
├── "Need more information"
│   └── "What information would help? Let me address that."
└── "Not ready to commit"
│   └── "What would need to happen to feel ready?"
```

---

## Pattern 4: Objection Response Scripts

### 4.1 Common Objection Scripts

```
Price: "It's too expensive"
Response: "I hear you. Let me ask: when you say too expensive, are you comparing to [competitor] or to your current manual process? Because the ROI shows [X]% return within [timeframe]."

Timing: "Not the right time"
Response: "What changes in [timeframe]? [Listen]. И если я правильно понял, [repeat reason]. What if we could start with a small pilot that won't take much time?"

Competition: "We're going with [Competitor]"
Response: "Congrats on choosing a solution. Curious—what sealed the deal for them? [Listen]. The main difference with us is [key differentiation]. Is there anything you wish they had that we could offer?"
```

### 4.2 Objection Framework Template

```
Universal Response:
1. Acknowledge: "I understand why that's important..."
2. Clarify: "When you say [objection], can you tell me more about...?"
3. Respond: "Based on what you've shared... [specific answer]"
4. Confirm: "Does that address your concern?"
5. Progress: "So what's the next step?"
```

---

## Pattern 5: Follow-Up Scripts

### 5.1 Post-Meeting Scripts

```
Same Day Follow-Up:
"Hi [Name], great meeting you today. Quick recap: [summary of key points]. Next steps: [specific action]. I'll send [item] by [time]. Questions in the meantime, just reply to this. Talk soon!"

48-Hour Follow-Up (No response):
"Hi [Name], following up on our conversation. I know you're busy—wanted to make sure you saw this. [Send relevant article/content based on discussion]. Quick question: do you have 5 minutes this week to discuss [next step]?"

Meeting Request Follow-Up:
"Hi [Name], I know we spoke last week about [topic]. I wanted to follow up because [specific reason: new content, relevant news, timing]. Would [specific date/time] work for a quick call?"
```

### 5.2 Voicemail Scripts

```
Effective Voicemail:
"Hi [Name], this is [Your Name] from [Company]. [One specific reason for call—NOT "just following up"]. My number is [number]. I'm available [times]. Looking forward to connecting. Thanks!"

Follow-up Voicemail:
"Hi [Name], [Your Name] again. Quick update: [reason to call—new info, relevant content]. Wanted to catch you before [deadline/reason]. My number is [number]. Talk soon."
```

---

## Key Patterns (Özet)

| Phase | Odak | Key Elements |
|-------|------|---------------|
| Discovery | Soru-cevap | SPIN model, deep dive |
| Presentation | Değer aktarım | Hook, proof, demo |
| Closing | Action | Trial close, direct close |
| Objection | Çözüm | Acknowledge, clarify, respond |
| Follow-up | Momentum | Same-day, persistent |

---

## Anti-Patterns

### ❌ Yasaklı Yaklaşımlar

```yaml
Discovery:
  - Too many closed questions
  - Talking more than listening
  - Not customizing to prospect
  - Rushing through questions
  
Presentation:
  - Generic slides
  - Feature-dumping
  - No connection to prospect needs
  - No proof points
  
Closing:
  - Waiting too long
  - Not asking for the business
  - Weak follow-up
  - Taking rejection personally
```

### ✅ Doğru Yaklaşımlar

```yaml
Discovery:
  - Open-ended questions
  - Active listening
  - Note-taking
  - Customized to each prospect

Presentation:
  - Prospect-centric
  - Outcome-focused
  - Proof-backed
  - Interactive

Closing:
  - Multiple attempts
  - Clear next steps
  - Persistent follow-up
  - Learn from objections
```

---

## Quick Reference

| Phase | Duration | Focus | Key Script |
|-------|----------|-------|------------|
| Opening | 1-2 min | Rapport | Brief intro + purpose |
| Discovery | 10-20 min | Understanding | SPIN questions |
| Presentation | 15-30 min | Value | Demo + proof |
| Closing | 5-10 min | Action | Trial + direct |
| Follow-up | <2 min | Momentum | Next steps |

| Question Type | Use | Example |
|---------------|-----|---------|
| Open-ended | Discovery | "Tell me about..." |
| Closed | Clarification | "Do you...?" |
| Confirming | Validation | "So you're saying...?" |
| Probing | Deep dive | "What do you mean by...?" |

| Close Type | Best When | Script |
|------------|-----------|--------|
| Trial close | During conversation | "Does that make sense?" |
| Direct close | After demo | "Ready to move forward?" |
| Assumptive close | Strong interest | "Let's get you started..." |
| Referral close | After objection | "Who else might benefit?" |
