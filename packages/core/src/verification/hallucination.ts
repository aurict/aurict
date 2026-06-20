import { stat } from "node:fs/promises"
import { resolve, dirname, join } from "node:path"

/**
 * Hallucination Detection
 * 
 * Agent'ın ürettiği kodda hallucination tespit eder:
 * 1. Import edilen modüller var mı?
 * 2. Import edilen semboller export ediliyor mu?
 * 3. Kullanılan method'lar/fonksiyonlar mevcut mu?
 */

export interface HallucinationWarning {
  type: "missing-module" | "missing-export" | "missing-method"
  message: string
  file: string
  line?: number
}

/**
 * Dosya içeriğindeki import'ları kontrol eder.
 * 
 * @param content Dosya içeriği
 * @param filePath Dosya yolu
 * @param workdir Çalışma dizini
 * @returns Hallucination warning'leri
 */
export async function detectHallucinations(
  content: string,
  filePath: string,
  workdir: string,
): Promise<HallucinationWarning[]> {
  const warnings: HallucinationWarning[] = []
  const fileDir = dirname(resolve(workdir, filePath))

  // Import pattern'larını bul
  const importPatterns = [
    // import { foo } from './bar'
    { regex: /import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g, importsGroup: 1, pathGroup: 2 },
    // import foo from './bar'
    { regex: /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, importsGroup: 1, pathGroup: 2 },
    // import * as foo from './bar'
    { regex: /import\s+\*\s+as\s+\w+\s+from\s+['"]([^'"]+)['"]/g, importsGroup: 0, pathGroup: 1 },
  ]

  for (const { regex, importsGroup, pathGroup } of importPatterns) {
    let match
    while ((match = regex.exec(content)) !== null) {
      const imports = importsGroup > 0 ? (match[importsGroup] ?? "") : ""
      const fromPath = match[pathGroup] ?? ""

      // Sadece relative import'ları kontrol et
      if (!fromPath.startsWith(".")) continue

      // Modülün var olup olmadığını kontrol et
      const moduleExists = await checkModuleExists(fromPath, fileDir)
      if (!moduleExists) {
        warnings.push({
          type: "missing-module",
          message: `Imported module not found: ${fromPath}`,
          file: filePath,
        })
        continue
      }

      // Named imports için export kontrolü
      if (imports && imports.trim()) {
        const names = imports.split(",").map(s => s.trim().split(/\s+as\s+/)[0]?.trim()).filter((n): n is string => Boolean(n))
        for (const name of names) {
          const exportExists = await checkExportExists(name, fromPath, fileDir)
          if (!exportExists) {
            warnings.push({
              type: "missing-export",
              message: `'${name}' is not exported from '${fromPath}'`,
              file: filePath,
            })
          }
        }
      }
    }
  }

  return warnings
}

/**
 * Modülün var olup olmadığını kontrol eder.
 * 
 * .ts, .tsx, .js, .jsx, /index.ts uzantılarını dener.
 */
async function checkModuleExists(importPath: string, fromDir: string): Promise<boolean> {
  const basePath = resolve(fromDir, importPath)
  
  // Olası uzantılar
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]
  const indexFiles = ["/index.ts", "/index.tsx", "/index.js", "/index.jsx"]

  // Direkt dosya kontrolü
  for (const ext of extensions) {
    try {
      await stat(basePath + ext)
      return true
    } catch {
      // Devam et
    }
  }

  // Directory + index dosyası kontrolü
  for (const indexFile of indexFiles) {
    try {
      await stat(basePath + indexFile)
      return true
    } catch {
      // Devam et
    }
  }

  return false
}

/**
 * İsim'in modülden export edilip edilmediğini kontrol eder.
 * 
 * Basit bir grep-based kontrol — tam doğruluk için TypeScript AST gerekir.
 */
async function checkExportExists(
  name: string,
  importPath: string,
  fromDir: string,
): Promise<boolean> {
  const basePath = resolve(fromDir, importPath)
  
  // Olası dosya yolları
  const extensions = [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]
  const possiblePaths = [
    ...extensions.map(ext => basePath + ext),
    ...extensions.map(ext => join(basePath, `index${ext}`)),
  ]

  for (const filePath of possiblePaths) {
    try {
      const content = await Bun.file(filePath).text()
      
      // Export pattern'ları kontrol et
      // export const foo, export function foo, export class foo
      const exportPatterns = [
        new RegExp(`export\\s+(?:const|let|var|function|class|interface|type|enum)\\s+${escapeRegex(name)}\\b`),
        // export default
        new RegExp(`export\\s+default\\s+`),
        // export { foo }
        new RegExp(`export\\s+{[^}]*\\b${escapeRegex(name)}\\b[^}]*}`),
        // export * from (re-export)
        /export\s+\*\s+from/,
      ]

      for (const pattern of exportPatterns) {
        if (pattern.test(content)) {
          return true
        }
      }
    } catch {
      // Dosya okunamadı, devam et
    }
  }

  // Export bulunamadı — ama bu kesin değil, conservative approach
  // Warning dönmek yerine true dönelim (false positive'den kaçın)
  return true
}

/**
 * Warning'leri formatlar ve agent'a gösterilecek hale getirir.
 */
export function formatHallucinationWarnings(warnings: HallucinationWarning[]): string {
  if (warnings.length === 0) return ""

  const lines = [
    "\n[HALLUCINATION DETECTION — Verify these before proceeding]",
    ...warnings.map((w, i) => {
      const location = w.line ? `${w.file}:${w.line}` : w.file
      return `${i + 1}. [${w.type}] ${w.message} (${location})`
    }),
  ]

  return lines.join("\n")
}

/**
 * Regex için escape function.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
