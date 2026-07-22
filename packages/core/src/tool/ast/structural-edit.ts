import ts from "typescript"
import { createHash } from "node:crypto"
import { readdir, readFile, writeFile } from "node:fs/promises"
import { join, relative, resolve } from "node:path"
import { gateGuard } from "../../permission/gateguard.js"
import { WorkspaceTransaction } from "../../transaction/workspace-transaction.js"
import type { ExecuteResult, ToolContext } from "../types.js"

export type AstNodeKind = "call_callee" | "property_access" | "import_source"
export type AstEditAction = "match" | "preview" | "apply" | "verify"

export interface AstEditInput {
  action: AstEditAction
  kind: AstNodeKind
  match: string
  replacement?: string
  paths: string[]
  previewId?: string
  maxFiles: number
}

interface Edit { start: number; end: number; replacement: string; line: number; before: string }
interface FilePlan { path: string; hash: string; edits: Edit[] }
interface Preview { id: string; sessionId: string; createdAt: number; inputHash: string; plans: FilePlan[] }

const previews = new Map<string, Preview>()
const PREVIEW_TTL_MS = 10 * 60_000

export async function executeAstEdit(input: AstEditInput, ctx: ToolContext): Promise<ExecuteResult> {
  prunePreviews()
  if (input.action === "apply") return applyPreview(input, ctx)
  if (input.action === "verify") return verifyFiles(input.paths, ctx.workdir)
  if (!input.match.trim()) return { output: "", error: "match is required" }
  if (input.action === "preview" && input.replacement === undefined) return { output: "", error: "replacement is required for preview" }
  const files = await collectSourceFiles(ctx.workdir, input.paths, input.maxFiles)
  const plans: FilePlan[] = []
  for (const path of files) {
    const content = await readFile(path, "utf8")
    const edits = findEdits(path, content, input.kind, input.match, input.replacement ?? input.match)
    if (edits.length) plans.push({ path, hash: hash(content), edits })
  }
  const summary = summarize(plans, ctx.workdir)
  if (input.action === "match") return { output: JSON.stringify(summary, null, 2) }
  const inputHash = hash(JSON.stringify({ kind: input.kind, match: input.match, replacement: input.replacement, paths: input.paths }))
  const id = crypto.randomUUID()
  previews.set(id, { id, sessionId: ctx.sessionId, createdAt: Date.now(), inputHash, plans })
  return { output: JSON.stringify({ previewId: id, ...summary, expiresInSeconds: PREVIEW_TTL_MS / 1000 }, null, 2) }
}

function findEdits(file: string, content: string, kind: AstNodeKind, match: string, replacement: string): Edit[] {
  const scriptKind = file.endsWith(".tsx") || file.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, scriptKind)
  const edits: Edit[] = []
  const add = (node: ts.Node, start = node.getStart(source), end = node.getEnd()) => {
    const pos = source.getLineAndCharacterOfPosition(start)
    edits.push({ start, end, replacement, line: pos.line + 1, before: content.slice(start, end) })
  }
  const visit = (node: ts.Node): void => {
    if (kind === "call_callee" && ts.isCallExpression(node) && node.expression.getText(source) === match) add(node.expression)
    if (kind === "property_access" && ts.isPropertyAccessExpression(node) && node.getText(source) === match) add(node)
    if (kind === "import_source" && ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === match) {
      add(node.moduleSpecifier, node.moduleSpecifier.getStart(source) + 1, node.moduleSpecifier.getEnd() - 1)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return edits
}

async function applyPreview(input: AstEditInput, ctx: ToolContext): Promise<ExecuteResult> {
  if (!input.previewId) return { output: "", error: "preview_id is required; call action=preview first" }
  const preview = previews.get(input.previewId)
  if (!preview || preview.sessionId !== ctx.sessionId) return { output: "", error: "Preview is missing, expired, or belongs to another session" }
  const expectedInputHash = hash(JSON.stringify({ kind: input.kind, match: input.match, replacement: input.replacement, paths: input.paths }))
  if (expectedInputHash !== preview.inputHash) return { output: "", error: "Apply arguments do not match the approved preview" }
  for (const plan of preview.plans) {
    const current = await readFile(plan.path, "utf8")
    if (hash(current) !== plan.hash) return { output: "", error: `Workspace changed after preview: ${relative(ctx.workdir, plan.path)}. Preview again.` }
    const decision = gateGuard.check(plan.path, ctx.workdir)
    if (decision !== "allow") return { output: "", error: `AST edit cannot modify protected path (${decision}): ${relative(ctx.workdir, plan.path)}` }
  }
  const transaction = await WorkspaceTransaction.begin(ctx.workdir, preview.plans.map(plan => plan.path))
  try {
    for (const plan of preview.plans) {
      let content = await readFile(plan.path, "utf8")
      for (const edit of [...plan.edits].sort((a, b) => b.start - a.start)) {
        content = content.slice(0, edit.start) + edit.replacement + content.slice(edit.end)
      }
      await writeFile(plan.path, content, "utf8")
    }
    const verification = await verifyFiles(preview.plans.map(plan => plan.path), ctx.workdir)
    if (verification.error) {
      await transaction?.rollback()
      return { output: verification.output, error: `AST edit rolled back: ${verification.error}` }
    }
    const record = await transaction?.commit()
    previews.delete(preview.id)
    const changedFiles = preview.plans.map(plan => relative(ctx.workdir, plan.path))
    return {
      output: JSON.stringify({ applied: true, changedFiles, edits: preview.plans.reduce((sum, plan) => sum + plan.edits.length, 0), verification: "syntax passed" }, null, 2),
      metadata: { changedFiles, ...(record ? { transaction: record } : {}) },
    }
  } catch (error) {
    await transaction?.rollback()
    throw error
  }
}

async function verifyFiles(paths: string[], workdir: string): Promise<ExecuteResult> {
  const files = await collectSourceFiles(workdir, paths, 200)
  const errors: Array<{ path: string; message: string }> = []
  for (const file of files) {
    const content = await readFile(file, "utf8")
    const diagnostics = ts.transpileModule(content, {
      fileName: file,
      reportDiagnostics: true,
      compilerOptions: { noEmit: true, jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
    }).diagnostics ?? []
    for (const diagnostic of diagnostics) {
      errors.push({ path: relative(workdir, file), message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n") })
    }
  }
  return errors.length
    ? { output: JSON.stringify({ errors }, null, 2), error: `${errors.length} syntax error(s) found` }
    : { output: JSON.stringify({ verifiedFiles: files.map(file => relative(workdir, file)), syntax: "passed" }, null, 2) }
}

async function collectSourceFiles(workdir: string, patterns: string[], maxFiles: number): Promise<string[]> {
  const root = resolve(workdir)
  const candidates: string[] = []
  const requested = patterns.length ? patterns : ["**/*.{ts,tsx,js,jsx}"]
  for (const pattern of requested) {
    const absolute = resolve(root, pattern)
    if (!pattern.includes("*") && !pattern.includes("?") && isInside(root, absolute)) {
      try {
        const entry = await Bun.file(absolute).exists()
        if (entry && /\.[cm]?[jt]sx?$/.test(absolute)) candidates.push(absolute)
      } catch { /* Continue with other paths. */ }
      continue
    }
    const glob = new Bun.Glob(pattern)
    for await (const relativePath of glob.scan({ cwd: root, onlyFiles: true })) {
      if (relativePath.includes("node_modules/") || relativePath.startsWith(".git/") || relativePath.startsWith(".aurict/")) continue
      if (/\.[cm]?[jt]sx?$/.test(relativePath)) candidates.push(resolve(root, relativePath))
      if (candidates.length >= maxFiles) break
    }
    if (candidates.length >= maxFiles) break
  }
  return [...new Set(candidates)].slice(0, maxFiles)
}

function summarize(plans: FilePlan[], workdir: string) {
  return {
    files: plans.map(plan => ({
      path: relative(workdir, plan.path),
      edits: plan.edits.length,
      matches: plan.edits.slice(0, 20).map(edit => ({ line: edit.line, before: edit.before, after: edit.replacement })),
    })),
    totalFiles: plans.length,
    totalEdits: plans.reduce((sum, plan) => sum + plan.edits.length, 0),
  }
}

function prunePreviews(): void {
  const threshold = Date.now() - PREVIEW_TTL_MS
  for (const [id, preview] of previews) if (preview.createdAt < threshold) previews.delete(id)
}

function hash(value: string): string { return createHash("sha256").update(value).digest("hex") }
function isInside(root: string, path: string): boolean { return path === root || path.startsWith(root + "/") }
