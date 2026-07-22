import { z } from "zod"
import { extname, relative, resolve } from "node:path"
import { stat } from "node:fs/promises"
import { readAttachmentFromPath } from "../../util/attachments.js"
import type { ToolDef } from "../types.js"

const SUPPORTED = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"])

export const readImageTool: ToolDef = {
  id: "read_image",
  description: `Load a workspace image into a vision-capable model.

Use for UI screenshots, design references, rendered diagrams, and visual error
states. The image is sent as a multimodal tool result; base64 is never printed
into the transcript. Supports PNG, JPEG, WebP, and GIF up to 5 MB.`,
  parameters: z.object({
    path: z.string().describe("Image path relative to the current workspace"),
  }),
  spec: { category: "read", riskLevel: "low", permissionSummary: "Read a workspace image" },
  async execute(args, ctx) {
    if (ctx.supportsVision === false) {
      return { output: "", error: `Model '${ctx.model ?? "current"}' does not support vision. Switch to a vision-capable model.` }
    }
    const requested = String(args["path"] ?? "")
    const root = resolve(ctx.workdir)
    const absolute = resolve(root, requested)
    if (absolute !== root && !absolute.startsWith(root + "/")) return { output: "", error: `Path is outside workspace: ${requested}` }
    const extension = extname(absolute).toLowerCase()
    if (!SUPPORTED.has(extension)) return { output: "", error: `Unsupported image type '${extension}'. Use PNG, JPEG, WebP, or GIF.` }
    try {
      const info = await stat(absolute)
      if (!info.isFile()) return { output: "", error: `Not a file: ${requested}` }
      const attachment = await readAttachmentFromPath(absolute)
      const displayPath = relative(root, absolute)
      return {
        output: `Image loaded: ${displayPath} (${attachment.mimeType}, ${info.size} bytes)`,
        content: [{ type: "image", data: attachment.base64!, mimeType: attachment.mimeType }],
      }
    } catch (error) {
      return { output: "", error: error instanceof Error ? error.message : String(error) }
    }
  },
}
