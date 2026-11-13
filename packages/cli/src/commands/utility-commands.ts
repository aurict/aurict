import { diagnosticsStore, skillScoreStore } from "@aurict/core"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import type { CommandDef, CommandResult } from "./types.js"

export const utilityCommands: CommandDef[] = [
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
      const tmp    = join(tmpdir(), `aurict-input-${Date.now()}.md`)
      writeFileSync(tmp, "", "utf8")

      try {
        execSync(`${editor} "${tmp}"`, { stdio: "inherit" })
        const content = readFileSync(tmp, "utf8").trim()
        unlinkSync(tmp)
        if (!content) return { type: "text", content: "Editor closed with no content." }
        return { type: "text", content: `Editor content ready:\n\n${content}` }
      } catch (error) {
        let cleanupError: unknown
        try { unlinkSync(tmp) } catch (caught) { cleanupError = caught }
        const detail = error instanceof Error ? error.message : String(error)
        const cleanup = cleanupError === undefined ? "" : ` Temporary-file cleanup also failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`
        return { type: "error", message: `Editor exited with error or was cancelled: ${detail}.${cleanup}` }
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

      const dir = join(homedir(), ".aurict", "templates")
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
    usage:       "/design [brief]",
    handler: (args, ctx): CommandResult => {
      const brief = args.join(" ").trim()
      ctx.openDesign(brief || undefined)
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
    name:        "adr",
    description: "Manage architecture decision records in .aurict/decisions/",
    usage:       "/adr  |  /adr new <title>  |  /adr list",
    handler: async (args, ctx): Promise<CommandResult> => {
      const workdir    = ctx.workdir
      const decisionsDir = join(workdir, ".aurict", "decisions")
      const sub        = args[0]?.toLowerCase()

      if (sub === "new") {
        const titleWords = args.slice(1)
        if (titleWords.length === 0) {
          return { type: "text", content: "Usage: /adr new <title>\nExample: /adr new Use Bun instead of Node.js" }
        }
        const title = titleWords.join(" ")

        mkdirSync(decisionsDir, { recursive: true })
        const files   = existsSync(decisionsDir)
          ? (await import("fs")).readdirSync(decisionsDir).filter((f: string) => f.endsWith(".md"))
          : []
        const num     = String(files.length + 1).padStart(3, "0")
        const slug    = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        const filename = `${num}-${slug}.md`
        const template = [
          `# ADR-${num}: ${title}`,
          "",
          `**Problem:** `,
          `**Karar:** `,
          `**Neden:** `,
          `**Trade-off:** `,
          `**Durum:** active`,
        ].join("\n")

        writeFileSync(join(decisionsDir, filename), template, "utf8")
        return { type: "text", content: `Created .aurict/decisions/${filename}\n\nEdit the file to fill in the details.` }
      }

      // list (default)
      if (!existsSync(decisionsDir)) {
        return { type: "text", content: "No decisions yet. Create one with: /adr new <title>" }
      }
      const { readdirSync, readFileSync } = await import("fs")
      const files = readdirSync(decisionsDir).filter((f: string) => f.endsWith(".md")).sort()
      if (files.length === 0) {
        return { type: "text", content: "No decisions yet. Create one with: /adr new <title>" }
      }

      const lines = files.map((f: string) => {
        try {
          const content = readFileSync(join(decisionsDir, f), "utf8")
          const titleMatch  = content.match(/^# (.+)$/m)
          const statusMatch = content.match(/^\*\*Durum:\*\*\s*(.+)$/m)
          const title  = titleMatch?.[1]  ?? f
          const status = statusMatch?.[1]?.trim() ?? "active"
          const marker = status === "active" ? "✓" : status === "deprecated" ? "✗" : "~"
          return `  ${marker} ${f.replace(/\.md$/, "")} — ${title}`
        } catch { return `  ? ${f}` }
      })

      return { type: "text", content: `Architecture Decisions (${files.length}):\n\n${lines.join("\n")}\n\n/adr new <title> — create a new decision` }
    },
  },

  {
    name:        "diag",
    aliases:     ["diagnostics"],
    description: "View and resolve project diagnostics (.aurict/diagnostics/)",
    usage:       "/diag  |  /diag resolve <id>  |  /diag clear",
    handler: async (args, ctx): Promise<CommandResult> => {
      const workdir = ctx.workdir
      const sub     = args[0]?.toLowerCase()

      if (sub === "resolve") {
        const id = args[1]
        if (!id) return { type: "text", content: "Usage: /diag resolve <id>" }
        const resolution = args.slice(2).join(" ") || undefined
        const ok = diagnosticsStore.resolve(workdir, id, resolution)
        return ok
          ? { type: "text", content: `Marked [${id}] as resolved.${resolution ? ` Resolution: ${resolution}` : ""}` }
          : { type: "text", content: `No entry found matching id: ${id}` }
      }

      if (sub === "clear") {
        const all = diagnosticsStore.list(workdir)
        all.forEach(e => diagnosticsStore.resolve(workdir, e.id, "bulk clear"))
        return { type: "text", content: `Cleared ${all.length} diagnostics entries.` }
      }

      // list (default)
      const unresolved = diagnosticsStore.getUnresolved(workdir, 20)
      if (unresolved.length === 0) {
        return { type: "text", content: "No unresolved diagnostics. Project is clean." }
      }

      const lines = unresolved.map((e) => {
        const date = new Date(e.ts).toISOString().slice(0, 16).replace("T", " ")
        const tool = e.tool ? `[${e.tool}] ` : ""
        return `  [${e.id.slice(0, 8)}] ${date}  ${tool}${e.error.slice(0, 100)}`
      })

      return {
        type: "text",
        content: `Unresolved diagnostics (${unresolved.length}):\n\n${lines.join("\n")}\n\n/diag resolve <id> [resolution note]\n/diag clear — mark all resolved`,
      }
    },
  },

  {
    name:        "skill-scores",
    aliases:     ["skillscores"],
    description: "Show per-project skill effectiveness scores and priority boosts",
    usage:       "/skill-scores  |  /skill-scores reset",
    handler: async (args, ctx): Promise<CommandResult> => {
      const workdir = ctx.workdir ?? process.cwd()
      if (args[0] === "reset") {
        const { join } = await import("node:path")
        const { existsSync, unlinkSync } = await import("node:fs")
        const path = join(workdir, ".aurict", "skill-scores.json")
        if (existsSync(path)) { unlinkSync(path); return { type: "text", content: "Skill scores reset." } }
        return { type: "text", content: "No skill scores file found." }
      }
      const scores = skillScoreStore.getAll(workdir)
      const entries = Object.entries(scores).sort((a, b) => b[1].injectCount - a[1].injectCount)
      if (entries.length === 0) return { type: "text", content: "No skill usage data yet for this project." }
      const lines = entries.map(([id, s]) => {
        const boost = s.boost > 0 ? ` +${s.boost}` : s.boost < 0 ? ` ${s.boost}` : ""
        return `${id.padEnd(32)} injects:${s.injectCount}  success:${s.successCount}  rate:${(s.successRate * 100).toFixed(0)}%  boost:${boost || "0"}`
      })
      return { type: "text", content: `Skill scores (${entries.length} skills):\n\n${lines.join("\n")}\n\n/skill-scores reset — clear all scores` }
    },
  },

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

  // ── /remote ──────────────────────────────────────────────────────────────
  // Account sign-in (browser-based device login) + device identity (Ed25519) +
  // WebRTC session (start/stop — the actual agent bridge is brought up in App.tsx).
  {
    name:        "remote",
    description: "Sign in and connect a phone for mobile remote control (real WebRTC session)",
    usage:       "/remote login | status | device | pair [id code] | unpair <id> | start | stop | logout",
    handler: async (args, ctx): Promise<CommandResult> => {
      const sub = (args[0] ?? "status").toLowerCase()
      const remote   = await import("../remote/auth.js")
      const identity = await import("../remote/identity.js")

      const describeDevice = (id: { verified: boolean; signingKeyFingerprint: string } | null): string => {
        if (!id) return "Device: not registered yet — run /remote device to register."
        return `Device: ${id.verified ? "verified" : "registered (unverified)"} — ${id.signingKeyFingerprint}`
      }

      if (sub === "login") {
        const announced = new Set<string>()
        try {
          const user = await remote.loginWithBrowser((event) => {
            // "polling" repeats roughly every ~5s — to avoid cluttering the
            // transcript, only print phases (starting/waiting) the first time they're seen.
            if (event.phase === "polling" || announced.has(event.phase)) return
            announced.add(event.phase)
            if (event.phase === "waiting") ctx.addSystemMsg(`🔗 ${event.message}`)
          })
          let deviceLine: string
          try {
            const dev = await identity.ensureDeviceIdentity()
            deviceLine = describeDevice(dev)
          } catch (err) {
            deviceLine = `⚠ Device registration failed: ${err instanceof Error ? err.message : String(err)} (run /remote device to retry)`
          }
          return { type: "text", content: `✓ Signed in as ${user.email}.\n${deviceLine}` }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          return { type: "error", message: `Remote login failed: ${message}` }
        }
      }

      if (sub === "device") {
        try {
          const dev = await identity.ensureDeviceIdentity()
          return { type: "text", content: describeDevice(dev) }
        } catch (err) {
          return { type: "error", message: `Device registration failed: ${err instanceof Error ? err.message : String(err)}` }
        }
      }

      // Pairing decides which phones may control this machine, so it only happens here,
      // on the desktop, and needs the phone's safety code typed back as confirmation.
      if (sub === "pair") {
        const peers = await import("../remote/peer-trust.js")
        try {
          const status = await remote.getAuthStatus()
          if (!status.signedIn) return { type: "error", message: "Not signed in. Run /remote login first." }
          const phones = await peers.listAccountPhones()
          const pairedIds = new Set(peers.listPairedPhones().map((p) => p.deviceId))
          const [, id, code] = args
          if (!id) {
            const candidates = phones.filter((p) => !pairedIds.has(p.id))
            if (candidates.length === 0) {
              return { type: "text", content: "No unpaired phone on this account. Sign in on the Aurict mobile app first, then run /remote pair again." }
            }
            const lines = candidates.map((p) => `  ${p.id}  ${p.name}  safety code ${peers.safetyCode(p.signingKeyFingerprint)}  (registered ${new Date(p.createdAt).toLocaleString()})`)
            return {
              type: "text",
              content: `Phones on your account that are not paired with this desktop:\n${lines.join("\n")}\n\n` +
                "Only pair a phone you recognise and registered yourself; a paired phone can send prompts and approve tool permissions here.\n" +
                "Check that the safety code matches the one shown in the phone's Remote screen, then confirm with:\n  /remote pair <id> <safety code>",
            }
          }
          const phone = phones.find((p) => p.id === id)
          if (!phone) return { type: "error", message: `No verified phone with id ${id} on this account. Run /remote pair to list phones.` }
          const expected = peers.safetyCode(phone.signingKeyFingerprint)
          if (!code || code.toUpperCase() !== expected) {
            return { type: "error", message: `Safety code does not match. To pair ${phone.name}, type its safety code: /remote pair ${phone.id} <safety code>` }
          }
          const paired = await peers.pairPhone(phone.id)
          return { type: "text", content: `✓ Paired ${paired.name} (${expected}). It can now accept remote sessions from this desktop. Remove it with /remote unpair ${paired.deviceId}.` }
        } catch (err) {
          return { type: "error", message: `Pairing failed: ${err instanceof Error ? err.message : String(err)}` }
        }
      }

      if (sub === "unpair") {
        const peers = await import("../remote/peer-trust.js")
        const id = args[1]
        if (!id) {
          const paired = peers.listPairedPhones()
          if (paired.length === 0) return { type: "text", content: "No paired phones." }
          return { type: "text", content: `Paired phones:\n${paired.map((p) => `  ${p.deviceId}  ${p.name}  ${peers.safetyCode(p.fingerprint)}`).join("\n")}\n\nRemove one with /remote unpair <id>.` }
        }
        if (ctx.remoteConnected) ctx.stopRemoteSession()
        const removed = await peers.unpairPhone(id)
        return removed
          ? { type: "text", content: `Unpaired ${id}. It can no longer control this desktop.` }
          : { type: "error", message: `${id} is not paired with this desktop.` }
      }

      if (sub === "logout") {
        if (ctx.remoteConnected) ctx.stopRemoteSession()
        await remote.logout()
        return { type: "text", content: "Signed out of Aurict remote." }
      }

      if (sub === "start") {
        if (ctx.remoteConnected) return { type: "text", content: "Remote session is already connected." }
        const status = await remote.getAuthStatus()
        if (!status.signedIn) {
          return { type: "error", message: "Not signed in. Run /remote login first." }
        }
        ctx.startRemoteSession()
        return { type: "text", content: "🔗 Starting remote session — waiting for a phone to accept…" }
      }

      if (sub === "stop") {
        if (!ctx.remoteConnected) return { type: "text", content: "No active remote session." }
        ctx.stopRemoteSession()
        return { type: "text", content: "Remote session stopped." }
      }

      if (sub === "status") {
        const status = await remote.getAuthStatus()
        if (!status.signedIn) {
          return { type: "text", content: "Not signed in. Run /remote login to authorize this CLI from your browser or phone." }
        }
        const dev = identity.readDeviceIdentity()
        const connLine = ctx.remoteConnected ? "Session: ● connected — phone can control this session" : "Session: not connected. Run /remote start."
        return {
          type: "text",
          content: `Signed in as ${status.email}.\n${describeDevice(dev)}\n${connLine}`,
        }
      }

      return { type: "error", message: `Unknown /remote subcommand: ${sub}. Use login, status, device, pair, unpair, start, stop, or logout.` }
    },
  },
]
