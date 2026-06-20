export interface RecipeStep {
  /** Agent'a gönderilecek mesaj */
  prompt?: string
  /** Doğrudan çalıştırılacak shell komutu */
  bash?: string
  /**
   * Subagent tipi — belirtilirse bu adım agentPool üzerinden ayrı bir worker olarak çalışır.
   * prompt ile birlikte kullanılır: `{ agent: "security", prompt: "Scan for vulns" }`
   */
  agent?: string
  /** Bu adımlar aynı anda paralel çalışır — tümü bitince sonraki adıma geçilir */
  parallel?: RecipeStep[]
  /** Bu adımın başlığı (terminal çıktısında gösterilir) */
  name?: string
}

export interface RecipeDef {
  name:        string
  description?: string
  /** Override provider for all prompt steps */
  provider?:   string
  /** Override model for all prompt steps */
  model?:      string
  /** System prompt override */
  system?:     string
  steps:       RecipeStep[]
}

export interface RecipeRunOptions {
  /** Dosya yolu veya parse edilmiş RecipeDef */
  recipe:      RecipeDef
  workdir:     string
  provider?:   string
  model?:      string
  /** Agent adımları için parent session ID (workspace paylaşımı için) */
  sessionId?:  string
  /** Her prompt adımı tamamlandığında */
  onStepStart?:  (index: number, step: RecipeStep) => void
  onStepFinish?: (index: number, step: RecipeStep, output: string) => void
  onText?:       (text: string) => void
}

export interface RecipeRunResult {
  steps:   Array<{ index: number; name: string; output: string; error?: string }>
  success: boolean
}
