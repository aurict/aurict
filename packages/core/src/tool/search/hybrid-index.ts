import { createHash } from "node:crypto"
import { readdir, readFile, stat } from "node:fs/promises"
import { extname, join, relative, resolve } from "node:path"

interface Chunk {
  path: string
  startLine: number
  endLine: number
  text: string
  terms: Map<string, number>
  pathTerms: Set<string>
}

interface SearchIndex {
  fingerprint: string
  chunks: Chunk[]
  documentFrequency: Map<string, number>
  averageLength: number
  files: number
  builtAt: number
}

export interface HybridSearchResult {
  path: string
  startLine: number
  endLine: number
  score: number
  matchedTerms: string[]
  excerpt: string
}

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".java", ".kt", ".swift", ".rb", ".php", ".cs", ".cpp", ".c", ".h"])
const SKIP = new Set(["node_modules", ".git", ".aurict", "dist", "build", "coverage", ".next", "target", "vendor"])
const cache = new Map<string, SearchIndex>()

const CONCEPTS: Record<string, string[]> = {
  auth: ["authentication", "authorize", "authorization", "identity", "login"],
  token: ["credential", "credentials", "session", "jwt", "bearer"],
  refresh: ["renew", "rotate", "reload", "reissue", "update"],
  delete: ["remove", "destroy", "purge", "clear"],
  create: ["add", "insert", "build", "make", "initialize"],
  error: ["failure", "exception", "fault", "panic"],
  config: ["configuration", "settings", "preferences", "options"],
  database: ["db", "storage", "repository", "persistence"],
}

export async function searchHybridIndex(workdir: string, query: string, limit = 10): Promise<{ index: SearchIndex; results: HybridSearchResult[] }> {
  if (!query.trim()) throw new Error("query is required")
  const index = await getIndex(workdir)
  const queryTerms = expandTerms(tokenize(query))
  const results = index.chunks.map(chunk => scoreChunk(chunk, queryTerms, index))
    .filter((result): result is HybridSearchResult => result !== null)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit)
  return { index, results }
}

export async function rebuildHybridIndex(workdir: string): Promise<SearchIndex> {
  cache.delete(resolve(workdir))
  return getIndex(workdir)
}

export function hybridIndexStatus(workdir: string): Omit<SearchIndex, "chunks" | "documentFrequency"> | null {
  const index = cache.get(resolve(workdir))
  if (!index) return null
  const { chunks: _chunks, documentFrequency: _df, ...status } = index
  return status
}

async function getIndex(workdir: string): Promise<SearchIndex> {
  const root = resolve(workdir)
  const files: string[] = []
  await collectFiles(root, files, 2_000)
  const fingerprint = await fileFingerprint(root, files)
  const existing = cache.get(root)
  if (existing?.fingerprint === fingerprint) return existing
  const chunks: Chunk[] = []
  for (const file of files) {
    let text: string
    try { text = await readFile(file, "utf8") } catch { continue }
    if (text.length > 500_000 || text.includes("\0")) continue
    chunks.push(...chunkFile(root, file, text))
  }
  const documentFrequency = new Map<string, number>()
  let totalLength = 0
  for (const chunk of chunks) {
    totalLength += termCount(chunk.terms)
    for (const term of chunk.terms.keys()) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
  }
  const index: SearchIndex = {
    fingerprint, chunks, documentFrequency,
    averageLength: chunks.length ? totalLength / chunks.length : 0,
    files: files.length,
    builtAt: Date.now(),
  }
  cache.set(root, index)
  return index
}

function chunkFile(root: string, file: string, text: string): Chunk[] {
  const lines = text.split(/\r?\n/)
  const chunks: Chunk[] = []
  const path = relative(root, file).replaceAll("\\", "/")
  for (let start = 0; start < lines.length; start += 45) {
    const end = Math.min(lines.length, start + 60)
    const content = lines.slice(start, end).join("\n")
    const terms = frequencies(tokenize(content))
    for (const term of tokenize(path)) terms.set(term, (terms.get(term) ?? 0) + 2)
    chunks.push({ path, startLine: start + 1, endLine: end, text: content, terms, pathTerms: new Set(tokenize(path)) })
    if (end === lines.length) break
  }
  return chunks
}

function scoreChunk(chunk: Chunk, queryTerms: Map<string, number>, index: SearchIndex): HybridSearchResult | null {
  const length = termCount(chunk.terms)
  const matched: string[] = []
  let score = 0
  for (const [term, weight] of queryTerms) {
    const frequency = chunk.terms.get(term) ?? 0
    if (!frequency) continue
    matched.push(term)
    const df = index.documentFrequency.get(term) ?? 0
    const idf = Math.log(1 + (index.chunks.length - df + 0.5) / (df + 0.5))
    const denominator = frequency + 1.2 * (1 - 0.75 + 0.75 * length / Math.max(1, index.averageLength))
    score += weight * idf * (frequency * 2.2 / denominator)
    if (chunk.pathTerms.has(term)) score += 1.5 * weight
  }
  if (!matched.length) return null
  score += matched.length / Math.max(1, queryTerms.size)
  return {
    path: chunk.path,
    startLine: chunk.startLine,
    endLine: chunk.endLine,
    score: Number(score.toFixed(4)),
    matchedTerms: matched,
    excerpt: bestExcerpt(chunk, matched),
  }
}

function bestExcerpt(chunk: Chunk, matched: string[]): string {
  const lines = chunk.text.split("\n")
  const index = lines.findIndex(line => matched.some(term => tokenize(line).includes(term)))
  const start = Math.max(0, index < 0 ? 0 : index - 2)
  return lines.slice(start, Math.min(lines.length, start + 12)).join("\n").slice(0, 2_000)
}

function tokenize(value: string): string[] {
  const split = value
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[_./\\-]+/g, " ")
    .toLocaleLowerCase()
    .match(/[\p{L}\p{N}]{2,}/gu) ?? []
  return split.filter(term => !STOP_WORDS.has(term))
}

function expandTerms(terms: string[]): Map<string, number> {
  const expanded = new Map<string, number>()
  for (const term of terms) {
    expanded.set(term, Math.max(expanded.get(term) ?? 0, 1))
    for (const [concept, related] of Object.entries(CONCEPTS)) {
      if (term === concept || related.includes(term)) {
        expanded.set(concept, Math.max(expanded.get(concept) ?? 0, term === concept ? 1 : 0.65))
        for (const synonym of related) expanded.set(synonym, Math.max(expanded.get(synonym) ?? 0, synonym === term ? 1 : 0.45))
      }
    }
  }
  return expanded
}

async function collectFiles(dir: string, output: string[], limit: number): Promise<void> {
  if (output.length >= limit) return
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return }
  for (const entry of entries) {
    if (output.length >= limit) return
    if (entry.name.startsWith(".") || SKIP.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await collectFiles(path, output, limit)
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase())) output.push(path)
  }
}

async function fileFingerprint(root: string, files: string[]): Promise<string> {
  const digest = createHash("sha256")
  for (const file of files.sort()) {
    const info = await stat(file)
    digest.update(relative(root, file)).update("\0").update(String(info.mtimeMs)).update(":").update(String(info.size)).update("\0")
  }
  return digest.digest("hex")
}

function frequencies(terms: string[]): Map<string, number> {
  const result = new Map<string, number>()
  for (const term of terms) result.set(term, (result.get(term) ?? 0) + 1)
  return result
}

function termCount(terms: Map<string, number>): number {
  let count = 0
  for (const value of terms.values()) count += value
  return count
}

const STOP_WORDS = new Set(["the", "and", "for", "with", "from", "this", "that", "return", "const", "let", "var", "function", "export", "import", "true", "false", "null", "undefined"])
