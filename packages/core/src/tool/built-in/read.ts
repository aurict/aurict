import { z } from "zod"
import { readFile } from "fs/promises"
import { resolve, dirname } from "path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { semanticCache } from "../semantic-cache.js"
import { resolveAuthorizedFilesystemPath } from "../../security/filesystem-grants.js"
import { observeBackground } from "../../util/background-task.js"
import { toPosix } from "../../util/paths.js"

const MAX_CHARS = 100_000

// Workdir dışında asla okunmaması gereken hassas dosya/dizin kalıpları
const SENSITIVE_OUTSIDE_WORKDIR: RegExp[] = [
  /\/\.ssh\//,
  /\/\.ssh$/,
  /\/\.gnupg\//,
  /\/\.gnupg$/,
  /\/\.aws\//,
  /\/\.aws$/,
  /\/\.config\/gcloud/,
  /\/\.azure\//,
  /\/\.azure$/,
  /\/\.kube\//,
  /\/\.kube$/,
  /\/\.netrc$/,
  /\/\.bash_history$/,
  /\/\.zsh_history$/,
  /\/\.fish\/fish_history/,
  /\/\.psql_history$/,
  /\/\.mysql_history$/,
  /\/etc\/shadow$/,
  /\/etc\/gshadow$/,
  /\/proc\/\d+\/mem/,
]

function checkSensitivePath(filePath: string, workdir: string): string | null {
  const normFile = toPosix(filePath)
  const normWorkdir = toPosix(workdir)
  const norm = normWorkdir.endsWith("/") ? normWorkdir : normWorkdir + "/"
  // Proje içindeyse her zaman serbest
  if (normFile.startsWith(norm) || normFile === normWorkdir) return null
  for (const re of SENSITIVE_OUTSIDE_WORKDIR) {
    if (re.test(normFile)) {
      return `Security: '${filePath}' okuma engellendi — proje dizini dışında hassas dosya`
    }
  }
  return null
}

export const readTool: ToolDef = {
  id:   "read",
  spec: { category: "read", riskLevel: "low" },
  description: "Read the contents of a file. Returns the file content as text.",
  parameters:  z.object({
    path:   z.string().describe("Absolute or relative path to the file"),
    offset: z.number().optional().describe("Line number to start reading from (1-based)"),
    limit:  z.number().optional().describe("Maximum number of lines to read"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    let filePath: string
    try {
      filePath = await resolveAuthorizedFilesystemPath(ctx.workdir, ctx.sessionId, String(args["path"] ?? ""))
    } catch (error) {
      return { output: "", error: `Security: ${error instanceof Error ? error.message : String(error)}` }
    }
    const sensitiveErr = checkSensitivePath(filePath, ctx.workdir)
    if (sensitiveErr) return { output: "", error: sensitiveErr }
    let content: string | null = await semanticCache.get<string>(filePath)
    
    if (content === null) {
      try {
        content = await readFile(filePath, "utf8")
        await semanticCache.set(filePath, content, content)
      } catch (err) {
        return { output: "", error: `Cannot read file: ${err}` }
      }
    }

    // Bağımlılıkları arka planda ön getir (prefetch)
    observeBackground(semanticCache.triggerPrefetch(filePath, dirname(filePath)), `semantic prefetch for ${filePath}`)

    const lines  = content.split("\n")
    const offset = typeof args["offset"] === "number" ? args["offset"] - 1 : 0
    const limit  = typeof args["limit"]  === "number" ? args["limit"]      : lines.length

    const slice  = lines.slice(offset, offset + limit)
    const result = slice
      .map((line, i) => `${offset + i + 1}\t${line}`)
      .join("\n")
      .slice(0, MAX_CHARS)

    return { output: result || "(empty file)" }
  },
}
