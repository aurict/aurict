export interface PickerItem {
  id:    string
  label: string
  hint?: string
}

export type CommandResult =
  | { type: "text";   content: string; color?: string }
  | { type: "error";  message: string }
  | { type: "picker"; title: string; items: PickerItem[]; onSelect: (item: PickerItem) => void }
  | { type: "prompt"; title: string; placeholder?: string; secret?: boolean; onSubmit: (value: string) => void }
  | { type: "clear" }
  | { type: "exit" }

export interface CommandDef {
  name:        string
  aliases?:    string[]
  description: string
  usage?:      string
  handler:     (args: string[], ctx: CommandContext) => CommandResult | Promise<CommandResult>
}

export interface CommandContext {
  sessionId:        string
  provider:         string
  model:            string
  effort?:          number
  workdir:          string
  skills:           string[]
  currentTheme:     string
  isUndercover:     boolean
  coordinatorMode:  boolean
  activeAgent:      string
  setAgent:         (id: string) => void
  setProvider:      (p: string, m: string) => void
  setModel:         (m: string) => void
  setEffort:        (effort: number | undefined) => void
  setTheme:         (name: string) => void
  setWorkdir:       (path: string) => void
  openBtw:          (question: string) => void
  toggleUndercover:  () => void
  toggleCoordinator: () => void
  autopilotMode:     boolean
  toggleAutopilot:   () => void
  sendToBackground:  () => void
  bgTasks:           Array<{ id: string; prompt: string; startedAt: number; status: string; output?: string }>
  showBgTask:        (id: string) => void
  showPicker:        (title: string, items: PickerItem[], onSelect: (item: PickerItem) => void) => void
  showPrompt:        (title: string, placeholder: string, secret: boolean, onSubmit: (value: string) => void) => void
  restoreSession:    (msgs: Array<{ role: "user" | "assistant"; content: string }>) => void
  messages:          Array<{ role: string; content: string; tool?: string; pending?: boolean; resultContent?: string; timestamp?: number }>
  checkpoints:       Array<{ mark: number; messages: unknown[]; history: unknown[]; label: string }>
  popCheckpoints:    (n: number) => void
  branches:          Array<{ id: string; name: string; createdAt: number; messageCount: number }>
  activeBranchIdx:   number
  createBranch:      (name?: string) => void
  switchBranch:      (idx: number) => void
  deleteBranch:      (name: string) => void
  watchedPaths:      Array<{ path: string; prompt?: string }>
  addWatch:          (path: string, prompt?: string) => void
  removeWatch:       (path?: string) => void
  contextWindow:     number
  replayTo:          (idx: number) => void
  tokens?:           { input: number; output: number; cacheRead?: number; cacheWrite?: number; reasoning?: number }
  promptDiagnostics?: {
    totalChars: number
    totalTokens: number
    totalBudgetTokens?: number | undefined
    overBudgetTokens?: number | undefined
    warnings?: Array<{ scope: string; name: string; tokens: number; budgetTokens: number; overBudgetTokens: number }> | undefined
    sections: Array<{ name: string; cache: string; chars: number; tokens: number; budgetTokens?: number | undefined; overBudgetTokens?: number | undefined }>
    byCache: Record<string, { chars: number; tokens: number; sections: number }>
  } | undefined
  promptCacheHealth?: {
    kind: string
    snapshot: { sectionCount: number; toolCount: number; cacheableHash: string; dynamicHash: string; toolHash: string }
  } | undefined
  openDesign:        (brief?: string) => void
}
