import { join } from "path"
import { homedir } from "os"
import { existsSync, mkdirSync, writeFileSync } from "fs"
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
      const raw = require("fs").readFileSync(p, "utf8") as string
      const cfg = JSON.parse(raw) as Partial<MCPConfig>
      if (cfg.mcpServers) {
        Object.assign(merged.mcpServers, cfg.mcpServers)
      }
    } catch { /* dosya yoksa atla */ }
  }

  return merged
}

/**
 * İlk çalıştırmada default MCP server'ları aktifleştir.
 * Eğer mcp.json yoksa, default server'larla oluşturur.
 * @returns true eğer yeni oluşturulduysa (kullanıcıya gösterilecek mesaj için)
 */
export function ensureDefaultMCPServers(workdir: string): boolean {
  const globalPath = join(homedir(), ".aurict", "mcp.json")
  const projectPath = join(workdir, ".aurict", "mcp.json")

  // Eğer herhangi bir mcp.json varsa, müdahale etme
  if (existsSync(globalPath) || existsSync(projectPath)) {
    return false
  }

  // Global config oluştur
  try {
    const globalDir = join(homedir(), ".aurict")
    if (!existsSync(globalDir)) {
      mkdirSync(globalDir, { recursive: true })
    }

    const defaultConfig: MCPConfig = {
      mcpServers: { ...DEFAULT_MCP_SERVERS },
    }

    writeFileSync(globalPath, JSON.stringify(defaultConfig, null, 2), "utf8")
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
