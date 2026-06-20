import { z } from "zod"
import { join } from "node:path"
import { readFile } from "node:fs/promises"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { renderHtmlToPdf } from "./_browser-renderer.js"

export const renderPdfTool: ToolDef = {
  id: "render_pdf",
  description: `Render HTML to a PDF file using a real browser engine (Playwright/Chromium).

USE FOR:
- Converting styled HTML reports to PDF
- Generating professional documents with full CSS support
- Rendering charts, tables, and formatted content

REQUIRES: Chromium or Google Chrome installed on the system.

WORKFLOW:
1. Write your HTML (with inline CSS for best results)
2. Call render_pdf with the HTML content or file path
3. Get back the PDF file path`,

  parameters: z.object({
    output_path: z.string().describe("Absolute path for the output PDF file"),
    html:        z.string().optional().describe("HTML content as a string"),
    html_file:   z.string().optional().describe("Path to an existing HTML file to render"),
    format:      z.enum(["A4", "Letter", "A3", "Legal"]).default("A4"),
    landscape:   z.boolean().default(false),
    print_background: z.boolean().default(true).describe("Include background colors and images"),
    margin_top:    z.string().default("20mm"),
    margin_bottom: z.string().default("20mm"),
    margin_left:   z.string().default("25mm"),
    margin_right:  z.string().default("25mm"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    let html: string

    if (args["html"]) {
      html = String(args["html"])
    } else if (args["html_file"]) {
      const p = String(args["html_file"])
      const resolved = p.startsWith("/") ? p : join(ctx.workdir ?? process.cwd(), p)
      try {
        html = await readFile(resolved, "utf8")
      } catch {
        return { output: "", error: `Cannot read HTML file: ${resolved}` }
      }
    } else {
      return { output: "", error: "Provide either html or html_file" }
    }

    const outputPath = String(args["output_path"])
    const finalPath  = outputPath.startsWith("/") ? outputPath : join(ctx.workdir ?? process.cwd(), outputPath)

    const result = await renderHtmlToPdf(html, finalPath, {
      format:          (args["format"] as "A4" | "Letter" | "A3" | "Legal") ?? "A4",
      landscape:       Boolean(args["landscape"]),
      printBackground: Boolean(args["print_background"] ?? true),
      margin: {
        top:    String(args["margin_top"]    ?? "20mm"),
        bottom: String(args["margin_bottom"] ?? "20mm"),
        left:   String(args["margin_left"]   ?? "25mm"),
        right:  String(args["margin_right"]  ?? "25mm"),
      },
    })

    if (!result.ok) return { output: "", error: result.error }
    return { output: `PDF saved: ${result.path}` }
  },
}
