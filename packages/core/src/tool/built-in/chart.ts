import { z } from "zod"
import { join } from "node:path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { renderHtmlToImage } from "./_browser-renderer.js"

const DatasetSchema = z.object({
  label:           z.string().optional(),
  data:            z.array(z.number()),
  backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
  borderColor:     z.union([z.string(), z.array(z.string())]).optional(),
  borderWidth:     z.number().optional(),
})

export const chartTool: ToolDef = {
  id: "chart",
  description: `Generate a chart image (PNG) from data using Chart.js.

SUPPORTED TYPES: bar, line, pie, doughnut, scatter, radar, polarArea

USE FOR:
- Visualizing data for reports and presentations
- Creating charts to embed in PDFs or slide decks
- Quick data exploration

REQUIRES: Chromium/Chrome installed.

EXAMPLE:
{
  type: "bar",
  labels: ["Q1", "Q2", "Q3", "Q4"],
  datasets: [{ label: "Revenue", data: [120, 145, 132, 178] }],
  title: "Quarterly Revenue"
}`,

  parameters: z.object({
    output_path: z.string().describe("Absolute path for output PNG file"),
    type:   z.enum(["bar","line","pie","doughnut","scatter","radar","polarArea"]).default("bar"),
    labels: z.array(z.string()).optional().describe("X-axis labels / pie slice labels"),
    datasets: z.array(DatasetSchema).min(1),
    title:    z.string().optional(),
    width:    z.number().default(900).describe("Chart width in pixels"),
    height:   z.number().default(500).describe("Chart height in pixels"),
    theme:    z.enum(["light","dark"]).default("light"),
    legend:   z.boolean().default(true),
    stacked:  z.boolean().default(false).describe("Stacked bars/lines"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const width  = Number(args["width"]  ?? 900)
    const height = Number(args["height"] ?? 500)
    const theme  = String(args["theme"]  ?? "light")
    const type   = String(args["type"]   ?? "bar")
    const title  = args["title"] ? String(args["title"]) : undefined
    const stacked = Boolean(args["stacked"])
    const legend  = Boolean(args["legend"] ?? true)
    const datasets = args["datasets"] as Array<z.infer<typeof DatasetSchema>>
    const labels   = args["labels"] as string[] | undefined

    const isDark   = theme === "dark"
    const bgColor  = isDark ? "#1a1a2e" : "#ffffff"
    const textColor = isDark ? "#e0e0e0" : "#333333"
    const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"

    // Default color palette
    const palette = [
      "#2563EB","#16A34A","#DC2626","#D97706","#7C3AED",
      "#0891B2","#DB2777","#65A30D","#EA580C","#9333EA",
    ]

    // Auto-assign colors if not specified
    const coloredDatasets = datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: ds.backgroundColor ?? (type === "pie" || type === "doughnut"
        ? palette.slice(0, (ds.data ?? []).length)
        : palette[i % palette.length]!),
      borderColor: ds.borderColor ?? (type === "line" ? palette[i % palette.length]! : undefined),
      borderWidth: ds.borderWidth ?? (type === "line" ? 2 : 1),
      fill: type === "line" ? false : undefined,
      tension: type === "line" ? 0.3 : undefined,
    }))

    const chartConfig: Record<string, unknown> = {
      type,
      data: {
        labels:   labels ?? [],
        datasets: coloredDatasets,
      },
      options: {
        responsive: false,
        animation:  { duration: 0 },
        plugins: {
          legend: { display: legend, labels: { color: textColor } },
          ...(title ? { title: { display: true, text: title, color: textColor, font: { size: 18 } } } : {}),
        },
        scales: (type === "pie" || type === "doughnut" || type === "polarArea" || type === "radar") ? {} : {
          x: {
            ticks:  { color: textColor },
            grid:   { color: gridColor },
            stacked,
          },
          y: {
            ticks:  { color: textColor },
            grid:   { color: gridColor },
            stacked,
          },
        },
      },
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${bgColor}; display: flex; align-items: center; justify-content: center; }
  canvas { display: block; }
</style>
</head>
<body>
<canvas id="chart" width="${width}" height="${height}"></canvas>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
  new Chart(document.getElementById('chart'), ${JSON.stringify(chartConfig)});
</script>
</body>
</html>`

    const outputPath = String(args["output_path"])
    const finalPath  = outputPath.startsWith("/") ? outputPath : join(ctx.workdir ?? process.cwd(), outputPath)

    const result = await renderHtmlToImage(html, finalPath, { width, height, fullPage: false })
    if (!result.ok) return { output: "", error: result.error }
    return { output: `Chart saved: ${result.path}` }
  },
}
