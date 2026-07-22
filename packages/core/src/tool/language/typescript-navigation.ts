import ts from "typescript"
import { readFile, writeFile } from "node:fs/promises"
import { dirname, relative, resolve } from "node:path"
import { gateGuard } from "../../permission/gateguard.js"
import { WorkspaceTransaction } from "../../transaction/workspace-transaction.js"
import type { ExecuteResult, ToolContext } from "../types.js"

export type NavigationAction =
  | "definition" | "references" | "hover" | "document_symbols"
  | "call_hierarchy" | "rename_preview" | "rename_apply"

export interface NavigationInput {
  action: NavigationAction
  path: string
  line?: number
  column?: number
  symbol?: string
  direction?: "incoming" | "outgoing" | "both"
  newName?: string
}

interface Location {
  path: string
  line: number
  column: number
  endLine: number
  endColumn: number
}

export async function executeTypeScriptNavigation(
  input: NavigationInput,
  ctx: ToolContext,
): Promise<ExecuteResult> {
  const fileName = resolveInside(ctx.workdir, input.path)
  const source = await readFile(fileName, "utf8")
  const service = createService(ctx.workdir, fileName)
  const position = resolvePosition(source, fileName, input)

  if (input.action === "document_symbols") {
    return { output: JSON.stringify(flattenNavigationTree(service.getNavigationTree(fileName), fileName, service, ctx.workdir), null, 2) }
  }
  if (position === undefined) return { output: "", error: "line+column or symbol is required for this navigation action" }

  switch (input.action) {
    case "definition":
      return jsonLocations(service.getDefinitionAtPosition(fileName, position), service, ctx.workdir)
    case "references":
      return jsonLocations(service.getReferencesAtPosition(fileName, position), service, ctx.workdir)
    case "hover": {
      const info = service.getQuickInfoAtPosition(fileName, position)
      if (!info) return { output: "No hover/type information found." }
      return { output: JSON.stringify({
        kind: info.kind,
        display: ts.displayPartsToString(info.displayParts),
        documentation: ts.displayPartsToString(info.documentation),
        tags: info.tags?.map(tag => ({ name: tag.name, text: ts.displayPartsToString(tag.text) })) ?? [],
      }, null, 2) }
    }
    case "call_hierarchy":
      return callHierarchy(service, fileName, position, input.direction ?? "both", ctx.workdir)
    case "rename_preview":
      return rename(service, fileName, position, input.newName, ctx, false)
    case "rename_apply":
      return rename(service, fileName, position, input.newName, ctx, true)
  }
}

function createService(workdir: string, seedFile: string): ts.LanguageService {
  const configPath = ts.findConfigFile(dirname(seedFile), ts.sys.fileExists, "tsconfig.json")
    ?? ts.findConfigFile(workdir, ts.sys.fileExists, "tsconfig.json")
  let files = [seedFile]
  let options: ts.CompilerOptions = {
    allowJs: true, checkJs: false, jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
  }
  if (configPath) {
    const config = ts.readConfigFile(configPath, ts.sys.readFile)
    if (!config.error) {
      const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath))
      files = parsed.fileNames.includes(seedFile) ? parsed.fileNames : [...parsed.fileNames, seedFile]
      options = parsed.options
    }
  }
  const versions = new Map<string, string>()
  const host: ts.LanguageServiceHost = {
    getCompilationSettings: () => options,
    getScriptFileNames: () => files,
    getScriptVersion: file => versions.get(file) ?? "0",
    getScriptSnapshot: file => {
      const text = ts.sys.readFile(file)
      return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text)
    },
    getCurrentDirectory: () => workdir,
    getDefaultLibFileName: opts => ts.getDefaultLibFilePath(opts),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  }
  return ts.createLanguageService(host, ts.createDocumentRegistry())
}

function resolvePosition(source: string, fileName: string, input: NavigationInput): number | undefined {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true)
  if (input.line !== undefined) {
    const line = Math.max(0, input.line - 1)
    const column = Math.max(0, (input.column ?? 1) - 1)
    if (line >= sourceFile.getLineStarts().length) throw new Error(`line ${input.line} is outside ${input.path}`)
    return sourceFile.getPositionOfLineAndCharacter(line, column)
  }
  if (input.symbol) {
    const match = new RegExp(`\\b${escapeRegex(input.symbol)}\\b`).exec(source)
    if (!match) throw new Error(`symbol '${input.symbol}' was not found in ${input.path}`)
    return match.index
  }
  return undefined
}

function jsonLocations(
  entries: readonly { fileName: string; textSpan: ts.TextSpan }[] | undefined,
  service: ts.LanguageService,
  workdir: string,
): ExecuteResult {
  if (!entries?.length) return { output: "No locations found." }
  return { output: JSON.stringify(entries.map(entry => toLocation(entry.fileName, entry.textSpan, service, workdir)), null, 2) }
}

function toLocation(fileName: string, span: ts.TextSpan, service: ts.LanguageService, workdir: string): Location {
  const source = service.getProgram()?.getSourceFile(fileName)
  if (!source) return { path: relative(workdir, fileName), line: 1, column: span.start + 1, endLine: 1, endColumn: span.start + span.length + 1 }
  const start = source.getLineAndCharacterOfPosition(span.start)
  const end = source.getLineAndCharacterOfPosition(span.start + span.length)
  return {
    path: relative(workdir, fileName),
    line: start.line + 1,
    column: start.character + 1,
    endLine: end.line + 1,
    endColumn: end.character + 1,
  }
}

function flattenNavigationTree(
  root: ts.NavigationTree,
  fileName: string,
  service: ts.LanguageService,
  workdir: string,
): Array<{ name: string; kind: string; location: Location }> {
  const result: Array<{ name: string; kind: string; location: Location }> = []
  const visit = (item: ts.NavigationTree) => {
    if (item.text !== "<global>" && item.spans[0]) {
      result.push({ name: item.text, kind: item.kind, location: toLocation(fileName, item.spans[0], service, workdir) })
    }
    item.childItems?.forEach(visit)
  }
  visit(root)
  return result.slice(0, 500)
}

function callHierarchy(
  service: ts.LanguageService,
  fileName: string,
  position: number,
  direction: "incoming" | "outgoing" | "both",
  workdir: string,
): ExecuteResult {
  const prepared = service.prepareCallHierarchy(fileName, position)
  if (!prepared) return { output: "No call hierarchy item found." }
  const items = Array.isArray(prepared) ? prepared : [prepared]
  const result = items.map(item => ({
    item: hierarchyItem(item, service, workdir),
    ...(direction !== "outgoing" ? {
      incoming: service.provideCallHierarchyIncomingCalls(item.file, item.selectionSpan.start)
        .map(call => hierarchyItem(call.from, service, workdir)),
    } : {}),
    ...(direction !== "incoming" ? {
      outgoing: service.provideCallHierarchyOutgoingCalls(item.file, item.selectionSpan.start)
        .map(call => hierarchyItem(call.to, service, workdir)),
    } : {}),
  }))
  return { output: JSON.stringify(result, null, 2) }
}

function hierarchyItem(item: ts.CallHierarchyItem, service: ts.LanguageService, workdir: string) {
  return { name: item.name, kind: item.kind, location: toLocation(item.file, item.selectionSpan, service, workdir) }
}

async function rename(
  service: ts.LanguageService,
  fileName: string,
  position: number,
  newName: string | undefined,
  ctx: ToolContext,
  apply: boolean,
): Promise<ExecuteResult> {
  if (!newName || !/^[$A-Z_a-z][$\w]*$/.test(newName)) return { output: "", error: "new_name must be a valid JavaScript identifier" }
  const info = service.getRenameInfo(fileName, position, { allowRenameOfImportPath: false })
  if (!info.canRename) return { output: "", error: info.localizedErrorMessage }
  const locations = service.findRenameLocations(fileName, position, false, false, true) ?? []
  if (!locations.length) return { output: "No rename locations found." }
  const grouped = new Map<string, ts.RenameLocation[]>()
  for (const location of locations) {
    const absolute = resolveInside(ctx.workdir, location.fileName)
    if (gateGuard.check(absolute, ctx.workdir) === "deny") return { output: "", error: `Rename touches protected path: ${relative(ctx.workdir, absolute)}` }
    const list = grouped.get(absolute) ?? []
    list.push(location)
    grouped.set(absolute, list)
  }
  const preview = {
    symbol: info.displayName,
    newName,
    files: [...grouped.entries()].map(([path, edits]) => ({ path: relative(ctx.workdir, path), edits: edits.length })),
    totalEdits: locations.length,
  }
  if (!apply) return { output: JSON.stringify(preview, null, 2) }

  const transaction = await WorkspaceTransaction.begin(ctx.workdir, [...grouped.keys()])
  try {
    for (const [path, edits] of grouped) {
      let content = await readFile(path, "utf8")
      for (const edit of [...edits].sort((a, b) => b.textSpan.start - a.textSpan.start)) {
        const replacement = `${edit.prefixText ?? ""}${newName}${edit.suffixText ?? ""}`
        content = content.slice(0, edit.textSpan.start) + replacement + content.slice(edit.textSpan.start + edit.textSpan.length)
      }
      await writeFile(path, content, "utf8")
    }
    const record = await transaction?.commit()
    return {
      output: JSON.stringify({ ...preview, applied: true }, null, 2),
      metadata: { changedFiles: [...grouped.keys()].map(path => relative(ctx.workdir, path)), ...(record ? { transaction: record } : {}) },
    }
  } catch (error) {
    await transaction?.rollback()
    throw error
  }
}

function resolveInside(workdir: string, path: string): string {
  const root = resolve(workdir)
  const absolute = resolve(root, path)
  if (absolute !== root && !absolute.startsWith(root + "/")) throw new Error(`Path is outside workspace: ${path}`)
  return absolute
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
