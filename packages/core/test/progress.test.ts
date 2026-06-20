import { describe, it, expect, beforeEach } from "bun:test"
import { ToolProgressTracker, getToolProgressMessage } from "../src/util/progress.js"

describe("ToolProgressTracker", () => {
  let tracker: ToolProgressTracker

  beforeEach(() => {
    tracker = new ToolProgressTracker()
  })

  describe("start", () => {
    it("emits starting and running events", () => {
      const events: string[] = []
      tracker.onProgress((e) => events.push(e.status))

      tracker.start("read", "Reading file.ts...")

      expect(events).toContain("starting")
      expect(events).toContain("running")
    })

    it("tracks active tool", () => {
      tracker.start("read", "Reading file.ts...")

      const active = tracker.getActiveTools()
      expect(active.length).toBe(1)
      expect(active[0]!.toolId).toBe("read")
    })
  })

  describe("finish", () => {
    it("emits done event", () => {
      const events: string[] = []
      tracker.onProgress((e) => events.push(e.status))

      tracker.start("read")
      tracker.finish("read", "Done")

      expect(events).toContain("done")
    })

    it("removes from active tools", () => {
      tracker.start("read")
      tracker.finish("read")

      expect(tracker.getActiveTools().length).toBe(0)
    })

    it("includes elapsed time", () => {
      let elapsed = 0
      tracker.onProgress((e) => {
        if (e.status === "done") elapsed = e.elapsedMs
      })

      tracker.start("read")
      tracker.finish("read")

      expect(elapsed).toBeGreaterThanOrEqual(0)
    })
  })

  describe("error", () => {
    it("emits error event", () => {
      const events: string[] = []
      tracker.onProgress((e) => events.push(e.status))

      tracker.start("read")
      tracker.error("read", "File not found")

      expect(events).toContain("error")
    })

    it("includes error message", () => {
      let errorMsg = ""
      tracker.onProgress((e) => {
        if (e.status === "error") errorMsg = e.message ?? ""
      })

      tracker.start("read")
      tracker.error("read", "File not found")

      expect(errorMsg).toBe("File not found")
    })
  })

  describe("update", () => {
    it("emits running event with updated message", () => {
      let lastMessage = ""
      tracker.onProgress((e) => {
        if (e.status === "running") lastMessage = e.message ?? ""
      })

      tracker.start("bash", "Running...")
      tracker.update("bash", "Compiling...")

      expect(lastMessage).toBe("Compiling...")
    })
  })

  describe("onProgress", () => {
    it("returns unsubscribe function", () => {
      const events: string[] = []
      const unsub = tracker.onProgress((e) => events.push(e.status))

      tracker.start("read")
      unsub()
      tracker.start("write")

      // Sadece read'in event'leri var
      expect(events.filter(e => e === "starting").length).toBe(1)
    })
  })

  describe("clear", () => {
    it("removes all listeners and active tools", () => {
      tracker.start("read")
      tracker.start("write")
      tracker.clear()

      expect(tracker.getActiveTools().length).toBe(0)
    })
  })
})

describe("getToolProgressMessage", () => {
  it("generates message for read tool", () => {
    const msg = getToolProgressMessage("read", { path: "file.ts" })
    expect(msg).toContain("file.ts")
    expect(msg).toContain("Reading")
  })

  it("generates message for bash tool", () => {
    const msg = getToolProgressMessage("bash", { command: "npm test" })
    expect(msg).toContain("npm test")
    expect(msg).toContain("Running")
  })

  it("generates message for grep tool", () => {
    const msg = getToolProgressMessage("grep", { pattern: "import" })
    expect(msg).toContain("import")
    expect(msg).toContain("Searching")
  })

  it("generates generic message for unknown tool", () => {
    const msg = getToolProgressMessage("unknown-tool", {})
    expect(msg).toContain("unknown-tool")
  })
})
