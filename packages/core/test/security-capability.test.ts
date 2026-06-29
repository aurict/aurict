import { describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { z } from "zod"
import { buildIntentSkillSection, clearSkillCache } from "../src/skill/injector.js"
import { SkillRegistry } from "../src/skill/registry.js"
import { classifyToolSecurityCapability, filterToolIdsForSecurityCapability, isSkillVisibleForSecurityCapability, prepareToolForSecurityCapability } from "../src/security/capability.js"
import { securityPolicyManager } from "../src/security/policy.js"
import { parseSecurityTarget, targetMatchesAllowlist } from "../src/security/runner.js"
import { loadSkillTool } from "../src/tool/built-in/load-skill.js"
import { subagentTool } from "../src/tool/built-in/subagent.js"
import { securityScanTool } from "../src/tool/built-in/security-scan.js"
import { securityReportTool } from "../src/tool/built-in/security-report.js"
import { trackVariableTaintTool } from "../src/tool/built-in/track-variable-taint.js"
import { executeTool } from "../src/tool/executor.js"
import type { ToolContext } from "../src/tool/types.js"

async function withProjectConfig(config: Record<string, unknown>, fn: (workdir: string) => Promise<void> | void) {
  const workdir = mkdtempSync(join(tmpdir(), "aurict-security-cap-"))
  try {
    mkdirSync(join(workdir, ".aurict"), { recursive: true })
    writeFileSync(join(workdir, ".aurict", "config.json"), JSON.stringify(config, null, 2), "utf8")
    clearSkillCache()
    return await fn(workdir)
  } finally {
    clearSkillCache()
    rmSync(workdir, { recursive: true, force: true })
  }
}

function ctx(workdir: string): ToolContext {
  return {
    sessionId: "security-capability-test",
    workdir,
    signal: new AbortController().signal,
  }
}

describe("security capability gate", () => {
  it("hides active pentest skills when security sandbox is off", () => {
    const skill = SkillRegistry.get("pentest-tooling")
    expect(skill).toBeDefined()
    expect(isSkillVisibleForSecurityCapability(skill!, { securitySandbox: { enabled: false, profile: "off" } })).toBe(false)
  })

  it("allows active pentest skills only for active profiles", () => {
    const skill = SkillRegistry.get("pentest-tooling")
    expect(skill).toBeDefined()
    expect(isSkillVisibleForSecurityCapability(skill!, { securitySandbox: { enabled: true, profile: "passive" } })).toBe(false)
    expect(isSkillVisibleForSecurityCapability(skill!, { securitySandbox: { enabled: true, profile: "active-lite" } })).toBe(true)
  })

  it("does not inject pentest intent matches while disabled", async () => {
    await withProjectConfig({ securitySandbox: { enabled: false, profile: "off" } }, async (workdir) => {
      const section = await buildIntentSkillSection("run nmap and sqlmap against this target", workdir)
      expect(section).not.toContain("pentest-tooling")
      expect(section).not.toContain("pentest-recon")
    })
  })

  it("blocks load_skill for active pentest skills while disabled", async () => {
    await withProjectConfig({ securitySandbox: { enabled: false, profile: "off" } }, async (workdir) => {
      const result = await executeTool(loadSkillTool, { skill_id: "pentest-tooling" }, ctx(workdir))
      expect(result.error).toContain("security capability profile is disabled")
    })
  })

  it("removes security and pentest agent types from subagent schema while disabled", () => {
    const prepared = prepareToolForSecurityCapability(subagentTool, { enabled: false, profile: "off" })
    expect(prepared).not.toBeNull()
    expect(prepared!.description).not.toContain("pentest")
    expect(prepared!.description).not.toContain("security audit")

    const schema = prepared!.parameters as z.AnyZodObject
    expect(schema.safeParse({ type: "explore", role: "Reader", prompt: "Read files" }).success).toBe(true)
    expect(schema.safeParse({ type: "security", role: "Security", prompt: "Scan" }).success).toBe(false)
    expect(schema.safeParse({ type: "pentest", role: "Pentest", prompt: "Scan" }).success).toBe(false)
  })

  it("removes active security tools from schema while disabled", () => {
    expect(prepareToolForSecurityCapability(securityScanTool, { enabled: false, profile: "off" })).toBeNull()
  })

  it("allows passive security report tools without exposing active scans", () => {
    expect(prepareToolForSecurityCapability(securityReportTool, { enabled: true, profile: "passive" })).not.toBeNull()
    expect(prepareToolForSecurityCapability(securityScanTool, { enabled: true, profile: "passive" })).toBeNull()
  })

  it("uses tool spec metadata for security visibility", () => {
    expect(classifyToolSecurityCapability(trackVariableTaintTool)).toBe("active-security")
    expect(prepareToolForSecurityCapability(trackVariableTaintTool, { enabled: false, profile: "off" })).toBeNull()
    expect(prepareToolForSecurityCapability(trackVariableTaintTool, { enabled: true, profile: "active-lite" })).not.toBeNull()
  })

  it("filters tool ids deterministically by profile", () => {
    const tools = ["read", "security_report", "security_scan"]
    expect(filterToolIdsForSecurityCapability(tools, { enabled: false, profile: "off" })).toEqual(["read"])
    expect(filterToolIdsForSecurityCapability(tools, { enabled: true, profile: "passive" })).toEqual(["read", "security_report"])
    expect(filterToolIdsForSecurityCapability(tools, { enabled: true, profile: "active-lite" })).toEqual(tools)
  })

  it("blocks controlled scans when the target is not allowlisted", async () => {
    await withProjectConfig({ securitySandbox: { enabled: true, profile: "active-lite", targetAllowlist: [] } }, async (workdir) => {
      const result = await executeTool(securityScanTool, { target: "https://example.com" }, { ...ctx(workdir), isSubagent: true })
      expect(result.error).toContain("target 'example.com' is not allowed")
    })
  })

  it("matches allowlist entries by host, wildcard, scheme, and port", () => {
    const target = parseSecurityTarget("https://api.example.com:8443/path")
    expect(targetMatchesAllowlist("api.example.com:8443", target)).toBe(true)
    expect(targetMatchesAllowlist("api.example.com:443", target)).toBe(false)
    expect(targetMatchesAllowlist("*.example.com:8443", target)).toBe(true)
    expect(targetMatchesAllowlist("*.example.com:443", target)).toBe(false)
    expect(targetMatchesAllowlist("https://api.example.com:8443", target)).toBe(true)
    expect(targetMatchesAllowlist("http://api.example.com:8443", target)).toBe(false)
  })

  it("enforces security policy rate limits per target", async () => {
    securityPolicyManager.resetForTests()
    const target = parseSecurityTarget("https://example.com")
    const config = {
      securitySandbox: {
        enabled: true,
        profile: "active-lite" as const,
        targetAllowlist: ["example.com"],
        requestsPerMinute: 1,
      },
    }
    await securityPolicyManager.run({
      action: "web_baseline",
      target,
      config,
      workdir: process.cwd(),
      fn: async () => "ok",
    })
    await expect(securityPolicyManager.run({
      action: "web_baseline",
      target,
      config,
      workdir: process.cwd(),
      fn: async () => "blocked",
    })).rejects.toThrow("security rate limit exceeded")
    securityPolicyManager.resetForTests()
  })

  it("serializes security actions when maxConcurrent is 1", async () => {
    securityPolicyManager.resetForTests()
    const target = parseSecurityTarget("https://serial.example.com")
    const config = {
      securitySandbox: {
        enabled: true,
        profile: "active-lite" as const,
        targetAllowlist: ["serial.example.com"],
        maxConcurrent: 1,
        requestsPerMinute: 100,
      },
    }
    let running = 0
    let maxRunning = 0
    await Promise.all([
      securityPolicyManager.run({
        action: "web_baseline",
        target,
        config,
        workdir: process.cwd(),
        fn: async () => {
          running++
          maxRunning = Math.max(maxRunning, running)
          await new Promise(resolve => setTimeout(resolve, 20))
          running--
          return "one"
        },
      }),
      securityPolicyManager.run({
        action: "web_baseline",
        target,
        config,
        workdir: process.cwd(),
        fn: async () => {
          running++
          maxRunning = Math.max(maxRunning, running)
          running--
          return "two"
        },
      }),
    ])
    expect(maxRunning).toBe(1)
    securityPolicyManager.resetForTests()
  })

  it("requires explicit host-network approval tag for host docker network", () => {
    const target = parseSecurityTarget("https://example.com")
    expect(() => securityPolicyManager.assertActionAllowed("nmap_top", target, {
      securitySandbox: {
        enabled: true,
        profile: "active-lite",
        network: "host",
        targetAllowlist: ["example.com"],
      },
    })).toThrow("host-network")
  })

  it("runs a bounded baseline scan against an allowlisted local target", async () => {
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: () => new Response("ok", {
        headers: {
          "x-content-type-options": "nosniff",
          "referrer-policy": "no-referrer",
        },
      }),
    })
    try {
      await withProjectConfig({
        securitySandbox: {
          enabled: true,
          profile: "active-lite",
          targetAllowlist: ["127.0.0.1"],
        },
      }, async (workdir) => {
        const result = await executeTool(
          securityScanTool,
          { target: `http://127.0.0.1:${server.port}` },
          { ...ctx(workdir), isSubagent: true },
        )
        expect(result.error).toBeUndefined()
        expect(result.output).toContain("Content-Security-Policy")
        expect(result.output).toContain("x-content-type-options")
      })
    } finally {
      server.stop(true)
    }
  })

  it("formats security tool output into a report", async () => {
    const sample = {
      target: { raw: "http://127.0.0.1", host: "127.0.0.1" },
      profile: "active-lite",
      checks: [{
        id: "header-csp",
        title: "Content-Security-Policy",
        status: "warning",
        severity: "medium",
        detail: "content-security-policy is missing.",
      }],
    }
    const result = await executeTool(securityReportTool, {
      title: "Local Security Report",
      results_json: JSON.stringify(sample),
    }, ctx(process.cwd()))
    expect(result.error).toBeUndefined()
    expect(result.output).toContain("# Local Security Report")
    expect(result.output).toContain("Content-Security-Policy")
  })
})
