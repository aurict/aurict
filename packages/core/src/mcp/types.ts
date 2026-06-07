export interface MCPServerConfig {
  /** Stdio transport: shell command to run */
  command?:  string
  args?:     string[]
  env?:      Record<string, string>
  /** HTTP/SSE transport: server URL (mutually exclusive with command) */
  url?:      string
  /** Extra HTTP headers (e.g. Authorization: Bearer <token>) */
  headers?:  Record<string, string>
  enabled?:  boolean    // default: true
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>
}

export interface MCPToolInfo {
  server:      string
  name:        string
  description: string
  inputSchema: Record<string, unknown>
}

export interface MCPResourceInfo {
  server:      string
  uri:         string
  name:        string
  description?: string
  mimeType?:   string
}

export interface MCPResourceContent {
  uri:      string
  mimeType?: string
  text?:    string
  blob?:    string
}
