---
name: professional-pptx-design
description: "Professional PPTX: IBM/McKinsey style, charts, infographics, master slides, speaker notes, exact page dimensions."
triggers:
  extensions: [".pptx", ".pptm"]
  directories: ["presentation/", "slides/", "deck/"]
  keywords: ["pptx", "powerpoint", "slides", "presentation", "deck", "pptxgenjs"]
auto_load_when: "Creating executive presentations, slide decks, business presentations"
agent: document-creator
tools: ["Read", "Write", "Bash"]
---

# Professional PPTX Design (IBM/McKinsey Style)

**Focus:** Exact dimensions, master slides, charts, infographics, speaker notes

---

## 1. Core Dimensions (CRITICAL)

Every element is positioned in **inches**. Always use exact dimensions:

```
Standard Dimensions:
├── 16:9 (Widescreen)   → 10" × 5.625"  (DEFAULT - use this)
├── 4:3 (Standard)     → 10" × 7.5"
├── A4 (Portrait)      → 7.5" × 10"
└── A4 (Landscape)     → 10" × 7.5"
```

```typescript
// SETUP - ALWAYS FIRST
const pptx = new PptxGenJS();

// Default: 16:9 widescreen
pptx.layout = 'LAYOUT_16x9';  // 10" × 5.625"

// For 4:3 standard
pptx.layout = 'LAYOUT_4x3';    // 10" × 7.5"

// For A4
pptx.layout = 'LAYOUT_610x792'; // Letter size
```

---

## 2. IBM/McKinsey Theme System

```typescript
const THEME = {
  // Primary Colors
  primary: '101828',         // Deep charcoal - headings
  primaryLight: '1E293B',     // Secondary headings
  
  // Brand Colors
  mckinseyBlue: '056DAE',     // McKinsey blue
  ibmBlue: '0F62FE',         // IBM blue
  teal: '0D9488',            // Success/positive
  amber: 'D97706',           // Warning/attention
  red: 'DC2626',             // Critical/negative
  
  // Neutrals
  surface: 'F8FAFC',         // Slide background
  surfaceAlt: 'F1F5F9',     // Card backgrounds
  border: 'E2E8F0',          // Lines, dividers
  text: '1E293B',           // Body text
  textMuted: '64748B',      // Secondary text
  textSubtle: '94A3B8',     // Tertiary, notes
  
  // White
  white: 'FFFFFF',
  
  // Fonts
  font: 'IBM Plex Sans',
  fontFallback: 'Calibri',
};

// Slide dimensions
const SLIDE = { w: 10, h: 5.625 };  // 16:9
```

---

## 3. Slide Structure (Header/Footer)

```typescript
// Standard slide header + footer (ALWAYS USE)
function addSlideHeader(slide: Slide, options: {
  sectionLabel?: string;
  title: string;
  pageNum?: string;
  totalPages?: string;
}) {
  // Header bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 0.45,
    fill: { color: THEME.primary }
  });
  
  // Section label (left)
  if (options.sectionLabel) {
    slide.addText(options.sectionLabel.toUpperCase(), {
      x: 0.2, y: 0.1, w: 4, h: 0.25,
      fontSize: 8, fontFace: THEME.font, color: THEME.white,
      bold: true, letterSpacing: 1
    });
  }
  
  // Page number (right)
  if (options.pageNum && options.totalPages) {
    slide.addText(`${options.pageNum} / ${options.totalPages}`, {
      x: 8.5, y: 0.1, w: 1.3, h: 0.25,
      fontSize: 8, fontFace: THEME.font, color: THEME.white,
      align: 'right'
    });
  }
  
  // Title
  slide.addText(options.title, {
    x: 0.4, y: 0.55, w: 9.2, h: 0.7,
    fontSize: 24, fontFace: THEME.font, color: THEME.primary,
    bold: true
  });
  
  // Accent line under title
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 1.2, w: 2, h: 0.03,
    fill: { color: THEME.mckinseyBlue }
  });
}
```

---

## 4. Slide Types

### 4.1 Title Slide
```typescript
function addTitleSlide(pptx: PptxGenJS, options: {
  category: string;      // e.g., "STRATEGIC ASSESSMENT"
  title: string;        // Main title
  subtitle?: string;    // Optional subtitle
  date: string;         // e.g., "May 2024"
  preparedFor?: string; // e.g., "Executive Leadership Team"
}) {
  const slide = pptx.addSlide();
  
  // Full background
  slide.background = { color: THEME.primary };
  
  // Accent bar at bottom
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 5.325, w: 10, h: 0.3,
    fill: { color: THEME.mckinseyBlue }
  });
  
  // Category (top left)
  slide.addText(options.category, {
    x: 0.5, y: 0.4, w: 9, h: 0.3,
    fontSize: 10, fontFace: THEME.font, color: THEME.mckinseyBlue,
    bold: true, letterSpacing: 2
  });
  
  // Main title (center)
  slide.addText(options.title, {
    x: 0.5, y: 1.8, w: 9, h: 1.8,
    fontSize: 36, fontFace: THEME.font, color: THEME.white,
    bold: true, lineSpacingMultiple: 1.2
  });
  
  // Subtitle
  if (options.subtitle) {
    slide.addText(options.subtitle, {
      x: 0.5, y: 3.6, w: 9, h: 0.5,
      fontSize: 16, fontFace: THEME.font, color: THEME.textMuted
    });
  }
  
  // Prepared for
  if (options.preparedFor) {
    slide.addText(`Prepared for: ${options.preparedFor}`, {
      x: 0.5, y: 4.8, w: 5, h: 0.25,
      fontSize: 9, fontFace: THEME.font, color: THEME.textSubtle
    });
  }
  
  // Date (bottom right)
  slide.addText(options.date, {
    x: 7, y: 5.0, w: 2.5, h: 0.25,
    fontSize: 9, fontFace: THEME.font, color: THEME.textSubtle,
    align: 'right'
  });
}
```

### 4.2 Executive Summary Slide (2-Column)
```typescript
function addExecutiveSummary(pptx: PptxGenJS, options: {
  title: string;
  sectionLabel?: string;
  leftColumn: { heading: string; items: string[] };
  rightColumn: { heading: string; items: string[] };
}) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, { title: options.title, sectionLabel: options.sectionLabel });
  
  const colX = 0.5;
  const colW = 4.3;
  
  // Left column
  slide.addText(options.leftColumn.heading, {
    x: colX, y: 1.5, w: colW, h: 0.35,
    fontSize: 12, fontFace: THEME.font, color: THEME.mckinseyBlue, bold: true
  });
  
  options.leftColumn.items.forEach((item, i) => {
    slide.addText(item, {
      x: colX, y: 1.95 + (i * 0.55), w: colW, h: 0.45,
      fontSize: 10, fontFace: THEME.font, color: THEME.text,
      bullet: { type: 'bullet', code: '2022' }  // bullet char
    });
  });
  
  // Right column
  slide.addText(options.rightColumn.heading, {
    x: 5.4, y: 1.5, w: colW, h: 0.35,
    fontSize: 12, fontFace: THEME.font, color: THEME.mckinseyBlue, bold: true
  });
  
  options.rightColumn.items.forEach((item, i) => {
    slide.addText(item, {
      x: 5.4, y: 1.95 + (i * 0.55), w: colW, h: 0.45,
      fontSize: 10, fontFace: THEME.font, color: THEME.text,
      bullet: { type: 'bullet', code: '2022' }
    });
  });
}
```

### 4.3 KPI/Metric Slide
```typescript
function addKPISlide(pptx: PptxGenJS, options: {
  title: string;
  sectionLabel?: string;
  metrics: Array<{
    value: string;      // e.g., "47%"
    label: string;      // e.g., "Cost Reduction"
    delta?: string;     // e.g., "+13%"
    isPositive?: boolean;
  }>;
}) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, { title: options.title, sectionLabel: options.sectionLabel });
  
  const metricsPerRow = 3;
  const cardW = 2.8;
  const cardH = 2.2;
  const startX = 0.55;
  const gap = 0.35;
  const startY = 1.8;
  
  options.metrics.forEach((metric, i) => {
    const row = Math.floor(i / metricsPerRow);
    const col = i % metricsPerRow;
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + 0.3);
    
    // Card background
    slide.addShape(pptx.ShapeType.rect, {
      x, y, w: cardW, h: cardH,
      fill: { color: THEME.surfaceAlt },
      line: { color: THEME.border, width: 1 }
    });
    
    // Value (large)
    const valueColor = metric.delta 
      ? (metric.isPositive ? THEME.teal : THEME.red)
      : THEME.primary;
    slide.addText(metric.value, {
      x, y: y + 0.3, w: cardW, h: 1,
      fontSize: 40, fontFace: THEME.font, color: valueColor,
      bold: true, align: 'center'
    });
    
    // Label
    slide.addText(metric.label, {
      x, y: y + 1.35, w: cardW, h: 0.4,
      fontSize: 11, fontFace: THEME.font, color: THEME.text,
      align: 'center', bold: true
    });
    
    // Delta (if any)
    if (metric.delta) {
      slide.addText(metric.delta, {
        x, y: y + 1.8, w: cardW, h: 0.3,
        fontSize: 10, fontFace: THEME.font, color: valueColor,
        align: 'center'
      });
    }
  });
}
```

---

## 5. Charts (Bar, Pie, Line)

### 5.1 Bar Chart
```typescript
function addBarChart(slide: Slide, options: {
  title?: string;
  x: number; y: number; w: number; h: number;
  categories: string[];    // ['North America', 'Europe', 'Asia']
  values: number[];        // [42.5, 31.2, 24.8]
  unit?: string;          // 'M' for millions
  color?: string;         // bar color
}) {
  const chartOpts = {
    x: options.x, y: options.y, w: options.w, h: options.h,
    chartColors: [options.color || THEME.mckinseyBlue],
    barDir: 'col',
    barGrouping: 'clustered',
    showValue: true,
    dataLabels: {
      fontSize: 9,
      fontFace: THEME.font,
      color: THEME.text
    },
    catAxis: {
      fontSize: 9,
      fontFace: THEME.font,
      color: THEME.textMuted
    },
    valAxis: {
      fontSize: 9,
      fontFace: THEME.font,
      color: THEME.textMuted
    }
  };
  
  const chartData = options.categories.map((cat, i) => ({
    name: cat,
    labels: [cat],
    values: [options.values[i]]
  }));
  
  slide.addChart(pptx.Charts.BAR, chartData, chartOpts);
}
```

### 5.2 Pie/Donut Chart
```typescript
function addPieChart(slide: Slide, options: {
  x: number; y: number; w: number; h: number;
  segments: Array<{ name: string; value: number }>;
  title?: string;
  donut?: boolean;
}) {
  const chartData = options.segments.map(seg => ({
    name: seg.name,
    labels: [seg.name],
    values: [seg.value]
  }));
  
  slide.addChart(
    options.donut ? pptx.Charts.DOUGHNUT : pptx.Charts.PIE,
    chartData, {
      x: options.x, y: options.y, w: options.w, h: options.h,
      showLabel: true,
      showPercent: true,
      legendPos: 'b',
      legendFontSize: 9,
      chartColors: [
        THEME.mckinseyBlue,
        THEME.ibmBlue,
        THEME.teal,
        THEME.amber,
        THEME.red,
        THEME.primaryLight
      ]
    }
  );
}
```

---

## 6. Speaker Notes (IMPORTANT)

Every slide should have speaker notes for presentation:

```typescript
function addSpeakerNotes(slide: Slide, notes: string) {
  slide.addNotes(notes);
}
```

Example usage:
```typescript
const slide = pptx.addSlide();
addSlideHeader(slide, { title: 'Key Findings', sectionLabel: 'ANALYSIS' });

slide.addText('First finding point...', { x: 0.5, y: 1.5, w: 9, h: 3 });

// Speaker notes
slide.addNotes(`
KEY MESSAGES:
- Emphasize that this represents a 47% improvement
- Note that implementation took 8 weeks
- Mention stakeholder alignment was critical

TALKING POINTS:
- "We observed significant variance..."
- "The data suggests..."
- Transition to next slide: "Now let's look at the financial impact..."
`);
```

---

## 7. Master Slide (Background Logo)

```typescript
// Add master slide with logo watermark
pptx.defineSlideMaster({
  title: 'MASTER_SLIDE',
  background: { color: THEME.surface },
  objects: [
    // Logo in top left (subtle)
    {
      rect: {
        x: 0.5, y: 0.15, w: 1.2, h: 0.4,
        fill: { color: THEME.primary, transparency: 30 }
      }
    },
    // Footer line
    {
      rect: {
        x: 0, y: 5.45, w: 10, h: 0.02,
        fill: { color: THEME.border }
      }
    },
    // Footer text
    {
      text: {
        text: 'CONFIDENTIAL',
        x: 0.4, y: 5.48, w: 2, h: 0.15,
        fontSize: 7, fontFace: THEME.font, color: THEME.textSubtle
      }
    }
  ]
});
```

---

## 8. Common Layouts Reference

```
16:9 Slide Layout (10" × 5.625"):
┌──────────────────────────────────────────────────────┐
│ [HEADER BAR - 0.45"]                                  │
│  SECTION LABEL                    PAGE NUM             │
├──────────────────────────────────────────────────────┤
│                                                        │
│ [TITLE - 0.7"]                                        │
│  Accent line                                           │
│                                                        │
│ [CONTENT ZONE - 4.0"]                                  │
│  - Text: 0.5" margin, 9" width                        │
│  - Charts: fit to content area                         │
│  - Tables: max width 9"                               │
│                                                        │
├──────────────────────────────────────────────────────┤
│ [FOOTER - 0.3"]                                        │
│  Source / Key takeaway                                 │
└──────────────────────────────────────────────────────┘

Spacing between elements:
- Title to content: 0.3"
- Content elements: 0.25"
- Content to footer: 0.3"
```

---

## 9. Quick Reference

| Task | Code |
|---|---|
| New presentation | `const pptx = new PptxGenJS()` |
| Set 16:9 layout | `pptx.layout = 'LAYOUT_16x9'` |
| Add slide | `const slide = pptx.addSlide()` |
| Title text | `slide.addText(text, { x, y, w, h, fontSize, bold, color })` |
| Shape | `slide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill })` |
| Chart | `slide.addChart(pptx.Charts.BAR, data, options)` |
| Image | `slide.addImage({ path: 'logo.png', x, y, w, h })` |
| Table | `slide.addTable(rows, { x, y, w, colW, fontSize })` |
| Speaker notes | `slide.addNotes('Speaker notes here')` |
| Save | `await pptx.writeFile({ fileName: 'output.pptx' })` |

---

## 10. Anti-Patterns

| ❌ Never Do | ✅ Do Instead |
|------------|---------------|
| Use pixel dimensions | Always use inches (10 × 5.625) |
| Mix slide sizes in one deck | Consistent 16:9 throughout |
| Skip speaker notes | Add notes for every slide |
| 7+ bullet points per slide | Max 5 bullets, prefer 3 |
| No page numbers | Add N/M format on every content slide |
| Random font sizes | Title: 24pt, Body: 11pt, Label: 8pt |
| No section label | Header bar with section in caps |
| Use default PowerPoint themes | Use custom THEME with brand colors |
| Huge images | Compress or use vector (SVG) |
| No master slide | Use master for consistent branding |

---

## 11. Full Example: Complete Deck

```typescript
import PptxGenJS from 'pptxgenjs';

async function generateExecutiveDeck() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Aurict Analytics';
  pptx.title = 'Digital Transformation Initiative 2024';
  pptx.subject = 'Strategic Assessment';
  
  // Slide 1: Title
  addTitleSlide(pptx, {
    category: 'STRATEGIC ASSESSMENT',
    title: 'Digital Transformation\nInitiative 2024',
    subtitle: 'Executive Summary & Recommendations',
    date: 'May 2024',
    preparedFor: 'Executive Leadership Team'
  });
  
  // Slide 2: Executive Summary
  addExecutiveSummary(pptx, {
    title: 'Executive Summary',
    sectionLabel: 'OVERVIEW',
    leftColumn: {
      heading: 'Key Findings',
      items: [
        '73% of processes require automation',
        '$2.4M potential annual savings identified',
        '8 weeks estimated implementation timeline'
      ]
    },
    rightColumn: {
      heading: 'Recommendations',
      items: [
        'Implement RPA for finance operations',
        'Consolidate vendor contracts',
        'Establish Center of Excellence'
      ]
    }
  });
  
  // Slide 3: KPI Slide
  addKPISlide(pptx, {
    title: 'Key Performance Indicators',
    sectionLabel: 'METRICS',
    metrics: [
      { value: '47%', label: 'Cost Reduction', delta: '+13%', isPositive: true },
      { value: '92%', label: 'Employee Adoption', delta: '+8%', isPositive: true },
      { value: '3.2x', label: 'ROI (12 months)', delta: 'Target: 2.5x', isPositive: true }
    ]
  });
  
  // Slide 4: Chart Slide
  const chartSlide = pptx.addSlide();
  addSlideHeader(chartSlide, { title: 'Revenue by Region', sectionLabel: 'ANALYSIS' });
  addBarChart(chartSlide, {
    x: 0.5, y: 1.5, w: 9, h: 3.5,
    categories: ['North America', 'Europe', 'Asia Pacific', 'Latin America'],
    values: [42.5, 31.2, 24.8, 12.3],
    unit: 'M'
  });
  
  // Save
  await pptx.writeFile({ fileName: 'Executive_Deck_2024.pptx' });
}
```
