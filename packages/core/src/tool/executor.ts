import { join, resolve } from "path"
import { readFile } from "fs/promises"
import { hooks } from "../hook/emitter.js"
import { PermissionEvaluator } from "../permission/evaluator.js"
import { PermissionGate, PermissionStore } from "../permission/store.js"
import { gateGuard } from "../permission/gateguard.js"
import { addPart } from "../storage/queries.js"
import { classifyCommand } from "../terminal/classifier.js"
import { chooseSandboxBackend } from "../terminal/sandbox.js"
import { diagnosticsStore } from "../diagnostics/store.js"
import { truncateOutput, resolveTruncationConfig } from "./truncation.js"
import { toolResultCache } from "./cache.js"
import { metrics } from "../util/metrics.js"
import { shouldRunTsc, runIncrementalTsc, filterTscForFile } from "../verification/tsc.js"
import { detectHallucinations, formatHallucinationWarnings } from "../verification/hallucination.js"
import { withTscVerification } from "../verification/pipeline.js"
import { progressTracker, getToolProgressMessage } from "../util/progress.js"
import { prefetchManager, extractPrefetchHints } from "../util/prefetch.js"
import { changedFileAffectsSkillCache, invalidatePromptSectionsForChangedFile } from "../agent/prompt-invalidation.js"
import { clearSkillCache } from "../skill/injector.js"
import { isToolAllowedByActiveSkillPolicy } from "../skill/runtime-policy.js"
import { distillToolResult } from "./result-distiller.js"
import { updateWorkingSetFromTool } from "../agent/working-set.js"
import { recordFailureCooldown } from "../agent/failure-cooldown.js"
import { recordRunTrace } from "../agent/run-trace.js"
import type { ToolDef, ToolContext, ExecuteResult } from "./types.js"
import type { PermissionRequest, PermissionResponse } from "../permission/types.js"
import { filterPatchTextByFiles, summarizePatchText, type PatchSummary } from "./built-in/apply-patch.js"

export interface ExecutionEvent {
  type:    "permission_ask"
  request: PermissionRequest
}

type EventCallback = (event: ExecutionEvent) => void
const listeners = new Set<EventCallback>()

export const ExecutorEvents = {
  on(cb: EventCallback): () => void {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },
  emit(event: ExecutionEvent): void {
    listeners.forEach((cb) => cb(event))
  },
}

// Default max time a single tool call is allowed to run before it's aborted.
// Individual tools can override this with ToolDef.timeoutMs.
const TOOL_EXEC_TIMEOUT_MS = 120_000  // 2 minutes default
const PERMISSION_PROMPT_TIMEOUT_MS = 60_000
const POST_EDIT_TSC_TIMEOUT_MS = 6_000
const POST_EDIT_ANALYSIS_TIMEOUT_MS = 3_000
const POST_EDIT_TEST_DISCOVERY_TIMEOUT_MS = 3_000
const HOOK_TIMEOUT_MS = 5_000

// ── TypeScript file regex ──────────────────────────────────────────────────────
const TYPED_FILE_RE = /\.(ts|tsx|js|jsx|mts|cts)$/

function analyzeToolError(toolId: string, error: string): string {
  const e = error.toLowerCase()
  let hint = ""
  if (/cannot find module|module not found/.test(e))
    hint = "Module resolution failure — check path spelling, file existence, or whether a build step is needed."
  else if (/error ts\d+|\.tsx?.*:\d+:\d+/.test(e))
    hint = "TypeScript error — run 'tsc --noEmit' for the full error list before retrying."
  else if (/permission denied|eacces/.test(e))
    hint = "Permission denied — check file/directory permissions."
  else if (toolId === "bash" && /command not found|not found/.test(e))
    hint = "Binary not in PATH — check if it's installed: which <binary>"
  else if (/eaddrinuse|address already in use/.test(e))
    hint = "Port already in use — find the process: lsof -i :<port>"
  else if (/no such file or directory|enoent/.test(e))
    hint = "Path doesn't exist — verify with: ls -la <parent-dir>"
  else if (/syntax error/.test(e))
    hint = "Syntax error — check for mismatched quotes, braces, or missing semicolons."
  else if (/out of memory|killed/.test(e))
    hint = "Process killed (OOM or ulimit) — operation requires too much memory."
  return hint ? `${error}\n[Hint] ${hint}` : error
}


// C: Pre-verify named imports from existing local modules before write/edit
const MAX_IMPORT_CHECKS  = 4
const MAX_TARGET_BYTES   = 100_000

function escapeRegexC(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

async function verifyLocalImports(
  content:     string,
  absFilePath: string,
  workdir:     string,
): Promise<string | null> {
  const dir    = absFilePath.includes("/") ? absFilePath.slice(0, absFilePath.lastIndexOf("/")) : workdir
  const re     = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"](\.[^'"]+)['"]/g
  const issues: string[] = []
  let m: RegExpExecArray | null
  let checks = MAX_IMPORT_CHECKS

  while ((m = re.exec(content)) !== null && checks-- > 0) {
    const namesRaw = m[1] ?? ""
    const fromPath = m[2] ?? ""
    if (!fromPath) continue

    const base = resolve(dir, fromPath)
    const candidates = [
      base, base + ".ts", base + ".tsx", base + ".js", base + ".jsx", base + ".mts",
      base + "/index.ts", base + "/index.tsx", base + "/index.js",
    ]

    let targetFile: string | null = null
    for (const c of candidates) {
      try { if (await Bun.file(c).exists()) { targetFile = c; break } } catch {}
    }
    if (!targetFile) continue  // doesn't exist yet — skip (may be created later)

    try {
      const f = Bun.file(targetFile)
      if (f.size > MAX_TARGET_BYTES) continue
      const src = await f.text()

      const names = namesRaw.split(",")
        .map(n => n.trim().replace(/\s+as\s+\w+$/, "").replace(/^type\s+/, "").trim())
        .filter(n => n && n !== "*")

      for (const name of names) {
        const escaped = escapeRegexC(name)
        const exportRe = new RegExp(`\\bexport\\b[^;\\n]*\\b${escaped}\\b`)
        if (!exportRe.test(src)) issues.push(`'${name}' not exported from ${fromPath}`)
      }
    } catch {}
  }

  return issues.length > 0 ? issues.join("; ") : null
}

function withToolTimeout<T>(
  promise:   Promise<T>,
  def:       ToolDef,
  onTimeout: () => void,
): Promise<T> {
  const ms = def.timeoutMs ?? TOOL_EXEC_TIMEOUT_MS
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      onTimeout()  // execAC'yi abort et → tool ctx.signal'i görür
      reject(new Error(`Tool '${def.id}' timed out after ${ms / 1000}s — aborted to prevent freeze`))
    }, ms)
    promise.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) },
    )
  })
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout?: () => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { onTimeout?.() } catch {}
      reject(new Error(`operation timed out after ${ms / 1000}s`))
    }, ms)
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

// Returns true when the file path is safely inside the project workdir.
// Subagents auto-approve writes inside their workdir scope.
function isInsideWorkdir(filePath: string, workdir: string): boolean {
  const resolved = filePath.startsWith("/") ? filePath : join(workdir, filePath)
  const norm     = workdir.endsWith("/") ? workdir : workdir + "/"
  return resolved.startsWith(norm) || resolved === workdir
}

function patchPattern(summary: PatchSummary): string {
  const files = summary.files.flatMap((file) =>
    file.action === "move" && file.targetPath ? [file.path, file.targetPath] : [file.path]
  )
  if (files.length === 0) return "*"
  if (files.length <= 3) return files.join(", ")
  return `${files.slice(0, 3).join(", ")} +${files.length - 3} more`
}

function patchPermissionMetadata(
  summary: PatchSummary,
  patchText?: string,
  granular = false,
): Pick<PermissionRequest, "files" | "diff" | "patch"> {
  return {
    files: summary.files.map((file) => {
      const entry: NonNullable<PermissionRequest["files"]>[number] = {
        path: file.path,
        action: file.action,
      }
      if (file.targetPath) entry.targetPath = file.targetPath
      return entry
    }),
    diff: {
      added: summary.added,
      removed: summary.removed,
      fileCount: summary.files.length,
    },
    ...(patchText ? { patch: { text: patchText, granular } } : {}),
  }
}

function affectedPatchPaths(summary: PatchSummary): string[] {
  return [...new Set(summary.files.flatMap((file) =>
    file.action === "move" && file.targetPath ? [file.path, file.targetPath] : [file.path]
  ))]
}

function normalizePermissionPattern(defId: string, pattern: string, workdir: string): string {
  if (defId !== "write" && defId !== "edit" && defId !== "apply_patch") return pattern
  return resolve(workdir, pattern)
}

function isPermissionApproved(defId: string, pattern: string, patchSummary: PatchSummary | undefined, workdir: string): boolean {
  if (patchSummary) {
    const paths = affectedPatchPaths(patchSummary)
    return paths.length > 0 && paths.every((filePath) =>
      PermissionStore.isApproved(defId, normalizePermissionPattern(defId, filePath, workdir))
    )
  }
  return PermissionStore.isApproved(defId, normalizePermissionPattern(defId, pattern, workdir))
}

function approvePermission(defId: string, pattern: string, patchSummary: PatchSummary | undefined, directory: boolean, workdir: string): void {
  if (patchSummary) {
    for (const filePath of affectedPatchPaths(patchSummary)) {
      const normalized = normalizePermissionPattern(defId, filePath, workdir)
      if (directory) PermissionStore.approveDirectory(defId, normalized)
      else PermissionStore.approve(defId, normalized)
    }
    return
  }
  const normalized = normalizePermissionPattern(defId, pattern, workdir)
  if (directory) PermissionStore.approveDirectory(defId, normalized)
  else PermissionStore.approve(defId, normalized)
}

function waitForPermission(id: string, ctx: ToolContext): Promise<PermissionResponse> {
  return PermissionGate.wait(id, { signal: ctx.signal, timeoutMs: PERMISSION_PROMPT_TIMEOUT_MS })
}

export async function executeTool(
  def:     ToolDef,
  rawArgs: Record<string, unknown>,
  ctx:     ToolContext,
): Promise<ExecuteResult> {
  // --- v1.tool.before hook ---
  const before = await withTimeout(
    hooks.emit("v1.tool.before", { tool: def.id, args: rawArgs }),
    HOOK_TIMEOUT_MS,
  ).catch(() => ({ tool: def.id, args: rawArgs }))

  // --- Zod runtime validation (defense in depth) ---
  const parseResult = def.parameters.safeParse(before.args)
  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map(i => `${i.path.length ? i.path.join(".") + ": " : ""}${i.message}`)
      .join("; ")
    return { output: "", error: `[${def.id}] invalid args: ${issues}` }
  }
  const args: Record<string, unknown> = parseResult.data
  const skillPolicyDecision = isToolAllowedByActiveSkillPolicy(ctx.sessionId, def.id)
  if (!skillPolicyDecision.allowed) {
    metrics.recordError(def.id)
    return { output: "", error: skillPolicyDecision.reason }
  }
  let patchSummary: PatchSummary | undefined
  let preWriteContent: string | undefined
  if (def.id === "apply_patch") {
    try {
      patchSummary = summarizePatchText(String(args["patchText"] ?? ""))
    } catch (err) {
      return { output: "", error: `Patch parse error: ${err instanceof Error ? err.message : String(err)}` }
    }
  }

  // --- GateGuard kontrolü (write/edit araçları için) ---
  if (def.id === "write" || def.id === "edit") {
    const filePath = String(args["path"] ?? "")
    if (filePath) {
      const gateDecision = gateGuard.check(filePath)
      if (gateDecision === "deny") {
        gateGuard.audit({ ts: Date.now(), tool: def.id, path: filePath, action: "deny", allowed: false })
        return { output: "", error: `GateGuard: write to '${filePath}' is blocked by protection rules.` }
      }
      const permissionPath = normalizePermissionPattern(def.id, filePath, ctx.workdir)
      if (gateDecision === "ask" && !PermissionStore.isApproved(def.id, permissionPath)) {
        // Subagent context: PermissionGate is isolated per Bun Worker thread — TUI never sees it.
        // Auto-approve if the path is inside the project workdir; still block otherwise.
        if (ctx.isSubagent) {
          if (isInsideWorkdir(filePath, ctx.workdir)) {
            PermissionStore.approve(def.id, permissionPath)
          } else {
            gateGuard.audit({ ts: Date.now(), tool: def.id, path: filePath, action: "deny", allowed: false })
            return { output: "", error: `GateGuard: subagent write to '${filePath}' is outside project workdir and requires user approval.` }
          }
        } else {
          const id = crypto.randomUUID()
          const summary = def.spec?.permissionSummary
          ExecutorEvents.emit({
            type: "permission_ask",
            request: {
              id,
              tool: def.id,
              pattern: filePath,
              level: "warning",
              reason: "Protected file — GateGuard",
              ...(summary ? { summary, permissionSummary: summary } : {}),
            },
          })
          const userResponse = await waitForPermission(id, ctx)
          gateGuard.audit({ ts: Date.now(), tool: def.id, path: filePath, action: gateDecision, allowed: userResponse.decision !== "deny" })
          if (userResponse.decision === "deny") {
            return { output: "", error: `GateGuard: write to '${filePath}' denied by user.` }
          }
          if (userResponse.decision === "allow") PermissionStore.approve(def.id, permissionPath)
          if (userResponse.decision === "allow_directory") PermissionStore.approveDirectory(def.id, permissionPath)
        }
      }
    }
  }

  if (def.id === "apply_patch" && patchSummary) {
    const affectedPaths = affectedPatchPaths(patchSummary)
    const denied = affectedPaths.find((filePath) => gateGuard.check(filePath) === "deny")
    if (denied) {
      gateGuard.audit({ ts: Date.now(), tool: def.id, path: denied, action: "deny", allowed: false })
      return { output: "", error: `GateGuard: patch write to '${denied}' is blocked by protection rules.` }
    }

    const askPaths = affectedPaths.filter((filePath) =>
      gateGuard.check(filePath) === "ask" &&
      !PermissionStore.isApproved(def.id, normalizePermissionPattern(def.id, filePath, ctx.workdir))
    )
    if (askPaths.length > 0) {
      if (ctx.isSubagent) {
        const outside = askPaths.find((filePath) => !isInsideWorkdir(filePath, ctx.workdir))
        if (outside) {
          gateGuard.audit({ ts: Date.now(), tool: def.id, path: outside, action: "deny", allowed: false })
          return { output: "", error: `GateGuard: subagent patch write to '${outside}' is outside project workdir and requires user approval.` }
        }
        for (const filePath of askPaths) {
          PermissionStore.approve(def.id, normalizePermissionPattern(def.id, filePath, ctx.workdir))
        }
      } else {
        const id = crypto.randomUUID()
        const summary = def.spec?.permissionSummary
        ExecutorEvents.emit({
          type: "permission_ask",
          request: {
            id,
            tool: def.id,
            pattern: askPaths.join(", "),
            level: "warning",
            reason: "Protected file — GateGuard",
            ...(summary ? { summary, permissionSummary: summary } : {}),
            ...patchPermissionMetadata(patchSummary, String(args["patchText"] ?? ""), false),
          },
        })
        const userResponse = await waitForPermission(id, ctx)
        for (const filePath of askPaths) {
          gateGuard.audit({ ts: Date.now(), tool: def.id, path: filePath, action: "ask", allowed: userResponse.decision !== "deny" })
        }
        if (userResponse.decision === "deny") {
          return { output: "", error: `GateGuard: patch write to '${askPaths.join(", ")}' denied by user.` }
        }
        if (userResponse.decision === "allow") {
          for (const filePath of askPaths) {
            PermissionStore.approve(def.id, normalizePermissionPattern(def.id, filePath, ctx.workdir))
          }
        }
        if (userResponse.decision === "allow_directory") {
          for (const filePath of askPaths) {
            PermissionStore.approveDirectory(def.id, normalizePermissionPattern(def.id, filePath, ctx.workdir))
          }
        }
      }
    }
  }

  // --- Permission kontrolü ---
  const pattern = patchSummary ? patchPattern(patchSummary) : extractPattern(def.id, args, ctx.workdir)
  const evalDecision = PermissionEvaluator.evaluate(def.id, pattern)
  let decision = evalDecision
  let level: "safe" | "warning" | "danger" = "warning"
  let reason = ""
  let permissionMetadata: Partial<PermissionRequest> = patchSummary
    ? patchPermissionMetadata(patchSummary, String(args["patchText"] ?? ""), true)
    : {}

  // Spec tabanlı risk override — deny asla geçersiz kılınmaz
  if (def.spec) {
    const specConfirm = typeof def.spec.requiresConfirmation === "function"
      ? def.spec.requiresConfirmation(args)
      : def.spec.requiresConfirmation === true

    if (def.spec.riskLevel === "critical" && evalDecision !== "deny") {
      decision = "ask"
      level    = "danger"
    } else if (def.spec.riskLevel === "high" && decision !== "allow" && evalDecision !== "deny") {
      decision = "ask"
      level    = "warning"
    } else if (specConfirm && decision === "allow") {
      decision = "ask"
    }

    if (def.spec.permissionSummary) reason = def.spec.permissionSummary
  }

  if (def.id === "bash") {
    const command = String(args["command"] ?? "")
    const analysis = classifyCommand(command)
    const sandbox = chooseSandboxBackend(command, analysis)
    level = analysis.level
    reason = analysis.reason
    permissionMetadata = {
      sandbox: {
        backend: sandbox.backend,
        reason: sandbox.reason,
        envScrubbed: sandbox.backend === "policy",
      },
      command: {
        executables: analysis.parsedExecutables,
        readOnly: analysis.isReadOnly,
      },
    }
    if (analysis.isReadOnly) {
      // Read-only komutlar: evaluator deny yoksa auto-approve
      if (evalDecision !== "deny") decision = "allow"
    } else if (analysis.level === "danger" && evalDecision !== "deny") {
      // Danger komutlar: evaluator deny varsa onu koru, yoksa ask
      decision = "ask"
    }
    // Workdir fence — destructive komutlar proje dışı path'e dokunuyorsa uyar
    if (!analysis.isReadOnly && decision !== "deny" && isDestructiveOutsideWorkdir(command, ctx.workdir)) {
      level  = "danger"
      reason = (reason ? reason + " — " : "") + "hedef yol proje dizini dışında"
      if (decision === "allow") decision = "ask"
    }
  }

  if (decision === "deny") {
    return { output: "", error: `Permission denied: [${def.id}] ${pattern}` }
  }

  if (decision === "ask" && !isPermissionApproved(def.id, pattern, patchSummary, ctx.workdir)) {
    // Kategori bazlı toplu onay — "Bu session boyunca tüm write işlemlerine izin ver" gibi
    if (PermissionStore.isCategoryApproved(def.id)) {
      // Kategori onayı var — bireysel onay gerekmez
    } else if (ctx.isSubagent) {
      // Subagent: PermissionGate.wait() would hang forever — auto-approve non-critical asks
      if (level === "danger") {
        return { output: "", error: `Permission denied: [${def.id}] is too risky to auto-approve in subagent context. Level: danger.` }
      }
      PermissionStore.approve(def.id, normalizePermissionPattern(def.id, pattern, ctx.workdir))
    } else {
      const id = crypto.randomUUID()
      const summary = def.spec?.permissionSummary
      ExecutorEvents.emit({
        type: "permission_ask",
        request: {
          id,
          tool: def.id,
          pattern,
          level,
          reason,
          ...(summary ? { summary, permissionSummary: summary } : {}),
          ...permissionMetadata,
        },
      })

      const userResponse = await waitForPermission(id, ctx)
      if (userResponse.decision === "deny") {
        return { output: "", error: `Permission denied by user: [${def.id}] ${pattern}` }
      }
      if (def.id === "apply_patch" && userResponse.decision === "allow_partial") {
        const approvedFiles = userResponse.approvedFiles ?? []
        try {
          const filteredPatch = filterPatchTextByFiles(String(args["patchText"] ?? ""), approvedFiles)
          args["patchText"] = filteredPatch
          patchSummary = summarizePatchText(filteredPatch)
        } catch (err) {
          return { output: "", error: `Patch selection failed: ${err instanceof Error ? err.message : String(err)}` }
        }
      }
      // allow_once → sadece bu kez, session'a kaydetme
      // allow      → session boyunca hatırla
      // allow_directory → aynı klasör altında session boyunca hatırla
      if (userResponse.decision === "allow") {
        approvePermission(def.id, pattern, patchSummary, false, ctx.workdir)
      }
      if (userResponse.decision === "allow_directory") {
        approvePermission(def.id, pattern, patchSummary, true, ctx.workdir)
      }
    }
  }

  // --- C: Symbol pre-verification for named imports ---
  if ((def.id === "edit" || def.id === "write") && TYPED_FILE_RE.test(String(args["path"] ?? ""))) {
    const newContent = def.id === "edit" ? String(args["new_string"] ?? "") : String(args["content"] ?? "")
    if (newContent.includes("from '") || newContent.includes('from "')) {
      const absPath = resolve(ctx.workdir, String(args["path"] ?? ""))
      const importIssues = await verifyLocalImports(newContent, absPath, ctx.workdir)
      if (importIssues) {
        return { output: "", error: `[Import pre-check] ${importIssues}. Verify the export names exist before writing.` }
      }
    }
  }

  // --- Tool Result Cache check (pre-execute) ---
  // Cacheable tool'lar için cache'den sonuç al, varsa execute etme
  const cachedResult = toolResultCache.get(def.id, args)
  if (cachedResult) {
    // Cache hit — execute etmeden dön
    const durationMs = 0
    metrics.record(def.id, durationMs, true)
    return { output: cachedResult.result, ...(cachedResult.error !== undefined ? { error: cachedResult.error } : {}) }
  }

  if ((def.id === "edit" || def.id === "write") && TYPED_FILE_RE.test(String(args["path"] ?? ""))) {
    try {
      preWriteContent = await readFile(resolve(ctx.workdir, String(args["path"] ?? "")), "utf-8")
    } catch {
      preWriteContent = ""
    }
  }

  // --- Faz 6: Progress tracking başlat ---
  const progressMessage = getToolProgressMessage(def.id, args)
  progressTracker.start(def.id, progressMessage)

  // --- Execute (timeout korumalı + gerçek iptal zinciri) ---
  //
  // execAC: bu tool çağrısına özel AbortController.
  //   • ctx.signal (loop'tan gelen opts.signal) abort edilirse → execAC da abort edilir.
  //   • withToolTimeout süresi dolunca → execAC abort edilir.
  // Tool, ctx.signal yerine execCtx.signal'i kullanır; her iki kaynaktan da iptal alır.
  const execAC    = new AbortController()
  const mirrorFn  = () => execAC.abort()
  if (ctx.signal.aborted) {
    execAC.abort()
  } else {
    ctx.signal.addEventListener("abort", mirrorFn, { once: true })
  }
  const execCtx: ToolContext = { ...ctx, signal: execAC.signal }

  const start = Date.now()
  let result: ExecuteResult
  let execError: string | null = null

  try {
    result = await withToolTimeout(def.execute(args, execCtx), def, () => execAC.abort())
  } catch (err) {
    execError = String(err)
    result    = { output: "", error: execError }
  } finally {
    ctx.signal.removeEventListener("abort", mirrorFn)
  }

  // --- Faz 6: Progress tracking bitir ---
  if (result.error) {
    progressTracker.error(def.id, result.error)
  } else {
    progressTracker.finish(def.id, "Done")
  }

  // --- Faz 6: Predictive prefetching ---
  if (!result.error) {
    try {
      const hints = extractPrefetchHints(def.id, args, result.output)
      for (const hint of hints) {
        prefetchManager.prefetch({
          hint,
          data: { ...args, result: result.output },
          workdir: ctx.workdir,
        }).catch(() => {}) // Prefetch hatası tool sonucunu engellemez
      }
    } catch {
      // Prefetch hatası tool sonucunu engellemez
    }
  }

  const durationMs = Date.now() - start

  // --- Tool Result Cache write (post-execute) ---
  // Cache miss ise sonucu cache'e yaz (sadece başarılı sonuçlar)
  if (!cachedResult && !result.error) {
    toolResultCache.set(def.id, args, result.output)
  }
  metrics.record(def.id, durationMs, false)

  // --- Cache invalidation: write/edit sonrası ilgili path cache'lerini sil ---
  if (def.id === "write" || def.id === "edit" || def.id === "apply_patch") {
    const changedFiles = result.metadata?.changedFiles ?? []
    const paths = changedFiles.length > 0 ? changedFiles : [String(args["path"] ?? "")].filter(Boolean)
    for (const filePath of paths) {
      toolResultCache.invalidateByPath(resolve(ctx.workdir, filePath))
      if (!result.error) {
        invalidatePromptSectionsForChangedFile(ctx.workdir, filePath)
        if (changedFileAffectsSkillCache(ctx.workdir, filePath)) clearSkillCache()
      }
    }
  }

  // --- Post-process: error hints + output truncation ---
  if (result.error) {
    result = { ...result, error: analyzeToolError(def.id, result.error) }
  } else if (result.output) {
    const truncCfg = resolveTruncationConfig(def.id)
    if (result.output.length > truncCfg.maxChars) {
      result = { ...result, output: truncateOutput(result.output, truncCfg, def.id) }
    }
  }

  // --- Dual-path: TypeScript verification after edit/write ---
  if (!result.error && (def.id === "edit" || def.id === "write")) {
    const filePath = String(args["path"] ?? "")
    if (TYPED_FILE_RE.test(filePath)) {
      const absPath = resolve(ctx.workdir, filePath)
      let postWriteContent: string
      try {
        postWriteContent = await readFile(absPath, "utf-8")
      } catch {
        postWriteContent = def.id === "write"
          ? String(args["content"] ?? "")
          : String(args["new_string"] ?? "")
      }

      // shouldRunTsc: comment-only veya string-only change'lerde false döner
      if (shouldRunTsc(filePath, preWriteContent ?? "", postWriteContent)) {
        try {
          const tscOut = await withTimeout(
            runIncrementalTsc(ctx.workdir, [filePath]),
            POST_EDIT_TSC_TIMEOUT_MS,
          )
          const fileErr = filterTscForFile(tscOut, filePath)

          if (fileErr && fileErr !== "✓") {
            result = withTscVerification(result, { status: "failed", output: fileErr })
            result = { ...result, output: result.output + `\n\n[TypeScript] Errors in this file after edit:\n${fileErr}` }
          } else if (tscOut === "✓") {
            result = withTscVerification(result, { status: "passed" })
            result = { ...result, output: result.output + "\n[TypeScript] ✓ No errors" }
          } else {
            result = withTscVerification(result, { status: "passed", reason: "no errors for changed file" })
          }
        } catch {
          result = withTscVerification(result, { status: "timeout", reason: "post-edit check timed out" })
          result = { ...result, output: result.output + "\n[TypeScript] Skipped (post-edit check timed out)" }
        }
      } else {
        result = withTscVerification(result, { status: "skipped", reason: "non-type change" })
        result = { ...result, output: result.output + "\n[TypeScript] Skipped (non-type change)" }
      }

      // Faz 4: Hallucination detection
      try {
        const hallucinations = await withTimeout(
          detectHallucinations(postWriteContent, filePath, ctx.workdir),
          POST_EDIT_ANALYSIS_TIMEOUT_MS,
        )
        if (hallucinations.length > 0) {
          const warnings = formatHallucinationWarnings(hallucinations)
          result = { ...result, output: result.output + warnings }
        }
      } catch {
        // Hallucination detection hatası tool sonucunu engellemez
      }
    }
  }

  // --- Test discovery hint (edit, write, apply_patch) ---
  if (!result.error && (def.id === "edit" || def.id === "write" || def.id === "apply_patch")) {
    try {
      const { findRelatedTests } = await import("../verification/detector.js")
      // apply_patch: changed_files listesinden ilk dosyayı al, yoksa path
      const rawPath  = def.id === "apply_patch"
        ? String(result.metadata?.changedFiles?.[0] ?? "")
        : String(args["path"] ?? "")
      if (rawPath) {
        const absFilePath = resolve(ctx.workdir, rawPath)
        const discoveryAC = new AbortController()
        const onParentAbort = () => discoveryAC.abort()
        execAC.signal.addEventListener("abort", onParentAbort, { once: true })
        const related = await withTimeout(
          findRelatedTests(absFilePath, ctx.workdir, discoveryAC.signal),
          POST_EDIT_TEST_DISCOVERY_TIMEOUT_MS,
          () => discoveryAC.abort(),
        ).catch(() => [] as string[])
        execAC.signal.removeEventListener("abort", onParentAbort)
        if (related.length > 0) {
          const rel = related.map(f =>
            f.startsWith(ctx.workdir + "/") ? f.slice(ctx.workdir.length + 1) : f
          )
          result = {
            ...result,
            output: result.output + `\n[Verify] Related tests found: ${rel.join(", ")} — run verify(action="test", path="${rel[0]}") to check.`,
          }
        }
      }
    } catch { /* detector failure never blocks tool result */ }
  }

  const distilled = distillToolResult(def.id, args, result)
  const cooldown = recordFailureCooldown(ctx.sessionId, def.id, args, distilled)
  result = {
    ...result,
    metadata: {
      ...result.metadata,
      distilled,
      ...(cooldown ? { failureCooldown: cooldown } : {}),
    },
  }
  updateWorkingSetFromTool(ctx.sessionId, ctx.workdir, distilled)
  if (cooldown?.strategyShiftRequired) {
    result = {
      ...result,
      output: result.output + `\n\n[Strategy] This failure pattern repeated ${cooldown.count} times. Do not retry the same command or edit pattern; inspect context and use a different strategy.`,
    }
  }
  recordRunTrace(ctx.workdir, ctx.sessionId, "tool_result_distilled", {
    tool: def.id,
    status: distilled.status,
    changedFiles: distilled.changedFiles,
    errors: distilled.errors,
    verification: distilled.verification,
    cooldown,
  }).catch(() => {})

  // durationMs zaten yukarıda (post-execute) hesaplandı

  // --- v1.tool.after hook (outcome-aware) ---
  const outcome = execError || result.error ? "error" : "success"
  const afterPayload = { tool: def.id, args, result, durationMs }
  await withTimeout(
    hooks.emitWithOutcome("v1.tool.after", afterPayload, outcome, durationMs),
    HOOK_TIMEOUT_MS,
  ).catch(() => {})
  const after = afterPayload

  if (outcome === "error") {
    const errMsg = execError ?? result.error ?? "unknown"
    await withTimeout(
      hooks.emit("v1.tool.error", {
        tool:       def.id,
        args,
        error:      errMsg,
        durationMs,
      }),
      HOOK_TIMEOUT_MS,
    ).catch(() => {})
    // Persist to .aurict/diagnostics/ for cross-session awareness
    try {
      diagnosticsStore.record(ctx.workdir, {
        type:  "tool_error",
        tool:  def.id,
        error: errMsg.slice(0, 300),
      })
    } catch { /* diagnostics failure must never break tool execution */ }
  }

  // --- SQLite kayıt ---
  if (ctx.sessionId) {
    const partId = crypto.randomUUID()
    try {
      addPart({
        id:        partId,
        sessionId: ctx.sessionId,
        sequence:  -1,            // manager sıralamayı halleder
        role:      "tool",
        type:      "tool_result",
        content:   JSON.stringify({ tool: def.id, args, result: after.result }),
      })
    } catch (e) {
      // veritabanı loglama hatası execute sürecini durdurmasın
    }
  }

  return after.result as ExecuteResult
}

// Workdir dışındaki destructive bash komutlarını tespit et (rm/mv/dd/shred + dış path)
function isDestructiveOutsideWorkdir(command: string, workdir: string): boolean {
  if (!/\b(rm|mv|dd|shred|wipe)\b/.test(command)) return false
  const home = process.env["HOME"] ?? ""
  const norm = workdir.endsWith("/") ? workdir : workdir + "/"
  const SAFE_ROOTS = ["/usr/", "/bin/", "/lib/", "/sbin/", "/opt/", "/tmp/", "/var/tmp/", "/proc/", "/sys/", "/dev/"]
  const paths = [...(command.match(/(?:~[/\w.-]*|\/[^\s"';|&<>(){}$\\*?[\]]+)/g) ?? [])]
    .map(p => p.startsWith("~") ? (p === "~" ? home : home + p.slice(1)) : p)
  return paths.some(p => {
    if (!p.startsWith("/")) return false
    if (p.startsWith(norm) || p === workdir) return false
    return !SAFE_ROOTS.some(r => p.startsWith(r))
  })
}

function extractPattern(tool: string, args: Record<string, unknown>, workdir: string): string {
  if (tool === "bash")         return String(args["command"] ?? "*")
  if (tool === "write" || tool === "read" || tool === "edit") {
    const raw = String(args["path"] ?? "")
    // Resolve to absolute so evaluator deny rules can match /etc/*, /root/*, etc.
    return raw ? resolve(workdir, raw) : ""
  }
  if (tool === "apply_patch")  return "*"
  return "*"
}
