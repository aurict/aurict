---
name: animations-patterns
description: "Animation decisions, performance, accessibility" 
triggers:
  extensions: [".tsx", ".css", ".ts"]
  keywords: ["animation", "transition", "motion", "framer", "keyframe", "gsap"]
auto_load_when: "Adding animations or transitions"
agent: style-architect
tools: ["Read", "Write", "Bash"]
---

# Animations Patterns

Focus: Decision framework, performance, accessibility

## 1. Animation Type Decision Tree

```
When to use CSS animation:
├── Simple properties → yes
├── Trigger: hover/focus → yes
├── One-time → yes
└── Complex sequencing → JS

When to use JS animation:
├── Dynamic values → yes
├── Physics-based → yes
├── Complex sequencing → yes
└── Interactive → yes

When to use Web Animations API:
├── Framework integration → yes
├── Performance needed → yes
├── Native alternative → yes
└── Library needed → GSAP/framer
```

## 2. Property Performance Decision Tree

```
When to animate transform:
├── Position → yes
├── Scale → yes
├── Rotation → yes
└── Always prefer → yes

When to animate opacity:
├── Fade in/out → yes
├── Visibility changes → yes
└── Use with transform → yes

When to animate other properties:
├── Avoid → layout triggers
├── Colors → acceptable
├── Shadows → expensive
└── Filter → expensive

When to use will-change:
├── Frequent animation → yes
├── Before animation starts → yes
├── After animation ends → remove
└── Default → avoid
```

## 3. Accessibility Decision Tree

```
When to respect reduced motion:
├── User preference → check
├── Essential motion → allow-animations: reduce
├── Eliminated → opacity: 0; visibility: hidden
└── Static alternative → provide

When to auto-play animations:
├── Essential info → avoid
├── Decorative → muted autoplay
├── User can pause → yes
└── No controls → add controls
```

## 4. Animation Purpose Decision Tree

```
When to animate entry:
├── Page load → yes
├── Modal open → yes
├── Accordion expand → yes
└── Single entrance → yes

When to animate state:
├── Hover/focus → microinteraction
├── Loading → skeleton preferred
├── Success/error → feedback
└── Selection → visual feedback

When to animate navigation:
├── Page transition → yes
├── Tab switch → yes
├── Scroll → scroll-behavior
└── Anchor jump → no animation
```

## 5. Timing Decision Tree

```
Duration guidelines:
├── Quick UI → 150-200ms
├── Standard → 200-300ms
├── Emphasis → 300-500ms
└── Page transition → 400-600ms

Easing selection:
├── Linear → rare
├── Ease-out → entry animations
├── Ease-in → exit animations
├── Ease-in-out → complex
└── Custom → cubic-bezier for feel

When to use spring:
├── Natural feel → yes
├── Interactive → yes
├── Bounce needed → yes
└── Simple → easing is fine
```

## When to Use Decision Summary

1. Prefer transform + opacity — avoid layout trashing
2. Respect prefers-reduced-motion — check and adapt
3. Use will-change sparingly — add before, remove after
4. Timing: fast for UI (200ms), slower for emphasis (400ms)
5. Spring for interactive, easing for one-way

---

## Anti-Patterns

```
❌ Animating layout properties (width, height, top, left)
✅ Animate transform and opacity only — GPU-composited

❌ JavaScript setInterval for animations
✅ requestAnimationFrame or CSS transitions

❌ Blocking main thread with heavy JS during animation
✅ Use CSS animations or offload to Web Animations API

❌ Auto-playing motion with no prefers-reduced-motion check
✅ Always wrap motion in @media (prefers-reduced-motion: no-preference)

❌ Animating every interaction (overload)
✅ Reserve animation for meaningful state changes
```

---

## Quick Reference

| Scenario | Solution | Performance |
|---|---|---|
| Simple hover | CSS transition | Excellent |
| Complex sequence | Web Animations API / Framer Motion | Good |
| Enter/exit | CSS keyframes + class toggle | Excellent |
| Scroll-linked | Intersection Observer | Good |
| Canvas/game | requestAnimationFrame | Excellent |
| Reduced motion | prefers-reduced-motion media query | — |

---

## Decision Tree

```
Which animation tool?
├── Simple hover/focus state           → CSS transition (no JS, GPU-composited)
├── Enter/exit, keyframes              → CSS @keyframes + class toggle
├── Complex sequence, physics, gesture → Framer Motion or Web Animations API
└── Heavy data visualization           → requestAnimationFrame

Which property to animate?
├── Move element                       → transform: translate (never top/left)
├── Scale or rotate                    → transform: scale / rotate
├── Show/hide                          → opacity (not display:none mid-animation)
├── Background, color                  → OK but costly — use sparingly
└── width, height, top, left          → avoid — triggers layout reflow

Duration?
├── Hover/focus microinteraction       → 150–200ms
├── Standard enter/exit                → 200–300ms
├── Emphasis or drawer open            → 300–500ms
└── Full page transition               → 400–600ms

prefers-reduced-motion?
├── Essential functionality            → keep but simplify (fade vs slide)
└── Decorative only                    → disable entirely at no-preference check
```

---

## Key Rules

1. Only animate `transform` and `opacity` — they're GPU-composited and don't trigger reflow
2. Always wrap motion in `@media (prefers-reduced-motion: no-preference)` or check via JS
3. Easing: `ease-out` for entries, `ease-in` for exits, `ease-in-out` for emphasis
4. Fast for UI reactions (≤200ms), slower for narrative/emphasis (300-500ms)
5. Add `will-change: transform` before animation starts; remove it after (don't set globally)
6. Spring physics for interactive gestures; CSS easing for one-way state transitions
7. No auto-playing motion without pause control — respect WCAG 2.2.2

---

## Implementation

```tsx
// CSS: fade + slide entry (GPU-composited, accessible)
// styles.css
@media (prefers-reduced-motion: no-preference) {
  .fade-in {
    animation: fadeIn 250ms ease-out both;
  }
  .slide-up {
    animation: slideUp 300ms ease-out both;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

// Framer Motion: accessible enter/exit
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'

function Drawer({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  const shouldReduce = useReducedMotion()

  const variants = {
    hidden:  { x: shouldReduce ? 0 : '100%', opacity: shouldReduce ? 0 : 1 },
    visible: { x: 0, opacity: 1 },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {children}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

// CSS transition for hover (simplest, fastest)
// .button { transition: background-color 150ms ease-out, transform 150ms ease-out; }
// .button:hover { transform: translateY(-1px); }
```
