import type { PermissionAction, PermissionRule } from "./types.js"

// Varsayılan kurallar — config ile override edilebilir
const DEFAULT_RULES: PermissionRule[] = [
  // ── Destructive bash commands ─────────────────────────────────────────────
  { tool: "bash", pattern: "sudo *",      action: "deny",   scope: "global" },
  { tool: "bash", pattern: "rm -rf *",    action: "ask",    scope: "global" },
  { tool: "bash", pattern: "rm *",        action: "ask",    scope: "global" },
  { tool: "bash", pattern: "curl *",      action: "ask",    scope: "global" },
  { tool: "bash", pattern: "wget *",      action: "ask",    scope: "global" },

  // ── Sensitive write/edit paths ────────────────────────────────────────────
  { tool: "write", pattern: "/etc/*",     action: "deny",   scope: "global" },
  { tool: "write", pattern: "/usr/*",     action: "deny",   scope: "global" },
  { tool: "write", pattern: "/sys/*",     action: "deny",   scope: "global" },
  { tool: "write", pattern: "/boot/*",    action: "deny",   scope: "global" },
  { tool: "write", pattern: "/dev/*",     action: "deny",   scope: "global" },
  { tool: "write", pattern: "/proc/*",    action: "deny",   scope: "global" },
  { tool: "write", pattern: "/root/*",    action: "deny",   scope: "global" },
  { tool: "edit",  pattern: "/etc/*",     action: "deny",   scope: "global" },
  { tool: "edit",  pattern: "/usr/*",     action: "deny",   scope: "global" },
  { tool: "edit",  pattern: "/sys/*",     action: "deny",   scope: "global" },
  { tool: "edit",  pattern: "/boot/*",    action: "deny",   scope: "global" },
  { tool: "edit",  pattern: "/dev/*",     action: "deny",   scope: "global" },
  { tool: "edit",  pattern: "/proc/*",    action: "deny",   scope: "global" },
  { tool: "edit",  pattern: "/root/*",    action: "deny",   scope: "global" },

  // ── Bash: privilege escalation ve disk yıkımı ────────────────────────────
  { tool: "bash", pattern: "pkexec *",    action: "deny",   scope: "global" },
  { tool: "bash", pattern: "pkexec",      action: "deny",   scope: "global" },
  { tool: "bash", pattern: "mkfs*",       action: "deny",   scope: "global" },
  { tool: "bash", pattern: "fdisk *",     action: "deny",   scope: "global" },
  { tool: "bash", pattern: "shred *",     action: "ask",    scope: "global" },
  { tool: "bash", pattern: "wipe *",      action: "ask",    scope: "global" },

  // ── Always-safe read-only / utility tools ────────────────────────────────
  { tool: "read",        pattern: "*", action: "allow", scope: "global" },
  { tool: "glob",        pattern: "*", action: "allow", scope: "global" },
  { tool: "grep",        pattern: "*", action: "allow", scope: "global" },
  { tool: "websearch",   pattern: "*", action: "allow", scope: "global" },
  { tool: "webfetch",    pattern: "*", action: "allow", scope: "global" },
  { tool: "lsp",         pattern: "*", action: "allow", scope: "global" },
  { tool: "symbols",     pattern: "*", action: "allow", scope: "global" },
  { tool: "code_map",    pattern: "*", action: "allow", scope: "global" },
  { tool: "load_skill",  pattern: "*", action: "allow", scope: "global" },
  { tool: "http_request", pattern: "*", action: "allow", scope: "global" },
  { tool: "jwt_decode",  pattern: "*", action: "allow", scope: "global" },
  { tool: "regex_test",  pattern: "*", action: "allow", scope: "global" },
  { tool: "jq",          pattern: "*", action: "allow", scope: "global" },
  { tool: "pptx",        pattern: "*", action: "allow", scope: "global" },
  { tool: "render_pdf",  pattern: "*", action: "allow", scope: "global" },
  { tool: "chart",       pattern: "*", action: "allow", scope: "global" },
  { tool: "mermaid",     pattern: "*", action: "allow", scope: "global" },

  // ── Agent / coordination tools (no destructive side-effects) ─────────────
  { tool: "subagent",       pattern: "*", action: "allow", scope: "global" },
  { tool: "send_message",   pattern: "*", action: "allow", scope: "global" },
  { tool: "task",           pattern: "*", action: "allow", scope: "global" },
  { tool: "task_create",    pattern: "*", action: "allow", scope: "global" },
  { tool: "task_update",    pattern: "*", action: "allow", scope: "global" },
  { tool: "task_complete",  pattern: "*", action: "allow", scope: "global" },

  // ── Utility tools ─────────────────────────────────────────────────────────
  { tool: "memory",     pattern: "*", action: "allow", scope: "global" },
  { tool: "todo",       pattern: "*", action: "allow", scope: "global" },
  { tool: "question",   pattern: "*", action: "allow", scope: "global" },
  { tool: "scratchpad", pattern: "*", action: "allow", scope: "global" },
  { tool: "verify",     pattern: "*", action: "allow", scope: "global" },
  { tool: "critique",   pattern: "*", action: "allow", scope: "global" },
  { tool: "security_report", pattern: "*", action: "allow", scope: "global" },
  { tool: "security_recon",  pattern: "*", action: "ask",   scope: "global" },
  { tool: "security_scan",   pattern: "*", action: "ask",   scope: "global" },
]

const rules: PermissionRule[] = [...DEFAULT_RULES]

function matchWildcard(pattern: string, value: string): boolean {
  if (pattern === "*") return true
  if (!pattern.includes("*")) return pattern === value
  const re = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$")
  return re.test(value)
}

export const PermissionEvaluator = {
  evaluate(tool: string, pattern: string): PermissionAction {
    const normalizedTool = tool === "shell" ? "bash" : tool
    const acceptedTools = normalizedTool === "bash" ? new Set(["bash", "shell"]) : new Set([normalizedTool])
    // En spesifik eşleşen kuralı bul (önce project/session, sonra global)
    const matches = rules.filter(
      (r) => (acceptedTools.has(r.tool) || r.tool === "*") && matchWildcard(r.pattern, pattern),
    )
    if (matches.length === 0) return "ask"
    // Son eşleşen kural kazanır (en altta olan en spesifik)
    return matches[matches.length - 1]!.action
  },

  addRule(rule: PermissionRule): void {
    rules.push(rule)
  },

  loadRules(newRules: PermissionRule[]): void {
    rules.push(...newRules)
  },
}
