import { afterEach, describe, expect, it } from "bun:test"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { removeMCPServer, saveMCPServer, setMCPServerEnabled } from "../src/mcp/config.js"

const dirs: string[] = []
function configPath(initial?: object): string {
  const dir = mkdtempSync(join(tmpdir(), "aurict-mcp-"))
  dirs.push(dir)
  const path = join(dir, "mcp.json")
  if (initial) writeFileSync(path, JSON.stringify(initial))
  return path
}
const read = (path: string) => JSON.parse(readFileSync(path, "utf8")) as { mcpServers: Record<string, { enabled?: boolean; command?: string }> }

afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

describe("global MCP server management", () => {
  it("adds, disables and removes a server while keeping the others", () => {
    const path = configPath({ mcpServers: { git: { command: "uvx", args: ["mcp-server-git"] } } })
    saveMCPServer("docs", { url: "https://docs.example.com/mcp" }, path)
    setMCPServerEnabled("git", false, path)
    expect(read(path).mcpServers.git).toMatchObject({ command: "uvx", enabled: false })
    expect(removeMCPServer("docs", path)).toBe(true)
    expect(Object.keys(read(path).mcpServers)).toEqual(["git"])
    expect(removeMCPServer("docs", path)).toBe(false)
  })

  it("creates the file on first save", () => {
    const path = configPath()
    saveMCPServer("fetch", { command: "uvx", args: ["mcp-server-fetch"] }, path)
    expect(read(path).mcpServers.fetch?.command).toBe("uvx")
  })

  it("rejects unsafe names and ambiguous transports", () => {
    const path = configPath()
    expect(() => saveMCPServer("../escape", { command: "x" }, path)).toThrow()
    expect(() => saveMCPServer("both", { command: "x", url: "https://a.b" }, path)).toThrow()
    expect(() => saveMCPServer("none", {}, path)).toThrow()
    expect(() => saveMCPServer("ftp", { url: "ftp://a.b" }, path)).toThrow()
    expect(() => setMCPServerEnabled("missing", true, path)).toThrow()
  })
})
