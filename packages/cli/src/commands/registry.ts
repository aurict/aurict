import { ProviderRegistry, SessionManager, mcpManager, loadCustomAgents, memoryStore, getAllSessionAgents, pinStore, setApiKey, setDefault, getConfigPath, loadConfig, exportToMarkdown, exportToHtml, defaultExportFilename, setCompaction, gateGuard, getCircuitState, getContextBreakdown, snapshotManager, installRemoteSkill, listInstalledSkills, uninstallSkill, getLoadedPlugins, PLUGIN_DIR } from "@omnicod/core"
import { writeFileSync } from "fs"
import { resolve } from "path"
import { THEMES, THEME_NAMES } from "../utils/theme.js"
import type { CommandDef, CommandResult, PickerItem } from "./types.js"

const commands: CommandDef[] = [
  // ── /help ─────────────────────────────────────────────────────────────────
  {
    name:        "help",
    aliases:     ["h", "?"],
    description: "List all available commands",
    handler: () => {
      const lines = commands.map(
        (c) => `  /${c.name.padEnd(14)} ${c.description}${c.usage ? `  (${c.usage})` : ""}`
      )
      return { type: "text", content: "OmniCod Commands:\n" + lines.join("\n") }
    },
  },

  // ── /models ───────────────────────────────────────────────────────────────
  {
    name:        "models",
    aliases:     ["m"],
    description: "List and select models for the current provider",
    handler: async (_args, ctx): Promise<CommandResult> => {
      const plugin = ProviderRegistry.get(ctx.provider)
      let models = plugin.listModels()
      if (plugin.listModelsRemote) {
        try {
          models = await plugin.listModelsRemote()
        } catch { /* remote başarısız → hardcoded fallback */ }
      }
      const items: PickerItem[] = models.map((m) => ({
        id:    m.id,
        label: m.name,
        hint:  [
          `${Math.round(m.contextWindow / 1000)}K ctx`,
          m.supportsTools    ? "tools"    : null,
          m.supportsThinking ? "thinking" : null,
        ].filter(Boolean).join(" · "),
      }))
      return {
        type:  "picker",
        title: `Select model  [${ctx.provider}]`,
        items,
        onSelect: (item) => {
          ctx.setModel(item.id)
          const modelInfo   = models.find((m) => m.id === item.id)
          const hasThinking = modelInfo?.supportsThinking
            ?? (item.id.includes("claude") && !item.id.includes("haiku"))

          // Built-in thinking modeller (DeepSeek-R1, QwQ): effort ayarlanamaz
          // buildThinkingOptions null döndürmesi = effort göndermiyoruz demek
          const plugin      = ProviderRegistry.get(ctx.provider)
          const isBuiltIn   = hasThinking && plugin.buildThinkingOptions(item.id, 4000) === null

          if (isBuiltIn) {
            // Thinking otomatik — effort picker gösterme, sadece bilgilendir
            ctx.setEffort(undefined)
            return
          }

          ctx.showPicker(
            hasThinking
              ? `Effort Level — ${item.label}`
              : `Effort Level — ${item.label}  (may not be supported)`,
            [
              { id: "0",     label: "Off",    hint: "No thinking (standard mode)" },
              { id: "4000",  label: "Low",    hint: "Light thinking · ~4K tokens" },
              { id: "10000", label: "Medium", hint: "Balanced thinking · ~10K tokens" },
              { id: "20000", label: "High",   hint: "Deep thinking · ~20K tokens" },
              { id: "32000", label: "Max",    hint: "Maximum thinking · 32K tokens" },
            ],
            (effortItem) => {
              const val = parseInt(effortItem.id)
              ctx.setEffort(val > 0 ? val : undefined)
            }
          )
        },
      }
    },
  },

  // ── /providers ────────────────────────────────────────────────────────────
  {
    name:        "providers",
    aliases:     ["ps", "provider"],
    description: "Select provider and configure API key",
    handler: (_args, ctx): CommandResult => {
      const all = ProviderRegistry.available()

      const items: PickerItem[] = all.map((p) => ({
        id:    p.id,
        label: p.name,
        hint:  [
          p.id === ctx.provider ? "● active" : null,
          p.hasKey ? "✓ key set" : "✗ no key",
        ].filter(Boolean).join("  "),
      }))

      const switchToProvider = (id: string) => {
        const plugin       = ProviderRegistry.get(id)
        const defaultModel = plugin.defaultModel()
        ctx.setProvider(id, defaultModel)

        // Ardından model picker aç
        ctx.showPicker(
          `Select model  [${id}]`,
          plugin.listModels().map((m) => ({
            id:   m.id,
            label: m.name,
            hint: `${Math.round(m.contextWindow / 1000)}K ctx`,
          })),
          (item) => ctx.setModel(item.id),
        )
      }

      return {
        type:  "picker",
        title: "Select Provider",
        items,
        onSelect: (item) => {
          const provider = all.find((p) => p.id === item.id)!

          // Ollama key gerektirmiyor — direkt geç
          if (item.id === "ollama" || provider.hasKey) {
            switchToProvider(item.id)
            return
          }

          // Key yok — önce key iste
          const KEY_LABELS: Record<string, string> = {
            anthropic:  "Anthropic API Key (sk-ant-...)",
            openai:     "OpenAI API Key (sk-...)",
            openrouter: "OpenRouter API Key (sk-or-...)",
            google:     "Google AI API Key",
            opencode:   "OpenCode API Key",
            xai:        "xAI API Key (xai-...)",
            azure:      "Azure OpenAI API Key  (set AZURE_OPENAI_ENDPOINT separately)",
            bedrock:    "AWS Access Key ID  (set AWS_SECRET_ACCESS_KEY + AWS_REGION separately)",
          }

          ctx.showPicker(
            `${provider.name} — No API key configured`,
            [
              { id: "enter", label: "Enter API key now",   hint: "Save to ~/.omnicod/config.json" },
              { id: "skip",  label: "Skip (set env var manually)", hint: `export ${item.id.toUpperCase()}_API_KEY=...` },
            ],
            (choice) => {
              if (choice.id === "skip") return
              // "prompt" result'ı doğrudan ctx üzerinden açamayız — showPrompt gerekiyor
              // Geçici çözüm: /config set komutu bilgisini system mesajı olarak ver
              ctx.showPrompt(
                KEY_LABELS[item.id] ?? `${provider.name} API Key`,
                "Paste your API key here",
                true,
                (key) => {
                  setApiKey(item.id, key)
                  switchToProvider(item.id)
                },
              )
            },
          )
        },
      }
    },
  },

  // ── /clear ────────────────────────────────────────────────────────────────
  {
    name:        "clear",
    aliases:     ["c"],
    description: "Clear chat history",
    handler: (): CommandResult => ({ type: "clear" }),
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
    aliases:     ["ss"],
    description: "Browse and restore sessions (interactive picker)",
    usage:       "/sessions [today|week|all]",
    handler: (args, ctx): CommandResult => {
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

  // ── /agents ───────────────────────────────────────────────────────────────
  {
    name:        "agents",
    aliases:     ["ag"],
    description: "List custom agents in .omnicod/agents/",
    handler: (_args, ctx): CommandResult => {
      const agents = loadCustomAgents(ctx.workdir)
      if (!agents.length) return { type: "text", content: "No custom agents (.omnicod/agents/ is empty)" }
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

  // ── /commit ───────────────────────────────────────────────────────────────
  {
    name:        "commit",
    aliases:     ["gc"],
    description: "AI-assisted git commit — stages all changes and generates a commit message",
    handler: (_args, ctx): CommandResult => {
      // Coordinator'a özel bir prompt gönder — git diff bak, commit mesajı üret
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
            // BTW kanalıyla agent'a sor — conversation'ı bozmadan
            ctx.openBtw(prompt)
          }
        },
      }
    },
  },

  // ── /background ───────────────────────────────────────────────────────────
  {
    name:        "background",
    aliases:     ["bg"],
    description: "Move current task to background or list background tasks",
    handler: (args, ctx): CommandResult => {
      // /bg <id> → belirli task çıktısını göster
      if (args[0] && args[0] !== "list") {
        ctx.showBgTask(args[0])
        return { type: "text", content: "" }
      }

      // /bg list veya /bg (argümansız + task yoksa)
      if (!ctx.bgTasks.length) {
        // Yükleme varsa arka plana al
        ctx.sendToBackground()
        return { type: "text", content: "Task sent to background." }
      }

      // Task listesi
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
    description: "Manage API keys and defaults (~/.omnicod/config.json)",
    usage:       "/config  |  /config set <provider> <apikey>  |  /config default provider <name>",
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

      // /config (argümansız) → mevcut durumu göster
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

      // /pins veya /pin (argümansız) → listele
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
    aliases:     ["?"],
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
    aliases:     ["agents", "a"],
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
    description: "Toggle autopilot mode — auto-approve all permission requests",
    handler: (_args, ctx): CommandResult => {
      ctx.toggleAutopilot()
      return { type: "text", content: "" }
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

  // ── /plugins ──────────────────────────────────────────────────────────────
  {
    name:        "plugins",
    aliases:     ["plugin"],
    description: "List loaded plugins from ~/.omnicod/plugins/",
    handler: (): CommandResult => {
      const loaded = getLoadedPlugins()
      if (loaded.length === 0) {
        return { type: "text", content: `No plugins loaded.\nDrop .js/.mjs files in: ${PLUGIN_DIR}` }
      }
      const lines = loaded.map((p) =>
        p.error
          ? `  ✗ ${p.file.padEnd(30)} ERROR: ${p.error}`
          : `  ✓ ${p.name.padEnd(28)} ${p.tools}t ${p.provs}p  (${p.file})`
      )
      return { type: "text", content: `Plugins (${loaded.length}):\n${lines.join("\n")}\n\nDir: ${PLUGIN_DIR}` }
    },
  },

  // ── /skill ────────────────────────────────────────────────────────────────
  {
    name:        "skill",
    aliases:     ["skills"],
    description: "Manage skills: add from URL/path, list, remove",
    usage:       "/skill add <url|path> | list | remove <id>",
    handler: async (args): Promise<CommandResult> => {
      const sub = args[0]?.toLowerCase()

      if (!sub || sub === "list") {
        const installed = listInstalledSkills()
        if (installed.length === 0) return { type: "text", content: "No user-installed skills. Use /skill add <url> to install one." }
        const lines = installed.map((s) => `  ${s.id.padEnd(24)} ${s.name}  (${s.source})`)
        return { type: "text", content: `Installed skills (${installed.length}):\n${lines.join("\n")}` }
      }

      if (sub === "add") {
        const url = args[1]
        if (!url) return { type: "error", message: "Usage: /skill add <url>" }
        try {
          const meta = await installRemoteSkill(url)
          return { type: "text", content: `Skill installed: ${meta.id} (${meta.name})\nRestart OmniCod to activate.` }
        } catch (e) {
          return { type: "error", message: `Install failed: ${e instanceof Error ? e.message : String(e)}` }
        }
      }

      if (sub === "remove" || sub === "rm") {
        const id = args[1]
        if (!id) return { type: "error", message: "Usage: /skill remove <id>" }
        const ok = uninstallSkill(id)
        return ok
          ? { type: "text", content: `Skill removed: ${id}` }
          : { type: "error", message: `Skill not found: ${id}` }
      }

      return { type: "error", message: "Usage: /skill add <url|path> | list | remove <id>" }
    },
  },

  // ── /worktree ─────────────────────────────────────────────────────────────
  {
    name:        "worktree",
    aliases:     ["wt"],
    description: "Manage git worktrees for parallel development",
    usage:       "/worktree enter <branch> | exit | list",
    handler: (args, ctx): CommandResult => {
      const sub = args[0]?.toLowerCase()
      if (!sub || sub === "list") {
        return { type: "text", content: "Usage:\n  /worktree list\n  /worktree enter <branch>\n  /worktree exit [remove]" }
      }
      if (sub === "enter") {
        const branch = args[1]
        if (!branch) return { type: "error", message: "Usage: /worktree enter <branch>" }
        const path = `${ctx.workdir}/.omnicod/worktrees/${branch}`
        ctx.setWorkdir(path)
        return { type: "text", content: `Worktree: ${path}\nBranch: ${branch}\n\nNote: run 'git worktree add' manually if the branch doesn't exist.` }
      }
      if (sub === "exit") {
        const parts = ctx.workdir.split("/.omnicod/worktrees/")
        if (parts.length < 2) return { type: "error", message: "Already in the main worktree" }
        ctx.setWorkdir(parts[0]!)
        return { type: "text", content: `Returned to main directory: ${parts[0]}` }
      }
      return { type: "error", message: `Unknown subcommand: ${sub}` }
    },
  },

  // ── /memory ───────────────────────────────────────────────────────────────
  {
    name:        "memory",
    aliases:     ["mem"],
    description: "Manage persistent memory across sessions",
    usage:       "/memory [add <text>|forget <id>|search <q>|clear|export]",
    handler: (args, ctx): CommandResult => {
      const sub = args[0]?.toLowerCase()

      // /memory → list
      if (!sub || sub === "list") {
        const all = memoryStore.list(ctx.workdir)
        if (!all.length) return { type: "text", content: "No memories stored yet.\nUse /memory add <text> or let the AI remember things automatically." }
        const lines = all.map((m) => {
          const date = new Date(m.timestamp).toISOString().slice(0, 10)
          const scope = m.scope === "global" ? "🌍" : "📁"
          return `  ${scope} [${m.id.slice(0, 8)}] [${m.category}] ${m.content}  (${date})`
        })
        return { type: "text", content: `Memories (${all.length}):\n\n${lines.join("\n")}` }
      }

      // /memory add <text>
      if (sub === "add") {
        const content = args.slice(1).join(" ").trim()
        if (!content) return { type: "error", message: "Usage: /memory add <text>" }
        const m = memoryStore.add({ content, category: "fact", scope: "project", project: ctx.workdir, source: "manual" })
        memoryStore.exportToFile(ctx.workdir)
        return { type: "text", content: `Remembered [${m.id.slice(0, 8)}]: ${content}` }
      }

      // /memory forget <id>
      if (sub === "forget") {
        const id = args[1]?.trim()
        if (!id) return { type: "error", message: "Usage: /memory forget <id>" }
        // partial ID match
        const all    = memoryStore.list(ctx.workdir)
        const target = all.find((m) => m.id.startsWith(id))
        if (!target) return { type: "error", message: `Memory not found: ${id}` }
        memoryStore.remove(target.id)
        memoryStore.exportToFile(ctx.workdir)
        return { type: "text", content: `Forgotten: ${target.content.slice(0, 60)}` }
      }

      // /memory search <q>
      if (sub === "search") {
        const q = args.slice(1).join(" ").trim()
        if (!q) return { type: "error", message: "Usage: /memory search <query>" }
        const results = memoryStore.search(q, ctx.workdir)
        if (!results.length) return { type: "text", content: `No memories matching: "${q}"` }
        const lines = results.map((m) => `  [${m.id.slice(0, 8)}] [${m.category}] ${m.content}`)
        return { type: "text", content: `Found ${results.length}:\n\n${lines.join("\n")}` }
      }

      // /memory clear
      if (sub === "clear") {
        const items: PickerItem[] = [
          { id: "project", label: "Clear project memories", hint: `${memoryStore.list(ctx.workdir).filter(m => m.scope === "project").length} entries` },
          { id: "global",  label: "Clear global memories",  hint: `${memoryStore.list().filter(m => m.scope === "global").length} entries` },
          { id: "all",     label: "Clear ALL memories" },
        ]
        return {
          type: "picker", title: "Clear memories",
          items,
          onSelect: (item) => {
            if (item.id === "all") {
              memoryStore.clear(undefined, ctx.workdir)
              memoryStore.clear("global")
            } else {
              memoryStore.clear(item.id as "project" | "global", item.id === "project" ? ctx.workdir : undefined)
            }
            memoryStore.exportToFile(ctx.workdir)
          },
        }
      }

      // /memory export
      if (sub === "export") {
        memoryStore.exportToFile(ctx.workdir)
        return { type: "text", content: `Exported to .omnicod/memory.md` }
      }

      return { type: "error", message: `Unknown subcommand: ${sub}. Try: list, add, forget, search, clear, export` }
    },
  },

  // ── /share ────────────────────────────────────────────────────────────────
  {
    name:        "share",
    description: "Export session as HTML and optionally upload to transfer.sh",
    usage:       "/share [local|upload]",
    handler: async (args, ctx): Promise<CommandResult> => {
      const html     = exportToHtml(ctx.messages, "OmniCod Session")
      const filename = defaultExportFilename("html")
      const filepath = resolve(ctx.workdir, filename)
      writeFileSync(filepath, html, "utf8")

      const sub = (args[0] ?? "").toLowerCase()

      if (sub === "local") {
        return { type: "text", content: `Saved: ${filepath}` }
      }

      if (sub === "upload") {
        try {
          const blob = new Blob([html], { type: "text/html" })
          const form = new FormData()
          form.append("file", blob, filename)
          const res = await fetch(`https://transfer.sh/${filename}`, {
            method:  "PUT",
            body:    html,
            headers: { "Content-Type": "text/html", "Max-Downloads": "10", "Max-Days": "7" },
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const url = (await res.text()).trim()
          return { type: "text", content: `Shared! URL (expires in 7 days):\n${url}` }
        } catch (e) {
          return { type: "error", message: `Upload failed: ${e instanceof Error ? e.message : String(e)}\nFile saved locally: ${filepath}` }
        }
      }

      // Default: ask
      return {
        type:  "picker",
        title: "Share session",
        items: [
          { id: "local",  label: "Save locally",       hint: filepath },
          { id: "upload", label: "Upload to transfer.sh", hint: "Generates a temporary URL (7 days)" },
        ],
        onSelect: async (item) => {
          if (item.id === "local") return
          try {
            const res = await fetch(`https://transfer.sh/${filename}`, {
              method:  "PUT",
              body:    html,
              headers: { "Content-Type": "text/html", "Max-Downloads": "10", "Max-Days": "7" },
            })
            const url = (await res.text()).trim()
            ctx.openBtw(`Session shared: ${url}`)
          } catch { ctx.openBtw(`Upload failed. File saved locally: ${filepath}`) }
        },
      }
    },
  },

  // ── /export ───────────────────────────────────────────────────────────────
  {
    name:        "export",
    aliases:     ["exp"],
    description: "Export current session to Markdown or HTML",
    usage:       "/export [md|html]",
    handler: (args, ctx): CommandResult => {
      const fmt = (args[0] ?? "").toLowerCase()

      const doExport = (format: "md" | "html") => {
        const filename = defaultExportFilename(format)
        const filepath = resolve(ctx.workdir, filename)
        const content  = format === "html"
          ? exportToHtml(ctx.messages, "OmniCod Session")
          : exportToMarkdown(ctx.messages, "OmniCod Session")
        writeFileSync(filepath, content, "utf8")
        return { type: "text" as const, content: `✓ Exported to ${filename}` }
      }

      if (fmt === "md" || fmt === "markdown") return doExport("md")
      if (fmt === "html")                      return doExport("html")

      // Format picker
      return {
        type:  "picker",
        title: "Export format",
        items: [
          { id: "md",   label: "Markdown (.md)",  hint: "Human-readable, works in any editor" },
          { id: "html", label: "HTML (.html)",     hint: "Self-contained, dark theme, collapsible tools" },
        ],
        onSelect: (item) => doExport(item.id as "md" | "html"),
      }
    },
  },

  // ── /watch ────────────────────────────────────────────────────────────────
  {
    name:        "watch",
    aliases:     ["w"],
    description: "Watch a file/dir and notify (or auto-run prompt) on change",
    usage:       '/watch <path> [prompt]',
    handler: (args, ctx): CommandResult => {
      if (!args[0]) return { type: "error", message: "Usage: /watch <path> [prompt on change]" }
      const [watchPath, ...rest] = args
      const prompt = rest.length > 0 ? rest.join(" ").replace(/^"|"$/g, "") : undefined
      ctx.addWatch(watchPath!, prompt)
      return { type: "text", content: "" }
    },
  },

  // ── /unwatch ──────────────────────────────────────────────────────────────
  {
    name:        "unwatch",
    aliases:     ["uw"],
    description: "Stop watching a path (omit path to stop all)",
    usage:       "/unwatch [path]",
    handler: (args, ctx): CommandResult => {
      ctx.removeWatch(args[0])
      return { type: "text", content: "" }
    },
  },

  // ── /undo ─────────────────────────────────────────────────────────────────
  {
    name:        "undo",
    aliases:     ["u"],
    description: "Rollback N steps (files + conversation)",
    usage:       "/undo [N]",
    handler: async (args, ctx): Promise<CommandResult> => {
      const n = Math.max(1, parseInt(args[0] ?? "1", 10) || 1)
      if (ctx.checkpoints.length === 0) return { type: "error", message: "No checkpoints available" }
      await ctx.popCheckpoints(n)
      return { type: "text", content: "" }
    },
  },

  // ── /checkpoints ─────────────────────────────────────────────────────────
  {
    name:        "checkpoints",
    aliases:     ["cp"],
    description: "List saved checkpoints",
    handler: (_args, ctx): CommandResult => {
      if (ctx.checkpoints.length === 0) return { type: "text", content: "No checkpoints yet" }
      const lines = ctx.checkpoints.map((c, i) =>
        `  ${i + 1}. ${c.label}  (${c.history.length} messages)`
      )
      return { type: "text", content: "Checkpoints:\n" + lines.join("\n") }
    },
  },

  // ── /fork ─────────────────────────────────────────────────────────────────
  {
    name:        "fork",
    description: "Fork current session — create a copy that continues independently",
    usage:       "/fork [label]",
    handler: (args, ctx): CommandResult => {
      const label = args.join(" ").trim() || `Fork of session ${ctx.sessionId.slice(0, 8)}`
      // Mevcut mesajları al (user+assistant rolleri)
      const history = ctx.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

      // Yeni session oluştur — mevcut session'u parentId olarak kaydet
      const forkId = SessionManager.create(
        { provider: ctx.provider, model: ctx.model },
        { title: label, parentId: ctx.sessionId }
      )

      // Mesajları fork session'ına kopyala
      for (const msg of history) {
        SessionManager.addPart({
          sessionId: forkId,
          role:      msg.role,
          type:      "text",
          content:   msg.content,
        })
      }

      return {
        type:    "text",
        content: `Fork created: ${forkId.slice(0, 12)}…  (${history.length} messages copied)\nUse /session ${forkId.slice(0, 8)} to restore it later.`,
      }
    },
  },

  // ── /branch ───────────────────────────────────────────────────────────────
  {
    name:        "branch",
    aliases:     ["br"],
    description: "Fork conversation or switch between branches",
    usage:       "/branch [name|list|switch <N>|delete <name>]",
    handler: (args, ctx): CommandResult => {
      const sub = args[0]?.toLowerCase()

      if (!sub || sub === "new") {
        ctx.createBranch(args[1])
        return { type: "text", content: "" }
      }

      if (sub === "list") {
        const lines = (ctx.branches as any[]).map((b: any, i: number) =>
          `  ${b.active ? "▶" : " "} ${i}. ${b.name}  (${b.messageCount} msgs)`
        )
        return { type: "text", content: "Branches:\n" + lines.join("\n") }
      }

      if (sub === "switch") {
        const idx = parseInt(args[1] ?? "", 10)
        if (isNaN(idx)) return { type: "error", message: "Usage: /branch switch <N>" }
        ctx.switchBranch(idx)
        return { type: "text", content: "" }
      }

      if (sub === "delete") {
        if (!args[1]) return { type: "error", message: "Usage: /branch delete <name>" }
        ctx.deleteBranch(args[1])
        return { type: "text", content: "" }
      }

      // /branch <name> → create with that name
      ctx.createBranch(sub)
      return { type: "text", content: "" }
    },
  },

  // ── /compact ──────────────────────────────────────────────────────────────
  {
    name:        "compact",
    aliases:     ["cmp"],
    description: "View or set compaction strategy",
    usage:       "/compact [tailturns <N> | strategy <aggressive|balanced|conservative>]",
    handler: (args, ctx): CommandResult => {
      const sub = args[0]?.toLowerCase()
      const cfg  = loadConfig(ctx.workdir).compaction

      if (!sub) {
        return {
          type:    "text",
          content: `Compaction settings:\n  tailTurns: ${cfg?.tailTurns ?? 2} (default: 2)\n  strategy:  ${cfg?.strategy ?? "balanced"}`,
        }
      }

      if (sub === "tailturns" || sub === "turns") {
        const n = parseInt(args[1] ?? "", 10)
        if (isNaN(n) || n < 1 || n > 10) return { type: "error", message: "tailTurns must be 1-10" }
        setCompaction({ tailTurns: n })
        return { type: "text", content: `✓ tailTurns set to ${n}` }
      }

      if (sub === "strategy") {
        const s = args[1]?.toLowerCase()
        if (s !== "aggressive" && s !== "balanced" && s !== "conservative") {
          return { type: "error", message: "strategy must be: aggressive | balanced | conservative" }
        }
        setCompaction({ strategy: s })
        return { type: "text", content: `✓ strategy set to ${s}` }
      }

      return { type: "error", message: `Unknown subcommand. Try: tailturns <N>, strategy <s>` }
    },
  },

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

      function fmtK(n: number) {
        if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
        return String(n)
      }

      return {
        type:    "text",
        content: [
          `── Context Memory ──────────────────────────`,
          `  Total:     ${fmtK(breakdown.total)} / ${fmtK(ctx.contextWindow)} tokens  (${pct}%)`,
          `  Messages:  ${ctx.messages.length}`,
          ``,
          `  By Role:`,
          roleLines,
          ``,
          `  Top 5 Expensive Messages:`,
          topLines,
          ``,
          `  Circuit Breaker: ${cbStatus}`,
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
        return { type: "text", content: "No checkpoints saved yet. Checkpoints are saved after each AI step." }
      }

      if (args.length === 0) {
        const lines = checkpoints.map((cp, i) => `  [${i}] ${cp.label}`)
        return { type: "text", content: "Checkpoints:\n" + lines.join("\n") + "\n\nUse /replay <N> to jump to checkpoint N." }
      }

      const idx = parseInt(args[0] ?? "", 10)
      if (isNaN(idx) || idx < 0 || idx >= checkpoints.length) {
        return { type: "error", message: `Invalid checkpoint index. Valid range: 0-${checkpoints.length - 1}` }
      }

      const cp = checkpoints[idx]!
      const restored = await snapshotManager.restoreToMark(cp.mark)
      ctx.replayTo(idx)

      return {
        type:    "text",
        content: `↩ Replayed to checkpoint ${idx}: "${cp.label}"${restored.length ? `\n   Files restored: ${restored.join(", ")}` : ""}`,
      }
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
    description: "Show OmniCod version",
    handler: (): CommandResult => ({ type: "text", content: "OmniCod v0.0.1" }),
  },

  // ── /exit ─────────────────────────────────────────────────────────────────
  {
    name:        "exit",
    aliases:     ["quit", "q"],
    description: "Exit OmniCod",
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
      const t = ctx.tokens ?? { input: 0, output: 0 }

      // Approximate pricing per 1M tokens (USD) — rough estimates, mid-2025
      const PRICING: Record<string, { input: number; output: number }> = {
        "claude-opus-4":      { input: 15,  output: 75  },
        "claude-sonnet-4":    { input: 3,   output: 15  },
        "claude-haiku-4":     { input: 0.8, output: 4   },
        "gpt-4o":             { input: 2.5, output: 10  },
        "gpt-4o-mini":        { input: 0.15,output: 0.6 },
        "gemini-1.5-pro":     { input: 1.25,output: 5   },
        "gemini-1.5-flash":   { input: 0.075,output:0.3 },
        "default":            { input: 3,   output: 15  },
      }

      const modelKey = Object.keys(PRICING).find(k => ctx.model.toLowerCase().includes(k.replace(/-/g,"").slice(0,8))) ?? "default"
      const price    = PRICING[modelKey]!
      const inputCost  = (t.input  / 1_000_000) * price.input
      const outputCost = (t.output / 1_000_000) * price.output
      const totalCost  = inputCost + outputCost

      const fmt = (n: number) => n < 0.001 ? "<$0.001" : `$${n.toFixed(3)}`

      const lines = [
        `Session token usage (${ctx.model}):`,
        ``,
        `  Input:   ${t.input.toLocaleString().padStart(10)} tokens   ${fmt(inputCost)}`,
        `  Output:  ${t.output.toLocaleString().padStart(10)} tokens   ${fmt(outputCost)}`,
        `  Total:   ${(t.input+t.output).toLocaleString().padStart(10)} tokens   ${fmt(totalCost)}`,
        ``,
        `  Pricing: $${price.input}/M input · $${price.output}/M output  (estimate)`,
      ]
      return { type: "text", content: lines.join("\n") }
    },
  },

  // ── /rewind ───────────────────────────────────────────────────────────────
  {
    name:        "rewind",
    aliases:     ["undo"],
    description: "Rewind conversation to Nth checkpoint",
    usage:       "/rewind [N]  — omit N to show checkpoint list",
    handler: (args, ctx): CommandResult => {
      const cps = ctx.checkpoints
      if (cps.length === 0) {
        return { type: "text", content: "No checkpoints yet. Checkpoints are created automatically after each agent step." }
      }

      if (!args[0]) {
        // Show picker
        const items = cps.map((cp, i) => ({
          id:    String(i),
          label: cp.label,
          hint:  `${(cp.messages as unknown[]).length} messages`,
        }))
        return {
          type: "picker",
          title: "Rewind to checkpoint",
          items,
          onSelect: (item) => ctx.replayTo(parseInt(item.id, 10)),
        }
      }

      const n = parseInt(args[0]!, 10)
      if (isNaN(n) || n < 1) return { type: "error", message: "Usage: /rewind [N]  (N = steps back, 1 = last)" }
      ctx.popCheckpoints(n)
      return { type: "text", content: `Rewound ${n} step${n > 1 ? "s" : ""}.` }
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

  // ── /stash ────────────────────────────────────────────────────────────────
  {
    name:        "stash",
    description: "Save/restore draft input",
    usage:       "/stash [push <text>|pop [n]|list|drop <n>]",
    handler: async (args, ctx): Promise<CommandResult> => {
      const { stashPush, stashList, stashPop, stashDrop } = await import("../stash.js")
      const sub = args[0]?.toLowerCase()

      if (!sub || sub === "list") {
        const entries = stashList()
        if (entries.length === 0) return { type: "text", content: "Stash is empty." }
        const lines = entries.map((e, i) => {
          const ts = new Date(e.createdAt).toLocaleString()
          return `  ${i}  ${e.name.padEnd(24)}  ${ts}\n     ${e.content.slice(0, 60).replace(/\n/g, " ")}…`
        })
        return { type: "text", content: `Stash (${entries.length}):\n${lines.join("\n")}` }
      }

      if (sub === "push") {
        const content = args.slice(1).join(" ")
        if (!content) return { type: "error", message: "Usage: /stash push <text>" }
        const entry = stashPush(content)
        return { type: "text", content: `Stashed as "${entry.name}"` }
      }

      if (sub === "pop") {
        const entry = stashPop(args[1])
        if (!entry) return { type: "error", message: "Stash is empty or index not found." }
        return { type: "text", content: `Popped: ${entry.content}` }
      }

      if (sub === "drop") {
        if (!args[1]) return { type: "error", message: "Usage: /stash drop <n>" }
        const ok = stashDrop(args[1])
        return ok
          ? { type: "text", content: `Stash entry ${args[1]} dropped.` }
          : { type: "error", message: `Entry ${args[1]} not found.` }
      }

      return { type: "error", message: `Unknown stash subcommand: ${sub}` }
    },
  },

  // ── /editor ───────────────────────────────────────────────────────────────
  {
    name:        "editor",
    aliases:     ["edit-input"],
    description: "Open $EDITOR to compose a message",
    handler: async (_args, _ctx): Promise<CommandResult> => {
      const { execSync } = await import("node:child_process")
      const { writeFileSync, readFileSync, unlinkSync } = await import("node:fs")
      const { join }    = await import("node:path")
      const { tmpdir }  = await import("node:os")

      const editor = process.env["EDITOR"] ?? process.env["VISUAL"] ?? "vi"
      const tmp    = join(tmpdir(), `omnicod-input-${Date.now()}.md`)
      writeFileSync(tmp, "", "utf8")

      try {
        execSync(`${editor} "${tmp}"`, { stdio: "inherit" })
        const content = readFileSync(tmp, "utf8").trim()
        unlinkSync(tmp)
        if (!content) return { type: "text", content: "Editor closed with no content." }
        return { type: "text", content: `Editor content ready:\n\n${content}` }
      } catch {
        try { unlinkSync(tmp) } catch { /* ignore */ }
        return { type: "error", message: "Editor exited with error or was cancelled." }
      }
    },
  },

  // ── /template ─────────────────────────────────────────────────────────────
  {
    name:        "template",
    description: "Save/use message templates",
    usage:       "/template list  |  /template <name>  |  /template save <name> <content>  |  /template delete <name>",
    handler: async (args): Promise<CommandResult> => {
      const { readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync } = await import("node:fs")
      const { join } = await import("node:path")
      const { homedir } = await import("node:os")

      const dir = join(homedir(), ".omnicod", "templates")
      mkdirSync(dir, { recursive: true })

      const sub = args[0]?.toLowerCase()

      if (!sub || sub === "list") {
        try {
          const files = readdirSync(dir).filter(f => f.endsWith(".txt"))
          if (files.length === 0) return { type: "text", content: "No templates saved. Use /template save <name> <content>" }
          const lines = files.map(f => {
            const name    = f.replace(".txt", "")
            const content = readFileSync(join(dir, f), "utf8").slice(0, 60).replace(/\n/g, " ")
            return `  ${name.padEnd(20)}  ${content}…`
          })
          return { type: "text", content: `Templates:\n${lines.join("\n")}` }
        } catch {
          return { type: "text", content: "No templates saved." }
        }
      }

      if (sub === "save") {
        const name    = args[1]
        const content = args.slice(2).join(" ").trim()
        if (!name || !content) return { type: "error", message: "Usage: /template save <name> <content>" }
        writeFileSync(join(dir, `${name}.txt`), content, "utf8")
        return { type: "text", content: `Template "${name}" saved.` }
      }

      if (sub === "delete" || sub === "rm") {
        const name = args[1]
        if (!name) return { type: "error", message: "Usage: /template delete <name>" }
        try { unlinkSync(join(dir, `${name}.txt`)) }
        catch { return { type: "error", message: `Template "${name}" not found.` } }
        return { type: "text", content: `Template "${name}" deleted.` }
      }

      // Use a template: /template <name>
      const name = sub
      try {
        const content = readFileSync(join(dir, `${name}.txt`), "utf8")
        return { type: "text", content: `Template "${name}":\n\n${content}` }
      } catch {
        return { type: "error", message: `Template "${name}" not found. Use /template list to see available templates.` }
      }
    },
  },

  // ── /design ───────────────────────────────────────────────────────────────
  {
    name:        "design",
    aliases:     ["d", "ui"],
    description: "Open design wizard — pick a brief, skill, and design system",
    handler: (_args, ctx): CommandResult => {
      ctx.openDesign()
      return { type: "text", content: "" }
    },
  },

  // ── /settings ─────────────────────────────────────────────────────────────
  {
    name:        "settings",
    aliases:     ["prefs", "preferences"],
    description: "Open settings panel (Ctrl+S)",
    handler: (): CommandResult => ({ type: "text", content: "Press Ctrl+S to open the settings panel." }),
  },

  // ── /crashes ──────────────────────────────────────────────────────────────
  {
    name:        "crashes",
    description: "View crash reports",
    usage:       "/crashes  |  /crashes clear",
    handler: async (args): Promise<CommandResult> => {
      const { listCrashReports, clearCrashReports } = await import("../util/draft.js")
      if (args[0] === "clear") {
        clearCrashReports()
        return { type: "text", content: "Crash reports cleared." }
      }
      const reports = listCrashReports()
      if (reports.length === 0) return { type: "text", content: "No crash reports found." }
      const lines = reports.map((r, i) => {
        const ts  = new Date(r.ts).toLocaleString()
        const ctx = r.context ? `  Context: ${r.context}` : ""
        return `${i + 1}. [${ts}] ${r.message}${ctx}`
      })
      return { type: "text", content: `Crash reports (${reports.length}):\n${lines.join("\n")}\n\nUse /crashes clear to delete.` }
    },
  },
]

// ── Lookup + execute ──────────────────────────────────────────────────────────

const byName = new Map<string, CommandDef>()
for (const cmd of commands) {
  byName.set(cmd.name, cmd)
  for (const alias of cmd.aliases ?? []) byName.set(alias, cmd)
}

export function parseSlashCommand(input: string): { cmd: string; args: string[] } | null {
  if (!input.startsWith("/")) return null
  const parts = input.slice(1).trim().split(/\s+/)
  const cmd   = parts[0]?.toLowerCase() ?? ""
  const args  = parts.slice(1)
  return { cmd, args }
}

export function getCommand(name: string): CommandDef | undefined {
  return byName.get(name)
}

export function allCommands(): CommandDef[] {
  return commands
}
