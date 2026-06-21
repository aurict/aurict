import { stat } from "node:fs/promises"
import { resolve, dirname, join } from "node:path"
import * as ts from "typescript"

/**
 * Hallucination Detection
 * 
 * AST-based validation of imports, exports, and function signature matches.
 */

export interface HallucinationWarning {
  type: "missing-module" | "missing-export" | "missing-method" | "signature-mismatch"
  message: string
  file: string
  line?: number
}

function walk(node: ts.Node, callback: (node: ts.Node) => void) {
  callback(node)
  ts.forEachChild(node, (child) => walk(child, callback))
}

function hasExportModifier(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined
  return modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false
}

function getParamCountRange(parameters: ts.NodeArray<ts.ParameterDeclaration>) {
  let min = 0
  let max = 0
  for (const param of parameters) {
    if (param.dotDotDotToken) {
      max = Infinity // Rest parameters
    } else {
      if (!param.initializer && !param.questionToken) {
        min++
      }
      if (max !== Infinity) {
        max++
      }
    }
  }
  return { min, max }
}

interface TargetFileInfo {
  exportedNames: Set<string>
  functionParamCounts: Map<string, { min: number; max: number }>
}

async function parseTargetFile(filePath: string): Promise<TargetFileInfo | null> {
  try {
    const content = await Bun.file(filePath).text()
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true)
    
    const exportedNames = new Set<string>()
    const functionParamCounts = new Map<string, { min: number; max: number }>()

    walk(sourceFile, (node) => {
      // export const / let / var
      if (ts.isVariableStatement(node) && hasExportModifier(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            exportedNames.add(decl.name.text)
          }
        }
      }
      // export function
      if (ts.isFunctionDeclaration(node) && hasExportModifier(node) && node.name) {
        exportedNames.add(node.name.text)
        const range = getParamCountRange(node.parameters)
        functionParamCounts.set(node.name.text, range)
      }
      // export class
      if (ts.isClassDeclaration(node) && hasExportModifier(node) && node.name) {
        exportedNames.add(node.name.text)
      }
      // export interface
      if (ts.isInterfaceDeclaration(node) && hasExportModifier(node) && node.name) {
        exportedNames.add(node.name.text)
      }
      // export type
      if (ts.isTypeAliasDeclaration(node) && hasExportModifier(node) && node.name) {
        exportedNames.add(node.name.text)
      }
      // export enum
      if (ts.isEnumDeclaration(node) && hasExportModifier(node) && node.name) {
        exportedNames.add(node.name.text)
      }
      // export { x, y }
      if (ts.isExportDeclaration(node)) {
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const elem of node.exportClause.elements) {
            exportedNames.add(elem.name.text)
          }
        }
      }
    })

    return { exportedNames, functionParamCounts }
  } catch {
    return null
  }
}

/**
 * Modül dosya yolunu bulmaya çalışır.
 */
async function resolveModulePath(importPath: string, fromDir: string): Promise<string | null> {
  const basePath = resolve(fromDir, importPath)
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]
  const indexFiles = ["/index.ts", "/index.tsx", "/index.js", "/index.jsx"]

  for (const ext of extensions) {
    const p = basePath + ext
    try {
      await stat(p)
      return p
    } catch {}
  }

  for (const indexFile of indexFiles) {
    const p = basePath + indexFile
    try {
      await stat(p)
      return p
    } catch {}
  }

  return null
}

export async function detectHallucinations(
  content: string,
  filePath: string,
  workdir: string,
): Promise<HallucinationWarning[]> {
  const warnings: HallucinationWarning[] = []
  const fileDir = dirname(resolve(workdir, filePath))

  let sourceFile: ts.SourceFile
  try {
    sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true)
  } catch {
    // Sözdizimi hatalıysa AST oluşturma başarısız olur, tsc uyarısı yakalayacak
    return []
  }

  const localImports: Array<{
    moduleSpecifier: string
    namedImports: string[]
    line: number
    resolvedPath?: string
    exportsInfo?: TargetFileInfo
  }> = []

  const methodCalls: Array<{
    methodName: string
    argCount: number
    line: number
  }> = []

  // AST'yi gez
  walk(sourceFile, (node) => {
    // import { x } from "./y"
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text
      if (moduleSpecifier.startsWith(".")) {
        const namedImports: string[] = []
        if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          for (const el of node.importClause.namedBindings.elements) {
            namedImports.push(el.name.text)
          }
        }
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
        localImports.push({ moduleSpecifier, namedImports, line: line + 1 })
      }
    }

    // method calling: foo(...)
    if (ts.isCallExpression(node)) {
      let methodName = ""
      if (ts.isIdentifier(node.expression)) {
        methodName = node.expression.text
      } else if (ts.isPropertyAccessExpression(node.expression)) {
        methodName = node.expression.name.text
      }
      if (methodName) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
        methodCalls.push({ methodName, argCount: node.arguments.length, line: line + 1 })
      }
    }
  })

  // Import edilen modüllerin varlığını ve export'larını kontrol et
  for (const imp of localImports) {
    const resolved = await resolveModulePath(imp.moduleSpecifier, fileDir)
    if (!resolved) {
      warnings.push({
        type: "missing-module",
        message: `Imported module not found: ${imp.moduleSpecifier}`,
        file: filePath,
        line: imp.line,
      })
      continue
    }

    imp.resolvedPath = resolved
    const info = await parseTargetFile(resolved)
    if (info) {
      imp.exportsInfo = info
      // Named exports kontrol et
      for (const name of imp.namedImports) {
        if (!info.exportedNames.has(name)) {
          warnings.push({
            type: "missing-export",
            message: `'${name}' is not exported from '${imp.moduleSpecifier}'`,
            file: filePath,
            line: imp.line,
          })
        }
      }
    }
  }

  // Metot çağrılarının imzalarını kontrol et
  for (const call of methodCalls) {
    // Bu çağrı import edilmiş bir yerel fonksiyona mı ait?
    const sourceImport = localImports.find(imp => imp.namedImports.includes(call.methodName))
    if (sourceImport?.exportsInfo) {
      const sig = sourceImport.exportsInfo.functionParamCounts.get(call.methodName)
      if (sig) {
        if (call.argCount < sig.min || call.argCount > sig.max) {
          const expectedRange = sig.max === Infinity ? `>= ${sig.min}` : `${sig.min}-${sig.max}`
          warnings.push({
            type: "signature-mismatch",
            message: `Function '${call.methodName}' expects ${expectedRange} arguments, but got ${call.argCount}`,
            file: filePath,
            line: call.line,
          })
        }
      }
    }
  }

  return warnings
}

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
