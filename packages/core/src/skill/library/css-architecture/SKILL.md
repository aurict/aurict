---
name: css-architecture
description: "CSS organization, BEM, component patterns" 
triggers:
  extensions: [".css", ".scss", ".module.css", ".sass"]
  keywords: ["CSS", "BEM", "SMACSS", "cascade", "specificity", "selector", "stylesheet"]
auto_load_when: "Editing CSS files or designing CSS structure"
agent: style-architect
tools: ["Read", "Write", "Bash"]
---

# CSS Architecture Patterns

Focus: Organization, naming, component isolation

## 1. Organization Strategy Decision Tree

```
When to use CSS Modules:
├── Component-based framework → yes
├── Scoped styles needed → yes
├── Dynamic theming → consider
└── Global styles needed → separate file

When to use CSS-in-JS:
├── JS-driven theming → yes
├── Critical CSS → separate
├── Zero runtime → zero-runtime solution
└── Plain CSS preferred → use CSS files

When to use utility classes:
├── Rapid prototyping → yes
├── Design system → yes (limited set)
├── Complex components → component classes
└── Many variants → composition
```

## 2. BEM Decision Tree

```
When to create block:
├── Standalone component → yes
├── Reusable piece → yes
├── Layout wrapper → yes
└── Single-use → element only

When to create element:
├── Part of block → yes
├── Meaningful alone → make block
├── Always with parent → element
└── Reusable elsewhere → make block

When to create modifier:
├── Visual variant → yes
├── State change → yes (is- prefix)
├── Behavior variant → yes
└── Same appearance → no modifier
```

## 3. Component Pattern Decision Tree

```
When to use composition:
├── Shared patterns → mixin class
├── Size variants → composition
├── Color variants → composition
└── Complex variants → component extension

When to use inheritance:
├── Slight variation → override
├── Base component → yes
├── Many overrides → composition
└── Rarely shared → single component

When to use custom properties:
├── Theming → yes
├── Responsive values → yes
├── Interactive values → yes
└── Static values → hardcode
```

## 4. File Organization Decision Tree

```
When to split files:
├── 1000+ lines → split
├── Multiple people → split
├── Clear domain → split
└── Small project → single file

Folder structure decision:
├── By component → feature teams
├── By type → role separation
├── By page → simple sites
└── Hybrid → most projects

When to use index file:
├── Re-exports needed → yes
├── Multiple entry points → yes
├── Barrel pattern → yes
└── Simple project → direct import
```

## 5. Specificity Management

```
When to add new selector:
├── Override third-party → use higher specificity
├── Component override → block override
├── Global style fix → specific selector
└── Default → keep specificity low

When to use !important:
├── Override inline styles → yes
├── Utility classes → yes (limited)
├── Print styles → yes
└── Never → for normal code

When to refactor:
├── Specificity wars → refactor to composition
├── Important overuse → refactor
├── Deep nesting → flatten
└── Duplication → extract to component
```

## When to Use Decision Summary

1. BEM for component isolation — block__element--modifier
2. Custom properties for theming — avoid hardcoded values
3. Keep specificity low — enable easy overrides
4. Organize by component — co-locate styles
5. Use index files — clean public API

---

## Anti-Patterns

```
❌ Deep selector chains (.nav ul li a span)
✅ Flat, single-class selectors with BEM/utility approach

❌ Inline styles scattered throughout HTML
✅ Style only via classes — one source of truth

❌ !important everywhere to override specificity wars
✅ Fix specificity at the root — flatten the cascade

❌ One monolithic CSS file for the whole app
✅ Co-located styles per component/feature

❌ Global .button styles affecting every button
✅ Namespace component styles to their scope
```

---

## Quick Reference

| Task | Approach | Why |
|---|---|---|
| Component styles | CSS Modules / scoped | No bleed |
| Global tokens | CSS custom properties | Runtime themeable |
| Utility classes | Tailwind / UnoCSS | Zero dead CSS |
| Dark mode | `[data-theme]` attribute | No flash |
| Responsive | Mobile-first breakpoints | Progressive enhancement |
| Specificity | Flat selectors (0,1,0) | Predictable override |

---

## Decision Tree

```
Which CSS methodology?
├── Component-based app (React/Vue)    → CSS Modules (scoped by default, no bleed)
├── Utility-driven, design system      → Tailwind CSS (zero dead CSS, no naming)
├── Legacy HTML / server-rendered      → BEM naming (block__element--modifier)
└── Design token driven theming        → CSS Custom Properties + any of the above

Dark mode strategy?
├── System preference + user toggle    → [data-theme="dark"] on <html>
├── Tailwind                           → dark: variant (class or media strategy)
└── CSS-in-JS                          → context-based theme tokens

Handling variants (size, color, state)?
├── 1-2 variants                       → BEM modifier: .button--primary
├── Many composed variants             → cva() from class-variance-authority
└── Purely state (disabled, active)    → data-* attributes (data-state="open")

Specificity problem?
├── Third-party override               → add specificity (use :where() to reset to 0)
├── Own code conflict                  → flatten cascade, avoid nesting
└── Tempted to add !important          → refactor — extract to separate selector
```

---

## Key Rules

1. Flat selectors only — max specificity (0,1,0); no `.nav ul li a` chains
2. CSS Modules or Tailwind for component styles — global `.button` bleeds everywhere
3. CSS custom properties for all design tokens (colors, spacing, radii) — runtime themeable
4. Never `!important` in product code — fix the cascade instead
5. Co-locate styles with the component: `Button.tsx` + `Button.module.css` in same folder
6. Mobile-first: base styles for small screens, `@media (min-width: N)` to layer up
7. For dark mode: `[data-theme]` attribute on `<html>` — avoids FOUC vs JS theme toggle

---

## Implementation

```css
/* Button.module.css — CSS Modules with CSS Custom Properties */
.root {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: background-color 150ms ease-out;
  cursor: pointer;
  border: none;
}

.primary   { background: var(--color-brand);    color: var(--color-on-brand); }
.secondary { background: var(--color-surface);  color: var(--color-text); border: 1px solid var(--color-border); }

.small  { padding: var(--spacing-1) var(--spacing-3); font-size: 0.875rem; }
.large  { padding: var(--spacing-3) var(--spacing-6); font-size: 1.125rem; }
```

```tsx
// Button.tsx — cva() for variant composition
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex items-center font-medium rounded-md transition-colors',
  {
    variants: {
      variant: {
        primary:   'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-white border border-gray-300 hover:bg-gray-50',
        ghost:     'hover:bg-gray-100',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />
}
```
