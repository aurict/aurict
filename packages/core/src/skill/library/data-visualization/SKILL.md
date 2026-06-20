---
name: data-visualization
description: "Chart types, library selection, responsive design, and accessibility patterns for data visualization." 
triggers:
  extensions: [".tsx", ".ts"]
  keywords: ["chart", "graph", "d3", "recharts", "nivo", "echarts", "visualization", "plot", "dashboard"]
auto_load_when: "Building charts or data visualizations"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Data Visualization Patterns

## 1. Chart Type Selection

```
Which chart to use?

Comparison:
├── Bar chart: Categorical comparisons, simple
├── Column chart: Time-based comparisons
├── Grouped/stacked: Multi-variable comparison
└── Bullet chart: Target vs actual

Distribution:
├── Histogram: Binned frequency
├── Box plot: Quartiles, outliers
├── Density plot: Continuous distribution
└── Violin plot: Distribution shape

Composition:
├── Pie/donut: Parts of whole (<6 segments)
├── Stacked area: Over time, trend emphasis
├── Treemap: Hierarchical composition
└── Sankey: Flow between states

Relationship:
├── Scatter: Two continuous variables
├── Bubble: Three continuous variables
├── Line: Continuous over time (trend)
└── Heatmap: Matrix relationships

Part-to-whole:
├── Donut: Simple, limited categories
├── Treemap: Hierarchical, many items
└── Sunburst: Multi-level drill-down
```

## 2. Library Selection

```
Library decision tree:

Small/simple (< 10kb):
├── Chart.js: Quick, canvas-based
├── ApexCharts: Good defaults, animations
└── Recharts: React-only, SVG-based

Medium/features:
├── ECharts: Powerful, many chart types
├── Nivo: React, highly customizable
└── Victory: React, declarative

Enterprise/advanced:
├── D3.js: Maximum control, steep learning
├── Highcharts: Commercial, excellent support
└── Plotly: Scientific, Python/JS

Framework-specific:
├── React: Recharts, Nivo, Visx
├── Vue: Vue-chartjs, ECharts wrapper
└── Angular: ngx-charts, Highcharts
```

## 3. Responsive Patterns

```
Responsive strategy:
├── Aspect ratio: Maintain proportions
├── Mobile breakdown:
│   ├── Simplify: Fewer data points
│   ├── Scroll/zoom: Interaction patterns
│   ├── Touch: Larger touch targets
│   └── Labels: Abbreviate or hide
├── Breakpoints: 480px, 768px, 1024px
└── Debounce resize: Performance
```

## 4. Accessibility Patterns

```
Visual accessibility:
├── Color: Don't rely on color alone
│   ├── Add patterns/textures
│   ├── Use labeled legend
│   └── Provide data table alternative
├── Contrast: WCAG 4.5:1 minimum
├── Labels: Axis labels, data labels
└── Font size: 12px minimum

Screen reader:
├── ARIA labels on charts
├── Data table fallback
├── Role="img" with description
└── Announce updates via aria-live
```

## 5. Interaction Patterns

```
Interactions to consider:
├── Tooltip: Hover details
├── Click: Drill-down, selection
├── Zoom/pan: Large datasets
├── Filter: Cross-filtering
├── Export: PNG/SVG download
└── Legend toggle: Show/hide series
```

## 6. Performance Patterns

```
Large datasets (>1000 points):
├── Sampling: Show subset, aggregate
├── Canvas: Better than SVG for many points
├── Virtualization: Only render visible
├── WebGL: For 3D or massive datasets
└── Aggregation: Server-side rollups
```

## 7. Animation Patterns

```
When to animate:
├── Initial load: Context setting
├── Update: Data changes, transitions
└── Highlight: Focus attention

When to avoid:
├── Real-time streaming: Choppy
├── Accessibility: Motion sensitivity
└── Print: No animation support
```

## 8. Design System Integration

```
Consistency checklist:
├── Colors: Use design system palette
├── Typography: Match body/headings
├── Spacing: Consistent padding/margins
├── Grid: Align to 8px baseline
└── Components: Reusable chart wrapper
```

## Key Patterns

1. **Start with data** - Know data shape before choosing chart
2. **Mobile-first** - Design for mobile, enhance for desktop
3. **Accessibility first** - A11y is harder to retrofit
4. **Progressive enhancement** - Static first, then interactive
5. **Test with data** - Use real data volumes in testing

---

## Anti-Patterns

```
❌ Rendering 100,000 SVG elements directly in DOM
✅ Canvas or WebGL for large datasets; virtualize SVG lists

❌ Pie charts for comparing more than 4 values
✅ Bar chart for comparison; pie only for part-of-whole with <4 segments

❌ Dual Y-axis charts (misleading scale)
✅ Two separate charts or normalized data

❌ No loading state during data fetch
✅ Skeleton/placeholder chart while data loads

❌ Color as the only differentiator (accessibility)
✅ Color + pattern/shape; check contrast with colorblind simulation
```

---

## Quick Reference

| Chart type | When to use | Library |
|---|---|---|
| Bar | Comparison | Recharts / Chart.js |
| Line | Trend over time | Recharts / D3 |
| Scatter | Correlation | D3 / Observable Plot |
| Heatmap | 2D density | D3 |
| Treemap | Hierarchical part-of-whole | D3 |
| Large data | WebGL rendering | deck.gl / regl |

---

## Decision Tree

```
Which chart type?
├── Compare categories                 → Bar chart (horizontal for long labels)
├── Trend over time                    → Line chart
├── Part-of-whole (≤4 segments)        → Donut chart
├── Part-of-whole (many / nested)      → Treemap
├── Correlation between two variables  → Scatter plot
├── Distribution of values             → Histogram or Box plot
└── Two continuous + one size variable → Bubble chart

Which library?
├── React + simple bar/line/pie        → Recharts (SVG, composable)
├── React + highly customizable        → Nivo
├── Complex custom visualization       → D3.js (maximum control)
├── Large dataset (>10k points)        → Canvas-based (Chart.js) or deck.gl
└── Quick prototyping / dashboards     → Apache ECharts

Performance concern?
├── < 500 data points                  → SVG (Recharts / Nivo)
├── 500–10k points                     → Canvas (Chart.js)
├── > 10k points                       → WebGL (deck.gl / regl)
└── Dynamic real-time stream           → Canvas + requestAnimationFrame

Data still loading?
└── Show skeleton/placeholder chart — never empty space
```

---

## Key Rules

1. Pick chart type based on the relationship in the data, not aesthetics
2. Never use pie/donut for more than 4 segments — bar chart is always clearer
3. Never use dual Y-axis — creates misleading scale comparisons; use two charts instead
4. Color is never the only differentiator — add pattern, shape, or text label (colorblind accessible)
5. SVG for < 500 points; Canvas for 500–10k; WebGL beyond that
6. Always provide a data table fallback for screen readers (`role="img"` + `aria-label`)
7. Memoize data transforms — never re-compute in render; `useMemo` or server-side rollup

---

## Implementation

```tsx
// Recharts line chart with loading skeleton + accessibility
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartData { date: string; value: number }

function MetricsChart({ data, isLoading }: { data: ChartData[]; isLoading: boolean }) {
  if (isLoading) {
    return <div className="h-64 bg-gray-100 animate-pulse rounded" aria-label="Loading chart" />
  }

  return (
    <figure aria-label="Daily metrics trend">
      <ResponsiveContainer width="100%" height={256}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8 }}
            formatter={(value: number) => [value.toLocaleString(), 'Events']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Screen reader fallback */}
      <table className="sr-only" aria-label="Chart data table">
        <thead><tr><th>Date</th><th>Value</th></tr></thead>
        <tbody>{data.map(d => <tr key={d.date}><td>{d.date}</td><td>{d.value}</td></tr>)}</tbody>
      </table>
    </figure>
  )
}
```
