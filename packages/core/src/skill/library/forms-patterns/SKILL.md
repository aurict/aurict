---
name: forms-patterns
description: "Form architecture, validation patterns, state handling" 
triggers:
  extensions: [".tsx", ".jsx"]
  keywords: ["form", "input", "validation", "react-hook-form", "formik", "zod", "submit", "field"]
auto_load_when: "Building or editing forms"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Forms Patterns

Focus: Architecture, validation, state management

## 1. Form Architecture Decision Tree

```
When to use controlled input:
├── Framework (React/Vue) → yes
├── Real-time validation → yes
├── Conditional fields → yes
└── Simple form → uncontrolled

When to use uncontrolled:
├── No JS required → yes
├── Large form → performance
├── Framework not needed → yes
└── File upload → yes

When to nest forms:
├── Related fields → yes
├── Multi-step → yes
└── Separate forms → no nesting
```

## 2. Validation Strategy Decision Tree

```
When to validate on blur:
├── Required fields → yes
├── Format validation → yes
├── Custom rules → yes
└── Debounce needed → add delay

When to validate on submit:
├── Performance → yes
├── User preference → yes
├── All fields → yes
└── Heavy validation → yes

When to use HTML5 validation:
├── Simple rules → yes
├── Browser support → yes
├── Custom messages → overrides
└── Disabled for style → avoid

When to use custom validation:
├── Complex rules → yes
├── Cross-field validation → yes
├── Async validation → yes
└── Different error UI → yes
```

## 3. Error Handling Decision Tree

```
When to show error inline:
├── Field-specific → yes
├── Clear which field → yes
├── Multiple errors → yes
└── Summary also shown → yes

When to show error summary:
├── Many errors → yes
├── Form above fold → yes
├── Mobile → position carefully
└── Single error → inline only

When to use aria-invalid:
├── Validation error → yes
├── Conditional required → yes
├── Pre-validated → no
└── Initial state → no
```

## 4. State Management Decision Tree

```
When to use form state:
├── Many fields → yes
├── Cross-field logic → yes
├── Submission handling → yes
└── Simple form → local state

When to use field-level state:
├── Independent validation → yes
├── Many fields → yes
├── Shared state → lift up
└── Simple → local state

When to reset form:
├── Clear button → yes
├── Successful submit → yes
├── Navigation away → confirm
└── Same form, different data → yes
```

## 5. Accessibility Patterns

```
When to use aria-describedby:
├── Help text → yes
├── Error message → yes
├── Character count → yes
└── Instructions → yes

When to group fields:
├── Fieldset → yes (radio/checkbox group)
├── Related fields → yes
├── Conditional section → yes
└── Single field → no

When to use legend:
├── Fieldset → always
├── Descriptive label → yes
├── Group explanation → yes
└── Empty → not allowed
```

## 6. File Upload Patterns

```
When to use single file:
├── One document → yes
├── Clear format → accept attribute
├── Validation needed → custom

When to use multiple files:
├── Multiple documents → yes
├── Drag and drop → yes
├── Progress indicator → yes
└── File list → yes

When to use preview:
├── Images → yes
├── Documents → icon
└── Not needed → skip
```

## When to Use Decision Summary

1. Validate on blur for field errors, on submit for form
2. Use aria-invalid + aria-describedby for accessibility
3. Group related fields with fieldset
4. Show inline errors + summary for complex forms
5. Controlled for complex, uncontrolled for simple

---

## Anti-Patterns

```
❌ Validating only on submit — user waits for errors
✅ Validate on blur for each field; show inline errors immediately

❌ Disabling submit button until valid (accessibility issue)
✅ Keep submit enabled; validate on submit, show all errors at once

❌ Resetting the form on validation error
✅ Preserve user input on error — never lose filled data

❌ Generic "Invalid" error message
✅ Specific messages: "Password must be at least 8 characters"

❌ No loading state after submit
✅ Disable submit + show spinner during submission
```

---

## Quick Reference

| Library | Use case | Key feature |
|---|---|---|
| react-hook-form | Performance-first | Uncontrolled inputs |
| Zod | Schema validation | Type inference |
| Formik | Complex forms | Built-in state |
| Server Actions | Next.js 15 | No JS bundle cost |
| HTML5 validation | Simple forms | Zero dependencies |

| UX Pattern | When | Note |
|---|---|---|
| Inline error | On blur | Don't show on pristine |
| Summary error | On submit | Anchor to first error |
| Success feedback | After submit | Toast or redirect |
