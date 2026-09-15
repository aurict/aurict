import * as ts from "typescript"
import { readdir } from "node:fs/promises"
import { existsSync, readFileSync, statSync } from "node:fs"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import type {
  AnalysisScope,
  BlastRadiusAnalysis,
  BlastRadiusRequest,
  BlastResult,
  BreakResult,
  BreakSite,
  RefKind,
  RefSite,
} from "./blast-radius-contracts.js"

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", ".turbo", "build", "coverage", "out"])
const MAX_SOURCE_FILES = 2_000
const MAX_CONFIG_FILES = 64

interface ProjectContext {
  configPath: string | null
  currentDirectory: string
  fileNames: string[]
  options: ts.CompilerOptions
  projectReferences?: readonly ts.ProjectReference[]
  service: ts.LanguageService
  program: ts.Program
}

interface SymbolLocation {
  file: string
  position: number
  line: number
  project: ProjectContext
}

export async function analyzeBlastRadius(request: BlastRadiusRequest): Promise<BlastRadiusAnalysis> {
  const warnings: string[] = []
  const projects = await loadProjects(request.workdir, warnings)
  const declaration = findSymbolDeclaration(request.symbol, request.hintFile, projects)
  if (!declaration) {
    throw new Error(`Symbol '${request.symbol}' not found${request.hintFile ? ` in ${relative(request.workdir, request.hintFile)}` : " in configured TypeScript projects"}`)
  }

  const relevantProjects = projects.filter(project => project.program.getSourceFile(declaration.file))
  const analyzedProjects = relevantProjects.length ? relevantProjects : [declaration.project]
  const scope = buildScope(request.workdir, analyzedProjects)
  const analysis: BlastRadiusAnalysis = { warnings }
  if (request.mode !== "breaks") analysis.references = findReferences(request, declaration, analyzedProjects, scope)
  if (request.mode !== "references") analysis.breaks = simulateBreaks(request, declaration, analyzedProjects, scope)
  return analysis
}

async function loadProjects(workdir: string, warnings: string[]): Promise<ProjectContext[]> {
  const configPaths = await discoverConfigFiles(workdir)
  const pendingConfigs = [...configPaths]
  const seenConfigs = new Set(configPaths.map(config => resolve(config)))
  const parsedProjects: Array<Omit<ProjectContext, "service" | "program">> = []
  const uniqueFiles = new Set<string>()

  for (let configIndex = 0; configIndex < pendingConfigs.length; configIndex++) {
    const configPath = pendingConfigs[configIndex]!
    const localWarnings: string[] = []
    const host: ts.ParseConfigFileHost = {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: diagnostic => localWarnings.push(formatDiagnostic(diagnostic, workdir)),
    }
    const parsed = ts.getParsedCommandLineOfConfigFile(configPath, { noEmit: true }, host)
    if (!parsed) {
      warnings.push(...localWarnings.map(message => `${relative(workdir, configPath)}: ${message}`))
      continue
    }
    warnings.push(...localWarnings.map(message => `${relative(workdir, configPath)}: ${message}`))
    warnings.push(...parsed.errors.map(diagnostic => `${relative(workdir, configPath)}: ${formatDiagnostic(diagnostic, workdir)}`))
    for (const reference of parsed.projectReferences ?? []) {
      const referencedConfig = resolve(ts.resolveProjectReferencePath(reference))
      if (!isWithin(workdir, referencedConfig)) {
        warnings.push(`${relative(workdir, configPath)}: skipped project reference outside the analyzed workspace (${referencedConfig})`)
        continue
      }
      if (seenConfigs.has(referencedConfig)) continue
      if (pendingConfigs.length >= MAX_CONFIG_FILES) {
        throw new Error(`Too many TypeScript project configs; limit is ${MAX_CONFIG_FILES}`)
      }
      seenConfigs.add(referencedConfig)
      pendingConfigs.push(referencedConfig)
    }
    const fileNames = parsed.fileNames.filter(file => isWithin(workdir, file) && !file.endsWith(".d.ts"))
    if (fileNames.length === 0) continue
    for (const file of fileNames) uniqueFiles.add(file)
    assertFileLimit(uniqueFiles.size)
    parsedProjects.push({
      configPath,
      currentDirectory: dirname(configPath),
      fileNames,
      options: { ...parsed.options, noEmit: true },
      ...(parsed.projectReferences ? { projectReferences: parsed.projectReferences } : {}),
    })
  }

  if (parsedProjects.length === 0) {
    if (pendingConfigs.length > 0 && warnings.length > 0) {
      throw new Error(`No valid TypeScript project could be loaded:\n${warnings.join("\n")}`)
    }
    const fileNames = await collectSourceFiles(workdir)
    if (fileNames.length === 0) throw new Error("No TypeScript files found in workdir")
    parsedProjects.push({
      configPath: null,
      currentDirectory: workdir,
      fileNames,
      options: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        noEmit: true,
        skipLibCheck: true,
        allowSyntheticDefaultImports: true,
      },
    })
  }

  return parsedProjects.map(project => {
    const service = createLanguageService(project)
    const program = service.getProgram()
    if (!program) throw new Error(`TypeScript program could not be created for ${project.configPath ?? workdir}`)
    return { ...project, service, program }
  })
}

async function discoverConfigFiles(workdir: string): Promise<string[]> {
  const found: string[] = []
  async function walk(current: string, depth: number): Promise<void> {
    if (depth > 8) return
    let entries
    try {
      entries = await readdir(current, { withFileTypes: true })
    } catch (error) {
      throw new Error(`Failed to scan TypeScript projects at ${current}`, { cause: error })
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (SKIP_DIRS.has(entry.name)) continue
      const full = join(current, entry.name)
      if (entry.isDirectory()) await walk(full, depth + 1)
      else if (entry.name === "tsconfig.json") {
        if (found.length >= MAX_CONFIG_FILES) {
          throw new Error(`Too many TypeScript project configs; limit is ${MAX_CONFIG_FILES}`)
        }
        found.push(full)
      }
    }
  }
  await walk(workdir, 0)
  return found
}

async function collectSourceFiles(workdir: string): Promise<string[]> {
  const files: string[] = []
  async function walk(current: string, depth: number): Promise<void> {
    if (depth > 12) return
    const entries = await readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue
      const full = join(current, entry.name)
      if (entry.isDirectory()) await walk(full, depth + 1)
      else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) files.push(full)
      assertFileLimit(files.length)
    }
  }
  await walk(workdir, 0)
  return files
}

function createLanguageService(project: Omit<ProjectContext, "service" | "program">): ts.LanguageService {
  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => project.fileNames,
    getScriptVersion: file => {
      try { return String(statSync(file).mtimeMs) }
      catch (error) { throw new Error(`Failed to stat TypeScript source: ${file}`, { cause: error }) }
    },
    getScriptSnapshot: file => {
      const content = ts.sys.readFile(file)
      return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content)
    },
    getCurrentDirectory: () => project.currentDirectory,
    getCompilationSettings: () => project.options,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    // Project references are used for project discovery, while the language
    // service resolves source redirects directly. Requiring already-emitted
    // declaration outputs here would hide cross-package references in a clean checkout.
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  }
  return ts.createLanguageService(host, ts.createDocumentRegistry())
}

function findSymbolDeclaration(symbol: string, hintFile: string | undefined, projects: ProjectContext[]): SymbolLocation | null {
  const ordered = hintFile
    ? [...projects.filter(project => project.program.getSourceFile(hintFile)), ...projects.filter(project => !project.program.getSourceFile(hintFile))]
    : projects
  for (const project of ordered) {
    const hinted = hintFile ? project.program.getSourceFile(hintFile) : undefined
    const sources = hintFile ? (hinted ? [hinted] : []) : project.program.getSourceFiles()
    for (const source of sources) {
      if (source.isDeclarationFile || source.fileName.includes("node_modules")) continue
      let found: SymbolLocation | null = null
      const visit = (node: ts.Node): void => {
        if (found) return
        const name = declarationName(node)
        if (name?.text === symbol) {
          const position = name.getStart(source)
          found = { file: source.fileName, position, line: source.getLineAndCharacterOfPosition(position).line + 1, project }
          return
        }
        ts.forEachChild(node, visit)
      }
      ts.forEachChild(source, visit)
      if (found) return found
    }
  }
  return null
}

function declarationName(node: ts.Node): ts.Identifier | undefined {
  if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)
    || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) return node.name
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) return node.name
  return undefined
}

function findReferences(request: BlastRadiusRequest, declaration: SymbolLocation, projects: ProjectContext[], scope: AnalysisScope): BlastResult {
  const refs: RefSite[] = []
  const seen = new Set<string>()
  const packageMap = detectPackages(request.workdir)
  const packages = new Set<string>()
  for (const project of projects) {
    for (const group of project.service.findReferences(declaration.file, declaration.position) ?? []) {
      for (const ref of group.references) {
        if (ref.isDefinition) continue
        const source = project.program.getSourceFile(ref.fileName)
        if (!source || !isWithin(request.workdir, ref.fileName)) continue
        const key = `${ref.fileName}:${ref.textSpan.start}`
        if (seen.has(key)) continue
        seen.add(key)
        const { line, character } = source.getLineAndCharacterOfPosition(ref.textSpan.start)
        if (ref.fileName === declaration.file && line + 1 === declaration.line) continue
        const kind = classifyRef(source, ref.textSpan.start)
        refs.push({
          file: relative(request.workdir, ref.fileName),
          line: line + 1,
          col: character + 1,
          container: kind === "import" || kind === "re-export" ? kind : getContainer(source, ref.textSpan.start),
          snippet: source.text.split("\n")[line] ?? "",
          kind,
        })
        packages.add(packageOf(ref.fileName, packageMap))
      }
    }
  }
  refs.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
  return { symbol: request.symbol, declFile: relative(request.workdir, declaration.file), declLine: declaration.line, refs, packages: [...packages].sort(), scope }
}

function simulateBreaks(request: BlastRadiusRequest, declaration: SymbolLocation, projects: ProjectContext[], scope: AnalysisScope): BreakResult {
  const from = request.from ?? ""
  const to = request.to ?? ""
  const original = readFileSync(declaration.file, "utf8")
  const span = flexMatch(original, from)
  if (!span) return { from, to, declFile: relative(request.workdir, declaration.file), breaks: [], clean: false, applied: false, scope }
  const modified = original.slice(0, span.start) + to + original.slice(span.end)
  const breaks = new Map<string, BreakSite>()

  for (const project of projects) {
    const baselineDiagnostics = collectDiagnostics(createProgram(project), request.workdir)
    for (const [key, diagnostic] of collectDiagnostics(createProgram(project, { file: declaration.file, content: modified }), request.workdir)) {
      if (baselineDiagnostics.has(key) || !diagnostic.file || diagnostic.start === undefined) continue
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
      const site = {
        file: relative(request.workdir, diagnostic.file.fileName),
        line: line + 1,
        col: character + 1,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
        code: diagnostic.code,
      }
      breaks.set(`${site.file}:${site.line}:${site.col}:${site.code}`, site)
    }
  }
  const sites = [...breaks.values()].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
  return { from, to, declFile: relative(request.workdir, declaration.file), breaks: sites, clean: sites.length === 0, applied: true, scope }
}

function createProgram(project: ProjectContext, override?: { file: string; content: string }): ts.Program {
  const base = ts.createCompilerHost(project.options)
  const host: ts.CompilerHost = override ? {
    ...base,
    getSourceFile: (file, languageVersion) => file === override.file ? ts.createSourceFile(file, override.content, languageVersion) : base.getSourceFile(file, languageVersion),
    readFile: file => file === override.file ? override.content : base.readFile(file),
    fileExists: file => file === override.file || base.fileExists(file),
  } : base
  return ts.createProgram({ rootNames: project.fileNames, options: project.options, host })
}

function collectDiagnostics(program: ts.Program, workdir: string): Map<string, ts.Diagnostic> {
  const diagnostics = new Map<string, ts.Diagnostic>()
  for (const source of program.getSourceFiles()) {
    if (source.isDeclarationFile || !isWithin(workdir, source.fileName)) continue
    for (const diagnostic of [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)]) diagnostics.set(diagnosticKey(diagnostic), diagnostic)
  }
  return diagnostics
}

function diagnosticKey(diagnostic: ts.Diagnostic): string {
  if (!diagnostic.file || diagnostic.start === undefined) return `${diagnostic.code}:nofile:${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`
  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
  return `${diagnostic.file.fileName}:${line}:${character}:${diagnostic.code}`
}

function classifyRef(source: ts.SourceFile, position: number): RefKind {
  const path: ts.Node[] = []
  const collect = (node: ts.Node): void => {
    if (position < node.pos || position >= node.end) return
    path.push(node)
    ts.forEachChild(node, collect)
  }
  collect(source)
  for (const node of path.reverse()) {
    if (ts.isImportSpecifier(node) || ts.isImportClause(node) || ts.isNamespaceImport(node)) return "import"
    if (ts.isExportSpecifier(node)) return "re-export"
    if (ts.isCallExpression(node)) return "call"
  }
  return "type"
}

function getContainer(source: ts.SourceFile, position: number): string {
  let container = "<module>"
  const visit = (node: ts.Node): void => {
    if (position < node.pos || position > node.end) return
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) container = node.name.text
    else if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) container = node.name.text
    else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer
      && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) container = node.name.text
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(source, visit)
  return container
}

function flexMatch(content: string, from: string): { start: number; end: number } | null {
  const exact = content.indexOf(from)
  if (exact !== -1) return { start: exact, end: exact + from.length }
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")
  const match = content.match(new RegExp(escaped))
  return match?.index === undefined ? null : { start: match.index, end: match.index + match[0].length }
}

function buildScope(workdir: string, projects: ProjectContext[]): AnalysisScope {
  return {
    configured: projects.some(project => project.configPath !== null),
    configFiles: projects.flatMap(project => project.configPath ? [relative(workdir, project.configPath)] : []),
    analyzedFiles: new Set(projects.flatMap(project => project.fileNames)).size,
  }
}

function detectPackages(workdir: string): Map<string, string> {
  const packages = new Map<string, string>()
  const root = join(workdir, "packages")
  if (!existsSync(root)) return packages
  for (const directory of ts.sys.getDirectories(root)) {
    const packageJson = join(directory, "package.json")
    if (!existsSync(packageJson)) continue
    try {
      const metadata = JSON.parse(readFileSync(packageJson, "utf8")) as { name?: string }
      packages.set(directory, metadata.name ?? relative(root, directory))
    } catch (error) {
      throw new Error(`Invalid package metadata: ${packageJson}`, { cause: error })
    }
  }
  return packages
}

function packageOf(file: string, packages: Map<string, string>): string {
  for (const [root, name] of packages) if (isWithin(root, file)) return name
  return "root"
}

function isWithin(root: string, candidate: string): boolean {
  const value = relative(resolve(root), resolve(candidate))
  return value === "" || (!value.startsWith("..") && !isAbsolute(value))
}

function assertFileLimit(count: number): void {
  if (count > MAX_SOURCE_FILES) throw new Error(`Too many TypeScript source files (${count}); narrow the workdir or project configuration`)
}

function formatDiagnostic(diagnostic: ts.Diagnostic, workdir: string): string {
  return ts.formatDiagnostic(diagnostic, {
    getCanonicalFileName: file => relative(workdir, file),
    getCurrentDirectory: () => workdir,
    getNewLine: () => "\n",
  }).trim()
}
