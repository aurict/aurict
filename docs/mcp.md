# MCP (Model Context Protocol)

Aurict supports MCP servers using the same `claude_desktop_config.json`-compatible format.

## Default MCP Servers

On first run, Aurict automatically enables these MCP servers:

| Server | Description | Command |
|--------|-------------|---------|
| **filesystem** | File operations — read, write, search, directory management | `npx -y @modelcontextprotocol/server-filesystem` |
| **git** | Git operations — status, diff, commit, branch, log | `uvx mcp-server-git` |
| **fetch** | Web content fetching — HTTP requests, HTML to markdown | `uvx mcp-server-fetch` |

These servers are configured in `~/.aurict/mcp.json` and start automatically. You can manage them with `/mcp` commands.

---

## Adding an MCP server

```bash
aurict /mcp add
```

This opens an interactive prompt for:
- Server name
- Command (e.g. `npx @modelcontextprotocol/server-filesystem`)
- Arguments
- Environment variables

Or add directly via config:

```bash
aurict /mcp add --name filesystem \
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
aurict /mcp list

# View tools from a specific server
aurict /mcp tools filesystem

# View resources from a server
aurict /mcp resources filesystem

# Remove a server
aurict /mcp remove filesystem

# Restart a server
aurict /mcp restart filesystem
```

---

## How MCP tools work

When Aurict starts, it connects to all configured MCP servers and registers their tools in the tool registry. MCP tools appear alongside built-in tools and are subject to the same permission system.

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
aurict /mcp resources github

# Inject a resource into the current session
aurict /mcp attach github://repos/aurict/aurict/issues
```
