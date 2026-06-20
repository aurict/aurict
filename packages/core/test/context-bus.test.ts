import { describe, it, expect, beforeEach } from "bun:test"
import { createContextBus } from "../src/agent/context-bus.js"

describe("Shared Context Bus", () => {
  describe("context sharing", () => {
    it("set and get values", () => {
      const bus = createContextBus()
      bus.set("key1", "value1")
      
      expect(bus.get("key1")).toBe("value1")
    })

    it("returns null for missing keys", () => {
      const bus = createContextBus()
      expect(bus.get("missing")).toBeNull()
    })

    it("has checks existence", () => {
      const bus = createContextBus()
      bus.set("key1", "value1")
      
      expect(bus.has("key1")).toBe(true)
      expect(bus.has("missing")).toBe(false)
    })

    it("delete removes keys", () => {
      const bus = createContextBus()
      bus.set("key1", "value1")
      bus.delete("key1")
      
      expect(bus.has("key1")).toBe(false)
    })

    it("keys returns all keys", () => {
      const bus = createContextBus()
      bus.set("a", 1)
      bus.set("b", 2)
      
      const keys = bus.keys()
      expect(keys).toContain("a")
      expect(keys).toContain("b")
    })

    it("clearContext removes all data", () => {
      const bus = createContextBus()
      bus.set("a", 1)
      bus.set("b", 2)
      bus.clearContext()
      
      expect(bus.keys().length).toBe(0)
    })
  })

  describe("file locking", () => {
    it("acquires lock successfully", () => {
      const bus = createContextBus()
      const result = bus.acquireLock("src/file.ts", "agent-1")
      
      expect(result).toBe(true)
      expect(bus.isLocked("src/file.ts")).toBe(true)
    })

    it("prevents double lock by different agents", () => {
      const bus = createContextBus()
      bus.acquireLock("src/file.ts", "agent-1")
      const result = bus.acquireLock("src/file.ts", "agent-2")
      
      expect(result).toBe(false)
    })

    it("allows same agent to re-lock", () => {
      const bus = createContextBus()
      bus.acquireLock("src/file.ts", "agent-1")
      const result = bus.acquireLock("src/file.ts", "agent-1")
      
      expect(result).toBe(true)
    })

    it("releases lock", () => {
      const bus = createContextBus()
      bus.acquireLock("src/file.ts", "agent-1")
      bus.releaseLock("src/file.ts", "agent-1")
      
      expect(bus.isLocked("src/file.ts")).toBe(false)
    })

    it("only owner can release lock", () => {
      const bus = createContextBus()
      bus.acquireLock("src/file.ts", "agent-1")
      const result = bus.releaseLock("src/file.ts", "agent-2")
      
      expect(result).toBe(false)
      expect(bus.isLocked("src/file.ts")).toBe(true)
    })

    it("expires locks after timeout", async () => {
      const bus = createContextBus({ lockTimeoutMs: 100 })
      bus.acquireLock("src/file.ts", "agent-1")
      
      // Bekle
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(bus.isLocked("src/file.ts")).toBe(false)
    })

    it("respects max locks limit", () => {
      const bus = createContextBus({ maxLocks: 2 })
      bus.acquireLock("a.ts", "agent-1")
      bus.acquireLock("b.ts", "agent-1")
      const result = bus.acquireLock("c.ts", "agent-1")
      
      expect(result).toBe(false)
    })

    it("getLockInfo returns lock details", () => {
      const bus = createContextBus()
      bus.acquireLock("src/file.ts", "agent-1")
      
      const info = bus.getLockInfo("src/file.ts")
      expect(info).not.toBeNull()
      expect(info!.agentId).toBe("agent-1")
      expect(info!.filePath).toBe("src/file.ts")
    })

    it("getAgentLocks returns all locks for agent", () => {
      const bus = createContextBus()
      bus.acquireLock("a.ts", "agent-1")
      bus.acquireLock("b.ts", "agent-1")
      bus.acquireLock("c.ts", "agent-2")
      
      const locks = bus.getAgentLocks("agent-1")
      expect(locks.length).toBe(2)
    })

    it("releaseAgentLocks releases all locks for agent", () => {
      const bus = createContextBus()
      bus.acquireLock("a.ts", "agent-1")
      bus.acquireLock("b.ts", "agent-1")
      bus.acquireLock("c.ts", "agent-2")
      
      const count = bus.releaseAgentLocks("agent-1")
      expect(count).toBe(2)
      expect(bus.getLockCount()).toBe(1)
    })

    it("getLockCount returns active lock count", () => {
      const bus = createContextBus()
      bus.acquireLock("a.ts", "agent-1")
      bus.acquireLock("b.ts", "agent-2")
      
      expect(bus.getLockCount()).toBe(2)
    })

    it("clearLocks removes all locks", () => {
      const bus = createContextBus()
      bus.acquireLock("a.ts", "agent-1")
      bus.acquireLock("b.ts", "agent-2")
      bus.clearLocks()
      
      expect(bus.getLockCount()).toBe(0)
    })
  })
})
