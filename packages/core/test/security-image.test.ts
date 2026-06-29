import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

interface SecurityToolManifest {
  included: Array<{ name: string }>
  excluded: string[]
}

function readManifest(path: string): SecurityToolManifest {
  return JSON.parse(readFileSync(join(process.cwd(), path), "utf8")) as SecurityToolManifest
}

const REJECTED_TOOLS = ["metasploit", "aircrack-ng", "bettercap", "responder", "hydra", "medusa", "john", "hashcat"]

describe("security-lite image manifest", () => {
  const manifest = readManifest("docker/security-lite/tools.json")

  it("includes the approved active-lite tool set", () => {
    const included = new Set(manifest.included.map((tool) => tool.name))
    for (const tool of [
      "curl", "wget", "jq", "openssl", "dnsutils", "whois",
      "iputils-ping", "traceroute", "netcat-openbsd", "nmap",
      "python3", "python3-pip", "ca-certificates", "git",
      "nikto", "testssl.sh", "sqlmap", "nuclei", "ffuf", "gobuster",
    ]) {
      expect(included.has(tool)).toBe(true)
    }
  })

  it("keeps explicitly rejected tools out of the included set", () => {
    const included = new Set(manifest.included.map((tool) => tool.name))
    for (const tool of REJECTED_TOOLS) {
      expect(manifest.excluded).toContain(tool)
      expect(included.has(tool)).toBe(false)
    }
  })
})

describe("security-kali-full image manifest", () => {
  const manifest = readManifest("docker/security-kali-full/tools.json")

  it("adds kali-full focused passive/enumeration tools", () => {
    const included = new Set(manifest.included.map((tool) => tool.name))
    for (const tool of ["whatweb", "wafw00f", "sslscan", "amass"]) {
      expect(included.has(tool)).toBe(true)
    }
  })

  it("keeps explicitly rejected tools out of kali-full too", () => {
    const included = new Set(manifest.included.map((tool) => tool.name))
    for (const tool of REJECTED_TOOLS) {
      expect(manifest.excluded).toContain(tool)
      expect(included.has(tool)).toBe(false)
    }
  })
})
