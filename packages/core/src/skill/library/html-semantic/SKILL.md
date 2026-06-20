---
name: html-semantic
description: "Semantic HTML, ARIA basics, accessibility tree" 
triggers:
  extensions: [".html", ".tsx"]
  keywords: ["semantic", "HTML5", "section", "article", "nav", "figure", "landmark", "heading", "ARIA"]
auto_load_when: "Writing HTML structure or semantic markup"
agent: seo-agent
tools: ["Read", "Write", "Bash"]
---

# HTML Semantic Patterns

Focus: Structure, semantics, accessibility tree

## 1. Semantic Elements Decision Tree

```
When to use <header>:
├── Site-wide header → yes
├── Article header → yes
├── Section header → use <h1>-<h6> instead
└── No visible heading → aria-labelledby alternative

When to use <nav>:
├── Primary navigation → yes
├── Secondary links → yes (multiple allowed)
├── Footer links → consider <footer> with nav
└── Breadcrumbs → yes
└── Table of contents → yes

When to use <main>:
├── Primary content → yes (once per page)
├── Sidebar content → no
├── Header/footer → no
└── Article content → yes

When to use <article>:
├── Self-contained content → yes (syndication ready)
├── Blog post → yes
├── Comment → yes
├── News item → yes
└── Wrapper div → no

When to use <section>:
├── Thematic grouping → yes
├── Chapter/section → yes
├── Tab panels → yes
└── Generic wrapper → use <div>
```

## 2. ARIA Decision Tree

```
When to add role:
├── Native element available → use native element
├── Custom widget → add role
├── Enhancing semantics → add role
└── Purely visual → no role needed

When to use aria-label:
├── Visible label present → no
├── No visible label → yes
├── Icon-only button → yes
└── Dynamic content → yes

When to use aria-labelledby:
├── Multiple labels → yes (combines them)
├── Section with heading → yes
├── Modal dialog → yes (references title)
└── Form field → yes (references label)

When to use aria-describedby:
├── Help text → yes
├── Error message → yes
├── Instructions → yes
└── Supplementary info → yes

When to use aria-live:
├── Dynamic content updates → yes
├── Status messages → yes (polite)
├── Errors → yes (assertive)
├── Loading states → yes (polite)
└── Static content → no
```

## 3. Accessibility Tree Decisions

```
When element is focusable:
├── Interactive → add focus styles
├── Custom widget → manage focus
├── Modal opens → focus trap inside
└── Modal closes → restore focus

When to use tabindex:
├── Native interactive → 0 (auto)
├── Custom focusable → 0
├── Off-screen content → -1
└── Page landmark → avoid

When to manage focus:
├── Modal opens → focus first element
├── Modal closes → restore trigger
├── Single-page nav → maintain context
└── Dynamic content → announce changes
```

## 4. HTML Structure Patterns

```
Heading hierarchy:
├── One <h1> per page → yes
├── Sequential → h1 → h2 → h3
├── Skip levels → avoid
└── Multiple h1 → no

List usage:
├── Navigation items → <nav> + <ul>
├── Related items → <ul>/<ol>
├── Breadcrumbs → <nav> + <ol>
└── Menu patterns → role="menu" if custom

Table semantics:
├── Tabular data → <table>
├── Layout → CSS Grid/Flex instead
├── Headers → <th> with scope
└── Caption → <caption> for title
```

## When to Use Decision Summary

1. Use semantic elements first — native semantics beat ARIA
2. Add ARIA only when native insufficient
3. Keep accessibility tree logical — focus, live regions
4. One main element per page
5. Proper heading hierarchy always

---

## Anti-Patterns

```
❌ <div> for everything — div soup
✅ Use landmark elements: <header>, <main>, <nav>, <aside>, <footer>

❌ <b> and <i> for visual style
✅ <strong> (importance) and <em> (stress emphasis)

❌ Tables for layout
✅ Tables only for tabular data; CSS Grid for layout

❌ Skipping heading levels (h1 → h4)
✅ Sequential heading hierarchy — never skip levels

❌ Images with no alt text
✅ Always alt="description"; alt="" only for decorative images
```

---

## Quick Reference

| Element | Use for | Not for |
|---|---|---|
| `<article>` | Self-contained content | Generic containers |
| `<section>` | Thematic grouping with heading | Styling hooks |
| `<aside>` | Supplementary content | Sidebars by default |
| `<nav>` | Navigation links | Any list of links |
| `<figure>` | Image + caption pair | All images |
| `<time>` | Dates/times | Generic text |
| `<mark>` | Highlighted/searched text | Styling emphasis |
