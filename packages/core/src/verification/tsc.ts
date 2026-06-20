import { spawn } from "bun"
import { stat } from "node:fs/promises"
import { resolve, dirname } from "node:path"

/**
 * Smart TypeScript Verification
 * 
 * Mevcut TSC verification'ı optimize eder:
 * 1. Incremental TSC — sadece değişen dosyaları kontrol eder
 * 2. Skip conditions — comment-only, string-only değişikliklerde çalışmaz
 * 3. Debounce — ardışık edit'lerde 2s bekle, toplu kontrol et
 */

const TSC_TIMEOUT_MS = 4_000
const TSC_CACHE_TTL_MS = 8_000

interface TscCacheEntry {
  output: string
  ts: number
  files: Set<string>  // Hangi dosyalar için kontrol edildi
}

const tscCache = new Map<string, TscCacheEntry>()

/**
 * Dosya değişikliğinin TSC kontrolü gerektirip gerektirmediğini belirler.
 * 
 * Skip conditions:
 * - Comment-only change (single-line or multi-line comments changed)
 * - String-only change (sadece string literal değişti, type signature değil)
 * - Non-TypeScript file
 */
export function shouldRunTsc(filePath: string, oldContent: string, newContent: string): boolean {
  // Sadece TypeScript dosyaları
  if (!/\.(ts|tsx|mts|cts)$/.test(filePath)) {
    return false
  }

  // İçerik değişmediyse skip
  if (oldContent === newContent) {
    return false
  }

  // Comment-only change detection
  const oldStripped = stripComments(oldContent)
  const newStripped = stripComments(newContent)
  
  if (oldStripped === newStripped) {
    // Sadece comment değişti — TSC gerekmez
    return false
  }

  // String-only change detection (daha karmaşık)
  // Eğer sadece string literal'ler değiştiyse ve type signature aynıysa skip
  // Bu basit bir heuristic — tam doğruluk için AST parsing gerekir
  const oldWithoutStrings = stripStrings(oldStripped)
  const newWithoutStrings = stripStrings(newStripped)
  
  if (oldWithoutStrings === newWithoutStrings) {
    // Sadece string literal'ler değişti — muhtemelen TSC gerekmez
    // Ama emin olmak için kontrol et (conservative approach)
    // return false  // Şimdilik conservative: her zaman kontrol et
  }

  return true
}

/**
 * Incremental TSC çalıştırır.
 * 
 * --incremental flag ile .tsbuildinfo cache kullanır.
 * Sadece değişen dosyaları kontrol eder (daha hızlı).
 */
export async function runIncrementalTsc(
  workdir: string,
  changedFiles?: string[],
): Promise<string> {
  const cacheKey = workdir
  const cached = tscCache.get(cacheKey)
  
  // Cache kontrolü
  if (cached && Date.now() - cached.ts < TSC_CACHE_TTL_MS) {
    // Eğer changedFiles verilmişse ve hepsi zaten cache'de varsa, cache'i kullan
    if (changedFiles && changedFiles.every(f => cached.files.has(f))) {
      return cached.output
    }
  }

  try {
    const args = [
      "tsc",
      "--noEmit",
      "--pretty", "false",
      "--incremental",
      "--tsBuildInfoFile", ".aurict/.tsbuildinfo",
    ]

    // Eğer changedFiles verilmişse, sadece onları kontrol et
    // Ama bu riskli — dependency'leri kaçırabiliriz
    // Şimdilik full check yapıyoruz, sadece cache kullanıyoruz
    // if (changedFiles && changedFiles.length > 0 && changedFiles.length < 5) {
    //   args.push(...changedFiles)
    // }

    const proc = spawn(["bunx", ...args], {
      cwd: workdir,
      stdout: "pipe",
      stderr: "pipe",
    })

    const timer = setTimeout(() => {
      try { proc.kill() } catch {}
    }, TSC_TIMEOUT_MS)

    const out = await new Response(proc.stdout).text()
    const err = await new Response(proc.stderr).text()
    await proc.exited
    clearTimeout(timer)

    const result = (out + err).trim() || "✓"
    
    // Cache'e kaydet
    tscCache.set(cacheKey, {
      output: result,
      ts: Date.now(),
      files: new Set(changedFiles ?? []),
    })

    return result
  } catch {
    return ""
  }
}

/**
 * Debounced TSC check.
 * 
 * Ardışık edit'lerde her seferinde TSC çalıştırmak yerine,
 * 2 saniye bekler ve toplu kontrol eder.
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingFiles: Set<string> = new Set()
let pendingWorkdir: string | null = null
let pendingResolve: ((output: string) => void) | null = null

export async function debouncedTscCheck(
  workdir: string,
  filePath: string,
): Promise<string> {
  return new Promise((resolve) => {
    pendingFiles.add(filePath)
    pendingWorkdir = workdir
    pendingResolve = resolve

    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(async () => {
      const result = await runIncrementalTsc(pendingWorkdir!, [...pendingFiles])
      pendingFiles.clear()
      pendingWorkdir = null
      const resolveFn = pendingResolve
      pendingResolve = null
      resolveFn?.(result)
    }, 2000)  // 2 saniye debounce
  })
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * JavaScript/TypeScript comment'leri çıkarır.
 * Basit bir heuristic — tam doğruluk için AST parsing gerekir.
 */
function stripComments(code: string): string {
  // Single-line comments
  let result = code.replace(/\/\/.*$/gm, "")
  
  // Multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, "")
  
  return result
}

/**
 * String literal'leri çıkarır.
 * Basit bir heuristic — tam doğruluk için AST parsing gerekir.
 */
function stripStrings(code: string): string {
  // Double-quoted strings
  let result = code.replace(/"(?:[^"\\]|\\.)*"/g, '""')
  
  // Single-quoted strings
  result = result.replace(/'(?:[^'\\]|\\.)*'/g, "''")
  
  // Template literals (basit)
  result = result.replace(/`(?:[^`\\]|\\.)*`/g, "``")
  
  return result
}

/**
 * TSC çıktısını belirli bir dosya için filtreler.
 */
export function filterTscForFile(tscOut: string, filePath: string): string {
  if (!tscOut || tscOut === "✓") return tscOut
  
  const fileName = filePath.split("/").pop() ?? ""
  const relevant = tscOut.split("\n").filter(l => l.includes(fileName)).slice(0, 12)
  
  return relevant.length > 0 ? relevant.join("\n") : ""
}

/**
 * TSC cache'i temizler (test için).
 */
export function clearTscCache(): void {
  tscCache.clear()
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  pendingFiles.clear()
  pendingWorkdir = null
  pendingResolve = null
}
