export type AgentType =
  | "coordinator" // orchestrator: subagent spawn + send_message — tool call yok
  | "explore"     // read-only: dosya keşfi, kod arama, web araştırması
  | "code"        // full: yazma, düzenleme, bash, lsp
  | "review"      // read-only: kod inceleme, analiz, diagnostics
  | "test"        // read + bash: test çalıştırma, coverage
  | "docs"        // read + write: dokümantasyon üretme
  | "performance" // read + bash: profiling, bundle analizi
  | "analytics"   // read-only: metrik, event, log analizi
  | "security"    // read + bash + web: güvenlik taraması, CVE araştırması, aktif scanning
  | "pentest"     // full offensive: aktif sızma testi, exploit doğrulama
  | "adviser"     // read + web: stratejik güvenlik danışmanlığı — aktif eylem yok
  | "reporter"    // read + write: güvenlik bulgu raporu üretimi
  | "debug"       // read + bash + lsp: hata ayıklama
  | "refactor"    // read + write + edit + lsp: temiz kod dönüşümü (bash yok — güvenli)
  | "devops"      // full: CI/CD, Docker, infra-as-code
  | "design"      // read + write: UI/UX artifact üretimi
  | "data"        // read + write + bash: veri dönüşümü, SQL, analiz
  | "critic"      // read-only: kod/plan/mimari eleştirisi — yazma erişimi yok

// Per-type MAX_STEPS — uzun görevler kırpılmaz, kısa görevler boşa tur atmaz
export const AGENT_MAX_STEPS: Record<AgentType, number> = {
  coordinator: 10,   // sadece dispatch — LLM çağrısı az
  explore:     20,
  code:        50,
  review:      25,
  test:        30,
  docs:        25,
  performance: 30,
  analytics:   25,
  security:    35,
  pentest:     50,   // aktif tarama + exploit doğrulama — uzun olabilir
  adviser:     15,   // strateji planı — kısa ve odaklı
  reporter:    20,   // bulguları okur ve rapor yazar
  debug:       40,
  refactor:    35,
  devops:      40,
  design:      20,
  data:        35,
  critic:       8,   // kısa ve odaklı — sadece okur ve raporlar
}

// Her agent tipinin erişebileceği tool'lar (ToolRegistry ID'leriyle eşleşmeli)
// "write" tüm tiplerde var — findings dosyasını workspace'e yazabilmeli
// "send_message" tüm tiplerde var — sibling agent'lara mesaj yollamak için
export const AGENT_TYPE_TOOLS: Record<AgentType, string[]> = {
  coordinator: ["subagent", "send_message", "scratchpad", "critique"],
  explore:     ["read", "write", "glob", "grep", "webfetch", "websearch", "symbols", "code_map", "scratchpad", "send_message", "env_inspect", "diff_view", "file_stat"],
  code:        ["read", "write", "edit", "apply_patch", "glob", "grep", "bash", "lsp", "undo", "symbols", "code_map", "verify", "scratchpad", "critique", "send_message", "env_inspect", "checkpoint", "diff_view", "file_stat", "process_monitor", "patch_test"],
  review:      ["read", "write", "glob", "grep", "lsp", "symbols", "code_map", "verify", "send_message", "diff_view", "file_stat"],
  test:        ["read", "write", "glob", "grep", "bash", "symbols", "verify", "send_message", "file_stat"],
  docs:        ["read", "write", "edit", "glob", "grep", "symbols", "code_map", "send_message", "file_stat"],
  performance: ["read", "write", "glob", "grep", "bash", "symbols", "code_map", "send_message", "process_monitor", "file_stat"],
  analytics:   ["read", "write", "glob", "grep", "webfetch", "symbols", "send_message", "file_stat"],
  security:    ["read", "write", "glob", "grep", "bash", "lsp", "webfetch", "websearch", "symbols", "code_map", "scratchpad", "track_variable_taint", "send_message", "file_stat"],
  pentest:     ["read", "write", "glob", "grep", "bash", "webfetch", "websearch", "scratchpad", "track_variable_taint", "atomic_patch_and_test", "inspect_live_process", "send_message", "file_stat"],
  adviser:     ["read", "glob", "grep", "webfetch", "websearch", "track_variable_taint", "send_message", "file_stat"],
  reporter:    ["read", "write", "glob", "grep", "send_message", "file_stat"],
  debug:       ["read", "write", "glob", "grep", "bash", "lsp", "symbols", "verify", "scratchpad", "send_message", "env_inspect", "checkpoint", "process_monitor", "file_stat"],
  refactor:    ["read", "write", "edit", "apply_patch", "glob", "grep", "lsp", "symbols", "code_map", "verify", "send_message", "checkpoint", "diff_view", "file_stat", "patch_test"],
  devops:      ["read", "write", "edit", "apply_patch", "bash", "glob", "grep", "webfetch", "send_message", "env_inspect", "checkpoint", "diff_view", "file_stat", "process_monitor", "patch_test"],
  design:      ["read", "write", "glob", "grep", "webfetch", "send_message", "file_stat"],
  data:        ["read", "write", "bash", "glob", "grep", "symbols", "send_message", "file_stat"],
  critic:      ["read", "glob", "grep", "lsp", "symbols", "code_map", "diff_view", "file_stat"],
}

// Parent → Worker (request)
export interface WorkerRequest {
  id:            string       // agent instance ID
  agentName:     string       // human-readable role name (routing için)
  agentType:     AgentType
  prompt:        string
  provider:      string
  model:         string
  workdir:       string
  allowedTools:  string[]    // AGENT_TYPE_TOOLS[type] veya config'den
  sessionId:     string      // worker'ın kendi session ID'si
  workspacePath: string      // shared workspace dizini (multi-agent iletişim)
  envVars?:      Record<string, string>  // API keys from parent process
  parentContext?: string     // son N parent mesajının özeti — subagent'a bağlam sağlar
}

// Parent → Worker (control)
export type WorkerControl =
  | { type: "abort" }
  | { type: "inbox_message"; from: string; fromName: string; message: string }

// Worker → Parent
export type WorkerMessage =
  | { type: "text";         delta: string }
  | { type: "tool_call";    id: string; tool: string; args: unknown }
  | { type: "tool_result";  id: string; result: string }
  | { type: "done";         result: string; tokens: { input: number; output: number } }
  | { type: "error";        message: string }
  | { type: "heartbeat" }
  | { type: "send_message"; to: string; message: string; from: string; fromName: string }
