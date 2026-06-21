import { z } from "zod"
import { ptyManager } from "../../pty/manager.js"
import { classifyCommand } from "../../terminal/classifier.js"
import { chooseSandboxBackend, startDockerSandboxedProcess, startPolicySandboxedProcess } from "../../terminal/sandbox.js"
import { getShell } from "../../util/shell.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

export const bashTool: ToolDef = {
  id:   "bash",
  spec: {
    category:  "execute",
    riskLevel: "medium",
    requiresConfirmation: (args) => {
      const cmd = String(args["command"] ?? "")
      return /\b(rm\s+-rf|sudo|curl.*sh|wget.*sh|eval|>\/dev\/(sda|nvme))\b/.test(cmd)
    },
    permissionSummary: "Execute a shell command",
  },
  description: `Execute bash commands. This is an intelligent terminal.
Actions:
- 'run': Runs a command. If the command takes longer than 3 seconds, it will AUTOMATICALLY be sent to the background and return a session ID.
- 'background': Force a command to start in the background immediately.
- 'stdin': Send text to a background process.
- 'output': Read the latest output of a background process.
- 'kill': Terminate a background process.`,
  parameters: z.object({
    action: z.enum(["run", "background", "stdin", "output", "kill"]).optional().describe("Action to perform. Default is 'run'."),
    command: z.string().optional().describe("The bash command to execute (for 'run' and 'background')"),
    sessionId: z.string().optional().describe("Session ID (for 'stdin', 'output', 'kill')"),
    input: z.string().optional().describe("Input text to send (for 'stdin')"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const action = String(args["action"] ?? "run")

    if (action === "stdin" || action === "output" || action === "kill") {
      const sid = String(args["sessionId"])
      const session = ptyManager.get(sid)
      if (!session) return { output: "", error: `Session not found: ${sid}` }

      if (action === "kill") {
        ptyManager.kill(sid)
        return { output: `Session ${sid} terminated.` }
      }
      if (action === "stdin") {
        ptyManager.write(sid, String(args["input"]) + "\n")
        await new Promise(r => setTimeout(r, 500)) // give it time to process
        return { output: `Input sent. Current output:\n${session.outputBuffer}` }
      }
      if (action === "output") {
        return { output: `Status: ${session.status}\nOutput:\n${session.outputBuffer}` }
      }
    }

    const command = String(args["command"])
    if (!command) return { output: "", error: "command is required for this action" }

    const analysis = classifyCommand(command)
    const sandbox = chooseSandboxBackend(command, analysis)
    const sh = getShell()

    let session
    try {
      if (sandbox.backend === "docker") {
        session = await startDockerSandboxedProcess(sh.executable, [sh.flag, command], ctx.workdir, {})
      } else if (sandbox.backend === "policy") {
        session = await startPolicySandboxedProcess(sh.executable, [sh.flag, command], ctx.workdir, {})
      } else {
        session = await ptyManager.create(sh.executable, [sh.flag, command], ctx.workdir, {})
      }
    } catch (err) {
      return { output: "", error: `Failed to start process: ${err instanceof Error ? err.message : String(err)}` }
    }

    if (action === "background") {
      const sandboxLabel = sandbox.backend === "docker"
        ? " (IN DOCKER SANDBOX)"
        : sandbox.backend === "policy"
          ? " (POLICY SANDBOX)"
          : ""
      return { output: `Started background process${sandboxLabel}.\nSession ID: ${session.id}\nUse bash(action='output', sessionId='${session.id}') to read output.` }
    }

    // action === "run"
    // onChunk varsa: her 100ms'de yeni stdout/stderr parçalarını emit et
    let lastEmittedLen = 0
    let pollTimer: ReturnType<typeof setInterval> | null = null
    if (ctx.onChunk) {
      pollTimer = setInterval(() => {
        const s = ptyManager.get(session.id)
        if (!s) return
        const newChunk = s.outputBuffer.slice(lastEmittedLen)
        if (newChunk) {
          ctx.onChunk!(newChunk)
          lastEmittedLen = s.outputBuffer.length
        }
      }, 100)
    }

    const finished = await ptyManager.wait(session.id, 3000)

    if (pollTimer) clearInterval(pollTimer)

    // Kalan son chunk'ı da emit et (interval'dan kaçmış olabilir)
    if (ctx.onChunk) {
      const tail = finished.outputBuffer.slice(lastEmittedLen)
      if (tail) ctx.onChunk(tail)
    }

    if (finished.timedOut) {
      return {
        output: `Command is taking a long time. It has been AUTOMATICALLY sent to the background.\nSession ID: ${session.id}\nCurrent Output:\n${session.outputBuffer}\n\nYou can continue your work while it runs. Use bash(action='output', sessionId='${session.id}') later to check its status.`
      }
    }

    const exitInfo = finished.exitCode !== 0 ? `[Exit Code: ${finished.exitCode}]` : ""
    const out = finished.outputBuffer.trim()
    ptyManager.cleanup() // bittiği için temizle

    if (finished.exitCode !== 0) {
      return { output: out, error: `Command failed ${exitInfo}` }
    }

    return { output: out || "(no output)" }
  }
}
