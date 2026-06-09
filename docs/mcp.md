# MCP (Model Context Protocol)

OmniCod supports MCP servers using the same `claude_desktop_config.json`-compatible format.

## Adding an MCP server

```bash
omnicod /mcp add
```

This opens an interactive prompt for:
- Server name
- Command (e.g. `npx @modelcontextprotocol/server-filesystem`)
- Arguments
- Environment variables

Or add directly via config:

```bash
omnicod /mcp add --name filesystem \
  --command npx \
  --args "@modelcontextprotocol/server-filesystem,/path/to/dir"
```

---

## Configuration format

MCP servers are stored in the SQLite database. You can also provide a JSON config:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects"],
      "env": {}
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
      "env": {}
    }
  }
}
```

---

## Managing servers

```bash
# List configured servers
omnicod /mcp list

# View tools from a specific server
omnicod /mcp tools filesystem

# View resources from a server
omnicod /mcp resources filesystem

# Remove a server
omnicod /mcp remove filesystem

# Restart a server
omnicod /mcp restart filesystem
```

---

## How MCP tools work

When OmniCod starts, it connects to all configured MCP servers and registers their tools in the tool registry. MCP tools appear alongside built-in tools and are subject to the same permission system.

MCP tool IDs are prefixed with the server name to avoid collisions:

```
filesystem__read_file
filesystem__write_file
github__create_issue
postgres__query
```

---

## Popular MCP servers

| Server | Install | What it provides |
|--------|---------|-----------------|
| `@modelcontextprotocol/server-filesystem` | `npx` | Read/write local files with directory scoping |
| `@modelcontextprotocol/server-github` | `npx` | GitHub API — issues, PRs, repos |
| `@modelcontextprotocol/server-postgres` | `npx` | PostgreSQL query and schema access |
| `@modelcontextprotocol/server-slack` | `npx` | Slack channels and messages |
| `@modelcontextprotocol/server-brave-search` | `npx` | Brave web search |
| `@modelcontextprotocol/server-puppeteer` | `npx` | Browser automation |

---

## MCP resources

MCP servers can expose resources (read-only data sources) in addition to tools. Resources are available for injection into context:

```bash
# List resources from a server
omnicod /mcp resources github

# Inject a resource into the current session
omnicod /mcp attach github://repos/omnicod/omnicod/issues
```
