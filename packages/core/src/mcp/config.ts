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
