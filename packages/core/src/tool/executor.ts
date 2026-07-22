import { resolve } from "path";
import { readFile } from "fs/promises";
import { hooks } from "../hook/emitter.js";
import { PermissionEvaluator } from "../permission/evaluator.js";
import { PermissionStore } from "../permission/store.js";
import { gateGuard } from "../permission/gateguard.js";
import { SessionManager } from "../session/manager.js";
import { classifyCommand } from "../terminal/classifier.js";
import { chooseSandboxBackend } from "../terminal/sandbox.js";
import { diagnosticsStore } from "../diagnostics/store.js";
import { truncateOutput, resolveTruncationConfig } from "./truncation.js";
import { storeToolOutputArtifact } from "./output-artifacts.js";
import { toolResultCache } from "./cache.js";
import { metrics } from "../util/metrics.js";
import {
  shouldRunTsc,
} from "../verification/tsc.js";
import {
  detectHallucinations,
  formatHallucinationWarnings,
} from "../verification/hallucination.js";
import { withVerification } from "../verification/pipeline.js";
import { schedulePostEditTsc } from "../verification/post-edit-scheduler.js";
import { isAgentFeatureEnabled } from "../agent/runtime-features.js";
import { runLanguageChecks } from "../verification/language-runners.js";
import { loadConfig } from "../config/config.js";
import { progressTracker, getToolProgressMessage } from "../util/progress.js";
import { prefetchManager, extractPrefetchHints } from "../util/prefetch.js";
import {
  changedFileAffectsSkillCache,
  invalidatePromptSectionsForChangedFile,
} from "../agent/prompt-invalidation.js";
import { clearSkillCache } from "../skill/injector.js";
import { isToolAllowedByActiveSkillPolicy } from "../skill/runtime-policy.js";
import { distillToolResult } from "./result-distiller.js";
import {
  updateWorkingSetFromTool,
  recordLinesChangedForCritique,
  getWorkingSetSnapshot,
  recordVerificationRevision,
} from "../agent/working-set.js";
import { acquireFileLock, releaseFileLock } from "../agent/file-lock.js";
import { recordFailureCooldown } from "../agent/failure-cooldown.js";
import { failedStrategiesStore } from "../agent/failed-strategies-store.js";
import { recordRunTrace } from "../agent/run-trace.js";
import { recordFlightFailure } from "../diagnostics/flight-recorder.js";
import type { ToolDef, ToolContext, ExecuteResult } from "./types.js";
import { toolOutcomeFromExecuteResult } from "../runtime/tool-outcome.js";
import { WorkspaceTransaction, mutationPathsForTool } from "../transaction/workspace-transaction.js";
import { fingerprintWorkspaceRevision } from "../transaction/workspace-revision.js";
import {
  affectedPatchPaths,
  analyzeToolError,
  approvePermission,
  flightReplayPolicy,
  isInsideWorkdir,
  isPermissionApproved,
  normalizeKnownToolArgs,
  normalizePermissionPattern,
  patchPattern,
  patchPermissionMetadata,
  verifyLocalImports,
  waitForPermission,
  withTimeout,
  withToolTimeout,
} from "./execution-helpers.js";

export { normalizeKnownToolArgs } from "./execution-helpers.js";
import type {
  PermissionRequest,
} from "../permission/types.js";
import {
  filterPatchTextByFiles,
  summarizePatchText,
  type PatchSummary,
} from "./built-in/apply-patch.js";

export interface ExecutionEvent {
  type: "permission_ask";
  request: PermissionRequest;
}

type EventCallback = (event: ExecutionEvent) => void;
const listeners = new Set<EventCallback>();

export const ExecutorEvents = {
  on(cb: EventCallback): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  emit(event: ExecutionEvent): void {
    listeners.forEach((cb) => cb(event));
  },
};

const POST_EDIT_LANGUAGE_TIMEOUT_MS = 30_000;
const POST_EDIT_ANALYSIS_TIMEOUT_MS = 3_000;
const POST_EDIT_TEST_DISCOVERY_TIMEOUT_MS = 3_000;
const HOOK_TIMEOUT_MS = 5_000;

// ── TypeScript file regex ──────────────────────────────────────────────────────
const TYPED_FILE_RE = /\.(ts|tsx|js|jsx|mts|cts)$/;

export async function executeTool(
  def: ToolDef,
  rawArgs: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ExecuteResult> {
  const permissionScope = `${resolve(ctx.workdir)}\0${ctx.sessionId || "anonymous"}`;
  // --- v1.tool.before hook ---
  const before = await withTimeout(
    hooks.emit("v1.tool.before", { tool: def.id, args: rawArgs }),
    HOOK_TIMEOUT_MS,
  ).catch(() => ({ tool: def.id, args: rawArgs }));

  // --- Zod runtime validation (defense in depth) ---
  const parseResult = def.parameters.safeParse(
    normalizeKnownToolArgs(def.id, before.args),
  );
  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map((i) => `${i.path.length ? i.path.join(".") + ": " : ""}${i.message}`)
      .join("; ");
    return { output: "", error: `[${def.id}] invalid args: ${issues}` };
  }
  const args: Record<string, unknown> = parseResult.data;
  const skillPolicyDecision = isToolAllowedByActiveSkillPolicy(
    ctx.sessionId,
    def.id,
  );
  if (!skillPolicyDecision.allowed) {
    metrics.recordError(def.id);
    return { output: "", error: skillPolicyDecision.reason };
  }
  let patchSummary: PatchSummary | undefined;
  let preWriteContent: string | undefined;
  let importPrecheckWarning: string | undefined;
  if (def.id === "apply_patch") {
    try {
      patchSummary = summarizePatchText(String(args["patchText"] ?? ""));
    } catch (err) {
      return {
        output: "",
        error: `Patch parse error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // --- GateGuard kontrolü (write/edit araçları için) ---
  if (def.id === "write" || def.id === "edit") {
    const filePath = String(args["path"] ?? "");
    if (filePath) {
      const gateDecision = gateGuard.check(filePath, ctx.workdir);
      if (gateDecision === "deny") {
        gateGuard.audit({
          ts: Date.now(),
          tool: def.id,
          path: filePath,
          action: "deny",
          allowed: false,
        }, ctx.workdir);
        return {
          output: "",
          error: `GateGuard: write to '${filePath}' is blocked by protection rules.`,
        };
      }
      const permissionPath = normalizePermissionPattern(
        def.id,
        filePath,
        ctx.workdir,
      );
      if (
        gateDecision === "ask" &&
        !PermissionStore.isApproved(def.id, permissionPath, permissionScope)
      ) {
        // Subagent context: PermissionGate is isolated per Bun Worker thread — TUI never sees it.
        // Auto-approve if the path is inside the project workdir; still block otherwise.
        if (ctx.isSubagent) {
          if (isInsideWorkdir(filePath, ctx.workdir)) {
            PermissionStore.approve(def.id, permissionPath, permissionScope);
          } else {
            gateGuard.audit({
              ts: Date.now(),
              tool: def.id,
              path: filePath,
              action: "deny",
              allowed: false,
            }, ctx.workdir);
            return {
              output: "",
              error: `GateGuard: subagent write to '${filePath}' is outside project workdir and requires user approval.`,
            };
          }
        } else {
          const id = crypto.randomUUID();
          const summary = def.spec?.permissionSummary;
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
          });
          const userResponse = await waitForPermission(id, ctx);
          gateGuard.audit({
            ts: Date.now(),
            tool: def.id,
            path: filePath,
            action: gateDecision,
            allowed: userResponse.decision !== "deny",
          }, ctx.workdir);
          if (userResponse.decision === "deny") {
            return {
              output: "",
              error: `GateGuard: write to '${filePath}' denied by user.`,
            };
          }
          if (userResponse.decision === "allow")
            PermissionStore.approve(def.id, permissionPath, permissionScope);
          if (userResponse.decision === "allow_directory")
            PermissionStore.approveDirectory(def.id, permissionPath, permissionScope);
        }
      }
    }
  }

  if (def.id === "apply_patch" && patchSummary) {
    const affectedPaths = affectedPatchPaths(patchSummary);
    const denied = affectedPaths.find(
      (filePath) => gateGuard.check(filePath, ctx.workdir) === "deny",
    );
    if (denied) {
      gateGuard.audit({
        ts: Date.now(),
        tool: def.id,
        path: denied,
        action: "deny",
        allowed: false,
      }, ctx.workdir);
      return {
        output: "",
        error: `GateGuard: patch write to '${denied}' is blocked by protection rules.`,
      };
    }

    const askPaths = affectedPaths.filter(
      (filePath) =>
        gateGuard.check(filePath, ctx.workdir) === "ask" &&
        !PermissionStore.isApproved(
          def.id,
          normalizePermissionPattern(def.id, filePath, ctx.workdir),
          permissionScope,
        ),
    );
    if (askPaths.length > 0) {
      if (ctx.isSubagent) {
        const outside = askPaths.find(
          (filePath) => !isInsideWorkdir(filePath, ctx.workdir),
        );
        if (outside) {
          gateGuard.audit({
            ts: Date.now(),
            tool: def.id,
            path: outside,
            action: "deny",
            allowed: false,
          }, ctx.workdir);
          return {
            output: "",
            error: `GateGuard: subagent patch write to '${outside}' is outside project workdir and requires user approval.`,
          };
        }
        for (const filePath of askPaths) {
          PermissionStore.approve(
            def.id,
            normalizePermissionPattern(def.id, filePath, ctx.workdir),
            permissionScope,
          );
        }
      } else {
        const id = crypto.randomUUID();
        const summary = def.spec?.permissionSummary;
        ExecutorEvents.emit({
          type: "permission_ask",
          request: {
            id,
            tool: def.id,
            pattern: askPaths.join(", "),
            level: "warning",
            reason: "Protected file — GateGuard",
            ...(summary ? { summary, permissionSummary: summary } : {}),
            ...patchPermissionMetadata(
              patchSummary,
              String(args["patchText"] ?? ""),
              false,
            ),
          },
        });
        const userResponse = await waitForPermission(id, ctx);
        for (const filePath of askPaths) {
          gateGuard.audit({
            ts: Date.now(),
            tool: def.id,
            path: filePath,
            action: "ask",
            allowed: userResponse.decision !== "deny",
          }, ctx.workdir);
        }
        if (userResponse.decision === "deny") {
          return {
            output: "",
            error: `GateGuard: patch write to '${askPaths.join(", ")}' denied by user.`,
          };
        }
        if (userResponse.decision === "allow") {
          for (const filePath of askPaths) {
            PermissionStore.approve(
              def.id,
              normalizePermissionPattern(def.id, filePath, ctx.workdir),
              permissionScope,
            );
          }
        }
        if (userResponse.decision === "allow_directory") {
          for (const filePath of askPaths) {
            PermissionStore.approveDirectory(
              def.id,
              normalizePermissionPattern(def.id, filePath, ctx.workdir),
              permissionScope,
            );
          }
        }
      }
    }
  }

  // --- Permission kontrolü ---
  const pattern = patchSummary
    ? patchPattern(patchSummary)
    : extractPattern(def.id, args, ctx.workdir);
  const evalDecision = PermissionEvaluator.evaluate(def.id, pattern);
  let decision = evalDecision;
  let level: "safe" | "warning" | "danger" = "warning";
  let reason = "";
  let specRequiresConfirmation = false;
  let requiresDirectApproval = false;
  let permissionMetadata: Partial<PermissionRequest> = patchSummary
    ? patchPermissionMetadata(
        patchSummary,
        String(args["patchText"] ?? ""),
        true,
      )
    : {};

  // Spec tabanlı risk override — deny asla geçersiz kılınmaz
  if (def.spec) {
    const specConfirm =
      typeof def.spec.requiresConfirmation === "function"
        ? def.spec.requiresConfirmation(args)
        : def.spec.requiresConfirmation === true;
    specRequiresConfirmation = specConfirm;

    if (def.spec.riskLevel === "critical" && evalDecision !== "deny") {
      decision = "ask";
      level = "danger";
    } else if (
      def.spec.riskLevel === "high" &&
      decision !== "allow" &&
      evalDecision !== "deny"
    ) {
      decision = "ask";
      level = "warning";
    } else if (specConfirm && decision === "allow") {
      decision = "ask";
    } else if (
      def.spec.riskLevel === "low" &&
      decision === "ask" &&
      !specConfirm
    ) {
      level = "safe";
    }

    if (def.spec.permissionSummary) reason = def.spec.permissionSummary;
  }

  if (def.id === "bash") {
    const command = String(args["command"] ?? "");
    const analysis = classifyCommand(command);
    const sandbox = chooseSandboxBackend(command, analysis);
    level = analysis.level;
    reason = analysis.reason;
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
    };
    if (analysis.isReadOnly && usesShellFileReader(command)) {
      // Shell readers bypass the read tool's workspace/symlink boundary. Keep
      // them behind explicit approval without presenting a read as destructive.
      if (evalDecision !== "deny") decision = "ask";
      requiresDirectApproval = true;
      level = "warning";
      reason = "Shell file readers bypass workspace path protections; review the target path or use the read/grep tool";
    } else if (analysis.isReadOnly) {
      // Other read-only commands: evaluator deny yoksa auto-approve
      if (evalDecision !== "deny") decision = "allow";
    } else if (analysis.level === "danger" && evalDecision !== "deny") {
      // Danger komutlar: evaluator deny varsa onu koru, yoksa ask
      decision = "ask";
    }
    // Workdir fence — destructive komutlar proje dışı path'e dokunuyorsa uyar
    if (
      !analysis.isReadOnly &&
      decision !== "deny" &&
      isDestructiveOutsideWorkdir(command, ctx.workdir)
    ) {
      level = "danger";
      reason =
        (reason ? reason + " — " : "") + "hedef yol proje dizini dışında";
      if (decision === "allow") decision = "ask";
    }
  }

  if (decision === "deny") {
    return { output: "", error: `Permission denied: [${def.id}] ${pattern}` };
  }

  if (
    decision === "ask" &&
    !isPermissionApproved(def.id, pattern, patchSummary, ctx.workdir, permissionScope)
  ) {
    // Kategori bazlı toplu onay — "Bu session boyunca tüm write işlemlerine izin ver" gibi
    if (PermissionStore.isCategoryApproved(def.id, permissionScope)) {
      // Kategori onayı var — bireysel onay gerekmez
    } else if (ctx.isSubagent) {
      // Subagent: PermissionGate.wait() would hang forever — auto-approve non-critical asks
      if (level === "danger" || requiresDirectApproval || (def.spec?.category === "network" && specRequiresConfirmation)) {
        const explanation = level === "danger"
          ? "is too risky to auto-approve"
          : "requires direct user approval";
        return {
          output: "",
          error: `Permission denied: [${def.id}] ${explanation} in subagent context. Level: ${level}.`,
        };
      }
      PermissionStore.approve(
        def.id,
        normalizePermissionPattern(def.id, pattern, ctx.workdir),
        permissionScope,
      );
    } else {
      const id = crypto.randomUUID();
      const summary = def.spec?.permissionSummary;
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
      });

      const userResponse = await waitForPermission(id, ctx);
      if (userResponse.decision === "deny") {
        return {
          output: "",
          error: `Permission denied by user: [${def.id}] ${pattern}`,
        };
      }
      if (
        def.id === "apply_patch" &&
        userResponse.decision === "allow_partial"
      ) {
        const approvedFiles = userResponse.approvedFiles ?? [];
        try {
          const filteredPatch = filterPatchTextByFiles(
            String(args["patchText"] ?? ""),
            approvedFiles,
          );
          args["patchText"] = filteredPatch;
          patchSummary = summarizePatchText(filteredPatch);
        } catch (err) {
          return {
            output: "",
            error: `Patch selection failed: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      }
      // allow_once → sadece bu kez, session'a kaydetme
      // allow      → session boyunca hatırla
      // allow_directory → aynı klasör altında session boyunca hatırla
      if (userResponse.decision === "allow") {
        approvePermission(def.id, pattern, patchSummary, false, ctx.workdir, permissionScope);
      }
      if (userResponse.decision === "allow_directory") {
        approvePermission(def.id, pattern, patchSummary, true, ctx.workdir, permissionScope);
      }
    }
  }

  // --- C: Symbol pre-verification for named imports ---
  if (
    (def.id === "edit" || def.id === "write") &&
    TYPED_FILE_RE.test(String(args["path"] ?? ""))
  ) {
    const newContent =
      def.id === "edit"
        ? String(args["new_string"] ?? "")
        : String(args["content"] ?? "");
    if (newContent.includes("from '") || newContent.includes('from "')) {
      const absPath = resolve(ctx.workdir, String(args["path"] ?? ""));
      const importIssues = await verifyLocalImports(
        newContent,
        absPath,
        ctx.workdir,
      );
      if (importIssues) {
        importPrecheckWarning = `[Import pre-check warning] ${importIssues}. The edit was allowed because barrels, re-exports, and ambient declarations can produce false positives; verify with the compiler.`;
      }
    }
  }

  // --- Tool Result Cache check (pre-execute) ---
  // Cacheable tool'lar için cache'den sonuç al, varsa execute etme
  const cacheScope = `${resolve(ctx.workdir)}\0${ctx.sessionId || "anonymous"}`;
  const validateCacheSource = isAgentFeatureEnabled(
    "mtime_tool_cache",
    toolResultCache.isCacheable(def.id) ? loadConfig(ctx.workdir) : {},
    ctx.sessionId,
  );
  const cachedResult = toolResultCache.get(def.id, args, cacheScope, validateCacheSource);
  if (cachedResult) {
    // Cache hit — execute etmeden dön
    const durationMs = 0;
    metrics.record(def.id, durationMs, true);
    return {
      output: cachedResult.result,
      ...(cachedResult.error !== undefined
        ? { error: cachedResult.error }
        : {}),
    };
  }

  if (
    (def.id === "edit" || def.id === "write") &&
    TYPED_FILE_RE.test(String(args["path"] ?? ""))
  ) {
    try {
      preWriteContent = await readFile(
        resolve(ctx.workdir, String(args["path"] ?? "")),
        "utf-8",
      );
    } catch {
      preWriteContent = "";
    }
  }

  // --- Faz 3C: worker'lar arası dosya lock'u ---
  // Sadece worker/subagent session'larında (ctx.isSubagent) devreye girer — solo
  // ana session'da overhead yok. agentPool.spawn her worker'ı AYRI bir Worker
  // thread'de çalıştırdığından (bkz. agent/pool.ts) in-memory bir lock hiçbir
  // çakışmayı önlemez; bu yüzden dosya tabanlı bir lock kullanılıyor.
  const lockTargetPath =
    def.id === "edit" || def.id === "write" ? String(args["path"] ?? "") : "";
  let fileLockAcquired = false;
  if (ctx.isSubagent && lockTargetPath) {
    const absLockPath = resolve(ctx.workdir, lockTargetPath);
    fileLockAcquired = await acquireFileLock(
      ctx.workdir,
      absLockPath,
      ctx.sessionId,
      ctx.sessionId,
    );
    if (!fileLockAcquired) {
      return {
        output: "",
        error: `[file-lock] '${lockTargetPath}' is currently being edited by another worker. Wait and retry, or work on a different file.`,
      };
    }
  }

  // --- Faz 6: Progress tracking başlat ---
  const progressMessage = getToolProgressMessage(def.id, args);
  progressTracker.start(def.id, progressMessage);

  // --- Execute (timeout korumalı + gerçek iptal zinciri) ---
  //
  // execAC: bu tool çağrısına özel AbortController.
  //   • ctx.signal (loop'tan gelen opts.signal) abort edilirse → execAC da abort edilir.
  //   • withToolTimeout süresi dolunca → execAC abort edilir.
  // Tool, ctx.signal yerine execCtx.signal'i kullanır; her iki kaynaktan da iptal alır.
  const execAC = new AbortController();
  const mirrorFn = () => execAC.abort();
  if (ctx.signal.aborted) {
    execAC.abort();
  } else {
    ctx.signal.addEventListener("abort", mirrorFn, { once: true });
  }
  const execCtx: ToolContext = { ...ctx, signal: execAC.signal };

  const start = Date.now();
  let result: ExecuteResult;
  let execError: string | null = null;
  const verificationPaths = def.id === "verify"
    ? verificationPathsForSession(ctx, args)
    : [];
  const verificationBase = verificationPaths.length > 0
    ? await fingerprintWorkspaceRevision(ctx.workdir, verificationPaths)
    : undefined;
  const transaction = await WorkspaceTransaction.begin(
    ctx.workdir,
    mutationPathsForTool(def.id, args),
  );

  try {
    result = await withToolTimeout(def.execute(args, execCtx), def, () =>
      execAC.abort(),
    );
  } catch (err) {
    execError = String(err);
    result = { output: "", error: execError };
  } finally {
    ctx.signal.removeEventListener("abort", mirrorFn);
    if (fileLockAcquired) {
      const absLockPath = resolve(ctx.workdir, lockTargetPath);
      releaseFileLock(ctx.workdir, absLockPath, ctx.sessionId).catch(() => {});
    }
  }

  if (transaction) {
    const committed = await transaction.commit();
    const transactionRecord = result.error ? await transaction.rollback() : committed;
    result = {
      ...result,
      metadata: { ...result.metadata, transaction: transactionRecord },
      ...(transactionRecord.status === "rollback_conflict"
        ? { error: `${result.error ?? "Tool failed"}\n[transaction] Rollback refused because the file changed after this tool attempt.` }
        : {}),
    };
  }

  if (!result.error && importPrecheckWarning) {
    result = { ...result, output: `${result.output}\n\n${importPrecheckWarning}` };
  }

  if (verificationBase && result.metadata?.verification) {
    const current = await fingerprintWorkspaceRevision(ctx.workdir, verificationPaths);
    const changedDuringVerification = current.hash !== verificationBase.hash;
    const verification = Object.fromEntries(
      Object.entries(result.metadata.verification).map(([check, checkResult]) => {
        if (!checkResult) return [check, checkResult];
        return [check, {
          ...checkResult,
          baseRevision: verificationBase.hash,
          workspaceRevision: current.hash,
          ...(changedDuringVerification && checkResult.status === "passed"
            ? { status: "failed", reason: "workspace changed during verification" }
            : {}),
        }];
      }),
    ) as NonNullable<NonNullable<ExecuteResult["metadata"]>["verification"]>;
    result = { ...result, metadata: { ...result.metadata, verification } };
  }

  // --- Faz 6: Progress tracking bitir ---
  if (result.error) {
    progressTracker.error(def.id, result.error);
  } else {
    progressTracker.finish(def.id, "Done");
  }

  // --- Faz 6: Predictive prefetching ---
  if (!result.error) {
    try {
      const hints = extractPrefetchHints(def.id, args, result.output);
      for (const hint of hints) {
        prefetchManager
          .prefetch({
            hint,
            data: { ...args, result: result.output },
            workdir: ctx.workdir,
          })
          .catch(() => {}); // Prefetch hatası tool sonucunu engellemez
      }
    } catch {
      // Prefetch hatası tool sonucunu engellemez
    }
  }

  const durationMs = Date.now() - start;

  // --- Tool Result Cache write (post-execute) ---
  // Cache miss ise sonucu cache'e yaz (sadece başarılı sonuçlar)
  if (!cachedResult && !result.error) {
    toolResultCache.set(def.id, args, result.output, result.error, cacheScope, validateCacheSource);
  }
  metrics.record(def.id, durationMs, false);

  // --- Cache invalidation: write/edit sonrası ilgili path cache'lerini sil ---
  if (def.id === "write" || def.id === "edit" || def.id === "apply_patch") {
    const changedFiles = result.metadata?.changedFiles ?? [];
    const paths =
      changedFiles.length > 0
        ? changedFiles
        : [String(args["path"] ?? "")].filter(Boolean);
    for (const filePath of paths) {
      toolResultCache.invalidateByPath(resolve(ctx.workdir, filePath));
      if (!result.error) {
        invalidatePromptSectionsForChangedFile(ctx.workdir, filePath);
        if (changedFileAffectsSkillCache(ctx.workdir, filePath))
          clearSkillCache();
      }
    }
  }

  // --- Post-process: error hints + output truncation ---
  if (result.error) {
    result = { ...result, error: analyzeToolError(def.id, result.error) };
  } else if (result.output) {
    const truncCfg = resolveTruncationConfig(def.id, ctx.truncation, ctx.contextWindow);
    if (result.output.length > truncCfg.maxChars) {
      const stored = await storeToolOutputArtifact({
        workdir: ctx.workdir,
        sessionId: ctx.sessionId,
        output: result.output,
      });
      const preview = truncateOutput(result.output, truncCfg, def.id);
      result = {
        ...result,
        output: `${preview}\n\n[full output: ${stored.handle} · ${stored.chars} chars; continue with read_tool_output]`,
      };
    }
  }

  // --- Dual-path: TypeScript verification after edit/write ---
  if (!result.error && (def.id === "edit" || def.id === "write")) {
    const filePath = String(args["path"] ?? "");
    const postEditCfg = loadConfig(ctx.workdir);

    // Faz 4.2: zorunlu adversarial critique — dil bağımsız, kritik-yol kod
    // hacmini (bu edit/write'ın değiştirdiği satır sayısı) session bazında
    // biriktirir. Sadece critique.enabled true iken devrede (kaynağında kapalı).
    if (postEditCfg.critique?.enabled === true) {
      const changedText =
        def.id === "write"
          ? String(args["content"] ?? "")
          : String(args["new_string"] ?? "");
      const linesChangedEstimate = changedText
        ? changedText.split("\n").length
        : 0;
      if (linesChangedEstimate > 0) {
        recordLinesChangedForCritique(
          ctx.sessionId,
          [filePath],
          linesChangedEstimate,
          postEditCfg.critique.minLinesForAuto ?? 50,
        );
      }
    }

    if (TYPED_FILE_RE.test(filePath)) {
      const absPath = resolve(ctx.workdir, filePath);
      let postWriteContent: string;
      try {
        postWriteContent = await readFile(absPath, "utf-8");
      } catch {
        postWriteContent =
          def.id === "write"
            ? String(args["content"] ?? "")
            : String(args["new_string"] ?? "");
      }

      // shouldRunTsc: comment-only veya string-only change'lerde false döner
      if (shouldRunTsc(filePath, preWriteContent ?? "", postWriteContent)) {
        if (isAgentFeatureEnabled("background_verification", postEditCfg, ctx.sessionId)) {
          schedulePostEditTsc({ sessionId: ctx.sessionId, workdir: ctx.workdir, filePath });
          result = {
            ...result,
            output: result.output + "\n[TypeScript] Background verification scheduled; its revision-bound result will appear in the next agent state.",
          };
        } else {
          result = {
            ...result,
            output: result.output + "\n[TypeScript] Automatic background verification is disabled; run verify before completion.",
          };
        }
      } else {
        result = withVerification(result, "tsc", {
          status: "skipped",
          reason: "non-type change",
        });
        result = {
          ...result,
          output: result.output + "\n[TypeScript] Skipped (non-type change)",
        };
      }

      // Faz 4: Hallucination detection
      try {
        const hallucinations = await withTimeout(
          detectHallucinations(postWriteContent, filePath, ctx.workdir),
          POST_EDIT_ANALYSIS_TIMEOUT_MS,
        );
        if (hallucinations.length > 0) {
          const warnings = formatHallucinationWarnings(hallucinations);
          result = { ...result, output: result.output + warnings };
        }
      } catch {
        // Hallucination detection hatası tool sonucunu engellemez
      }
    } else {
      // Faz 4.1: dile-agnostik doğrulama — TSC'nin TS/JS için yaptığının Python/
      // Go/Rust/Ruby muadili. Runner yoksa (binary kurulu değil) sessizce
      // "skipped" — hiçbir proje bu araçları kurmaya zorlanmaz.
      const absPath = resolve(ctx.workdir, filePath);
      const verificationCfg = postEditCfg.verification;
      try {
        const checks = await withTimeout(
          runLanguageChecks(absPath, ctx.workdir, {
            ...(verificationCfg?.languages
              ? { languages: verificationCfg.languages }
              : {}),
            ...(verificationCfg?.autoLint !== undefined
              ? { autoLint: verificationCfg.autoLint }
              : {}),
          }),
          POST_EDIT_LANGUAGE_TIMEOUT_MS,
        );
        for (const check of checks) {
          result = withVerification(result, check.checkId, {
            status: check.status,
            ...(check.reason ? { reason: check.reason } : {}),
            ...(check.output ? { output: check.output } : {}),
          });
          if (check.status === "failed") {
            result = {
              ...result,
              output:
                result.output +
                `\n\n[${check.checkId}] failed — errors in this file after edit:\n${check.output ?? ""}`,
            };
          } else if (check.status === "passed") {
            result = {
              ...result,
              output: result.output + `\n[${check.checkId}] ✓ no errors`,
            };
          } else if (check.status === "skipped") {
            // "not installed" reason'ı completion-gate'in environmental-skip
            // tanımasıyla eşleşir — asla tamamlanamayacak bir continuation
            // döngüsü oluşturmaz (bkz. completion-gate.ts).
            result = {
              ...result,
              output:
                result.output +
                `\n[${check.checkId}] skipped — ${check.reason ?? "unavailable"}`,
            };
          } else if (check.status === "timeout") {
            result = {
              ...result,
              output:
                result.output +
                `\n[${check.checkId}] skipped (post-edit check timed out)`,
            };
          }
        }
      } catch {
        // Dile-agnostik doğrulama hatası tool sonucunu asla engellemez
      }
    }
  }

  // --- Test discovery hint (edit, write, apply_patch) ---
  if (
    !result.error &&
    (def.id === "edit" || def.id === "write" || def.id === "apply_patch")
  ) {
    try {
      const { findRelatedTests } = await import("../verification/detector.js");
      // apply_patch: changed_files listesinden ilk dosyayı al, yoksa path
      const rawPath =
        def.id === "apply_patch"
          ? String(result.metadata?.changedFiles?.[0] ?? "")
          : String(args["path"] ?? "");
      if (rawPath) {
        const absFilePath = resolve(ctx.workdir, rawPath);
        const discoveryAC = new AbortController();
        const onParentAbort = () => discoveryAC.abort();
        execAC.signal.addEventListener("abort", onParentAbort, { once: true });
        const related = await withTimeout(
          findRelatedTests(absFilePath, ctx.workdir, discoveryAC.signal),
          POST_EDIT_TEST_DISCOVERY_TIMEOUT_MS,
          () => discoveryAC.abort(),
        ).catch(() => [] as string[]);
        execAC.signal.removeEventListener("abort", onParentAbort);
        if (related.length > 0) {
          const rel = related.map((f) =>
            f.startsWith(ctx.workdir + "/")
              ? f.slice(ctx.workdir.length + 1)
              : f,
          );
          result = {
            ...result,
            output:
              result.output +
              `\n[Verify] Related tests found: ${rel.join(", ")} — run verify(action="test", path="${rel[0]}") to check.`,
          };
        }
      }
    } catch {
      /* detector failure never blocks tool result */
    }
  }

  const distilled = distillToolResult(def.id, args, result);
  const cooldown = recordFailureCooldown(
    ctx.sessionId,
    def.id,
    args,
    distilled,
  );
  // Faz 5.1b: strategyShiftRequired olmuş bir strateji projenin KENDİ .aurict/'ine
  // kalıcı olarak yazılır — session bittiğinde kaybolmaz, gelecek session'lar uyarılır.
  if (cooldown?.strategyShiftRequired) {
    failedStrategiesStore.record(ctx.workdir, cooldown);
  }
  result = {
    ...result,
    metadata: {
      ...result.metadata,
      distilled,
      ...(cooldown ? { failureCooldown: cooldown } : {}),
    },
  };
  updateWorkingSetFromTool(ctx.sessionId, ctx.workdir, distilled);
  const revisionCheck = Object.entries(result.metadata?.verification ?? {})
    .map(([, check]) => check)
    .find(check => check?.workspaceRevision);
  if (revisionCheck?.workspaceRevision) {
    recordVerificationRevision(
      ctx.sessionId,
      def.id,
      revisionCheck.status === "passed" ? "passed" : revisionCheck.status === "skipped" ? "skipped" : "failed",
      revisionCheck.workspaceRevision,
      distilled.verification.join("; ") || result.output,
    );
  }
  if (cooldown?.strategyShiftRequired) {
    result = {
      ...result,
      output:
        result.output +
        `\n\n[Strategy] This failure pattern repeated ${cooldown.count} times. Do not retry the same command or edit pattern; inspect context and use a different strategy.`,
    };
  }
  recordRunTrace(ctx.workdir, ctx.sessionId, "tool_result_distilled", {
    tool: def.id,
    status: distilled.status,
    changedFiles: distilled.changedFiles,
    errors: distilled.errors,
    verification: distilled.verification,
    cooldown,
  }).catch(() => {});
  if (result.error) {
    const replay = flightReplayPolicy(def, args);
    try {
      await recordFlightFailure({
        workdir: ctx.workdir,
        sessionId: ctx.sessionId,
        tool: def.id,
        args,
        output: result.output,
        error: result.error,
        durationMs,
        replayPolicy: replay.policy,
        ...(replay.reason ? { replayBlockReason: replay.reason } : {}),
      });
    } catch (flightError) {
      console.error(`[aurict] failed to record flight for ${def.id}: ${flightError instanceof Error ? flightError.message : String(flightError)}`);
    }
  }

  // durationMs zaten yukarıda (post-execute) hesaplandı

  // Runtime doğruluk kararları kullanıcıya/model'e gösterilen string çıktıyı
  // parse etmez. Built-in tool sonucu burada tek kez typed outcome'a çevrilir.
  result = {
    ...result,
    outcome: toolOutcomeFromExecuteResult(def, result, durationMs),
  };

  // --- v1.tool.after hook (outcome-aware) ---
  const outcome = execError || result.error ? "error" : "success";
  const afterPayload = { tool: def.id, args, result, durationMs };
  await withTimeout(
    hooks.emitWithOutcome("v1.tool.after", afterPayload, outcome, durationMs),
    HOOK_TIMEOUT_MS,
  ).catch(() => {});
  const after = afterPayload;

  if (outcome === "error") {
    const errMsg = execError ?? result.error ?? "unknown";
    await withTimeout(
      hooks.emit("v1.tool.error", {
        tool: def.id,
        args,
        error: errMsg,
        durationMs,
      }),
      HOOK_TIMEOUT_MS,
    ).catch(() => {});
    // Persist to .aurict/diagnostics/ for cross-session awareness
    try {
      diagnosticsStore.record(ctx.workdir, {
        type: "tool_error",
        tool: def.id,
        error: errMsg.slice(0, 300),
      });
    } catch {
      /* diagnostics failure must never break tool execution */
    }
  }

  // --- SQLite kayıt ---
  if (ctx.sessionId && SessionManager.get(ctx.sessionId)) {
    try {
      SessionManager.addPart({
        sessionId: ctx.sessionId,
        role: "tool",
        type: "tool_result",
        content: JSON.stringify({ tool: def.id, args, result: after.result }),
      });
    } catch (error) {
      console.error(`[aurict] failed to persist tool result for ${ctx.sessionId}`, error);
    }
  }

  return after.result as ExecuteResult;
}

// Workdir dışındaki destructive bash komutlarını tespit et (rm/mv/dd/shred + dış path)
function isDestructiveOutsideWorkdir(
  command: string,
  workdir: string,
): boolean {
  if (!/\b(rm|mv|dd|shred|wipe)\b/.test(command)) return false;
  const home = process.env["HOME"] ?? "";
  const norm = workdir.endsWith("/") ? workdir : workdir + "/";
  const SAFE_ROOTS = [
    "/usr/",
    "/bin/",
    "/lib/",
    "/sbin/",
    "/opt/",
    "/tmp/",
    "/var/tmp/",
    "/proc/",
    "/sys/",
    "/dev/",
  ];
  const paths = [
    ...(command.match(/(?:~[/\w.-]*|\/[^\s"';|&<>(){}$\\*?[\]]+)/g) ?? []),
  ].map((p) =>
    p.startsWith("~") ? (p === "~" ? home : home + p.slice(1)) : p,
  );
  return paths.some((p) => {
    if (!p.startsWith("/")) return false;
    if (p.startsWith(norm) || p === workdir) return false;
    return !SAFE_ROOTS.some((r) => p.startsWith(r));
  });
}

function usesShellFileReader(command: string): boolean {
  return /(?:^|[;&|]\s*)(?:(?:command|env|time)\s+)*(?:cat|head|tail|less|more|grep|rg)\b/.test(command)
}

function verificationPathsForSession(ctx: ToolContext, args: Record<string, unknown>): string[] {
  const explicit = String(args["path"] ?? "");
  if (explicit) return [explicit];
  const changed = getWorkingSetSnapshot(ctx.sessionId).items
    .filter(item => item.kind === "file" && item.reason === "changed file" && item.path)
    .map(item => item.path!);
  if (changed.length > 0) return changed;
  return ["package.json", "tsconfig.json", "bun.lock", "bun.lockb"];
}

function extractPattern(
  tool: string,
  args: Record<string, unknown>,
  workdir: string,
): string {
  if (tool === "bash") return String(args["command"] ?? "*");
  if (tool === "write" || tool === "read" || tool === "edit") {
    const raw = String(args["path"] ?? "");
    // Resolve to absolute so evaluator deny rules can match /etc/*, /root/*, etc.
    return raw ? resolve(workdir, raw) : "";
  }
  if (tool === "apply_patch") return "*";
  return "*";
}
