import { z } from "zod"
import { spawn } from "bun"
import { executeTypeScriptNavigation, type NavigationAction } from "../language/typescript-navigation.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const DIAGNOSTIC_COMMANDS: Record<string, { cmd: string[]; fileRequired?: boolean; cwdOnly?: boolean }> = {
  typescript: { cmd: ["bunx", "tsc", "--noEmit", "--pretty", "false"] },
  javascript: { cmd: ["bunx", "tsc", "--noEmit", "--pretty", "false", "--allowJs"] },
  python: { cmd: ["python", "-m", "compileall", "."], cwdOnly: true },
  go: { cmd: ["go", "build", "-v", "./..."], cwdOnly: true },
  rust: { cmd: ["cargo", "check"], cwdOnly: true },
  php: { cmd: ["php", "-l", "<file>"], fileRequired: true },
  c: { cmd: ["gcc", "-fsyntax-only", "<file>"], fileRequired: true },
  cpp: { cmd: ["g++", "-fsyntax-only", "<file>"], fileRequired: true },
  csharp: { cmd: ["dotnet", "build", "--no-incremental"], cwdOnly: true },
  java: { cmd: ["javac", "<file>"], fileRequired: true },
  kotlin: { cmd: ["kotlinc", "-nowarn", "<file>"], fileRequired: true },
  ruby: { cmd: ["ruby", "-c", "<file>"], fileRequired: true },
  swift: { cmd: ["swiftc", "-typecheck", "<file>"], fileRequired: true },
  dart: { cmd: ["dart", "analyze"], cwdOnly: true },
  zig: { cmd: ["zig", "build"], cwdOnly: true },
  bash: { cmd: ["bash", "-n", "<file>"], fileRequired: true },
  vue: { cmd: ["bunx", "vue-tsc", "--noEmit"] },
  svelte: { cmd: ["bunx", "svelte-check"], cwdOnly: true },
}

const NAVIGATION_ACTIONS = [
  "definition", "references", "hover", "document_symbols",
  "call_hierarchy", "rename_preview", "rename_apply",
] as const

export const lspTool: ToolDef = {
  id: "lsp",
  description: `Type-aware code intelligence and diagnostics.

For TypeScript/JavaScript use definition, references, hover, document_symbols,
call_hierarchy, rename_preview, or rename_apply. Provide a 1-based line/column
for exact navigation; symbol is a convenience fallback. Always preview a rename
before applying it. Other languages currently support diagnostics/check_file.`,
  parameters: z.object({
    action: z.enum(["diagnostics", "check_file", ...NAVIGATION_ACTIONS]),
    language: z.enum(Object.keys(DIAGNOSTIC_COMMANDS) as [string, ...string[]]).default("typescript"),
    path: z.string().optional(),
    line: z.number().int().positive().optional(),
    column: z.number().int().positive().optional(),
    symbol: z.string().optional(),
    direction: z.enum(["incoming", "outgoing", "both"]).optional(),
    new_name: z.string().optional(),
  }),
  spec: {
    category: "write",
    riskLevel: "medium",
    requiresConfirmation: args => args["action"] === "rename_apply",
    permissionSummary: "Apply a type-aware project-wide symbol rename",
  },
  async execute(args, ctx): Promise<ExecuteResult> {
    const action = String(args["action"])
    const language = String(args["language"] ?? "typescript")
    const path = args["path"] ? String(args["path"]) : undefined
    if ((NAVIGATION_ACTIONS as readonly string[]).includes(action)) {
      if (!path) return { output: "", error: "path is required for code navigation" }
      if (language !== "typescript" && language !== "javascript") {
        return { output: "", error: `${action} currently supports TypeScript/JavaScript; use diagnostics for ${language}` }
      }
      return executeTypeScriptNavigation({
        action: action as NavigationAction,
        path,
        ...(args["line"] !== undefined ? { line: Number(args["line"]) } : {}),
        ...(args["column"] !== undefined ? { column: Number(args["column"]) } : {}),
        ...(args["symbol"] ? { symbol: String(args["symbol"]) } : {}),
        ...(args["direction"] ? { direction: args["direction"] as "incoming" | "outgoing" | "both" } : {}),
        ...(args["new_name"] ? { newName: String(args["new_name"]) } : {}),
      }, ctx)
    }
    return runDiagnostics(language, action, path, ctx)
  },
}

async function runDiagnostics(language: string, action: string, path: string | undefined, ctx: ToolContext): Promise<ExecuteResult> {
  const config = DIAGNOSTIC_COMMANDS[language]
  if (!config) return { output: "", error: `Unsupported language: ${language}` }
  if (config.fileRequired && !path) return { output: "", error: `path is required for ${language} file check` }
  const command = config.cmd.map(part => part === "<file>" ? path! : part)
  if (!config.cwdOnly && path && !command.includes(path) && action === "check_file") command.push(path)
  try {
    const proc = spawn(command, { cwd: ctx.workdir })
    const timer = setTimeout(() => proc.kill(), 60_000)
    const [out, err, exitCode] = await Promise.all([
      new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited,
    ])
    clearTimeout(timer)
    return exitCode === 0
      ? { output: `[${language.toUpperCase()}] Check successful. No syntax/type errors found.` }
      : { output: `[${language.toUpperCase()}] Diagnostics found errors:\n${out}${err}` }
  } catch (error) {
    return { output: "", error: `Diagnostic execution failed for ${language}: ${error instanceof Error ? error.message : String(error)}` }
  }
}
