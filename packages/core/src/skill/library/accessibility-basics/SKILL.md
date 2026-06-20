---
name: accessibility-basics
description: "WCAG basics, keyboard navigation, screen reader" 
triggers:
  extensions: [".tsx", ".html"]
  directories: ["components/"]
  keywords: ["aria", "a11y", "accessibility", "wcag", "screen reader"]
auto_load_when: "Editing HTML/JSX with accessibility concerns"
agent: seo-agent
tools: ["Read", "Write", "Bash"]
---

# Accessibility Basics Patterns

Focus: WCAG fundamentals, keyboard, screen reader support

## 1. WCAG Decision Tree

```
When to meet WCAG level:
├── New project → AA target
├── Legal requirement → A + AA minimum
├── Enterprise → AAA considered
└── No requirement → A minimum

Perceivable principles:
├── Text alternatives → alt text
├── Time-based media → captions/transcript
├── Adaptable → proper structure
└── Distinguishable → contrast + size

Operable principles:
├── Keyboard accessible → yes
├── Enough time → timeouts extension
├── No seizures → 3 flashes max
├── Navigation有帮助 → clear + consistent

Understandable principles:
├── Readable → language declared
├── Predictable → consistent navigation
├── Input assistance → labels + errors

Robust principles:
├── Compatible → standards
└── Status messages → aria-live
```

## 2. Keyboard Navigation Decision Tree

```
When element needs focus:
├── Interactive → yes
├── Custom widget → yes
├── Tabular content → yes
└── Off-screen content → hidden until used

When to use tab order:
├── Logical reading order → yes
├── Visual order matches → yes
├── Explicit tabindex → avoid
└── Reverse tab → issue

When to manage focus:
├── Modal opens → trap focus
├── Modal closes → restore
├── Tab closes → move to trigger
└── Dynamic content → announce
```

## 3. Screen Reader Decision Tree

```
When to add alt text:
├── Informative image → describe
├── Decorative → empty alt
├── Complex image → description + longdesc
└── Link image → describe destination

When to use roles:
├── Native element available → use native
├── Custom widget → add role
├── Enhanced semantics → add role
└── No change → no role

When to announce changes:
├── Dynamic content → aria-live
├── Form errors → assertive
├── Loading states → polite
└── Success → polite or silent
```

## 4. Color Contrast Decision Tree

```
When to check contrast:
├── Text → minimum 4.5:1 (AA), 7:1 (AAA)
├── Large text → 3:1 (AA), 4.5:1 (AAA)
├── UI components → 3:1
└── Logo/text art → exempt

When to rely on color:
├── Error state → add icon/text
├── Selected state → add indicator
├── Links → underline or color
└── Status → not color alone

When to test:
├── All text → check
├── Dark mode → check
├── High contrast → check
└── Zoom 200% → check
```

## 5. Forms Accessibility Decision Tree

```
When to label fields:
├── All inputs → always
├── Screen reader → yes
├── Click target → yes
└── Visible label → yes

When to group:
├── Radio/checkbox group → fieldset + legend
├── Address fields → fieldset
├── Date fields → fieldset
└── Single field → no grouping

When to announce errors:
├── Inline → aria-invalid + describedby
├── Summary → focus first error
├── Field-level → announce on focus
└── Announce on submit → aria-live
```

## 6. Testing Decision Tree

```
When to test manually:
├── Keyboard only → test
├── Screen reader → test (NVDA/VoiceOver)
├── Zoom 200% → test
└── High contrast → test

Automated vs manual:
├── Automated → catches 30-40%
├── Manual → needed for rest
├── User testing → best for complex
└── A11y audit → automated first

Tools decision:
├── axe → development
├── WAVE → quick check
├── Lighthouse → screening
└── NVDA/VoiceOver → manual
```

## When to Use Decision Summary

1. WCAG AA minimum: 4.5:1 contrast, keyboard, alt text
2. Native elements: prefer over custom with ARIA
3. Focus management: modal traps, restores on close
4. Live regions: announce dynamic changes
5. Test with keyboard + screen reader + zoom

---

## Anti-Patterns

```
❌ Interactive elements without keyboard navigation
✅ All actions reachable via Tab/Enter/Space/Arrow keys

❌ Color contrast below 4.5:1 (AA standard)
✅ Use contrast checker; text on bg ≥ 4.5:1 normal, 3:1 large

❌ Images with no alt text
✅ Meaningful images: alt="description"; decorative: alt=""

❌ Custom components without ARIA roles
✅ Use semantic HTML first; ARIA only when native element unavailable

❌ Focus trapping outside modals
✅ Trap focus inside open modal; restore on close
```

---

## Quick Reference

| WCAG Level | Requirement | Check |
|---|---|---|
| A | Alt text on images | axe DevTools |
| A | Keyboard navigation | Tab through page |
| AA | Color contrast 4.5:1 | Colour Contrast Analyser |
| AA | Focus visible | Outline never display:none |
| AA | Error identification | Describe error in text |
| AAA | Enhanced contrast 7:1 | For critical text |

---

## Decision Tree

```
WCAG target level?
├── New public-facing product          → AA (minimum acceptable)
├── Legal/compliance requirement       → A + AA strictly
├── Enterprise / government            → AAA for critical flows
└── Internal tool, no legal exposure   → AA still recommended

Custom interactive element needed?
├── Native HTML button/link works      → use native (gets a11y for free)
├── No native equivalent               → add role + aria-* + keyboard handler
└── Icon-only button                   → add aria-label

Focus management?
├── Modal opens                        → move focus to modal, trap Tab inside
├── Modal closes                       → return focus to trigger element
├── Dynamic content inserted           → announce via aria-live or move focus
└── Tooltip/popover                    → trigger keeps focus, Esc closes

Error handling in forms?
├── Inline validation                  → aria-invalid + aria-describedby on input
├── Summary at top                     → move focus to first error on submit
└── Success toast                      → aria-live="polite" region
```

---

## Key Rules

1. All text on background: minimum 4.5:1 contrast ratio (AA), 3:1 for large text (18px+)
2. Every interactive element reachable by keyboard: Tab, Shift+Tab, Enter, Space
3. Every `<img>` has `alt`: descriptive for informative, `alt=""` for decorative
4. Semantic HTML first — `<button>`, `<nav>`, `<main>`, `<header>` give roles for free
5. Focus outline never `display:none` or `outline:none` — if custom, keep visible
6. `lang` attribute on `<html>` — screen readers use it to pick correct voice
7. Test with real screen reader (NVDA/VoiceOver) — automated tools catch only 30-40%

---

## Implementation

```tsx
// Accessible modal with focus trap
import { useEffect, useRef } from 'react'

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) firstFocusRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button ref={firstFocusRef} onClick={onClose}>Close</button>
    </div>
  )
}

// Form field with accessible error
function EmailField({ error }: { error?: string }) {
  return (
    <div>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        aria-invalid={!!error}
        aria-describedby={error ? 'email-error' : undefined}
      />
      {error && (
        <span id="email-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

// Announce dynamic content
function LiveRegion({ message }: { message: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}

// Icon-only button
function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Delete item">
      <TrashIcon aria-hidden="true" />
    </button>
  )
}
```
