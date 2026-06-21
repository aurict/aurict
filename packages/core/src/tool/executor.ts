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
import { progressTracker, getToolProgressMessage } from "../util/progress.js"
import { prefetchManager, extractPrefetchHints } from "../util/prefetch.js"
import type { ToolDef, ToolContext, ExecuteResult } from "./types.js"
import type { PermissionRequest } from "../permission/types.js"
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

export async function executeTool(
  def:     ToolDef,
  rawArgs: Record<string, unknown>,
  ctx:     ToolContext,
): Promise<ExecuteResult> {
  // --- v1.tool.before hook ---
  const before = await hooks.emit("v1.tool.before", { tool: def.id, args: rawArgs })

  // --- Zod runtime validation (defense in depth) ---
  const parseResult = def.parameters.safeParse(before.args)
  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map(i => `${i.path.length ? i.path.join(".") + ": " : ""}${i.message}`)
      .join("; ")
    return { output: "", error: `[${def.id}] invalid args: ${issues}` }
  }
  const args: Record<string, unknown> = parseResult.data
  let patchSummary: PatchSummary | undefined
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
      if (gateDecision === "ask" && !PermissionStore.isApproved(def.id, filePath)) {
        // Subagent context: PermissionGate is isolated per Bun Worker thread — TUI never sees it.
        // Auto-approve if the path is inside the project workdir; still block otherwise.
        if (ctx.isSubagent) {
          if (isInsideWorkdir(filePath, ctx.workdir)) {
            PermissionStore.approve(def.id, filePath)
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
          const userResponse = await PermissionGate.wait(id)
          gateGuard.audit({ ts: Date.now(), tool: def.id, path: filePath, action: gateDecision, allowed: userResponse.decision !== "deny" })
          if (userResponse.decision === "deny") {
            return { output: "", error: `GateGuard: write to '${filePath}' denied by user.` }
          }
          if (userResponse.decision === "allow") PermissionStore.approve(def.id, filePath)
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
      gateGuard.check(filePath) === "ask" && !PermissionStore.isApproved(def.id, filePath)
    )
    if (askPaths.length > 0) {
      if (ctx.isSubagent) {
        const outside = askPaths.find((filePath) => !isInsideWorkdir(filePath, ctx.workdir))
        if (outside) {
          gateGuard.audit({ ts: Date.now(), tool: def.id, path: outside, action: "deny", allowed: false })
          return { output: "", error: `GateGuard: subagent patch write to '${outside}' is outside project workdir and requires user approval.` }
        }
        for (const filePath of askPaths) {
          PermissionStore.approve(def.id, filePath)
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
        const userResponse = await PermissionGate.wait(id)
        for (const filePath of askPaths) {
          gateGuard.audit({ ts: Date.now(), tool: def.id, path: filePath, action: "ask", allowed: userResponse.decision !== "deny" })
        }
        if (userResponse.decision === "deny") {
          return { output: "", error: `GateGuard: patch write to '${askPaths.join(", ")}' denied by user.` }
        }
        if (userResponse.decision === "allow") {
          for (const filePath of askPaths) PermissionStore.approve(def.id, filePath)
        }
      }
    }
  }

  // --- Permission kontrolü ---
  const pattern = patchSummary ? patchPattern(patchSummary) : extractPattern(def.id, args)
  let decision = PermissionEvaluator.evaluate(def.id, pattern)
  let level: "safe" | "warning" | "danger" = "warning"
  let reason = ""
  let permissionMetadata: Partial<PermissionRequest> = patchSummary
    ? patchPermissionMetadata(patchSummary, String(args["patchText"] ?? ""), true)
    : {}

  // Spec tabanlı risk override
  if (def.spec) {
    const specConfirm = typeof def.spec.requiresConfirmation === "function"
      ? def.spec.requiresConfirmation(args)
      : def.spec.requiresConfirmation === true

    if (def.spec.riskLevel === "critical") {
      decision = "ask"
      level    = "danger"
    } else if (def.spec.riskLevel === "high" && decision !== "allow") {
      decision = "ask"
      level    = "warning"
    } else if (specConfirm && decision === "allow") {
      decision = "ask"
    }

    if (def.spec.permissionSummary) reason = def.spec.permissionSummary
  }

  if (def.id === "bash") {
    const analysis = classifyCommand(pattern)
    const sandbox = chooseSandboxBackend(pattern, analysis)
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
      decision = "allow" // Auto-approve zararsız komutlar
    } else if (analysis.level === "danger") {
      decision = "ask"   // Yıkıcı komutlarda mutlaka sor (eğer global izin yoksa)
    }
  }

  if (decision === "deny") {
    return { output: "", error: `Permission denied: [${def.id}] ${pattern}` }
  }

  if (decision === "ask" && !PermissionStore.isApproved(def.id, pattern)) {
    // Kategori bazlı toplu onay — "Bu session boyunca tüm write işlemlerine izin ver" gibi
    if (PermissionStore.isCategoryApproved(def.id)) {
      // Kategori onayı var — bireysel onay gerekmez
    } else if (ctx.isSubagent) {
      // Subagent: PermissionGate.wait() would hang forever — auto-approve non-critical asks
      if (level === "danger") {
        return { output: "", error: `Permission denied: [${def.id}] is too risky to auto-approve in subagent context. Level: danger.` }
      }
      PermissionStore.approve(def.id, pattern)
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

      const userResponse = await PermissionGate.wait(id)
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
      if (userResponse.decision === "allow") {
        PermissionStore.approve(def.id, pattern)
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
      // Faz 4: Smart TSC — comment-only change'lerde skip et
      const absPath = resolve(ctx.workdir, filePath)
      let oldContent = ""
      try {
        oldContent = await readFile(absPath, "utf-8")
      } catch {
        // Dosya okunamadıysa TSC çalıştır
      }

      const newContent = def.id === "edit" 
        ? String(args["new_string"] ?? "")
        : String(args["content"] ?? "")

      // shouldRunTsc: comment-only veya string-only change'lerde false döner
      if (shouldRunTsc(filePath, oldContent, newContent)) {
        const tscOut = await runIncrementalTsc(ctx.workdir, [filePath])
        const fileErr = filterTscForFile(tscOut, filePath)
        
        if (fileErr && fileErr !== "✓") {
          result = { ...result, output: result.output + `\n\n[TypeScript] Errors in this file after edit:\n${fileErr}` }
        } else if (tscOut === "✓") {
          result = { ...result, output: result.output + "\n[TypeScript] ✓ No errors" }
        }
      } else {
        result = { ...result, output: result.output + "\n[TypeScript] Skipped (non-type change)" }
      }

      // Faz 4: Hallucination detection
      try {
        const hallucinations = await detectHallucinations(newContent, filePath, ctx.workdir)
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
        const related     = await findRelatedTests(absFilePath, ctx.workdir, execAC.signal)
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

  // durationMs zaten yukarıda (post-execute) hesaplandı

  // --- v1.tool.after hook (outcome-aware) ---
  const outcome = execError || result.error ? "error" : "success"
  const afterPayload = { tool: def.id, args, result, durationMs }
  await hooks.emitWithOutcome("v1.tool.after", afterPayload, outcome, durationMs)
  const after = afterPayload

  if (outcome === "error") {
    const errMsg = execError ?? result.error ?? "unknown"
    await hooks.emit("v1.tool.error", {
      tool:       def.id,
      args,
      error:      errMsg,
      durationMs,
    })
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

function extractPattern(tool: string, args: Record<string, unknown>): string {
  if (tool === "bash")         return String(args["command"] ?? "*")
  if (tool === "write" || tool === "read" || tool === "edit") return String(args["path"] ?? "")
  if (tool === "apply_patch")  return "*"
  return "*"
}
