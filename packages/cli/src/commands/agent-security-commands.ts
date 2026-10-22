import { applySecurityVerification, buildAttackGraphFromFindings, evaluateSecurityOperatorStep, formatAttackGraph, formatSecurityLedgerAnchor, formatSecurityOperatorDecision, loadConfig, loadCustomAgents, mcpManager, resetSecurityAssessmentLedger, resolveSecuritySandboxConfig, verifySecurityFinding } from "@aurict/core"
import { BRAND_PALETTE_IDS, THEMES, THEME_NAMES, isBrandTheme } from "../utils/theme.js"
import type { CommandDef, CommandResult, PickerItem } from "./types.js"
import { findLedgerFinding, formatSecurityReportFromLedger, formatSecurityStatus, getOrCreateSecurityLedger, rewriteSecurityLedger } from "./command-helpers.js"

export const agentSecurityCommands: CommandDef[] = [
  // ── /agents ───────────────────────────────────────────────────────────────
  {
    name:        "agents",
    aliases:     ["ag"],
    description: "List custom agents in .aurict/agents/",
    handler: (_args, ctx): CommandResult => {
      const agents = loadCustomAgents(ctx.workdir)
      if (!agents.length) return { type: "text", content: "No custom agents (.aurict/agents/ is empty)" }
      const lines = agents.map((a) => `  ${a.id.padEnd(18)} ${a.name ?? a.id}`)
      return { type: "text", content: `Custom Agents (${agents.length}):\n` + lines.join("\n") }
    },
  },


  // ── /mcp ──────────────────────────────────────────────────────────────────
  {
    name:        "mcp",
    description: "List connected MCP servers",
    handler: (): CommandResult => {
      const servers = mcpManager.list()
      if (!servers.length) return { type: "text", content: "No MCP servers connected" }
      const lines = servers.map((s) =>
        `  ${s.name.padEnd(16)} ${s.status.padEnd(12)} ${s.toolCount} tool${s.error ? "  ✗ " + s.error : ""}`
      )
      return { type: "text", content: "MCP Servers:\n" + lines.join("\n") }
    },
  },

  // ── /security ─────────────────────────────────────────────────────────────
  {
    name:        "security",
    aliases:     ["sec"],
    description: "Manage security operator state, scope, verification, and reports",
    usage:       "/security status|ledger|plan|scope|verify|graph|report|reset",
    handler: (args, ctx): CommandResult => {
      const action = args[0] ?? "status"
      if (action === "status") {
        return { type: "text", content: formatSecurityStatus(ctx.workdir) }
      }
      if (action === "ledger") {
        const ledger = getOrCreateSecurityLedger(ctx.workdir)
        return { type: "text", content: formatSecurityLedgerAnchor(ledger) }
      }
      if (action === "plan") {
        const cfg = loadConfig(ctx.workdir)
        const ledger = getOrCreateSecurityLedger(ctx.workdir)
        const decision = evaluateSecurityOperatorStep(ledger, resolveSecuritySandboxConfig(cfg))
        return { type: "text", content: formatSecurityOperatorDecision(decision) }
      }
      if (action === "scope") {
        const sub = args[1] ?? "list"
        const target = args.slice(2).join(" ").trim()
        const ledger = getOrCreateSecurityLedger(ctx.workdir)
        if (sub === "list") {
          return { type: "text", content: ledger.scope.length ? `Security scope:\n${ledger.scope.map((item) => `  - ${item}`).join("\n")}` : "Security scope is empty." }
        }
        if (sub === "add") {
          if (!target) return { type: "error", message: "Usage: /security scope add <target>" }
          const scope = Array.from(new Set([...ledger.scope, target])).sort()
          const next = rewriteSecurityLedger(ctx.workdir, ledger, { scope })
          return { type: "text", content: formatSecurityLedgerAnchor(next) }
        }
        if (sub === "remove") {
          if (!target) return { type: "error", message: "Usage: /security scope remove <target>" }
          const next = rewriteSecurityLedger(ctx.workdir, ledger, { scope: ledger.scope.filter((item) => item !== target) })
          return { type: "text", content: formatSecurityLedgerAnchor(next) }
        }
        return { type: "error", message: "Usage: /security scope list|add <target>|remove <target>" }
      }
      if (action === "verify") {
        const selector = args[1]
        if (!selector) return { type: "error", message: "Usage: /security verify <finding-id|number>" }
        const ledger = getOrCreateSecurityLedger(ctx.workdir)
        const finding = findLedgerFinding(ledger, selector)
        if (!finding) return { type: "error", message: `Finding not found: ${selector}` }
        const verification = verifySecurityFinding(finding)
        const updated = applySecurityVerification(finding, verification)
        const findings = ledger.findings.map((item) => item === finding ? updated : item)
        const next = rewriteSecurityLedger(ctx.workdir, ledger, { findings })
        return {
          type: "text",
          content: [
            `Verification verdict: ${verification.verdict}`,
            `Evidence strength: ${verification.evidenceStrength}`,
            verification.whyCouldBeFalsePositive.length ? `False-positive considerations:\n${verification.whyCouldBeFalsePositive.map((item) => `  - ${item}`).join("\n")}` : "",
            "",
            formatSecurityLedgerAnchor(next),
          ].filter(Boolean).join("\n"),
        }
      }
      if (action === "graph") {
        const ledger = getOrCreateSecurityLedger(ctx.workdir)
        const graph = buildAttackGraphFromFindings(ledger.findings)
        return { type: "text", content: formatAttackGraph(graph) }
      }
      if (action === "report") {
        const ledger = getOrCreateSecurityLedger(ctx.workdir)
        return { type: "text", content: formatSecurityReportFromLedger(ledger) }
      }
      if (action === "reset") {
        resetSecurityAssessmentLedger(ctx.workdir)
        return { type: "text", content: "Security assessment ledger reset." }
      }
      return { type: "error", message: "Usage: /security status|ledger|plan|scope list|scope add <target>|scope remove <target>|verify <finding-id|number>|graph|report|reset" }
    },
  },

  // ── /skills ───────────────────────────────────────────────────────────────
  {
    name:        "skills",
    aliases:     ["sk"],
    description: "List active skills for this project",
    handler: (_args, ctx): CommandResult => {
      if (!ctx.skills.length) return { type: "text", content: "No active skills for this project" }
      return { type: "text", content: `Active Skills (${ctx.skills.length}):\n` + ctx.skills.map((s) => `  ${s}`).join("\n") }
    },
  },

  // ── /theme ────────────────────────────────────────────────────────────────
  {
    name:        "theme",
    aliases:     ["t"],
    description: "Change the color theme",
    usage:       "/theme dracula",
    handler: (args, ctx): CommandResult => {
      if (args[0]) {
        const name = args[0].toLowerCase()
        if (!THEMES[name]) {
          return { type: "error", message: `Unknown theme: '${name}'. Available: ${THEME_NAMES.join(", ")}` }
        }
        ctx.setTheme(name)
        return { type: "text", content: `Theme changed: ${THEMES[name]!.name}` }
      }
      const items: PickerItem[] = THEME_NAMES.map((n) => ({
        id:    n,
        label: THEMES[n]!.name,
        ...(n === ctx.currentTheme ? { hint: "active" } : {}),
      }))
      return {
        type:  "picker",
        title: "Select theme",
        items,
        onSelect: (item) => ctx.setTheme(item.id),
      }
    },
  },

  // ── /palette ──────────────────────────────────────────────────────────────
  {
    name:        "palette",
    aliases:     ["palettes", "brand"],
    description: "Switch brand color palette (amber, oxblood, sapphire, emerald)",
    usage:       "/palette whiskey-amber",
    handler: (args, ctx): CommandResult => {
      if (args[0]) {
        const name = args[0].toLowerCase()
        const inBrand = (BRAND_PALETTE_IDS as readonly string[]).includes(name)
        if (!inBrand && !Object.prototype.hasOwnProperty.call(THEMES, name)) {
          return { type: "error", message: `Unknown palette: '${name}'. Brand palettes: ${BRAND_PALETTE_IDS.join(", ")}` }
        }
        ctx.setTheme(name)
        return { type: "text", content: `Palette changed: ${THEMES[name]!.name}` }
      }
      const brandItems: PickerItem[] = BRAND_PALETTE_IDS.map((id) => ({
        id:    id,
        label: THEMES[id]!.name,
        ...(id === ctx.currentTheme ? { hint: "active" } : {}),
      }))
      const legacyItems: PickerItem[] = THEME_NAMES
        .filter((n) => !isBrandTheme(n))
        .map((n) => ({
          id:    n,
          label: THEMES[n]!.name,
          ...(n === ctx.currentTheme ? { hint: "active" } : {}),
        }))
      const items: PickerItem[] = [...brandItems, ...legacyItems]
      return {
        type:  "picker",
        title: "Select palette",
        items,
        onSelect: (item) => ctx.setTheme(item.id),
      }
    },
  },

  // ── /commit ───────────────────────────────────────────────────────────────
  {
    name:        "commit",
    aliases:     ["gc"],
    description: "AI-assisted git commit — stages all changes and generates a commit message",
    handler: (_args, ctx): CommandResult => {
      // Send the coordinator a dedicated prompt — look at git diff, generate a commit message
      const prompt = `Run git status and git diff to see what changed, then create a conventional commit message and commit with: git(action:"commit", message:"<your message>"). Use format: type(scope): description`
      return {
        type:    "picker",
        title:   "Git Commit",
        items:   [
          { id: "ai",     label: "AI generates message",    hint: "AI reads diff and writes commit message" },
          { id: "cancel", label: "Cancel",                  hint: "" },
        ],
        onSelect: (item) => {
          if (item.id === "ai") {
            // Ask the agent via the BTW channel — without disrupting the conversation
            ctx.openBtw(prompt)
          }
        },
      }
    },
  },
]
