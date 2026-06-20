import { z } from "zod"
import { spawn } from "bun"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const DIAGNOSTIC_COMMANDS: Record<string, { cmd: string[], fileRequired?: boolean, cwdOnly?: boolean }> = {
  "typescript": { cmd: ["bunx", "tsc", "--noEmit", "--pretty", "false"] },
  "javascript": { cmd: ["bunx", "tsc", "--noEmit", "--pretty", "false", "--allowJs"] },
  "python":     { cmd: ["python", "-m", "compileall", "."], cwdOnly: true },
  "go":         { cmd: ["go", "build", "-v", "./..."], cwdOnly: true },
  "rust":       { cmd: ["cargo", "check"], cwdOnly: true },
  "php":        { cmd: ["php", "-l", "<file>"], fileRequired: true },
  "c":          { cmd: ["gcc", "-fsyntax-only", "<file>"], fileRequired: true },
  "cpp":        { cmd: ["g++", "-fsyntax-only", "<file>"], fileRequired: true },
  "csharp":     { cmd: ["dotnet", "build", "--no-incremental"], cwdOnly: true },
  "fsharp":     { cmd: ["dotnet", "build"], cwdOnly: true },
  "java":       { cmd: ["javac", "<file>"], fileRequired: true },
  "kotlin":     { cmd: ["kotlinc", "-nowarn", "<file>"], fileRequired: true },
  "lua":        { cmd: ["luac", "-p", "<file>"], fileRequired: true },
  "ruby":       { cmd: ["ruby", "-c", "<file>"], fileRequired: true },
  "swift":      { cmd: ["swiftc", "-typecheck", "<file>"], fileRequired: true },
  "dart":       { cmd: ["dart", "analyze"], cwdOnly: true },
  "elixir":     { cmd: ["mix", "compile"], cwdOnly: true },
  "zig":        { cmd: ["zig", "build"], cwdOnly: true },
  "bash":       { cmd: ["bash", "-n", "<file>"], fileRequired: true },
  "dockerfile": { cmd: ["hadolint", "<file>"], fileRequired: true },
  "yaml":       { cmd: ["yamllint", "<file>"], fileRequired: true },
  "terraform":  { cmd: ["terraform", "validate"], cwdOnly: true },
  "vue":        { cmd: ["bunx", "vue-tsc", "--noEmit"] },
  "svelte":     { cmd: ["bunx", "svelte-check"], cwdOnly: true },
  "astro":      { cmd: ["bunx", "astro", "check"], cwdOnly: true },
  "prisma":     { cmd: ["bunx", "prisma", "validate"], cwdOnly: true },
  "haskell":    { cmd: ["cabal", "build"], cwdOnly: true },
  "ocaml":      { cmd: ["dune", "build"], cwdOnly: true },
  "clojure":    { cmd: ["clj", "-M:check"], cwdOnly: true },
  "julia":      { cmd: ["julia", "-e", "include(\"<file>\")"], fileRequired: true },
  "nix":        { cmd: ["nix-instantiate", "--parse", "<file>"], fileRequired: true },
  "gleam":      { cmd: ["gleam", "check"], cwdOnly: true },
  "deno":       { cmd: ["deno", "check", "<file>"], fileRequired: true },
}

export const lspTool: ToolDef = {
  id: "lsp",
  description: "Language Server Protocol (LSP) tool to check your code for errors BEFORE making massive edits. Supports 30+ languages.",
  parameters: z.object({
    action: z.enum(["diagnostics", "check_file"]).describe("Action to perform."),
    language: z.enum(Object.keys(DIAGNOSTIC_COMMANDS) as [string, ...string[]]).describe("The language of the project or file"),
    path: z.string().optional().describe("Absolute path to the file (required for 'check_file' in some languages)"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const action = String(args["action"])
    const language = String(args["language"])
    const path = args["path"] ? String(args["path"]) : undefined

    const config = DIAGNOSTIC_COMMANDS[language]
    if (!config) return { output: "", error: `Unsupported language: ${language}` }

    if (config.fileRequired && !path) {
      return { output: "", error: `path is required for ${language} file check` }
    }

    try {
      const finalCmd = [...config.cmd]
      
      // Replace <file> placeholder if exists
      const fileIndex = finalCmd.indexOf("<file>")
      if (fileIndex !== -1 && path) {
        finalCmd[fileIndex] = path
      } else if (!config.cwdOnly && path && fileIndex === -1 && action === "check_file") {
        // Append path if it's a file check and no placeholder exists
        finalCmd.push(path)
      }

      const proc  = spawn(finalCmd, { cwd: ctx.workdir })
      const timer = setTimeout(() => { try { proc.kill() } catch { /* zaten kapanmış */ } }, 60_000)
      const [out, err, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ])
      clearTimeout(timer)

      if (exitCode === 0) {
        return { output: `[${language.toUpperCase()}] Check successful. No syntax/type errors found.` }
      } else {
        return { output: `[${language.toUpperCase()}] Diagnostics found errors:\n` + out + err }
      }
    } catch (e) {
      return { output: "", error: `LSP execution failed for ${language}: ${e instanceof Error ? e.message : String(e)}` }
    }
  }
}
