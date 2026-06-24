import type { McpServerConfig } from "../config/config.js"

/**
 * Default MCP server yapılandırmaları
 * 
 * Bu server'lar ilk çalıştırmada otomatik olarak aktif edilir.
 * Kullanıcı /mcp komutu ile yönetebilir.
 */

export const DEFAULT_MCP_SERVERS: Record<string, McpServerConfig> = {
  filesystem: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem"],
  },
  git: {
    command: "uvx",
    args: ["mcp-server-git"],
  },
  fetch: {
    command: "uvx",
    args: ["mcp-server-fetch"],
  },
  codegraph: {
    command: "codegraph",
    args: ["serve", "--mcp"],
  },
}

/**
 * Default MCP server açıklamaları (UI için)
 */
export const MCP_SERVER_DESCRIPTIONS: Record<string, string> = {
  filesystem: "File operations — read, write, search, directory management",
  git: "Git operations — status, diff, commit, branch, log",
  fetch: "Web content fetching — HTTP requests, HTML to markdown",
  codegraph: "Semantic code intelligence — symbol graph, call paths, blast radius (github.com/colbymchenry/codegraph)",
}

/**
 * Kullanıcıya gösterilecek ilk aktivasyon mesajı
 */
export function getMcpActivationMessage(servers: Record<string, McpServerConfig>): string {
  const serverList = Object.keys(servers)
    .map((name) => {
      const desc = MCP_SERVER_DESCRIPTIONS[name] ?? "MCP server"
      return `  • ${name} — ${desc}`
    })
    .join("\n")

  return `✓ Default MCP servers enabled:
${serverList}

  ℹ codegraph setup (one-time, per machine):
    1. npx @colbymchenry/codegraph   — install & wire up
    2. codegraph init                — index each project
    GitHub: github.com/colbymchenry/codegraph

Use /mcp to manage MCP servers`
}
