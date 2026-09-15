import type { AnalysisScope, BlastResult, BreakResult, BreakSite, RefSite } from "./blast-radius-contracts.js"

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m", cyan: "\x1b[36m",
  green: "\x1b[32m", yellow: "\x1b[33m", blue: "\x1b[34m", magenta: "\x1b[35m",
  red: "\x1b[31m", gray: "\x1b[90m",
}

export function formatBlastResult(result: BlastResult): string {
  const lines = ["", `${C.bold}${C.cyan}blast_radius${C.reset}  ${C.bold}${result.symbol}${C.reset}  ${C.gray}(${result.declFile}:${result.declLine})${C.reset}`, `${C.gray}${"─".repeat(60)}${C.reset}`, ""]
  if (result.refs.length === 0) {
    lines.push(`${C.yellow}No references found outside declaration file.${C.reset}`, "", formatScope(result.scope))
    return lines.join("\n")
  }
  const calls = result.refs.filter(ref => ref.kind === "call" || ref.kind === "type")
  const imports = result.refs.filter(ref => ref.kind === "import")
  const reexports = result.refs.filter(ref => ref.kind === "re-export")
  const headline: string[] = []
  if (calls.length) headline.push(`${C.green}${calls.length} call site${calls.length === 1 ? "" : "s"}${C.reset} across ${C.cyan}${new Set(calls.map(ref => ref.file)).size} files${C.reset}`)
  if (imports.length) headline.push(`${C.blue}${imports.length} import${imports.length === 1 ? "" : "s"}${C.reset}`)
  if (reexports.length) headline.push(`${C.gray}${reexports.length} re-export${reexports.length === 1 ? "" : "s"}${C.reset}`)
  lines.push(`${C.bold}References:${C.reset} ${headline.join("  ")}`, "")
  appendCallSites(lines, calls)
  appendImports(lines, imports)
  if (reexports.length) lines.push(`${C.gray}Re-exports: ${[...new Set(reexports.map(ref => ref.file))].join(", ")}${C.reset}`, "")
  if (result.packages.length > 1) lines.push(`${C.bold}Packages affected:${C.reset} ${result.packages.map(name => `${C.cyan}${name}${C.reset}`).join(", ")}`, "")
  lines.push(formatScope(result.scope))
  return lines.join("\n")
}

export function formatBreakResult(result: BreakResult): string {
  const lines = ["", `${C.bold}${C.cyan}break_analysis${C.reset}  ${C.gray}${result.declFile}${C.reset}`, `${C.gray}${"─".repeat(60)}${C.reset}`, "", `${C.dim}  from:${C.reset} ${C.yellow}${result.from}${C.reset}`, `${C.dim}    to:${C.reset} ${C.green}${result.to}${C.reset}`, ""]
  if (!result.applied) lines.push(`${C.yellow}⚠ 'from' text not found in declaration file — check the snippet is exact.${C.reset}`, "")
  else if (result.clean) lines.push(`${C.green}✓ No new type errors in the analyzed project scope.${C.reset}`, "")
  else {
    lines.push(`${C.bold}${C.red}✗ ${result.breaks.length} new error${result.breaks.length === 1 ? "" : "s"}${C.reset}`, "")
    appendBreakSites(lines, result.breaks)
  }
  lines.push(formatScope(result.scope))
  return lines.join("\n")
}

export function formatWarnings(warnings: string[]): string {
  return warnings.length ? `${C.yellow}Analysis warnings:${C.reset}\n${warnings.map(warning => `- ${warning}`).join("\n")}` : ""
}

function appendCallSites(lines: string[], refs: RefSite[]): void {
  for (const [file, sites] of groupByFile(refs)) {
    lines.push(`  ${C.blue}${file}${C.reset}`)
    for (const site of sites) {
      const container = site.kind === "type" ? `${site.container}[type]` : `${site.container}()`
      lines.push(`  ${C.gray}└─${C.reset} ${C.magenta}${container}${C.reset}${C.gray}:${site.line}${C.reset}`)
      lines.push(`     ${C.dim}${site.snippet.trim().slice(0, 72)}${C.reset}`)
    }
    lines.push("")
  }
}

function appendImports(lines: string[], refs: RefSite[]): void {
  if (!refs.length) return
  lines.push(`${C.bold}Imports:${C.reset}`)
  for (const [file, sites] of groupByFile(refs)) lines.push(`  ${C.blue}${file}${C.reset}  ${sites.map(site => `${C.gray}:${site.line}${C.reset}`).join(", ")}`)
  lines.push("")
}

function appendBreakSites(lines: string[], sites: BreakSite[]): void {
  for (const [file, entries] of groupByFile(sites)) {
    lines.push(`  ${C.blue}${file}${C.reset}`)
    for (const site of entries) lines.push(`  ${C.gray}└─:${site.line}:${site.col}${C.reset}  ${C.red}TS${site.code}${C.reset}  ${site.message}`)
    lines.push("")
  }
}

function groupByFile<T extends { file: string }>(items: T[]): Map<string, T[]> {
  const result = new Map<string, T[]>()
  for (const item of items) result.set(item.file, [...(result.get(item.file) ?? []), item])
  return result
}

function formatScope(scope: AnalysisScope): string {
  const configs = scope.configFiles.length ? scope.configFiles.join(", ") : "fallback TypeScript defaults"
  return `${C.gray}Analyzed scope: ${scope.analyzedFiles} root files · ${configs}${C.reset}`
}
