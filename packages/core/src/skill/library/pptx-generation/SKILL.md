---
name: pptx-generation
description: "Professional PowerPoint generation using pptxgenjs. McKinsey/IBM slide design: one idea per slide, 5-second test, programmatic .pptx output."
triggers:
  extensions: [".pptx", ".ppt"]
  directories: ["slides/", "presentations/", "decks/"]
  keywords: ["powerpoint", "pptx", "slide deck", "presentation", "pptxgenjs"]
auto_load_when: "Creating or generating PowerPoint presentations programmatically"
agent: code
tools: ["Read", "Write", "Bash"]
---

# Skill: pptx-generation

Professional PowerPoint generation using `pptxgenjs`. McKinsey/IBM slide design principles.

---

## Core Principle

One idea per slide. Every slide must pass the "5-second test" — key message readable in 5 seconds. Use pptxgenjs for programmatic .pptx; use HTML-to-PDF for slide handouts.

---

## Quick Reference

| Task | Code |
|---|---|
| New presentation | `const pptx = new PptxGenJS()` |
| Set layout | `pptx.layout = 'LAYOUT_16x9'` |
| Add slide | `const slide = pptx.addSlide()` |
| Title text | `slide.addText(text, { x, y, w, h, fontSize, bold, color })` |
| Image | `slide.addImage({ path, x, y, w, h })` |
| Table | `slide.addTable(rows, opts)` |
| Shape/divider | `slide.addShape(pptx.ShapeType.rect, { fill, line })` |
| Save file | `await pptx.writeFile({ fileName: 'output.pptx' })` |
| Inch units | All x/y/w/h in inches. 16x9 slide = 10" × 5.625" |

## Slide Architecture

```
┌─────────────────────────────────────────────────┐
│  ████ SECTION LABEL          Logo    Page N/M   │  ← Header bar (0.4")
├─────────────────────────────────────────────────┤
│                                                 │
│  Slide Title (24-28pt bold)                     │  ← Title zone (1.0")
│  Supporting context (12pt muted)                │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  ← Content zone
│  │  KPI     │  │  KPI     │  │  KPI     │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                 │
├─────────────────────────────────────────────────┤
│  Key Takeaway / Source note                     │  ← Footer (0.3")
└─────────────────────────────────────────────────┘
```

## McKinsey/IBM Slide Theme

```typescript
const THEME = {
  primary:   '051C2C',  // dark navy
  accent:    '0F62FE',  // IBM blue
  accent2:   '00B0FF',  // light blue
  surface:   'F4F4F4',
  text:      '161616',
  muted:     '8D8D8D',
  white:     'FFFFFF',
  font:      'IBM Plex Sans',
  fontFallback: 'Calibri',
};

// Slide dimensions (16:9)
const SLIDE = { w: 10, h: 5.625 };
```

## Slide Types

### Title Slide
```typescript
function addTitleSlide(pptx: PptxGenJS, title: string, subtitle: string, date: string) {
  const slide = pptx.addSlide();

  // Full-bleed background
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 5.625, fill: { color: THEME.primary }
  });
  // Accent bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 4.8, w: 10, h: 0.1, fill: { color: THEME.accent }
  });

  slide.addText(title, {
    x: 0.8, y: 1.5, w: 8.4, h: 1.5,
    fontSize: 36, bold: true, color: THEME.white, fontFace: THEME.font,
    valign: 'middle',
  });
  slide.addText(subtitle, {
    x: 0.8, y: 3.1, w: 8.4, h: 0.6,
    fontSize: 14, color: THEME.accent2, fontFace: THEME.font,
  });
  slide.addText(date, {
    x: 0.8, y: 5.1, w: 5, h: 0.3,
    fontSize: 9, color: THEME.muted, fontFace: THEME.font,
  });
}
```

### Content Slide with Header Bar
```typescript
function addContentSlide(pptx: PptxGenJS, opts: {
  title: string; body: string; sectionLabel?: string; pageNum?: string;
}) {
  const slide = pptx.addSlide();

  // Header bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 0.45, fill: { color: THEME.primary }
  });
  if (opts.sectionLabel) {
    slide.addText(opts.sectionLabel.toUpperCase(), {
      x: 0.2, y: 0.05, w: 6, h: 0.35,
      fontSize: 8, color: THEME.white, bold: true, fontFace: THEME.font,
    });
  }
  if (opts.pageNum) {
    slide.addText(opts.pageNum, {
      x: 8.5, y: 0.05, w: 1.3, h: 0.35,
      fontSize: 8, color: THEME.muted, align: 'right', fontFace: THEME.font,
    });
  }

  // Title
  slide.addText(opts.title, {
    x: 0.4, y: 0.6, w: 9.2, h: 0.8,
    fontSize: 22, bold: true, color: THEME.primary, fontFace: THEME.font,
  });

  // Body
  slide.addText(opts.body, {
    x: 0.4, y: 1.5, w: 9.2, h: 3.6,
    fontSize: 11, color: THEME.text, fontFace: THEME.font,
    valign: 'top', wrap: true,
  });
}
```

### KPI / Stats Slide
```typescript
function addKPISlide(pptx: PptxGenJS, title: string, kpis: Array<{value: string; label: string; delta?: string}>) {
  const slide = pptx.addSlide();
  const colW = 10 / kpis.length;

  kpis.forEach((kpi, i) => {
    const x = i * colW + 0.2;
    slide.addShape(pptx.ShapeType.rect, {
      x, y: 1.6, w: colW - 0.4, h: 2.5,
      fill: { color: THEME.surface }, line: { color: THEME.accent, width: 2 }
    });
    slide.addText(kpi.value, {
      x, y: 1.8, w: colW - 0.4, h: 1.2,
      fontSize: 36, bold: true, color: THEME.accent, align: 'center', fontFace: THEME.font,
    });
    slide.addText(kpi.label, {
      x, y: 3.0, w: colW - 0.4, h: 0.6,
      fontSize: 10, color: THEME.text, align: 'center', fontFace: THEME.font,
    });
  });
}
```

## Content Parsing Strategy

```typescript
// Parse markdown/text into slide objects
function parseToSlides(content: string): SlideData[] {
  const sections = content.split(/^## /m).filter(Boolean);
  return sections.map(section => {
    const [titleLine, ...bodyLines] = section.split('\n');
    return {
      title:   titleLine.trim(),
      body:    bodyLines.join('\n').trim(),
      type:    detectSlideType(bodyLines.join('\n')),  // 'kpi' | 'table' | 'text' | 'bullets'
    };
  });
}

function detectSlideType(body: string): SlideType {
  if (body.includes('|'))        return 'table';
  if (/\d+[%x]/.test(body))      return 'kpi';
  if (body.startsWith('- '))     return 'bullets';
  return 'text';
}
```

---

## Anti-Patterns

| ❌ Don't | ✅ Do instead |
|---|---|
| Put 5+ bullet points on one slide | 3 bullets max — split into multiple slides |
| Use pixel units | Use inches — pptxgenjs is inch-based |
| Embed huge images as raw paths | Convert to base64 or use relative paths |
| One giant text dump per slide | Title + 3 key points + supporting visual |
| All caps everywhere | Only section labels in caps |
| Use `writeFile` without await | Always await `pptx.writeFile()` |
| Hardcode content strings | Parse from structured input (MD, JSON) |
| Mix font sizes randomly | Stick to: 36pt KPI, 22pt title, 11pt body, 8pt label |
