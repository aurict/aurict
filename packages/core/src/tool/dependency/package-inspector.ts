import { readdir, readFile, realpath, stat } from "node:fs/promises"
import { dirname, join, relative, resolve, sep } from "node:path"

export type DependencyDocsAction = "resolve_package" | "search_export" | "read_type" | "read_docs" | "show_examples"

export interface DependencyDocsInput {
  action: DependencyDocsAction
  packageName: string
  query?: string
  symbol?: string
  maxResults: number
}

interface PackageManifest {
  name?: string
  version?: string
  description?: string
  types?: string
  typings?: string
  main?: string
  module?: string
  exports?: unknown
}

export async function inspectDependency(workdir: string, input: DependencyDocsInput): Promise<string> {
  validatePackageName(input.packageName)
  const packageDir = await findInstalledPackage(workdir, input.packageName)
  const manifestPath = join(packageDir, "package.json")
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as PackageManifest
  switch (input.action) {
    case "resolve_package":
      return JSON.stringify({
        name: manifest.name ?? input.packageName,
        version: manifest.version ?? "unknown",
        description: manifest.description ?? "",
        installedPath: relative(workdir, packageDir),
        types: manifest.types ?? manifest.typings ?? null,
        main: manifest.main ?? null,
        module: manifest.module ?? null,
        exports: manifest.exports ?? null,
      }, null, 2)
    case "search_export":
      return searchDeclarations(packageDir, manifest, input.query ?? input.symbol ?? "", input.maxResults, false)
    case "read_type":
      return searchDeclarations(packageDir, manifest, input.symbol ?? input.query ?? "", input.maxResults, true)
    case "read_docs":
      return readDocumentation(packageDir, input.query, false)
    case "show_examples":
      return readDocumentation(packageDir, input.query, true)
  }
}

async function findInstalledPackage(workdir: string, packageName: string): Promise<string> {
  let current = resolve(workdir)
  while (true) {
    const candidate = join(current, "node_modules", ...packageName.split("/"))
    try {
      if ((await stat(join(candidate, "package.json"))).isFile()) return await realpath(candidate)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  throw new Error(`Installed package not found: ${packageName}`)
}

async function searchDeclarations(
  packageDir: string,
  manifest: PackageManifest,
  query: string,
  maxResults: number,
  includeContext: boolean,
): Promise<string> {
  const needle = query.trim()
  if (!needle) throw new Error(`${includeContext ? "symbol" : "query"} is required`)
  const files = await declarationFiles(packageDir, manifest)
  const matches: Array<{ path: string; line: number; text: string; context?: string }> = []
  const pattern = new RegExp(`\\b${escapeRegex(needle)}\\b`, "i")
  for (const file of files) {
    const content = await readFile(file, "utf8")
    const lines = content.split(/\r?\n/)
    for (let index = 0; index < lines.length; index++) {
      if (!pattern.test(lines[index]!)) continue
      const match: { path: string; line: number; text: string; context?: string } = {
        path: relative(packageDir, file), line: index + 1, text: lines[index]!.trim(),
      }
      if (includeContext) {
        const start = Math.max(0, index - 3)
        const end = Math.min(lines.length, index + 18)
        match.context = lines.slice(start, end).map((line, offset) => `${start + offset + 1}: ${line}`).join("\n")
      }
      matches.push(match)
      if (matches.length >= maxResults) return JSON.stringify({ query: needle, matches, truncated: true }, null, 2)
    }
  }
  return matches.length
    ? JSON.stringify({ query: needle, matches, truncated: false }, null, 2)
    : `No declaration matching '${needle}' was found in the installed package.`
}

async function declarationFiles(packageDir: string, manifest: PackageManifest): Promise<string[]> {
  const preferred = manifest.types ?? manifest.typings
  const result: string[] = []
  if (preferred) {
    const target = resolve(packageDir, preferred)
    try {
      if ((await stat(target)).isFile()) result.push(target)
    } catch { /* Continue with bounded discovery. */ }
  }
  await walk(packageDir, result, file => file.endsWith(".d.ts") || file.endsWith(".d.mts") || file.endsWith(".d.cts"), 250)
  return [...new Set(result)]
}

async function readDocumentation(packageDir: string, query: string | undefined, examplesOnly: boolean): Promise<string> {
  const entries = await readdir(packageDir)
  const name = entries.find(entry => /^readme(?:\.md|\.txt)?$/i.test(entry))
    ?? entries.find(entry => /^changelog(?:\.md|\.txt)?$/i.test(entry))
  if (!name) return "This installed package does not include a README or changelog."
  const content = await readFile(join(packageDir, name), "utf8")
  if (examplesOnly) {
    const blocks = [...content.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map(match => match[0])
    const selected = query ? blocks.filter(block => block.toLowerCase().includes(query.toLowerCase())) : blocks
    return selected.slice(0, 8).join("\n\n") || `No examples${query ? ` matching '${query}'` : ""} found.`
  }
  if (!query?.trim()) return content.split(/\r?\n/).slice(0, 240).join("\n")
  const lines = content.split(/\r?\n/)
  const indexes = lines.flatMap((line, index) => line.toLowerCase().includes(query.toLowerCase()) ? [index] : [])
  if (!indexes.length) return `No documentation matching '${query}' found in ${name}.`
  const chunks = indexes.slice(0, 8).map(index => lines.slice(Math.max(0, index - 4), Math.min(lines.length, index + 12)).join("\n"))
  return chunks.join("\n\n---\n\n")
}

async function walk(dir: string, output: string[], accept: (path: string) => boolean, limit: number): Promise<void> {
  if (output.length >= limit) return
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return }
  for (const entry of entries) {
    if (output.length >= limit) return
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await walk(path, output, accept, limit)
    else if (entry.isFile() && accept(path)) output.push(path)
  }
}

function validatePackageName(name: string): void {
  if (!/^(?:@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/i.test(name) || name.includes("..") || name.includes(sep + sep)) {
    throw new Error(`Invalid package name: ${name}`)
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
