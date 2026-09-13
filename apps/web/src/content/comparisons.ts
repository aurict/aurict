export type ComparisonRow = {
  name: string
  aurict: string
  competitor: string
}

export type ComparisonSource = {
  label: string
  url: string
}

export type Comparison = {
  slug: string
  competitor: string
  title: string
  description: string
  tagline: string
  differentiator: string
  updatedAt: string
  ourStrengths: string[]
  theirStrengths: string[]
  rows: ComparisonRow[]
  sources: ComparisonSource[]
}

const reviewedAt = "2026-07-22"

export const COMPARISONS: Comparison[] = [
  {
    slug: "claude-code",
    competitor: "Claude Code",
    title: "Aurict vs Claude Code",
    description: "Compare Aurict and Claude Code across providers, permissions, MCP, agent workflows, and verification to choose the right terminal coding agent.",
    tagline: "Provider breadth and proof-oriented delivery",
    differentiator: "Provider choice + durable evidence",
    updatedAt: reviewedAt,
    ourStrengths: ["12 built-in provider adapters", "Bounded Project Auto for project-local file mutations", "Durable completion proof with verification evidence and open work", "Local semantic search, dependency docs, image reading, and verification tools"],
    theirStrengths: ["Official Anthropic workflow", "Anthropic Console, Claude subscription, Bedrock, and Vertex authentication paths"],
    rows: [
      { name: "Terminal workflow", aurict: "Native terminal runtime", competitor: "Official terminal coding workflow" },
      { name: "Provider configuration", aurict: "12 built-in adapters", competitor: "Anthropic API, Bedrock, or Vertex" },
      { name: "MCP", aurict: "Compatible config import and /mcp inspection", competitor: "MCP-oriented integration" },
      { name: "Completion record", aurict: "Durable /proof record", competitor: "Review the current Claude Code documentation" },
    ],
    sources: [{ label: "Claude Code setup", url: "https://docs.anthropic.com/en/docs/claude-code/getting-started" }],
  },
  {
    slug: "cursor",
    competitor: "Cursor",
    title: "Aurict vs Cursor",
    description: "Compare Aurict and Cursor across terminal and IDE workflows, model choice, MCP, automation controls, and evidence-backed completion.",
    tagline: "Terminal-first runtime and IDE workflow",
    differentiator: "Scoped automation + terminal control",
    updatedAt: reviewedAt,
    ourStrengths: ["Terminal-first work without an IDE dependency", "Project Auto stays bounded to one project session", "Completion proof keeps evidence and open work visible", "Local toolchain for semantic search, dependency docs, vision, and verification"],
    theirStrengths: ["Visual editor experience", "Inline suggestions and visual diff workflow", "Curated model selection and configurable MCP servers"],
    rows: [
      { name: "Primary surface", aurict: "Terminal runtime", competitor: "IDE plus CLI" },
      { name: "Model selection", aurict: "12 built-in provider adapters", competitor: "Curated models and supported BYOK providers" },
      { name: "MCP", aurict: "Imported config inspected in /mcp", competitor: "mcp.json and MCP directory" },
      { name: "Automation control", aurict: "Bounded Project Auto + direct-approval exceptions", competitor: "Agent auto-run and guardrails" },
    ],
    sources: [{ label: "Cursor models", url: "https://docs.cursor.com/models/" }, { label: "Cursor MCP", url: "https://docs.cursor.com/context/model-context-protocol" }],
  },
  {
    slug: "aider",
    competitor: "Aider",
    title: "Aurict vs Aider",
    description: "Compare Aurict and Aider across terminal workflows, model choice, permissions, Git integration, workspace intelligence, and verification.",
    tagline: "Git-focused pairing and evidence-backed runtime",
    differentiator: "Scoped permissioning + verification record",
    updatedAt: reviewedAt,
    ourStrengths: ["Project Auto only covers bounded project-local edits", "Durable /proof completion records", "Semantic source search and installed dependency documentation", "Browser and eval tools for verification"],
    theirStrengths: ["Focused Git-centered pairing workflow", "Broad LLM and local-model connectivity"],
    rows: [
      { name: "Runtime", aurict: "Terminal agent runtime", competitor: "Terminal pair-programming workflow" },
      { name: "Model connectivity", aurict: "12 built-in provider adapters", competitor: "Many API providers and local OpenAI-compatible models" },
      { name: "Edit approval", aurict: "Bounded Project Auto plus direct-approval exceptions", competitor: "Review Aider's current model and edit settings" },
      { name: "Completion record", aurict: "Durable /proof record", competitor: "Review Aider's current workflow documentation" },
    ],
    sources: [{ label: "Aider model connectivity", url: "https://aider.chat/docs/llms.html" }, { label: "Aider model and key settings", url: "https://aider.chat/docs/troubleshooting/models-and-keys.html" }],
  },
  {
    slug: "github-copilot",
    competitor: "GitHub Copilot",
    title: "Aurict vs GitHub Copilot CLI",
    description: "Compare Aurict and GitHub Copilot CLI across model choice, permissions, MCP, automation scope, ecosystem integration, and verification.",
    tagline: "Explicit scoped automation and local proof",
    differentiator: "Project Auto + completion proof",
    updatedAt: reviewedAt,
    ourStrengths: ["12 built-in provider adapters", "Project-local automatic approval for bounded edits only", "Completion proof with changes, evidence, open work, and waivers", "Local workspace intelligence tools"],
    theirStrengths: ["GitHub ecosystem integration", "Copilot CLI model selection, MCP, plugins, and custom agents"],
    rows: [
      { name: "Terminal agent", aurict: "Aurict CLI", competitor: "GitHub Copilot CLI" },
      { name: "Provider configuration", aurict: "12 built-in adapters", competitor: "GitHub-hosted models and documented BYOK paths" },
      { name: "MCP", aurict: "Imported compatible config and /mcp inspection", competitor: "Built-in and configurable MCP servers" },
      { name: "Permission scope", aurict: "Project Auto with direct-approval exceptions", competitor: "Tool and path permission controls" },
    ],
    sources: [{ label: "GitHub Copilot CLI reference", url: "https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference" }, { label: "GitHub Copilot CLI BYOK", url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-byok-models" }],
  },
  {
    slug: "opencode",
    competitor: "OpenCode",
    title: "Aurict vs OpenCode",
    description: "Compare Aurict and OpenCode across providers, permissions, MCP, project automation, workspace intelligence, and verification evidence.",
    tagline: "Curated runtime controls and proof-oriented delivery",
    differentiator: "Scoped project automation + completion proof",
    updatedAt: reviewedAt,
    ourStrengths: ["12 built-in provider adapters", "Bounded Project Auto for safe typed file changes", "Durable completion proof and verification evidence", "Semantic search, dependency docs, vision, browser, and eval tools"],
    theirStrengths: ["Large provider ecosystem", "Per-tool allow, deny, and ask permissions", "Built-in LSP and extensible MCP tooling"],
    rows: [
      { name: "Provider approach", aurict: "12 built-in adapters", competitor: "75+ provider ecosystem and custom configuration" },
      { name: "Edit permissions", aurict: "Project Auto for bounded typed file changes", competitor: "Per-tool allow, deny, or ask configuration" },
      { name: "Code intelligence", aurict: "Semantic search, dependency docs, and workspace vision", competitor: "Built-in tools and documented LSP operations" },
      { name: "Completion evidence", aurict: "Durable /proof record", competitor: "Review OpenCode's current workflow documentation" },
    ],
    sources: [{ label: "OpenCode providers", url: "https://opencode.ai/docs/providers" }, { label: "OpenCode tools and permissions", url: "https://opencode.ai/docs/tools/" }],
  },
]

export function getComparison(slug: string) {
  return COMPARISONS.find((comparison) => comparison.slug === slug)
}
