import { z } from "zod"
import { join } from "node:path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { renderHtmlToImage } from "./_browser-renderer.js"

export const mermaidTool: ToolDef = {
  id: "mermaid",
  description: `Render a Mermaid diagram to an image file (PNG or SVG).

SUPPORTED DIAGRAM TYPES:
- flowchart / graph: TD (top-down), LR (left-right), etc.
- sequenceDiagram
- classDiagram
- stateDiagram-v2
- erDiagram
- gantt
- pie
- mindmap
- gitGraph

USE FOR:
- Architecture diagrams, flowcharts
- Database ER diagrams
- Sequence / interaction diagrams
- Embedding in reports and presentations

REQUIRES: Chromium/Chrome installed.

EXAMPLE:
  graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do this]
    B -->|No| D[Do that]`,

  parameters: z.object({
    output_path: z.string().describe("Absolute path for output file (.png or .svg)"),
    diagram:     z.string().describe("Mermaid diagram syntax"),
    theme:       z.enum(["default","dark","forest","neutral","base"]).default("default"),
    format:      z.enum(["png","svg"]).default("png"),
    width:       z.number().default(1200),
    height:      z.number().default(800),
    bg_color:    z.string().optional().describe("Background color hex (e.g. '#ffffff'). Defaults to theme background."),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const diagram   = String(args["diagram"])
    const theme     = String(args["theme"]  ?? "default")
    const format    = String(args["format"] ?? "png")
    const width     = Number(args["width"]  ?? 1200)
    const height    = Number(args["height"] ?? 800)
    const bgColor   = args["bg_color"] ? String(args["bg_color"]) : (theme === "dark" ? "#1a1a2e" : "#ffffff")

    const outputPath = String(args["output_path"])
    const finalPath  = outputPath.startsWith("/") ? outputPath : join(ctx.workdir ?? process.cwd(), outputPath)

    if (format === "svg") {
      // For SVG: render and extract the SVG element
      const result = await renderMermaidSvg(diagram, theme, bgColor, width, height, finalPath)
      if (!result.ok) return { output: "", error: result.error }
      return { output: `Diagram saved: ${result.path}` }
    }

    // PNG via browser
    const html = buildMermaidHtml(diagram, theme, bgColor, width, height)
    const result = await renderHtmlToImage(html, finalPath, { width, height, fullPage: false })
    if (!result.ok) return { output: "", error: result.error }
    return { output: `Diagram saved: ${result.path}` }
  },
}

function buildMermaidHtml(diagram: string, theme: string, bgColor: string, width: number, height: number): string {
  // Escape the diagram for safe embedding
  const escaped = diagram
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: ${bgColor};
    width: ${width}px;
    height: ${height}px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .mermaid { max-width: ${width - 40}px; }
  .mermaid svg { max-width: 100%; height: auto; }
</style>
</head>
<body>
<div class="mermaid">${escaped}</div>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({
    startOnLoad: true,
    theme: '${theme}',
    securityLevel: 'loose',
  });
</script>
</body>
</html>`
}

async function renderMermaidSvg(
  diagram: string,
  theme: string,
  bgColor: string,
  width: number,
  height: number,
  outputPath: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  // Render to PNG first, then extract SVG from the DOM
  const { findChromium } = await import("./_browser-renderer.js")
  const executablePath = await findChromium()

  let chromium: unknown
  try {
    // @ts-ignore — optional peer dependency
    const pw = await import("playwright-core")
    chromium = pw.chromium
  } catch {
    try {
      // @ts-ignore — optional peer dependency
      const pp = await import("puppeteer-core")
      chromium = pp.default
    } catch {
      if (!executablePath) {
        return { ok: false, error: "No browser found. Install chromium-browser." }
      }
      return { ok: false, error: "Install playwright-core: bun add playwright-core" }
    }
  }

  const html = buildMermaidHtml(diagram, theme, bgColor, width, height)

  try {
    const browser = await (chromium as { launch(o: unknown): Promise<{ newPage(): Promise<{ setContent(h: string, o?: unknown): Promise<void>; evaluate(fn: () => string): Promise<string>; close(): Promise<void> }>; close(): Promise<void> }> }).launch({
      executablePath: executablePath ?? undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle" } as never)

    // Wait for mermaid to render
    await new Promise(r => setTimeout(r, 1000))

    // @ts-ignore — runs inside browser context where document is available
    const svgContent = await page.evaluate(() => {
      // @ts-ignore
      const el = document.querySelector(".mermaid svg")
      // @ts-ignore
      return el ? el.outerHTML : ""
    })
    await browser.close()

    if (!svgContent) {
      return { ok: false, error: "Mermaid rendering produced no SVG output — check diagram syntax" }
    }

    const { writeFile } = await import("node:fs/promises")
    await writeFile(outputPath, svgContent, "utf8")
    return { ok: true, path: outputPath }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
