import { PLUGIN_DIR, fetchRegistry, findInRegistry, getLoadedPlugins, installRemotePlugin, installRemoteSkill, listInstalledPlugins, listInstalledSkills, memoryStore, searchRegistry, uninstallPlugin, uninstallSkill } from "@aurict/core"
import type { CommandDef, CommandResult, PickerItem } from "./types.js"
import { tildePath } from "./command-helpers.js"

export const extensionCommands: CommandDef[] = [
  // ── /plugin ───────────────────────────────────────────────────────────────
  {
    name:        "plugin",
    aliases:     ["plugins"],
    description: "Plugin & skill marketplace: search, install, remove",
    usage:       "/plugin list | search [query] | add <name|url> | remove <id> | update",
    handler: async (args): Promise<CommandResult> => {
      const sub = args[0]?.toLowerCase()

      // ── list ──
      if (!sub || sub === "list" || sub === "ls") {
        const loaded    = getLoadedPlugins()
        const installed = listInstalledPlugins()
        const skills    = listInstalledSkills()

        const lines: string[] = []

        if (loaded.length > 0) {
          lines.push("Active plugins (this session):")
          for (const p of loaded) {
            lines.push(p.error
              ? `  ✗ ${p.file.padEnd(28)} ERROR: ${p.error}`
              : `  ✓ ${p.name.padEnd(26)} ${p.tools}t ${p.provs}p`)
          }
          lines.push("")
        }

        if (installed.length > 0) {
          lines.push("Installed plugins (restart to activate):")
          for (const p of installed) {
            lines.push(`  • ${p.name.padEnd(26)} ${p.id}  (${p.source})`)
          }
          lines.push("")
        }

        if (skills.length > 0) {
          lines.push("Installed skills:")
          for (const s of skills) {
            lines.push(`  • ${s.name.padEnd(26)} ${s.id}  (${s.source})`)
          }
          lines.push("")
        }

        if (lines.length === 0) {
          return {
            type: "text",
            content: [
              "No plugins or skills installed.",
              "",
              "Browse the marketplace:  /plugin search",
              "Install by name:         /plugin add <name>",
              "Install from URL:        /plugin add <url>",
              `Plugin dir:              ${tildePath(PLUGIN_DIR)}`,
            ].join("\n"),
          }
        }

        lines.push(`Plugin dir: ${tildePath(PLUGIN_DIR)}`)
        return { type: "text", content: lines.join("\n") }
      }

      // ── search ──
      if (sub === "search" || sub === "find" || sub === "browse") {
        const query = args.slice(1).join(" ")
        let registry
        try {
          registry = await fetchRegistry()
        } catch (e) {
          return { type: "error", message: `Registry unreachable: ${e instanceof Error ? e.message : String(e)}\nYou can still install directly: /plugin add <url>` }
        }
        const results = searchRegistry(registry, query)
        if (results.length === 0) {
          return { type: "text", content: query ? `No results for "${query}".` : "Registry is empty." }
        }
        const lines = [
          query ? `Results for "${query}" (${results.length}):` : `Marketplace (${results.length} packages):`,
          "",
          ...results.map((e) =>
            `  [${e.type === "skill" ? "skill  " : "plugin "}] ${e.name.padEnd(24)} ${e.description}\n` +
            `             /plugin add ${e.id}`
          ),
          "",
          `Registry updated: ${registry.updatedAt}`,
        ]
        return { type: "text", content: lines.join("\n") }
      }

      // ── add / install ──
      if (sub === "add" || sub === "install") {
        const target = args[1]
        if (!target) return { type: "error", message: "Usage: /plugin add <name|url>" }

        const isUrl = target.startsWith("http://") || target.startsWith("https://")

        if (isUrl) {
          // Direct URL install — detect skill vs plugin by extension
          const isSkill = target.endsWith(".md")
          try {
            if (isSkill) {
              const meta = await installRemoteSkill(target)
              return { type: "text", content: `Skill installed: ${meta.id} (${meta.name})\nRestart Aurict to activate.` }
            } else {
              const meta = await installRemotePlugin(target)
              return { type: "text", content: `Plugin installed: ${meta.id}\nRestart Aurict to activate.\nDir: ${PLUGIN_DIR}` }
            }
          } catch (e) {
            return { type: "error", message: `Install failed: ${e instanceof Error ? e.message : String(e)}` }
          }
        }

        // Name-based install — look up registry
        let registry
        try {
          registry = await fetchRegistry()
        } catch (e) {
          return { type: "error", message: `Registry unreachable: ${e instanceof Error ? e.message : String(e)}\nInstall directly with a URL: /plugin add <url>` }
        }

        const entry = findInRegistry(registry, target)
        if (!entry) {
          return { type: "error", message: `"${target}" not found in registry.\nTry /plugin search ${target}\nOr install directly: /plugin add <url>` }
        }

        try {
          if (entry.type === "skill") {
            const meta = await installRemoteSkill(entry.url)
            return { type: "text", content: `Skill installed: ${meta.id} (${meta.name})\nRestart Aurict to activate.` }
          } else {
            const meta = await installRemotePlugin(entry.url, entry.name, entry.sha256)
            return { type: "text", content: `Plugin installed: ${meta.id} (${meta.name})\nRestart Aurict to activate.\nDir: ${PLUGIN_DIR}` }
          }
        } catch (e) {
          return { type: "error", message: `Install failed: ${e instanceof Error ? e.message : String(e)}` }
        }
      }

      // ── remove / uninstall ──
      if (sub === "remove" || sub === "rm" || sub === "uninstall") {
        const id = args[1]
        if (!id) return { type: "error", message: "Usage: /plugin remove <id>" }

        const pluginOk = uninstallPlugin(id)
        if (pluginOk) return { type: "text", content: `Plugin removed: ${id}\nRestart Aurict to deactivate.` }

        const skillOk = uninstallSkill(id)
        if (skillOk) return { type: "text", content: `Skill removed: ${id}` }

        return { type: "error", message: `Not found: ${id}\nRun /plugin list to see installed packages.` }
      }

      // ── update (refresh registry cache) ──
      if (sub === "update" || sub === "refresh") {
        try {
          const registry = await fetchRegistry(true)
          return { type: "text", content: `Registry updated: ${registry.entries.length} packages available.\nUpdated at: ${registry.updatedAt}` }
        } catch (e) {
          return { type: "error", message: `Registry update failed: ${e instanceof Error ? e.message : String(e)}` }
        }
      }

      return {
        type: "error",
        message: "Usage: /plugin list | search [query] | add <name|url> | remove <id> | update",
      }
    },
  },


  // ── /skill ────────────────────────────────────────────────────────────────
  {
    name:        "skill",
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
          return { type: "text", content: `Skill installed: ${meta.id} (${meta.name})\nRestart Aurict to activate.` }
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
        const path = `${ctx.workdir}/.aurict/worktrees/${branch}`
        ctx.setWorkdir(path)
        return { type: "text", content: `Worktree: ${path}\nBranch: ${branch}\n\nNote: run 'git worktree add' manually if the branch doesn't exist.` }
      }
      if (sub === "exit") {
        const parts = ctx.workdir.split("/.aurict/worktrees/")
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
        return { type: "text", content: `Exported to .aurict/memory.md` }
      }

      return { type: "error", message: `Unknown subcommand: ${sub}. Try: list, add, forget, search, clear, export` }
    },
  },
]
