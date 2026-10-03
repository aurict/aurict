import { SessionManager, gateGuard, getCircuitState, getContextBreakdown, loadConfig, readLatestTraceEvents } from "@aurict/core"
import type { CommandDef, CommandResult } from "./types.js"
import { CURRENT_VERSION } from "../util/update-check.js"
import { ensureLine, formatRelativeTime, oneLine, traceSummary } from "./command-helpers.js"

export const contextSystemCommands: CommandDef[] = [
  // ── /ctx ─────────────────────────────────────────────────────────────────
  {
    name:        "ctx",
    aliases:     ["context"],
    description: "Show context token breakdown and memory pressure",
    handler: (_args, ctx): CommandResult => {
      if (ctx.messages.length === 0) {
        return { type: "text", content: "No messages in context yet." }
      }
      // ctx.messages is DisplayMessage[], adapt to CoreMessage-like for breakdown
      const msgs = ctx.messages.map((m) => ({
        role:    m.role,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }))
      const breakdown = getContextBreakdown(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        msgs as any,
        ctx.contextWindow,
      )
      const cb  = getCircuitState()
      const pct = Math.round(breakdown.percentUsed * 100)
      const liveUsage = ctx.contextUsage
      const livePct = liveUsage
        ? Math.round(Math.min(1, liveUsage.effectiveTokens / liveUsage.contextWindow) * 100)
        : undefined

      const roleLines = Object.entries(breakdown.byRole)
        .sort((a, b) => b[1] - a[1])
        .map(([role, tokens]) => `  ${role.padEnd(12)} ${fmtK(tokens)} tokens`)
        .join("\n")

      const topLines = breakdown.topMessages
        .map((m, i) => `  ${i + 1}. [${fmtK(m.tokens)}t] ${m.preview}`)
        .join("\n")

      const cbStatus = cb.status === "open"
        ? `🔴 OPEN (${cb.failures} failures, resets in ${Math.max(0, Math.round((60_000 - (Date.now() - cb.lastFailAt)) / 1000))}s)`
        : cb.status === "half-open" ? "🟡 half-open" : "🟢 closed"
      const promptSectionLines = ctx.promptDiagnostics
        ? ctx.promptDiagnostics.sections
          .slice()
          .sort((a, b) => b.tokens - a.tokens)
          .slice(0, 8)
          .map((section) => {
            const budget = section.budgetTokens ? ` / ${fmtK(section.budgetTokens)}` : ""
            const warn = section.overBudgetTokens && section.overBudgetTokens > 0 ? `  OVER +${fmtK(section.overBudgetTokens)}` : ""
            return `  ${section.name.padEnd(24)} ${section.cache.padEnd(7)} ${fmtK(section.tokens)}${budget} tokens${warn}`
          })
          .join("\n")
        : "  (no prompt diagnostics yet)"
      const promptBudgetLines = ctx.promptDiagnostics?.warnings?.length
        ? ctx.promptDiagnostics.warnings
          .slice(0, 5)
          .map((warning) => `  ${warning.scope}:${warning.name} +${fmtK(warning.overBudgetTokens)} over ${fmtK(warning.budgetTokens)}`)
          .join("\n")
        : "  (within configured budgets)"
      const cacheHealth = ctx.promptCacheHealth
        ? [
            `  Status:       ${ctx.promptCacheHealth.kind}`,
            `  Sections:     ${ctx.promptCacheHealth.snapshot.sectionCount}`,
            `  Tools:        ${ctx.promptCacheHealth.snapshot.toolCount}`,
            `  Cacheable:    ${ctx.promptCacheHealth.snapshot.cacheableHash}`,
            `  Dynamic:      ${ctx.promptCacheHealth.snapshot.dynamicHash}`,
            `  Tool schema:  ${ctx.promptCacheHealth.snapshot.toolHash}`,
          ].join("\n")
        : "  (no cache health sample yet)"

      function fmtK(n: number) {
        return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
          .format(Math.max(0, Math.round(n)))
      }

      return {
        type:    "text",
        content: [
          `── Context Memory ──────────────────────────`,
          liveUsage
            ? `  Prompt:    ${fmtK(liveUsage.effectiveTokens)} / ${fmtK(liveUsage.contextWindow)} tokens  (${livePct}%)`
            : `  Prompt:    unavailable until the first completed turn`,
          liveUsage
            ? `  Compact at: ${fmtK(liveUsage.compactionThreshold)} tokens  (reserve ${fmtK(liveUsage.maxOutputTokens)} output + 20k safety)`
            : null,
          `  Visible:   ${fmtK(breakdown.total)} / ${fmtK(ctx.contextWindow)} tokens  (${pct}%)`,
          `  Messages:  ${ctx.messages.length}`,
          ``,
          `  By Role:`,
          roleLines,
          ``,
          `  Top 5 Expensive Messages:`,
          topLines,
          ``,
          `  Circuit Breaker: ${cbStatus}`,
          ``,
          `── Prompt Sections ────────────────────────`,
          ctx.promptDiagnostics
            ? `  Total: ${fmtK(ctx.promptDiagnostics.totalTokens)} / ${fmtK(ctx.promptDiagnostics.totalBudgetTokens ?? 0)} tokens across ${ctx.promptDiagnostics.sections.length} sections`
            : `  Total: n/a`,
          promptSectionLines,
          ``,
          `  Budget Warnings:`,
          promptBudgetLines,
          ``,
          `── Prompt Cache Health ────────────────────`,
          cacheHealth,
        ].join("\n"),
      }
    },
  },


  // ── /trace ────────────────────────────────────────────────────────────────
  {
    name:        "trace",
    aliases:     [],
    description: "Show recent agent run trace decisions",
    usage:       "[N]",
    handler: async (args, ctx): Promise<CommandResult> => {
      const limit = Math.max(1, Math.min(80, Number(args[0] ?? 20) || 20))
      const events = await readLatestTraceEvents(ctx.workdir, ctx.sessionId, limit)
      if (events.length === 0) {
        return { type: "text", content: "No trace events recorded for this session yet." }
      }
      const lines = events.map((event) => {
        const time = new Date(event.ts).toLocaleTimeString()
        return `  ${time}  ${event.type.padEnd(24)} ${oneLine(traceSummary(event.data), 130)}`
      })
      return {
        type: "text",
        content: [
          `── Run Trace (${events.length}) ─────────────────────────`,
          ...lines,
        ].join("\n"),
      }
    },
  },

  // ── /replay ───────────────────────────────────────────────────────────────
  {
    name:        "replay",
    aliases:     [],
    description: "Jump to a checkpoint (random access, unlike /undo which is sequential)",
    usage:       "[N]",
    handler: async (args, ctx): Promise<CommandResult> => {
      const { checkpoints } = ctx
      if (checkpoints.length === 0) {
        return { type: "text", content: "No checkpoints saved yet. A checkpoint is saved before each prompt runs." }
      }

      if (args.length === 0) {
        const lines = checkpoints.map((cp, i) => `  [${i}] before "${cp.label}"`)
        return { type: "text", content: "Checkpoints:\n" + lines.join("\n") + "\n\nUse /replay <N> to jump to checkpoint N." }
      }

      const idx = parseInt(args[0] ?? "", 10)
      if (isNaN(idx) || idx < 0 || idx >= checkpoints.length) {
        return { type: "error", message: `Invalid checkpoint index. Valid range: 0-${checkpoints.length - 1}` }
      }

      await ctx.rewindTo(idx, true)
      return { type: "text", content: "" }
    },
  },

  // ── /protect ──────────────────────────────────────────────────────────────
  {
    name:        "protect",
    aliases:     [],
    description: "Add a file pattern to GateGuard protection (ask before write)",
    usage:       "<pattern>",
    handler: (args): CommandResult => {
      const pattern = args[0]
      if (!pattern) return { type: "text", content: "Usage: /protect <pattern>\nExample: /protect .env.local" }
      gateGuard.addRule({ pattern, action: "ask" })
      return { type: "text", content: `GateGuard: '${pattern}' added to protected patterns.` }
    },
  },

  // ── /unprotect ────────────────────────────────────────────────────────────
  {
    name:        "unprotect",
    aliases:     [],
    description: "Remove a custom GateGuard protection pattern",
    usage:       "[pattern]",
    handler: (args): CommandResult => {
      const pattern = args[0]
      if (!pattern) {
        gateGuard.clearCustomRules()
        return { type: "text", content: "GateGuard: all custom protection rules cleared." }
      }
      gateGuard.removePattern(pattern)
      return { type: "text", content: `GateGuard: '${pattern}' removed from protected patterns.` }
    },
  },

  // ── /version ──────────────────────────────────────────────────────────────
  {
    name:        "version",
    aliases:     ["v"],
    description: "Show Aurict version",
    handler: (): CommandResult => ({ type: "text", content: `Aurict v${CURRENT_VERSION}` }),
  },

  // ── /exit ─────────────────────────────────────────────────────────────────
  {
    name:        "exit",
    aliases:     ["quit", "q"],
    description: "Exit Aurict",
    handler: (): CommandResult => ({ type: "exit" }),
  },

  // ── /keys ─────────────────────────────────────────────────────────────────
  {
    name:        "keys",
    aliases:     ["keybindings", "kb"],
    description: "Show all keybindings (active + custom overrides)",
    handler: async (): Promise<CommandResult> => {
      const { loadKeybindings, formatAllBindings } = await import("../keybindings/index.js")
      const load = loadKeybindings()
      const text = formatAllBindings(load.bindings)
      return {
        type: "text",
        content: load.error
          ? `${text}\n\n⚠ ${load.error}`
          : text,
      }
    },
  },

  // ── /cost ─────────────────────────────────────────────────────────────────
  {
    name:        "cost",
    description: "Show session token usage and estimated cost",
    handler: (args, ctx): CommandResult => {
      // DB-backed stats (Faz 1 recordTurn) — kesin maliyet
      const stats   = SessionManager.getStats(ctx.sessionId)
      const t       = ctx.tokens ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 }

      const fmt = (n: number) => n < 0.0001 ? "<$0.0001" : `$${n.toFixed(4)}`
      const pad = (n: number) => n.toLocaleString().padStart(10)

      if (stats && stats.turnCount > 0) {
        // Real DB data is available
        const totalTok  = stats.totalInputTokens + stats.totalOutputTokens + stats.totalCacheTokens
        const hasCaching = stats.totalCacheTokens > 0
        const lines = [
          `Session cost  (${stats.lastModel ?? ctx.model})  •  ${stats.turnCount} turn${stats.turnCount !== 1 ? "s" : ""}`,
          ``,
          `  Input tokens:   ${pad(stats.totalInputTokens)}`,
          `  Output tokens:  ${pad(stats.totalOutputTokens)}`,
          ...(hasCaching ? [`  Cache tokens:   ${pad(stats.totalCacheTokens)}`] : []),
          `  ─────────────────────────────────────────────────`,
          `  Total tokens:   ${pad(totalTok)}`,
          ``,
          `  Accumulated cost: ${fmt(stats.accumulatedCostUsd)}  (exact, from cost table)`,
        ]
        return { type: "text", content: lines.join("\n") }
      }

      // Fallback: in-memory estimation (no DB data yet)
      const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
        "claude-opus-4":    { input: 15,    output: 75,   cacheRead: 1.5,   cacheWrite: 18.75 },
        "claude-sonnet-4":  { input: 3,     output: 15,   cacheRead: 0.3,   cacheWrite: 3.75  },
        "claude-haiku-4":   { input: 0.8,   output: 4,    cacheRead: 0.08,  cacheWrite: 1.0   },
        "gpt-4o":           { input: 2.5,   output: 10,   cacheRead: 1.25,  cacheWrite: 2.5   },
        "gpt-4o-mini":      { input: 0.15,  output: 0.6,  cacheRead: 0.075, cacheWrite: 0.15  },
        "gemini-2.5-pro":   { input: 1.25,  output: 10,   cacheRead: 0.31,  cacheWrite: 1.25  },
        "gemini-2.5-flash": { input: 0.15,  output: 0.6,  cacheRead: 0.0375,cacheWrite: 0.15  },
        "default":          { input: 3,     output: 15,   cacheRead: 0.3,   cacheWrite: 3.75  },
      }
      const modelKey = Object.keys(PRICING).find(k => ctx.model.toLowerCase().includes(k.replace(/-/g,"").slice(0,8))) ?? "default"
      const price    = PRICING[modelKey]!
      const freshCost = (t.input      / 1_000_000) * price.input
      const outCost   = (t.output     / 1_000_000) * price.output
      const readCost  = ((t.cacheRead  ?? 0) / 1_000_000) * price.cacheRead
      const writeCost = ((t.cacheWrite ?? 0) / 1_000_000) * price.cacheWrite
      const totalCost = freshCost + outCost + readCost + writeCost
      const hasCaching = (t.cacheRead ?? 0) + (t.cacheWrite ?? 0) > 0

      const lines = [
        `Session token usage (${ctx.model})  [estimated — no DB data yet]:`,
        ``,
        `  Fresh input:  ${pad(t.input)}  tokens   ${fmt(freshCost)}`,
        `  Output:       ${pad(t.output)}  tokens   ${fmt(outCost)}`,
        ...(hasCaching ? [
          `  Cache reads:  ${pad(t.cacheRead ?? 0)}  tokens   ${fmt(readCost)}`,
          `  Cache writes: ${pad(t.cacheWrite ?? 0)}  tokens   ${fmt(writeCost)}`,
        ] : []),
        `  ──────────────────────────────────────────────────`,
        `  Total:        ${pad(t.input + t.output + (t.cacheRead??0) + (t.cacheWrite??0))}  tokens   ${fmt(totalCost)}`,
      ]
      return { type: "text", content: lines.join("\n") }
    },
  },

  // ── /rewind ───────────────────────────────────────────────────────────────
  {
    name:        "rewind",
    description: "Rewind to before an earlier prompt — conversation, and optionally the files the agent changed",
    usage:       "/rewind [N]  — omit N to pick a prompt; N = prompts back",
    handler: (args, ctx): CommandResult => {
      const cps = ctx.checkpoints
      if (cps.length === 0) {
        return { type: "text", content: "No checkpoints yet. A checkpoint is saved before each prompt runs." }
      }

      if (!args[0]) {
        const items = cps.map((cp, i) => {
          const files = ctx.checkpointFiles(i).length
          return {
            id:    String(i),
            label: `before "${cp.label}"`,
            hint:  `${new Date(cp.createdAt).toTimeString().slice(0, 5)} · ${files} file${files === 1 ? "" : "s"} changed since`,
          }
        }).reverse()
        return {
          type: "picker",
          title: "Rewind to before a prompt",
          items,
          onSelect: (item) => ctx.requestRewind(parseInt(item.id, 10)),
        }
      }

      const n = parseInt(args[0]!, 10)
      if (isNaN(n) || n < 1) return { type: "error", message: "Usage: /rewind [N]  (N = prompts back, 1 = last)" }
      ctx.requestRewind(Math.max(0, cps.length - n))
      return { type: "text", content: "" }
    },
  },

  // ── /pet ──────────────────────────────────────────────────────────────────
  {
    name:        "pet",
    description: "Pet your companion (+10 XP)",
    handler: async (): Promise<CommandResult> => {
      const { loadCompanion, saveCompanion, addXP } = await import("../companion/persistence.js")
      const state = loadCompanion()
      const { state: newState, result } = addXP(state, 10)
      saveCompanion(newState)
      const unlockMsg = result.newlyUnlocked.length > 0
        ? `\n🎉 Unlocked: ${result.newlyUnlocked.map(u => u.name).join(", ")}!`
        : ""
      return { type: "text", content: `Your companion appreciates it! XP: ${result.newXp}${unlockMsg}` }
    },
  },

  // ── /name ─────────────────────────────────────────────────────────────────
  {
    name:        "name",
    description: "Set your companion's name",
    usage:       "/name <name>  (leave empty to reset)",
    handler: async (args): Promise<CommandResult> => {
      const { loadCompanion, saveCompanion, setCustomName } = await import("../companion/persistence.js")
      const state   = loadCompanion()
      const newName = args.join(" ").trim()
      const newState = setCustomName(state, newName)
      saveCompanion(newState)
      return {
        type: "text",
        content: newState.customName
          ? `Companion renamed to "${newState.customName}"`
          : "Companion name reset to default.",
      }
    },
  },

  // ── /companion ────────────────────────────────────────────────────────────
  {
    name:        "companion",
    description: "Show companion status and unlocked species/hats",
    handler: async (): Promise<CommandResult> => {
      const { loadCompanion } = await import("../companion/persistence.js")
      const { SPECIES_MAP }   = await import("../companion/species.js")
      const { HATS_MAP }      = await import("../companion/hats.js")
      const state   = loadCompanion()
      const species = SPECIES_MAP.get(state.speciesId)
      const hat     = state.hatId ? HATS_MAP.get(state.hatId) : undefined
      const lines   = [
        `Companion: ${state.customName ?? state.speciesId}  (${species?.name ?? state.speciesId}, ${species?.rarity ?? "?"})`,
        `Hat:       ${hat?.name ?? "none"}`,
        `XP:        ${state.xp}`,
        `Tool calls: ${state.totalToolCalls}  Messages: ${state.totalMessages}`,
        ``,
        `Unlocked species: ${state.unlockedSpecies.join(", ")}`,
        `Unlocked hats:    ${state.unlockedHats.join(", ")}`,
      ]
      return { type: "text", content: lines.join("\n") }
    },
  },
]
