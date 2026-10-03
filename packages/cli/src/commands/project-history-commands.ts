import { SessionManager, defaultExportFilename, exportToHtml, exportToMarkdown, gateGuard, loadConfig, setCompaction } from "@aurict/core"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { join, resolve } from "path"
import type { CommandDef, CommandResult } from "./types.js"
import { runCompactNow } from "./command-helpers.js"

export const projectHistoryCommands: CommandDef[] = [
  // ── /share ────────────────────────────────────────────────────────────────
  {
    name:        "share",
    description: "Export session as HTML and optionally upload to transfer.sh",
    usage:       "/share [local|upload]",
    handler: async (args, ctx): Promise<CommandResult> => {
      const html     = exportToHtml(ctx.messages, "Aurict Session")
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
    usage:       "/export [md|html|clipboard]",
    handler: (args, ctx): CommandResult => {
      const fmt = (args[0] ?? "").toLowerCase()

      const doExport = (format: "md" | "html") => {
        const filename = defaultExportFilename(format)
        const filepath = resolve(ctx.workdir, filename)
        const content  = format === "html"
          ? exportToHtml(ctx.messages, "Aurict Session")
          : exportToMarkdown(ctx.messages, "Aurict Session")
        writeFileSync(filepath, content, "utf8")
        return { type: "text" as const, content: `✓ Exported to ${filename}` }
      }

      if (fmt === "md" || fmt === "markdown") return doExport("md")
      if (fmt === "html")                      return doExport("html")
      if (fmt === "clipboard" || fmt === "copy") {
        const content = exportToMarkdown(ctx.messages, "Aurict Session")
        ctx.copyText(content)
        return { type: "text", content: `✓ Complete transcript copied (${content.length.toLocaleString()} chars)` }
      }

      // Format picker
      return {
        type:  "picker",
        title: "Export format",
        items: [
          { id: "md",   label: "Markdown (.md)",  hint: "Human-readable, works in any editor" },
          { id: "html", label: "HTML (.html)",     hint: "Self-contained, dark theme, collapsible tools" },
          { id: "clipboard", label: "Clipboard", hint: "Copy complete Markdown transcript" },
        ],
        onSelect: (item) => item.id === "clipboard"
          ? ctx.copyText(exportToMarkdown(ctx.messages, "Aurict Session"))
          : doExport(item.id as "md" | "html"),
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
    description: "Undo the last N prompts: files the agent changed and the conversation",
    usage:       "/undo [N]",
    handler: async (args, ctx): Promise<CommandResult> => {
      const n = Math.max(1, parseInt(args[0] ?? "1", 10) || 1)
      if (ctx.checkpoints.length === 0) return { type: "error", message: "No checkpoints available" }
      await ctx.rewindTo(Math.max(0, ctx.checkpoints.length - n), true)
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
      const lines = ctx.checkpoints.map((c, i) => {
        const files = ctx.checkpointFiles(i).length
        return `  ${i + 1}. before "${c.label}"  ${new Date(c.createdAt).toTimeString().slice(0, 5)} · ${files} file${files === 1 ? "" : "s"} changed since`
      })
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
      // Get the current messages (user+assistant roles)
      const history = ctx.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

      // Create a new session — record the current session as parentId
      const forkId = SessionManager.create(
        { provider: ctx.provider, model: ctx.model },
        { title: label, parentId: ctx.sessionId }
      )

      // Copy the messages into the fork session
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
    description: "View or set compaction strategy, or compact now",
    usage:       "/compact [now | tailturns <N> | strategy <aggressive|balanced|conservative>]",
    handler: (args, ctx): CommandResult | Promise<CommandResult> => {
      const sub = args[0]?.toLowerCase()
      const cfg  = loadConfig(ctx.workdir).compaction

      if (!sub) {
        return {
          type:    "text",
          content: `Compaction settings:\n  tailTurns: ${cfg?.tailTurns ?? 2} (default: 2)\n  strategy:  ${cfg?.strategy ?? "balanced"}`,
        }
      }

      // /compact now — manuel compaction. Kalite düşürülmez: otomatik compaction'la
      // AYNI compact() router'ını ve gerçek core history'yi kullanır; cancel/timeout
      // (45s) desteklidir; sonucu restoreSession ile live history'e yazar.
      if (sub === "now") {
        return runCompactNow(ctx, cfg)
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

      return { type: "error", message: `Unknown subcommand. Try: now, tailturns <N>, strategy <s>` }
    },
  },
]
