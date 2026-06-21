export type CommandSecurityLevel = "safe" | "warning" | "danger"

export interface CommandAnalysis {
  isReadOnly: boolean
  level: CommandSecurityLevel
  reason: string
  parsedExecutables: string[]
}

const READ_ONLY_COMMANDS = new Set([
  "ls", "cat", "grep", "rg", "find", "pwd", "echo", "head", "tail", "less", "more",
  "wc", "stat", "file", "which", "whereis", "whoami", "date", "cal", "uptime",
  "df", "du", "free", "top", "htop", "ps", "history", "git status", "git log",
  "git diff", "git show", "git branch", "git rev-parse", "git remote", "tsc",
])

const DESTRUCTIVE_COMMANDS = new Set([
  "rm", "mkfs", "dd", "fdisk", "mkswap", "format", "shutdown", "reboot", "halt",
  "poweroff", "init", "kill", "killall", "pkill", "su", "sudo", "chown", "chmod",
  "iptables", "ufw", "mv", "cp",
])

const SHELL_RISK_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /(^|[^\\])`/, reason: "command substitution with backticks" },
  { re: /\$\(/, reason: "command substitution" },
  { re: /<<-?/, reason: "heredoc input" },
  { re: /(^|[\s;&|])(?:\d?>|\d?>>|&>|>\|)/, reason: "shell output redirection" },
  { re: /(^|[\s;&|])\w+=\S+/, reason: "environment assignment" },
  { re: /(^|[\s;&|])eval(\s|$)/, reason: "eval execution" },
  { re: /(^|[\s;&|])source(\s|$)|(^|[\s;&|])\.(\s+)/, reason: "sourcing shell code" },
]

function splitSegments(input: string): string[] {
  const segments: string[] = []
  let current = ""
  let quote: "'" | '"' | null = null
  let escape = false

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!
    const next = input[i + 1]

    if (escape) {
      current += ch
      escape = false
      continue
    }
    if (ch === "\\") {
      current += ch
      escape = true
      continue
    }
    if (quote) {
      current += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      current += ch
      continue
    }

    if (ch === ";" || ch === "|") {
      if (current.trim()) segments.push(current.trim())
      current = ""
      if ((ch === "|" && next === "|")) i++
      continue
    }
    if (ch === "&" && next === "&") {
      if (current.trim()) segments.push(current.trim())
      current = ""
      i++
      continue
    }

    current += ch
  }

  if (current.trim()) segments.push(current.trim())
  return segments
}

function tokenize(segment: string): string[] {
  const tokens: string[] = []
  let current = ""
  let quote: "'" | '"' | null = null
  let escape = false

  for (const ch of segment) {
    if (escape) {
      current += ch
      escape = false
      continue
    }
    if (ch === "\\") {
      escape = true
      continue
    }
    if (quote) {
      if (ch === quote) {
        quote = null
      } else {
        current += ch
      }
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      continue
    }
    if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current)
        current = ""
      }
      continue
    }
    current += ch
  }

  if (current) tokens.push(current)
  return tokens
}

function stripEnvAssignments(tokens: string[]): string[] {
  let i = 0
  while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i]!)) i++
  return tokens.slice(i)
}

function commandName(tokens: string[]): { exec: string; fullExec: string } | null {
  const stripped = stripEnvAssignments(tokens)
  if (stripped.length === 0) return null

  let exec = stripped[0] ?? ""
  if (exec === "command" || exec === "env" || exec === "time") {
    const rest = stripEnvAssignments(stripped.slice(1))
    exec = rest[0] ?? exec
    stripped.splice(0, stripped.length, ...rest)
  }

  let fullExec = exec
  if (exec === "sudo" && stripped.length > 1) {
    fullExec = stripped[1] ?? exec
  } else if (exec === "git" && stripped.length > 1) {
    fullExec = `git ${stripped[1] ?? ""}`
  } else if ((exec === "bunx" || exec === "npx" || exec === "pnpm" || exec === "yarn") && stripped.length > 1) {
    fullExec = stripped[1] ?? exec
  } else if (exec === "bun" && stripped.length > 1) {
    fullExec = stripped[1] === "run" ? "bun run" : `bun ${stripped[1] ?? ""}`
  } else if (exec === "npm" && stripped.length > 1) {
    fullExec = `npm ${stripped[1] ?? ""}`
  }

  return { exec, fullExec }
}

function shellRisk(commandLine: string): string | null {
  for (const risk of SHELL_RISK_PATTERNS) {
    if (risk.re.test(commandLine)) return risk.reason
  }
  return null
}

export function classifyCommand(commandLine: string): CommandAnalysis {
  if (!commandLine || commandLine.trim() === "") {
    return { isReadOnly: true, level: "safe", reason: "Empty command", parsedExecutables: [] }
  }

  const segments = splitSegments(commandLine)
  const executables: string[] = []
  let dangerReason = ""
  let warningReason = shellRisk(commandLine) ?? ""
  let allReadOnly = warningReason === ""

  for (const segment of segments) {
    const tokens = tokenize(segment)
    const command = commandName(tokens)
    if (!command) {
      allReadOnly = false
      if (!warningReason) warningReason = "shell syntax requires review"
      continue
    }

    executables.push(command.fullExec)

    if (command.exec === "sudo") {
      dangerReason = "Sudo usage detected"
    } else if (DESTRUCTIVE_COMMANDS.has(command.exec)) {
      dangerReason = `Destructive command detected: ${command.exec}`
    }

    if (command.exec === "rm" && (tokens.includes("-rf") || tokens.includes("-fr") || tokens.some((t) => /^-[^-]*r[^-]*f|^-[^-]*f[^-]*r/.test(t)))) {
      dangerReason = "Destructive recursive remove (rm -rf) detected"
    }

    if (/[?*\[\]{}]/.test(segment) && (command.exec === "rm" || command.exec === "mv" || command.exec === "cp")) {
      dangerReason = `Wildcard with destructive command detected: ${command.exec}`
    }

    if (!READ_ONLY_COMMANDS.has(command.fullExec) && !READ_ONLY_COMMANDS.has(command.exec)) {
      allReadOnly = false
      if (!warningReason) warningReason = "Command is mutating or not known read-only"
    }
  }

  if (dangerReason) {
    return {
      isReadOnly: false,
      level: "danger",
      reason: dangerReason,
      parsedExecutables: executables,
    }
  }

  if (allReadOnly) {
    return {
      isReadOnly: true,
      level: "safe",
      reason: "All segments are read-only commands",
      parsedExecutables: executables,
    }
  }

  return {
    isReadOnly: false,
    level: "warning",
    reason: warningReason || "Command requires review",
    parsedExecutables: executables,
  }
}
