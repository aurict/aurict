import { BRAND_PALETTE_IDS, THEMES, THEME_NAMES, isBrandTheme } from "../utils/theme.js"
import { SECURITY_SANDBOX_PROFILE_DEFAULTS, getAllSessionAgents, getConfigPath, loadConfig, pinStore, resolveLongTaskRuntimeConfig, resolveSecuritySandboxConfig, setApiKey, setCompaction, setDefault, setLongTaskRuntime, setSecuritySandbox } from "@aurict/core"
import type { CommandDef, CommandResult, PickerItem } from "./types.js"
import { longTaskConfigLines, pullSecurityImage, securityConfigLines } from "./command-helpers.js"
import { APPROVAL_MODES, parseApprovalMode } from "../tui/approval-mode.js"

export const configAgentCommands: CommandDef[] = [
  // ── /background ───────────────────────────────────────────────────────────
  {
    name:        "background",
    aliases:     ["bg"],
    description: "Run, inspect, or cancel an independent background task",
    usage:       "/bg run <prompt>  |  /bg [list]  |  /bg <id>  |  /bg cancel <id>",
    handler: (args, ctx): CommandResult => {
      if (args[0] === "run") {
        const prompt = args.slice(1).join(" ").trim()
        if (!prompt) return { type: "error", message: "Usage: /bg run <prompt>" }
        try {
          const id = ctx.startBackgroundTask(prompt)
          return { type: "text", content: `Background task ${id} started. Use /bg or /bg ${id} to inspect it.` }
        } catch (error) {
          return {
            type: "error",
            message: error instanceof Error ? error.message : String(error),
          }
        }
      }

      if (args[0] === "cancel") {
        const id = args[1]
        if (!id) return { type: "error", message: "Usage: /bg cancel <id>" }
        return ctx.cancelBackgroundTask(id)
          ? { type: "text", content: `Background task ${id} cancelled.` }
          : { type: "error", message: `No running background task with id ${id}.` }
      }

      // /bg <id> → show a specific task's output
      if (args[0] && args[0] !== "list") {
        ctx.showBgTask(args[0])
        return { type: "text", content: "" }
      }

      // /bg list or /bg
      if (!ctx.bgTasks.length) {
        return { type: "text", content: "No background tasks. Start one with /bg run <prompt>." }
      }

      // Task list
      const lines = ctx.bgTasks.map((t) => {
        const elapsed = Math.round((Date.now() - t.startedAt) / 1000)
        const icon    = t.status === "running" ? "⠹" : t.status === "done" ? "✓" : "✗"
        const short   = t.prompt.slice(0, 50)
        return `  ${icon} ${t.id}  ${short}  (${elapsed}s)`
      })
      return { type: "text", content: `Background tasks:\n${lines.join("\n")}\n\nUse /bg <id> to see output.` }
    },
  },


  // ── /config ───────────────────────────────────────────────────────────────
  {
    name:        "config",
    aliases:     ["cfg"],
    description: "Manage API keys and defaults (~/.aurict/config.json)",
    usage:       "/config  |  /config set <provider> <apikey>  |  /config default provider <name>  |  /config security status|off|passive|active-lite|allow <target>|rate <rpm>|concurrency <n>",
    handler: (args, ctx): CommandResult => {
      const sub = args[0]

      // /config set <provider> <key>
      if (sub === "set") {
        const provider = args[1]
        const key      = args[2]
        if (!provider || !key) return { type: "error", message: "Usage: /config set <provider> <apikey>" }
        setApiKey(provider, key)
        return { type: "text", content: `API key saved for ${provider} → ${getConfigPath()}` }
      }

      // /config default provider <name>  |  /config default model <name>
      if (sub === "default") {
        const field = args[1] as "provider" | "model" | undefined
        const value = args[2]
        if (!field || !value) return { type: "error", message: "Usage: /config default provider|model <value>" }
        setDefault(field, value)
        return { type: "text", content: `Default ${field} set to: ${value}` }
      }

      // /config security ...
      if (sub === "security") {
        const action = args[1] ?? "status"
        const cfg = loadConfig(ctx.workdir)
        const current = resolveSecuritySandboxConfig(cfg)
        const allowlist = current.targetAllowlist

        if (action === "status") {
          return { type: "text", content: securityConfigLines(cfg).join("\n") }
        }

        if (action === "off" || action === "disable") {
          setSecuritySandbox({ enabled: false, profile: "off" })
          return { type: "text", content: "Security sandbox disabled. Active security tools and skills are hidden from model context." }
        }

        if (action === "passive") {
          setSecuritySandbox(SECURITY_SANDBOX_PROFILE_DEFAULTS.passive)
          return { type: "text", content: "Security sandbox set to passive. Active scan tools remain hidden." }
        }

        if (action === "active-lite") {
          setSecuritySandbox({
            ...SECURITY_SANDBOX_PROFILE_DEFAULTS["active-lite"],
            image: current.profile === "active-lite" ? current.image : SECURITY_SANDBOX_PROFILE_DEFAULTS["active-lite"].image,
            network: current.profile === "active-lite" ? current.network : SECURITY_SANDBOX_PROFILE_DEFAULTS["active-lite"].network,
            targetAllowlist: allowlist,
          })
          return { type: "text", content: "Security sandbox set to active-lite. Add targets with /config security allow <target> before running scans." }
        }

        if (action === "kali-full") {
          setSecuritySandbox({
            ...SECURITY_SANDBOX_PROFILE_DEFAULTS["kali-full"],
            image: current.profile === "kali-full" ? current.image : SECURITY_SANDBOX_PROFILE_DEFAULTS["kali-full"].image,
            network: current.profile === "kali-full" ? current.network : SECURITY_SANDBOX_PROFILE_DEFAULTS["kali-full"].network,
            targetAllowlist: allowlist,
          })
          return { type: "text", content: "Security sandbox set to kali-full. Build/provide the image and allowlist targets before running scans." }
        }

        if (action === "allow") {
          const target = args[2]?.trim()
          if (!target) return { type: "error", message: "Usage: /config security allow <host-or-pattern>" }
          const next = Array.from(new Set([...allowlist, target])).sort()
          setSecuritySandbox({ targetAllowlist: next })
          return { type: "text", content: `Security target allowlist updated: ${next.join(", ")}` }
        }

        if (action === "deny" || action === "remove") {
          const target = args[2]?.trim()
          if (!target) return { type: "error", message: "Usage: /config security remove <host-or-pattern>" }
          const next = allowlist.filter(item => item !== target)
          setSecuritySandbox({ targetAllowlist: next })
          return { type: "text", content: next.length > 0 ? `Security target allowlist updated: ${next.join(", ")}` : "Security target allowlist is now empty." }
        }

        if (action === "image") {
          const image = args[2]?.trim()
          if (!image) return { type: "error", message: "Usage: /config security image <docker-image>" }
          setSecuritySandbox({ image })
          return { type: "text", content: `Security sandbox image set to: ${image}` }
        }

        if (action === "pull" || action === "install-image") {
          if (current.profile === "off" || current.profile === "passive") {
            return { type: "error", message: "Enable active-lite or kali-full before pulling a security image." }
          }
          return pullSecurityImage(current.image)
        }

        if (action === "network") {
          const network = args[2]
          if (network !== "none" && network !== "restricted" && network !== "host") {
            return { type: "error", message: "Usage: /config security network none|restricted|host" }
          }
          setSecuritySandbox({
            network,
            ...(network === "host" ? { requireApprovalFor: Array.from(new Set([...current.requireApprovalFor, "host-network"])) } : {}),
          })
          return { type: "text", content: `Security sandbox network set to: ${network}` }
        }

        if (action === "rate") {
          const rpm = Number(args[2])
          if (!Number.isFinite(rpm) || rpm < 1) return { type: "error", message: "Usage: /config security rate <requests-per-minute>" }
          setSecuritySandbox({ requestsPerMinute: Math.floor(rpm) })
          return { type: "text", content: `Security sandbox rate limit set to: ${Math.floor(rpm)}/min` }
        }

        if (action === "concurrency") {
          const maxConcurrent = Number(args[2])
          if (!Number.isFinite(maxConcurrent) || maxConcurrent < 1) return { type: "error", message: "Usage: /config security concurrency <max-concurrent-scans>" }
          setSecuritySandbox({ maxConcurrent: Math.floor(maxConcurrent) })
          return { type: "text", content: `Security sandbox concurrency set to: ${Math.floor(maxConcurrent)}` }
        }

        return {
          type: "error",
          message: "Usage: /config security status|off|passive|active-lite|kali-full|allow <target>|remove <target>|image <image>|pull|network none|restricted|host|rate <rpm>|concurrency <n>",
        }
      }

      // /config longtask off|shadow|soft|strict
      if (sub === "longtask" || sub === "long-task") {
        const mode = args[1] ?? "status"
        if (mode === "status") {
          return { type: "text", content: longTaskConfigLines(loadConfig(ctx.workdir)).join("\n") }
        }
        if (mode !== "off" && mode !== "shadow" && mode !== "soft" && mode !== "strict") {
          return { type: "error", message: "Usage: /config longtask status|off|shadow|soft|strict" }
        }
        setLongTaskRuntime({ enabled: mode !== "off", mode })
        return { type: "text", content: `Long task runtime set to ${mode}.` }
      }

      // /config (no args) → show the current state
      const cfg = loadConfig(ctx.workdir)
      const lines: string[] = [`Config: ${getConfigPath()}`, ""]
      lines.push("API Keys:")
      const providers = Object.entries(cfg.providers ?? {})
      if (!providers.length) {
        lines.push("  (none — use /config set <provider> <apikey>)")
      } else {
        for (const [p, v] of providers) {
          const masked = v.apiKey ? v.apiKey.slice(0, 8) + "…" : "(not set)"
          lines.push(`  ${p.padEnd(12)} ${masked}`)
        }
      }
      lines.push("")
      lines.push("Defaults:")
      const d = cfg.defaults ?? {}
      lines.push(`  provider: ${d.provider ?? "(not set)"}`)
      lines.push(`  model:    ${d.model    ?? "(not set)"}`)
      lines.push("")
      lines.push(...securityConfigLines(cfg))
      lines.push("")
      lines.push(...longTaskConfigLines(cfg))
      return { type: "text", content: lines.join("\n") }
    },
  },

  // ── /pin ──────────────────────────────────────────────────────────────────
  {
    name:        "pin",
    aliases:     ["pins"],
    description: "Manage pinned context — always injected into system prompt",
    usage:       "/pin <text>  |  /pin --global <text>  |  /pins  |  /pin remove <id>",
    handler: (args, ctx): CommandResult => {
      const sub = args[0]

      // /pins or /pin (no args) → list them
      if (!sub || sub === "list") {
        const list = pinStore.list(ctx.workdir)
        if (!list.length) return { type: "text", content: "No pins yet. Use /pin <text> to add one." }
        const lines = list.map((p) => {
          const scope = p.scope === "global" ? " [global]" : ""
          return `  ${p.id}  ${p.content}${scope}`
        })
        return { type: "text", content: `Pinned context (${list.length}):\n${lines.join("\n")}` }
      }

      // /pin remove <id>
      if (sub === "remove" || sub === "rm" || sub === "unpin") {
        const id = args[1]
        if (!id) return { type: "error", message: "Usage: /pin remove <id>" }
        const ok = pinStore.remove(id)
        return ok
          ? { type: "text", content: `Pin ${id} removed.` }
          : { type: "error", message: `Pin ${id} not found.` }
      }

      // /pin --global <text>
      const isGlobal = sub === "--global" || sub === "-g"
      const text     = isGlobal ? args.slice(1).join(" ") : args.join(" ")
      if (!text.trim()) return { type: "error", message: "Usage: /pin <text>" }

      const scope = isGlobal ? "global" : "project"
      const pin   = pinStore.add(text.trim(), scope, ctx.workdir)
      return { type: "text", content: `Pinned [${pin.id}]${scope === "global" ? " (global)" : ""}: ${pin.content}` }
    },
  },

  // ── /btw ──────────────────────────────────────────────────────────────────
  {
    name:        "btw",
    description: "Ask a side question without affecting the conversation",
    usage:       "/btw what does this function do?",
    handler: (args, ctx): CommandResult => {
      const question = args.join(" ").trim()
      if (!question) return { type: "error", message: "Usage: /btw <question>" }
      ctx.openBtw(question)
      return { type: "text", content: `BTW: "${question}"` }
    },
  },

  // ── /undercover ───────────────────────────────────────────────────────────
  {
    name:        "undercover",
    aliases:     ["uc"],
    description: "Toggle undercover mode (hides AI traces in public repos)",
    handler: (_args, ctx): CommandResult => {
      ctx.toggleUndercover()
      return {
        type:    "text",
        content: ctx.isUndercover
          ? "Undercover mode DISABLED — normal mode"
          : "Undercover mode ENABLED — AI traces hidden in commit messages",
      }
    },
  },

  // ── /agent ────────────────────────────────────────────────────────────────
  {
    name:        "agent",
    aliases:     ["a"],
    description: "Select the active session agent (Omni, Plan, Review, or custom)",
    handler: (_args, ctx): CommandResult => {
      const all   = getAllSessionAgents(ctx.workdir)
      const items: PickerItem[] = all.map((a) => ({
        id:    a.id,
        label: a.name,
        hint:  (a.id === ctx.activeAgent ? "● active  " : "") + a.description,
      }))
      return {
        type:     "picker",
        title:    "Select agent",
        items,
        onSelect: (item) => {
          ctx.setAgent(item.id)
        },
      }
    },
  },

  // ── /autopilot ────────────────────────────────────────────────────────────
  {
    name:        "autopilot",
    aliases:     ["auto"],
    description: "Toggle Project Auto for typed file changes in this project",
    handler: (_args, ctx): CommandResult => {
      ctx.toggleAutopilot()
      return { type: "text", content: "" }
    },
  },

  // ── /approvals ────────────────────────────────────────────────────────────
  {
    name:        "approvals",
    aliases:     ["permissions"],
    description: "Choose how tool calls are approved: ask, Project Auto, or full access",
    usage:       "/approvals [ask|auto|full]",
    handler: (args, ctx): CommandResult => {
      if (args[0]) {
        const mode = parseApprovalMode(args[0])
        if (!mode) return { type: "error", message: `Unknown approval mode: ${args[0]}. Use ask, auto, or full.` }
        ctx.setApprovalMode(mode)
        return { type: "text", content: "" }
      }
      return {
        type:  "picker",
        title: "Approval mode — dangerous operations always ask",
        items: APPROVAL_MODES.map((mode) => ({
          id:    mode.id,
          label: `${mode.id === ctx.approvalMode ? "● " : "  "}${mode.label}`,
          hint:  mode.description,
        })),
        onSelect: (item) => {
          const mode = parseApprovalMode(item.id)
          if (mode) ctx.setApprovalMode(mode)
        },
      }
    },
  },

  // ── /coordinator ──────────────────────────────────────────────────────────
  {
    name:        "coordinator",
    aliases:     ["coord"],
    description: "Toggle coordinator mode (multi-agent orchestration)",
    handler: (_args, ctx): CommandResult => {
      ctx.toggleCoordinator()
      return {
        type:    "text",
        content: ctx.coordinatorMode
          ? "Coordinator mode DISABLED"
          : "Coordinator mode ENABLED — AI uses plan + delegate workflow",
      }
    },
  },
]
