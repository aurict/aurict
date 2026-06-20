export type SymbolKind =
  | "function" | "class" | "interface" | "type" | "const" | "let" | "var"
  | "enum" | "method" | "struct" | "trait" | "impl" | "module" | "import"

export interface CodeSymbol {
  name:      string
  kind:      SymbolKind
  line:      number     // 1-based
  exported:  boolean
  signature: string     // declaration line (truncated)
}

export interface FileSymbols {
  path:     string
  language: Language
  symbols:  CodeSymbol[]
  error?:   string
}

export type Language =
  | "typescript" | "javascript" | "python" | "rust" | "go"
  | "java" | "kotlin" | "c" | "cpp" | "unknown"

// ── Language detection ────────────────────────────────────────────────────────

const EXT_LANG: Record<string, Language> = {
  ".ts": "typescript", ".tsx": "typescript", ".mts": "typescript", ".cts": "typescript",
  ".js": "javascript", ".jsx": "javascript", ".mjs": "javascript", ".cjs": "javascript",
  ".py": "python",
  ".rs": "rust",
  ".go": "go",
  ".java": "java",
  ".kt": "kotlin", ".kts": "kotlin",
  ".c": "c", ".h": "c",
  ".cpp": "cpp", ".cc": "cpp", ".cxx": "cpp", ".hpp": "cpp",
}

export function detectLanguage(filePath: string): Language {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase()
  return EXT_LANG[ext] ?? "unknown"
}

// ── Extractors ────────────────────────────────────────────────────────────────

type ExtractFn = (lines: string[]) => CodeSymbol[]

const EXTRACTORS: Record<Language, ExtractFn> = {
  typescript: extractTS,
  javascript: extractTS,
  python:     extractPython,
  rust:       extractRust,
  go:         extractGo,
  java:       extractJava,
  kotlin:     extractKotlin,
  c:          extractC,
  cpp:        extractC,
  unknown:    () => [],
}

function extractTS(lines: string[]): CodeSymbol[] {
  const symbols: CodeSymbol[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const ln   = i + 1
    const sig  = line.trim().slice(0, 120)

    // function declarations
    let m = line.match(/^(export\s+(?:default\s+)?)?(?:async\s+)?function\s*[*]?\s*(\w+)/)
    if (m) { symbols.push({ name: m[2]!, kind: "function", line: ln, exported: !!m[1], signature: sig }); continue }

    // arrow / const function
    m = line.match(/^(export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(?/)
    if (m && (line.includes("=>") || lines[i + 1]?.includes("=>"))) {
      symbols.push({ name: m[2]!, kind: "function", line: ln, exported: !!m[1], signature: sig }); continue
    }

    // class
    m = line.match(/^(export\s+)?(?:abstract\s+)?class\s+(\w+)/)
    if (m) { symbols.push({ name: m[2]!, kind: "class", line: ln, exported: !!m[1], signature: sig }); continue }

    // interface
    m = line.match(/^(export\s+)?interface\s+(\w+)/)
    if (m) { symbols.push({ name: m[2]!, kind: "interface", line: ln, exported: !!m[1], signature: sig }); continue }

    // type alias
    m = line.match(/^(export\s+)?type\s+(\w+)\s*[=<]/)
    if (m) { symbols.push({ name: m[2]!, kind: "type", line: ln, exported: !!m[1], signature: sig }); continue }

    // enum
    m = line.match(/^(export\s+)?(?:const\s+)?enum\s+(\w+)/)
    if (m) { symbols.push({ name: m[2]!, kind: "enum", line: ln, exported: !!m[1], signature: sig }); continue }

    // const / let / var (exported, non-function)
    m = line.match(/^(export\s+)(const|let|var)\s+(\w+)\s*[=:]/)
    if (m) { symbols.push({ name: m[3]!, kind: m[2] as SymbolKind, line: ln, exported: true, signature: sig }); continue }
  }

  return symbols
}

function extractPython(lines: string[]): CodeSymbol[] {
  const symbols: CodeSymbol[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const ln   = i + 1
    const sig  = line.trim().slice(0, 120)

    let m = line.match(/^(?:async\s+)?def\s+(\w+)\s*\(/)
    if (m) {
      const exported = !m[1]!.startsWith("_")
      symbols.push({ name: m[1]!, kind: "function", line: ln, exported, signature: sig }); continue
    }
    m = line.match(/^class\s+(\w+)/)
    if (m) {
      const exported = !m[1]!.startsWith("_")
      symbols.push({ name: m[1]!, kind: "class", line: ln, exported, signature: sig }); continue
    }
    // module-level assignment (likely a constant if ALL_CAPS)
    m = line.match(/^([A-Z_][A-Z0-9_]{2,})\s*=/)
    if (m) { symbols.push({ name: m[1]!, kind: "const", line: ln, exported: true, signature: sig }); continue }
  }

  return symbols
}

function extractRust(lines: string[]): CodeSymbol[] {
  const symbols: CodeSymbol[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const ln   = i + 1
    const sig  = line.trim().slice(0, 120)
    const pub  = line.trimStart().startsWith("pub")

    let m = line.match(/(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "function", line: ln, exported: pub, signature: sig }); continue }

    m = line.match(/(?:pub\s+)?struct\s+(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "struct", line: ln, exported: pub, signature: sig }); continue }

    m = line.match(/(?:pub\s+)?enum\s+(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "enum", line: ln, exported: pub, signature: sig }); continue }

    m = line.match(/(?:pub\s+)?trait\s+(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "trait", line: ln, exported: pub, signature: sig }); continue }

    m = line.match(/impl(?:<[^>]+>)?\s+(?:\w+\s+for\s+)?(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "impl", line: ln, exported: false, signature: sig }); continue }

    m = line.match(/(?:pub\s+)?mod\s+(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "module", line: ln, exported: pub, signature: sig }); continue }
  }

  return symbols
}

function extractGo(lines: string[]): CodeSymbol[] {
  const symbols: CodeSymbol[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const ln   = i + 1
    const sig  = line.trim().slice(0, 120)

    // func (recv) MethodName or func FuncName
    let m = line.match(/^func\s+(?:\(\w+\s+[*\w[\]]+\)\s+)?(\w+)\s*\(/)
    if (m) {
      const exported = /^[A-Z]/.test(m[1]!)
      symbols.push({ name: m[1]!, kind: "function", line: ln, exported, signature: sig }); continue
    }

    m = line.match(/^type\s+(\w+)\s+(?:struct|interface)/)
    if (m) {
      const exported = /^[A-Z]/.test(m[1]!)
      const kind: SymbolKind = line.includes("interface") ? "interface" : "struct"
      symbols.push({ name: m[1]!, kind, line: ln, exported, signature: sig }); continue
    }

    m = line.match(/^type\s+(\w+)\s+/)
    if (m) {
      const exported = /^[A-Z]/.test(m[1]!)
      symbols.push({ name: m[1]!, kind: "type", line: ln, exported, signature: sig }); continue
    }

    m = line.match(/^var\s+(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "var", line: ln, exported: /^[A-Z]/.test(m[1]!), signature: sig }); continue }

    m = line.match(/^const\s+(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "const", line: ln, exported: /^[A-Z]/.test(m[1]!), signature: sig }); continue }
  }

  return symbols
}

function extractJava(lines: string[]): CodeSymbol[] {
  const symbols: CodeSymbol[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const ln   = i + 1
    const sig  = line.trim().slice(0, 120)
    const pub  = line.includes("public")

    let m = line.match(/(?:public|protected|private)?\s+(?:static\s+)?(?:final\s+)?class\s+(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "class", line: ln, exported: pub, signature: sig }); continue }

    m = line.match(/(?:public|protected|private)?\s+(?:static\s+)?interface\s+(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "interface", line: ln, exported: pub, signature: sig }); continue }

    m = line.match(/(?:public|protected|private)\s+(?:static\s+)?(?:final\s+)?(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(/)
    if (m) { symbols.push({ name: m[1]!, kind: "function", line: ln, exported: pub, signature: sig }); continue }
  }

  return symbols
}

function extractKotlin(lines: string[]): CodeSymbol[] {
  const symbols: CodeSymbol[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const ln   = i + 1
    const sig  = line.trim().slice(0, 120)
    const pub  = !line.includes("private") && !line.includes("internal")

    let m = line.match(/(?:fun\s+)(\w+)\s*[(<]/)
    if (m) { symbols.push({ name: m[1]!, kind: "function", line: ln, exported: pub, signature: sig }); continue }

    m = line.match(/(?:class|object|data class|sealed class)\s+(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "class", line: ln, exported: pub, signature: sig }); continue }

    m = line.match(/interface\s+(\w+)/)
    if (m) { symbols.push({ name: m[1]!, kind: "interface", line: ln, exported: pub, signature: sig }); continue }
  }

  return symbols
}

function extractC(lines: string[]): CodeSymbol[] {
  const symbols: CodeSymbol[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const ln   = i + 1
    const sig  = line.trim().slice(0, 120)

    // Simple heuristic: non-indented line ending with ) { or ) and next line is {
    let m = line.match(/^(?:(?:static|extern|inline|const)\s+)*\w+[*\s]+(\w+)\s*\([^)]*\)\s*(?:\{|$)/)
    if (m && !line.trimStart().startsWith("//") && !line.trimStart().startsWith("*")) {
      symbols.push({ name: m[1]!, kind: "function", line: ln, exported: !line.includes("static"), signature: sig }); continue
    }

    m = line.match(/^typedef\s+struct\s+\w*\s*\{?.*\}\s*(\w+)\s*;/)
    if (m) { symbols.push({ name: m[1]!, kind: "struct", line: ln, exported: true, signature: sig }); continue }

    m = line.match(/^struct\s+(\w+)\s*\{/)
    if (m) { symbols.push({ name: m[1]!, kind: "struct", line: ln, exported: true, signature: sig }); continue }
  }

  return symbols
}

// ── Public API ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 500_000  // 500KB

export async function extractSymbols(filePath: string): Promise<FileSymbols> {
  const language = detectLanguage(filePath)

  if (language === "unknown") {
    return { path: filePath, language, symbols: [] }
  }

  try {
    const file = Bun.file(filePath)
    if (file.size > MAX_FILE_SIZE) {
      return { path: filePath, language, symbols: [], error: "File too large (>500KB)" }
    }
    const text  = await file.text()
    const lines = text.split("\n")
    const extractor = EXTRACTORS[language]
    const symbols   = extractor(lines)
    return { path: filePath, language, symbols }
  } catch (err) {
    return { path: filePath, language, symbols: [], error: String(err) }
  }
}

/**
 * Verilen sembolün kaynak kodunu (declaration + body) satır aralığı olarak çıkarır.
 * @file.ts:symbolName syntax'ı için kullanılır.
 */
export async function extractSymbolBody(
  filePath:   string,
  symbolName: string,
): Promise<{ code: string; startLine: number; endLine: number } | null> {
  const { symbols, language } = await extractSymbols(filePath)
  const sym = symbols.find(s => s.name === symbolName)
  if (!sym) return null

  try {
    const file  = Bun.file(filePath)
    const text  = await file.text()
    const lines = text.split("\n")
    const start = sym.line - 1   // 0-based

    let end = start

    if (language === "python") {
      // Python: indentation-based block detection
      const baseIndent = lines[start]!.match(/^(\s*)/)?.[1]?.length ?? 0
      for (let i = start + 1; i < lines.length; i++) {
        const ln = lines[i]!
        if (ln.trim() === "") { end = i; continue }
        const indent = ln.match(/^(\s*)/)?.[1]?.length ?? 0
        if (indent <= baseIndent && ln.trim() && !ln.trim().startsWith("#")) break
        end = i
      }
    } else {
      // Brace-based languages (TS, JS, Rust, Go, Java, Kotlin, C/C++)
      let depth = 0
      let foundOpen = false
      for (let i = start; i < Math.min(lines.length, start + 500); i++) {
        const ln = lines[i]!
        for (const ch of ln) {
          if (ch === "{") { depth++; foundOpen = true }
          else if (ch === "}") depth--
        }
        end = i
        if (foundOpen && depth === 0) break
      }
      // If no braces found (type alias, const, interface one-liner), end = start + a few lines
      if (!foundOpen) end = Math.min(start + 5, lines.length - 1)
    }

    const code = lines.slice(start, end + 1).join("\n")
    return { code, startLine: sym.line, endLine: end + 1 }
  } catch {
    return null
  }
}

/** Sembol listesini tek satır özet formatına çevirir (code_map için) */
export function formatSymbolsSummary(fs: FileSymbols, showPrivate = false): string {
  const syms = showPrivate ? fs.symbols : fs.symbols.filter(s => s.exported)
  if (syms.length === 0) return ""

  const grouped = new Map<SymbolKind, string[]>()
  for (const s of syms) {
    if (!grouped.has(s.kind)) grouped.set(s.kind, [])
    grouped.get(s.kind)!.push(s.name)
  }

  const parts: string[] = []
  for (const [kind, names] of grouped) {
    parts.push(`${kind}(${names.join(", ")})`)
  }
  return parts.join(" | ")
}
