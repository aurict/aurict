import { join } from "path"
import { homedir } from "os"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import type { MCPConfig, MCPServerConfig } from "./types.js"
import { DEFAULT_MCP_SERVERS } from "./defaults.js"

export function loadMCPConfig(workdir: string): MCPConfig {
  const merged: MCPConfig = { mcpServers: {} }

  // Önce global (~/.aurict/mcp.json), sonra proje (.aurict/mcp.json) — proje override eder
  const paths = [
    join(homedir(), ".aurict", "mcp.json"),
    join(workdir, ".aurict", "mcp.json"),
  ]

  for (const p of paths) {
    try {
      const raw = readFileSync(p, "utf8")
      const cfg = JSON.parse(raw) as Partial<MCPConfig>
      if (cfg.mcpServers) {
        Object.assign(merged.mcpServers, cfg.mcpServers)
      }
    } catch { /* dosya yoksa atla */ }
  }

  return merged
}

/**
 * Default MCP server'ları global config'e ekler.
 * - Config yoksa: tüm default'larla oluşturur.
 * - Config varsa: eksik default server'ları merge eder (yeni server'lar geriye dönük eklenir).
 * @returns true eğer herhangi bir değişiklik yapıldıysa
 */
export function ensureDefaultMCPServers(workdir: string): boolean {
  const globalPath = join(homedir(), ".aurict", "mcp.json")
  const globalDir  = join(homedir(), ".aurict")

  try {
    if (!existsSync(globalDir)) mkdirSync(globalDir, { recursive: true })

    // Config yoksa sıfırdan oluştur
    if (!existsSync(globalPath)) {
      writeFileSync(globalPath, JSON.stringify({ mcpServers: { ...DEFAULT_MCP_SERVERS } }, null, 2), "utf8")
      return true
    }

    // Config varsa — eksik default server'ları merge et
    let existing: MCPConfig
    try {
      existing = JSON.parse(readFileSync(globalPath, "utf8")) as MCPConfig
    } catch {
      return false
    }

    if (!existing.mcpServers) existing.mcpServers = {}

    const missing = Object.entries(DEFAULT_MCP_SERVERS).filter(
      ([name]) => !(name in existing.mcpServers),
    )
    if (missing.length === 0) return false

    for (const [name, cfg] of missing) {
      existing.mcpServers[name] = cfg
    }

    writeFileSync(globalPath, JSON.stringify(existing, null, 2), "utf8")
    return true
  } catch {
    return false
  }
}

export function enabledServers(cfg: MCPConfig): Record<string, MCPServerConfig> {
  const result: Record<string, MCPServerConfig> = {}
  for (const [name, server] of Object.entries(cfg.mcpServers)) {
    if (server.enabled !== false) result[name] = server
  }
  return result
}

// ── Desktop management of the global server list ─────────────────────────────
// The user-level ~/.aurict/mcp.json is the only file these touch; project files
// stay read-only so a repository can never be edited from the settings UI.

const NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i

export function globalMCPConfigPath(): string {
  return join(homedir(), ".aurict", "mcp.json")
}

function readGlobal(path: string): MCPConfig {
  if (!existsSync(path)) return { mcpServers: {} }
  const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<MCPConfig>
  return { mcpServers: parsed.mcpServers ?? {} }
}

function writeGlobal(path: string, cfg: MCPConfig): void {
  mkdirSync(join(path, ".."), { recursive: true })
  writeFileSync(path, JSON.stringify(cfg, null, 2), "utf8")
}

export function saveMCPServer(name: string, server: MCPServerConfig, path = globalMCPConfigPath()): void {
  if (!NAME_PATTERN.test(name)) throw new Error("Server names may use letters, numbers, dots, dashes and underscores.")
  if (Boolean(server.command) === Boolean(server.url)) throw new Error("Set either a command or a URL for the server.")
  if (server.url && !/^https?:\/\//.test(server.url)) throw new Error("Server URLs must start with http:// or https://.")
  const cfg = readGlobal(path)
  cfg.mcpServers[name] = server
  writeGlobal(path, cfg)
}

export function removeMCPServer(name: string, path = globalMCPConfigPath()): boolean {
  const cfg = readGlobal(path)
  if (!(name in cfg.mcpServers)) return false
  delete cfg.mcpServers[name]
  writeGlobal(path, cfg)
  return true
}

export function setMCPServerEnabled(name: string, enabled: boolean, path = globalMCPConfigPath()): void {
  const cfg = readGlobal(path)
  const server = cfg.mcpServers[name]
  if (!server) throw new Error(`MCP server "${name}" is not in your global configuration.`)
  cfg.mcpServers[name] = { ...server, enabled }
  writeGlobal(path, cfg)
}
