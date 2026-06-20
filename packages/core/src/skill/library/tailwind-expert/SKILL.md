---
name: tailwind-expert
description: "Tailwind 4: Theme architecture, Responsive strategy, Component patterns, Dark mode approach." 
triggers:
  extensions: [".tsx", ".html"]
  filenames: ["tailwind.config.js", "tailwind.config.ts"]
  keywords: ["Tailwind", "class", "utility", "tw", "@apply", "theme", "extend"]
auto_load_when: "Writing Tailwind CSS classes or config"
agent: style-architect
tools: ["Read", "Write", "Bash"]
---

# Tailwind CSS 4 Architecture Patterns

**Version:** Tailwind 4.1 | **Focus:** Design system, strategy, patterns

## 1. Theme Strategy

```
What goes in @theme?
├── Design tokens only (colors, spacing, fonts, radii)
├── NOT component styles (those are in components)
└── NOT complex utilities (use @utility for those)

Theme-first approach:
├── Define tokens in @theme
├── Use semantic names (--color-primary, NOT --color-blue-500)
├── Allow runtime overrides with CSS variables
└── Generate utilities automatically from tokens
```

**When NOT to use @theme:**
- One-off values → use arbitrary values `[100px]`
- Complex transforms → use @utility
- Conditional styles → use CSS classes in component

---

## 2. Responsive Strategy

```
How to handle responsive?
├── Mobile-first (default): classes apply to all, add md: for larger
│   └── div className="base md:large" 
│   └── Small: base applies, md: applies at md+
│
├── Breakpoint system:
│   └── sm: 640px, md: 768px, lg: 1024px, xl: 1280px
│
└── When NOT to use responsive:
    └── Container queries (@container) - adapt to parent, not viewport
```

---

## 3. Container Queries vs Media Queries

```
Media queries (viewport-based):
├── Sidebar hide on mobile
├── Font size changes with screen
└── Use when: layout responds to WINDOW size

Container queries (parent-based):
├── Card content adapts to card width
├── Product grid adapts to container
└── Use when: component behavior depends on ITS CONTAINER

Pattern: @container on parent, @md: on children
```

---

## 4. Component Pattern Decision

```
How to structure components?
├── Variant-based (recommended for simple components)
│   └── Button({ variant = 'primary' | 'secondary' })
│   └── Map variant to CSS classes
│   └── Good for: buttons, inputs, cards
│
├── Composition (recommended for complex)
│   └── Wrapper + Header + Body + Footer
│   └── Each part is optional
│   └── Good for: layouts, complex cards
│
└── Polymorphic (for flexibility)
    └── Render as different elements
    └── Good for: typography, links
```

---

## 5. Dark Mode Strategy

```
Dark mode implementation:
├── System preference (auto): className="dark:bg-black"
└── Manual toggle: className="bg-white dark:bg-black"

When to use each:
├── Auto: user controls via OS, no toggle needed
└── Manual: user explicitly chooses, needs toggle button

Implementation:
├── CSS variables for colors
├── .dark class overrides variables
└── @media (prefers-color-scheme: dark) sets default
```

---

## 6. Color System

```
Color hierarchy:
├── Semantic: --color-primary, --color-success (use in theme)
├── Brand: --color-brand-50 through --color-brand-900 (define in theme)
└── Functional: --color-bg, --color-text (optional abstraction)

When to use specific:
├── Semantic → when meaning is clear (primary, success, error)
├── Brand → when it's your actual brand color
└── Neutral → gray/slate for text, borders, backgrounds
```

---

## 7. Utility Composition

```
When to compose utilities:
├── Multiple values: className="flex items-center justify-between"
├── Conditional: className={cn(base, condition && variant)}
└── Reusable: extract to component

When to create custom utility:
├── Pattern used 3+ times
├── Complex selector logic
└── Not achievable with existing utilities
```

---

## 8. Migration Strategy (v3 → v4)

```
Migration priority:
├── 1. Install @tailwindcss/vite
├── 2. Replace @tailwind with @import "tailwindcss"
├── 3. Move config.js to @theme in CSS
├── 4. Remove content array (auto-detect)
├── 5. Update ring-offset to outline-offset
├── 6. Test functionality
└── 7. Review generated CSS size
```

**When to upgrade:**
- ✓ New projects → use v4
- ✓ Simple projects → upgrade
- ✗ Complex custom config → may need refactoring

---

## Key Patterns

1. **Theme tokens** - Only design tokens, not component styles
2. **Mobile-first** - Base styles, add md/lg for larger
3. **Container queries** - Components adapt to parent
4. **Variant pattern** - Simple components, compose for complex
5. **CSS variables** - Enable runtime theming

---

## Anti-Patterns

```
❌ Overriding Tailwind with arbaitrary [value] everywhere
✅ Extend theme in tailwind.config.ts; use custom tokens

❌ Long className strings that repeat across components
✅ Extract to component with cva() (class-variance-authority)

❌ Purging accidentally removes used classes (dynamic class strings)
✅ Safelist dynamic classes or construct full class names in code

❌ Mixing Tailwind with global CSS for the same styles
✅ Tailwind for all layout/spacing; CSS for animations not in Tailwind

❌ No dark mode strategy — adding dark: to every class
✅ Centralize dark mode in design tokens via CSS variables
```

---

## Quick Reference

| Pattern | Implementation | Note |
|---|---|---|
| Component variants | cva() + cn() | Type-safe variants |
| Responsive | sm: md: lg: | Mobile-first |
| Dark mode | dark: prefix | class or media strategy |
| Animation | animate-* + @keyframes | Extend in config |
| Arbitrary value | w-[37px] | Use sparingly |
| Custom token | extend.colors.brand | In tailwind.config.ts |

---

## Decision Tree

```
Use @theme or arbitrary value?
├── Color / spacing / radius used in 3+ places → @theme token
├── One-off dimension                           → arbitrary [37px]
└── Complex selector / state                   → @utility custom class

Media query or container query?
├── Layout changes based on viewport (sidebar) → media query: md:hidden
├── Component adapts to its container width    → @container + @md:flex
└── Both                                       → media for layout, container for components

Component variant approach?
├── Few discrete variants (primary/secondary)  → cva() from class-variance-authority
├── Complex layout with slots                  → composition (Card.Header, Card.Body)
└── Polymorphic element (button renders as a) → as prop with forwardRef

Dark mode?
├── Follow OS setting automatically            → @media (prefers-color-scheme: dark)
├── User-controlled toggle                     → dark: class strategy
└── Runtime theming (multiple themes)          → CSS variables in @theme, swap with JS
```

---

## Key Rules

1. Mobile-first always — base classes for mobile, `md:` / `lg:` for larger
2. Semantic token names in `@theme`: `--color-primary` not `--color-blue-500`
3. `cva()` for reusable components with variants — eliminates long repeated className strings
4. `cn()` (clsx + tailwind-merge) for conditional class merging — never string concatenation
5. Dark mode via CSS variables in `@theme` — not `dark:` on every individual class
6. Container queries (`@container`) for components that reuse across different widths
7. Never `@apply` large groups of utilities — extract to a React component instead

---

## Implementation

```typescript
// cva() — type-safe component variants
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:     'border border-input bg-background hover:bg-accent',
        ghost:       'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm:   'h-8 px-3 text-sm',
        md:   'h-10 px-4',
        lg:   'h-12 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & VariantProps<typeof buttonVariants>
  & { className?: string }

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

// CSS variables dark mode in global CSS
/*
@theme {
  --color-bg:      oklch(100% 0 0);
  --color-fg:      oklch(9% 0 0);
  --color-primary: oklch(45% 0.2 260);
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:  oklch(9% 0 0);
    --color-fg:  oklch(95% 0 0);
  }
}
*/
```
