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

  it("installs nikto outside apt because Debian bookworm does not package it", () => {
    const dockerfile = readFileSync(join(process.cwd(), "docker/security-lite/Dockerfile"), "utf8")
    const aptBlock = dockerfile.match(/apt-get install[\s\S]*?rm -rf \/var\/lib\/apt\/lists\/\*/)?.[0] ?? ""
    expect(aptBlock).not.toContain("\n    nikto")
    expect(dockerfile).toContain("ARG NIKTO_REF=2.6.0")
    expect(dockerfile).toContain("https://github.com/sullo/nikto.git")
  })

  it("pins nuclei and ffuf release binaries instead of compiling latest Go sources", () => {
    const dockerfile = readFileSync(join(process.cwd(), "docker/security-lite/Dockerfile"), "utf8")
    expect(dockerfile).toContain("ARG NUCLEI_VERSION=3.4.10")
    expect(dockerfile).toContain("ARG FFUF_VERSION=2.1.0")
    expect(dockerfile).toContain("projectdiscovery/nuclei/releases/download")
    expect(dockerfile).toContain("ffuf/ffuf/releases/download")
    expect(dockerfile).not.toContain("go install")
    expect(dockerfile).not.toContain("@latest")
    expect(dockerfile).not.toContain("golang-go")
  })

  it("keeps version-report compatible with tool-specific version flags", () => {
    const dockerfile = readFileSync(join(process.cwd(), "docker/security-lite/Dockerfile"), "utf8")
    const entrypoint = readFileSync(join(process.cwd(), "docker/security-lite/entrypoint.sh"), "utf8")
    expect(dockerfile).toContain("libjson-perl")
    expect(entrypoint).toContain("openssl) openssl version")
    expect(entrypoint).toContain("nikto) nikto -Version")
    expect(entrypoint).toContain("ffuf) ffuf -V")
    expect(entrypoint).toContain("gobuster) gobuster version")
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
