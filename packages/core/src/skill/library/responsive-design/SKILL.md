---
name: responsive-design
description: "Breakpoint strategy, mobile-first, responsive images" 
triggers:
  extensions: [".css", ".scss", ".tsx"]
  keywords: ["responsive", "breakpoint", "mobile-first", "media query", "viewport", "fluid", "container query"]
auto_load_when: "Building responsive layouts"
agent: style-architect
tools: ["Read", "Write", "Bash"]
---

# Responsive Design Patterns

Focus: Breakpoints, mobile-first, responsive strategies

## 1. Breakpoint Strategy Decision Tree

```
When to define breakpoints:
├── Design changes → yes
├── Content reflow needed → yes
├── Existing breakpoints → extend
└── Same layout → single

When to use common breakpoints:
├── Mobile portrait → 320-480px
├── Mobile landscape → 480-768px
├── Tablet → 768-1024px
├── Desktop → 1024-1440px
├── Large desktop → 1440px+

When to use content-based:
├── Text too wide → breakpoint
├── Images pixelated → breakpoint
├── Touch targets small → breakpoint
└── Design breaks → breakpoint
```

## 2. Mobile-First Decision Tree

```
When to start mobile:
├── New project → yes
├── Unknown audience → yes
├── Mobile important → yes
└── Desktop-only → desktop-first

When to use min-width:
├── Mobile-first → base styles, then min-width
├── Additive changes → yes
├── Override at each breakpoint → yes
└── New component → mobile first

When to use max-width:
├── Desktop-first → base desktop, max-width
├── Legacy support → yes
├── Rare for new projects → min-width
└── Specific overrides → both
```

## 3. Responsive Image Decision Tree

```
When to use srcset:
├── Multiple sizes → yes
├── Art direction → picture
├── Resolution switching → srcset
└── Bandwidth considerations → srcset

When to use picture element:
├── Different crops → yes
├── Format switching → yes
├── Browser support → different formats
└── Size-based loading → media queries
```

## 4. Layout Strategy Decision Tree

```
When to use Flexbox:
├── One dimension → yes
├── Space distribution → yes
├── Alignment → yes
└── 2D layout → Grid

When to use Grid:
├── 2D layout → yes
├── Complex alignment → yes
├── Page layout → yes
└── Component → Flexbox or Grid

When to use container queries:
├── Self-contained components → yes
├── Different contexts → yes
├── Isolated responsive → yes
└── Page breakpoints sufficient → no
```

## 5. Touch Target Decision Tree

```
Touch target minimum:
├── Minimum size → 44x44px (iOS), 48x48px (Android)
├── Padding included → yes
├── Links close together → group
└── Custom sizing → ensure visibility

When to add hover states:
├── Desktop only → hide on touch
├── Hybrid devices → consider hover
├── Clear state → indicate interactable
└── Avoid stuck state → mobile-first
```

## 6. Responsive Typography Decision Tree

```
When to use fluid type:
├── Many sizes → yes
├── Smooth resizing → yes
├── Simple project → static + breakpoints
└── Large text → clamp()

When to use viewport units:
├── Full-width headers → yes
├── Hero text → yes
├── Body text → avoid (scaling issues)
└── Container-relative → use container units
```

## When to Use Decision Summary

1. Mobile-first: base styles at mobile, add with min-width
2. Use common breakpoints as starting point, adjust for content
3. Prefer content-based breakpoints over device-specific
4. Touch targets: minimum 44x44px
5. Use container queries for self-contained components

---

## Anti-Patterns

```
❌ Desktop-first breakpoints (everything starts wide)
✅ Mobile-first — min-width breakpoints only

❌ Fixed pixel widths on containers
✅ max-width with 100% fluid containers

❌ Touch targets smaller than 44×44px
✅ Minimum 44×44px clickable areas for mobile

❌ Viewport-locked font sizes (px only)
✅ Fluid typography with clamp() or rem units

❌ Testing only at 375px and 1440px
✅ Test the fluid range — resize slowly between breakpoints
```

---

## Quick Reference

| Concern | Solution | Example |
|---|---|---|
| Container width | max-width + padding | max-width: 1280px |
| Fluid columns | CSS Grid auto-fill | repeat(auto-fill, minmax(280px, 1fr)) |
| Fluid type | clamp() | clamp(1rem, 2.5vw, 1.5rem) |
| Breakpoints | 640 / 768 / 1024 / 1280 | Tailwind defaults |
| Images | max-width: 100% | Prevent overflow |
| Touch targets | min 44px | WCAG 2.5.5 |
