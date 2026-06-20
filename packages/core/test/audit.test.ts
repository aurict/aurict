import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { AuditLogger, readAuditLogs, filterAuditLogs } from "../src/security/audit.js"
import { rmSync, existsSync } from "fs"
import { join } from "path"

describe("Audit Logging", () => {
  const testLogPath = ".aurict/test-audit.log"

  afterEach(() => {
    // Cleanup test log
    try {
      rmSync(testLogPath, { force: true })
    } catch {}
  })

  describe("AuditLogger", () => {
    it("logs events to buffer", () => {
      const logger = new AuditLogger({
        enabled: true,
        logPath: testLogPath,
      })

      logger.log({
        type: "tool_call",
        severity: "info",
        actor: "user1",
        action: "execute:bash",
      })

      expect(logger.getBufferSize()).toBe(1)
      logger.close()
    })

    it("logs tool calls", () => {
      const logger = new AuditLogger({
        enabled: true,
        logPath: testLogPath,
      })

      logger.logToolCall("user1", "bash", { command: "ls" }, "session1")

      expect(logger.getBufferSize()).toBe(1)
      logger.close()
    })

    it("logs file writes", () => {
      const logger = new AuditLogger({
        enabled: true,
        logPath: testLogPath,
      })

      logger.logFileWrite("user1", "src/app.ts", "session1")

      expect(logger.getBufferSize()).toBe(1)
      logger.close()
    })

    it("logs permission decisions", () => {
      const logger = new AuditLogger({
        enabled: true,
        logPath: testLogPath,
      })

      logger.logPermission("user1", true, "bash", "safe command")
      logger.logPermission("user1", false, "rm -rf", "dangerous")

      expect(logger.getBufferSize()).toBe(2)
      logger.close()
    })

    it("logs errors", () => {
      const logger = new AuditLogger({
        enabled: true,
        logPath: testLogPath,
      })

      logger.logError("user1", "Connection failed", { endpoint: "/api" })

      expect(logger.getBufferSize()).toBe(1)
      logger.close()
    })

    it("logs security alerts", () => {
      const logger = new AuditLogger({
        enabled: true,
        logPath: testLogPath,
      })

      logger.logSecurityAlert("user1", "Suspicious activity", "warning")

      expect(logger.getBufferSize()).toBe(1)
      logger.close()
    })

    it("logs rate limit events", () => {
      const logger = new AuditLogger({
        enabled: true,
        logPath: testLogPath,
      })

      logger.logRateLimit("user1", "/api/data", 5000)

      expect(logger.getBufferSize()).toBe(1)
      logger.close()
    })

    it("flushes buffer to disk", async () => {
      const logger = new AuditLogger({
        enabled: true,
        logPath: testLogPath,
      })

      logger.log({
        type: "tool_call",
        severity: "info",
        actor: "user1",
        action: "test",
      })

      logger.flush()

      // Wait for file write
      await new Promise(resolve => setTimeout(resolve, 100))

      const logs = readAuditLogs(testLogPath)
      expect(logs.length).toBeGreaterThan(0)
      logger.close()
    })

    it("does not log when disabled", () => {
      const logger = new AuditLogger({
        enabled: false,
        logPath: testLogPath,
      })

      logger.log({
        type: "tool_call",
        severity: "info",
        actor: "user1",
        action: "test",
      })

      expect(logger.getBufferSize()).toBe(0)
      logger.close()
    })
  })

  describe("readAuditLogs", () => {
    it("reads logs from file", async () => {
      const logger = new AuditLogger({
        enabled: true,
        logPath: testLogPath,
      })

      logger.log({
        type: "tool_call",
        severity: "info",
        actor: "user1",
        action: "test",
      })

      logger.flush()
      await new Promise(resolve => setTimeout(resolve, 100))

      const logs = readAuditLogs(testLogPath)
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].type).toBe("tool_call")
      logger.close()
    })

    it("returns empty array for missing file", () => {
      const logs = readAuditLogs(".aurict/nonexistent.log")
      expect(logs).toEqual([])
    })

    it("respects limit", async () => {
      const logger = new AuditLogger({
        enabled: true,
        logPath: testLogPath,
      })

      for (let i = 0; i < 10; i++) {
        logger.log({
          type: "tool_call",
          severity: "info",
          actor: "user1",
          action: `test${i}`,
        })
      }

      logger.flush()
      await new Promise(resolve => setTimeout(resolve, 100))

      const logs = readAuditLogs(testLogPath, 5)
      expect(logs.length).toBe(5)
      logger.close()
    })
  })

  describe("filterAuditLogs", () => {
    it("filters by type", () => {
      const events = [
        { timestamp: Date.now(), type: "tool_call" as const, severity: "info" as const, actor: "user1", action: "test" },
        { timestamp: Date.now(), type: "error" as const, severity: "error" as const, actor: "user1", action: "test" },
      ]

      const filtered = filterAuditLogs(events, { type: "tool_call" })
      expect(filtered.length).toBe(1)
      expect(filtered[0].type).toBe("tool_call")
    })

    it("filters by severity", () => {
      const events = [
        { timestamp: Date.now(), type: "tool_call" as const, severity: "info" as const, actor: "user1", action: "test" },
        { timestamp: Date.now(), type: "error" as const, severity: "error" as const, actor: "user1", action: "test" },
      ]

      const filtered = filterAuditLogs(events, { severity: "error" })
      expect(filtered.length).toBe(1)
      expect(filtered[0].severity).toBe("error")
    })

    it("filters by actor", () => {
      const events = [
        { timestamp: Date.now(), type: "tool_call" as const, severity: "info" as const, actor: "user1", action: "test" },
        { timestamp: Date.now(), type: "tool_call" as const, severity: "info" as const, actor: "user2", action: "test" },
      ]

      const filtered = filterAuditLogs(events, { actor: "user1" })
      expect(filtered.length).toBe(1)
      expect(filtered[0].actor).toBe("user1")
    })

    it("filters by date range", () => {
      const now = Date.now()
      const events = [
        { timestamp: now - 10000, type: "tool_call" as const, severity: "info" as const, actor: "user1", action: "old" },
        { timestamp: now, type: "tool_call" as const, severity: "info" as const, actor: "user1", action: "new" },
      ]

      const filtered = filterAuditLogs(events, { startDate: now - 5000 })
      expect(filtered.length).toBe(1)
      expect(filtered[0].action).toBe("new")
    })
  })
})
