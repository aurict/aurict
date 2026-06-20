---
name: prompt-engineering
description: "Prompt Engineering: Template patterns, chain-of-thought, few-shot learning, prompt versioning." 
triggers:
  extensions: [".yaml", ".json", ".md"]
  directories: ["prompts/", "templates/"]
  keywords: ["prompt", "system prompt", "few-shot", "chain-of-thought", "cot", "prompt template"]
auto_load_when: "Designing prompts for LLMs or building prompt systems"
agent: ai-engineer
tools: ["Read", "Write", "Bash"]
---

# Prompt Engineering Patterns

**Focus:** Template design, reasoning patterns, testing, versioning

## 1. Prompt Structure

```
System Prompt Components:
├── Role definition
│   ├── "You are a senior software engineer..."
│   └── Be specific, not generic
│
├── Task definition
│   ├── "Your job is to review code for..."
│   └── Clear output format expectations
│
├── Constraints
│   ├── "Never reveal internal API keys..."
│   └── "Only respond in JSON format..."
│
├── Style/Personality
│   ├── "Be concise, use bullet points..."
│   └── "Explain like I'm 5 for complex topics..."
│
└── Examples (few-shot)
    ├── Input → Output pairs
    └── Show expected format, not just content
```

---

## 2. Chain-of-Thought (CoT) Patterns

```
When to use CoT:
├── Complex reasoning → Math, logic, multi-step
├── Multi-choice selection → "First analyze, then choose"
├── Debugging → "Think step-by-step about the bug"
└── NOT for simple tasks → Overhead not worth it

Basic CoT:
"Think step by step, then provide your answer."

Extended CoT:
"Let's think about this carefully:
1. First, identify the key constraint...
2. Second, evaluate each option...
3. Finally, choose based on..."

Structured CoT (for code):
"Before writing code:
- What are the inputs and outputs?
- What are the edge cases?
- What's the time/space complexity?"
```

---

## 3. Few-Shot Learning

```
When to use few-shot:
├── Output format specific → JSON, markdown, code
├── Task not well-defined → Show examples
└── Domain-specific → Include domain examples

Number of examples:
├── 0-1 for simple tasks (let model infer)
├── 2-3 for format requirements
├── 5+ for complex tasks (but context limit)

Example selection:
├── Diverse examples (different scenarios)
├── Recent/relevant examples
└── Edge cases if important

❌ BAD: Repeating same example 5 times
✅ GOOD: 5 different examples covering the space
```

---

## 4. Prompt Templates

```
Template Structure:
```
You are a {{role}} working on {{project}}.
Your task: {{task_description}}

Context:
- User: {{user_context}}
- Tech stack: {{tech_stack}}

Output format:
{{output_format_spec}}

Constraints:
{{constraints_list}}
```
|

Dynamic variables:
├── Input-dependent (from user query)
├── Context-dependent (from system state)
├── Environment-dependent (from config)
└── Version-dependent (A/B testing)
```

---

## 5. Prompt Testing & Versioning

```
Testing strategy:
├── Unit tests per prompt variant
│   ├── Test inputs → expected outputs
│   └── Automated, CI-integrated
│
├── Golden set evaluation
│   ├── Fixed dataset of representative queries
│   ├── Measure accuracy, format compliance
│   └── Compare versions
│
├── A/B testing in production
│   ├── Traffic split (10% variant)
│   └── Track: accuracy, latency, cost, user feedback
│
└── Monitoring
    ├── Track failure rates
    └── Flag quality degradation
```

---

## Key Patterns

1. **Role clarity** - Specific role, not generic "helpful assistant"
2. **Output specification** - Show exact format, not just describe
3. **Constraints explicit** - Say what NOT to do, not just what to do
4. **Test systematically** - Version control + automated testing
5. **Iterate with data** - Track prompt performance, optimize

---

## Anti-Patterns

```
❌ Vague role: "You are a helpful assistant"
✅ Specific: "You are a senior React engineer specializing in performance"

❌ No output format: "Extract the key information"
✅ Explicit: "Return JSON: { name: string, email: string, role: string }"

❌ Too many constraints in one prompt
✅ Split into system prompt + task prompt + validation

❌ Testing prompts manually only
✅ Automated tests with golden dataset

❌ Hardcoded prompts in code
✅ Separate prompt files, load at runtime, version control
```

---

## Quick Reference

| Technique | When to use | Example |
|---|---|---|
| Role definition | Always | "You are a senior..." |
| CoT | Complex reasoning | "Let's think step by step..." |
| Few-shot | Format needed | 2-3 examples |
| Structured output | JSON/Code | schema=UserSchema |
| Constraints | Safety/quality | "Never reveal..." |
| Edge cases | Robustness | "If X, return Y" |
