---
name: html-to-pdf
description: "HTML → PDF pipeline using Playwright. A4, print-optimized, page-overflow-free professional documents."
triggers:
  keywords: ["pdf", "html to pdf", "playwright pdf", "print pdf", "generate pdf", "render pdf"]
auto_load_when: "Generating or rendering PDF documents from HTML content via Playwright"
agent: code
tools: ["Read", "Write", "Bash"]
---

# Skill: html-to-pdf

Professional document generation via HTML → PDF pipeline using Playwright.
Always produces A4, print-optimized, page-overflow-free documents.

---

## Core Principle

Never use a PDF library directly. Render HTML with a real browser (Playwright) — full CSS support, pixel-perfect layout, zero font issues.

```
Content (MD/JSON) → HTML Template → Playwright → PDF
```

---

## Quick Reference

| Task | Approach |
|---|---|
| A4 sizing | `@page { size: A4; margin: 20mm 25mm; }` |
| Prevent content split | `break-inside: avoid` on cards, tables, figures |
| Force new page | `break-before: page` on major sections |
| Hide screen-only elements | `@media print { .no-print { display: none; } }` |
| Page numbers | CSS counter via `@page` + `content: counter(page)` |
| Background colors print | `print-color-adjust: exact; -webkit-print-color-adjust: exact` |
| Playwright PDF call | `page.pdf({ format: 'A4', printBackground: true, margin: {...} })` |

## Layout Structure

```
┌─────────────────────────────────┐  ← Cover page (full A4)
│  Logo   Title   Date            │
│  Subtitle / Client              │
└─────────────────────────────────┘
┌─────────────────────────────────┐  ← TOC page
│  Table of Contents              │
└─────────────────────────────────┘
┌─────────────────────────────────┐  ← Content pages
│  Section Header                 │
│  Body text / tables / charts    │
│                     Page N / M  │
└─────────────────────────────────┘
```

## IBM/McKinsey CSS Foundation

```css
:root {
  --primary:   #051C2C;   /* McKinsey dark navy */
  --accent:    #0F62FE;   /* IBM blue */
  --surface:   #F4F4F4;
  --border:    #E0E0E0;
  --text:      #161616;
  --muted:     #6F6F6F;
  --font:      'IBM Plex Sans', 'Inter', system-ui, sans-serif;
}

@page {
  size: A4;
  margin: 20mm 25mm 22mm 25mm;
  @bottom-right {
    content: counter(page) " / " counter(pages);
    font-size: 9pt;
    color: var(--muted);
  }
}

body { font-family: var(--font); font-size: 11pt; color: var(--text);
       line-height: 1.55; }

h1 { font-size: 24pt; font-weight: 700; color: var(--primary);
     border-bottom: 3px solid var(--accent); padding-bottom: 8px; }
h2 { font-size: 16pt; font-weight: 600; color: var(--primary); margin-top: 24px; }
h3 { font-size: 12pt; font-weight: 600; color: var(--accent); }

table { width: 100%; border-collapse: collapse; break-inside: avoid; }
thead { background: var(--primary); color: #fff; }
th, td { padding: 8px 12px; text-align: left; border: 1px solid var(--border); }
tr:nth-child(even) { background: var(--surface); }

.callout { background: var(--surface); border-left: 4px solid var(--accent);
           padding: 12px 16px; margin: 16px 0; break-inside: avoid; }
.page-break { break-before: page; }
```

## Playwright Render

```typescript
import { chromium } from 'playwright';

async function renderPDF(html: string, outputPath: string) {
  const browser = await chromium.launch();
  const page    = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle' });

  await page.pdf({
    path:            outputPath,
    format:          'A4',
    printBackground: true,
    margin: { top: '20mm', right: '25mm', bottom: '22mm', left: '25mm' },
    displayHeaderFooter: false,   // handled by CSS @page
  });

  await browser.close();
}
```

## Page Overflow Prevention

```css
/* Never let these elements split across pages */
.no-break, table, figure, .callout, .stat-block {
  break-inside: avoid;
}

/* Long text blocks: allow breaks but keep context */
p { orphans: 3; widows: 3; }

/* Images: scale to fit, never overflow */
img { max-width: 100%; height: auto; }

/* Code blocks: scroll on screen, wrap in print */
@media print {
  pre { white-space: pre-wrap; word-break: break-all; }
}
```

## Cover Page Template

```html
<div class="cover" style="
  height: 277mm; display: flex; flex-direction: column;
  justify-content: space-between; break-after: page;">

  <div class="cover-header" style="
    background: var(--primary); color: #fff;
    padding: 32px; display: flex; justify-content: space-between;">
    <span class="org-name">{{orgName}}</span>
    <span class="date">{{date}}</span>
  </div>

  <div class="cover-body" style="padding: 48px; flex: 1;">
    <div class="eyebrow" style="color: var(--accent); font-size: 11pt; 
         text-transform: uppercase; letter-spacing: 0.1em;">{{category}}</div>
    <h1 style="font-size: 32pt; margin-top: 16px;">{{title}}</h1>
    <p style="font-size: 14pt; color: var(--muted); margin-top: 8px;">{{subtitle}}</p>
  </div>

  <div class="cover-footer" style="
    background: var(--surface); padding: 20px 32px;
    border-top: 3px solid var(--accent);">
    <span style="color: var(--muted); font-size: 9pt;">CONFIDENTIAL</span>
  </div>
</div>
```

---

## Anti-Patterns

| ❌ Don't | ✅ Do instead |
|---|---|
| Use `position: fixed` for headers | Use `@page` margin boxes |
| Set `overflow: hidden` on containers | Use `break-inside: avoid` |
| Use `px` units for print margins | Always use `mm` or `pt` |
| Rely on screen CSS for print | Write separate `@media print` rules or print-first CSS |
| Use `window.print()` for automation | Use Playwright `page.pdf()` |
| Use external fonts with `@import` | Embed fonts as base64 or use system fonts |
| Generate PDF from React component directly | Render to static HTML first, then PDF |
| Fixed pixel heights on sections | Use `min-height` or `padding` instead |
