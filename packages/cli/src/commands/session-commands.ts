import { SessionManager, defaultExportFilename, exportToHtml, exportToMarkdown, gateGuard, getConfigPath, loadConfig, setDefault, snapshotManager } from "@aurict/core"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import type { CommandDef, CommandResult, PickerItem } from "./types.js"
import { ensureLine, formatRelativeTime, oneLine } from "./command-helpers.js"
import { workingTreeDiff } from "./git-working-diff.js"

export const sessionCommands: CommandDef[] = [
  // ── /clear ────────────────────────────────────────────────────────────────
  {
    name:        "clear",
    aliases:     ["c"],
    description: "Clear chat history",
    handler: (): CommandResult => ({ type: "clear" }),
  },


  // ── /new ─────────────────────────────────────────────────────────────────
  {
    name:        "new",
    description: "Start a new session (the current one stays available in /resume)",
    handler: (): CommandResult => ({ type: "new" }),
  },

  // ── /status ──────────────────────────────────────────────────────────────
  {
    name:        "status",
    aliases:     ["st"],
    description: "Show terminal session health, context, checkpoints, and runtime state",
    handler: (_args, ctx): CommandResult => {
      const persistedParts = SessionManager.getPartsCount(ctx.sessionId)
      const stats = SessionManager.getStats(ctx.sessionId)
      const activeBg = ctx.bgTasks.filter((task) => task.status === "running").length
      const pendingTools = ctx.messages.filter((msg) => msg.pending).length
      const toolResults = ctx.messages.filter((msg) => msg.tool).length
      const gateRules = gateGuard.listRules()
      const customGateRules = Math.max(0, gateRules.length - 8)
      const tokenTotal = (ctx.tokens?.input ?? 0) + (ctx.tokens?.output ?? 0) + (ctx.tokens?.cacheRead ?? 0) + (ctx.tokens?.cacheWrite ?? 0)

      const lines = [
        "Aurict status",
        "",
        `Session:      ${ctx.sessionId.slice(0, 12)}  (${persistedParts} persisted parts, ${ctx.messages.length} visible messages)`,
        `Provider:     ${ctx.provider}`,
        `Model:        ${ctx.model}${ctx.effort !== undefined ? `  effort=${ctx.effort}` : ""}`,
        `Agent:        ${ctx.activeAgent}${ctx.coordinatorMode ? "  coordinator=on" : ""}${ctx.autopilotMode ? "  project-auto=on" : ""}`,
        `Workdir:      ${ctx.workdir}`,
        `Undercover:   ${ctx.isUndercover ? "on" : "off"}`,
        `Context:      ${ctx.contextWindow.toLocaleString()} tokens window, ${tokenTotal.toLocaleString()} session tokens observed`,
        `Skills:       ${ctx.skills.length > 0 ? ctx.skills.join(", ") : "none loaded"}`,
        `Checkpoints:  ${ctx.checkpoints.length} rewind checkpoint(s), ${snapshotManager.getHistoryLength()} file snapshot(s)`,
        `Branches:     ${ctx.branches.length} branch(es), active #${ctx.activeBranchIdx}`,
        `Watchers:     ${ctx.watchedPaths.length}`,
        `Background:   ${ctx.bgTasks.length} task(s), ${activeBg} running`,
        `Tools:        ${toolResults} result message(s), ${pendingTools} pending`,
        `GateGuard:    ${gateRules.length} rule(s), ${customGateRules} custom`,
      ]

      if (stats) {
        lines.push(`Cost DB:      ${stats.turnCount} turn(s), $${stats.accumulatedCostUsd.toFixed(4)}, last=${stats.lastModel ?? "unknown"}`)
      }

      return { type: "text", content: lines.join("\n") }
    },
  },

  // ── /history ─────────────────────────────────────────────────────────────
  {
    name:        "history",
    aliases:     ["hist"],
    description: "Show recent visible messages and persisted session part counts",
    usage:       "/history [N]",
    handler: (args, ctx): CommandResult => {
      const limit = Math.min(50, Math.max(1, parseInt(args[0] ?? "12", 10) || 12))
      const recent = ctx.messages.slice(-limit)
      const persistedCount = SessionManager.getPartsCount(ctx.sessionId)
      const persistedTail = SessionManager.getPartsTail(ctx.sessionId, Math.min(limit, 10))

      const lines = [
        `History (${recent.length}/${ctx.messages.length} visible messages, ${persistedCount} persisted parts)`,
        "",
      ]

      if (recent.length === 0) {
        lines.push("No visible messages yet.")
      } else {
        for (let i = 0; i < recent.length; i++) {
          const msg = recent[i]!
          const idx = ctx.messages.length - recent.length + i + 1
          const tool = msg.tool ? ` tool=${msg.tool}` : ""
          const pending = msg.pending ? " pending" : ""
          lines.push(`${String(idx).padStart(3)}. ${msg.role}${tool}${pending}  ${oneLine(msg.content)}`)
        }
      }

      if (persistedTail.length > 0) {
        lines.push("", "Persisted tail:")
        for (const part of persistedTail) {
          lines.push(`  #${part.sequence} ${part.role}/${part.type} ${formatRelativeTime(part.createdAt)}  ${oneLine(part.content, 90)}`)
        }
      }

      return { type: "text", content: lines.join("\n") }
    },
  },

  // ── /diffs ───────────────────────────────────────────────────────────────
  {
    name:        "diffs",
    description: "List recent diff, patch, edit, and write tool outputs in this terminal session",
    usage:       "/diffs [N]",
    handler: (args, ctx): CommandResult => {
      const limit = Math.min(25, Math.max(1, parseInt(args[0] ?? "8", 10) || 8))
      const matches = ctx.messages
        .map((msg, idx) => ({ msg, idx }))
        .filter(({ msg }) => {
          const text = `${msg.content ?? ""}\n${msg.resultContent ?? ""}`
          const tool = msg.tool ?? ""
          return ["edit", "write", "apply_patch", "diff_view", "patch_test"].includes(tool)
            || text.includes("__DIFF__")
            || text.includes("Applied patch:")
            || text.includes("Patch validation:")
            || text.includes("--- ")
        })
        .slice(-limit)

      if (matches.length === 0) {
        return { type: "text", content: "No diff or patch outputs in the visible session yet." }
      }

      const lines = [`Recent diff/patch outputs (${matches.length})`, ""]
      for (const { msg, idx } of matches) {
        const text = `${msg.resultContent ?? ""}\n${msg.content ?? ""}`
        const added = (text.match(/^\+(?!\+\+)/gm) ?? []).length
        const removed = (text.match(/^-(?!--)/gm) ?? []).length
        const files = [
          ...text.matchAll(/(?:\+\+\+|---)\s+(?:b\/)?([^\n]+)/g),
          ...text.matchAll(/(?:A|M|D|R)\s+([^\n]+)/g),
        ].map((m) => m[1]?.trim()).filter(Boolean)
        const uniqueFiles = [...new Set(files)].slice(0, 4)
        lines.push(
          `${String(idx + 1).padStart(3)}. ${msg.tool ?? msg.role}  +${added}/-${removed}` +
          `${uniqueFiles.length ? `  ${uniqueFiles.join(", ")}` : ""}`
        )
        lines.push(`     ${oneLine(text, 120)}`)
      }

      return { type: "text", content: lines.join("\n") }
    },
  },

  // ── /diff ────────────────────────────────────────────────────────────────
  {
    name:        "diff",
    description: "Show the working tree diff against HEAD, including untracked files",
    handler: async (_args, ctx): Promise<CommandResult> => {
      const result = await workingTreeDiff(ctx.workdir)
      const skipped = result.skippedUntracked.length > 0
        ? ` · ${result.skippedUntracked.length} large or extra untracked file(s) not shown`
        : ""
      if (!result.diff) {
        return { type: "text", content: `Working tree clean — no changes against HEAD${skipped}` }
      }
      ctx.showDiff(result.diff, `git diff · ${result.trackedFiles} tracked, ${result.untrackedFiles} untracked${skipped}`)
      return { type: "text", content: "" }
    },
  },

  // ── /doctor ──────────────────────────────────────────────────────────────
  {
    name:        "doctor",
    aliases:     ["health"],
    description: "Run terminal install and runtime diagnostics (use --json for machine output)",
    handler: async (args, ctx): Promise<CommandResult> => {
      const json = args.includes("--json") || args.includes("-j")
      const { getDoctorReport, getDoctorReportJson } = await import("../util/doctor.js")
      if (json) {
        const report = await getDoctorReportJson(ctx.workdir)
        return report.exitCode === 0
          ? { type: "text", content: report.json }
          : { type: "error", message: report.json }
      }
      const report = await getDoctorReport(ctx.workdir)
      return report.exitCode === 0
        ? { type: "text", content: report.text }
        : { type: "error", message: report.text }
    },
  },

  // ── /init ────────────────────────────────────────────────────────────────
  {
    name:        "init",
    aliases:     ["setup"],
    description: "Initialize Aurict project files without overwriting existing files",
    handler: (_args, ctx): CommandResult => {
      const created: string[] = []
      const skipped: string[] = []
      const aurictDir = join(ctx.workdir, ".aurict")
      mkdirSync(aurictDir, { recursive: true })

      const agentsPath = join(ctx.workdir, "AGENTS.md")
      if (!existsSync(agentsPath)) {
        writeFileSync(agentsPath, [
          "# Aurict Project Instructions",
          "",
          "## Project Context",
          "- Describe the architecture, package manager, test command, and coding conventions here.",
          "- Keep instructions concrete and repo-specific.",
          "",
          "## Safety",
          "- Aurict policy sandbox is a low-overhead guarded execution layer, not container isolation.",
          "- Review writes to protected paths before approving.",
          "",
        ].join("\n"), "utf8")
        created.push("AGENTS.md")
      } else {
        skipped.push("AGENTS.md")
      }

      const configPath = join(aurictDir, "config.json")
      if (!existsSync(configPath)) {
        const cfg = {
          defaults: {
            provider: ctx.provider,
            model: ctx.model,
          },
          compaction: {
            tailTurns: 2,
            strategy: "balanced",
          },
          agents: {
            maxWorkers: 4,
          },
          securitySandbox: {
            enabled: false,
            profile: "off",
            network: "restricted",
            targetAllowlist: [],
          },
          longTaskRuntime: {
            enabled: true,
            mode: "soft",
            strictVerification: true,
            maxContinuationSteps: 12,
            maxRecoveryAttempts: 3,
            maxVerificationRuns: 4,
            maxNoProgressTurns: 3,
          },
        }
        writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n", "utf8")
        created.push(".aurict/config.json")
      } else {
        skipped.push(".aurict/config.json")
      }

      const protectedPath = join(aurictDir, "protected.json")
      if (!existsSync(protectedPath)) {
        writeFileSync(protectedPath, JSON.stringify([
          { pattern: ".env*", action: "ask" },
          { pattern: "package.json", action: "ask" },
          { pattern: "bun.lock", action: "ask" },
          { pattern: ".git/*", action: "deny" },
          { pattern: ".aurict/*", action: "deny" },
        ], null, 2) + "\n", "utf8")
        created.push(".aurict/protected.json")
      } else {
        skipped.push(".aurict/protected.json")
      }

      const gitignorePath = join(ctx.workdir, ".gitignore")
      if (ensureLine(gitignorePath, ".aurict/")) {
        created.push(".gitignore entry: .aurict/")
      } else {
        skipped.push(".gitignore entry: .aurict/")
      }

      gateGuard.setProjectDir(ctx.workdir)

      return {
        type: "text",
        content: [
          "Aurict project initialized.",
          "",
          created.length ? `Created:\n${created.map((x) => `  - ${x}`).join("\n")}` : "Created: none",
          "",
          skipped.length ? `Already present:\n${skipped.map((x) => `  - ${x}`).join("\n")}` : "Already present: none",
          "",
          "Next:",
          "  - Edit AGENTS.md with project-specific instructions.",
          "  - Use /doctor to verify provider, config, and server state.",
          "  - Use /protect <pattern> for additional sensitive files.",
        ].join("\n"),
      }
    },
  },

  // ── /session [id] ─────────────────────────────────────────────────────────
  {
    name:        "session",
    aliases:     ["s"],
    description: "Show current session info or restore a previous session",
    usage:       "/session abc123",
    handler: (args, ctx): CommandResult => {
      if (!args[0]) {
        return {
          type:    "text",
          content: `Provider : ${ctx.provider}\nModel    : ${ctx.model}\nWorkdir  : ${ctx.workdir}`,
        }
      }
      const id      = args[0]
      const session = SessionManager.get(id)
      if (!session) return { type: "error", message: `Session not found: ${id}` }
      const parts   = SessionManager.getParts(id)
      const history = parts
        .filter((p) => p.role === "user" || p.role === "assistant")
        .map((p) => ({ role: p.role as "user" | "assistant", content: p.content }))
      ctx.restoreSession(history)
      return { type: "text", content: `Session loaded: ${session.title ?? id}  (${history.length} messages)` }
    },
  },

  // ── /sessions ─────────────────────────────────────────────────────────────
  {
    name:        "sessions",
    aliases:     ["ss", "resume"],
    description: "Browse and restore sessions (interactive picker) — /sessions search <query>",
    usage:       "/sessions [today|week|all|search <query>]",
    handler: (args, ctx): CommandResult => {
      // /sessions search <query>
      if (args[0]?.toLowerCase() === "search") {
        const query = args.slice(1).join(" ").trim()
        if (!query) return { type: "error", message: "Usage: /sessions search <query>" }

        const results = SessionManager.search(query, 20)
        if (!results.length) return { type: "text", content: `No sessions found matching "${query}".` }

        const fmtTs = (ts: number) => {
          const d = new Date(ts)
          return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`
        }

        const items: PickerItem[] = results.map(r => ({
          id:    r.sessionId,
          label: `${(r.title ?? "(untitled)").slice(0, 35)}`,
          hint:  `${fmtTs(r.updatedAt)}  •  ${r.matchCount} match${r.matchCount !== 1 ? "es" : ""}  •  ${r.excerpt.slice(0, 50)}`,
        }))

        return {
          type:  "picker",
          title: `Search: "${query}" — ${results.length} session(s)`,
          items,
          onSelect: (item) => {
            const parts = SessionManager.getParts(item.id)
            const msgs  = parts
              .filter(p => p.role === "user" || p.role === "assistant")
              .map(p => ({ role: p.role as "user" | "assistant", content: p.content }))
            ctx.restoreSession(msgs)
          },
        }
      }

      const filter = args[0]?.toLowerCase() ?? "all"
      const now    = Date.now()
      const DAY    = 86_400_000
      const WEEK   = 7 * DAY

      let all = SessionManager.list()
        .filter(s => !s.parentId)  // main sessions only
        .sort((a, b) => b.updatedAt - a.updatedAt)

      if (filter === "today") all = all.filter(s => now - s.updatedAt < DAY)
      if (filter === "week")  all = all.filter(s => now - s.updatedAt < WEEK)

      if (!all.length) return { type: "text", content: `No sessions found (filter: ${filter}).` }

      const fmtDate = (ts: number) => {
        const d   = new Date(ts)
        const dn  = new Date(now)
        if (d.toDateString() === dn.toDateString()) {
          return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} today`
        }
        if (now - ts < WEEK) return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]!
        return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`
      }

      const items: PickerItem[] = all.slice(0, 30).map(s => {
        const parts   = SessionManager.getParts(s.id)
        const preview = parts.find(p => p.role === "user")?.content.slice(0, 50).replace(/\n/g," ") ?? "(empty)"
        const status  = s.status === "complete" ? "✓" : s.status === "error" ? "✗" : "●"
        return {
          id:    s.id,
          label: `${status} ${(s.title ?? "(untitled)").slice(0, 30)}`,
          hint:  `${fmtDate(s.updatedAt)}  •  ${preview}`,
        }
      })

      return {
        type: "picker",
        title: `Sessions (${filter}) — Enter to restore`,
        items,
        onSelect: (item) => {
          const parts = SessionManager.getParts(item.id)
          const msgs  = parts
            .filter(p => p.role === "user" || p.role === "assistant")
            .map(p => ({ role: p.role as "user" | "assistant", content: p.content }))
          ctx.restoreSession(msgs)
        },
      }
    },
  },
]
