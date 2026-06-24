<claude-mem-context>
# Memory Context

# [Aurict] recent context, 2026-06-23 9:37pm CDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 2 obs (911t read) | 63,342t work | 99% savings

### Jun 23, 2026
1766 1:05p ⚖️ Aurict Project — UI Cloned from Desktop/openclaude Reference
1767 " 🔵 openclaude vs Aurict — Project Structure Comparison Mapped

Access 63k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

<!-- codegraph-aurict -->
## CodeGraph — Semantic Code Intelligence

This project has a CodeGraph index. Use `codegraph_explore` (via MCP) to answer
structural questions, trace call paths, and find symbol definitions instead of
using grep/read loops. One `codegraph_explore` call returns verbatim source,
call graphs, and blast-radius — no file reads needed.

If the MCP tool is unavailable, fall back to: `codegraph explore "<query>"` in Bash.
<!-- codegraph-aurict -->
