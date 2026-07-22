export type ToolCapability =
  | "inspect"
  | "change"
  | "execute"
  | "verify"
  | "research"
  | "coordinate"
  | "memory"
  | "document"
  | "source_control"
  | "security"
  | "finance"
  | "data"

export interface ToolSelection {
  selectedToolIds: string[]
  capabilities: ToolCapability[]
  omittedCount: number
  reason: string
}

export interface ToolSelectionInput {
  text: string
  objective?: string
  requestedCapabilities?: string[]
  availableToolIds: string[]
  allowedToolIds?: string[]
  maxVisible?: number
  profile?: "interactive-main" | "desktop-sidecar" | "headless" | "subagent"
}

const CORE_TOOLS = [
  "read", "read_tool_output", "glob", "grep", "file_stat", "symbols", "code_map",
  "edit", "write", "apply_patch", "bash", "verify", "question",
  "todo", "task_create", "task_update", "task_complete", "load_skill", "request_tools",
]

const ROUTING_ESSENTIALS = ["read", "grep", "request_tools"]

const PACKS: Record<ToolCapability, string[]> = {
  inspect: ["read", "read_image", "read_tool_output", "glob", "grep", "file_stat", "symbols", "code_map", "semantic_search", "lsp", "dep_docs", "git_context", "diff_view", "ui_inspect"],
  change: ["edit", "write", "apply_patch", "ast_edit", "notebook_edit", "undo", "atomic_patch_and_test", "patch_test", "checkpoint"],
  execute: ["bash", "eval", "process_monitor", "inspect_live_process", "env_inspect"],
  verify: ["verify", "critique", "patch_test", "blast_radius", "lsp", "browser"],
  research: ["websearch", "webfetch", "http_request", "legal_search", "market_data"],
  coordinate: ["orchestrate", "subagent", "send_message", "todo", "task_create", "task_update", "task_complete", "plan_enter", "plan_verify", "worktree"],
  memory: ["memory", "scratchpad", "load_skill"],
  document: ["document_extract", "render_pdf", "pptx", "chart", "mermaid"],
  source_control: ["git", "git_context", "diff_view", "svn", "perforce", "worktree"],
  security: ["security_recon", "security_scan", "security_report", "security_verify", "security_attack_graph", "security_log_analyze", "security_threat_model", "track_variable_taint", "jwt_decode"],
  finance: ["finance_calculate", "market_data"],
  data: ["jq", "structured_data", "regex_test", "chart"],
}

const INTENTS: Array<{ capability: ToolCapability; pattern: RegExp }> = [
  { capability: "security", pattern: /\b(security|vulnerab|threat|attack|cve|secret|taint|g[üu]venlik|zafiyet)\b/i },
  { capability: "finance", pattern: /\b(finance|financial|npv|irr|bond|yield|cash.?flow|market|finans|tahvil)\b/i },
  { capability: "document", pattern: /\b(pdf|pptx|presentation|document|diagram|chart|mermaid|sunum|belge)\b/i },
  { capability: "research", pattern: /\b(web|internet|research|search online|latest|current|ara[sş]tır|g[üu]ncel|hukuk)\b/i },
  { capability: "coordinate", pattern: /\b(parallel|delegate|subagent|orchestrat|coordinate|plan|faz|phase|paralel|delege)\b/i },
  { capability: "source_control", pattern: /\b(git|commit|branch|diff|merge|rebase|svn|perforce|sürüm)\b/i },
  { capability: "data", pattern: /\b(json|csv|xml|yaml|regex|dataset|structured data|veri)\b/i },
  { capability: "verify", pattern: /\b(tests?|verify|lint|typecheck|build|check|doğrula|derle)\b/i },
  { capability: "execute", pattern: /\b(run|command|terminal|process|server|execute|çalıştır|komut)\b/i },
  { capability: "change", pattern: /\b(fix|change|edit|write|implement|refactor|add|remove|d[üu]zelt|değiştir|ekle|sil|tamamla)\b/i },
]

export function selectTools(input: ToolSelectionInput): ToolSelection {
  const available = new Set(input.availableToolIds)
  const allowed = input.allowedToolIds ? new Set(input.allowedToolIds) : available
  const candidates = new Set<string>()
  const capabilities = new Set<ToolCapability>(["inspect", "memory"])
  const routingText = `${input.objective ?? ""}\n${input.text}`
  for (const intent of INTENTS) {
    if (intent.pattern.test(routingText)) capabilities.add(intent.capability)
  }
  for (const capability of input.requestedCapabilities ?? []) {
    if (isToolCapability(capability)) capabilities.add(capability)
  }
  if (capabilities.size === 2) {
    capabilities.add("change")
    capabilities.add("execute")
    capabilities.add("verify")
  }

  for (const id of CORE_TOOLS) candidates.add(id)
  for (const capability of capabilities) {
    for (const id of PACKS[capability]) candidates.add(id)
  }

  const permitted = (id: string) => available.has(id) && allowed.has(id)
  const intentCapabilities = [...capabilities].filter(capability => capability !== "inspect" && capability !== "memory")
  const priorityCapabilities = [...intentCapabilities, "inspect", "memory"] as ToolCapability[]
  const priority: string[] = []
  const addPriority = (id: string) => { if (!priority.includes(id)) priority.push(id) }
  for (const id of ROUTING_ESSENTIALS) addPriority(id)
  // Give every active intent one useful action before filling any large pack.
  for (const capability of intentCapabilities) {
    const lead = PACKS[capability].find(id => permitted(id))
    if (lead) addPriority(lead)
  }
  for (const capability of priorityCapabilities) for (const id of PACKS[capability]) addPriority(id)
  for (const id of CORE_TOOLS) addPriority(id)
  const ordered = priority.filter(id => candidates.has(id) && permitted(id))
  for (const id of input.availableToolIds) if (candidates.has(id) && permitted(id) && !ordered.includes(id)) ordered.push(id)
  const extras = input.availableToolIds.filter(id => permitted(id) && isExternalTool(id))
  for (const id of extras) if (!ordered.includes(id)) ordered.push(id)

  const limit = Math.max(8, input.maxVisible ?? 32)
  const selectedToolIds = ordered.slice(0, limit)
  return {
    selectedToolIds,
    capabilities: [...capabilities],
    omittedCount: Math.max(0, input.availableToolIds.filter(permitted).length - selectedToolIds.length),
    reason: `intent capabilities: ${[...capabilities].join(", ")}`,
  }
}

function isToolCapability(value: string): value is ToolCapability {
  return value in PACKS
}

function isExternalTool(id: string): boolean {
  return id.includes(":") || id.startsWith("mcp_") || id.startsWith("custom_")
}
