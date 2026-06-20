import { join, dirname, basename, extname } from "node:path"
import { readdir, readFile, stat } from "node:fs/promises"
import { existsSync } from "node:fs"

const MAX_RESULTS      = 5
const MAX_GREP_FILES   = 30
const MAX_FILE_BYTES   = 200_000
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next", ".nuxt",
  "coverage", "__pycache__", ".venv", "venv", ".cache", ".turbo",
])

// Test dosyası olduğunu gösteren uzantı ve suffix'ler
const TEST_SUFFIXES = [".test", ".spec", "_test", "_spec"]
const TEST_DIRS     = new Set(["__tests__", "test", "tests", "spec", "specs"])

function isTestFile(filePath: string): boolean {
  const base = basename(filePath, extname(filePath))
  return TEST_SUFFIXES.some(s => base.endsWith(s))
    || TEST_DIRS.has(basename(dirname(filePath)))
}

// Strateji 1: co-location — auth.ts → auth.test.ts, auth.spec.ts
async function colocated(filePath: string): Promise<string[]> {
  const dir  = dirname(filePath)
  const base = basename(filePath, extname(filePath))
  const ext  = extname(filePath)

  const candidates: string[] = []
  for (const suffix of TEST_SUFFIXES) {
    for (const tryExt of [ext, ".ts", ".tsx", ".js", ".jsx", ".py"]) {
      candidates.push(join(dir, `${base}${suffix}${tryExt}`))
    }
  }

  const found: string[] = []
  for (const c of candidates) {
    if (existsSync(c)) found.push(c)
  }
  return found
}

// Strateji 2: __tests__ dizini — src/auth.ts → src/__tests__/auth.ts
async function inTestsDir(filePath: string): Promise<string[]> {
  const dir  = dirname(filePath)
  const base = basename(filePath, extname(filePath))
  const ext  = extname(filePath)

  const found: string[] = []
  for (const testDir of TEST_DIRS) {
    const candidate = join(dir, testDir, `${base}${ext}`)
    if (existsSync(candidate)) found.push(candidate)

    // suffix variant: auth.test.ts de olabilir __tests__/ altında
    for (const suffix of TEST_SUFFIXES) {
      const withSuffix = join(dir, testDir, `${base}${suffix}${ext}`)
      if (existsSync(withSuffix)) found.push(withSuffix)
    }
  }
  return found
}

// Strateji 3: import grep — workdir altında bu dosyayı import eden test dosyaları
async function importGrep(
  filePath: string,
  workdir:  string,
  signal:   AbortSignal,
): Promise<string[]> {
  const base    = basename(filePath, extname(filePath))
  const pattern = new RegExp(`from\\s+['"][^'"]*${escapeRegex(base)}['"]`)
  const found:  string[] = []
  let   scanned = 0

  async function walk(dir: string): Promise<void> {
    if (signal.aborted || scanned >= MAX_GREP_FILES || found.length >= MAX_RESULTS) return
    let entries
    try { entries = await readdir(dir, { withFileTypes: true }) } catch { return }

    for (const entry of entries) {
      if (signal.aborted || scanned >= MAX_GREP_FILES || found.length >= MAX_RESULTS) return
      const full = join(dir, entry.name)

      if (entry.isDirectory() && !entry.isSymbolicLink() && !SKIP_DIRS.has(entry.name)) {
        await walk(full)
        continue
      }

      if (!entry.isFile()) continue
      if (!isTestFile(full))  continue

      const fileExt = extname(entry.name)
      if (![".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go"].includes(fileExt)) continue

      scanned++
      try {
        const info = await stat(full)
        if (info.size > MAX_FILE_BYTES) continue
        const text = await readFile(full, "utf8")
        if (pattern.test(text)) found.push(full)
      } catch { /* unreadable — skip */ }
    }
  }

  await walk(workdir)
  return found
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Düzenlenen dosyayla ilişkili test dosyalarını bulur.
 * Üç strateji sırayla — ilk yeterli sonucu döndükten sonra durur.
 */
export async function findRelatedTests(
  filePath: string,
  workdir:  string,
  signal:   AbortSignal,
): Promise<string[]> {
  if (isTestFile(filePath)) return []  // test dosyasının testi yok

  const seen   = new Set<string>()
  const result: string[] = []

  function add(paths: string[]): void {
    for (const p of paths) {
      if (!seen.has(p) && result.length < MAX_RESULTS) {
        seen.add(p)
        result.push(p)
      }
    }
  }

  // Strateji 1 + 2 paralel (hızlı, dosya sistemi)
  const [s1, s2] = await Promise.all([
    colocated(filePath).catch(() => [] as string[]),
    inTestsDir(filePath).catch(() => [] as string[]),
  ])
  add(s1)
  add(s2)

  // Strateji 3 — sadece öncekiler boşsa (ağır, grep tabanlı)
  if (result.length === 0 && !signal.aborted) {
    const s3 = await importGrep(filePath, workdir, signal).catch(() => [] as string[])
    add(s3)
  }

  return result
}
