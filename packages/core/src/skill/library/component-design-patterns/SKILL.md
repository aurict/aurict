---
name: component-design-patterns
description: "Component design: Atomic design, composition, prop design, state placement." 
triggers:
  extensions: [".tsx", ".jsx"]
  directories: ["components/", "ui/"]
  keywords: ["component", "props", "composition", "compound", "atomic", "slot"]
auto_load_when: "Designing or editing React components"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Component Design Patterns

**Focus:** Design principles, composition, reusability

---

## 1. Component Size Decision

```
When to split components:

├── Component does too much
│   └── Multiple responsibilities
│   └── Hard to test
│   └── Can describe in one sentence?
│
├── Component is reused in multiple places
│   └── But with different content
│   └── Props control everything
│   └── Use children/slots instead
│
├── Component renders different states
│   └── Loading, error, empty, data
│   └── Extract each to separate component
│
└── Component is hard to maintain
    └── 200+ lines
    └── Multiple concerns
    └── Several reasons to change
```

```
When NOT to split:

├── Components are tightly coupled
│   └── Always used together
│   └── Split would make harder
│
├── Premature abstraction
│   └── Not used anywhere else yet
│   └── Wait until second use
│
└── Simplicity is priority
    └── Over-abstraction = complexity
    └── Trade-off: balance needed
```

---

## 2. Props Design

```
Props principles:

├── Explicit over implicit
    └── Name clearly indicates purpose
    └── Avoid: data, value, params
│
├── Prefer objects over primitives
    └── Related props together
    └── Easier to extend
│
├── Boolean props
    └── Use sparingly
    └── Better: explicit prop for state
    └── Example: isLoading vs loadingState
│
└── Callbacks: verb prefix
    └── onClick, onSubmit, onLogin
    └── Past tense for handlers: onDataFetched
```

```
When to use children:

├── Content is component's responsibility
    └── Button with icon + text
    └── Card with header/body/footer
│
├── Content varies from caller
    └── Not predictable props
    └── Use slots for flexibility
│
└── When NOT to use children:

    └── Simple data display
    └── Predictable content
    └── Props more explicit
```

---

## 3. Component Composition

```
How to compose:

├── Wrapper components
    └── Layout: margin, padding, max-width
    └── Applies container rules
    └── Children are content
│
├── Slot components
    └── Card with header/body/footer slots
    └── Optional sections
    └── Caller controls what's where
│
└── Higher-order components (use carefully)
    └── Add behavior (loading, error)
    └── Compose multiple behaviors
    └── Hooks often better alternative
```

```
Composition vs inheritance:

├── Composition preferred
    └── Flexible, interchangeable
    └── Props control behavior
    └── Easy to test
│
└── Inheritance:
    └── Avoid for UI components
    └── Tight coupling
    └── Hard to override
    └── Use composition instead
```

---

## 4. Atomic Design Levels

```
When to use each level:

├── Atoms (basic elements)
    └── Button, Input, Label
    └── Smallest reusable units
    └── No dependencies on other components
│
├── Molecules (simple groups)
    └── FormField (Label + Input)
    && SearchBar (Input + Button)
    && Consistent units working together
│
├── Organisms (complex UI)
    && Header, Sidebar, ProductCard
    && Distinct section of UI
    && Multiple molecules/atoms
│
├── Templates (page structure)
    && Layout, ArticleTemplate
    && Blueprint for pages
    && Placeholders for content
│
└── Pages (full templates)
    && HomePage, ProductPage
    && Instantiated templates
    && Connect to data, state
```

---

## 5. State Placement

```
Where to put state:

├── Component-local state
    └── useState for UI state
    └── Only used in this component
    └── Not passed elsewhere
│
├── Shared state (lift up)
    └── Used by multiple children
    └── Closest common ancestor
    └── Pass down via props or context
│
├── Global state
    └── Many components need access
    && User session, theme
    && Use: Zustand, Context
│
└── Server state
    && API data
    && Use: React Query, SWR
    && NOT component state
```

---

## Key Patterns

1. **Split when reused** - Not before
2. **Props explicit** - Avoid too generic names
3. **Children for content slots** - Props for configuration
4. **Composition over inheritance** - Flexibility
5. **State in lowest common ancestor** - But not lower than needed

---

## Anti-Patterns

```
❌ Component that does data fetching + rendering + state management
✅ Single responsibility: container (data) vs presentational (UI)

❌ Props drilling 5 levels deep
✅ Composition pattern or context for cross-cutting concerns

❌ Boolean prop explosion (isLoading, isDisabled, isError, isLarge...)
✅ Variant prop with discriminated union: variant="loading" | "error"

❌ Ref forwarding broken by wrapping in HOC
✅ forwardRef at every wrapper; compose with mergeRefs

❌ Component accepting 20+ props
✅ Split component; use render props or compound components for complexity
```

---

## Quick Reference

| Pattern | Use case | Trade-off |
|---|---|---|
| Compound components | Complex related UI | Flexible but verbose API |
| Render props | Injecting behavior | More flexible than HOC |
| HOC | Cross-cutting (auth, analytics) | Hard to compose |
| Custom hook | Reusable logic only | No rendering |
| Polymorphic `as` prop | Semantic element flex | Type complexity |
| Slot pattern | Content projection | Like Vue slots in React |

---

## Decision Tree

```
Split this component?
├── Does it have multiple responsibilities? → split (single responsibility)
├── Is it used in 2+ different contexts?    → split + make it generic
├── > 150 lines with mixed concerns?        → split
└── First use, no reuse yet                → keep flat (no premature abstraction)

Props or children?
├── Content is caller-controlled (text, icon, arbitrary) → children / slot
├── Configuration / behavior                             → props
├── Complex structure with multiple sections             → compound components (Header, Body)
└── Style variants (primary/secondary/ghost)             → single variant prop (not booleans)

Which composition pattern?
├── Simple variants (Button, Badge)         → cva() variant prop
├── Complex related parts (Select, Tabs)   → compound components (Parent.Child)
├── Inject cross-cutting (auth, analytics) → HOC or custom hook
└── Reusable logic without UI              → custom hook
```

---

## Key Rules

1. Single responsibility — one reason to change per component
2. Wait for second actual use before extracting an abstraction
3. `variant="primary" | "secondary"` over `isPrimary`, `isSecondary`, `isLarge` booleans
4. `children` for content (variable), props for configuration (fixed)
5. State in lowest common ancestor — no lower, no higher
6. Container = data fetching; Presentational = rendering only — never mix in one file
7. forwardRef at every wrapper to preserve ref access

---

## Implementation

```typescript
// Compound component — Select with Sub-Components
interface SelectContextValue { value: string; onChange: (v: string) => void }
const SelectCtx = React.createContext<SelectContextValue | null>(null)

function Select({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return <SelectCtx.Provider value={{ value, onChange }}>{children}</SelectCtx.Provider>
}

function SelectTrigger({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(SelectCtx)!
  return <button onClick={() => {}}>{children}</button>
}

function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(SelectCtx)!
  return (
    <div
      onClick={() => ctx.onChange(value)}
      data-selected={ctx.value === value}
    >
      {children}
    </div>
  )
}

Select.Trigger = SelectTrigger
Select.Item    = SelectItem

// Usage — caller composes the structure
<Select value={selected} onChange={setSelected}>
  <Select.Trigger>{selected || 'Choose…'}</Select.Trigger>
  <Select.Item value="a">Option A</Select.Item>
  <Select.Item value="b">Option B</Select.Item>
</Select>

// Variant prop — cva() + discriminated type (see tailwind-expert for full cva setup)
type CardVariant = 'default' | 'outlined' | 'elevated'
function Card({ variant = 'default', children }: { variant?: CardVariant; children: React.ReactNode }) {
  const styles: Record<CardVariant, string> = {
    default:  'bg-white shadow-sm',
    outlined: 'border border-gray-200',
    elevated: 'bg-white shadow-lg',
  }
  return <div className={cn('rounded-lg p-4', styles[variant])}>{children}</div>
}
```
