---
name: web-components
description: "Shadow DOM, custom elements, slots pattern" 
triggers:
  extensions: [".ts"]
  keywords: ["Web Components", "custom element", "shadow DOM", "LitElement", "HTMLElement", "slot", "template"]
auto_load_when: "Building native Web Components"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Web Components Patterns

Focus: Shadow DOM, custom elements, slots

## 1. Custom Element Decision Tree

```
When to create custom element:
├── Reusable component → yes
├── Framework-agnostic → yes
├── Design system → yes
└── Isolated styling → yes

When to extend native:
├── Enhanced native → yes
├── Custom behavior → yes
├── Consistent API → yes
└── Only browser support → no

When to avoid:
├── Wrapper only → use HOC/render prop
├── Server-rendered → no
├── Simple usage → no
└── Already native element → native
```

## 2. Shadow DOM Decision Tree

```
When to use Shadow DOM:
├── Isolation needed → yes
├── Styling encapsulation → yes
├── Third-party content → yes
└── Design system → yes

When to avoid Shadow DOM:
├── Full access needed → no (use light DOM)
├── SSR required → no
├── Simple component → no
└── SEO important → no

When to use open mode:
├── Need external access → yes
├── Testing → yes
├── Framework integration → yes
└── Full control → open (default)
```

## 3. Slots Decision Tree

```
When to use slots:
├── Content projection → yes
├── Flexible content → yes
├── Default content → yes
└── Named slots → multiple pieces

When to use named slots:
├── Multiple insert points → yes
├── Header/footer/body → yes
└── Optional sections → yes

When to use fallback:
├── Required content → yes
├── Default styling → yes
├── Empty state → yes
└── Placeholder → yes
```

## 4. Attributes/Properties Decision Tree

```
When to use attributes:
├── Primitive values → yes
├── Single values → yes
├── Common convention → yes
└── IDL attribute → same name

When to use properties:
├── Objects/arrays → yes
├── Complex values → yes
├── Two-way binding → yes
└── Performance → yes

When to reflect:
├── Common convention → yes
├── Style changes → yes
├── ARIA updates → yes
└── Frequent changes → no
```

## 5. Lifecycle Decision Tree

```
When to use constructor:
├── Setup → yes
├── Shadow DOM → yes
├── State init → yes
├── DOM not ready → DOM not ready

When to use connectedCallback:
├── Setup external API → yes
├── Event listeners → yes
├── Resources → fetch/animations
└── Initial render → yes

When to use disconnectedCallback:
├── Cleanup → yes
├── Remove listeners → yes
├── Abort controllers → yes
└── Cancel animations → yes

When attribute callback:
├── Side effects → yes (observe)
├── DOM updates → yes
└── Re-render needed → yes
```

## 6. Events Decision Tree

```
When to dispatch custom event:
├── Public API → yes
├── Two-way binding → yes
├── External notification → yes
└── Internal trigger → use internal

When to compose native:
├── Native first → yes
├── No preventDefault → yes
├── Bubbles appropriate → yes
└── cancelable needed → yes

When event detail:
├── Data needed → yes
├── Minimal → yes
├── Serialization → avoid functions
└── DOM references → avoid
```

## When to Use Decision Summary

1. Custom element for framework-agnostic reuse
2. Shadow DOM for style isolation
3. Slots for content projection with fallbacks
4. Reflect attributes to properties or vice versa
5. Lifecycle: constructor setup, connected/disconnected cleanup

---

## Anti-Patterns

```
❌ Deeply nested shadow DOM piercing with CSS vars hack
✅ Design tokens via CSS custom properties — they cross shadow boundaries

❌ Web Components that require framework to use
✅ Pure web components have zero framework dependencies

❌ Exposing internal DOM structure via public API
✅ Use well-defined attributes and events as public interface

❌ No form participation (custom inputs don't work in <form>)
✅ Implement ElementInternals for form-associated elements

❌ Re-inventing every component from scratch
✅ Extend existing HTML elements via customized built-ins
```

---

## Quick Reference

| API | Purpose | Example |
|---|---|---|
| customElements.define | Register element | define('my-btn', MyBtn) |
| connectedCallback | Mounted | Set up listeners |
| disconnectedCallback | Unmounted | Clean up listeners |
| attributeChangedCallback | Prop change | Re-render |
| observedAttributes | Prop list | static get list |
| adoptedCallback | Moved to new doc | Rare |
| attachShadow | Encapsulate | { mode: 'open' } |
