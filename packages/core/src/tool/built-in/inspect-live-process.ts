import { z } from "zod"
import { spawnSync } from "node:child_process"
import { platform } from "node:os"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

interface ProcessInspectResult {
  os:                     string
  debugger:               string
  binary:                 string
  status:                 "CRASHED" | "COMPLETED" | "TIMEOUT" | "ERROR" | "UNSUPPORTED"
  signal?:                string
  exit_code?:             number
  registers?:             Record<string, string>
  stack_overflow_detected: boolean
  buffer_distance_to_eip?: number
  crash_address?:         string
  backtrace?:             string[]
  raw_output?:            string
  error?:                 string
  install_hint?:          string
}

// ── GDB (Linux) ───────────────────────────────────────────────────────────────

const GDB_SCRIPT = (inputPayload: string) => `
set pagination off
set confirm off
set print frame-arguments none
${inputPayload ? `run <<< "${inputPayload.replace(/"/g, '\\"')}"` : "run"}
bt 10
info registers
x/4xw $esp
quit
`

function runGdb(binaryPath: string, inputPayload: string, timeoutSec: number): ProcessInspectResult {
  const scriptPath = join(tmpdir(), `aurict-gdb-${Date.now()}.gdb`)
  writeFileSync(scriptPath, GDB_SCRIPT(inputPayload), "utf8")

  const r = spawnSync("gdb", ["-batch", "-x", scriptPath, binaryPath], {
    encoding: "utf8",
    timeout:  timeoutSec * 1000,
    maxBuffer: 512 * 1024,
  })
  try { require("node:fs").unlinkSync(scriptPath) } catch { /* ignore */ }

  const output = (r.stdout ?? "") + (r.stderr ?? "")
  return parseGdbOutput(output, binaryPath)
}

function parseGdbOutput(output: string, binary: string): ProcessInspectResult {
  const result: ProcessInspectResult = {
    os:                      "Linux",
    debugger:                "gdb",
    binary,
    status:                  "COMPLETED",
    stack_overflow_detected: false,
    raw_output:              output.slice(0, 3000),
  }

  // Crash detection
  if (/SIGSEGV|Segmentation fault/i.test(output)) {
    result.status = "CRASHED"
    result.signal = "SIGSEGV"
  } else if (/SIGABRT/i.test(output)) {
    result.status = "CRASHED"
    result.signal = "SIGABRT"
  } else if (/SIGILL/i.test(output)) {
    result.status = "CRASHED"
    result.signal = "SIGILL"
  }

  // EIP/RIP value (crash address)
  const eipMatch = output.match(/eip\s+0x([0-9a-f]+)/i) ?? output.match(/rip\s+0x([0-9a-f]+)/i)
  if (eipMatch) {
    result.crash_address = `0x${eipMatch[1]}`
    // 0x41414141 = 'AAAA' = classic buffer overflow indicator
    if (/^0x4141/i.test(result.crash_address)) {
      result.stack_overflow_detected = true
    }
  }

  // Register extraction
  const regs: Record<string, string> = {}
  const regPattern = /\b(eax|ebx|ecx|edx|esi|edi|esp|ebp|eip|rax|rbx|rcx|rdx|rsi|rdi|rsp|rbp|rip)\s+0x([0-9a-f]+)/gi
  let m: RegExpExecArray | null
  while ((m = regPattern.exec(output)) !== null) {
    regs[m[1]!.toUpperCase()] = `0x${m[2]}`
  }
  if (Object.keys(regs).length > 0) result.registers = regs

  // Backtrace
  const btLines = output.split("\n")
    .filter(l => /^#\d+\s/.test(l.trim()))
    .slice(0, 10)
    .map(l => l.trim())
  if (btLines.length > 0) result.backtrace = btLines

  // Buffer distance estimation (pattern offset heuristic)
  if (result.stack_overflow_detected && result.crash_address) {
    const addr = parseInt(result.crash_address, 16)
    // If EIP is 0x41414141 + offset pattern, try to calculate distance
    // Simple heuristic: distance = (addr - 0x41414141) / 0x01010101 * 4 + base
    const dist = estimateBufferDistance(output)
    if (dist !== null) result.buffer_distance_to_eip = dist
  }

  return result
}

function estimateBufferDistance(output: string): number | null {
  // Look for a cyclic pattern like Aa0A, Aa1A (pwntools cyclic) in the crash address
  // Or estimate from the 'A' count in ESP region
  const espHex = output.match(/0x41+/)
  if (espHex) {
    const hexStr = espHex[0].slice(2)
    return Math.floor(hexStr.length / 2)
  }
  return null
}

// ── LLDB (macOS) ──────────────────────────────────────────────────────────────

const LLDB_COMMANDS = (inputPayload: string) => [
  "settings set auto-confirm true",
  inputPayload ? `process launch --stdin - <<< "${inputPayload.replace(/"/g, '\\"')}"` : "run",
  "bt 10",
  "register read",
  "quit",
].join("\n")

function runLldb(binaryPath: string, inputPayload: string, timeoutSec: number): ProcessInspectResult {
  const scriptPath = join(tmpdir(), `aurict-lldb-${Date.now()}.lldb`)
  writeFileSync(scriptPath, LLDB_COMMANDS(inputPayload), "utf8")

  const r = spawnSync("lldb", ["-s", scriptPath, binaryPath], {
    encoding: "utf8",
    timeout:  timeoutSec * 1000,
    maxBuffer: 512 * 1024,
  })
  try { require("node:fs").unlinkSync(scriptPath) } catch { /* ignore */ }

  const output = (r.stdout ?? "") + (r.stderr ?? "")
  return parseLldbOutput(output, binaryPath)
}

function parseLldbOutput(output: string, binary: string): ProcessInspectResult {
  const result: ProcessInspectResult = {
    os:                      "macOS",
    debugger:                "lldb",
    binary,
    status:                  "COMPLETED",
    stack_overflow_detected: false,
    raw_output:              output.slice(0, 3000),
  }

  if (/EXC_BAD_ACCESS|SIGSEGV|signal 11/i.test(output)) {
    result.status = "CRASHED"
    result.signal = "SIGSEGV"
  } else if (/SIGABRT|signal 6/i.test(output)) {
    result.status = "CRASHED"
    result.signal = "SIGABRT"
  }

  // Register extraction (lldb format: "rip = 0x...")
  const regs: Record<string, string> = {}
  const regPattern = /\b(rax|rbx|rcx|rdx|rsi|rdi|rbp|rsp|rip|eax|ebx|ecx|edx)\s+=\s+(0x[0-9a-f]+)/gi
  let m: RegExpExecArray | null
  while ((m = regPattern.exec(output)) !== null) {
    regs[m[1]!.toUpperCase()] = m[2]!
  }
  if (Object.keys(regs).length > 0) result.registers = regs

  if (regs["RIP"] && /0x4141/i.test(regs["RIP"])) {
    result.stack_overflow_detected = true
    result.crash_address = regs["RIP"]
  }

  const btLines = output.split("\n")
    .filter(l => /^\s*frame #\d+/.test(l))
    .slice(0, 10)
    .map(l => l.trim())
  if (btLines.length > 0) result.backtrace = btLines

  return result
}

// ── Debugger availability check ───────────────────────────────────────────────

function hasDebugger(name: string): boolean {
  const r = spawnSync(name, ["--version"], { encoding: "utf8", timeout: 3000 })
  return r.status === 0
}

// ── Tool definition ───────────────────────────────────────────────────────────

export const inspectLiveProcessTool: ToolDef = {
  id:        "inspect_live_process",
  timeoutMs: 120_000,
  description: `Run a binary with a controlled input payload and inspect the crash state:
registers, signal, stack overflow indicator, buffer distance to EIP/RIP, and backtrace.

Returns LLM-friendly structured JSON instead of raw debugger output — no need to
parse gdb/lldb output manually.

OS behavior:
- Linux  → uses gdb (install: apt install gdb)
- macOS  → uses lldb (install: xcode-select --install)
- Windows → not supported (returns clear error with alternatives)

Use when: testing buffer overflow exploits, measuring EIP offset, analyzing crash behavior,
verifying PoC payloads, binary CTF challenge analysis.`,

  parameters: z.object({
    binary_path:     z.string().describe("Path to the binary to run/analyze"),
    input_payload:   z.string().optional().describe("Stdin payload to send to the process, e.g. 'AAAA....' for buffer overflow testing"),
    timeout_seconds: z.number().optional().default(10).describe("Max seconds to wait for the process (default 10)"),
  }),
  spec: {
    category: "execute",
    riskLevel: "high",
    securityCapability: "active",
    permissionSummary: "Run a local binary under a debugger with controlled input",
  },

  async execute(args, _ctx: ToolContext): Promise<ExecuteResult> {
    const binaryPath   = String(args["binary_path"] ?? "")
    const inputPayload = args["input_payload"] ? String(args["input_payload"]) : ""
    const timeoutSec   = Number(args["timeout_seconds"] ?? 10)

    const os = platform()

    // Windows: not supported
    if (os === "win32") {
      const result: ProcessInspectResult = {
        os:                      "Windows",
        debugger:                "none",
        binary:                  binaryPath,
        status:                  "UNSUPPORTED",
        stack_overflow_detected: false,
        error:                   "inspect_live_process is not supported on Windows.",
        install_hint:            "Use a Linux VM or WSL2 with gdb. Alternative: x64dbg for GUI debugging on Windows.",
      }
      return { output: JSON.stringify(result, null, 2) }
    }

    // macOS: lldb
    if (os === "darwin") {
      if (!hasDebugger("lldb")) {
        const result: ProcessInspectResult = {
          os:                      "macOS",
          debugger:                "lldb",
          binary:                  binaryPath,
          status:                  "ERROR",
          stack_overflow_detected: false,
          error:                   "lldb not found.",
          install_hint:            "Install Xcode Command Line Tools: xcode-select --install",
        }
        return { output: JSON.stringify(result, null, 2) }
      }
      const r = runLldb(binaryPath, inputPayload, timeoutSec)
      return { output: JSON.stringify(r, null, 2) }
    }

    // Linux: gdb
    if (!hasDebugger("gdb")) {
      const result: ProcessInspectResult = {
        os:                      "Linux",
        debugger:                "gdb",
        binary:                  binaryPath,
        status:                  "ERROR",
        stack_overflow_detected: false,
        error:                   "gdb not found.",
        install_hint:            "Install gdb: sudo apt install gdb  OR  sudo dnf install gdb",
      }
      return { output: JSON.stringify(result, null, 2) }
    }

    const r = runGdb(binaryPath, inputPayload, timeoutSec)
    return { output: JSON.stringify(r, null, 2) }
  },
}
