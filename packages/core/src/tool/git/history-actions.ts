import { execFileSync } from "node:child_process"
import { relative, resolve, sep } from "node:path"

export type GitHistoryAction = "pickaxe" | "regex_history" | "blame_range" | "show_at_ref" | "compare_history"

export interface GitHistoryInput {
  action: GitHistoryAction
  files: string[]
  query?: string
  ref?: string
  baseRef?: string
  headRef?: string
  startLine?: number
  endLine?: number
  maxCount: number
}

export function executeGitHistoryAction(workdir: string, input: GitHistoryInput): string {
  switch (input.action) {
    case "pickaxe":
      return searchHistory(workdir, "-S", required(input.query, "query"), input.files, input.maxCount)
    case "regex_history":
      return searchHistory(workdir, "-G", required(input.query, "query"), input.files, input.maxCount)
    case "blame_range":
      return blameRange(workdir, oneFile(input.files), input.startLine, input.endLine)
    case "show_at_ref":
      return showAtRef(workdir, oneFile(input.files), validateRef(input.ref ?? "HEAD"))
    case "compare_history":
      return compareHistory(workdir, validateRef(input.baseRef ?? "HEAD~10"), validateRef(input.headRef ?? "HEAD"), input.files, input.maxCount)
  }
}

function searchHistory(workdir: string, flag: "-S" | "-G", query: string, files: string[], maxCount: number): string {
  const args = ["log", `--max-count=${maxCount}`, "--date=iso", "--format=%H%x1f%ad%x1f%an%x1f%s", `${flag}${query}`]
  if (files.length) args.push("--", ...files.map(file => repoPath(workdir, file)))
  const output = git(workdir, args)
  return formatLog(output, { mode: flag === "-S" ? "pickaxe" : "regex", query })
}

function blameRange(workdir: string, file: string, startLine = 1, endLine = startLine): string {
  const start = Math.max(1, Math.floor(startLine))
  const end = Math.max(start, Math.floor(endLine))
  const path = repoPath(workdir, file)
  const output = git(workdir, ["blame", "--line-porcelain", `-L${start},${end}`, "--", path])
  const records = parseBlame(output)
  return JSON.stringify({ file: path, range: { start, end }, records }, null, 2)
}

function showAtRef(workdir: string, file: string, ref: string): string {
  const path = repoPath(workdir, file)
  const output = git(workdir, ["show", `${ref}:${path}`])
  return [`File: ${path}`, `Ref: ${ref}`, "", output].join("\n")
}

function compareHistory(workdir: string, base: string, head: string, files: string[], maxCount: number): string {
  const args = ["log", `--max-count=${maxCount}`, "--date=iso", "--format=%H%x1f%ad%x1f%an%x1f%s", `${base}..${head}`]
  if (files.length) args.push("--", ...files.map(file => repoPath(workdir, file)))
  return formatLog(git(workdir, args), { mode: "compare", base, head })
}

function parseBlame(output: string): Array<{ commit: string; author: string; date: string; line: number; text: string }> {
  const lines = output.split(/\r?\n/)
  const result: Array<{ commit: string; author: string; date: string; line: number; text: string }> = []
  let current: { commit: string; author: string; date: string; line: number } | undefined
  for (const line of lines) {
    const header = /^([0-9a-f^]{7,40})\s+\d+\s+(\d+)/.exec(line)
    if (header) current = { commit: header[1]!, line: Number(header[2]), author: "", date: "" }
    else if (current && line.startsWith("author ")) current.author = line.slice(7)
    else if (current && line.startsWith("author-time ")) current.date = new Date(Number(line.slice(12)) * 1000).toISOString()
    else if (current && line.startsWith("\t")) {
      result.push({ ...current, text: line.slice(1) })
      current = undefined
    }
  }
  return result
}

function formatLog(output: string, meta: Record<string, string>): string {
  const commits = output.split(/\r?\n/).filter(Boolean).map(line => {
    const [hash = "", date = "", author = "", subject = ""] = line.split("\x1f")
    return { hash, date, author, subject }
  })
  return JSON.stringify({ ...meta, commits }, null, 2)
}

function git(workdir: string, args: string[]): string {
  try {
    return execFileSync("git", ["-C", workdir, ...args], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 8 * 1024 * 1024, timeout: 15_000,
    }).trim()
  } catch (error) {
    const stderr = (error as { stderr?: Buffer | string }).stderr
    throw new Error(typeof stderr === "string" ? stderr.trim() : stderr?.toString("utf8").trim() || String(error))
  }
}

function repoPath(workdir: string, file: string): string {
  const root = resolve(workdir)
  const absolute = resolve(root, file)
  if (absolute !== root && !absolute.startsWith(root + sep)) throw new Error(`Path is outside repository: ${file}`)
  return relative(root, absolute).replaceAll("\\", "/")
}

function validateRef(ref: string): string {
  if (!ref || ref.startsWith("-") || !/^[A-Za-z0-9_./~^{}:@-]+$/.test(ref)) throw new Error(`Invalid git ref: ${ref}`)
  return ref
}

function oneFile(files: string[]): string {
  if (files.length !== 1) throw new Error("Exactly one file is required for this action")
  return files[0]!
}

function required(value: string | undefined, label: string): string {
  if (!value?.trim()) throw new Error(`${label} is required`)
  return value
}
