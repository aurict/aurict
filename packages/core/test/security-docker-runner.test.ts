import { describe, expect, it } from "bun:test"
import { buildSecurityDockerArgs, buildSecurityDockerCommand } from "../src/security/docker-runner.js"
import { parseSecurityTarget } from "../src/security/runner.js"

describe("security docker runner", () => {
  it("builds docker args with restrictive isolation flags", () => {
    const args = buildSecurityDockerArgs({
      image: "aurict-security-lite:local",
      command: ["nmap", "example.com"],
      workdir: "/repo",
      outputDir: "/repo/.aurict/security/runs/1",
      network: "restricted",
    })

    expect(args).toContain("--cap-drop")
    expect(args).toContain("ALL")
    expect(args).toContain("--security-opt")
    expect(args).toContain("no-new-privileges")
    expect(args).toContain("--read-only")
    expect(args).toContain("--memory")
    expect(args).toContain("--cpus")
    expect(args).toContain("--pids-limit")
    expect(args).toContain("/repo:/workspace:ro")
    expect(args).toContain("/repo/.aurict/security/runs/1:/outputs:rw")
  })

  it("adds network none only when explicitly configured", () => {
    const noneArgs = buildSecurityDockerArgs({
      image: "aurict-security-lite:local",
      command: ["tool-list"],
      workdir: "/repo",
      outputDir: "/repo/out",
      network: "none",
    })
    expect(noneArgs.join(" ")).toContain("--network none")

    const restrictedArgs = buildSecurityDockerArgs({
      image: "aurict-security-lite:local",
      command: ["tool-list"],
      workdir: "/repo",
      outputDir: "/repo/out",
      network: "restricted",
    })
    expect(restrictedArgs).not.toContain("--network")
  })

  it("builds fixed commands without shell wrappers", () => {
    const target = parseSecurityTarget("https://example.com")
    const nmap = buildSecurityDockerCommand("nmap_top", target)
    expect(nmap[0]).toBe("nmap")
    expect(nmap).not.toContain("sh")
    expect(nmap).not.toContain("-c")

    const sqlmap = buildSecurityDockerCommand("sqlmap", target)
    expect(sqlmap[0]).toBe("sqlmap")
    expect(sqlmap).toContain("--batch")
    expect(sqlmap).toContain("--risk")
    expect(sqlmap).toContain("1")
  })

  it("keeps ffuf target bounded to FUZZ path", () => {
    const target = parseSecurityTarget("https://example.com/app")
    const ffuf = buildSecurityDockerCommand("ffuf", target)
    expect(ffuf).toContain("-u")
    expect(ffuf).toContain("https://example.com/app/FUZZ")
    expect(ffuf).toContain("-rate")
  })
})
