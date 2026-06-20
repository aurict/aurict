---
name: professional-report-design
description: "Professional PDF Reports: IBM/McKinsey style, infographics, data visualization, perfect pagination, print-ready A4/Letter layouts."
triggers:
  extensions: [".html", ".pdf", ".pptx"]
  directories: ["reports/", "documents/", "pdf/", "presentation/"]
  keywords: ["pdf", "report", "professional", "document", "print", "infographic", "chart", "presentation"]
auto_load_when: "Creating professional PDF reports, executive summaries, data-driven presentations"
agent: document-creator
tools: ["Read", "Write", "Bash"]
---

# Professional Report Design (IBM/McKinsey Style)

**Focus:** Print-perfect PDF generation, infographics, professional layouts, data visualization

---

## 1. Core Philosophy

```
Every page is a canvas:
├── Cover → Executive Summary → Findings → Recommendations → Appendix
├── Every element must survive print (300 DPI, A4/Letter)
├── White space = luxury, not waste
└── Infographics > tables > text for complex data
```

---

## 2. A4 Page Architecture

```
A4 Page Layout (210mm x 297mm):
┌─────────────────────────────────────────────────────┐
│  Header (optional): Logo, report title, page info │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Main Content Area                                  │
│  - Full width: 160mm (25mm margins each side)      │
│  - Two columns: 77mm each + 6mm gap                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Footer: Page N of M | Date | Confidentiality      │
└─────────────────────────────────────────────────────┘
```

---

## 3. IBM/McKinsey Design System

```css
:root {
  /* Primary Colors */
  --primary: #101828;         /* Deep charcoal - headings */
  --primary-light: #1E293B; /* Secondary headings */
  
  /* Brand Colors */
  --mckinsey-blue: #056DAE;  /* McKinsey blue */
  --ibm-blue: #0F62FE;       /* IBM blue */
  --accent-teal: #0D9488;    /* Accent for highlights */
  --accent-amber: #D97706;   /* Warning/attention */
  --accent-red: #DC2626;     /* Critical/alerts */
  
  /* Neutrals */
  --surface: #F8FAFC;        /* Background */
  --surface-alt: #F1F5F9;    /* Alternate background */
  --border: #E2E8F0;         /* Lines, dividers */
  --text: #1E293B;          /* Body text */
  --text-muted: #64748B;     /* Secondary text */
  --text-subtle: #94A3B8;    /* Tertiary, captions */
  
  /* Typography */
  --font-display: 'IBM Plex Sans', 'Inter', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', 'Fira Code', monospace;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
}

/* Page Setup */
@page {
  size: A4;
  margin: 20mm 25mm 18mm 25mm; /* Top, Right, Bottom, Left */
  
  @bottom-left {
    content: element(footer);
  }
  @bottom-right {
    content: counter(page) " / " counter(pages);
    font-size: 9pt;
    color: var(--text-subtle);
  }
}
```

---

## 4. Typography System

```css
/* Headings */
h1 {
  font-family: var(--font-display);
  font-size: 26pt;
  font-weight: 700;
  color: var(--primary);
  line-height: 1.2;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 3px solid var(--mckinsey-blue);
}

h2 {
  font-family: var(--font-display);
  font-size: 18pt;
  font-weight: 600;
  color: var(--primary-light);
  margin: 32px 0 12px 0;
  letter-spacing: -0.02em;
}

h3 {
  font-family: var(--font-display);
  font-size: 13pt;
  font-weight: 600;
  color: var(--mckinsey-blue);
  margin: 20px 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Body */
p {
  font-family: var(--font-display);
  font-size: 10.5pt;
  line-height: 1.65;
  color: var(--text);
  margin: 0 0 12px 0;
  text-align: justify;
}

/* Captions */
.caption {
  font-size: 9pt;
  color: var(--text-muted);
  line-height: 1.4;
}

/* Label */
.label {
  font-size: 8pt;
  font-weight: 600;
  color: var(--text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

---

## 5. Infographic Components

### 5.1 Metric Card (Key Insight)

```html
<div class="metric-card">
  <div class="metric-value">47%</div>
  <div class="metric-label">Cost Reduction</div>
  <div class="metric-context">vs. Industry Average</div>
</div>

<style>
.metric-card {
  display: inline-block;
  background: var(--primary);
  color: #fff;
  padding: 20px 28px;
  border-radius: 4px;
  text-align: center;
  break-inside: avoid;
}
.metric-value {
  font-size: 36pt;
  font-weight: 700;
  line-height: 1;
}
.metric-label {
  font-size: 11pt;
  font-weight: 600;
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.metric-context {
  font-size: 9pt;
  opacity: 0.8;
  margin-top: 4px;
}
</style>
```

### 5.2 Progress Ring

```html
<div class="progress-ring">
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" stroke-width="8"/>
    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--mckinsey-blue)" 
            stroke-width="8" stroke-dasharray="283" stroke-dashoffset="70"/>
  </svg>
  <span class="progress-value">75%</span>
</div>
```

### 5.3 Comparison Bar

```html
<div class="comparison-bar">
  <div class="bar-row">
    <span class="bar-label">Current State</span>
    <div class="bar-track"><div class="bar-fill" style="width: 35%"></div></div>
    <span class="bar-value">35%</span>
  </div>
  <div class="bar-row">
    <span class="bar-label">Target State</span>
    <div class="bar-track"><div class="bar-fill target" style="width: 78%"></div></div>
    <span class="bar-value">78%</span>
  </div>
</div>
```

---

## 6. Data Visualization

### 6.1 Simple Bar Chart (CSS-only)

```html
<div class="chart-container">
  <h4>Revenue by Region (USD Millions)</h4>
  <div class="bar-chart">
    <div class="bar-item">
      <span class="bar-label">North America</span>
      <div class="bar-wrapper"><div class="bar" style="width: 92%"></div></div>
      <span class="bar-value">$42.5M</span>
    </div>
    <div class="bar-item">
      <span class="bar-label">Europe</span>
      <div class="bar-wrapper"><div class="bar" style="width: 68%"></div></div>
      <span class="bar-value">$31.2M</span>
    </div>
    <div class="bar-item">
      <span class="bar-label">Asia Pacific</span>
      <div class="bar-wrapper"><div class="bar" style="width: 54%"></div></div>
      <span class="bar-value">$24.8M</span>
    </div>
  </div>
</div>
```

### 6.2 Timeline

```html
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-marker"></div>
    <div class="timeline-date">Q1 2024</div>
    <div class="timeline-content">
      <h4>Assessment Complete</h4>
      <p>Initial baseline analysis and stakeholder interviews</p>
    </div>
  </div>
  <div class="timeline-item">
    <div class="timeline-marker"></div>
    <div class="timeline-date">Q2 2024</div>
    <div class="timeline-content">
      <h4>Implementation Started</h4>
      <p>Phase 1 rollout to pilot markets</p>
    </div>
  </div>
</div>
```

---

## 7. Table Patterns

### 7.1 Executive Summary Table

```html
<table class="executive-table">
  <thead>
    <tr>
      <th>Metric</th>
      <th>Current</th>
      <th>Target</th>
      <th>Change</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Customer Satisfaction</td>
      <td>72%</td>
      <td>85%</td>
      <td class="positive">+13%</td>
    </tr>
    <tr>
      <td>Operating Cost</td>
      <td>$4.2M</td>
      <td>$3.1M</td>
      <td class="positive">-26%</td>
    </tr>
  </tbody>
</table>
```

---

## 8. Page Overflow Prevention (CRITICAL)

### 8.1 The Golden Rules

```css
/* NEVER split these across pages */
.no-break, 
.table, 
figure, 
.chart-container,
.infographic,
.metric-card,
.callout-box,
.key-insight {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Keep paragraphs together */
p {
  orphans: 3;   /* Min 3 lines at bottom of page */
  widows: 3;    /* Min 3 lines at top of page */
}

/* Images max-width */
img, svg {
  max-width: 100%;
  max-height: 180mm; /* Prevent tall images */
  object-fit: contain;
}
```

### 8.2 Long Tables

```css
/* For tables longer than half a page */
table.long-table {
  font-size: 9pt;
}

table.long-table thead {
  position: sticky;
  top: 0;
}

/* Table row keeps together */
table tbody tr {
  break-inside: avoid;
}
```

### 8.3 Section Break Strategy

```css
/* Major sections get new page */
.section-intro {
  break-before: page;
}

.section-findings {
  break-before: page;
}

.section-appendix {
  break-before: page;
}

/* Subsections stay on same page when possible */
h2 {
  break-after: avoid;
  page-break-after: avoid;
}
```

---

## 9. Professional Layouts

### 9.1 Cover Page

```html
<div class="cover-page">
  <div class="cover-header-bar"></div>
  
  <div class="cover-logo">
    <img src="logo.svg" style="height: 40px;"/>
  </div>
  
  <div class="cover-title-block">
    <div class="cover-category">STRATEGIC ASSESSMENT</div>
    <h1>Digital Transformation<br/>Initiative 2024</h1>
    <div class="cover-subtitle">Executive Summary & Recommendations</div>
  </div>
  
  <div class="cover-meta">
    <div class="meta-row">
      <span class="meta-label">Prepared for</span>
      <span class="meta-value">Executive Leadership Team</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Date</span>
      <span class="meta-value">May 2024</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Classification</span>
      <span class="meta-value">CONFIDENTIAL</span>
    </div>
  </div>
  
  <div class="cover-footer-bar">
    <span>Aurict Analytics</span>
  </div>
</div>
```

### 9.2 Executive Summary (2-column)

```html
<div class="two-column">
  <div class="column">
    <h3>Key Findings</h3>
    <ul class="summary-list">
      <li><strong>73%</strong> of processes require automation</li>
      <li><strong>$2.4M</strong> potential annual savings identified</li>
      <li><strong>8 weeks</strong> estimated implementation timeline</li>
    </ul>
  </div>
  <div class="column">
    <h3>Recommendations</h3>
    <ul class="summary-list">
      <li>Implement RPA for finance operations</li>
      <li>Consolidate vendor contracts</li>
      <li>Establish Center of Excellence</li>
    </ul>
  </div>
</div>
```

---

## 10. Playwright PDF Generation

```typescript
import { chromium } from 'playwright';

interface PDFOptions {
  format?: 'A4' | 'Letter';
  margin?: { top: string; right: string; bottom: string; left: string };
  scale?: number;
}

async function generatePDF(html: string, outputPath: string, options: PDFOptions = {}) {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']  // For server environments
  });
  
  const page = await browser.newPage({
    viewport: { width: 2480, height: 3508 },  // A4 at 300 DPI
  });
  
  // Set content with proper viewport
  await page.setContent(html, { 
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  
  // Generate PDF
  await page.pdf({
    path: outputPath,
    format: options.format || 'A4',
    printBackground: true,
    scale: 1,
    margin: options.margin || {
      top: '20mm',
      right: '25mm', 
      bottom: '18mm',
      left: '25mm'
    },
    preferCSSPageSize: true,
  });
  
  await browser.close();
}
```

---

## 11. Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| Text cuts off mid-sentence | Add `orphans: 3; widows: 3;` to paragraphs |
| Table header repeats on each page | Use `<thead>` with `position: sticky` |
| Image too large/broken | Set `max-height: 170mm; object-fit: contain` |
| Footer overlaps content | Increase bottom margin in `@page` |
| Colors wrong in print | Add `print-color-adjust: exact` to colored elements |
| Chinese/Japanese fonts missing | Embed as WOFF2 base64 or use system fonts |
| Charts look blurry | Use SVG instead of PNG, 2x resolution |
| Page numbers wrong | Use CSS counters: `counter(pages)` |

---

## 12. Quick Reference

| Element | CSS Property | Value |
|---------|--------------|-------|
| Page size | `@page size` | A4 (210 × 297mm) |
| Margins | `@page margin` | 20mm 25mm 18mm 25mm |
| No page break | `break-inside` | avoid |
| New page | `break-before` | page |
| Keep together | `break-after` | avoid |
| Orphan lines | `orphans` | 3 |
| Widow lines | `widows` | 3 |
| Print colors | `print-color-adjust` | exact |

---

## Anti-Patterns

| ❌ Never Do | ✅ Do Instead |
|------------|---------------|
| Fixed heights in mm for text containers | Use min-height or let content expand |
| Position: fixed for headers | Use @page margin boxes |
| overflow: hidden on main containers | Use break-inside: avoid on children |
| Images larger than 170mm | Scale down, use object-fit: contain |
| Different margins per page | Use consistent @page margins |
| Screen-only @media for print | Write print-first CSS by default |
| PNG for charts at 72 DPI | Use SVG or 300 DPI PNG |
| External fonts via @import | Embed as base64 WOFF2 |
