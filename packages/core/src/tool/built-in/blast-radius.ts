import { z } from "zod"
import * as ts from "typescript"
import { readdirSync, statSync, readFileSync, existsSync } from "fs"
import { join, resolve, relative, dirname } from "path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

// ── Types ─────────────────────────────────────────────────────────────────────

type RefKind = "call" | "import" | "re-export" | "type"

interface RefSite {
  file:      string
  line:      number
  col:       number
  container: string
  snippet:   string
  kind:      RefKind
}

interface BlastResult {
  symbol:     string
  declFile:   string
  declLine:   number
  refs:       RefSite[]
  packages:   string[] // monorepo packages that contain refs
}

interface BreakSite {
  file:    string
  line:    number
  col:     number
  message: string
  code:    number
}

interface BreakResult {
  from:       string
  to:         string
  declFile:   string
  breaks:     BreakSite[]
  clean:      boolean
}

// ── File collection ───────────────────────────────────────────────────────────

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", ".turbo", "build", "coverage", "out"])

function collectTsFiles(dir: string): string[] {
  const results: string[] = []

  function walk(current: string, depth: number) {
    if (depth > 12) return
    let entries: string[]
    try { entries = readdirSync(current) } catch { return }

    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue
      const full = join(current, entry)
      let st: ReturnType<typeof statSync>
      try { st = statSync(full) } catch { continue }

      if (st.isDirectory()) {
        walk(full, depth + 1)
      } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".d.ts")) {
        results.push(full)
      }
    }
  }

  walk(dir, 0)
  return results
}

// ── Monorepo package detection ────────────────────────────────────────────────

function detectPackages(workdir: string): Map<string, string> {
  const pkgMap = new Map<string, string>() // absPath prefix → package name
  const pkgRoot = join(workdir, "packages")

  if (!existsSync(pkgRoot)) return pkgMap

  let pkgDirs: string[]
  try { pkgDirs = readdirSync(pkgRoot) } catch { return pkgMap }

  for (const d of pkgDirs) {
    const pkgJson = join(pkgRoot, d, "package.json")
    if (!existsSync(pkgJson)) continue
    try {
      const meta = JSON.parse(readFileSync(pkgJson, "utf8")) as { name?: string }
      const name = meta.name ?? d
      pkgMap.set(join(pkgRoot, d), name)
    } catch { /* skip */ }
  }

  return pkgMap
}

function packageOf(absFile: string, pkgMap: Map<string, string>): string {
  for (const [prefix, name] of pkgMap) {
    if (absFile.startsWith(prefix + "/") || absFile === prefix) return name
  }
  return "root"
}

// ── Path mapping loader ───────────────────────────────────────────────────────

function loadPathMappings(workdir: string): ts.CompilerOptions["paths"] | undefined {
  const merged: Record<string, string[]> = {}

  function findTsconfigs(dir: string, depth: number): string[] {
    if (depth > 4) return []
    const found: string[] = []
    let entries: string[]
    try { entries = readdirSync(dir) } catch { return [] }
    for (const e of entries) {
      if (SKIP_DIRS.has(e)) continue
      const full = join(dir, e)
      let st: ReturnType<typeof statSync>
      try { st = statSync(full) } catch { continue }
      if (st.isDirectory()) found.push(...findTsconfigs(full, depth + 1))
      else if (e === "tsconfig.json") found.push(full)
    }
    return found
  }

  for (const tsconfigPath of findTsconfigs(workdir, 0)) {
    try {
      const result = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
      if (result.error) continue
      const configDir = dirname(tsconfigPath)
      const parsed = ts.parseJsonConfigFileContent(result.config, ts.sys, configDir)
      const { paths, baseUrl } = parsed.options
      if (!paths) continue
      const base = baseUrl ?? configDir
      for (const [key, vals] of Object.entries(paths)) {
        // Resolve each entry relative to its tsconfig's baseUrl, then make
        // relative to workdir so we can set a single baseUrl = workdir below.
        const resolved = vals.map(v => relative(workdir, resolve(base, v)))
        merged[key] = [...(merged[key] ?? []), ...resolved]
      }
    } catch { /* skip malformed tsconfigs */ }
  }

  return Object.keys(merged).length > 0 ? merged : undefined
}

// ── TypeScript Language Service ───────────────────────────────────────────────

function buildService(files: string[], workdir: string): ts.LanguageService {
  const pathMappings = loadPathMappings(workdir)
  const opts: ts.CompilerOptions = {
    target:           ts.ScriptTarget.ES2022,
    module:           ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict:           false,
    noEmit:           true,
    skipLibCheck:     true,
    allowSyntheticDefaultImports: true,
    baseUrl:          workdir,
    ...(pathMappings ? { paths: pathMappings } : {}),
  }

  const host: ts.LanguageServiceHost = {
    getScriptFileNames:    () => files,
    getScriptVersion:      (f) => { try { return String(statSync(f).mtimeMs) } catch { return "0" } },
    getScriptSnapshot:     (f) => {
      try { return ts.ScriptSnapshot.fromString(readFileSync(f, "utf8")) } catch { return undefined }
    },
    getCurrentDirectory:   () => workdir,
    getCompilationSettings: () => opts,
    getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
    fileExists:            ts.sys.fileExists,
    readFile:              ts.sys.readFile,
    readDirectory:         ts.sys.readDirectory,
    directoryExists:       ts.sys.directoryExists,
    getDirectories:        ts.sys.getDirectories,
  }

  return ts.createLanguageService(host, ts.createDocumentRegistry())
}

// ── Symbol finder ─────────────────────────────────────────────────────────────

interface SymbolLocation { file: string; position: number; line: number }

function findSymbolDeclaration(
  symbol: string,
  hintFile: string | undefined,
  program: ts.Program,
  files: string[],
): SymbolLocation | null {
  const searchIn = hintFile ? [hintFile] : files

  for (const f of searchIn) {
    const src = program.getSourceFile(f)
    if (!src) continue

    let found: SymbolLocation | null = null

    function visit(node: ts.Node) {
      if (found) return

      const isExportedDecl =
        (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
        node.name?.text === symbol

      const isVarDecl =
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === symbol

      const isTypeAlias =
        ts.isTypeAliasDeclaration(node) &&
        node.name.text === symbol

      if (isExportedDecl || isVarDecl || isTypeAlias) {
        const nameNode = (node as ts.FunctionDeclaration).name ?? (node as ts.VariableDeclaration).name
        const pos  = nameNode.getStart(src!)
        const line = src!.getLineAndCharacterOfPosition(pos).line + 1
        found = { file: f, position: pos, line }
        return
      }

      ts.forEachChild(node, visit)
    }

    ts.forEachChild(src, visit)
    if (found) return found
  }

  return null
}

// ── Container name ────────────────────────────────────────────────────────────

function getContainer(src: ts.SourceFile, pos: number): string {
  let container = "<module>"

  function walk(node: ts.Node): boolean {
    if (pos < node.pos || pos > node.end) return false

    if (ts.isFunctionDeclaration(node) && node.name) {
      container = node.name.text
    } else if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
      container = node.name.text
    } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const init = node.initializer
      if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
        container = node.name.text
      }
    } else if (ts.isClassDeclaration(node) && node.name) {
      container = node.name.text
    }

    ts.forEachChild(node, child => walk(child))
    return true
  }

  ts.forEachChild(src, walk)
  return container
}

// ── Reference classifier ──────────────────────────────────────────────────────

function classifyRef(src: ts.SourceFile, pos: number): RefKind {
  // Build ancestor path from SourceFile down to the innermost node at pos
  const path: ts.Node[] = []

  function collect(node: ts.Node): undefined {
    if (pos < node.pos || pos >= node.end) return
    path.push(node)
    ts.forEachChild(node, collect)
  }
  collect(src)

  // Scan innermost → outermost for the first structural clue
  for (const node of [...path].reverse()) {
    if (ts.isImportSpecifier(node) || ts.isImportClause(node) || ts.isNamespaceImport(node)) {
      return "import"
    }
    if (ts.isExportSpecifier(node)) {
      return "re-export"
    }
    if (ts.isCallExpression(node)) {
      return "call"
    }
  }

  return "type"
}

// ── Break simulation (Phase 2) ────────────────────────────────────────────────

function getDiagnosticKey(d: ts.Diagnostic): string {
  if (!d.file || d.start === undefined) return `${d.code}:nofile`
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start)
  return `${d.file.fileName}:${line}:${character}:${d.code}`
}

function collectDiags(program: ts.Program, allFiles: string[]): Map<string, ts.Diagnostic> {
  const map = new Map<string, ts.Diagnostic>()
  for (const sf of program.getSourceFiles()) {
    if (sf.fileName.includes("node_modules")) continue
    if (!allFiles.includes(sf.fileName)) continue
    for (const d of program.getSemanticDiagnostics(sf)) {
      map.set(getDiagnosticKey(d), d)
    }
  }
  return map
}

function makeProgram(allFiles: string[], opts: ts.CompilerOptions, override?: { file: string; content: string }): ts.Program {
  const baseHost = ts.createCompilerHost(opts)
  if (!override) return ts.createProgram(allFiles, opts, baseHost)

  const host: ts.CompilerHost = {
    ...baseHost,
    getSourceFile: (fileName, langVersion) => {
      if (fileName === override.file)
        return ts.createSourceFile(fileName, override.content, langVersion)
      return baseHost.getSourceFile(fileName, langVersion)
    },
    readFile: (fileName) => {
      if (fileName === override.file) return override.content
      return baseHost.readFile(fileName)
    },
    fileExists: (fileName) => {
      if (fileName === override.file) return true
      return baseHost.fileExists(fileName)
    },
  }

  return ts.createProgram(allFiles, opts, host)
}

// ── Flex match ────────────────────────────────────────────────────────────────

function flexMatch(content: string, from: string): { start: number; end: number } | null {
  // 1. Exact
  const exact = content.indexOf(from)
  if (exact !== -1) return { start: exact, end: exact + from.length }

  // 2. Whitespace-tolerant: each run of whitespace in `from` → \s+ in regex
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = escaped.replace(/\s+/g, "\\s+")
  const m = content.match(new RegExp(pattern))
  if (m?.index === undefined) return null
  return { start: m.index, end: m.index + m[0].length }
}

function simulateBreaks(
  allFiles: string[],
  workdir:  string,
  declFile: string,
  symbol:   string,
  from:     string,
  to:       string,
): BreakResult {
  const originalContent = readFileSync(declFile, "utf8")

  const span = flexMatch(originalContent, from)
  if (!span) {
    return {
      from, to, declFile: relative(workdir, declFile),
      breaks: [],
      clean: false,
    }
  }

  const modifiedContent =
    originalContent.slice(0, span.start) + to + originalContent.slice(span.end)

  // Scope: only files that textually reference the symbol (superset of semantic refs)
  const scopedFiles = [
    declFile,
    ...allFiles.filter(f => {
      if (f === declFile) return false
      try { return readFileSync(f, "utf8").includes(symbol) }
      catch { return false }
    }),
  ]

  const pathMappings = loadPathMappings(workdir)
  const opts: ts.CompilerOptions = {
    target:           ts.ScriptTarget.ES2022,
    module:           ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict:           true,
    noEmit:           true,
    skipLibCheck:     true,
    allowSyntheticDefaultImports: true,
    baseUrl:          workdir,
    ...(pathMappings ? { paths: pathMappings } : {}),
  }

  // Baseline: errors in scoped files before the change
  const baselineProg = makeProgram(scopedFiles, opts)
  const baseline     = collectDiags(baselineProg, scopedFiles)

  // Modified: errors in scoped files after the change
  const modifiedProg = makeProgram(scopedFiles, opts, { file: declFile, content: modifiedContent })
  const modified     = collectDiags(modifiedProg, scopedFiles)

  // New errors = in modified but NOT in baseline
  const breaks: BreakSite[] = []
  for (const [key, d] of modified) {
    if (baseline.has(key)) continue   // pre-existing error — skip
    if (!d.file || d.start === undefined) continue
    const { line: lineIdx, character: col } = d.file.getLineAndCharacterOfPosition(d.start)
    breaks.push({
      file:    relative(workdir, d.file.fileName),
      line:    lineIdx + 1,
      col:     col + 1,
      message: ts.flattenDiagnosticMessageText(d.messageText, " "),
      code:    d.code,
    })
  }

  breaks.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

  return {
    from, to,
    declFile: relative(workdir, declFile),
    breaks,
    clean: breaks.length === 0,
  }
}

function formatBreaks(result: BreakResult, C: Record<string, string>): string {
  const lines: string[] = []

  lines.push("")
  lines.push(`${C.bold}${C.cyan}break_analysis${C.reset}  ${C.gray}${result.declFile}${C.reset}`)
  lines.push(`${C.gray}${"─".repeat(60)}${C.reset}`)
  lines.push("")
  lines.push(`${C.dim}  from:${C.reset} ${C.yellow}${result.from}${C.reset}`)
  lines.push(`${C.dim}    to:${C.reset} ${C.green}${result.to}${C.reset}`)
  lines.push("")

  if (!result.clean && result.breaks.length === 0) {
    lines.push(`${C.yellow}⚠ 'from' text not found in declaration file — check the snippet is exact.${C.reset}`)
    lines.push("")
    return lines.join("\n")
  }

  if (result.clean) {
    lines.push(`${C.green}✓ No type errors — change is safe.${C.reset}`)
    lines.push("")
    return lines.join("\n")
  }

  lines.push(`${C.bold}${C.red}✗ ${result.breaks.length} error${result.breaks.length !== 1 ? "s" : ""}${C.reset}`)
  lines.push("")

  const byFile = new Map<string, BreakSite[]>()
  for (const b of result.breaks) {
    if (!byFile.has(b.file)) byFile.set(b.file, [])
    byFile.get(b.file)!.push(b)
  }

  for (const [file, sites] of byFile) {
    lines.push(`  ${C.blue}${file}${C.reset}`)
    for (const site of sites) {
      lines.push(
        `  ${C.gray}└─${C.reset} ${C.gray}:${site.line}:${site.col}${C.reset}  ` +
        `${C.red}TS${site.code}${C.reset}  ${site.message}`
      )
    }
    lines.push("")
  }

  return lines.join("\n")
}

// ── ANSI helpers ──────────────────────────────────────────────────────────────

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  blue:   "\x1b[34m",
  magenta:"\x1b[35m",
  red:    "\x1b[31m",
  gray:   "\x1b[90m",
}

// ── Formatter ─────────────────────────────────────────────────────────────────

function formatResult(result: BlastResult, workdir: string): string {
  const lines: string[] = []

  lines.push("")
  lines.push(
    `${C.bold}${C.cyan}blast_radius${C.reset}  ` +
    `${C.bold}${result.symbol}${C.reset}  ` +
    `${C.gray}(${result.declFile}:${result.declLine})${C.reset}`
  )
  lines.push(`${C.gray}${"─".repeat(60)}${C.reset}`)
  lines.push("")

  if (result.refs.length === 0) {
    lines.push(`${C.yellow}No references found outside declaration file.${C.reset}`)
    lines.push("")
    return lines.join("\n")
  }

  const calls    = result.refs.filter(r => r.kind === "call" || r.kind === "type")
  const imports  = result.refs.filter(r => r.kind === "import")
  const reexports = result.refs.filter(r => r.kind === "re-export")

  // ── Headline ──────────────────────────────────────────────────────────
  const headParts: string[] = []
  if (calls.length > 0) {
    const callFiles = new Set(calls.map(r => r.file)).size
    headParts.push(
      `${C.green}${calls.length} call site${calls.length !== 1 ? "s" : ""}${C.reset}` +
      ` across ${C.cyan}${callFiles} file${callFiles !== 1 ? "s" : ""}${C.reset}`
    )
  }
  if (imports.length > 0) {
    headParts.push(`${C.blue}${imports.length} import${imports.length !== 1 ? "s" : ""}${C.reset}`)
  }
  if (reexports.length > 0) {
    headParts.push(`${C.gray}${reexports.length} re-export${reexports.length !== 1 ? "s" : ""}${C.reset}`)
  }

  lines.push(`${C.bold}References:${C.reset} ${headParts.join("  ")}`)
  lines.push("")

  // ── Call sites ────────────────────────────────────────────────────────
  if (calls.length > 0) {
    const byFile = new Map<string, RefSite[]>()
    for (const r of calls) {
      if (!byFile.has(r.file)) byFile.set(r.file, [])
      byFile.get(r.file)!.push(r)
    }
    for (const [file, sites] of byFile) {
      lines.push(`  ${C.blue}${file}${C.reset}`)
      for (const site of sites) {
        const loc  = `${C.gray}:${site.line}${C.reset}`
        const cont = site.kind === "type"
          ? `${C.magenta}${site.container}${C.reset}${C.gray}[type]${C.reset}`
          : `${C.magenta}${site.container}()${C.reset}`
        const snip = `${C.dim}${site.snippet.trim().slice(0, 72)}${C.reset}`
        lines.push(`  ${C.gray}└─${C.reset} ${cont}${loc}`)
        lines.push(`     ${snip}`)
      }
      lines.push("")
    }
  }

  // ── Imports ───────────────────────────────────────────────────────────
  if (imports.length > 0) {
    lines.push(`${C.bold}Imports:${C.reset}`)
    const byFile = new Map<string, RefSite[]>()
    for (const r of imports) {
      if (!byFile.has(r.file)) byFile.set(r.file, [])
      byFile.get(r.file)!.push(r)
    }
    for (const [file, sites] of byFile) {
      const locs = sites.map(s => `${C.gray}:${s.line}${C.reset}`).join(", ")
      lines.push(`  ${C.blue}${file}${C.reset}  ${locs}`)
    }
    lines.push("")
  }

  // ── Re-exports ────────────────────────────────────────────────────────
  if (reexports.length > 0) {
    const reFiles = [...new Set(reexports.map(r => r.file))].join(", ")
    lines.push(`${C.gray}Re-exports: ${reFiles}${C.reset}`)
    lines.push("")
  }

  if (result.packages.length > 1) {
    lines.push(`${C.bold}Packages affected:${C.reset} ${result.packages.map(p => `${C.cyan}${p}${C.reset}`).join(", ")}`)
    lines.push("")
  }

  return lines.join("\n")
}

// ── Tool ──────────────────────────────────────────────────────────────────────

export const blastRadiusTool: ToolDef = {
  id: "blast_radius",

  spec: { category: "read", riskLevel: "low" },

  description: `Semantic impact analysis — find every place a symbol is used, or simulate a change and see what breaks.

PHASE 1 — references: given a symbol name, find all call sites across the codebase.
PHASE 2 — breaks: simulate changing a signature in memory and run type-check to find errors.

USE THIS to:
- Understand the blast radius before changing a function signature
- Find every caller before deleting or refactoring a symbol
- Simulate "what breaks if I add a required parameter?" without editing files
- Trace how data flows through the codebase

Stops at node_modules. Monorepo-aware (shows which package each ref lives in).

EXAMPLES:
  { symbol: "extractPattern", file: "packages/core/src/tool/executor.ts" }
  { symbol: "extractPattern", file: "...", mode: "breaks", from: "extractPattern(tool, args)", to: "extractPattern(tool, args, workdir)" }
  { symbol: "extractPattern", mode: "both", from: "...", to: "..." }`,

  parameters: z.object({
    symbol: z.string().describe("Symbol name to analyze"),
    file:   z.string().optional().describe("File where the symbol is declared (relative or absolute)"),
    mode:   z.enum(["references", "breaks", "both"]).optional().default("references")
              .describe("references = find call sites | breaks = simulate change | both = run both"),
    from:   z.string().optional().describe("Current code fragment to replace (required for breaks/both mode). Exact match is tried first; if not found, whitespace-tolerant matching is used as fallback."),
    to:     z.string().optional().describe("New code fragment to substitute (required for breaks/both mode)"),
    json:   z.boolean().optional().default(false).describe("Return raw JSON instead of formatted output"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const symbol    = String(args["symbol"] ?? "").trim()
    const rawFile   = args["file"] ? String(args["file"]) : undefined
    const mode      = (args["mode"] as string | undefined) ?? "references"
    const from      = args["from"] ? String(args["from"]) : undefined
    const to        = args["to"]   ? String(args["to"])   : undefined
    const jsonMode  = Boolean(args["json"])

    if (!symbol) return { output: "", error: "symbol is required" }
    if ((mode === "breaks" || mode === "both") && (!from || !to)) {
      return { output: "", error: "'from' and 'to' are required for breaks/both mode" }
    }

    const hintFile  = rawFile ? resolve(ctx.workdir, rawFile) : undefined

    // ── Collect files ──────────────────────────────────────────────────
    const allFiles = collectTsFiles(ctx.workdir)
    if (allFiles.length === 0) {
      return { output: "", error: "No TypeScript files found in workdir" }
    }
    if (allFiles.length > 2000) {
      return { output: "", error: `Too many files (${allFiles.length}) — narrow with 'file' parameter` }
    }

    // ── Build TS service ───────────────────────────────────────────────
    let service: ts.LanguageService
    try {
      service = buildService(allFiles, ctx.workdir)
    } catch (err) {
      return { output: "", error: `Failed to build TypeScript program: ${err}` }
    }

    const program = service.getProgram()
    if (!program) return { output: "", error: "TypeScript program could not be created" }

    // ── Find declaration ───────────────────────────────────────────────
    const decl = findSymbolDeclaration(symbol, hintFile, program, allFiles)
    if (!decl) {
      return {
        output: "",
        error: `Symbol '${symbol}' not found${hintFile ? ` in ${rawFile}` : " in any TypeScript file"}`,
      }
    }

    const declRel = relative(ctx.workdir, decl.file)

    // ── Find references ────────────────────────────────────────────────
    let rawRefs: ts.ReferencedSymbol[]
    try {
      rawRefs = service.findReferences(decl.file, decl.position) ?? []
    } catch (err) {
      return { output: "", error: `findReferences failed: ${err}` }
    }

    // ── Build RefSite list ─────────────────────────────────────────────
    const pkgMap  = detectPackages(ctx.workdir)
    const refs:    RefSite[] = []
    const pkgSet   = new Set<string>()

    function buildRef(src: ts.SourceFile, ref: ts.ReferenceEntry): RefSite | null {
      const { line: lineIdx, character: col } = src.getLineAndCharacterOfPosition(ref.textSpan.start)
      const line     = lineIdx + 1
      const lineText = (src.text.split("\n")[lineIdx] as string | undefined) ?? ""
      const kind     = classifyRef(src, ref.textSpan.start)
      const relFile  = relative(ctx.workdir, ref.fileName)

      let container: string
      switch (kind) {
        case "import":    container = "import"; break
        case "re-export": container = "re-export"; break
        default:          container = getContainer(src, ref.textSpan.start)
      }

      pkgSet.add(packageOf(ref.fileName, pkgMap))
      return { file: relFile, line, col: col + 1, container, snippet: lineText, kind }
    }

    for (const refGroup of rawRefs) {
      for (const ref of refGroup.references) {
        if (ref.isDefinition) continue
        if (ref.fileName === decl.file) continue

        const src = program.getSourceFile(ref.fileName)
        if (!src) continue

        const site = buildRef(src, ref)
        if (site) refs.push(site)
      }
    }

    // same-file refs (except declaration line)
    for (const refGroup of rawRefs) {
      for (const ref of refGroup.references) {
        if (ref.isDefinition) continue
        if (ref.fileName !== decl.file) continue

        const src = program.getSourceFile(ref.fileName)
        if (!src) continue

        const { line: lineIdx } = src.getLineAndCharacterOfPosition(ref.textSpan.start)
        if (lineIdx + 1 === decl.line) continue

        const site = buildRef(src, ref)
        if (site) refs.push(site)
      }
    }

    refs.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

    const refResult: BlastResult = {
      symbol,
      declFile:  declRel,
      declLine:  decl.line,
      refs,
      packages: [...pkgSet].sort(),
    }

    // ── Phase 2: break simulation ──────────────────────────────────────
    let breakResult: BreakResult | null = null

    if ((mode === "breaks" || mode === "both") && from && to) {
      breakResult = simulateBreaks(allFiles, ctx.workdir, decl.file, symbol, from, to)
    }

    // ── Output ─────────────────────────────────────────────────────────
    if (jsonMode) {
      const out: Record<string, unknown> = {
        symbol: args.symbol,
      }
      if (mode !== "breaks") {
        out.refs     = refResult.refs
        out.packages = refResult.packages
        out.declFile = refResult.declFile
        out.declLine = refResult.declLine
      }
      if (breakResult) out.breaks = breakResult
      return { output: JSON.stringify(out, null, 2) }
    }

    const parts: string[] = []
    if (mode !== "breaks") parts.push(formatResult(refResult, ctx.workdir))
    if (breakResult)        parts.push(formatBreaks(breakResult, C))

    return { output: parts.join("\n") }
  },
}
