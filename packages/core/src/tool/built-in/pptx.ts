import { z } from "zod"
import { join } from "node:path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const SlideSchema = z.object({
  title:    z.string().optional(),
  subtitle: z.string().optional(),
  bullets:  z.array(z.string()).optional().describe("Bullet point list"),
  content:  z.string().optional().describe("Free-form text content"),
  notes:    z.string().optional().describe("Speaker notes"),
  image:    z.string().optional().describe("Absolute path to image file"),
  layout:   z.enum(["title", "title-content", "blank", "two-column"]).default("title-content"),
  columns:  z.tuple([z.array(z.string()), z.array(z.string())]).optional().describe("Two-column bullets [left, right]"),
})

export const pptxTool: ToolDef = {
  id: "pptx",
  description: `Generate a PowerPoint (.pptx) presentation file.

USE FOR:
- Creating professional slide decks from structured content
- Pitch decks, reports, educational materials, meeting summaries

SLIDE LAYOUTS:
- "title": Large title + subtitle (cover slide)
- "title-content": Title + bullets/content (most common)
- "two-column": Title + two side-by-side bullet columns
- "blank": Empty slide for custom content

OUTPUT: saves .pptx file, returns file path.`,

  parameters: z.object({
    output_path: z.string().describe("Where to save the .pptx file (absolute path, must end in .pptx)"),
    title:       z.string().describe("Presentation title"),
    author:      z.string().optional(),
    theme:       z.enum(["dark", "light", "blue", "minimal"]).default("light"),
    slides:      z.array(SlideSchema).min(1).max(60),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    // Dynamically import pptxgenjs
    let PptxGenJS: typeof import("pptxgenjs").default
    try {
      const mod = await import("pptxgenjs")
      PptxGenJS = mod.default ?? (mod as unknown as { default: typeof import("pptxgenjs").default })
    } catch {
      return { output: "", error: "pptxgenjs not installed. Run: bun add pptxgenjs" }
    }

    const outputPath = String(args["output_path"])
    const theme      = String(args["theme"] ?? "light") as "dark" | "light" | "blue" | "minimal"
    const slides     = args["slides"] as Array<z.infer<typeof SlideSchema>>

    const themes: Record<string, { bg: string; title: string; text: string; accent: string }> = {
      dark:    { bg: "1A1A2E",  title: "E0E0E0", text: "CCCCCC", accent: "4ECCA3" },
      light:   { bg: "FFFFFF",  title: "1A1A2E", text: "333333", accent: "2563EB" },
      blue:    { bg: "0F3460",  title: "E0E0E0", text: "B0C4DE", accent: "F5A623" },
      minimal: { bg: "FAFAFA",  title: "111111", text: "444444", accent: "666666" },
    }
    const t = themes[theme] ?? themes.light!

    const pptx = new PptxGenJS()
    pptx.layout      = "LAYOUT_WIDE"
    pptx.title       = String(args["title"])
    if (args["author"]) pptx.author = String(args["author"])

    // Define master slide
    pptx.defineSlideMaster({
      title:      "MASTER",
      background: { color: t.bg },
    })

    for (const slide of slides) {
      const s = pptx.addSlide()
      s.background = { color: t.bg }

      if (slide.layout === "title") {
        // Cover slide
        if (slide.title) {
          s.addText(slide.title, {
            x: 0.5, y: 1.5, w: "90%", h: 1.5,
            fontSize: 40, bold: true, color: t.title, align: "center",
          })
        }
        if (slide.subtitle || slide.content) {
          s.addText(String(slide.subtitle ?? slide.content ?? ""), {
            x: 0.5, y: 3.2, w: "90%", h: 1,
            fontSize: 24, color: t.text, align: "center",
          })
        }
      } else if (slide.layout === "two-column" && slide.columns) {
        if (slide.title) {
          s.addText(slide.title, {
            x: 0.5, y: 0.3, w: "90%", h: 0.8,
            fontSize: 28, bold: true, color: t.title,
          })
          // Accent line
          s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.1, w: 9, h: 0.04, fill: { color: t.accent } })
        }
        const [leftBullets, rightBullets] = slide.columns
        s.addText(leftBullets.map(b => ({ text: b, options: { bullet: true } })), {
          x: 0.5, y: 1.3, w: 4.5, h: 3.5, fontSize: 16, color: t.text, valign: "top",
        })
        s.addText(rightBullets.map(b => ({ text: b, options: { bullet: true } })), {
          x: 5.2, y: 1.3, w: 4.5, h: 3.5, fontSize: 16, color: t.text, valign: "top",
        })
      } else {
        // title-content or blank
        if (slide.title) {
          s.addText(slide.title, {
            x: 0.5, y: 0.3, w: "90%", h: 0.8,
            fontSize: 28, bold: true, color: t.title,
          })
          s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.1, w: 9, h: 0.04, fill: { color: t.accent } })
        }

        const yStart = slide.title ? 1.3 : 0.5
        const hAvail = 5.5 - yStart

        if (slide.bullets && slide.bullets.length > 0) {
          const bulletItems = slide.bullets.map(b => ({ text: b, options: { bullet: true } }))
          s.addText(bulletItems, {
            x: 0.5, y: yStart, w: "90%", h: hAvail,
            fontSize: 18, color: t.text, valign: "top", lineSpacingMultiple: 1.3,
          })
        } else if (slide.content) {
          s.addText(slide.content, {
            x: 0.5, y: yStart, w: "90%", h: hAvail,
            fontSize: 18, color: t.text, valign: "top",
          })
        }

        if (slide.image) {
          try {
            s.addImage({ path: slide.image, x: 0.5, y: yStart, w: 8, h: hAvail })
          } catch { /* image not found — skip */ }
        }
      }

      if (slide.notes) {
        s.addNotes(slide.notes)
      }
    }

    // Resolve output path
    const finalPath = outputPath.startsWith("/") ? outputPath : join(ctx.workdir ?? process.cwd(), outputPath)

    try {
      await pptx.writeFile({ fileName: finalPath })
      return { output: `Presentation saved: ${finalPath}\nSlides: ${slides.length}` }
    } catch (err) {
      return { output: "", error: `Failed to write file: ${err instanceof Error ? err.message : String(err)}` }
    }
  },
}
