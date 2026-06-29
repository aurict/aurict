import { describe, expect, it } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { getCommand } from "../src/commands/registry.js"
import type { CommandContext, CommandResult, PickerItem } from "../src/commands/types.js"

describe("security slash command", () => {
  it("persists scope and exposes operator plan/report/reset actions", async () => {
    const workdir = mkdtempSync(join(tmpdir(), "aurict-security-command-"))
    try {
      const command = getCommand("security")
      expect(command).toBeDefined()

      const add = await command!.handler(["scope", "add", "example.com"], ctx(workdir))
      expect(text(add)).toContain("Scope: example.com")

      const plan = await command!.handler(["plan"], ctx(workdir))
      expect(text(plan)).toContain("[Security Operator Loop]")

      const report = await command!.handler(["report"], ctx(workdir))
      expect(text(report)).toContain("# Security Assessment Report")

      const reset = await command!.handler(["reset"], ctx(workdir))
      expect(text(reset)).toContain("reset")
    } finally {
      rmSync(workdir, { recursive: true, force: true })
    }
  })
})

function text(result: CommandResult): string {
  if (result.type === "text") return result.content
  if (result.type === "error") return result.message
  return JSON.stringify(result)
}

function ctx(workdir: string): CommandContext {
  const noop = () => {}
  return {
    sessionId: "security-command-test",
    provider: "openai",
    model: "test-model",
    workdir,
    skills: [],
    currentTheme: "default",
    isUndercover: false,
    coordinatorMode: false,
    activeAgent: "omni",
    setAgent: noop,
    setProvider: noop,
    setModel: noop,
    setEffort: noop,
    setTheme: noop,
    setWorkdir: noop,
    openBtw: noop,
    toggleUndercover: noop,
    toggleCoordinator: noop,
    autopilotMode: false,
    toggleAutopilot: noop,
    sendToBackground: noop,
    bgTasks: [],
    showBgTask: noop,
    showPicker: (_title: string, _items: PickerItem[], _onSelect: (item: PickerItem) => void) => {},
    showPrompt: noop,
    restoreSession: noop,
    messages: [],
    checkpoints: [],
    popCheckpoints: noop,
    branches: [],
    activeBranchIdx: 0,
    createBranch: noop,
    switchBranch: noop,
    deleteBranch: noop,
    watchedPaths: [],
    addWatch: noop,
    removeWatch: noop,
    contextWindow: 128_000,
    replayTo: noop,
    openDesign: noop,
  }
}
